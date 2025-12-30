import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { AppState, AppStep, UserProfile, WorkoutPlan, WorkoutDay, WorkoutHistoryEntry } from '../types';
import { StorageService } from '../services/storageService';

interface AppContextType extends AppState {
  setUser: (user: UserProfile) => void;
  setEquipment: (equipment: string[]) => void;
  setPlan: (plan: WorkoutPlan) => void;
  setStep: (step: AppStep) => void;
  setLoading: (loading: boolean) => void;
  toggleExercise: (exerciseId: string) => void;
  updateDayInPlan: (weekId: string, updatedDay: WorkoutDay) => void;
  logWorkout: (weekId: string, dayId: string) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [equipment, setEquipmentState] = useState<string[]>([]);
  const [currentPlan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [step, setStepState] = useState<AppStep>('onboarding');
  const [history, setHistoryState] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoading, setLoading] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const savedUser = StorageService.getUser();
    const savedEq = StorageService.getEquipment();
    const savedPlan = StorageService.getPlan();
    const savedStep = StorageService.getStep() as AppStep | null;
    const savedHistory = StorageService.getHistory();

    if (savedUser) setUserState(savedUser);
    if (savedEq) setEquipmentState(savedEq);
    if (savedPlan) setPlanState(savedPlan);
    if (savedStep) setStepState(savedStep);
    if (savedHistory) setHistoryState(savedHistory);
  }, []);

  // Sync Logic: Watch for online status and pending items
  useEffect(() => {
    const sync = async () => {
      // Only proceed if browser reports online
      if (typeof navigator === 'undefined' || !navigator.onLine) return;
      
      const pendingItems = history.filter(h => h.syncStatus === 'pending');
      if (pendingItems.length === 0) return;

      try {
        console.log("Syncing pending items...", pendingItems.length);
        // Simulate Network/API Call Delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mark pending items as synced
        const updatedHistory = history.map(h => 
          h.syncStatus === 'pending' ? { ...h, syncStatus: 'synced' as const } : h
        );
        
        setHistoryState(updatedHistory);
        StorageService.saveHistory(updatedHistory);
      } catch (error) {
        console.error("Sync failed", error);
      }
    };

    const handleOnline = () => sync();
    
    // Listen for network recovery
    window.addEventListener('online', handleOnline);
    
    // Trigger sync check whenever history updates (e.g. new workout logged)
    sync();

    return () => window.removeEventListener('online', handleOnline);
  }, [history]);

  // Sync to storage
  const setUser = (u: UserProfile) => {
    setUserState(u);
    StorageService.saveUser(u);
  };

  const setEquipment = (eq: string[]) => {
    setEquipmentState(eq);
    StorageService.saveEquipment(eq);
  };

  const setPlan = (p: WorkoutPlan) => {
    setPlanState(p);
    StorageService.savePlan(p);
  };

  const setStep = (s: AppStep) => {
    setStepState(s);
    StorageService.saveStep(s);
  };

  const toggleExercise = (id: string) => {
    if (!currentPlan) return;

    // Deep clone to safely mutate
    const newPlan = { ...currentPlan };
    
    // Find and toggle the exercise
    let found = false;
    for (const week of newPlan.weeks) {
      for (const day of week.days) {
        const exercise = day.exercises.find(e => e.id === id);
        if (exercise) {
          exercise.isCompleted = !exercise.isCompleted;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      setPlan(newPlan); // Save updated plan
    }
  };

  const updateDayInPlan = (weekId: string, updatedDay: WorkoutDay) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };

    const weekIndex = newPlan.weeks.findIndex(w => w.id === weekId);
    if (weekIndex === -1) return;

    const dayIndex = newPlan.weeks[weekIndex].days.findIndex(d => d.id === updatedDay.id);
    if (dayIndex !== -1) {
       newPlan.weeks[weekIndex].days[dayIndex] = updatedDay;
       setPlan(newPlan);
    }
  };

  const logWorkout = (weekId: string, dayId: string) => {
    if (!currentPlan) return;
    const week = currentPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    if (!week || !day) return;

    const completedCount = day.exercises.filter(e => e.isCompleted).length;
    
    const entry: WorkoutHistoryEntry = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      planTitle: currentPlan.title,
      weekNumber: week.weekNumber,
      dayName: day.dayName,
      dayTitle: day.title,
      exercisesCompleted: completedCount,
      totalExercises: day.exercises.length,
      syncStatus: 'pending' // Initially pending, useEffect will pick this up
    };

    const newHistory = [entry, ...history];
    setHistoryState(newHistory);
    StorageService.saveHistory(newHistory);
  };

  const resetApp = () => {
    StorageService.clearAll();
    setUserState(null);
    setEquipmentState([]);
    setPlanState(null);
    setStepState('onboarding');
    setHistoryState([]);
  };

  return (
    <AppContext.Provider value={{
      user, equipment, currentPlan, step, isLoading, history,
      setUser, setEquipment, setPlan, setStep, setLoading, toggleExercise, updateDayInPlan, logWorkout, resetApp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};