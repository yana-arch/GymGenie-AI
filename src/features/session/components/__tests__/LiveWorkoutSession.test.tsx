import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import LiveWorkoutSession from '../LiveWorkoutSession';
import liveSessionSlice from '../../store/liveSessionSlice';
import { GeminiService } from '../../../../services/ai/GeminiService';

// Mock GeminiService
vi.mock('../../../../services/ai/GeminiService');
const mockGeminiService = vi.mocked(GeminiService.getInstance);

// Mock AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentPlan: {
      weeks: [{
        id: 'week1',
        days: [{
          id: 'day1',
          title: 'Test Day',
          exercises: [{
            id: 'ex1',
            name: 'Test Exercise',
            sets: 3,
            reps: '10',
            restSeconds: 60
          }]
        }]
      }]
    },
    currentSession: {
      weekId: 'week1',
      dayId: 'day1',
      startTime: Date.now(),
      state: 'active'
    },
    sessionManager: {
      completeSession: vi.fn()
    },
    logWorkout: vi.fn(),
    setStep: vi.fn(),
    timerSeconds: 0,
    startRestTimer: vi.fn(),
    stopRestTimer: vi.fn(),
    isTimerRunning: false,
    addSetToSession: vi.fn()
  })
}));

// Mock exercise registry
vi.mock('@/data/ExerciseRegistry.json', () => [
  {
    id: 'test-ex',
    name: 'Test Exercise',
    aliases: []
  }
]);

// Mock exercise catalog service
vi.mock('@/features/workout/services/ExerciseCatalogService', () => ({
  exerciseCatalogService: {
    search: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null)
  }
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      liveSession: liveSessionSlice
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      })
  });
};

describe('LiveWorkoutSession - Adaptation Triggers', () => {
  let store: ReturnType<typeof createTestStore>;
  let mockGenerateWorkoutAdaptation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = createTestStore();
    mockGenerateWorkoutAdaptation = vi.fn().mockResolvedValue({
      newExercise: 'Modified Exercise',
      newReps: 8,
      newSets: 3
    });
    
    mockGeminiService.mockReturnValue({
      generateWorkoutAdaptation: mockGenerateWorkoutAdaptation
    } as any);
  });

  it('should render "I\'m Tired" and "Short on Time" buttons', () => {
    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    expect(screen.getByText("I'm Tired")).toBeInTheDocument();
    expect(screen.getByText('Short on Time')).toBeInTheDocument();
  });

  it('should dispatch updateEnergyContext when "I\'m Tired" is clicked', async () => {
    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    const tiredButton = screen.getByText("I'm Tired");
    fireEvent.click(tiredButton);

    await waitFor(() => {
      expect(store.getState().liveSession.activeContext.energy).toBe('tired');
    });
  });

  it('should dispatch updateTimeContext when "Short on Time" is clicked', async () => {
    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    const timeButton = screen.getByText('Short on Time');
    fireEvent.click(timeButton);

    await waitFor(() => {
      expect(store.getState().liveSession.activeContext.time).toBe('limited');
    });
  });

  it('should trigger AI adaptation when context changes', async () => {
    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    const tiredButton = screen.getByText("I'm Tired");
    fireEvent.click(tiredButton);

    await waitFor(() => {
      expect(mockGeminiService().generateWorkoutAdaptation).toHaveBeenCalledWith({
        energy: 'tired',
        time: 'normal',
        equipmentStatus: 'available'
      });
    });
  });

  it('should show loading state during adaptation', async () => {
    mockGenerateWorkoutAdaptation.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );

    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    const tiredButton = screen.getByText("I'm Tired");
    fireEvent.click(tiredButton);

    await waitFor(() => {
      expect(store.getState().liveSession.isLoading).toBe(true);
    });
  });

  it('should handle adaptation errors gracefully', async () => {
    mockGenerateWorkoutAdaptation.mockRejectedValue(
      new Error('AI service unavailable')
    );

    render(
      <Provider store={store}>
        <LiveWorkoutSession />
      </Provider>
    );

    const tiredButton = screen.getByText("I'm Tired");
    fireEvent.click(tiredButton);

    await waitFor(() => {
      expect(store.getState().liveSession.error).toBe('AI service unavailable');
      expect(store.getState().liveSession.isLoading).toBe(false);
    });
  });
});