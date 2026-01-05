import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import liveSessionSlice, { fetchWorkoutAdaptation } from '../liveSessionSlice';
import { GeminiService } from '../../../../services/ai/GeminiService';

// Mock GeminiService
vi.mock('../../../../services/ai/GeminiService');
const mockGeminiService = vi.mocked(GeminiService.getInstance);

describe('LiveWorkoutSession - Validation & Testing', () => {
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

  describe('Privacy Validation', () => {
    it('should only send non-PII context to AI service', async () => {
      const mockGenerateAdaptation = vi.fn().mockResolvedValue({
        newExercise: 'Bodyweight Squats',
        newReps: 15,
        notes: 'A lighter alternative to maintain intensity.'
      });
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        energy: 'tired' as const,
        time: 'normal' as const,
        equipmentStatus: 'available' as const
      };

      await store.dispatch(fetchWorkoutAdaptation(context));

      // Verify the AI service was called with safe, non-PII context
      expect(mockGenerateAdaptation).toHaveBeenCalledWith(context);
      
      // Ensure no sensitive user data is included
      const calledWithContext = mockGenerateAdaptation.mock.calls[0][0];
      expect(calledWithContext).toEqual({
        energy: 'tired',
        time: 'normal',
        equipmentStatus: 'available'
      });
      
      // No user profile data, no exercise history, no personal identifiers
      expect(Object.keys(calledWithContext)).toEqual(['energy', 'time', 'equipmentStatus']);
    });

    it('should not send user profile or workout history', async () => {
      const mockGenerateAdaptation = vi.fn().mockResolvedValue({});
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        energy: 'normal' as const,
        time: 'limited' as const,
        equipmentStatus: 'unavailable' as const
      };

      await store.dispatch(fetchWorkoutAdaptation(context));

      // Verify only context is sent, no additional user data
      expect(mockGenerateAdaptation).toHaveBeenCalledTimes(1);
      expect(mockGenerateAdaptation).toHaveBeenCalledWith(context);
      
      // Ensure no additional data leaks
      const callArg = mockGenerateAdaptation.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('userId');
      expect(callArg).not.toHaveProperty('profile');
      expect(callArg).not.toHaveProperty('history');
      expect(callArg).not.toHaveProperty('preferences');
    });
  });

  describe('Latency Validation', () => {
    it('should complete adaptation request within 2 seconds', async () => {
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

      const startTime = Date.now();
      
      await store.dispatch(fetchWorkoutAdaptation({
        energy: 'tired',
        time: 'normal',
        equipmentStatus: 'available'
      }));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000);
      expect(store.getState().liveSession.isLoading).toBe(false);
      expect(store.getState().liveSession.adaptation).toBeTruthy();
    });

    it('should handle slow network gracefully with loading state', async () => {
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
        energy: 'tired',
        time: 'normal',
        equipmentStatus: 'available'
      };

      // Start the async operation
      const promise = store.dispatch(fetchWorkoutAdaptation(context));

      // Should show loading state immediately
      expect(store.getState().liveSession.isLoading).toBe(true);
      expect(store.getState().liveSession.error).toBeNull();

      // Wait for completion
      await promise;

      // Should complete eventually even if over 2 seconds
      expect(store.getState().liveSession.isLoading).toBe(false);
      expect(store.getState().liveSession.adaptation).toBeTruthy();
    });

    it('should handle network timeout errors', async () => {
      const mockGenerateAdaptation = vi.fn().mockRejectedValue(
        new Error('Network timeout')
      );
      
      mockGeminiService.mockReturnValue({
        generateWorkoutAdaptation: mockGenerateAdaptation
      } as any);

      const context = {
        energy: 'tired',
        time: 'normal',
        equipmentStatus: 'available'
      };

      try {
      const result = await store.dispatch(fetchWorkoutAdaptation(context));
      } catch (error) {
        // Expected to throw due to rejection
      }

      // Should not be loading and should have error
      expect(store.getState().liveSession.isLoading).toBe(false);
      expect(store.getState().liveSession.error).toBeTruthy();
      expect(store.getState().liveSession.adaptation).toBeNull();
    });
  });
});