/**
 * Preference Learning System Tests
 * Comprehensive test suite for preference learning functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import { PreferenceIntelligenceEngine } from '../PreferenceIntelligenceEngine';
import { PreferenceEncryptionService } from '../services/PreferenceEncryptionService';
import { PreferenceLearningIntegrationService } from '../services/PreferenceLearningIntegrationService';
import type {
  PreferencePattern,
  PreferenceLearningInput,
  PreferenceType,
  ExerciseSession,
  PreferenceLearningConfig,
  WorkoutSession
} from '../types/preferenceLearning.types';

// Mock dependencies for testing
const mockPrivacyService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  store: vi.fn(),
  retrieve: vi.fn(),
  delete: vi.fn(),
  auditTrail: vi.fn()
};

const mockTensorFlowService = {
  predictPattern: vi.fn(),
  trainModel: vi.fn(),
  validateModel: vi.fn()
};

const createMockPreference = (overrides: Partial<PreferencePattern> = {}): PreferencePattern => ({
  id: 'test-pref-1',
  userId: 'test-user',
  patternType: 'exercise-selection',
  confidence: 0.8,
  strength: 0.7,
  firstDetected: new Date('2026-01-01'),
  lastConfirmed: new Date('2026-01-06'),
  confirmations: 5,
  contradictions: 0,
  data: {
    exercisePreferences: [
      { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: ['main'] }
    ]
  },
  ...overrides
});

const createMockWorkoutSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'test-session-1',
  userId: 'test-user',
  exercises: [
    {
      exerciseId: 'push-ups',
      exerciseType: 'strength',
      duration: 300,
      sets: 3,
      reps: 15,
      intensity: 0.6,
      completionRate: 1.0,
      userFeedback: {
        difficulty: 3,
        satisfaction: 4,
        energy: 4
      }
    }
  ],
  startTime: new Date('2026-01-06T09:00:00Z'),
  endTime: new Date('2026-01-06T09:30:00Z'),
  totalDuration: 1800,
  performance: {
    overallScore: 0.8,
    consistencyScore: 0.9,
    fatigueLevel: 0.3,
    motivationLevel: 0.8
  },
  ...overrides
});

describe('PreferenceLearningService', () => {
  let service: PreferenceLearningService;
  let config: PreferenceLearningConfig;

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
      privacyService: mockPrivacyService,
      tensorFlowService: mockTensorFlowService,
      config
    });

    // Reset mock implementations
    mockPrivacyService.encrypt.mockResolved('encrypted-data');
    mockPrivacyService.decrypt.mockResolved({
      type: 'preference-data',
      version: '1.0',
      timestamp: Date.now(),
      data: { preferences: [] }
    });
    mockTensorFlowService.predictPattern.mockResolved({
      confidence: 0.8,
      patternType: 'exercise-selection',
      preferences: []
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectPreferences', () => {
    it('should detect exercise selection preferences from workout sessions', async () => {
      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: [],
        userContext: {
          currentMood: 'energetic',
          sessionPhase: 'main',
          recentPerformance: 0.8
        }
      };

      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.8,
        patternType: 'exercise-selection',
        preferences: [
          { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9 }
        ]
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(1);
      expect(result.detectedPatterns[0].patternType).toBe('exercise-selection');
      expect(result.detectedPatterns[0].confidence).toBe(0.8);
      expect(result.detectedPatterns[0].userId).toBe('test-user');
      expect(result.detectedPatterns[0].data.exercisePreferences).toHaveLength(1);
      expect(result.detectedPatterns[0].data.exercisePreferences[0].preference).toBe('preferred');
    });

    it('should detect intensity preferences from user feedback', async () => {
      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession({
          exercises: [
            {
              exerciseId: 'squats',
              userFeedback: { difficulty: 2, satisfaction: 5, energy: 5 }
            }
          ]
        }),
        existingPatterns: []
      };

      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.75,
        patternType: 'intensity-level',
        intensityRange: { min: 0.4, max: 0.6 },
        preference: 'comfortable'
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(1);
      expect(result.detectedPatterns[0].patternType).toBe('intensity-level');
      expect(result.detectedPatterns[0].confidence).toBe(0.75);
      expect(result.detectedPatterns[0].data.intensityPreferences).toHaveLength(1);
      expect(result.detectedPatterns[0].data.intensityPreferences[0].preference).toBe('comfortable');
    });

    it('should require minimum sessions before detecting patterns', async () => {
      // Override getUserSessionCount to return less than minSessions
      const originalGetUserSessionCount = service['getUserSessionCount'];
      service['getUserSessionCount'] = vi.fn().mockResolved(2); // Less than minSessions (5)

      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: []
      };

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].type).toBe('exercise-selection');
      expect(result.recommendations[0].recommendation).toContain('More sessions needed');
    });

    it('should update existing patterns with new session data', async () => {
      const existingPattern = createMockPreference({
        confirmations: 3,
        contradictions: 0
      });

      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: [existingPattern]
      };

      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.85,
        patternMatch: true
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.updatedPatterns).toHaveLength(1);
      expect(result.updatedPatterns[0].confirmations).toBe(4);
      expect(result.updatedPatterns[0].confidence).toBeGreaterThan(existingPattern.confidence);
      expect(result.confidenceUpdates).toHaveLength(1);
      expect(result.confidenceUpdates[0].oldConfidence).toBe(existingPattern.confidence);
      expect(result.confidenceUpdates[0].newConfidence).toBe(result.updatedPatterns[0].confidence);
    });

    it('should invalidate patterns with too many contradictions', async () => {
      const contradictoryPattern = createMockPreference({
        confirmations: 2,
        contradictions: 3 // At max
      });

      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: [contradictoryPattern]
      };

      mockTensorFlowService.predictPattern.mockResolved({
        contradiction: true
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.invalidatedPatterns).toContain(contradictoryPattern.id);
      expect(result.invalidatedPatterns).toHaveLength(1);
    });

    it('should handle errors gracefully and provide fallback behavior', async () => {
      mockTensorFlowService.predictPattern.mockRejected(new Error('TensorFlow prediction failed'));

      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: []
      };

      const result = await service.detectPreferences(mockInput);

      expect(result).toBeDefined();
      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].type).toBe('error');
      expect(result.recommendations[0].recommendation).toContain('prediction failed');
    });

    it('should complete within 2-second performance requirement', async () => {
      const startTime = performance.now();
      
      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: []
      };

      await service.detectPreferences(mockInput);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('getLearnedPreferences', () => {
    it('should retrieve and decrypt stored preferences', async () => {
      const mockPreferences = [createMockPreference()];
      
      mockPrivacyService.retrieve.mockResolved('encrypted-data');
      mockPrivacyService.auditTrail.mockResolved([]);

      const result = await service.getLearnedPreferences('test-user');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-pref-1');
      expect(mockPrivacyService.retrieve).toHaveBeenCalledWith('preferences-test-user');
      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith('encrypted-data');
      expect(mockPrivacyService.auditTrail).toHaveBeenCalled();
    });

    it('should handle missing preferences gracefully', async () => {
      mockPrivacyService.retrieve.mockResolved(null);

      const result = await service.getLearnedPreferences('test-user');

      expect(result).toHaveLength(0);
    });

    it('should handle decryption errors', async () => {
      mockPrivacyService.retrieve.mockResolved('encrypted-data');
      mockPrivacyService.decrypt.mockRejected(new Error('Decryption failed'));
      mockPrivacyService.auditTrail.mockResolved([]);

      await expect(service.getLearnedPreferences('test-user')).rejects.toThrow('Decryption failed');
    });
  });

  describe('updatePreferences', () => {
    it('should validate and update existing preferences', async () => {
      const existingPattern = createMockPreference({
        confidence: 0.6
      });

      const updates = { confidence: 0.8 };

      mockPrivacyService.retrieve.mockResolved([existingPattern]);
      mockPrivacyService.encrypt.mockResolved('updated-encrypted');
      mockPrivacyService.store.mockResolved();

      await service.updatePreferences('test-user', updates);

      expect(mockPrivacyService.retrieve).toHaveBeenCalledWith('preferences-test-user');
      expect(mockPrivacyService.encrypt).toHaveBeenCalled();
      expect(mockPrivacyService.store).toHaveBeenCalled();
    });

    it('should reject invalid preference updates', async () => {
      const invalidUpdates = { confidence: 1.5 }; // Invalid: > 1.0

      mockPrivacyService.retrieve.mockResolved([]);

      await expect(service.updatePreferences('test-user', invalidUpdates)).rejects.toThrow('Invalid preference data');
    });
  });

  describe('deletePreference', () => {
    it('should delete specific preference', async () => {
      const preferences = [createMockPreference()];

      mockPrivacyService.retrieve.mockResolved(preferences);
      mockPrivacyService.encrypt.mockResolved('remaining-encrypted');
      mockPrivacyService.store.mockResolved();

      await service.deletePreference('test-user', 'test-pref-1');

      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        'preferences-test-user',
        expect.array.not.containing(expect.objectContaining({ id: 'test-pref-1' }))
      );
    });
  });

  describe('exportPreferences', () => {
    it('should export encrypted preference data', async () => {
      const preferences = [createMockPreference()];

      mockPrivacyService.retrieve.mockResolved(preferences);
      mockPrivacyService.encrypt.mockResolved('export-encrypted');

      const result = await service.exportPreferences('test-user');

      expect(result).toBe('export-encrypted');
      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(preferences);
    });
  });

  describe('importPreferences', () => {
    it('should import and validate encrypted preference data', async () => {
      const importData = JSON.stringify({
        type: 'preference-data',
        preferences: [createMockPreference()]
      });

      const decryptedData = {
        type: 'preference-data',
        preferences: [createMockPreference()]
      };

      mockPrivacyService.decrypt.mockResolved(decryptedData);

      const result = await service.importPreferences('test-user', 'mock-encrypted');

      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith('mock-encrypted');
      expect(result).toBe(true);
    });

    it('should reject invalid imported data', async () => {
      const invalidData = { invalid: 'data' };

      mockPrivacyService.decrypt.mockRejected(new Error('Invalid JSON'));

      await expect(service.importPreferences('test-user', 'invalid-encrypted')).rejects.toThrow();
    });
  });

  describe('resetPreferences', () => {
    it('should reset all user preferences', async () => {
      mockPrivacyService.delete.mockResolved();
      mockPrivacyService.auditTrail.mockResolved([]);

      await service.resetPreferences('test-user');

      expect(mockPrivacyService.delete).toHaveBeenCalledWith('preferences-test-user');
    });
  });

  describe('Privacy and Security', () => {
    it('should ensure all preference data is encrypted at rest', async () => {
      const preferences = [createMockPreference()];

      await service.storePreferences('test-user', preferences);

      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'preference-data',
          version: '1.0',
          timestamp: expect.any(Number),
          data: preferences
        })
      );
      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        'preferences-test-user',
        expect.any(String)
      );
    });

    it('should maintain audit trail for all operations', async () => {
      await service.getLearnedPreferences('test-user');

      expect(mockPrivacyService.auditTrail).toHaveBeenCalled();
    });

    it('should never transmit preference data externally', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      await service.detectPreferences({
        session: createMockWorkoutSession(),
        existingPatterns: []
      });

      // Verify no network calls were made
      expect(mockFetch).not.toHaveBeenCalled();
      
      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Gradual Learning', () => {
    it('should adapt preferences gradually to avoid overwhelming users', async () => {
      const lowAdaptationConfig = {
        ...config,
        gradualAdaptationRate: 0.01 // Very slow adaptation
      };

      const slowService = new PreferenceLearningService({
        privacyService: mockPrivacyService,
        tensorFlowService: mockTensorFlowService,
        config: lowAdaptationConfig
      });

      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession(),
        existingPatterns: [createMockPreference({
          confirmations: 10,
          contradictions: 0
        })]
      };

      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.9,
        patternType: 'exercise-selection',
        preference: 'preferred'
      });

      const result = await slowService.detectPreferences(mockInput);

      expect(result.recommendations).toEqual(
        expect.arrayContaining(
          expect.objectContaining({
            type: 'gradual-adaptation',
            recommendation: expect.stringContaining('gradual adaptation'),
            impact: 'medium'
          })
        )
      );
    });

    it('should limit adaptation rate based on user compliance', async () => {
      const mockInput: PreferenceLearningInput = {
        session: createMockWorkoutSession({
          exercises: [
            {
              exerciseId: 'beginner-exercise',
              userFeedback: { satisfaction: 1 } // Low satisfaction
            }
          ]
        }),
        existingPatterns: []
      };

      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.3, // Low confidence due to poor feedback
        patternType: 'exercise-selection'
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.recommendations).toEqual(
        expect.arrayContaining(
          expect.objectContaining({
            type: 'adaptation-rate',
            recommendation: expect.stringContaining('slow adaptation'),
            confidence: expect.any(Number)
          })
        )
      );
    });
  });
});