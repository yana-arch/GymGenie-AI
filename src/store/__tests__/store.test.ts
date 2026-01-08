import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../index';
import { startSession, completeSession } from '@/features/session/store/sessionSlice';
import { setPlan, toggleExercise } from '@/features/workout/store/workoutSlice';
import { setProfile, setEquipment } from '@/features/user/store/userSlice';
import { startTimer, openModal } from '@/features/ui/store/uiSlice';
import { SessionState, Gender, FitnessGoal } from '@/types';

describe('Redux Store Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    store.dispatch({ type: '@@RESET' });
  });

  it('should have initial state for all slices', () => {
    const state = store.getState();
    
    expect(state.session.currentSession).toBeNull();
    expect(state.session.sessions).toEqual({});
    expect(state.workout.currentPlan).toBeNull();
    expect(state.workout.history).toEqual([]);
    expect(state.user.profile).toBeNull();
    expect(state.user.equipment).toEqual([]);
    expect(state.ui.timerSeconds).toBe(0);
    expect(state.ui.isTimerRunning).toBe(false);
  });

  it('should handle session actions', () => {
    // Start a session
    store.dispatch(startSession({ weekId: 'week1', dayId: 'day1' }));
    
    let state = store.getState();
    expect(state.session.currentSession).toBeTruthy();
    expect(state.session.currentSession?.state).toBe(SessionState.ACTIVE);
    expect(state.session.currentSession?.weekId).toBe('week1');
    expect(state.session.currentSession?.dayId).toBe('day1');
    
    // Complete the session
    store.dispatch(completeSession());
    
    state = store.getState();
    expect(state.session.currentSession?.state).toBe(SessionState.COMPLETED);
  });

  it('should handle workout actions', () => {
    const mockPlan = {
      id: 'plan1',
      title: 'Test Plan',
      description: 'A plan for testing',
      generatedAt: new Date().toISOString(),
      totalDurationWeeks: 1,
      weeks: [{
        id: 'week1',
        weekNumber: 1,
        focus: 'Hypertrophy',
        days: [{
          id: 'day1',
          dayName: 'Monday',
          title: 'Push Day',
          isRestDay: false,
          exercises: [{
            id: 'ex1',
            name: 'Push-ups',
            sets: 3,
            reps: '10',
            restSeconds: 60,
            isCompleted: false,
            notes: ''
          }]
        }]
      }]
    };

    store.dispatch(setPlan(mockPlan));
    
    let state = store.getState();
    expect(state.workout.currentPlan).toEqual(mockPlan);
    
    // Toggle exercise
    store.dispatch(toggleExercise({ exerciseId: 'ex1', timestamp: Date.now() }));
    
    state = store.getState();
    expect(state.workout.currentPlan?.weeks[0].days[0].exercises[0].isCompleted).toBe(true);
  });

  it('should handle user actions', () => {
    const mockProfile = {
      name: 'Test User',
      age: 25,
      heightCm: 180,
      weightKg: 80,
      gender: Gender.Male,
      goal: FitnessGoal.MuscleGain,
      fitnessLevel: 'intermediate' as const,
      workoutDays: 4,
      workoutDuration: 60,
      bmi: 24.7,
      tdee: 2500,
      injuries: ''
    };

    store.dispatch(setProfile(mockProfile));
    store.dispatch(setEquipment(['dumbbells', 'barbell']));
    
    const state = store.getState();
    expect(state.user.profile).toEqual(mockProfile);
    expect(state.user.equipment).toEqual(['dumbbells', 'barbell']);
  });

  it('should handle UI actions', () => {
    store.dispatch(startTimer(120));
    store.dispatch(openModal('exerciseDetail'));
    
    const state = store.getState();
    expect(state.ui.timerSeconds).toBe(120);
    expect(state.ui.isTimerRunning).toBe(true);
    expect(state.ui.modals.exerciseDetail).toBe(true);
  });

  it('should maintain state immutability', () => {
    const initialState = store.getState();
    
    store.dispatch(startSession({ weekId: 'week1', dayId: 'day1' }));
    
    const newState = store.getState();
    
    // States should be different objects (immutable)
    expect(initialState).not.toBe(newState);
    expect(initialState.session).not.toBe(newState.session);
  });
});