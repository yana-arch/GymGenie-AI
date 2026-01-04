import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from 'react';
import { WorkoutPlan, WorkoutHistoryEntry, WorkoutDay } from '../types';
import { StorageService } from '@/services/storage/StorageService';

interface WorkoutContextType {
  currentPlan: WorkoutPlan | null;
  history: WorkoutHistoryEntry[];
  setPlan: (plan: WorkoutPlan) => void;
  setHistory: (history: WorkoutHistoryEntry[]) => void;
  updateDayInPlan: (weekId: string, updatedDay: WorkoutDay) => void;
  moveExercise: (weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down') => void;
  replaceExerciseInPlan: (weekId: string, dayId: string, oldExerciseId: string, newExerciseData: any) => void;
  resetWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: PropsWithChildren) => {
  const [currentPlan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [history, setHistoryState] = useState<WorkoutHistoryEntry[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const savedPlan = StorageService.getPlan();
    const savedHistory = StorageService.getHistory();

    if (savedPlan) setPlanState(savedPlan);
    if (savedHistory) setHistoryState(savedHistory);
  }, []);

  const setPlan = useCallback((p: WorkoutPlan) => {
    setPlanState(p);
    StorageService.savePlan(p);
  }, []);

  const setHistory = useCallback((h: WorkoutHistoryEntry[]) => {
    setHistoryState(h);
    StorageService.saveHistory(h);
  }, []);

  const updateDayInPlan = useCallback((weekId: string, updatedDay: WorkoutDay) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };

    const weekIndex = newPlan.weeks.findIndex(w => w.id === weekId);
    if (weekIndex === -1) return;

    const dayIndex = newPlan.weeks[weekIndex].days.findIndex(d => d.id === updatedDay.id);
    if (dayIndex !== -1) {
       newPlan.weeks[weekIndex].days[dayIndex] = updatedDay;
       setPlan(newPlan);
    }
  }, [currentPlan, setPlan]);

  const moveExercise = useCallback((weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down') => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };

    const week = newPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);

    if (!day) return;

    const index = day.exercises.findIndex(e => e.id === exerciseId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      // Swap with previous
      const temp = day.exercises[index];
      day.exercises[index] = day.exercises[index - 1];
      day.exercises[index - 1] = temp;
      setPlan(newPlan);
    } else if (direction === 'down' && index < day.exercises.length - 1) {
      // Swap with next
      const temp = day.exercises[index];
      day.exercises[index] = day.exercises[index + 1];
      day.exercises[index + 1] = temp;
      setPlan(newPlan);
    }
  }, [currentPlan, setPlan]);

  const replaceExerciseInPlan = useCallback((weekId: string, dayId: string, oldExerciseId: string, newExerciseData: any) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };

    const week = newPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);

    if (!day) return;

    const index = day.exercises.findIndex(e => e.id === oldExerciseId);
    if (index === -1) return;

    const newExercise = {
      id: crypto.randomUUID(),
      name: newExerciseData.name,
      sets: 3, // Default sets
      reps: '10', // Default reps
      restSeconds: 60, // Default rest
      notes: '', // Default notes
      isCompleted: false
    };

    day.exercises[index] = newExercise;
    setPlan(newPlan);
  }, [currentPlan, setPlan]);

  const resetWorkout = useCallback(() => {
    localStorage.removeItem('gymgenie_plan');
    localStorage.removeItem('gymgenie_history');
    setPlanState(null);
    setHistoryState([]);
  }, []);

  const contextValue: WorkoutContextType = {
    currentPlan,
    history,
    setPlan,
    setHistory,
    updateDayInPlan,
    moveExercise,
    replaceExerciseInPlan,
    resetWorkout,
  };

  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout must be used within WorkoutProvider");
  return context;
};
