import { useSelector, shallowEqual } from 'react-redux';
import { useMemo, useRef, useCallback } from 'react';
import { RootState } from '@/store';

/**
 * Custom hook for selective state subscriptions to minimize re-renders
 * Only subscribes to specific parts of the state tree
 */

// Session-specific selectors
export const useSessionState = () => {
  return useSelector((state: RootState) => ({
    currentSession: state.session.currentSession,
    showStaleSessionModal: state.session.showStaleSessionModal,
  }), shallowEqual);
};

export const useCurrentSession = () => {
  return useSelector((state: RootState) => state.session.currentSession);
};

export const useSessionById = (weekId: string, dayId: string) => {
  return useSelector((state: RootState) => {
    const sessionKey = `${weekId}-${dayId}`;
    return state.session.sessions[sessionKey] || null;
  });
};

export const useAllSessions = () => {
  return useSelector((state: RootState) => state.session.sessions, shallowEqual);
};

// Workout-specific selectors
export const useWorkoutPlan = () => {
  return useSelector((state: RootState) => state.workout.currentPlan);
};

export const useWorkoutHistory = () => {
  return useSelector((state: RootState) => state.workout.history, shallowEqual);
};

export const useWorkoutLoading = () => {
  return useSelector((state: RootState) => state.workout.isLoading);
};

export const useExerciseTimestamps = () => {
  return useSelector((state: RootState) => state.workout.exerciseTimestamps, shallowEqual);
};

// Specific exercise selector to avoid re-renders when other exercises change
export const useExerciseById = (exerciseId: string) => {
  return useSelector((state: RootState) => {
    if (!state.workout.currentPlan) return null;
    
    for (const week of state.workout.currentPlan.weeks) {
      for (const day of week.days) {
        const exercise = day.exercises.find(e => e.id === exerciseId);
        if (exercise) {
          return {
            exercise,
            weekId: week.id,
            dayId: day.id,
            timestamp: state.workout.exerciseTimestamps[exerciseId]
          };
        }
      }
    }
    return null;
  });
};

// Day-specific selector to avoid re-renders when other days change
export const useDayById = (weekId: string, dayId: string) => {
  return useSelector((state: RootState) => {
    if (!state.workout.currentPlan) return null;
    
    const week = state.workout.currentPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    
    if (!day) return null;
    
    return {
      day,
      week,
      exerciseTimestamps: state.workout.exerciseTimestamps
    };
  }, shallowEqual);
};

// UI-specific selectors
export const useUILoading = () => {
  return useSelector((state: RootState) => state.ui.loading, shallowEqual);
};

export const useUIModals = () => {
  return useSelector((state: RootState) => state.ui.modals, shallowEqual);
};

export const useUINavigation = () => {
  return useSelector((state: RootState) => state.ui.navigation, shallowEqual);
};

export const useUILayout = () => {
  return useSelector((state: RootState) => state.ui.layout, shallowEqual);
};

export const useUITimer = () => {
  return useSelector((state: RootState) => ({
    timerSeconds: state.ui.timerSeconds,
    isTimerRunning: state.ui.isTimerRunning,
  }), shallowEqual);
};

export const useUINotifications = () => {
  return useSelector((state: RootState) => state.ui.notifications, shallowEqual);
};

// Specific modal selector to avoid re-renders when other modals change
export const useModalState = (modalName: keyof RootState['ui']['modals']) => {
  return useSelector((state: RootState) => state.ui.modals[modalName]);
};

// Specific loading selector to avoid re-renders when other loading states change
export const useLoadingState = (loadingKey: keyof RootState['ui']['loading']) => {
  return useSelector((state: RootState) => state.ui.loading[loadingKey]);
};

// User-specific selectors
export const useUserProfile = () => {
  return useSelector((state: RootState) => state.user.profile, shallowEqual);
};

export const useUserSettings = () => {
  return useSelector((state: RootState) => state.user.preferences, shallowEqual);
};

export const useUserEquipment = () => {
  return useSelector((state: RootState) => state.user.equipment, shallowEqual);
};

/**
 * Advanced selector hook with memoization and equality checking
 * Prevents unnecessary re-renders by using custom equality functions
 */
export const useOptimizedSelector = <T>(
  selector: (state: RootState) => T,
  equalityFn?: (left: T, right: T) => boolean
) => {
  const equalityFunction = equalityFn || shallowEqual;
  return useSelector(selector, equalityFunction);
};

/**
 * Hook for creating memoized selectors with dependencies
 * Useful for complex derived state that depends on multiple state slices
 */
export const useMemoizedSelector = <T, D extends readonly unknown[]>(
  selector: (state: RootState) => T,
  deps: D,
  equalityFn?: (left: T, right: T) => boolean
) => {
  const memoizedSelector = useMemo(() => selector, deps);
  return useSelector(memoizedSelector, equalityFn || shallowEqual);
};

/**
 * Hook for batched state updates to minimize re-renders
 * Groups multiple state selections into a single subscription
 */
export const useBatchedSelectors = <T extends Record<string, any>>(
  selectors: { [K in keyof T]: (state: RootState) => T[K] }
) => {
  return useSelector((state: RootState) => {
    const result = {} as T;
    for (const [key, selector] of Object.entries(selectors)) {
      result[key as keyof T] = selector(state);
    }
    return result;
  }, shallowEqual);
};

/**
 * Hook for conditional state subscriptions
 * Only subscribes to state when condition is met
 */
export const useConditionalSelector = <T>(
  selector: (state: RootState) => T,
  condition: boolean,
  fallbackValue: T
) => {
  return useSelector((state: RootState) => {
    return condition ? selector(state) : fallbackValue;
  }, shallowEqual);
};

/**
 * Hook for tracking state changes and preventing unnecessary renders
 * Useful for debugging performance issues
 */
export const useStateChangeTracker = <T>(
  selector: (state: RootState) => T,
  name: string
) => {
  const previousValue = useRef<T | undefined>(undefined);
  const renderCount = useRef(0);
  
  const currentValue = useSelector(selector, shallowEqual);
  
  const hasChanged = previousValue.current !== currentValue;
  
  if (hasChanged) {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[StateTracker] ${name} changed:`, {
        previous: previousValue.current,
        current: currentValue,
        renderCount: renderCount.current
      });
    }
    previousValue.current = currentValue;
  }
  
  return currentValue;
};