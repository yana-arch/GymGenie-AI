import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverrideLearningService } from '../services/OverrideLearningService';
import type { OverrideEvent } from '../services/OverrideDetectionService';
import type { AIRecommendation } from '../services/OverrideDetectionService';

describe('OverrideLearningService', () => {
  let service: OverrideLearningService;
  let mockOverrideEvent: OverrideEvent;
  let mockRecommendation: AIRecommendation;

  beforeEach(() => {
    service = new OverrideLearningService();
    
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

    mockOverrideEvent = {
      id: 'override-1',
      recommendationId: 'test-rec-1',
      userAction: 'disagree',
      interactionMethod: 'one_tap',
      timestamp: Date.now(),
      context: {
        energyLevel: 'tired',
        timeRemaining: 15,
        equipmentAvailable: ['bodyweight']
      },
      processingTime: 150
    };
  });

  afterEach(() => {
    service.destroy();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const state = service.getState();
      expect(state.overrideHistory).toEqual([]);
      expect(state.learningPatterns).toEqual({});
      expect(state.isLearning).toBe(false);
    });
  });

  describe('override logging', () => {
    it('should log override events with full context', async () => {
      await service.logOverride(mockOverrideEvent);
      
      const state = service.getState();
      expect(state.overrideHistory).toHaveLength(1);
      expect(state.overrideHistory[0]).toEqual(mockOverrideEvent);
    });

    it('should store override events locally following federated architecture', async () => {
      // Verify local storage is used (no external transmission)
      const storageSpy = vi.spyOn(localStorage, 'setItem');
      
      await service.logOverride(mockOverrideEvent);
      
      // Should store locally, not transmit externally
      expect(storageSpy).toHaveBeenCalledWith(
        expect.stringContaining('safety-override-learning'),
        expect.any(String)
      );
      
      storageSpy.mockRestore();
    });

    it('should not log events without user consent for learning', async () => {
      const serviceWithoutConsent = new OverrideLearningService({ 
        enableLearning: false 
      });
      
      await serviceWithoutConsent.logOverride(mockOverrideEvent);
      
      const state = serviceWithoutConsent.getState();
      expect(state.overrideHistory).toHaveLength(0);
      
      serviceWithoutConsent.destroy();
    });

    it('should validate override events before logging', async () => {
      const invalidOverride = { ...mockOverrideEvent, timestamp: undefined } as any;
      
      await expect(service.logOverride(invalidOverride)).rejects.toThrow('Invalid override event');
      
      const state = service.getState();
      expect(state.overrideHistory).toHaveLength(0);
    });
  });

  describe('pattern recognition', () => {
    it('should recognize override patterns from multiple events', async () => {
      // Log multiple similar overrides to create a pattern
      const similarOverrides = [
        mockOverrideEvent,
        { ...mockOverrideEvent, id: 'override-2', timestamp: Date.now() + 1000, type: 'exercise_modification' },
        { ...mockOverrideEvent, id: 'override-3', timestamp: Date.now() + 2000, type: 'exercise_modification' }
      ];

      for (const override of similarOverrides) {
        await service.logOverride(override as any);
      }

      await service.analyzePatterns();

      const patterns = service.getLearningPatterns();
      expect(patterns).toBeDefined();
      expect(Object.keys(patterns)).toContain('exercise_modification');
      expect(patterns['exercise_modification'].overrideCount).toBe(3);
    });

    it('should identify context patterns (time of day, energy level)', async () => {
      const tiredOverride = {
        ...mockOverrideEvent,
        id: 'override-1',
        type: 'exercise_modification',
        context: { ...mockOverrideEvent.context, energyLevel: 'tired' as const }
      };

      const normalOverride = {
        ...mockOverrideEvent,
        id: 'override-2',
        type: 'exercise_modification',
        context: { ...mockOverrideEvent.context, energyLevel: 'normal' as const }
      };

      await service.logOverride(tiredOverride as any);
      await service.logOverride(normalOverride as any);
      await service.analyzePatterns();

      const patterns = service.getLearningPatterns();
      expect(patterns['exercise_modification'].contexts.energyLevel.tired).toBe(1);
      expect(patterns['exercise_modification'].contexts.energyLevel.normal).toBe(1);
    });

    it('should detect recommendation type preferences', async () => {
      const exerciseOverride = { ...mockOverrideEvent, userAction: 'disagree' as const, type: 'exercise_modification' };
      const restOverride = { 
        ...mockOverrideEvent, 
        id: 'override-2', 
        userAction: 'skip_exercise' as const,
        type: 'rest_adjustment'
      };

      await service.logOverride(exerciseOverride as any);
      await service.logOverride(restOverride as any);
      await service.analyzePatterns();

      const patterns = service.getLearningPatterns();
      expect(patterns['exercise_modification'].preferences.recommendationTypes['exercise_modification']).toBe(1);
      expect(patterns['rest_adjustment'].preferences.recommendationTypes['rest_adjustment']).toBe(1);
    });

    it('should provide confidence scores for patterns', async () => {
      // Create strong pattern (10+ similar events)
      for (let i = 0; i < 10; i++) {
        const override = {
          ...mockOverrideEvent,
          id: `override-${i}`,
          type: 'exercise_modification',
          timestamp: Date.now() + (i * 1000)
        };
        await service.logOverride(override as any);
      }

      await service.analyzePatterns();

      const insights = service.getLearningInsights();
      expect(insights.confidence).toBeGreaterThan(0.8); // High confidence with 10+ events
      expect(insights.patternStrength).toBe('strong');
    });
  });

  describe('learning recommendations', () => {
    it('should suggest conservative adjustments based on patterns', async () => {
      // Log overrides where user prefers fewer reps when tired
      for (let i = 0; i < 5; i++) {
        const override = {
          ...mockOverrideEvent,
          id: `override-${i}`,
          type: 'exercise_modification',
          context: { energyLevel: 'tired' as const, timeRemaining: 15, equipmentAvailable: ['bodyweight'] },
          userAction: 'disagree' as const
        };
        await service.logOverride(override as any);
      }

      await service.analyzePatterns();
      const recommendations = service.getAdaptiveRecommendations({
        energyLevel: 'tired', timeRemaining: 15, equipmentAvailable: ['bodyweight']
      });

      expect(recommendations.recommendations[0].type).toBe('reduce_intensity');
      expect(recommendations.confidence).toBeGreaterThan(0.5);
    });

    it('should respect safety constraints in recommendations', async () => {
      // Log some data first to avoid empty patterns
      for (let i = 0; i < 5; i++) {
        await service.logOverride({...mockOverrideEvent, id: `ob-${i}`, type: 'exercise_modification'} as any);
      }
      await service.analyzePatterns();
      const recommendations = service.getAdaptiveRecommendations(mockOverrideEvent.context);

      // Should never recommend unsafe adjustments
      expect(recommendations.recommendations.map(r => r.type)).not.toContain('increase_beyond_safety');
      expect(recommendations.safetyConstraints).toBeDefined();
    });

    it('should provide different strategies for different contexts', async () => {
      // Log some data first
      for (let i = 0; i < 5; i++) {
        await service.logOverride({...mockOverrideEvent, id: `oc-${i}`, type: 'exercise_modification'} as any);
      }
      await service.analyzePatterns();
      const recommendations = service.getAdaptiveRecommendations({
        energyLevel: 'normal', timeRemaining: 5, equipmentAvailable: ['bodyweight']
      });

      const timeRecommendations = service.getAdaptiveRecommendations({
        energyLevel: 'tired', timeRemaining: 30, equipmentAvailable: ['bodyweight']
      });

      // Different recommendations for different contexts
      expect(recommendations.strategy).not.toEqual(timeRecommendations.strategy);
    });
  });

  describe('privacy and data protection', () => {
    it('should store only workout context, not personal data', async () => {
      await service.logOverride(mockOverrideEvent);
      
      const state = service.getState();
      const storedOverride = state.overrideHistory[0];
      
      // Should contain workout context
      expect(storedOverride.context).toBeDefined();
      
      // Should not contain personal identifiers
      expect((storedOverride as any).userId).toBeUndefined();
      expect((storedOverride as any).personalInfo).toBeUndefined();
      expect((storedOverride as any).location).toBeUndefined();
    });

    it('should allow clearing all learning data', async () => {
      await service.logOverride(mockOverrideEvent);
      await service.logOverride({ ...mockOverrideEvent, id: 'override-2' });
      
      expect(service.getState().overrideHistory).toHaveLength(2);
      
      await service.clearAllData();
      
      expect(service.getState().overrideHistory).toHaveLength(0);
      expect(service.getState().learningPatterns).toEqual({});
      
      // Should also clear local storage
      expect(localStorage.getItem('safety-override-learning')).toBeNull();
    });

    it('should respect data retention policies', async () => {
      // This test would verify old data is cleaned up
      // Implementation depends on retention policy
      const retentionDays = service.getDataRetentionDays();
      expect(retentionDays).toBeGreaterThan(0);
      expect(retentionDays).toBeLessThanOrEqual(365); // Max 1 year
    });
  });

  describe('performance requirements', () => {
    it('should process override events within 500ms', async () => {
      const startTime = performance.now();
      
      await service.logOverride(mockOverrideEvent);
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(500); // 500ms requirement
    });

    it('should analyze patterns efficiently', async () => {
      // Log many events first
      for (let i = 0; i < 50; i++) {
        await service.logOverride({
          ...mockOverrideEvent,
          id: `override-${i}`,
          timestamp: Date.now() + (i * 1000)
        });
      }

      const startTime = performance.now();
      await service.analyzePatterns();
      const analysisTime = performance.now() - startTime;

      expect(analysisTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
