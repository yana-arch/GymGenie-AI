import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, CheckCircle2, Play, Pause, SkipForward, Save, Clock, Star, Minus, Plus, Repeat, Dumbbell, Search } from 'lucide-react';
import RestTimer from '@/features/workout/components/RestTimer';
import { SessionState } from '@/types';
import { SetPerformance, EnhancedWorkoutSession } from '@/types/enhanced';
import { useAppDispatch, useAppSelector } from '@/store';
import { addSetToSession as addSetToSessionAction } from '../store/sessionSlice';
import { QualityScoreCalculator } from '../services/QualityScoreCalculator';
import { WorkoutSession } from '../services/WorkoutSession';
import exerciseRegistry from '@/data/ExerciseRegistry.json';
import ExerciseDetailModal from '@/features/workout/components/ExerciseDetailModal';
import AdaptationProposal from './AdaptationProposal';
import { exerciseCatalogService } from '@/features/workout/services/ExerciseCatalogService';
import { Exercise } from '@/types/schemas';
import { toTitleCase } from '@/utils/stringUtils';
import { Button } from '@/components/ui';
import { useToast, toast } from '@/components/ui/Toast';
import { useErrorHandler, createApiError, createCameraError, createNetworkError } from '@/utils/errorHandler';
import { fetchWorkoutAdaptation, updateEnergyContext, updateTimeContext, clearAdaptation } from '../store/liveSessionSlice';

