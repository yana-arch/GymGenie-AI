import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useRef } from 'react';
import { AppState, AppStep, UserProfile, WorkoutPlan, WorkoutDay, WorkoutHistoryEntry, Exercise, WorkoutAnalysis, AppContextType, SessionStateManager as ISessionStateManager, WorkoutSession, SessionState, SessionStorageData } from '../types';
import { StorageService } from '../services/storageService';
import { SessionStateManager } from '../services/sessionStateManager';
import StaleSessionModal from '../components/StaleSessionModal';

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

  // Session Tracking State - now managed by SessionStateManager
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [exerciseTimestamps, setExerciseTimestamps] = useState<Record<string, number>>({});

  // Initialize actual session manager
  const [sessionManagerInstance] = useState(() => new SessionStateManager());
  
  // Stale session handling
  const [staleSessionData, setStaleSessionData] = useState<SessionStorageData | null>(null);
  const [showStaleSessionModal, setShowStaleSessionModal] = useState(false);
  
  // Keep currentSession in sync with sessionManager
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(() => 
    sessionManagerInstance.currentSession
  );

  // Update currentSession whenever sessionManager changes
  useEffect(() => {
    const updateCurrentSession = () => {
      const newSession = sessionManagerInstance.currentSession;
      setCurrentSession(newSession);
      
      // Sync legacy session tracking with new session management
      if (newSession) {
        setSessionStartTime(newSession.startTime);
        setExerciseTimestamps(newSession.exerciseTimestamps);
      } else {
        setSessionStartTime(null);
        setExerciseTimestamps({});
      }
    };

    // Initial sync
    updateCurrentSession();
    
    // Set up a periodic check to keep in sync (simple approach)
    const interval = setInterval(updateCurrentSession, 1000);
    
    // Set up stale session listener
    const unsubscribeStaleSession = sessionManagerInstance.onStaleSession((data) => {
      console.log('Stale session detected, showing modal');
      setStaleSessionData(data);
      setShowStaleSessionModal(true);
    });
    
    return () => {
      clearInterval(interval);
      unsubscribeStaleSession();
    };
  }, [sessionManagerInstance]);
  
  // Session manager interface implementation
  const sessionManager: ISessionStateManager = {
    get currentSession() {
      return sessionManagerInstance.currentSession;
    },
    startSession: (weekId: string, dayId: string) => {
      try {
        sessionManagerInstance.startSession(weekId, dayId);
        // Force immediate sync
        const newSession = sessionManagerInstance.currentSession;
        setCurrentSession(newSession);
        if (newSession) {
          setSessionStartTime(newSession.startTime);
          setExerciseTimestamps(newSession.exerciseTimestamps);
        }
      } catch (error) {
        console.error('Failed to start session:', error);
        throw error;
      }
    },
    completeSession: () => {
      try {
        sessionManagerInstance.completeSession();
        // Force immediate sync
        const newSession = sessionManagerInstance.currentSession;
        setCurrentSession(newSession);
      } catch (error) {
        console.error('Failed to complete session:', error);
        throw error;
      }
    },
    logSession: (rpe: number, analysis?: WorkoutAnalysis) => {
      try {
        sessionManagerInstance.logSession(rpe, analysis);
        // Force immediate sync
        const newSession = sessionManagerInstance.currentSession;
        setCurrentSession(newSession);
        if (!newSession) {
          // Session was cleared after logging
          setSessionStartTime(null);
          setExerciseTimestamps({});
        }
      } catch (error) {
        console.error('Failed to log session:', error);
        throw error;
      }
    },
    abandonSession: () => {
      try {
        sessionManagerInstance.abandonSession();
        // Force immediate sync
        const newSession = sessionManagerInstance.currentSession;
        setCurrentSession(newSession);
        if (!newSession) {
          setSessionStartTime(null);
          setExerciseTimestamps({});
        }
      } catch (error) {
        console.error('Failed to abandon session:', error);
        throw error;
      }
    },
    getSessionForDay: (weekId: string, dayId: string) => {
      return sessionManagerInstance.getSessionForDay(weekId, dayId);
    },
    isSessionActive: (weekId: string, dayId: string) => {
      return sessionManagerInstance.isSessionActive(weekId, dayId);
    },
    isSessionReadOnly: (weekId: string, dayId: string) => {
      return sessionManagerInstance.isSessionReadOnly(weekId, dayId);
    },
  };

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

  // Helper function to find current workout day
  const getCurrentWorkoutDay = (): { weekId: string; dayId: string } | null => {
    if (!currentPlan) return null;
    
    // For now, we'll use a simple approach - return the first non-rest day
    // In a real app, this might be based on user selection or current date
    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        if (!day.isRestDay) {
          return { weekId: week.id, dayId: day.id };
        }
      }
    }
    
    return null;
  };

  // Helper function to find the workout day for a specific exercise
  const getWorkoutDayForExercise = (exerciseId: string): { weekId: string; dayId: string } | null => {
    if (!currentPlan) return null;
    
    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        if (day.exercises.some(e => e.id === exerciseId)) {
          return { weekId: week.id, dayId: day.id };
        }
      }
    }
    
    return null;
  };

  // Helper function to check if we should start a session
  const shouldStartSession = (exerciseId: string): boolean => {
    const exerciseDay = getWorkoutDayForExercise(exerciseId);
    if (!exerciseDay) return false;
    
    // Don't start if already have an active session
    if (sessionManager.isSessionActive(exerciseDay.weekId, exerciseDay.dayId)) {
      return false;
    }
    
    // Don't start if workout is read-only
    if (sessionManager.isSessionReadOnly(exerciseDay.weekId, exerciseDay.dayId)) {
      return false;
    }
    
    return true;
  };
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
  const toggleExercise = (id: string): boolean => {
    if (!currentPlan) {
      console.warn('No workout plan available');
      return false;
    }
    
    // Find the specific day for this exercise
    const exerciseDay = getWorkoutDayForExercise(id);
    if (!exerciseDay) {
      console.warn('Exercise not found in workout plan');
      return false;
    }
    
    // Check if workout is read-only
    if (sessionManager.isSessionReadOnly(exerciseDay.weekId, exerciseDay.dayId)) {
      console.warn('Cannot modify exercises in read-only workout - this workout has been completed and logged');
      return false;
    }
    
    const now = Date.now();

    // Start session if this is the first exercise being checked and no active session
    if (shouldStartSession(id)) {
      try {
        sessionManager.startSession(exerciseDay.weekId, exerciseDay.dayId);
      } catch (error) {
        console.error('Failed to start session:', error);
        // Continue with exercise toggle even if session start fails
      }
    }

    const newPlan = { ...currentPlan };
    let found = false;
    let exerciseRef = null;
    let weekId = '';
    let dayId = '';

    for (const week of newPlan.weeks) {
      for (const day of week.days) {
        const exercise = day.exercises.find(e => e.id === id);
        if (exercise) {
          // Double-check read-only status for this specific day
          if (sessionManager.isSessionReadOnly(week.id, day.id)) {
            console.warn('Cannot modify exercises in read-only workout - this workout has been completed and logged');
            return false;
          }
          
          exercise.isCompleted = !exercise.isCompleted;
          exerciseRef = exercise;
          weekId = week.id;
          dayId = day.id;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found && exerciseRef) {
      setPlan(newPlan);
      
      if (exerciseRef.isCompleted) {
        // Record timestamp in both legacy state and session manager
        setExerciseTimestamps(prev => ({ ...prev, [id]: now }));
        
        // Update session manager if there's an active session
        if (sessionManager.isSessionActive(weekId, dayId)) {
          sessionManagerInstance.updateExerciseTimestamp(id, now);
        }
        
        startRestTimer(exerciseRef.restSeconds || 60);
      } else {
        // Remove timestamp from both legacy state and session manager
        setExerciseTimestamps(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        
        // Update session manager if there's an active session
        if (sessionManager.isSessionActive(weekId, dayId)) {
          sessionManagerInstance.removeExerciseTimestamp(id);
        }
      }
      
      return true;
    }
    
    return false;
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
    
    // Calculate final duration using session data if available
    const endTime = Date.now();
    let startTime = sessionStartTime || endTime;
    let durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
    
    // Use session data if available for more accurate timing
    const session = sessionManager.getSessionForDay(weekId, dayId);
    if (session && session.startTime) {
      startTime = session.startTime;
      durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
    }

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
    
    // Complete and log the session if it exists
    try {
      if (session && session.state === SessionState.ACTIVE) {
        sessionManager.completeSession();
        sessionManager.logSession(rpe, analysis);
      } else if (session && session.state === SessionState.COMPLETED) {
        sessionManager.logSession(rpe, analysis);
      }
    } catch (error) {
      console.error('Failed to log session:', error);
      // Continue with legacy cleanup even if session logging fails
    }
    
    // Reset legacy session stats (will be synced by useEffect)
    setSessionStartTime(null);
    setExerciseTimestamps({});
  };

  // Enhanced session management methods
  const startWorkoutSession = (weekId: string, dayId: string) => {
    try {
      sessionManager.startSession(weekId, dayId);
    } catch (error) {
      console.error('Failed to start workout session:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('MULTIPLE_ACTIVE_SESSIONS')) {
          console.warn('Cannot start new session: another session is already active');
        } else if (error.message.includes('INVALID_STATE_TRANSITION')) {
          console.warn('Cannot start session: workout is already completed or logged');
        }
      }
      throw error;
    }
  };

  const completeWorkoutSession = () => {
    try {
      sessionManager.completeSession();
    } catch (error) {
      console.error('Failed to complete workout session:', error);
      if (error instanceof Error) {
        if (error.message.includes('SESSION_NOT_FOUND')) {
          console.warn('No active session to complete');
        } else if (error.message.includes('INVALID_STATE_TRANSITION')) {
          console.warn('Session is not in a state that can be completed');
        }
      }
      throw error;
    }
  };

  const logWorkoutSession = (rpe: number, analysis?: WorkoutAnalysis) => {
    try {
      sessionManager.logSession(rpe, analysis);
    } catch (error) {
      console.error('Failed to log workout session:', error);
      if (error instanceof Error) {
        if (error.message.includes('SESSION_NOT_FOUND')) {
          console.warn('No session to log');
        } else if (error.message.includes('INVALID_STATE_TRANSITION')) {
          console.warn('Session must be completed before logging');
        } else if (error.message.includes('RPE must be between 1 and 10')) {
          console.warn('Invalid RPE value provided');
        }
      }
      throw error;
    }
  };

  const abandonWorkoutSession = () => {
    try {
      sessionManager.abandonSession();
    } catch (error) {
      console.error('Failed to abandon workout session:', error);
      if (error instanceof Error) {
        if (error.message.includes('INVALID_STATE_TRANSITION')) {
          console.warn('Cannot abandon a logged session');
        }
      }
      // Don't throw for abandon - it should be safe to call
    }
  };

  const isWorkoutReadOnly = (weekId: string, dayId: string): boolean => {
    return sessionManager.isSessionReadOnly(weekId, dayId);
  };

  const canModifyExercise = (exerciseId: string, weekId: string, dayId: string): boolean => {
    // Check if the workout is read-only
    if (sessionManager.isSessionReadOnly(weekId, dayId)) {
      return false;
    }
    
    // Additional checks could be added here (e.g., user permissions, etc.)
    return true;
  };

  const getSessionState = (weekId: string, dayId: string): SessionState => {
    const session = sessionManager.getSessionForDay(weekId, dayId);
    return session?.state || SessionState.INACTIVE;
  };

  // Stale session handlers
  const handleStaleSessionContinue = () => {
    sessionManagerInstance.recoverStaleSession(true);
    setShowStaleSessionModal(false);
    setStaleSessionData(null);
  };

  const handleStaleSessionReset = () => {
    sessionManagerInstance.recoverStaleSession(false);
    setShowStaleSessionModal(false);
    setStaleSessionData(null);
  };

  const handleStaleSessionClose = () => {
    // User chose to keep old data without continuing
    setShowStaleSessionModal(false);
    setStaleSessionData(null);
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
    setCurrentSession(null);
    sessionManagerInstance.clearAllSessions();
  };

  return (
    <AppContext.Provider value={{
      user, equipment, currentPlan, step, isLoading, history,
      timerSeconds, isTimerRunning,
      setUser, setEquipment, setPlan, setStep, setLoading, toggleExercise, updateDayInPlan, logWorkout, resetApp,
      startRestTimer, stopRestTimer, addTimerSeconds, moveExercise, replaceExerciseInPlan,
      sessionStartTime, exerciseTimestamps,
      // New session management properties
      sessionManager, currentSession,
      startWorkoutSession, completeWorkoutSession, logWorkoutSession, abandonWorkoutSession,
      isWorkoutReadOnly, canModifyExercise, getSessionState
    }}>
      {children}
      
      {/* Stale Session Modal */}
      {showStaleSessionModal && staleSessionData && (
        <StaleSessionModal
          isOpen={showStaleSessionModal}
          sessionData={{
            lastActivity: staleSessionData.lastActivity,
            activeSessionKey: staleSessionData.activeSessionKey,
            sessionCount: Object.keys(staleSessionData.sessions).length
          }}
          onContinue={handleStaleSessionContinue}
          onReset={handleStaleSessionReset}
          onClose={handleStaleSessionClose}
        />
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};