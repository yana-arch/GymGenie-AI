import { given, when, then, and, createSessionTest } from '../../../../test-utils';
import { configureStore } from '@reduxjs/toolkit';
import { vi, beforeEach, afterEach } from 'vitest';
import liveSessionSlice, { fetchWorkoutAdaptation } from '../liveSessionSlice';
import { GeminiService } from '../../../../services/ai/GeminiService';
import type { OverrideEvent } from '@/features/safety-override/services/OverrideDetectionService';

// Mock GeminiService
vi.mock('../../../../services/ai/GeminiService');
const mockGeminiService = vi.mocked(GeminiService.getInstance);

given('a live session slice with privacy compliance', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  when('AI adaptation is requested', () => {
    then(createSessionTest(1, 'should only send non-PII context to AI service'), async () => {
      const mockGenerateAdaptation = vi.fn().mockResolvedValue({
        newExercise: 'Bodyweight Squats',
        newReps: 15,
        notes: 'A lighter alternative to maintain intensity.'
      });
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        activeContext: {
          energy: 'tired' as const,
          time: 'normal' as const,
          equipmentStatus: 'available' as const
        },
        overrideHistory: [] as OverrideEvent[]
      };

      await (store.dispatch as any)(fetchWorkoutAdaptation(context));

      // Verify the AI service was called with safe, non-PII context
      expect(mockGenerateAdaptation).toHaveBeenCalledWith(
        expect.objectContaining({
          energy: 'tired',
          time: 'normal',
          equipmentStatus: 'available'
        })
      );
      
      // Ensure no sensitive user data is included
      const calledWithContext = mockGenerateAdaptation.mock.calls[0][0];
      expect(Object.keys(calledWithContext)).toEqual(
        expect.arrayContaining(['energy', 'time', 'equipmentStatus', 'overrideHistory'])
      );
      
      // No user profile data, no exercise history, no personal identifiers
      expect(calledWithContext).not.toHaveProperty('userId');
      expect(calledWithContext).not.toHaveProperty('profile');
      expect(calledWithContext).not.toHaveProperty('history');
      expect(calledWithContext).not.toHaveProperty('preferences');
    });

    and(createSessionTest(2, 'should not send user profile or workout history'), async () => {
      const mockGenerateAdaptation = vi.fn().mockResolvedValue({});
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        activeContext: {
          energy: 'normal' as const,
          time: 'limited' as const,
          equipmentStatus: 'unavailable' as const
        },
        overrideHistory: [] as OverrideEvent[]
      };

      await (store.dispatch as any)(fetchWorkoutAdaptation(context));

      // Verify only context is sent, no additional user data
      expect(mockGenerateAdaptation).toHaveBeenCalledTimes(1);
      
      // Ensure no additional data leaks
      const callArg = mockGenerateAdaptation.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('userId');
      expect(callArg).not.toHaveProperty('profile');
      expect(callArg).not.toHaveProperty('history');
      expect(callArg).not.toHaveProperty('preferences');
    });
  });
});

given('a live session slice with performance requirements', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  when('AI adaptation request is made', () => {
    then(createSessionTest(3, 'should complete adaptation request within 2 seconds'), async () => {
      // Mock fast response
      const mockGenerateAdaptation = vi.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            newExercise: 'Modified Exercise',
            newReps: 8
          }), 1500) // 1.5 seconds
        )
      );
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const promise = (store.dispatch as any)(fetchWorkoutAdaptation({
        activeContext: {
          energy: 'tired',
          time: 'normal',
          equipmentStatus: 'available'
        },
        overrideHistory: []
      }));

      vi.advanceTimersByTime(1500);
      await promise;

      const state = store.getState() as any;
      expect(state.liveSession.isLoading).toBe(false);
      expect(state.liveSession.adaptation).toBeTruthy();
      expect(state.liveSession.performance.withinSLA).toBe(true);
    });

    and(createSessionTest(4, 'should handle slow network gracefully with loading state'), async () => {
      // Mock slow response (2.5 seconds - exceeds threshold)
      const mockGenerateAdaptation = vi.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            newExercise: 'Modified Exercise',
            newReps: 8
          }), 2500)
        )
      );
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        activeContext: {
          energy: 'tired' as const,
          time: 'normal' as const,
          equipmentStatus: 'available' as const
        },
        overrideHistory: [] as OverrideEvent[]
      };

      // Start the async operation
      const promise = (store.dispatch as any)(fetchWorkoutAdaptation(context));

      // Should show loading state immediately
      let state = store.getState() as any;
      expect(state.liveSession.isLoading).toBe(true);

      vi.advanceTimersByTime(2500);
      await promise;

      // Should complete eventually
      state = store.getState() as any;
      expect(state.liveSession.isLoading).toBe(false);
      expect(state.liveSession.performance.lastSLABreach).toBe(true);
    });

    and(createSessionTest(5, 'should handle network timeout errors'), async () => {
      const mockGenerateAdaptation = vi.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        activeContext: {
          energy: 'tired' as const,
          time: 'normal' as const,
          equipmentStatus: 'available' as const
        },
        overrideHistory: [] as OverrideEvent[]
      };

      await (store.dispatch as any)(fetchWorkoutAdaptation(context));

      // Should not be loading and should have error
      const state = store.getState() as any;
      expect(state.liveSession.isLoading).toBe(false);
      expect(state.liveSession.error).toBeTruthy();
    });

    and(createSessionTest(6, 'should trigger fallback logic when SLA is breached'), async () => {
      // Mock slow response (3 seconds)
      const mockGenerateAdaptation = vi.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            newExercise: 'Should not use this',
            newReps: 25
          }), 3000)
        )
      );
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        activeContext: {
          energy: 'tired' as const,
          time: 'normal' as const,
          equipmentStatus: 'available' as const
        },
        overrideHistory: [] as OverrideEvent[],
        currentExercise: { reps: '10', sets: 3, restSeconds: 60 }
      };

      const promise = (store.dispatch as any)(fetchWorkoutAdaptation(context));
      
      vi.advanceTimersByTime(3000);
      await promise;

      const state = store.getState() as any;
      expect(state.liveSession.performance.lastSLABreach).toBe(true);
      // Fallback for 'tired' should be currentReps * 0.7 = 7
      expect(state.liveSession.adaptation.newReps).toBe(7);
      expect(state.liveSession.adaptation.notes).toContain('Conservative reduction due to system delay');
    });
  });
});