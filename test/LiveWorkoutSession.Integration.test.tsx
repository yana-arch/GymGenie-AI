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

given('a LiveWorkoutSession component with integration testing setup', () => {
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
    vi.spyOn(store, 'dispatch');
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <ToastProvider>
          <AppContext.Provider value={mockContextValue}>
            <LiveWorkoutSession />
          </AppContext.Provider>
        </ToastProvider>
      </Provider>
    );
  };

  describe('WHEN session state validation occurs', () => {
    when('adaptation is triggered without proper state', () => {
      then(createSessionTest(6, 'should validate session state before allowing adaptations'), async () => {
        // Mock GeminiService to test validation
        vi.mock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => ({
              generateWorkoutAdaptation: vi.fn()
            })
          }
        }));

        renderComponent();
        
        // Try to trigger adaptation without setting tired/limited state first
        const tiredButton = screen.getByText(/I'm Tired/i);
        fireEvent.click(tiredButton);
        
        // Wait for async operations
        await waitFor(() => {
          const actions = store.dispatch.mock.calls.flat();
          const hasErrorAction = actions.some((action: any) => 
            action.type === 'fetchWorkoutAdaptation/rejected' &&
            action.payload?.error?.includes('must be in tired or limited time state')
          );
          expect(hasErrorAction).toBe(true);
        });
      });
    });
  });

  describe('WHEN SLA requirements are enforced', () => {
    when('AI response time breaches SLA', () => {
      then(createSessionTest(7, 'should handle SLA breach with fallback adaptation'), async () => {
        // Mock slow AI response that breaches SLA
        vi.mock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => ({
              generateWorkoutAdaptation: vi.fn().mockImplementation(async () => {
                // Simulate slow response that breaches 2-second SLA
                await new Promise(resolve => setTimeout(resolve, 2500));
                return { newReps: 6, notes: "Test adaptation" };
              })
            })
          }
        }));

        renderComponent();
        
        const tiredButton = screen.getByText(/I'm Tired/i);
        fireEvent.click(tiredButton);
        
        // Wait for fallback adaptation due to SLA breach
        await waitFor(() => {
          const actions = store.dispatch.mock.calls.flat();
          const fulfilledAction = actions.find((action: any) => action.type === 'fetchWorkoutAdaptation/fulfilled');
          expect(fulfilledAction).toBeDefined();
          expect(fulfilledAction.payload.slaBreach).toBe(true);
          // Should be conservative fallback when SLA breached
          expect(fulfilledAction.payload.adaptation.newReps).toBeLessThanOrEqual(8);
        }, { timeout: 5000 });
      });
    });
  });

  describe('WHEN privacy protection is applied', () => {
    when('override history is processed for AI', () => {
      then(createSessionTest(8, 'should apply privacy protection to override history'), async () => {
        const mockGeminiService = {
          generateWorkoutAdaptation: vi.fn().mockResolvedValue({ newReps: 8, notes: "Privacy-safe adaptation" })
        };

        vi.mock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => mockGeminiService
          }
        }));

        renderComponent();
        
        const tiredButton = screen.getByText(/I'm Tired/i);
        fireEvent.click(tiredButton);
        
        // Wait for the AI service call
        await waitFor(() => {
          expect(mockGeminiService.generateWorkoutAdaptation).toHaveBeenCalled();
          const callArgs = mockGeminiService.generateWorkoutAdaptation.mock.calls[0][0];
          
          // Verify override history is privacy-protected
          if (callArgs.overrideHistory && callArgs.overrideHistory.length > 0) {
            const overrideEntry = callArgs.overrideHistory[0];
            // Should not have exact timestamps for privacy
            expect(overrideEntry.timestamp).toBeUndefined();
            // Should have privacy-protected time buckets or relative times
            expect(overrideEntry.relativeTime || overrideEntry.timeBucket).toBeDefined();
          }
        });
      });
    });
  });

  describe('WHEN UI components are rendered', () => {
    when('the component loads', () => {
      then(createSessionTest(9, 'should display adaptation trigger buttons'), () => {
        renderComponent();
        
        expect(screen.getByText(/I'm Tired/i)).toBeInTheDocument();
        expect(screen.getByText(/Short on Time/i)).toBeInTheDocument();
      });
    });
  });

  describe('WHEN performance monitoring is integrated', () => {
    when('adaptation processing occurs', () => {
      then(createSessionTest(10, 'should handle performance monitoring integration'), async () => {
        const mockPerformanceService = {
          startMonitoring: vi.fn().mockReturnValue({ monitoringId: 'test-123', startTime: Date.now() }),
          endMonitoring: vi.fn()
        };

        vi.mock('../src/services/performance/PerformanceMonitoringService', () => ({
          performanceMonitoringService: mockPerformanceService
        }));

        vi.mock('../src/services/ai/GeminiService', () => ({
          GeminiService: {
            getInstance: () => ({
              generateWorkoutAdaptation: vi.fn().mockResolvedValue({ newReps: 8 })
            })
          }
        }));

        renderComponent();
        
        const tiredButton = screen.getByText(/I'm Tired/i);
        fireEvent.click(tiredButton);
        
        // Wait for performance monitoring to be called
        await waitFor(() => {
          expect(mockPerformanceService.startMonitoring).toHaveBeenCalledWith(
            'GeminiService.generateWorkoutAdaptation',
            'generateWorkoutAdaptation',
            expect.any(Number)
          );
        });
      });
    });
  });
});