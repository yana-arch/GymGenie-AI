/**
 * PreferenceLearningService Tests
 * Testing AI preference learning functionality with red-green-refactor approach
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import type { 
  PreferenceLearningInput, 
  PreferenceLearningOutput,
  WorkoutSession,
  PreferencePattern,
  PreferenceType,
  ExerciseSession
} from '../types/preferenceLearning.types';

// Mock dependencies
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

describe('PreferenceLearningService', () => {
  let service: PreferenceLearningService;
  let mockInput: PreferenceLearningInput;

  beforeEach(() => {
    vi.clearAllMocks();
    
    service = new PreferenceLearningService({
      privacyService: mockPrivacyService,
      tensorFlowService: mockTensorFlowService,
      config: {
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
      }
    });

    // Create mock workout session for testing
    mockInput = {
      session: {
        id: 'session-123',
        userId: 'user-456',
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
          },
          {
            exerciseId: 'squats',
            exerciseType: 'strength',
            duration: 240,
            sets: 3,
            reps: 12,
            intensity: 0.7,
            completionRate: 0.9,
            userFeedback: {
              difficulty: 4,
              satisfaction: 3,
              energy: 3
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
        }
      },
      existingPatterns: [],
      userContext: {
        currentMood: 'energetic',
        sessionPhase: 'main',
        recentPerformance: 0.8
      }
    };
  });

  describe('detectPreferences', () => {
    it('should detect exercise selection preferences from completed sessions', async () => {
      // Mock TensorFlow pattern prediction
      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.8,
        preferences: [
          { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9 },
          { exerciseId: 'squats', preference: 'preferred', confidence: 0.7 }
        ]
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(1);
      expect(result.detectedPatterns[0].patternType).toBe('exercise-selection');
      expect(result.detectedPatterns[0].confidence).toBe(0.8);
      expect(result.detectedPatterns[0].userId).toBe('user-456');
    });

    it('should detect intensity preferences from user feedback and performance', async () => {
      // Add more sessions with varying intensity data
      const multiSessionInput: PreferenceLearningInput = {
        ...mockInput,
        session: {
          ...mockInput.session,
          exercises: mockInput.session.exercises.map(exercise => ({
            ...exercise,
            intensity: 0.4, // Lower intensity preference
            userFeedback: {
              ...exercise.userFeedback!,
              satisfaction: 5 // Higher satisfaction with lower intensity
            }
          }))
        }
      };

      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'intensity-level' as PreferenceType,
        confidence: 0.75,
        intensityRange: { min: 0.3, max: 0.6 },
        preference: 'comfortable'
      });

      const result = await service.detectPreferences(multiSessionInput);

      expect(result.detectedPatterns).toContainEqual(
        expect.objectContaining({
          patternType: 'intensity-level',
          confidence: 0.75
        })
      );
    });

    it('should update existing patterns with new session data', async () => {
      const existingPattern: PreferencePattern = {
        id: 'pattern-123',
        userId: 'user-456',
        patternType: 'exercise-selection',
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date('2026-01-05T09:00:00Z'),
        lastConfirmed: new Date('2026-01-05T09:00:00Z'),
        confirmations: 3,
        contradictions: 0,
        data: {
          exercisePreferences: [
            { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.7, contexts: ['main'] }
          ]
        }
      };

      const inputWithPatterns: PreferenceLearningInput = {
        ...mockInput,
        existingPatterns: [existingPattern]
      };

      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.85,
        patternMatch: true // Indicating this reinforces existing pattern
      });

      const result = await service.detectPreferences(inputWithPatterns);

      expect(result.updatedPatterns).toHaveLength(1);
      expect(result.updatedPatterns[0].confidence).toBeGreaterThan(existingPattern.confidence);
      expect(result.updatedPatterns[0].confirmations).toBe(existingPattern.confirmations + 1);
    });

    it('should invalidate patterns with too many contradictions', async () => {
      const contradictoryPattern: PreferencePattern = {
        id: 'pattern-contradiction',
        userId: 'user-456',
        patternType: 'exercise-selection',
        confidence: 0.5,
        strength: 0.4,
        firstDetected: new Date('2026-01-04T09:00:00Z'),
        lastConfirmed: new Date('2026-01-04T09:00:00Z'),
        confirmations: 2,
        contradictions: 3, // Already at max
        data: {
          exercisePreferences: [
            { exerciseId: 'running', preference: 'preferred', confidence: 0.6, contexts: ['main'] }
          ]
        }
      };

      const inputWithContradiction: PreferenceLearningInput = {
        ...mockInput,
        existingPatterns: [contradictoryPattern],
        session: {
          ...mockInput.session,
          exercises: [
            {
              exerciseId: 'running',
              exerciseType: 'cardio',
              duration: 600,
              sets: 1,
              reps: 1,
              intensity: 0.8,
              completionRate: 0.3, // Poor completion indicates contradiction
              userFeedback: {
                difficulty: 5,
                satisfaction: 1,
                energy: 2
              }
            }
          ]
        }
      };

      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'exercise-selection' as PreferenceType,
        contradiction: true
      });

      const result = await service.detectPreferences(inputWithContradiction);

      expect(result.invalidatedPatterns).toContain('pattern-contradiction');
    });

    it('should require minimum sessions before detecting patterns', async () => {
      // Mock service with only 2 previous sessions (less than minSessions: 5)
      mockPrivacyService.retrieve.mockResolvedValue({
        sessionCount: 2
      });

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'exercise-selection',
          recommendation: expect.stringContaining('more sessions needed')
        })
      );
    });

    it('should respect privacy settings with local-only processing', async () => {
      const privateService = new PreferenceLearningService({
        privacyService: mockPrivacyService,
        tensorFlowService: mockTensorFlowService,
        config: {
          ...mockInput as any,
          privacySettings: {
            localOnly: true,
            encryptionEnabled: true,
            retentionDays: 90
          }
        }
      });

      await privateService.detectPreferences(mockInput);

      // Verify no external API calls were made
      expect(mockPrivacyService.store).toHaveBeenCalled();
      expect(mockPrivacyService.encrypt).toHaveBeenCalled();
      // Verify no network calls were attempted (would be mocked if they existed)
    });

    it('should handle errors gracefully and provide fallback behavior', async () => {
      mockTensorFlowService.predictPattern.mockRejectedValue(new Error('TensorFlow prediction failed'));

      const result = await service.detectPreferences(mockInput);

      expect(result).toBeDefined();
      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'error',
          recommendation: expect.stringContaining('prediction failed')
        })
      );
    });
  });

  describe('getLearnedPreferences', () => {
    it('should retrieve and decrypt stored preferences', async () => {
      const encryptedData = 'encrypted-preference-data';
      const decryptedPreferences: PreferencePattern[] = [
        {
          id: 'pattern-1',
          userId: 'user-456',
          patternType: 'exercise-selection',
          confidence: 0.8,
          strength: 0.7,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 5,
          contradictions: 0,
          data: {}
        }
      ];

      mockPrivacyService.retrieve.mockResolvedValue(encryptedData);
      mockPrivacyService.decrypt.mockResolvedValue(decryptedPreferences);

      const result = await service.getLearnedPreferences('user-456');

      expect(mockPrivacyService.retrieve).toHaveBeenCalledWith('preferences-user-456');
      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith(encryptedData);
      expect(result).toEqual(decryptedPreferences);
    });

    it('should handle missing preferences gracefully', async () => {
      mockPrivacyService.retrieve.mockResolvedValue(null);

      const result = await service.getLearnedPreferences('user-456');

      expect(result).toEqual([]);
    });

    it('should handle decryption errors', async () => {
      mockPrivacyService.retrieve.mockResolvedValue('encrypted-data');
      mockPrivacyService.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(service.getLearnedPreferences('user-456')).rejects.toThrow('Decryption failed');
    });
  });

  describe('updatePreferences', () => {
    it('should validate and update existing preferences', async () => {
      const existingPattern: PreferencePattern = {
        id: 'pattern-123',
        userId: 'user-456',
        patternType: 'intensity-level',
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {
          intensityPreferences: [
            { intensityRange: { min: 0.5, max: 0.7 }, preference: 'comfortable', confidence: 0.6 }
          ]
        }
      };

      const updates = {
        confidence: 0.8,
        strength: 0.7,
        data: {
          intensityPreferences: [
            { intensityRange: { min: 0.4, max: 0.6 }, preference: 'comfortable', confidence: 0.8 }
          ]
        }
      };

      // Mock existing preferences retrieval
      mockPrivacyService.retrieve.mockResolvedValue([existingPattern]);
      mockPrivacyService.encrypt.mockResolvedValue('encrypted-updated');

      await service.updatePreferences('user-456', updates);

      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'pattern-123',
            confidence: 0.8,
            strength: 0.7
          })
        ])
      );
    });

    it('should reject invalid preference updates', async () => {
      const invalidUpdates = {
        confidence: 1.5 // Invalid: > 1.0
      };

      await expect(service.updatePreferences('user-456', invalidUpdates)).rejects.toThrow('Invalid preference data');
    });
  });

  describe('exportPreferences', () => {
    it('should export encrypted preference data', async () => {
      const preferences: PreferencePattern[] = [
        {
          id: 'pattern-export',
          userId: 'user-456',
          patternType: 'exercise-selection',
          confidence: 0.9,
          strength: 0.8,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 10,
          contradictions: 0,
          data: {}
        }
      ];

      mockPrivacyService.retrieve.mockResolvedValue(preferences);
      mockPrivacyService.encrypt.mockResolvedValue('exported-encrypted-data');

      const result = await service.exportPreferences('user-456');

      expect(result).toBe('exported-encrypted-data');
      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(preferences);
    });
  });

  describe('importPreferences', () => {
    it('should import and validate encrypted preference data', async () => {
      const importedPreferences: PreferencePattern[] = [
        {
          id: 'pattern-imported',
          userId: 'user-456',
          patternType: 'intensity-level',
          confidence: 0.7,
          strength: 0.6,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 5,
          contradictions: 0,
          data: {}
        }
      ];

      mockPrivacyService.decrypt.mockResolvedValue(importedPreferences);
      mockPrivacyService.encrypt.mockResolvedValue('stored-encrypted');

      await service.importPreferences('user-456', 'encrypted-import-data');

      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith('encrypted-import-data');
      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        'preferences-user-456',
        'stored-encrypted'
      );
    });

    it('should reject invalid imported data', async () => {
      const invalidData = {
        invalidField: 'invalid',
        patterns: [] // Missing required fields
      };

      mockPrivacyService.decrypt.mockResolvedValue(invalidData);

      await expect(service.importPreferences('user-456', 'invalid-encrypted')).rejects.toThrow('Invalid preference data');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete preference detection within 2 seconds', async () => {
      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.8
      });

      const startTime = performance.now();
      await service.detectPreferences(mockInput);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    it('should handle multiple concurrent preference detections', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        service.detectPreferences({
          ...mockInput,
          session: {
            ...mockInput.session,
            id: `session-concurrent-${i}`
          }
        })
      );

      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.7
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.detectedPatterns).toBeDefined();
      });
    });
  });

  describe('Privacy and Security', () => {
    it('should ensure all preference data is encrypted at rest', async () => {
      const preferences: PreferencePattern[] = [
        {
          id: 'pattern-security',
          userId: 'user-456',
          patternType: 'exercise-selection',
          confidence: 0.9,
          strength: 0.8,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 8,
          contradictions: 0,
          data: {}
        }
      ];

      await service['storePreferences']('user-456', preferences);

      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(preferences);
      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        'preferences-user-456',
        expect.any(String) // Should be encrypted string
      );
    });

    it('should maintain audit trail for all preference operations', async () => {
      await service.getLearnedPreferences('user-456');

      expect(mockPrivacyService.auditTrail).toHaveBeenCalled();
    });

    it('should never transmit preference data externally', async () => {
      // This test ensures no external API calls are made
      const originalFetch = global.fetch;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      await service.detectPreferences(mockInput);

      expect(mockFetch).not.toHaveBeenCalled();

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Gradual Learning', () => {
    it('should adapt preferences gradually to avoid overwhelming users', async () => {
      const existingPattern: PreferencePattern = {
        id: 'pattern-gradual',
        userId: 'user-456',
        patternType: 'intensity-level',
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 4,
        contradictions: 0,
        data: {
          intensityPreferences: [
            { intensityRange: { min: 0.5, max: 0.7 }, preference: 'comfortable', confidence: 0.6 }
          ]
        }
      };

      const inputWithExistingPattern: PreferenceLearningInput = {
        ...mockInput,
        existingPatterns: [existingPattern]
      };

      // Mock new pattern detection with higher intensity
      mockTensorFlowService.predictPattern.mockResolvedValue({
        patternType: 'intensity-level' as PreferenceType,
        confidence: 0.9,
        intensityRange: { min: 0.7, max: 0.9 }
      });

      const result = await service.detectPreferences(inputWithExistingPattern);

      // Should create gradual adaptation recommendation rather than abrupt change
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'gradual-adaptation',
          impact: 'medium'
        })
      );
    });

    it('should limit adaptation rate based on user compliance', async () => {
      // This tests ensures changes are gradual based on gradualAdaptationRate
      const serviceWithSlowAdaptation = new PreferenceLearningService({
        privacyService: mockPrivacyService,
        tensorFlowService: mockTensorFlowService,
        config: {
          learningRate: 0.1,
          confidenceThreshold: 0.7,
          maxContradictions: 3,
          minSessions: 5,
          gradualAdaptationRate: 0.01, // Very slow adaptation
          privacySettings: {
            localOnly: true,
            encryptionEnabled: true,
            retentionDays: 90
          }
        }
      });

      const result = await serviceWithSlowAdaptation.detectPreferences(mockInput);

      // Should include recommendations about slow adaptation
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'adaptation-rate',
          recommendation: expect.stringContaining('gradual')
        })
      );
    });
  });
});