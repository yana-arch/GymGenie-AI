import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import LiveWorkoutSession from '../src/features/session/components/LiveWorkoutSession';
import liveSessionReducer, { updateEnergyContext, updateTimeContext, fetchWorkoutAdaptation } from '../src/features/session/store/liveSessionSlice';
import { AppContext } from '../src/context/AppContext';

// Mock dependencies
vi.mock('../src/features/workout/components/RestTimer', () => ({
  default: () => <div data-testid="rest-timer">Rest Timer</div>
}));

vi.mock('../src/features/workout/components/ExerciseDetailModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="exercise-modal"><button onClick={onClose}>Close</button></div> : null
}));

// Mock exercise registry and catalog service
vi.mock('@/data/ExerciseRegistry.json', () => ({
  default: []
}));

vi.mock('../src/features/workout/services/ExerciseCatalogService', () => ({
  exerciseCatalogService: {
    search: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({})
  }
}));

// Mock GeminiService
vi.mock('../src/services/ai/GeminiService', () => ({
  GeminiService: {
    getInstance: () => ({
      generateWorkoutAdaptation: vi.fn().mockResolvedValue({ newExercise: 'Easier Squats' })
    })
  }
}));

describe('LiveWorkoutSession Adaptation Triggers', () => {
  let store: any;
  const mockContextValue = {
    currentPlan: {
      id: 'plan-1',
      weeks: [{
        id: 'week-1',
        days: [{
          id: 'day-1',
          title: 'Leg Day',
          exercises: [{
            id: 'ex-1',
            name: 'Squats',
            sets: 3,
            reps: '10',
            restSeconds: 60
          }]
        }]
      }]
    },
    currentSession: {
      weekId: 'week-1',
      dayId: 'day-1',
      startTime: Date.now(),
      state: 'ACTIVE',
      exerciseData: {}
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
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        liveSession: liveSessionReducer
      }
    });
    // Spy on dispatch
    vi.spyOn(store, 'dispatch');
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <AppContext.Provider value={mockContextValue}>
          <LiveWorkoutSession />
        </AppContext.Provider>
      </Provider>
    );
  };

  test('should display adaptation trigger buttons', () => {
    renderComponent();
    
    expect(screen.getByText(/I'm Tired/i)).toBeInTheDocument();
    expect(screen.getByText(/Short on Time/i)).toBeInTheDocument();
  });

  test('should dispatch energy context update when "I\'m Tired" is clicked', () => {
    renderComponent();
    
    const tiredButton = screen.getByText(/I'm Tired/i);
    fireEvent.click(tiredButton);
    
    // check if updateEnergyContext was dispatched
    const actions = store.dispatch.mock.calls.map((call: any) => call[0]);
    const updateAction = actions.find((a: any) => a.type === updateEnergyContext.type);
    expect(updateAction).toEqual(updateEnergyContext('tired'));
    
    // check if fetchWorkoutAdaptation was dispatched
    // Note: fetchWorkoutAdaptation is an async thunk, so checking the type is a bit more complex
    // or we can just check if dispatch was called with a function (thunk)
    // Here we can check if the thunk action creator was called, but checking dispatch is better.
    // However, since we mock the store, we can verify the state change if we prefer,
    // or simpler: just check if the thunk pending action was dispatched.
    const pendingAction = actions.find((a: any) => a.type.includes('fetchWorkoutAdaptation/pending'));
    expect(pendingAction).toBeDefined();
  });

  test('should dispatch time context update when "Short on Time" is clicked', () => {
    renderComponent();
    
    const timeButton = screen.getByText(/Short on Time/i);
    fireEvent.click(timeButton);
    
    const actions = store.dispatch.mock.calls.map((call: any) => call[0]);
    const updateAction = actions.find((a: any) => a.type === updateTimeContext.type);
    expect(updateAction).toEqual(updateTimeContext('limited'));
    
    const pendingAction = actions.find((a: any) => a.type.includes('fetchWorkoutAdaptation/pending'));
    expect(pendingAction).toBeDefined();
  });
});
