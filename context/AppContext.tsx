import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useRef } from 'react';
import { AppState, AppStep, UserProfile, WorkoutPlan, WorkoutDay, WorkoutHistoryEntry, Exercise, WorkoutAnalysis } from '../types';
import { StorageService } from '../services/storageService';

interface AppContextType extends AppState {
  setUser: (user: UserProfile) => void;
  setEquipment: (equipment: string[]) => void;
  setPlan: (plan: WorkoutPlan) => void;
  setStep: (step: AppStep) => void;
  setLoading: (loading: boolean) => void;
  toggleExercise: (exerciseId: string) => void;
  updateDayInPlan: (weekId: string, updatedDay: WorkoutDay) => void;
  logWorkout: (weekId: string, dayId: string, rpe: number, analysis?: WorkoutAnalysis) => void;
  resetApp: () => void;
  
  // Timer related
  timerSeconds: number;
  isTimerRunning: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  addTimerSeconds: (seconds: number) => void;

  // Reorder & Swap
  moveExercise: (weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down') => void;
  replaceExerciseInPlan: (weekId: string, dayId: string, oldExerciseId: string, newExerciseData: Omit<Exercise, 'id' | 'isCompleted'>) => void;

  // Session Tracking
  sessionStartTime: number | null;
  exerciseTimestamps: Record<string, number>; // exerciseId -> timestamp
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [equipment, setEquipmentState] = useState<string[]>([]);
  const [currentPlan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [step, setStepState] = useState<AppStep>('onboarding');
  const [history, setHistoryState] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoading, setLoading] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Session Tracking State
  // We keep this in memory (or potentially session storage) to track the current active workout
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [exerciseTimestamps, setExerciseTimestamps] = useState<Record<string, number>>({});

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

  // Sync Logic
  useEffect(() => {
    const sync = async () => {
      if (typeof navigator === 'undefined' || !navigator.onLine) return;
      
      const pendingItems = history.filter(h => h.syncStatus === 'pending');
      if (pendingItems.length === 0) return;

      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
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
    window.addEventListener('online', handleOnline);
    sync();

    return () => window.removeEventListener('online', handleOnline);
  }, [history]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            playTimerSound();
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  const playTimerSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const stopRestTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const addTimerSeconds = (seconds: number) => {
    setTimerSeconds(prev => prev + seconds);
  };

  // State Setters
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

  // Actions
  const toggleExercise = (id: string) => {
    if (!currentPlan) return;
    const now = Date.now();

    // Start session if not started
    if (!sessionStartTime) {
        setSessionStartTime(now);
    }

    const newPlan = { ...currentPlan };
    let found = false;
    let exerciseRef = null;

    for (const week of newPlan.weeks) {
      for (const day of week.days) {
        const exercise = day.exercises.find(e => e.id === id);
        if (exercise) {
          exercise.isCompleted = !exercise.isCompleted;
          exerciseRef = exercise;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found && exerciseRef) {
      setPlan(newPlan);
      
      if (exerciseRef.isCompleted) {
        // Record timestamp
        setExerciseTimestamps(prev => ({ ...prev, [id]: now }));
        startRestTimer(exerciseRef.restSeconds || 60);
      } else {
        // Remove timestamp if unchecked
        setExerciseTimestamps(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
      }
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

  const moveExercise = (weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down') => {
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
  };

  const replaceExerciseInPlan = (weekId: string, dayId: string, oldExerciseId: string, newExerciseData: Omit<Exercise, 'id' | 'isCompleted'>) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };

    const week = newPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    
    if (!day) return;

    const index = day.exercises.findIndex(e => e.id === oldExerciseId);
    if (index === -1) return;

    const newExercise: Exercise = {
      ...newExerciseData,
      id: crypto.randomUUID(),
      isCompleted: false
    };

    day.exercises[index] = newExercise;
    setPlan(newPlan);
  };

  const logWorkout = (weekId: string, dayId: string, rpe: number, analysis?: WorkoutAnalysis) => {
    if (!currentPlan) return;
    const week = currentPlan.weeks.find(w => w.id === weekId);
    const day = week?.days.find(d => d.id === dayId);
    if (!week || !day) return;

    const completedCount = day.exercises.filter(e => e.isCompleted).length;
    
    // Calculate final duration
    const endTime = Date.now();
    const startTime = sessionStartTime || endTime;
    const durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));

    const entry: WorkoutHistoryEntry = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      planTitle: currentPlan.title,
      weekNumber: week.weekNumber,
      dayName: day.dayName,
      dayTitle: day.title,
      exercisesCompleted: completedCount,
      totalExercises: day.exercises.length,
      durationMinutes,
      rpe,
      analysis,
      syncStatus: 'pending'
    };

    const newHistory = [entry, ...history];
    setHistoryState(newHistory);
    StorageService.saveHistory(newHistory);
    stopRestTimer();
    
    // Reset Session Stats
    setSessionStartTime(null);
    setExerciseTimestamps({});
  };

  const resetApp = () => {
    StorageService.clearAll();
    setUserState(null);
    setEquipmentState([]);
    setPlanState(null);
    setStepState('onboarding');
    setHistoryState([]);
    stopRestTimer();
    setSessionStartTime(null);
    setExerciseTimestamps({});
  };

  return (
    <AppContext.Provider value={{
      user, equipment, currentPlan, step, isLoading, history,
      timerSeconds, isTimerRunning,
      setUser, setEquipment, setPlan, setStep, setLoading, toggleExercise, updateDayInPlan, logWorkout, resetApp,
      startRestTimer, stopRestTimer, addTimerSeconds, moveExercise, replaceExerciseInPlan,
      sessionStartTime, exerciseTimestamps
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