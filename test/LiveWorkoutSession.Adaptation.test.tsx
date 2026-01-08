import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import LiveWorkoutSession from '../src/features/session/components/LiveWorkoutSession';
import liveSessionReducer, { updateEnergyContext, updateTimeContext, fetchWorkoutAdaptation } from '../src/features/session/store/liveSessionSlice';
import { AppContext } from '../src/context/AppContext';
import { ToastProvider } from '../src/components/ui/Toast';
import { given, when, then, and, createSessionTest } from '../src/test-utils';

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
      generateWorkoutAdaptation: vi.fn().mockResolvedValue({ newReps: 8, notes: 'Reduced intensity for tired state' })
    })
  }
}));

// Mock useAppDispatch and useAppSelector
vi.mock('../src/store', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: vi.fn(() => ({
    adaptation: null,
    isLoading: false,
    error: null,
    performance: {},
    activeContext: { energy: 'normal', time: 'normal', equipmentStatus: 'available' },
    overrideHistory: []
  }))
}));

// Mock error handler
vi.mock('../src/utils/errorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    handleAsyncError: vi.fn().mockResolvedValue(true)
  }),
  createApiError: vi.fn(),
  createCameraError: vi.fn(),
  createNetworkError: vi.fn()
}));

// Mock navigator.mediaDevices to prevent camera setup hanging
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockRejectedValue(new Error('Camera not available in test'))
  },
  writable: true
});

