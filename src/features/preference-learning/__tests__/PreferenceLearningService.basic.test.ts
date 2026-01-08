/**
 * Preference Learning Service Basic Tests
 * BDD structure with standardized test IDs
 */

import { given, when, then, and, createPreferenceTest } from '../../../test-utils';
import { beforeEach, afterEach, vi } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import type {
  PreferencePattern,
  PreferenceType,
  PreferenceLearningConfig,
  WorkoutSession,
  PreferenceLearningInput
} from '../types/preferenceLearning.types';

// Mock dependencies
const mockPrivacyService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  retrieve: vi.fn(),
  store: vi.fn(),
  delete: vi.fn(),
  auditTrail: vi.fn()
};

const mockTensorFlowService = {
  predictPattern: vi.fn(),
  loadModel: vi.fn(),
  isModelLoaded: vi.fn(() => true),
  getModelMetadata: vi.fn(() => ({
    version: '1.0.0',
    trainedOn: new Date(),
    accuracy: 0.85,
    inputShape: [10],
    outputShape: [5]
  }))
};

describe('PreferenceLearningService Basic BDD Tests', () => {
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

    // Set up default mock returns
    mockPrivacyService.encrypt.mockResolvedValue('encrypted-data');
    mockPrivacyService.decrypt.mockResolvedValue({
      type: 'preference-data',
      version: '1.0',
      timestamp: Date.now(),
      data: { preferences: [] }
    });
    mockPrivacyService.retrieve.mockResolvedValue(null);
    mockPrivacyService.store.mockResolvedValue(undefined);
    mockPrivacyService.delete.mockResolvedValue(undefined);
    mockPrivacyService.auditTrail.mockResolvedValue([]);
    mockTensorFlowService.predictPattern.mockResolvedValue(null);

    service = new PreferenceLearningService({
      privacyService: mockPrivacyService,
      tensorFlowService: mockTensorFlowService,
      config
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  given('a PreferenceLearningService instance', () => {
    when('service is initialized', () => {
      then(createPreferenceTest(1, 'should be initialized with config'), () => {
        expect((service as any).config).toEqual(config);
      });
    });

    when('detecting preferences with insufficient data', () => {
      then(createPreferenceTest(2, 'should detect no patterns when no preferences exist'), async () => {
        const input: PreferenceLearningInput = {
          session: {
            id: 'session-1',
            userId: 'user-123',
            exercises: [],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        const result = await service.detectPreferences(input);

        expect(result.detectedPatterns).toHaveLength(0);
        expect(result.updatedPatterns).toHaveLength(0);
        expect(result.invalidatedPatterns).toHaveLength(0);
        expect(result.recommendations).toHaveLength(1); // Fallback recommendation
        expect(result.recommendations[0].type).toBe('exercise-selection');
        expect(result.recommendations[0].recommendation).toContain('No patterns detected yet');
      });

      and(createPreferenceTest(3, 'should require minimum sessions before detecting patterns'), async () => {
        // Mock session count < 5
        const mockSessionCount = vi.fn().mockResolvedValue(2);
        (service as any).getUserSessionCount = mockSessionCount;

        const input: PreferenceLearningInput = {
          session: {
            id: 'session-2',
            userId: 'user-123',
            exercises: [],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        const result = await service.detectPreferences(input);

        expect(result.detectedPatterns).toHaveLength(0);
        expect(result.recommendations).toContainEqual({
          type: 'exercise-selection',
          recommendation: expect.stringContaining('More sessions needed'),
          confidence: 0,
          impact: 'low'
        });
      });
    });

    when('sufficient preference data exists', () => {
      then(createPreferenceTest(4, 'should create patterns when sufficient data exists'), async () => {
        const input: PreferenceLearningInput = {
          session: {
            id: 'session-3',
            userId: 'user-123',
            exercises: [
              {
                exerciseId: 'push-ups',
                exerciseType: 'strength',
                duration: 60,
                sets: 3,
                reps: 10,
                intensity: 0.5,
                completionRate: 1.0,
                userFeedback: { difficulty: 4, satisfaction: 5, energy: 4 }
              }
            ],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        // Mock TensorFlow to return exercise selection pattern
        mockTensorFlowService.predictPattern.mockResolvedValue({
          confidence: 0.8,
          patternType: 'exercise-selection',
          preferences: [
            { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: ['main'] }
          ]
        });

        const result = await service.detectPreferences(input);

        expect(result.detectedPatterns).toHaveLength(1);
        expect(result.detectedPatterns[0].patternType).toBe('exercise-selection');
        expect(result.detectedPatterns[0].confidence).toBe(0.8);
        expect(result.detectedPatterns[0].data.exercisePreferences).toBeDefined();
      });
    });

    when('updating existing patterns', () => {
      then(createPreferenceTest(5, 'should update existing patterns with positive feedback'), async () => {
        const existingPattern: PreferencePattern = {
          id: 'pref-1',
          userId: 'user-123',
          patternType: 'exercise-selection',
          confidence: 0.6,
          strength: 0.5,
          confirmations: 2,
          contradictions: 0,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          data: {
            exercisePreferences: [
              { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.8, contexts: ['main'] }
            ]
          }
        };

        const input: PreferenceLearningInput = {
          session: {
            id: 'session-4',
            userId: 'user-123',
            exercises: [
              {
                exerciseId: 'push-ups',
                exerciseType: 'strength',
                duration: 60,
                sets: 3,
                reps: 10,
                intensity: 0.5,
                completionRate: 1.0,
                userFeedback: { difficulty: 3, satisfaction: 5, energy: 4 }
              }
            ],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [existingPattern],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        // Mock TensorFlow to confirm pattern match
        mockTensorFlowService.predictPattern.mockResolvedValue({
          confidence: 0.85,
          patternMatch: true
        });

        const result = await service.detectPreferences(input);

        expect(result.updatedPatterns).toHaveLength(1);
        expect(result.updatedPatterns[0].confirmations).toBe(3);
        expect(result.updatedPatterns[0].confidence).toBe(0.85); // Increased from 0.6
        expect(result.confidenceUpdates).toHaveLength(1);
      });

      and(createPreferenceTest(6, 'should invalidate patterns with contradictions'), async () => {
        const contradictoryPattern: PreferencePattern = {
          id: 'pref-contradiction',
          userId: 'user-123',
          patternType: 'exercise-selection',
          confidence: 0.4,
          strength: 0.3,
          confirmations: 5,
          contradictions: 3, // At max limit
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          data: {
            exercisePreferences: [
              { exerciseId: 'running', preference: 'preferred', confidence: 0.7, contexts: ['main'] }
            ]
          }
        };

        const input: PreferenceLearningInput = {
          session: {
            id: 'session-5',
            userId: 'user-123',
            exercises: [
              {
                exerciseId: 'running',
                exerciseType: 'cardio',
                duration: 60,
                sets: 1,
                reps: 1,
                intensity: 0.5,
                completionRate: 1.0,
                userFeedback: { difficulty: 1, satisfaction: 1, energy: 2 } // Low satisfaction contradicts preference
              }
            ],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [contradictoryPattern],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        // Mock TensorFlow to return contradiction
        mockTensorFlowService.predictPattern.mockResolvedValue({
          contradiction: true
        });

        const result = await service.detectPreferences(input);

        expect(result.invalidatedPatterns).toContain('pref-contradiction');
        expect(result.invalidatedPatterns).toHaveLength(1);
      });
    });
  });

  given('preference management functionality', () => {
    when('retrieving learned preferences', () => {
      then(createPreferenceTest(7, 'should return empty array for new user'), async () => {
        const userId = 'new-user';
        mockPrivacyService.retrieve.mockResolvedValue(null);

        const result = await service.getLearnedPreferences(userId);

        expect(result).toEqual([]);
      });

      and(createPreferenceTest(8, 'should return stored preferences for existing user'), async () => {
        const userId = 'existing-user';
        const mockPreferences: PreferencePattern[] = [
          {
            id: 'pref-existing',
            userId: 'existing-user',
            patternType: 'exercise-selection',
            confidence: 0.7,
            strength: 0.6,
            firstDetected: new Date(),
            lastConfirmed: new Date(),
            confirmations: 1,
            contradictions: 0,
            data: {}
          }
        ];

        mockPrivacyService.retrieve.mockResolvedValue(mockPreferences);
        mockPrivacyService.decrypt.mockResolvedValue(mockPreferences);

        const result = await service.getLearnedPreferences(userId);

        expect(result).toEqual(mockPreferences);
        expect(mockPrivacyService.retrieve).toHaveBeenCalledWith(`preferences-${userId}`);
        expect(mockPrivacyService.decrypt).toHaveBeenCalledWith(mockPreferences);
        expect(mockPrivacyService.auditTrail).toHaveBeenCalled();
      });

      and(createPreferenceTest(9, 'should handle decryption errors'), async () => {
        const userId = 'error-user';
        mockPrivacyService.retrieve.mockRejectedValue(new Error('Decryption failed'));

        await expect(
          service.getLearnedPreferences(userId)
        ).rejects.toThrow('Failed to retrieve preferences');
      });
    });

    when('caching results for efficiency', () => {
      then(createPreferenceTest(10, 'should cache results for efficiency'), async () => {
        const userId = 'cache-user';
        const mockPreferences: PreferencePattern[] = [];
        
        // First call
        mockPrivacyService.retrieve.mockResolvedValue([]);
        await service.getLearnedPreferences(userId);
        expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(1);
        expect(mockPrivacyService.retrieve).toHaveBeenCalledWith(`preferences-${userId}`);

        // Second call should use cache
        await service.getLearnedPreferences(userId);
        expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(1); // Still 1 due to cache
        
        // Third call should also use cache
        await service.getLearnedPreferences(userId);
        expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(1); // Still 1 due to cache
      });
    });
  });

  given('performance requirements', () => {
    when('measuring processing time', () => {
      then(createPreferenceTest(11, 'should complete preference detection within 2 seconds'), async () => {
        const startTime = performance.now();
        
        const input: PreferenceLearningInput = {
          session: {
            id: 'session-perf',
            userId: 'user-123',
            exercises: [],
            startTime: new Date(),
            endTime: new Date(),
            totalDuration: 0,
            performance: {
              overallScore: 0,
              consistencyScore: 0,
              fatigueLevel: 0,
              motivationLevel: 0
            }
          },
          existingPatterns: [],
          userContext: {
            sessionPhase: 'main',
            recentPerformance: 0.8
          }
        };

        mockTensorFlowService.predictPattern.mockResolvedValue({
          confidence: 0.8
        });

        await service.detectPreferences(input);

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(2000); // Should be under 2 seconds
      });
    });
  });
});
