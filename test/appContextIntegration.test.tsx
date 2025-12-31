import React from 'react';
import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';
import { SessionState, WorkoutPlan, WorkoutWeek, WorkoutDay, Exercise } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component to access context
const TestComponent = ({ onContextReady }: { onContextReady: (context: any) => void }) => {
  const context = useApp();
  
  React.useEffect(() => {
    onContextReady(context);
  }, [context, onContextReady]);
  
  return <div>Test Component</div>;
};

describe('AppContext Session Integration', () => {
  let contextRef: any = null;
  
  const createMockWorkoutPlan = (): WorkoutPlan => ({
    id: 'plan1',
    title: 'Test Plan',
    description: 'Test Description',
    generatedAt: new Date().toISOString(),
    totalDurationWeeks: 4,
    weeks: [
      {
        id: 'week1',
        weekNumber: 1,
        focus: 'Test Week',
        days: [
          {
            id: 'day1',
            dayName: 'Monday',
            title: 'Upper Body',
            isRestDay: false,
            exercises: [
              {
                id: 'ex1',
                name: 'Push-ups',
                sets: 3,
                reps: '10-12',
                restSeconds: 60,
                notes: 'Test exercise',
                isCompleted: false
              },
              {
                id: 'ex2',
                name: 'Pull-ups',
                sets: 3,
                reps: '8-10',
                restSeconds: 90,
                notes: 'Test exercise 2',
                isCompleted: false
              }
            ]
          }
        ]
      }
    ]
  });

  beforeEach(() => {
    localStorageMock.clear();
    contextRef = null;
  });

  const renderWithProvider = () => {
    return render(
      <AppProvider>
        <TestComponent onContextReady={(context) => { contextRef = context; }} />
      </AppProvider>
    );
  };

  test('should initialize with no active session', async () => {
    renderWithProvider();
    
    await act(async () => {
      // Wait for context to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(contextRef).not.toBeNull();
    expect(contextRef.currentSession).toBeNull();
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.INACTIVE);
  });

  test('should start session when first exercise is toggled', async () => {
    renderWithProvider();
    
    await act(async () => {
      // Wait for context to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Set up a workout plan
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
    });
    
    // Toggle first exercise - should start session
    act(() => {
      contextRef.toggleExercise('ex1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(contextRef.currentSession).not.toBeNull();
    expect(contextRef.currentSession?.state).toBe(SessionState.ACTIVE);
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.ACTIVE);
  });

  test('should prevent exercise toggle in read-only mode', async () => {
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Set up a workout plan
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
    });
    
    // Start and complete a session
    act(() => {
      contextRef.startWorkoutSession('week1', 'day1');
      contextRef.completeWorkoutSession();
      contextRef.logWorkoutSession(8);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify session is logged and read-only
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.LOGGED);
    expect(contextRef.isWorkoutReadOnly('week1', 'day1')).toBe(true);
    expect(contextRef.canModifyExercise('ex1', 'week1', 'day1')).toBe(false);
    
    // Get initial exercise state
    const initialExerciseState = contextRef.currentPlan.weeks[0].days[0].exercises[0].isCompleted;
    
    // Try to toggle exercise - should not work
    act(() => {
      contextRef.toggleExercise('ex1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Exercise should remain unchanged
    expect(contextRef.currentPlan.weeks[0].days[0].exercises[0].isCompleted).toBe(initialExerciseState);
  });

  test('should integrate session timing with exercise timestamps', async () => {
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Set up a workout plan
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
    });
    
    // Verify plan is set correctly
    expect(contextRef.currentPlan).not.toBeNull();
    expect(contextRef.currentPlan?.weeks[0].days[0].exercises[0].id).toBe('ex1');
    expect(contextRef.currentPlan?.weeks[0].days[0].exercises[0].isCompleted).toBe(false);
    
    const startTime = Date.now();
    
    // Toggle exercise to start session
    act(() => {
      contextRef.toggleExercise('ex1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // Check that the exercise was actually toggled
    expect(contextRef.currentPlan.weeks[0].days[0].exercises[0].isCompleted).toBe(true);
    
    // If exercise was toggled, check session and timestamps
    if (contextRef.currentPlan.weeks[0].days[0].exercises[0].isCompleted) {
      // Check that session has started
      expect(contextRef.currentSession).not.toBeNull();
      expect(contextRef.currentSession?.startTime).toBeGreaterThanOrEqual(startTime);
      
      // Check exercise timestamps
      expect(contextRef.exerciseTimestamps['ex1']).toBeDefined();
      expect(contextRef.exerciseTimestamps['ex1']).toBeGreaterThanOrEqual(startTime);
      
      // Check that session manager also has the timestamp
      const session = contextRef.sessionManager.getSessionForDay('week1', 'day1');
      expect(session?.exerciseTimestamps['ex1']).toBeDefined();
      expect(session?.exerciseTimestamps['ex1']).toBeGreaterThanOrEqual(startTime);
    }
  });

  test('should handle session lifecycle through workout completion', async () => {
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Set up a workout plan
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
    });
    
    // Start session by toggling exercise
    act(() => {
      contextRef.toggleExercise('ex1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.ACTIVE);
    
    // Complete workout through logWorkout (should complete and log session)
    act(() => {
      contextRef.logWorkout('week1', 'day1', 7);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Session should be logged and no longer active
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.LOGGED);
    expect(contextRef.currentSession).toBeNull();
    expect(contextRef.isWorkoutReadOnly('week1', 'day1')).toBe(true);
  });

  test('should handle session abandonment', async () => {
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Set up a workout plan
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
    });
    
    // Start session
    act(() => {
      contextRef.startWorkoutSession('week1', 'day1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(contextRef.currentSession).not.toBeNull();
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.ACTIVE);
    
    // Abandon session
    act(() => {
      contextRef.abandonWorkoutSession();
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Session should be gone
    expect(contextRef.currentSession).toBeNull();
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.INACTIVE);
  });

  test('should persist session across app restart', async () => {
    // First render - start a session
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    act(() => {
      contextRef.setPlan(createMockWorkoutPlan());
      contextRef.startWorkoutSession('week1', 'day1');
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(contextRef.currentSession).not.toBeNull();
    
    // Simulate app restart by creating new provider
    contextRef = null;
    renderWithProvider();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Session should be restored
    expect(contextRef.getSessionState('week1', 'day1')).toBe(SessionState.ACTIVE);
  });
});