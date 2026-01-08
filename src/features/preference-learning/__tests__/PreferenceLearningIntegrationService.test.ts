/**
 * Preference Learning Integration Service Tests
 * BDD structure with standardized test IDs for integration functionality
 */

import { given, when, then, and, createPreferenceTest } from '../../../test-utils';
import { beforeEach, afterEach, vi } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import { PreferenceLearningIntegrationService } from '../services/PreferenceLearningIntegrationService';
import type { PreferenceLearningConfig } from '../types/preferenceLearning.types';

import { CoachingPriority } from '../../unified-coaching/types/unifiedCoaching.types';
import type { CoachingDecision } from '../../unified-coaching/types/unifiedCoaching.types';

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
  validateModel: vi.fn(),
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

describe('PreferenceLearningIntegrationService BDD Tests', () => {
  let service: PreferenceLearningIntegrationService;
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
    mockPrivacyService.retrieve.mockResolvedValue([]);
    mockPrivacyService.store.mockResolvedValue(undefined);
    mockPrivacyService.delete.mockResolvedValue(undefined);
    mockPrivacyService.auditTrail.mockResolvedValue([]);
    mockTensorFlowService.predictPattern.mockResolvedValue(null);

    service = new PreferenceLearningIntegrationService(
      new PreferenceLearningService({
        privacyService: mockPrivacyService,
        tensorFlowService: mockTensorFlowService,
        config
      }),
      config
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  given('a PreferenceLearningIntegrationService instance', () => {
    when('applying preferences to coaching decisions', () => {
      then(createPreferenceTest(1, 'should return original decision when no preferences exist'), async () => {
        const baseDecision: CoachingDecision = {
          system: 'unified-coaching',
          priority: CoachingPriority.ADAPTATION,
          contributingSystems: [],
          conflictResolution: {
            strategy: 'priority',
            conflicts: [],
            reasoning: 'Test reasoning'
          },
          response: {
            type: 'unified-coaching',
            confidence: 0.8,
            recommendation: 'Standard coaching decision',
            reasoning: 'Base decision without preferences',
            timestamp: Date.now(),
            metadata: {}
          },
          metadata: {
            processingTime: 0,
            systemsConsidered: 0,
            conflictsResolved: 0,
            priorityUsed: CoachingPriority.ADAPTATION,
            timestamp: Date.now()
          }
        };

        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const result = await service.applyPreferencesToCoaching(baseDecision, session);

        expect(result).toEqual(baseDecision);
      });

      and(createPreferenceTest(2, 'should apply exercise preferences to coaching decisions'), async () => {
        const baseDecision: CoachingDecision = {
          system: 'unified-coaching',
          priority: CoachingPriority.ADAPTATION,
          contributingSystems: [],
          conflictResolution: {
            strategy: 'priority',
            conflicts: [],
            reasoning: 'Test reasoning'
          },
          response: {
            type: 'unified-coaching',
            confidence: 0.8,
            recommendation: 'Standard coaching decision',
            reasoning: 'Base decision',
            timestamp: Date.now(),
            metadata: {}
          },
          metadata: {
            processingTime: 0,
            systemsConsidered: 0,
            conflictsResolved: 0,
            priorityUsed: CoachingPriority.ADAPTATION,
            timestamp: Date.now()
          }
        };

        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const mockPreferences = [{
          id: 'pref-1',
          userId: 'test-user',
          patternType: 'exercise-selection',
          confidence: 0.85,
          strength: 0.78,
          data: {
            exercisePreferences: [
              { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: ['main'] },
              { exerciseId: 'running', preference: 'avoided', confidence: 0.7, contexts: ['warmup'] }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(mockPreferences);

        const result = await service.applyPreferencesToCoaching(baseDecision, session);

        expect(result.priority).toBe(CoachingPriority.ADAPTATION);
        expect(result.response.reasoning).toContain('Preferences applied');
        expect(result.metadata).toBeDefined();
        expect((result.metadata as any).preferenceApplied).toBe(true);
      });

      and(createPreferenceTest(3, 'should apply intensity preferences to coaching decisions'), async () => {
        const baseDecision: CoachingDecision = {
          system: 'unified-coaching',
          priority: CoachingPriority.ADAPTATION,
          contributingSystems: [],
          conflictResolution: {
            strategy: 'priority',
            conflicts: [],
            reasoning: 'Test reasoning'
          },
          response: {
            type: 'unified-coaching',
            confidence: 0.8,
            recommendation: 'Standard coaching decision',
            reasoning: 'Base decision',
            timestamp: Date.now(),
            metadata: {}
          },
          metadata: {
            processingTime: 0,
            systemsConsidered: 0,
            conflictsResolved: 0,
            priorityUsed: CoachingPriority.ADAPTATION,
            timestamp: Date.now()
          }
        };

        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const mockPreferences = [{
          id: 'pref-2',
          userId: 'test-user',
          patternType: 'intensity-level',
          confidence: 0.72,
          strength: 0.65,
          data: {
            intensityPreferences: [
              { intensityRange: { min: 0.6, max: 0.8 }, preference: 'comfortable', confidence: 0.72 }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(mockPreferences);

        const result = await service.applyPreferencesToCoaching(baseDecision, session);

        expect(result.priority).toBe(CoachingPriority.ADAPTATION);
        expect(result.response.reasoning).toContain('Intensity preferences applied');
        expect((result.metadata as any).preferenceApplied).toBe(true);
      });

      and(createPreferenceTest(4, 'should handle errors gracefully and return original decision'), async () => {
        const baseDecision: CoachingDecision = {
          system: 'unified-coaching',
          priority: CoachingPriority.ADAPTATION,
          contributingSystems: [],
          conflictResolution: {
            strategy: 'priority',
            conflicts: [],
            reasoning: 'Test reasoning'
          },
          response: {
            type: 'unified-coaching',
            confidence: 0.8,
            recommendation: 'Standard coaching decision',
            reasoning: 'Base decision',
            timestamp: Date.now(),
            metadata: {}
          },
          metadata: {
            processingTime: 0,
            systemsConsidered: 0,
            conflictsResolved: 0,
            priorityUsed: CoachingPriority.ADAPTATION,
            timestamp: Date.now()
          }
        };

        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        mockPrivacyService.retrieve.mockRejectedValue(new Error('Service error'));

        const result = await service.applyPreferencesToCoaching(baseDecision, session);

        expect(result).toEqual(baseDecision);
      });
    });

    when('updating preferences from session completion', () => {
      then(createPreferenceTest(5, 'should update preferences based on session completion'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const userFeedback = {
          satisfaction: 4,
          difficulty: 3,
          energy: 4
        };

        const existingPreferences = [{
          id: 'pref-existing',
          userId: 'test-user',
          patternType: 'intensity-level',
          confidence: 0.6,
          strength: 0.5,
          data: {
            intensityPreferences: [
              { intensityRange: { min: 0.5, max: 0.7 }, preference: 'comfortable' }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(existingPreferences);

        await service.updatePreferencesFromSession(session, userFeedback);

        expect(mockPrivacyService.store).toHaveBeenCalled();
      });

      and(createPreferenceTest(6, 'should handle errors when updating preferences'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        mockPrivacyService.store.mockRejectedValue(new Error('Storage error'));

        const userFeedback = {
          satisfaction: 4,
          difficulty: 3,
          energy: 4
        };

        await expect(
          service.updatePreferencesFromSession(session, userFeedback)
        ).rejects.toThrow('Failed to update preferences');
      });
    });

    when('calculating preference influence', () => {
      then(createPreferenceTest(7, 'should calculate preference influence on current session'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const mockPreferences = [{
          id: 'pref-influence',
          userId: 'test-user',
          patternType: 'exercise-selection',
          confidence: 0.8,
          strength: 0.7,
          data: {
            exercisePreferences: [
              { exerciseId: 'squats', preference: 'preferred', confidence: 0.9 }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(mockPreferences);

        const result = await service.getPreferenceInfluence(session);

        expect(result.appliedPreferences).toContain('exercise-selection: 0.90');
        expect(result.influenceStrength).toBeGreaterThan(0);
        expect(result.safetyOverrides).toHaveLength(0);
      });

      and(createPreferenceTest(8, 'should detect safety overrides'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const unsafePreference = {
          id: 'pref-unsafe',
          userId: 'test-user',
          patternType: 'intensity-level',
          confidence: 0.9,
          strength: 0.8,
          data: {
            intensityPreferences: [
              { intensityRange: { min: 0.8, max: 1.0 }, preference: 'extreme' } // Too high
            ]
          }
        };

        mockPrivacyService.retrieve.mockResolvedValue([unsafePreference]);

        const result = await service.getPreferenceInfluence(session);

        expect(result.safetyOverrides).toContain('pref-unsafe');
      });

      and(createPreferenceTest(9, 'should calculate influence strength based on preference strength and session relevance'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {
            exercises: [
              { exerciseId: 'squats', exerciseType: 'strength' }
            ]
          },
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const strongPreference = {
          id: 'pref-strong',
          userId: 'test-user',
          patternType: 'exercise-selection',
          confidence: 0.9,
          strength: 0.8,
          data: {
            exercisePreferences: [
              { exerciseId: 'squats', preference: 'preferred', confidence: 0.9 }
            ]
          }
        };

        mockPrivacyService.retrieve.mockResolvedValue([strongPreference]);

        const result = await service.getPreferenceInfluence(session);

        expect(result.influenceStrength).toBeGreaterThan(0.5); // Strong preference + session relevance
      });
    });

    when('getting preference modifications', () => {
      then(createPreferenceTest(10, 'should return exercise modifications for strong preferences'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const preferences = [{
          id: 'pref-exercise-mods',
          userId: 'test-user',
          patternType: 'exercise-selection',
          confidence: 0.8,
          strength: 0.7,
          data: {
            exercisePreferences: [
              { exerciseId: 'bench-press', preference: 'preferred' },
              { exerciseId: 'deadlift', preference: 'avoided' }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(preferences);

        const result = await service.getPreferenceModifications(session);

        expect(result.exerciseModifications).toContain('Preferred bench-press (confidence: 0.80)');
        expect(result.exerciseModifications).toContain('Avoided deadlift (confidence: 0.80)');
      });

      and(createPreferenceTest(11, 'should return intensity modifications for intensity preferences'), async () => {
        const session = {
          liveSession: { userId: 'test-user', isActive: true },
          formCorrection: {},
          safetyOverride: {},
          injuryAware: {}
        } as any;

        const preferences = [{
          id: 'pref-intensity-mods',
          userId: 'test-user',
          patternType: 'intensity-level',
          confidence: 0.75,
          strength: 0.6,
          data: {
            intensityPreferences: [
              { intensityRange: { min: 0.4, max: 0.6 }, preference: 'comfortable' },
              { intensityRange: { min: 0.7, max: 0.8 }, preference: 'challenging' }
            ]
          }
        }];

        mockPrivacyService.retrieve.mockResolvedValue(preferences);

        const result = await service.getPreferenceModifications(session);

        expect(result.intensityModifications).toHaveLength(2);
        expect(result.intensityModifications).toContain('comfortable: 0.4-0.6 (confidence: 0.75)');
        expect(result.intensityModifications).toContain('challenging: 0.7-0.8 (confidence: 0.75)');
      });
    });
  });
});