const LiveWorkoutSession = () => {
  const { showToast } = useToast();
  const { handleError, handleAsyncError } = useErrorHandler();
  const {
    currentPlan,
    currentSession,
    sessionManager,
    logWorkout,
    setStep,
    timerSeconds,
    startRestTimer,
    stopRestTimer,
    isTimerRunning,
    addSetToSession
  } = useApp();

  const dispatch = useAppDispatch();
  const liveSessionState = useAppSelector(state => state.liveSession);
  const { adaptation, isLoading, error, performance, activeContext: reduxActiveContext, overrideHistory } = liveSessionState;

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [loggingStats, setLoggingStats] = useState({ duration: 0 });
  
  // Smart Input State (LiftLog Style)
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [inputReps, setInputReps] = useState<number>(0);

  // Track set timing
  const [setStartTime, setSetStartTime] = useState<number>(Date.now());
  const [lastRestTime, setLastRestTime] = useState<number>(0);

  const [showHowTo, setShowHowTo] = useState(false);
  const [currentCatalogExercise, setCurrentCatalogExercise] = useState<Exercise | null>(null);

  // Derived state for current workout context
  const activeContext = useMemo(() => {
    if (!currentPlan || !currentSession) return null;
    
    const week = currentPlan.weeks.find(w => w.id === currentSession.weekId);
    const day = week?.days.find(d => d.id === currentSession.dayId);
    
    if (!week || !day) return null;

    const currentExercise = day.exercises[activeExerciseIndex];
    
    // Find Registry Metadata
    const registryData = exerciseRegistry.find(ex =>
        ex.name === currentExercise.name ||
        ex.aliases.includes(currentExercise.name)
    );

    return {
        week,
        day,
        currentExercise,
        totalExercises: day.exercises.length,
        registryData
    };
  }, [currentPlan, currentSession, activeExerciseIndex]);

  // Determine completed sets from session state instead of local state
  const completedSetsCount = useMemo(() => {
    if (!currentSession || !activeContext) return 0;
    
    const session = currentSession as unknown as EnhancedWorkoutSession;
    if (session.exerciseData && session.exerciseData[activeContext.currentExercise.id]) {
        return session.exerciseData[activeContext.currentExercise.id].sets.length;
    }
    return 0;
  }, [currentSession, activeContext]);

  // Auto-fill logic when exercise changes
  useEffect(() => {
      if (activeContext) {
          // Default to planned reps
          const plannedReps = parseInt(activeContext.currentExercise.reps) || 0;
          setInputReps(plannedReps);
          
          // Try to find previous weight (Simulation: In real app, query history)
          // For now, default to 0 or last set
          // TODO: Query Redux history for this exercise ID
          setInputWeight(20);
      }
  }, [activeExerciseIndex, activeContext]);

  // Effect to track actual rest time when timer stops
  useEffect(() => {
    if (!isTimerRunning && lastRestTime > 0) {
        // Timer just stopped
        // We could log this if we were tracking rest strictly
        // For now we rely on the set logging logic
    }
  }, [isTimerRunning, lastRestTime]);

  if (!activeContext) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No active session found.</p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setStep("dashboard")}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const { day, currentExercise, totalExercises } = activeContext;

  const handleFinishWorkout = async () => {
    if (!activeContext || !currentSession) {
      showToast(
        toast.error(
          "No Active Session", 
          "Please start a workout before finishing.",
          { persistent: false, duration: 4000 }
        )
      );
      return;
    }

    try {
      // Calculate duration for display
      const duration = Math.max(1, Math.round((Date.now() - currentSession.startTime) / 60000));
      setLoggingStats({ duration });
      
      // Only complete if still active
      if (currentSession.state === SessionState.ACTIVE) {
        await sessionManager.completeSession();
        showToast(
          toast.success(
            "Workout Completed", 
            "Great job! Your workout has been finished.",
            { persistent: false, duration: 3000 }
          )
        );
      } else {
        showToast(
          toast.warning(
            "Session Already Complete", 
            "This workout session was already finished.",
            { persistent: false, duration: 4000 }
          )
        );
      }
      
      setIsLogging(true);
    } catch (error) {
      console.error("Failed to complete session:", error);
      showToast(
        toast.error(
          "Failed to Finish", 
          "Could not complete workout. Please try again.",
          { persistent: false, duration: 5000 }
        )
      );
    }
  };

  const submitLog = async () => {
    if (!activeContext) return;
    try {
      // Logic for calculating Quality Score
      let scoreResult = undefined;
      if (currentSession) {
         // Create a map of exercises for the calculator
         const exerciseMap: Record<string, any> = {};
         activeContext.day.exercises.forEach(e => exerciseMap[e.id] = e);
         
         const planData = {
            totalExercisesInPlan: activeContext.day.exercises.length,
            exercises: exerciseMap
         };
         
         // Cast to WorkoutSession class if needed or use plain object if calculator supports it
         // Assuming calculator handles the currentSession object structure
         // We might need to reconstruct the class instance if it\'s lost in Redux
         // For now, let\'s assume we pass the raw object and cast it inside if needed or utility handles it
         const sessionInstance = WorkoutSession.fromStoredData(currentSession);
         scoreResult = QualityScoreCalculator.calculate(sessionInstance, planData);
      }
      
      const analysis = scoreResult ? {
         score: scoreResult.totalScore,
         mood: "Good", // Could ask user
         summary: scoreResult.feedback,
         advice: scoreResult.feedback,
         strengths: [] as string[],
         improvements: [] as string[],
         nextWorkoutRecommendations: [] as string[]
      } : undefined;

      await logWorkout(activeContext.week.id, activeContext.day.id, rpe, analysis);
      setStep("dashboard");
    } catch (error) {
      console.error("Failed to log workout", error);
      alert("Failed to save workout. Please try again.");
    }
  };

  const handleNextExercise = React.useCallback(() => {
    if (activeExerciseIndex < totalExercises - 1) {
      setActiveExerciseIndex(prev => prev + 1);
      setSetStartTime(Date.now()); // Reset set start time for new exercise
    }
  }, [activeExerciseIndex, totalExercises]);

  const handleLogSet = React.useCallback(async () => {
    if (!activeContext) {
      showToast(
        toast.error(
          "No Active Exercise", 
          "Please start a workout session first.",
          { persistent: false, duration: 4000 }
        )
      );
      return;
    }

    try {
      const now = Date.now();
      const duration = now - setStartTime;
      
      // Validate inputs
      if (inputWeight <= 0 || inputReps <= 0) {
        showToast(
          toast.error(
            "Invalid Input", 
            "Weight and reps must be greater than 0.",
            { persistent: false, duration: 4000 }
          )
        );
        return;
      }
      
      const setPerformance: SetPerformance = {
          id: crypto.randomUUID(),
          setNumber: completedSetsCount + 1,
          weight: inputWeight,
          reps: inputReps,
          completedAt: now,
          targetRestTime: currentExercise.restSeconds,
          actualRestTime: 0,
          duration: duration
      };

      // Use context method to ensure session manager is updated (and thus UI)
      await addSetToSession(currentExercise.id, setPerformance);
      
      // Also dispatch to Redux for dual-state consistency if needed, or remove if fully migrating
      dispatch(addSetToSessionAction({
          exerciseId: currentExercise.id,
          set: setPerformance
      }));

      // Reset for next set
      setSetStartTime(now);

      // Auto-start rest timer if defined
      if (currentExercise.restSeconds > 0) {
        startRestTimer(currentExercise.restSeconds);
      }

      // Success feedback
      showToast(
        toast.success(
          "Set Logged", 
          `Completed ${inputReps} reps at ${inputWeight}kg`,
          { persistent: false, duration: 3000 }
        )
      );

    } catch (error) {
      console.error('Failed to log set:', error);
      showToast(
        toast.error(
          "Failed to Log Set", 
          "Could not save your set. Please try again.",
          { persistent: false, duration: 5000 }
        )
      );
    }
  }, [activeContext, completedSetsCount, currentExercise, setStartTime, startRestTimer, dispatch, inputWeight, inputReps, addSetToSession, showToast]);

  // Camera permission and form detection setup
  useEffect(() => {
    const setupCamera = async () => {
      try {
        // Request camera permission if available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
          });
          
          // Close stream immediately after permission check
          stream.getTracks().forEach(track => track.stop());
          
          console.log('Camera permission granted');
        } else {
          showToast(toast.camera('Camera API not available in this browser'));
        }
      } catch (error) {
        console.error('Camera setup error:', error);
        
        // Handle specific camera errors
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            showToast(toast.permission('camera access', 'Camera access is needed for form detection. Please enable camera permissions.'));
          } else if (error.name === 'NotFoundError') {
            showToast(toast.error('Camera Not Found', 'No camera device detected. Please connect a camera.'));
          } else if (error.name === 'NotReadableError') {
            showToast(toast.error('Camera Busy', 'Camera is already in use by another application.'));
          } else {
            showToast(toast.camera('Failed to access camera'));
          }
        }
      }
    };

    // Setup camera when component mounts
    if (activeContext) {
      setupCamera();
    }
  }, [activeContext, showToast]);

  useEffect(() => {
    const loadDetails = async () => {
        try {
            if (activeContext?.registryData?.id) {
                const results = await exerciseCatalogService.search(activeContext.currentExercise.name);
                if (results.length > 0) {
                    const fullEx = await exerciseCatalogService.getById(results[0].id);
                    setCurrentCatalogExercise(fullEx);
                }
            } else if (activeContext?.currentExercise.name) {
                 const results = await exerciseCatalogService.search(activeContext.currentExercise.name);
                 if (results.length > 0) {
                     const fullEx = await exerciseCatalogService.getById(results[0].id);
                     setCurrentCatalogExercise(fullEx);
                 } else {
                   // Exercise not found in catalog - this is okay, just log it
                   console.log(`Exercise "${activeContext.currentExercise.name}" not found in catalog`);
                 }
            }
        } catch (error) {
            handleError(error, 'loading exercise details');
        }
    };
    loadDetails();
  }, [activeContext, handleError]);

  const adjustWeight = (amount: number) => setInputWeight(prev => Math.max(0, prev + amount));
  const adjustReps = (amount: number) => setInputReps(prev => Math.max(0, prev + amount));

  const handleAcceptAdaptation = () => {
    // Apply adaptation to current exercise with safety validation
    if (!adaptation) return;

    try {
      // Safety check: don't increase intensity when user is tired
      const isTired = reduxActiveContext.energy === 'tired';
      
      if (adaptation.newReps) {
        const currentReps = inputReps;
        // Only accept reps reduction or modest increase when not tired
        if (isTired && adaptation.newReps > currentReps) {
          showToast(
            toast.error(
              "Adaptation Unsafe", 
              "Cannot increase reps when you're feeling tired for safety reasons.",
              { persistent: false, duration: 4000 }
            )
          );
          return;
        }
        setInputReps(adaptation.newReps);
        showToast(
          toast.success(
            "Adaptation Applied",
            `Reps adjusted to ${adaptation.newReps}`,
            { persistent: false, duration: 3000 }
          )
        );
      }

      if (adaptation.newSets) {
        // Apply sets changes (UI would need to handle this for current exercise)
        showToast(
          toast.info(
            "Feature Coming Soon",
            `Suggested ${adaptation.newSets} sets - UI implementation needed`,
            { persistent: false, duration: 3000 }
          )
        );
      }

      if (adaptation.newExercise) {
        // Exercise change would require more complex logic
        showToast(
          toast.info(
            "Feature Coming Soon", 
            `Exercise change to ${adaptation.newExercise} - implementation needed`,
            { persistent: false, duration: 3000 }
          )
        );
      }

      if (adaptation.restTime) {
        // Rest time adjustment would need timer integration
        showToast(
          toast.info(
            "Feature Coming Soon",
            `Rest time adjusted to ${adaptation.restTime}s - timer integration needed`,
            { persistent: false, duration: 3000 }
          )
        );
      }

      // Clear adaptation after applying
      dispatch(clearAdaptation());
    } catch (error) {
      showToast(
        toast.error(
          "Adaptation Failed",
          "Could not apply adaptation. Please try again.",
          { persistent: false, duration: 5000 }
        )
      );
      console.error('Adaptation error:', error);
    }
  };

  const handleRejectAdaptation = () => {
    dispatch(clearAdaptation());
  };

  const handleRetryAdaptation = () => {
    // Retry last adaptation request
    try {
      if (reduxActiveContext.energy === 'tired' || reduxActiveContext.time === 'limited') {
        dispatch(fetchWorkoutAdaptation({ 
          activeContext: { energy: 'tired', time: 'normal', equipmentStatus: 'available' }, 
          overrideHistory: overrideHistory || []
        }));
        showToast(
          toast.info(
            "Retrying Adaptation", 
            "Requesting new AI recommendations...",
            { persistent: false, duration: 3000 }
          )
        );
      } else {
        showToast(
          toast.warning(
            "No Adaptation Context", 
            "Please set your current state (tired/short on time) first.",
            { persistent: false, duration: 4000 }
          )
        );
      }
    } catch (error) {
      showToast(
        toast.error(
          "Retry Failed", 
          "Could not retry adaptation request.",
          { persistent: false, duration: 4000 }
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Top Bar: Minimal Navigation */}
      <div className="flex items-center justify-between p-6 bg-transparent z-10">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setStep("dashboard")}
        >
          <ArrowLeft size={20} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleFinishWorkout}
          className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-wider"
        >
          Finish
        </Button>
      </div>

      {/* Main Content: Current Exercise */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col items-center">
        <div className="w-full max-w-md space-y-6">
          
          {/* Exercise Title & Info */}
          <div className="text-center space-y-4">
            <div className="relative">
              <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-2">
                {activeExerciseIndex + 1} / {totalExercises} • {day.title}
              </p>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                  {toTitleCase(currentExercise.name)}
                </h1>
                <button
                  onClick={() => setShowHowTo(true)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-full transition-colors active:scale-95"
                  title="View exercise details"
                >
                  <Search size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider">{currentExercise.sets} Sets</span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider">{currentExercise.reps} Reps</span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> {currentExercise.restSeconds}s
              </span>
            </div>

            {/* Reference Image */}
            {currentCatalogExercise?.media?.gif && (
              <div className="w-full aspect-video bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-white dark:border-gray-700 p-2 group relative">
                <img 
                  src={currentCatalogExercise.media.gif} 
                  alt={currentExercise.name} 
                  className="w-full h-full object-contain rounded-[2rem]"
                />
                <button 
                  onClick={() => setShowHowTo(true)}
                  className="absolute bottom-4 right-4 p-3 bg-white/90 dark:bg-gray-800/90 text-brand-600 dark:text-brand-400 rounded-2xl shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                >
                  <Search size={20} />
                </button>
              </div>
            )}
            
            {/* How-to Button */}
            {currentCatalogExercise && (
                <button
                    onClick={() => setShowHowTo(true)}
                    className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 text-sm font-bold mt-2 hover:text-brand-700 dark:hover:text-brand-300"
                >
                    <Search size={14} /> How to perform
                </button>
            )}
          </div>

          {/* Active Set Card with Smart Inputs */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-8 shadow-xl space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-6">
               <div>
                  <p className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Current Set</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-gray-100">
                    {completedSetsCount + 1} <span className="text-2xl text-gray-300 dark:text-gray-600 font-medium">/ {currentExercise.sets}</span>
                  </p>
               </div>
               <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center">
                   <Dumbbell className="text-brand-500" size={28} />
               </div>
            </div>
            
            {/* Weight Input */}
            <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                   <span>Weight (kg)</span>
               </div>
               <div className="flex items-center gap-4">
                   <button onClick={() => adjustWeight(-2.5)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                       <Minus size={24} />
                   </button>
                   <div className="flex-1 bg-gray-50 dark:bg-gray-900 h-14 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner">
                       <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{inputWeight}</span>
                   </div>
                   <button onClick={() => adjustWeight(2.5)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                       <Plus size={24} />
                   </button>
               </div>
            </div>

            {/* Reps Input */}
            <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                   <span>Reps</span>
               </div>
               <div className="flex items-center gap-4">
                   <button onClick={() => adjustReps(-1)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                       <Minus size={24} />
                   </button>
                   <div className="flex-1 bg-gray-50 dark:bg-gray-900 h-14 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner">
                       <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{inputReps}</span>
                   </div>
                   <button onClick={() => adjustReps(1)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                       <Plus size={24} />
                   </button>
               </div>
            </div>
          </div>

          {/* AI Adaptation Triggers */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-6 shadow-xl space-y-4">
            <div className="text-center">
              <p className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Need an Adjustment?</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Let AI adapt your workout to your current state</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  try {
                    dispatch(updateEnergyContext('tired'));
                    
                    const result = await handleAsyncError(
                      () => dispatch(fetchWorkoutAdaptation({ 
                        activeContext: { energy: 'tired', time: 'normal', equipmentStatus: 'available' }, 
                        overrideHistory: overrideHistory || []
                      })),
                      'AI adaptation request'
                    );
                    
                    if (result) {
                      showToast(
                        toast.info(
                          "AI Analyzing", 
                          "Checking for workout adaptations for tired state...",
                          { persistent: false, duration: 3000 }
                        )
                      );
                    }
                  } catch (error) {
                    handleError(error, 'AI adaptation trigger');
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition-colors active:scale-95 border border-blue-100 dark:border-blue-800"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">😴</span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">I'm Tired</span>
              </button>
              
              <button
                onClick={async () => {
                  try {
                    dispatch(updateTimeContext('limited'));
                    
                    const result = await handleAsyncError(
                      () => dispatch(fetchWorkoutAdaptation({ 
                        activeContext: { energy: 'normal', time: 'limited', equipmentStatus: 'available' }, 
                        overrideHistory: overrideHistory || []
                      })),
                      'AI adaptation request'
                    );
                    
                    if (result) {
                      showToast(
                        toast.info(
                          "AI Analyzing", 
                          "Checking for workout adaptations for limited time...",
                          { persistent: false, duration: 3000 }
                        )
                      );
                    }
                  } catch (error) {
                    handleError(error, 'AI adaptation trigger');
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-2xl transition-colors active:scale-95 border border-orange-100 dark:border-orange-800"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">⏰</span>
                </div>
                <span className="text-sm font-bold text-orange-700 dark:text-orange-300">Short on Time</span>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="primary"
            size="xl"
            onClick={handleLogSet}
            disabled={completedSetsCount >= currentExercise.sets}
            className={`w-full font-black text-xl uppercase tracking-widest ${completedSetsCount >= currentExercise.sets ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : ''}`}
          >
            <CheckCircle2 size={28} />
            {completedSetsCount >= currentExercise.sets ? 'Exercise Complete' : `Log Set ${completedSetsCount + 1}`}
          </Button>

          {/* Navigation */}
          <div className="flex flex-col items-center gap-4 py-4">
            {activeExerciseIndex < totalExercises - 1 && (
               <button 
                 onClick={handleNextExercise}
                 className="text-gray-400 dark:text-gray-500 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
               >
                 Skip to Next Exercise <SkipForward size={16} />
               </button>
            )}
            
          </div>

        </div>
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={showHowTo}
        onClose={() => setShowHowTo(false)}
        exercise={currentCatalogExercise || {
          id: currentExercise.id,
          slug: currentExercise.name.toLowerCase().replace(/\s+/g, '-'),
          name: currentExercise.name,
          primaryMuscle: ["abs" as any], // fallback
          secondaryMuscles: [],
          instructions: ["Perform the exercise as demonstrated."],
          contraindications: [],
          cues: [],
          bodyPart: ["waist" as any],
          equipment: ["bodyweight" as any],
          tags: [],
          sourceMeta: { ai_augmented: false },
          media: { gif: null }
        }}
      />

      {/* Logging Modal */}
      {isLogging && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-fade-in flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Workout Complete!</h2>
              <p className="text-gray-500 dark:text-gray-400">Great job crushing {activeContext?.day.title}.</p>
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest">{loggingStats.duration} Minutes</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Rate Effort (RPE)</label>
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Easy</span>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{rpe}</span>
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Max</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <button
              onClick={submitLog}
              className="w-full bg-brand-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-brand-700 active:scale-95 transition-all text-lg"
            >
              Save & Finish
            </button>
          </div>
        </div>
      )}

      {/* AI Adaptation Proposal */}
      <AdaptationProposal
        adaptation={adaptation}
        isLoading={isLoading}
        onAccept={handleAcceptAdaptation}
        onReject={handleRejectAdaptation}
      />

       {/* Performance Monitor (for development/testing) */}
       {process.env.NODE_ENV === 'development' && performance.lastResponseTime && (
         <div className="fixed inset-x-4 top-20 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-lg z-50 max-w-xs mx-auto">
           <div className="flex items-center justify-between text-xs">
             <div>
               <p className="text-blue-800 dark:text-blue-200 font-medium">AI Response Time</p>
               <p className={`font-bold ${performance.withinSLA ? 'text-green-600' : 'text-red-600'}`}>
                 {performance.lastResponseTime}ms
               </p>
             </div>
             <div className="text-right">
               <p className="text-blue-600 dark:text-blue-400">Avg: {performance.averageResponseTime.toFixed(0)}ms</p>
               <p className="text-blue-600 dark:text-blue-400">Requests: {performance.requestCount}</p>
             </div>
           </div>
         </div>
       )}

       {/* Error Display */}
       {error && (
         <div className="fixed inset-x-4 bottom-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-xl z-50 max-w-sm mx-auto">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-red-800 dark:text-red-200 font-medium">Adaptation Failed</p>
               <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
             </div>
             <button
               onClick={handleRetryAdaptation}
               className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
             >
               Retry
             </button>
           </div>
         </div>
       )}
    </div>
  );
};

export default LiveWorkoutSession;