given('a LiveWorkoutSession component is rendered with valid context', () => {
  let store: any;
  const mockContextValue = {
    // Basic state
    user: null as any,
    equipment: [] as string[],
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
    } as any,
    step: 'workout' as any,
    isLoading: false,
    history: [] as any[],
    activeView: 'home' as any,

    // Timer state
    timerSeconds: 0,
    isTimerRunning: false,

    // Setters
    setUser: vi.fn(),
    setEquipment: vi.fn(),
    setPlan: vi.fn(),
    setStep: vi.fn(),
    setLoading: vi.fn(),
    setActiveView: vi.fn(),

    // Exercise actions
    toggleExercise: vi.fn(),
    updateDayInPlan: vi.fn(),
    moveExercise: vi.fn(),
    replaceExerciseInPlan: vi.fn(),

    // Timer functions
    startRestTimer: vi.fn(),
    stopRestTimer: vi.fn(),
    addTimerSeconds: vi.fn(),

    // Session tracking
    sessionStartTime: null as any,
    exerciseTimestamps: {} as Record<string, number>,

    // Session management
    sessionManager: {
      currentSession: {
        id: 'session-1',
        weekId: 'week-1',
        dayId: 'day-1',
        startTime: Date.now(),
        state: 'ACTIVE' as any,
        completedTime: null,
        loggedTime: null,
        exerciseTimestamps: {},
        isReadOnly: false,
        exerciseData: {}
      } as any,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      logSession: vi.fn(),
      abandonSession: vi.fn(),
      getSessionForDay: vi.fn(),
      isSessionActive: vi.fn(),
      isSessionReadOnly: vi.fn(),
      addSet: vi.fn()
    },
    currentSession: {
      id: 'session-1',
      weekId: 'week-1',
      dayId: 'day-1',
      startTime: Date.now(),
      state: 'ACTIVE' as any,
      completedTime: null,
      loggedTime: null,
      exerciseTimestamps: {},
      isReadOnly: false,
      exerciseData: {}
    } as any,

    // Session actions
    startWorkoutSession: vi.fn(),
    completeWorkoutSession: vi.fn(),
    logWorkoutSession: vi.fn(),
    abandonWorkoutSession: vi.fn(),
    addSetToSession: vi.fn(),

    // Workout actions
    logWorkout: vi.fn(),
    resetApp: vi.fn(),

    // Utility functions
    isWorkoutReadOnly: vi.fn(),
    canModifyExercise: vi.fn(),
    getSessionState: vi.fn()
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

  then(createSessionTest(1, 'should have valid mock context that matches AppContextType'), () => {
    // This test verifies that the mock context value has all required properties
    // and matches AppContextType interface without TypeScript errors
    expect(mockContextValue).toBeDefined();
    expect(mockContextValue.currentPlan).toBeDefined();
    expect(mockContextValue.currentSession).toBeDefined();
    expect(mockContextValue.sessionManager).toBeDefined();
    expect(typeof mockContextValue.setUser).toBe('function');
    expect(typeof mockContextValue.logWorkout).toBe('function');
  });

  describe('WHEN user clicks adaptation buttons', () => {
    when('the "I\'m Tired" button is clicked', () => {
      then(createSessionTest(2, 'should trigger adaptation by updating energy context'), async () => {
        render(
          <Provider store={store}>
            <AppContext.Provider value={mockContextValue}>
              <ToastProvider>
                <LiveWorkoutSession />
              </ToastProvider>
            </AppContext.Provider>
          </Provider>
        );

        // Find and click "I'm Tired" button
        const tiredButton = screen.getByText('I\'m Tired');
        expect(tiredButton).toBeInTheDocument();

        fireEvent.click(tiredButton);

        // Verify that energy context was updated
        expect(store.dispatch).toHaveBeenCalledWith(updateEnergyContext('tired'));
      });
    });

    when('the "Short on Time" button is clicked', () => {
      then(createSessionTest(3, 'should trigger adaptation by updating time context'), async () => {
        render(
          <Provider store={store}>
            <AppContext.Provider value={mockContextValue}>
              <ToastProvider>
                <LiveWorkoutSession />
              </ToastProvider>
            </AppContext.Provider>
          </Provider>
        );

        // Find and click "Short on Time" button
        const timeButton = screen.getByText('Short on Time');
        expect(timeButton).toBeInTheDocument();

        fireEvent.click(timeButton);

        // Verify that time context was updated
        expect(store.dispatch).toHaveBeenCalledWith(updateTimeContext('limited'));
      });
    });
  });

  describe('WHEN AI processing occurs', () => {
    when('the AI service responds slowly', () => {
      then(createSessionTest(4, 'should show loading state during AI processing'), async () => {
        // Mock a delayed response
        vi.doMock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => ({
              generateWorkoutAdaptation: vi.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ newReps: 8 }), 1000))
              )
            })
          }
        }));

        render(
          <Provider store={store}>
            <AppContext.Provider value={mockContextValue}>
              <ToastProvider>
                <LiveWorkoutSession />
              </ToastProvider>
            </AppContext.Provider>
          </Provider>
        );

        const tiredButton = screen.getByText('I\'m Tired');
        fireEvent.click(tiredButton);

        // Should show loading state
        await waitFor(() => {
          expect(screen.getByText(/Analyzing your request\.\.\./)).toBeInTheDocument();
        });
      });
    });

    when('the AI service responds with adaptation', () => {
      then(createSessionTest(5, 'should display adaptation proposal when AI response is received'), async () => {
        const mockAdaptation = { newReps: 8, notes: 'Reduced intensity for tired state' };
        
        vi.doMock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => ({
              generateWorkoutAdaptation: vi.fn().mockResolvedValue(mockAdaptation)
            })
          }
        }));

        render(
          <Provider store={store}>
            <AppContext.Provider value={mockContextValue}>
              <ToastProvider>
                <LiveWorkoutSession />
              </ToastProvider>
            </AppContext.Provider>
          </Provider>
        );

        const tiredButton = screen.getByText('I\'m Tired');
        fireEvent.click(tiredButton);

        // Should show adaptation proposal
        await waitFor(() => {
          expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
          expect(screen.getByText('8')).toBeInTheDocument(); // New reps value
          expect(screen.getByText(mockAdaptation.notes)).toBeInTheDocument();
        });
      });
    });
  });
});