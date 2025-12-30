import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { AppState, AppStep, UserProfile, WorkoutPlan } from '../types';
import { StorageService } from '../services/storageService';

interface AppContextType extends AppState {
  setUser: (user: UserProfile) => void;
  setEquipment: (equipment: string[]) => void;
  setPlan: (plan: WorkoutPlan) => void;
  setStep: (step: AppStep) => void;
  setLoading: (loading: boolean) => void;
  toggleExercise: (exerciseId: string) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [equipment, setEquipmentState] = useState<string[]>([]);
  const [currentPlan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [step, setStepState] = useState<AppStep>('onboarding');
  const [isLoading, setLoading] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const savedUser = StorageService.getUser();
    const savedEq = StorageService.getEquipment();
    const savedPlan = StorageService.getPlan();
    const savedStep = StorageService.getStep() as AppStep | null;

    if (savedUser) setUserState(savedUser);
    if (savedEq) setEquipmentState(savedEq);
    if (savedPlan) setPlanState(savedPlan);
    if (savedStep) setStepState(savedStep);
  }, []);

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

  const resetApp = () => {
    StorageService.clearAll();
    setUserState(null);
    setEquipmentState([]);
    setPlanState(null);
    setStepState('onboarding');
  };

  return (
    <AppContext.Provider value={{
      user, equipment, currentPlan, step, isLoading,
      setUser, setEquipment, setPlan, setStep, setLoading, toggleExercise, resetApp
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