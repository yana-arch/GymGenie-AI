import { expect, vi, beforeEach, afterEach, describe, test } from 'vitest';
import { 
  given, 
  when, 
  then, 
  and, 
  createSafetyTest,
  createCriticalTest,
  createSmokeTest,
  createHighPriorityTest,
  TestCategory,
  TestType
} from '../../../test-utils';
import { OverrideDetectionService } from '../services/OverrideDetectionService';
import type { AIRecommendation, OverrideEvent } from '../services/OverrideDetectionService';

describe('SafetyOverrideService BDD Tests', () => {
  let service: OverrideDetectionService;
  let mockRecommendation: AIRecommendation;

  beforeEach(() => {
    service = new OverrideDetectionService();
    mockRecommendation = {
      id: 'test-rec-1',
      type: 'exercise_modification',
      exerciseName: 'Squats',
      originalReps: 12,
      suggestedReps: 10,
      originalSets: 3,
      suggestedSets: 3,
      reasoning: 'Reduce reps to maintain form while tired',
      timestamp: Date.now(),
      context: {
        energyLevel: 'tired',
        timeRemaining: 15,
        equipmentAvailable: ['bodyweight']
      }
    };
  });

  afterEach(() => {
    service.destroy();
  });

  given('a new SafetyOverrideService instance', () => {
    then(createSmokeTest(TestCategory.SAFETY, TestType.UNIT, 1, 'should initialize with default monitoring state'), () => {
      const state = service.getState();
      expect(state.isMonitoring).toBe(false);
      expect(state.overrideHistory).toEqual([]);
      expect(state.currentRecommendations).toEqual([]);
    });
  });

  given('an active safety override monitoring session', () => {
    describe('WHEN the user starts monitoring for overrides', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(2, 'should be in monitoring state'), () => {
        const state = service.getState();
        expect(state.isMonitoring).toBe(true);
      });

      and(createSafetyTest(3, 'should detect override when user disagrees with recommendation'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.recommendationId).toBe(mockRecommendation.id);
        expect(overrideEvent!.userAction).toBe('disagree');
        expect(overrideEvent!.timestamp).toBeDefined();
        expect(overrideEvent!.context).toEqual(mockRecommendation.context);
      });

      and(createSafetyTest(4, 'should detect override when user taps override button'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'override_tap');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.userAction).toBe('override_tap');
        expect(overrideEvent!.interactionMethod).toBe('one_tap');
      });

      and(createSafetyTest(5, 'should return null for non-override actions'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'view_details');
        expect(overrideEvent).toBeNull();
      });

      and(createSafetyTest(6, 'should store override event in history'), async () => {
        await service.detectOverride(mockRecommendation, 'disagree');
        const state = service.getState();
        expect(state.overrideHistory).toHaveLength(1);
        expect(state.overrideHistory[0].recommendationId).toBe(mockRecommendation.id);
      });

      and(createSafetyTest(7, 'should detect overrides within performance requirement'), async () => {
        const startTime = Date.now();
        
        await service.detectOverride(mockRecommendation, 'disagree');
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(2000); // 2 second requirement
      });
    });

    describe('WHEN the user stops monitoring for overrides', () => {
      beforeEach(() => {
        service.startMonitoring();
        service.stopMonitoring();
      });

      then(createSafetyTest(8, 'should not be in monitoring state'), () => {
        const state = service.getState();
        expect(state.isMonitoring).toBe(false);
      });
    });

    describe('WHEN the service is not monitoring', () => {
      then(createSafetyTest(9, 'should not detect overrides'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        expect(overrideEvent).toBeNull();
      });
    });
  });

  given('recommendation management functionality', () => {
    describe('WHEN a recommendation is added to the service', () => {
      beforeEach(() => {
        service.addRecommendation(mockRecommendation);
      });

      then(createSafetyTest(10, 'should store recommendation in current recommendations'), () => {
        const state = service.getState();
        expect(state.currentRecommendations).toContain(mockRecommendation);
      });

      describe('WHEN the recommendation is removed', () => {
        beforeEach(() => {
          service.removeRecommendation(mockRecommendation.id);
        });

        then(createSafetyTest(11, 'should remove recommendation from current recommendations'), () => {
          const state = service.getState();
          expect(state.currentRecommendations).not.toContain(mockRecommendation);
        });
      });

      describe('WHEN all recommendations are cleared', () => {
        beforeEach(() => {
          service.clearRecommendations();
        });

        then(createSafetyTest(12, 'should have empty current recommendations'), () => {
          const state = service.getState();
          expect(state.currentRecommendations).toEqual([]);
        });
      });
    });
  });

  given('privacy compliance requirements', () => {
    describe('WHEN an override event is detected', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(13, 'should not include PII in override events'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        // OverrideEvent interface only contains safety-critical data, no PII
        expect(overrideEvent!.id).toBeDefined();
        expect(overrideEvent!.recommendationId).toBeDefined();
        expect(overrideEvent!.userAction).toBeDefined();
        expect(overrideEvent!.timestamp).toBeDefined();
        expect(overrideEvent!.context).toBeDefined();
        // Should not contain any personal identifying fields
        expect(Object.keys(overrideEvent!)).not.toContain('userId');
        expect(Object.keys(overrideEvent!)).not.toContain('personalInfo');
        expect(Object.keys(overrideEvent!)).not.toContain('email');
        expect(Object.keys(overrideEvent!)).not.toContain('name');
      });

      and(createSafetyTest(14, 'should store only workout context data locally'), async () => {
        await service.detectOverride(mockRecommendation, 'disagree');
        
        const state = service.getState();
        const overrideEvent = state.overrideHistory[0];
        
        // Should only contain workout context, not personal data
        expect(overrideEvent.context).toBeDefined();
        expect(overrideEvent.context.energyLevel).toBe('tired');
        expect(overrideEvent.context.timeRemaining).toBe(15);
        expect(overrideEvent.context.equipmentAvailable).toEqual(['bodyweight']);
        // Verify no personal data is stored
        expect(Object.keys(overrideEvent)).not.toContain('personalInfo');
      });
    });
  });

  given('emergency safety scenarios', () => {
    describe('WHEN user needs immediate override capability', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(15, 'should provide one-tap override functionality'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'override_tap');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.userAction).toBe('override_tap');
        expect(overrideEvent!.interactionMethod).toBe('one_tap');
        expect(overrideEvent!.timestamp).toBeDefined();
        expect(overrideEvent!.processingTime).toBeGreaterThan(0);
      });
    });

    describe('WHEN multiple override decisions are made in sequence', () => {
      beforeEach(async () => {
        service.startMonitoring();
        await service.detectOverride(mockRecommendation, 'disagree');
        await service.detectOverride(mockRecommendation, 'override_tap');
      });

      then(createSafetyTest(16, 'should maintain chronological override history'), () => {
        const state = service.getState();
        expect(state.overrideHistory).toHaveLength(2);
        expect(state.overrideHistory[0].userAction).toBe('disagree');
        expect(state.overrideHistory[1].userAction).toBe('override_tap');
      });
    });

    describe('WHEN emergency stop is needed', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(17, 'should handle skip exercise override'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'skip_exercise');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.userAction).toBe('skip_exercise');
        expect(overrideEvent!.recommendationId).toBe(mockRecommendation.id);
      });
    });
  });

  given('safety validation requirements', () => {
    describe('WHEN override detection system is operating', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(18, 'should validate override events have proper structure'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.recommendationId).toBeDefined();
        expect(overrideEvent!.userAction).toBeDefined();
        expect(overrideEvent!.timestamp).toBeDefined();
        expect(overrideEvent!.context).toBeDefined();
        expect(overrideEvent!.processingTime).toBeDefined();
      });

      and(createSafetyTest(19, 'should ensure user actions are from valid set'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(['disagree', 'override_tap', 'skip_exercise']).toContain(overrideEvent!.userAction);
      });
    });

    describe('WHEN context data is provided with recommendations', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(20, 'should preserve context in override events'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.context).toEqual(mockRecommendation.context);
        expect(overrideEvent!.context.energyLevel).toBe('tired');
        expect(overrideEvent!.context.timeRemaining).toBe(15);
        expect(overrideEvent!.context.equipmentAvailable).toEqual(['bodyweight']);
      });

      and(createSafetyTest(21, 'should handle different energy levels in context'), async () => {
        const normalEnergyRecommendation = {
          ...mockRecommendation,
          id: 'test-rec-2',
          context: { ...mockRecommendation.context, energyLevel: 'normal' as const }
        };
        
        const overrideEvent = await service.detectOverride(normalEnergyRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.context.energyLevel).toBe('normal');
      });
    });
  });

  given('performance and reliability requirements', () => {
    describe('WHEN handling high volume override events', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(22, 'should maintain performance under load'), async () => {
        const startTime = Date.now();
        
        // Simulate multiple override events
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(service.detectOverride(mockRecommendation, 'disagree'));
        }
        await Promise.all(promises);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const averageTime = totalTime / 10;
        
        expect(averageTime).toBeLessThan(500); // Each event should process quickly
      });
    });

    describe('WHEN processing time is tracked', () => {
      beforeEach(() => {
        service.startMonitoring();
      });

      then(createSafetyTest(23, 'should record processing time for each override'), async () => {
        const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
        
        expect(overrideEvent).not.toBeNull();
        expect(overrideEvent!.processingTime).toBeGreaterThan(0);
        expect(overrideEvent!.processingTime).toBeLessThan(1000); // Should be under 1 second
      });
    });
  });

  given('user override decision patterns', () => {
    describe('WHEN user consistently disagrees with recommendations', () => {
      beforeEach(async () => {
        service.startMonitoring();
        // Simulate user disagreeing multiple times
        for (let i = 0; i < 5; i++) {
          await service.detectOverride(mockRecommendation, 'disagree');
        }
      });

      then(createSafetyTest(24, 'should track consistent disagreement pattern'), () => {
        const state = service.getState();
        expect(state.overrideHistory).toHaveLength(5);
        
        const disagreementEvents = state.overrideHistory.filter(
          event => event.userAction === 'disagree'
        );
        expect(disagreementEvents).toHaveLength(5);
      });
    });

    describe('WHEN user uses one-tap override frequently', () => {
      beforeEach(async () => {
        service.startMonitoring();
        // Simulate frequent one-tap overrides
        for (let i = 0; i < 3; i++) {
          await service.detectOverride(mockRecommendation, 'override_tap');
        }
      });

      then(createSafetyTest(25, 'should track one-tap override preference'), () => {
        const state = service.getState();
        expect(state.overrideHistory).toHaveLength(3);
        
        const tapEvents = state.overrideHistory.filter(
          event => event.userAction === 'override_tap'
        );
        expect(tapEvents).toHaveLength(3);
        tapEvents.forEach(event => {
          expect(event.interactionMethod).toBe('one_tap');
        });
      });
    });
  });
});