import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OverrideDetectionIntegration } from '../components/OverrideDetectionIntegration';
import { OverrideDetectionService } from '../services/OverrideDetectionService';
import safetyOverrideSlice from '../store/safetyOverrideSlice';
import type { AIRecommendation } from '../services/OverrideDetectionService';

// Mock OverrideDetectionService class
vi.mock('../services/OverrideDetectionService', () => {
  class MockOverrideDetectionService {
    startMonitoring = vi.fn();
    stopMonitoring = vi.fn();
    detectOverride = vi.fn();
    addRecommendation = vi.fn();
    removeRecommendation = vi.fn();
    getState = vi.fn();
    destroy = vi.fn();
    getPerformanceMetrics = vi.fn(() => ({
      lastProcessingTime: 0,
      averageProcessingTime: 0,
      processCount: 0
    }));
  }
  
  return { OverrideDetectionService: MockOverrideDetectionService };
});

describe('OverrideDetectionIntegration', () => {
  let mockService: any;
  let store: any;

  const mockRecommendation: AIRecommendation = {
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
      energyLevel: 'tired' as const,
      timeRemaining: 15,
      equipmentAvailable: ['bodyweight']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = configureStore({
      reducer: {
        safetyOverride: safetyOverrideSlice
      }
    });

    // Get fresh mock instance
    const MockService = (OverrideDetectionService as any);
    mockService = new MockService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start monitoring when mounted', () => {
      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      expect(mockService.startMonitoring).toHaveBeenCalled();
    });

    it('should stop monitoring when unmounted', () => {
      const { unmount } = render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      unmount();

      expect(mockService.stopMonitoring).toHaveBeenCalled();
    });

    it('should add recommendations to service when provided', () => {
      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      expect(mockService.addRecommendation).toHaveBeenCalledWith(mockRecommendation);
    });

    it('should remove recommendations from service when recommendations change', () => {
      const { rerender } = render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      // Change to empty recommendations
      rerender(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[]}
          />
        </Provider>
      );

      expect(mockService.removeRecommendation).toHaveBeenCalledWith(mockRecommendation.id);
    });
  });

  describe('override detection', () => {
    it('should handle override detection and update Redux state', async () => {
      const mockOverrideEvent = {
        id: 'override-1',
        recommendationId: mockRecommendation.id,
        userAction: 'disagree' as const,
        interactionMethod: 'one_tap' as const,
        timestamp: Date.now(),
        context: mockRecommendation.context,
        processingTime: 150
      };

      mockService.detectOverride.mockResolvedValue(mockOverrideEvent);

      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      // Simulate user action that triggers override detection
      const userAction = 'disagree' as const;
      
      // Find the component that triggers override detection
      const overrideTrigger = screen.getByTestId('override-trigger');
      fireEvent.click(overrideTrigger);

      await waitFor(() => {
        expect(mockService.detectOverride).toHaveBeenCalledWith(mockRecommendation, userAction);
      });

      // Check Redux state is updated
      const state = store.getState();
      expect(state.safetyOverride.overrideHistory).toContain(mockOverrideEvent);
    });

    it('should handle multiple recommendations', async () => {
      const mockRecommendation2: AIRecommendation = {
        ...mockRecommendation,
        id: 'test-rec-2',
        exerciseName: 'Push-ups'
      };

      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation, mockRecommendation2]}
          />
        </Provider>
      );

      expect(mockService.addRecommendation).toHaveBeenCalledTimes(2);
      expect(mockService.addRecommendation).toHaveBeenCalledWith(mockRecommendation);
      expect(mockService.addRecommendation).toHaveBeenCalledWith(mockRecommendation2);
    });

    it('should not detect override when service returns null', async () => {
      mockService.detectOverride.mockResolvedValue(null);

      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      const overrideTrigger = screen.getByTestId('override-trigger');
      fireEvent.click(overrideTrigger);

      await waitFor(() => {
        expect(mockService.detectOverride).toHaveBeenCalled();
      });

      // Redux state should not be updated
      const state = store.getState();
      expect(state.safetyOverride.overrideHistory).toHaveLength(0);
    });
  });

  describe('performance requirements', () => {
    it('should initialize within 100ms', () => {
      const startTime = performance.now();
      
      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid recommendation changes without errors', () => {
      const { rerender } = render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      // Rapid changes
      for (let i = 0; i < 5; i++) {
        const newRec = { ...mockRecommendation, id: `rec-${i}` };
        rerender(
          <Provider store={store}>
            <OverrideDetectionIntegration 
              recommendations={[newRec]}
            />
          </Provider>
        );
      }

      expect(mockService.addRecommendation).toHaveBeenCalledTimes(6); // initial + 5 changes
      expect(mockService.removeRecommendation).toHaveBeenCalledTimes(5);
    });
  });

  describe('integration with existing components', () => {
    it('should work with existing LiveSessionSlice patterns', () => {
      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[mockRecommendation]}
          />
        </Provider>
      );

      // Should follow Redux patterns from Stories 1.1 and 1.2
      const state = store.getState();
      expect(state.safetyOverride).toBeDefined();
      expect(state.safetyOverride.isMonitoring).toBe(true);
    });

    it('should integrate with form correction system context', () => {
      const recWithContext = {
        ...mockRecommendation,
        context: {
          ...mockRecommendation.context,
          formCorrectionActive: true
        }
      };

      render(
        <Provider store={store}>
          <OverrideDetectionIntegration 
            recommendations={[recWithContext]}
          />
        </Provider>
      );

      expect(mockService.addRecommendation).toHaveBeenCalledWith(recWithContext);
    });
  });
});