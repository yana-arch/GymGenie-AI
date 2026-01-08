import { expect, beforeEach, vi, describe, it } from 'vitest';
import { PreferenceLearningService } from '../../preference-learning/PreferenceLearningService';
import { HistoryFixture } from './fixtures/HistoryFixture';
import { PreferenceFactory } from './fixtures/PreferenceFactory';
import type { 
  PreferenceLearningConfig,
  PreferenceLearningInput,
  PreferenceType
} from '../../preference-learning/types/preferenceLearning.types';

describe('PreferenceLearningPersona Tests', () => {
  let service: PreferenceLearningService;
  let historyFixture: HistoryFixture;
  let config: PreferenceLearningConfig;

  const mockPrivacyService = {
    encrypt: vi.fn(data => Promise.resolve(JSON.stringify(data))),
    decrypt: vi.fn(data => Promise.resolve(JSON.parse(data))),
    store: vi.fn(() => Promise.resolve()),
    retrieve: vi.fn(() => Promise.resolve(null)),
    delete: vi.fn(() => Promise.resolve()),
    auditTrail: vi.fn(() => Promise.resolve([]))
  };

  const mockTensorFlowService = {
    predictPattern: vi.fn(),
    loadModel: vi.fn(() => Promise.resolve()),
    isModelLoaded: vi.fn(() => true),
    getModelMetadata: vi.fn(() => ({
      version: '1.0.0',
      trainedOn: new Date(),
      accuracy: 0.9,
      inputShape: [10],
      outputShape: [5]
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      learningRate: 0.1,
      confidenceThreshold: 0.7,
      maxContradictions: 3,
      minSessions: 5,
      gradualAdaptationRate: 0.05,
      privacySettings: {
        localOnly: true,
        encryptionEnabled: true,
        retentionDays: 90
      }
    };

    service = new PreferenceLearningService({
      privacyService: mockPrivacyService as any,
      tensorFlowService: mockTensorFlowService as any,
      config
    });

    historyFixture = new HistoryFixture('test-user-123');
  });

  describe('SC-2.1.1: Exercise frequency preference storage', () => {
    it('should identify and store top exercises for a "consistent" persona', async () => {
      const history = historyFixture.generateHistory(10, 'consistent');
      const latestSession = history[history.length - 1];
      
      // Mock TF to predict high confidence for consistent exercises
      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'exercise-selection') {
          return Promise.resolve({
            type: 'exercise-selection' as PreferenceType,
            confidence: 0.9,
            preferences: [
              { exerciseId: 'bench-press', preference: 'preferred', confidence: 0.95 },
              { exerciseId: 'squat', preference: 'preferred', confidence: 0.95 }
            ]
          });
        }
        return Promise.resolve({ confidence: 0 }); // No intensity pattern
      });

      const input: PreferenceLearningInput = {
        session: latestSession,
        existingPatterns: [],
        userContext: { sessionPhase: 'main', recentPerformance: 0.9 }
      };

      const result = await service.detectPreferences(input);

      expect(result.detectedPatterns).toHaveLength(1);
      const pattern = result.detectedPatterns[0];
      expect(pattern.patternType).toBe('exercise-selection');
      expect(pattern.data.exercisePreferences).toContainEqual(
        expect.objectContaining({ exerciseId: 'bench-press', preference: 'preferred' })
      );
      
      expect(mockPrivacyService.store).toHaveBeenCalled();
    });
  });

  describe('SC-2.1.2: Intensity level preference storage', () => {
    it('should adapt to a "warrior" persona with high intensity preference', async () => {
      const history = historyFixture.generateHistory(10, 'warrior');
      const latestSession = history[history.length - 1];
      
      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'intensity-level') {
          return Promise.resolve({
            type: 'intensity-level' as PreferenceType,
            confidence: 0.85,
            intensityRange: { min: 0.8, max: 0.95 },
            preference: 'extreme'
          });
        }
        return Promise.resolve({ confidence: 0 });
      });

      const input: PreferenceLearningInput = {
        session: latestSession,
        existingPatterns: [],
        userContext: { sessionPhase: 'main', recentPerformance: 0.95 }
      };

      const result = await service.detectPreferences(input);

      expect(result.detectedPatterns).toHaveLength(1);
      const pattern = result.detectedPatterns[0];
      expect(pattern.patternType).toBe('intensity-level');
      expect(pattern.data.intensityPreferences![0].preference).toBe('extreme');
    });
  });

  describe('SC-2.1.3: Outlier exclusion in learning', () => {
    it('should not let one-off noisy sessions skew strong patterns', async () => {
      const existingPattern = PreferenceFactory.createPersonaPattern('consistent');
      const noisyHistory = historyFixture.generateHistory(1, 'experimentalist');
      const noisySession = historyFixture.injectNoise(noisyHistory, 1.0)[0];

      // Mock TF to indicate contradiction for the noisy session
      // For exercise-selection, if we return different preferences, it should trigger contradiction
      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'exercise-selection') {
          return Promise.resolve({
            type: 'exercise-selection' as PreferenceType,
            confidence: 0.8,
            preferences: [
              { exerciseId: 'bench-press', preference: 'avoided', confidence: 0.9 } // Contradicts 'preferred'
            ]
          });
        }
        return Promise.resolve({ confidence: 0 });
      });

      const input: PreferenceLearningInput = {
        session: noisySession,
        existingPatterns: [existingPattern],
        userContext: { sessionPhase: 'main', recentPerformance: 0.2 }
      };

      const result = await service.detectPreferences(input);

      // The pattern should be updated with a contradiction, but not yet invalidated (maxContradictions=3)
      expect(result.updatedPatterns).toHaveLength(1);
      expect(result.updatedPatterns[0].contradictions).toBe(1);
      expect(result.invalidatedPatterns).toHaveLength(0);
    });
  });

  describe('SC-2.3.1 & SC-2.3.2: Feedback learning', () => {
    it('should increase weight for positive feedback', async () => {
      const existingPattern = PreferenceFactory.createPersonaPattern('consistent');
      const initialConfidence = existingPattern.confidence;
      const latestSession = historyFixture.generateSession({
        exercises: [
          historyFixture.generateExercise({ 
            exerciseId: 'bench-press', 
            userFeedback: { difficulty: 3, satisfaction: 5, energy: 5 } 
          })
        ]
      });

      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'exercise-selection') {
          return Promise.resolve({
            type: 'exercise-selection' as PreferenceType,
            confidence: 0.95,
            preferences: [
              { exerciseId: 'bench-press', preference: 'preferred', confidence: 0.99 }
            ]
          });
        }
        return Promise.resolve({ confidence: 0 });
      });

      const input: PreferenceLearningInput = {
        session: latestSession,
        existingPatterns: [existingPattern],
        userContext: { sessionPhase: 'main', recentPerformance: 1.0 }
      };

      const result = await service.detectPreferences(input);

      expect(result.updatedPatterns).toHaveLength(1);
      expect(result.updatedPatterns[0].confidence).toBeGreaterThan(initialConfidence);
    });

    it('should decrease weight or exclude for negative feedback', async () => {
      const existingPattern = PreferenceFactory.createPersonaPattern('consistent');
      const latestSession = historyFixture.generateSession({
        exercises: [
          historyFixture.generateExercise({ 
            exerciseId: 'bench-press', 
            userFeedback: { difficulty: 5, satisfaction: 1, energy: 1 } 
          })
        ]
      });

      // Mock TF to indicate contradiction/avoidance
      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'exercise-selection') {
          return Promise.resolve({
            type: 'exercise-selection' as PreferenceType,
            confidence: 0.9,
            preferences: [
              { exerciseId: 'bench-press', preference: 'avoided', confidence: 0.95 }
            ]
          });
        }
        return Promise.resolve({ confidence: 0 });
      });

      const input: PreferenceLearningInput = {
        session: latestSession,
        existingPatterns: [existingPattern],
        userContext: { sessionPhase: 'main', recentPerformance: 0.4 }
      };

      const result = await service.detectPreferences(input);

      // In the service, a contradiction increments the contradiction count
      expect(result.updatedPatterns[0].contradictions).toBe(1);
    });
  });

  describe('SC-2.2.2: Adaptation correlation insights', () => {
    it('should generate recommendations tied to learned preferences', async () => {
      const history = historyFixture.generateHistory(10, 'warrior');
      const latestSession = history[history.length - 1];
      
      const existingPattern = PreferenceFactory.createPattern({
        patternType: 'intensity-level',
        strength: 0.9, // High strength
        confidence: 0.9
      });

      mockTensorFlowService.predictPattern.mockImplementation(({ type }) => {
        if (type === 'intensity-level') {
          return Promise.resolve({
            type: 'intensity-level' as PreferenceType,
            confidence: 1.0,
            intensityRange: { min: 0.8, max: 1.0 },
            preference: 'extreme'
          });
        }
        return Promise.resolve({ confidence: 0 });
      });

      const input: PreferenceLearningInput = {
        session: latestSession,
        existingPatterns: [existingPattern],
        userContext: { sessionPhase: 'main', recentPerformance: 0.9 }
      };

      // Ensure gradualAdaptationRate is low enough to trigger recommendation in the service
      (service as any).config.gradualAdaptationRate = 0.05;

      const result = await service.detectPreferences(input);

      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'gradual-adaptation',
          impact: 'medium'
        })
      );
      
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'adaptation-rate',
          recommendation: expect.stringContaining('gradual')
        })
      );
    });
  });
});
