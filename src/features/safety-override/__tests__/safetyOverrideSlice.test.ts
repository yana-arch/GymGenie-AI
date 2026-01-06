import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safetyOverrideSlice, selectSafetyOverrideState, selectPerformanceMetrics, selectIsRecommendationPending } from '../store/safetyOverrideSlice';
import type { AIRecommendation, OverrideEvent } from '../services/OverrideDetectionService';

describe('safetyOverrideSlice', () => {
  let mockRecommendation: AIRecommendation;
  let mockOverrideEvent: OverrideEvent;

  beforeEach(() => {
    mockRecommendation = {
      id: 'test-rec-1',
      type: 'exercise_modification',
      exerciseName: 'Squats',
      originalReps: 12,
      suggestedReps: 10,
      reasoning: 'Reduce reps to maintain form while tired',
      timestamp: Date.now(),
      context: {
        energyLevel: 'tired' as const,
        timeRemaining: 15,
        equipmentAvailable: ['bodyweight']
      }
    };

    mockOverrideEvent = {
      id: 'override-1',
      recommendationId: 'test-rec-1',
      userAction: 'disagree',
      interactionMethod: 'menu_selection',
      timestamp: Date.now(),
      context: mockRecommendation.context,
      processingTime: 150
    };
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = safetyOverrideSlice.getInitialState();
      expect(state.isMonitoring).toBe(false);
      expect(state.currentRecommendations).toEqual([]);
      expect(state.overrideHistory).toEqual([]);
      expect(state.safetyLevel).toBe('moderate');
      expect(state.autoApplySafetyDefaults).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('monitoring control', () => {
    it('should start monitoring', () => {
      const state = safetyOverrideSlice.reducer(undefined, safetyOverrideSlice.actions.startMonitoring());
      expect(state.isMonitoring).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should stop monitoring', () => {
      let state = safetyOverrideSlice.reducer(undefined, safetyOverrideSlice.actions.startMonitoring());
      state = safetyOverrideSlice.reducer(state, safetyOverrideSlice.actions.stopMonitoring());
      expect(state.isMonitoring).toBe(false);
    });
  });

  describe('recommendation management', () => {
    it('should add recommendation', () => {
      const state = safetyOverrideSlice.reducer(
        undefined, 
        safetyOverrideSlice.actions.addRecommendation(mockRecommendation)
      );
      expect(state.currentRecommendations).toHaveLength(1);
      expect(state.currentRecommendations[0]).toEqual(mockRecommendation);
    });

    it('should update existing recommendation', () => {
      let state = safetyOverrideSlice.reducer(
        undefined, 
        safetyOverrideSlice.actions.addRecommendation(mockRecommendation)
      );
      
      const updatedRec = { ...mockRecommendation, suggestedReps: 8 };
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.updateRecommendation(updatedRec)
      );
      
      expect(state.currentRecommendations[0].suggestedReps).toBe(8);
    });

    it('should remove recommendation', () => {
      let state = safetyOverrideSlice.reducer(
        undefined, 
        safetyOverrideSlice.actions.addRecommendation(mockRecommendation)
      );
      
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.removeRecommendation(mockRecommendation.id)
      );
      
      expect(state.currentRecommendations).toHaveLength(0);
    });

    it('should clear all recommendations', () => {
      let state = safetyOverrideSlice.reducer(
        undefined, 
        safetyOverrideSlice.actions.addRecommendation(mockRecommendation)
      );
      
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.clearRecommendations()
      );
      
      expect(state.currentRecommendations).toEqual([]);
    });
  });

  describe('override handling', () => {
    it('should add override event', () => {
      let state = safetyOverrideSlice.reducer(undefined, safetyOverrideSlice.actions.startMonitoring());
      
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.addOverrideEvent(mockOverrideEvent)
      );
      
      expect(state.overrideHistory).toHaveLength(1);
      expect(state.overrideHistory[0]).toEqual(mockOverrideEvent);
      expect(state.totalOverrides).toBe(1);
      expect(state.lastProcessingTime).toBe(150);
    });

    it('should calculate average processing time', () => {
      let state = safetyOverrideSlice.reducer(undefined, safetyOverrideSlice.actions.startMonitoring());
      
      // Add first override
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.addOverrideEvent(mockOverrideEvent)
      );
      
      // Add second override with different processing time
      const secondOverride = { ...mockOverrideEvent, id: 'override-2', processingTime: 250 };
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.addOverrideEvent(secondOverride)
      );
      
      // Average should be (150 + 250) / 2 = 200
      expect(state.averageProcessingTime).toBe(200);
    });

    it('should clear pending override on event', () => {
      let state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setPendingOverride({ 
          recommendationId: mockRecommendation.id, 
          isPending: true 
        })
      );
      
      expect(state.pendingOverrides[mockRecommendation.id]).toBe(true);
      
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.addOverrideEvent(mockOverrideEvent)
      );
      
      expect(state.pendingOverrides[mockRecommendation.id]).toBeUndefined();
    });
  });

  describe('safety defaults management', () => {
    it('should set safety level', () => {
      const state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setSafetyLevel('conservative')
      );
      expect(state.safetyLevel).toBe('conservative');
    });

    it('should toggle auto apply safety defaults', () => {
      let state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setAutoApplySafetyDefaults(false)
      );
      expect(state.autoApplySafetyDefaults).toBe(false);
    });

    it('should set safety validation result', () => {
      const state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setSafetyValidationResult({
          recommendationId: mockRecommendation.id,
          result: { isValid: true, confidence: 0.95 }
        })
      );
      
      expect(state.safetyValidationResults[mockRecommendation.id]).toEqual({
        isValid: true,
        confidence: 0.95
      });
    });
  });

  describe('error handling', () => {
    it('should set and clear error', () => {
      let state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setError('Test error')
      );
      expect(state.error).toBe('Test error');
      
      state = safetyOverrideSlice.reducer(
        state,
        safetyOverrideSlice.actions.clearError()
      );
      expect(state.error).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      const state = safetyOverrideSlice.reducer(
        undefined,
        safetyOverrideSlice.actions.setLoading(true)
      );
      expect(state.isLoading).toBe(true);
    });
  });

  describe('selectors', () => {
    it('should select safety override state', () => {
      const mockRootState = { safetyOverride: safetyOverrideSlice.getInitialState() };
      const selected = selectSafetyOverrideState(mockRootState);
      expect(selected).toEqual(mockRootState.safetyOverride);
    });

    it('should select performance metrics', () => {
      let state = safetyOverrideSlice.getInitialState();
      state.lastProcessingTime = 150;
      state.averageProcessingTime = 200;
      state.totalOverrides = 5;
      
      const mockRootState = { safetyOverride: state };
      const metrics = selectPerformanceMetrics(mockRootState);
      
      expect(metrics).toEqual({
        lastProcessingTime: 150,
        averageProcessingTime: 200,
        totalOverrides: 5
      });
    });

    it('should select pending override status', () => {
      let state = safetyOverrideSlice.getInitialState();
      state.pendingOverrides['test-rec'] = true;
      
      const mockRootState = { safetyOverride: state };
      const isPending = selectIsRecommendationPending('test-rec')(mockRootState);
      expect(isPending).toBe(true);
      
      const isNotPending = selectIsRecommendationPending('other-rec')(mockRootState);
      expect(isNotPending).toBe(false);
    });
  });
});