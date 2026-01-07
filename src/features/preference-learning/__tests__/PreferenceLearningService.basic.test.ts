/**
 * Preference Learning Service Basic Tests
 * Simple tests for core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import type {
  PreferencePattern,
  PreferenceType,
  PreferenceLearningConfig,
  WorkoutSession
} from '../types/preferenceLearning.types';

describe('PreferenceLearningService - Basic Tests', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be initialized with config', () => {
    expect(service.config).toEqual(config);
  });

  it('should detect no patterns when no preferences exist', async () => {
      const input: PreferenceLearningInput = {
        session: {
          id: 'session-1',
          userId: 'user-123',
          exercises: []
        },
        existingPatterns: [],
        userContext: {}
      };

      const result = await service.detectPreferences(input);

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.updatedPatterns).toHaveLength(0);
      expect(result.invalidatedPatterns).toHaveLength(0);
      expect(result.recommendations).toHaveLength(1); // Fallback recommendation
      expect(result.recommendations[0].type).toBe('exercise-selection');
      expect(result.recommendations[0].recommendation).toContain('No patterns detected yet');
    });

  it('should require minimum sessions before detecting patterns', async () => {
      // Mock session count < 5
      const mockSessionCount = vi.fn().mockResolved(2);
      (service as any).getUserSessionCount = mockSessionCount;

      const input: PreferenceLearningInput = {
        session: {
          id: 'session-2',
          userId: 'user-123',
          exercises: []
        },
        existingPatterns: [],
        userContext: {}
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

  it('should create patterns when sufficient data exists', async () => {
      const input: PreferenceLearningInput = {
        session: {
          id: 'session-3',
          userId: 'user-123',
          exercises: [
            {
              exerciseId: 'push-ups',
              userFeedback: { difficulty: 4, satisfaction: 5 }
            }
          ]
        },
        existingPatterns: [],
        userContext: {}
      };

      // Mock TensorFlow to return exercise selection pattern
      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.8,
        patternType: 'exercise-selection',
        preferences: [
          { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9 }
        ]
      });

      const result = await service.detectPreferences(input);

      expect(result.detectedPatterns).toHaveLength(1);
      expect(result.detectedPatterns[0].patternType).toBe('exercise-selection');
      expect(result.detectedPatterns[0].confidence).toBe(0.8);
      expect(result.detectedPatterns[0].data.exercisePreferences).toBeDefined();
    });
  });
});

  it('should update existing patterns with positive feedback', async () => {
      const existingPattern: PreferencePattern = {
        id: 'pref-1',
        userId: 'user-123',
        patternType: 'exercise-selection',
        confidence: 0.6,
        strength: 0.5,
        confirmations: 2,
        contradictions: 0,
        data: {
          exercisePreferences: [
            { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.8 }
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
              userFeedback: { difficulty: 3, satisfaction: 5 }
            }
          ]
        },
        existingPatterns: [existingPattern],
        userContext: {}
      };

      // Mock TensorFlow to confirm pattern match
      mockTensorFlowService.predictPattern.mockResolved({
        confidence: 0.85,
        patternMatch: true
      });

      const result = await service.detectPreferences(input);

      expect(result.updatedPatterns).toHaveLength(1);
      expect(result.updatedPatterns[0].confirmations).toBe(3);
      expect(result.updatedPatterns[0].confidence).toBe(0.85); // Increased from 0.6
      expect(result.confidenceUpdates).toHaveLength(1);
    });

  it('should invalidate patterns with contradictions', async () => {
      const contradictoryPattern: PreferencePattern = {
        id: 'pref-contradiction',
        userId: 'user-123',
        patternType: 'exercise-selection',
        confidence: 0.4,
        strength: 0.3,
        confirmations: 5,
        contradictions: 3, // At max limit
        data: {
          exercisePreferences: [
            { exerciseId: 'running', preference: 'preferred', confidence: 0.7 }
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
              userFeedback: { difficulty: 1, satisfaction: 1 } // Low satisfaction contradicts preference
            }
            }
          ]
        },
        existingPatterns: [contradictoryPattern],
        userContext: {}
      };

      // Mock TensorFlow to return contradiction
      mockTensorFlowService.predictPattern.mockResolved({
        contradiction: true
      });

      const result = await service.detectPreferences(input);

      expect(result.invalidatedPatterns).toContain('pref-contradiction');
      expect(result.invalidatedPatterns).toHaveLength(1);
    });
  });

  describe('getLearnedPreferences', () => {
    it('should return empty array for new user', async () => {
      const userId = 'new-user';
      mockPrivacyService.retrieve.mockResolved(null);

      const result = await service.getLearnedPreferences(userId);

      expect(result).toEqual([]);
    });

    it('should return stored preferences for existing user', async () => {
      const userId = 'existing-user';
      const mockPreferences: PreferencePattern[] = [
        {
          id: 'pref-existing',
          userId: 'existing-user',
          patternType: 'exercise-selection',
          confidence: 0.7,
          strength: 0.6,
          data: {}
        }
      ];

      mockPrivacyService.retrieve.mockResolved(mockPreferences);
      mockPrivacyService.decrypt.mockResolved(mockPreferences);

      const result = await service.getLearnedPreferences(userId);

      expect(result).toEqual(mockPreferences);
      expect(mockPrivacyService.retrieve).toHaveBeenCalledWith(`preferences-${userId}`);
      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith(mockPreferences);
      expect(mockPrivacyService.auditTrail).toHaveBeenCalled();
    });

    it('should handle decryption errors', async () => {
      const userId = 'error-user';
      mockPrivacyService.retrieve.mockRejected(new Error('Decryption failed'));

      await expect(
        service.getLearnedPreferences(userId)
      ).rejects.toThrow('Failed to retrieve preferences');
    });
  });

    it('should cache results for efficiency', async () => {
      const userId = 'cache-user';
      const mockPreferences: PreferencePattern[] = [];
      
      // First call
      mockPrivacyService.retrieve.mockResolved([]);
      await service.getLearnedPreferences(userId);
      expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(1);
      expect(mockPrivacyService.retrieve).toHaveBeenCalledWith(`preferences-cache-user`);

      // Second call should use cache
      await service.getLearnedPreferences(userId);
      expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(2);
      
      // Third call should also use cache
      await service.getLearnedPreferences(userId);
      expect(mockPrivacyService.retrieve).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete preference detection within 2 seconds', async () => {
      const startTime = performance.now();
      
      const input: PreferenceLearningInput = {
        session: {
          id: 'session-perf',
          userId: 'user-123',
          exercises: [],
        },
        existingPatterns: []
      };

      mockTensorFlowService.predictPattern.mockResolved({
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