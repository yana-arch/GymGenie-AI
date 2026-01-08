import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, CheckCircle2, SkipForward, Clock, Minus, Plus, Dumbbell, Search, Camera, CameraOff } from 'lucide-react';
import RestTimer from '@/features/workout/components/RestTimer';
import { SessionState } from '@/types';
import { SetPerformance, EnhancedWorkoutSession } from '@/types/enhanced';
import { useAppDispatch, useAppSelector } from '@/store';
import { addSetToSession as addSetToSessionAction } from '../store/sessionSlice';
import { QualityScoreCalculator } from '../services/QualityScoreCalculator';
import { WorkoutSession } from '../services/WorkoutSession';
import exerciseRegistry from '@/data/ExerciseRegistry.json';
import ExerciseDetailModal from '@/features/workout/components/ExerciseDetailModal';
import { AdaptationPrompt } from './AdaptationPrompt';
import { AudioCoachingService } from '@/features/form-correction/services/AudioCoachingService';
import { exerciseCatalogService } from '@/features/workout/services/ExerciseCatalogService';
import { Exercise } from '@/types/schemas';
import { toTitleCase } from '@/utils/stringUtils';
import { Button } from '@/components/ui';
import { useToast, toast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/utils/errorHandler';
import { fetchWorkoutAdaptation, updateEnergyContext, updateTimeContext, clearAdaptation, setIsActive, addMilestone, addSessionVolume, setCurrentSetProgress, incrementExercisesCompleted, setActiveExerciseIndex as setActiveExerciseIndexAction, setSessionProgress } from '../store/liveSessionSlice';
import { updateSettings as updateFormSettings, updateRepCount } from '@/features/form-correction/store/formCorrectionSlice';
import { useGuidanceLoop } from '../hooks/useGuidanceLoop';
import { useEncouragement } from '../hooks/useEncouragement';
import LiveGuidanceOverlay from './LiveGuidanceOverlay';
import MilestoneCelebration from './MilestoneCelebration';
import TransitionPrep from './TransitionPrep';
import SessionProgressHUD from './SessionProgressHUD';

import { sessionGuidanceService } from '../services/SessionGuidanceService';
import { EncouragementService } from '../services/EncouragementService';
import { FormAnalysisService } from '@/features/form-correction/services/FormAnalysisService';

const LiveWorkoutSession = () => {
  const { showToast } = useToast();
  const { handleError, handleAsyncError } = useErrorHandler();
  useEncouragement();
  
  const dispatch = useAppDispatch();
  const currentPlan = useAppSelector(state => state.workout.currentPlan);
  const currentSession = useAppSelector(state => state.session.currentSession);
  
  const {
    sessionManager,
    logWorkout,
    setStep,
    startRestTimer,
    isTimerRunning,
    addSetToSession
  } = useApp();

  const liveSessionState = useAppSelector(state => state.liveSession);
  const cameraEnabled = useAppSelector((state: any) => state.formCorrection?.settings?.cameraEnabled ?? true);
  const previousWorkouts = useAppSelector(state => Object.values(state.session.sessions));
  
  const historicalData = useMemo(() => {
    return previousWorkouts.flatMap(s => 
      Object.values(s.exerciseData || {}).flatMap(ex => 
        ex.sets.map(set => ({
          exerciseId: ex.exerciseId,
          weight: set.weight,
          reps: set.reps
        }))
      )
    );
  }, [previousWorkouts]);
  
  const { adaptation, isLoading, error, performance, activeContext: reduxActiveContext, overrideHistory } = liveSessionState;

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [loggingStats, setLoggingStats] = useState({ duration: 0 });
  
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [inputReps, setInputReps] = useState<number>(0);

  const [setStartTime, setSetStartTime] = useState<number>(Date.now());
  const [lastRestTime] = useState<number>(0);

  const [showHowTo, setShowHowTo] = useState(false);
  const [currentCatalogExercise, setCurrentCatalogExercise] = useState<Exercise | null>(null);
  const [transitionState, setTransitionState] = useState<{ active: boolean; seconds: number; nextName: string }>({ 
    active: false, 
    seconds: 0, 
    nextName: '' 
  });

  // Safety: Track if camera error has already been shown to avoid infinite notification loops
  const hasShownCameraError = useRef<boolean>(false);

  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const audioService = useRef<AudioCoachingService | null>(null);

  useEffect(() => {
    audioService.current = AudioCoachingService.getInstance();
    return () => audioService.current?.stop();
  }, []);

  useEffect(() => {
    if (adaptation && adaptation.notes) {
      audioService.current?.announceAdaptation(adaptation.notes);
    }
  }, [adaptation]);

  const activeContext = useMemo(() => {
    if (!currentPlan || !currentSession) return null;
    
    const week = currentPlan.weeks.find(w => w.id === currentSession.weekId);
    const day = week?.days.find(d => d.id === currentSession.dayId);
    
    if (!week || !day) return null;

    const currentExercise = day.exercises[activeExerciseIndex];
    
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

  const completedSetsCount = useMemo(() => {
    if (!currentSession || !activeContext) return 0;
    
    const session = currentSession as unknown as EnhancedWorkoutSession;
    if (session.exerciseData && session.exerciseData[activeContext.currentExercise.id]) {
        return session.exerciseData[activeContext.currentExercise.id].sets.length;
    }
    return 0;
  }, [currentSession, activeContext]);

  useEffect(() => {
      if (activeContext) {
          const plannedReps = parseInt(activeContext.currentExercise.reps) || 0;
          setInputReps(plannedReps);
          setInputWeight(20);
      }
  }, [activeExerciseIndex, activeContext]);

  useEffect(() => {
    if (!isTimerRunning && lastRestTime > 0) {
    }
  }, [isTimerRunning, lastRestTime]);

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
      const duration = Math.max(1, Math.round((Date.now() - currentSession.startTime) / 60000));
      setLoggingStats({ duration });
      
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
      let scoreResult = undefined;
      if (currentSession) {
         const exerciseMap: Record<string, any> = {};
         activeContext.day.exercises.forEach(e => exerciseMap[e.id] = e);
         
         const planData = {
            totalExercisesInPlan: activeContext.day.exercises.length,
            exercises: exerciseMap
         };
         
         const sessionInstance = WorkoutSession.fromStoredData(currentSession);
         scoreResult = QualityScoreCalculator.calculate(sessionInstance, planData);
      }
      
      const analysis = scoreResult ? {
         score: scoreResult.totalScore,
         mood: "Good",
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

  const handleNextExercise = useCallback(() => {
    const totalEx = activeContext?.totalExercises || 0;
    if (activeExerciseIndex < totalEx - 1) {
      const nextIndex = activeExerciseIndex + 1;
      setActiveExerciseIndex(nextIndex);
      dispatch(setActiveExerciseIndexAction(nextIndex));
      setSetStartTime(Date.now());
    }
  }, [activeExerciseIndex, activeContext?.totalExercises, dispatch]);

  const handleLogSet = useCallback(async () => {
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
          targetRestTime: activeContext.currentExercise.restSeconds,
          actualRestTime: 0,
          duration: duration
      };

      await addSetToSession(activeContext.currentExercise.id, setPerformance);
      
      dispatch(addSetToSessionAction({
          exerciseId: activeContext.currentExercise.id,
          set: setPerformance
      }));

      // Update aggregate volume in Redux
      dispatch(addSessionVolume(inputWeight));

      // Record volume for milestones
      const volumeMilestones = sessionGuidanceService.recordVolume(inputWeight, liveSessionState.activeContext.energy);
      volumeMilestones.forEach((m: any) => dispatch(addMilestone(m)));

      // Check for PBs
      const pbMilestones = sessionGuidanceService.checkPersonalBest(
        activeContext.currentExercise.id,
        inputWeight,
        inputReps,
        historicalData,
        liveSessionState.activeContext.energy
      );
      pbMilestones.forEach((m: any) => {
        dispatch(addMilestone(m));
        EncouragementService.getInstance().celebratePersonalBest(m.label);
      });

      setSetStartTime(now);

      // Reset rep count for next set
      FormAnalysisService.getInstance().resetRepCount();
      dispatch(updateRepCount(0));

      if (activeContext.currentExercise.restSeconds > 0) {
        startRestTimer(activeContext.currentExercise.restSeconds);
      }

      showToast(
        toast.success(
          "Set Logged", 
          `Completed ${inputReps} reps at ${inputWeight}kg`,
          { persistent: false, duration: 3000 }
        )
      );

      // Trigger transition if it was the last set
      if (completedSetsCount + 1 >= activeContext.currentExercise.sets) {
        dispatch(incrementExercisesCompleted());
        if (activeExerciseIndex < activeContext.totalExercises - 1) {
          setTransitionState({
            active: true,
            seconds: 5,
            nextName: activeContext.day.exercises[activeExerciseIndex + 1].name
          });
        }
      }

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
  }, [activeContext, completedSetsCount, activeExerciseIndex, setStartTime, startRestTimer, dispatch, inputWeight, inputReps, addSetToSession, showToast]);

  const { day, currentExercise, totalExercises } = activeContext || { day: null, currentExercise: null, totalExercises: 0 };

  useEffect(() => {
    if (currentExercise) {
      const progress = completedSetsCount / currentExercise.sets;
      dispatch(setCurrentSetProgress(progress));
    }
  }, [completedSetsCount, currentExercise?.sets, dispatch]);

  const currentRepCount = useAppSelector((state: any) => state.formCorrection.currentRepCount);

  useEffect(() => {
    if (activeContext && currentRepCount > 0) {
      const targetReps = parseInt(activeContext.currentExercise.reps) || 0;
      EncouragementService.getInstance().checkSetProgress(currentRepCount, targetReps);
    }
  }, [currentRepCount, activeContext]);

  // Calculate session progress (0 to 1)
  const sessionProgressValue = useMemo(() => {
    if (!activeContext || !day) return 0;
    const exerciseProgress = activeExerciseIndex / totalExercises;
    const currentExerciseWeight = 1 / totalExercises;
    const setProgress = (completedSetsCount / (currentExercise?.sets || 1)) * currentExerciseWeight;
    return Math.min(1, exerciseProgress + setProgress);
  }, [activeExerciseIndex, totalExercises, completedSetsCount, currentExercise?.sets, activeContext, day]);

  useEffect(() => {
    dispatch(setSessionProgress(sessionProgressValue));
  }, [sessionProgressValue, dispatch]);

  // Guidance Loop Integration
  const { activeGuidance, milestoneHistory } = useGuidanceLoop(
    liveSessionState.isActive, 
    sessionProgressValue
  );

  useEffect(() => {
    // Set active state when component mounts
    dispatch(setIsActive(true));
    return () => {
      dispatch(setIsActive(false));
    };
  }, [dispatch]);

  // Handle transition countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (transitionState.active && transitionState.seconds > 0) {
      timer = setInterval(() => {
        setTransitionState(prev => ({ ...prev, seconds: prev.seconds - 1 }));
      }, 1000);
    } else if (transitionState.active && transitionState.seconds <= 0) {
      setTransitionState(prev => ({ ...prev, active: false }));
      handleNextExercise();
    }
    return () => clearInterval(timer);
  }, [transitionState, handleNextExercise]);

  const setupCamera = useCallback(async () => {
    if (!cameraEnabled) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: false 
        });
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera permission granted');
        hasShownCameraError.current = false;
      } else {
        if (!hasShownCameraError.current) {
          showToast(toast.camera('Camera API not available in this browser'));
          hasShownCameraError.current = true;
        }
      }
    } catch (error) {
      console.error('Camera setup error:', error);
      if (hasShownCameraError.current) return;

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          showToast(toast.permission('camera access', 'Camera access is needed for form detection. Please enable camera permissions.'));
        } else if (error.name === 'NotFoundError') {
          showToast(toast.error('Camera Not Found', 'No camera device detected.'));
        } else if (error.name === 'NotReadableError') {
          showToast(toast.error('Camera Busy', 'Camera is already in use by another application.'));
        } else {
          showToast(toast.camera('Failed to access camera'));
        }
        hasShownCameraError.current = true;
      }
    }
  }, [cameraEnabled, showToast]);

  useEffect(() => {
    if (cameraEnabled) {
      setupCamera();
    } else {
      hasShownCameraError.current = false;
    }
  }, [cameraEnabled, setupCamera]);

  const loadDetails = useCallback(async () => {
    if (!activeContext) return;
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
             }
        }
    } catch (error) {
        handleError(error, 'loading exercise details');
    }
  }, [activeContext, handleError]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const adjustWeight = (amount: number) => setInputWeight(prev => Math.max(0, prev + amount));
  const adjustReps = (amount: number) => setInputReps(prev => Math.max(0, prev + amount));

  const handleAcceptAdaptation = () => {
    if (!adaptation) return;

    try {
      const isTired = reduxActiveContext.energy === 'tired';
      
      if (adaptation.newReps) {
        if (isTired && adaptation.newReps > inputReps) {
          showToast(toast.error("Adaptation Unsafe", "Cannot increase reps when tired."));
          return;
        }
        setInputReps(adaptation.newReps);
        showToast(toast.success("Adaptation Applied", `Reps adjusted to ${adaptation.newReps}`));
      }
      dispatch(clearAdaptation());
    } catch (error) {
      showToast(toast.error("Adaptation Failed", "Could not apply adaptation."));
    }
  };

  const handleRejectAdaptation = () => {
    dispatch(clearAdaptation());
  };

  const handleRetryAdaptation = () => {
    try {
      if (reduxActiveContext.energy === 'tired' || reduxActiveContext.time === 'limited') {
        dispatch(fetchWorkoutAdaptation({ 
          activeContext: { 
            energy: reduxActiveContext.energy, 
            time: reduxActiveContext.time, 
            equipmentStatus: 'available' 
          }, 
          overrideHistory: overrideHistory || [],
          currentExercise: activeContext?.currentExercise ? {
            reps: activeContext.currentExercise.reps,
            sets: activeContext.currentExercise.sets,
            restSeconds: activeContext.currentExercise.restSeconds
          } : undefined
        }));
      }
    } catch (error) {}
  };

  const mappedAdaptation = useMemo(() => {
    if (!adaptation) return null;
    return {
      message: adaptation.notes || 'Workout adaptation suggested',
      modifications: {
        suggestedReps: adaptation.newReps,
        suggestedSets: adaptation.newSets,
        suggestedRest: adaptation.restTime,
        alternativeExerciseName: adaptation.newExercise
      },
      action: adaptation.newExercise ? 'substitute_exercise' : 'reduce_intensity',
      reasoning: adaptation.notes || ''
    };
  }, [adaptation]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      {!activeContext ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No active session found.</p>
          <Button variant="primary" size="lg" onClick={() => setStep("dashboard")}>Return to Dashboard</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-6 bg-transparent z-10">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setStep("dashboard")}><ArrowLeft size={20} /></Button>
              <Button 
                variant="secondary" 
                size="md" 
                onClick={() => {
                  hasShownCameraError.current = false;
                  dispatch(updateFormSettings({ cameraEnabled: !cameraEnabled }));
                }}
                title={cameraEnabled ? "Disable Camera" : "Enable Camera"}
                className={cameraEnabled ? "text-brand-600" : "text-gray-400"}
              >
                {cameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={handleFinishWorkout} className="text-brand-600 dark:text-brand-400 font-black uppercase tracking-wider">Finish</Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col items-center">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center space-y-4">
                <div className="relative">
                  <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-2">
                    {activeExerciseIndex + 1} / {totalExercises} • {day?.title}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                      {currentExercise ? toTitleCase(currentExercise.name) : ''}
                    </h1>
                    <button onClick={() => setShowHowTo(true)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-full transition-colors active:scale-95"><Search size={16} /></button>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider">{currentExercise?.sets} Sets</span>
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider">{currentExercise?.reps} Reps</span>
                  <span className="px-3 py-1 bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-full border border-gray-100 dark:border-gray-700 shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <Clock size={10} /> {currentExercise?.restSeconds}s
                  </span>
                </div>

                {currentCatalogExercise?.media?.gif && (
                  <div className="w-full aspect-video bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-white dark:border-gray-700 p-2 group relative">
                    <img src={currentCatalogExercise.media.gif} alt={currentExercise?.name} className="w-full h-full object-contain rounded-[2rem]" />
                    <button onClick={() => setShowHowTo(true)} className="absolute bottom-4 right-4 p-3 bg-white/90 dark:bg-gray-800/90 text-brand-600 dark:text-brand-400 rounded-2xl shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all active:scale-95"><Search size={20} /></button>
                  </div>
                )}
                
                {currentCatalogExercise && (
                    <button onClick={() => setShowHowTo(true)} className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 text-sm font-bold mt-2 hover:text-brand-700 dark:hover:text-brand-300"><Search size={14} /> How to perform</button>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-8 shadow-xl space-y-8">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-6">
                   <div>
                      <p className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Current Set</p>
                      <p className="text-4xl font-black text-gray-900 dark:text-gray-100">
                        {completedSetsCount + 1} <span className="text-2xl text-gray-300 dark:text-gray-600 font-medium">/ {currentExercise?.sets}</span>
                      </p>
                   </div>
                   <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center"><Dumbbell className="text-brand-500" size={28} /></div>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"><span>Weight (kg)</span></div>
                   <div className="flex items-center gap-4">
                       <button onClick={() => adjustWeight(-2.5)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"><Minus size={24} /></button>
                       <div className="flex-1 bg-gray-50 dark:bg-gray-900 h-14 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner"><span className="text-3xl font-black text-gray-900 dark:text-gray-100">{inputWeight}</span></div>
                       <button onClick={() => adjustWeight(2.5)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"><Plus size={24} /></button>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"><span>Reps</span></div>
                   <div className="flex items-center gap-4">
                       <button onClick={() => adjustReps(-1)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"><Minus size={24} /></button>
                       <div className="flex-1 bg-gray-50 dark:bg-gray-900 h-14 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner"><span className="text-3xl font-black text-gray-900 dark:text-gray-100">{inputReps}</span></div>
                       <button onClick={() => adjustReps(1)} className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center active:scale-90 transition-all text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"><Plus size={24} /></button>
                   </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-6 shadow-xl space-y-4">
                <div className="text-center">
                  <p className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Need an Adjustment?</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Let AI adapt your workout to your current state</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      dispatch(updateEnergyContext('tired'));
                      dispatch(fetchWorkoutAdaptation({ 
                        activeContext: { energy: 'tired', time: 'normal', equipmentStatus: 'available' }, 
                        overrideHistory: overrideHistory || [],
                        currentExercise: activeContext?.currentExercise ? {
                          reps: activeContext.currentExercise.reps,
                          sets: activeContext.currentExercise.sets,
                          restSeconds: activeContext.currentExercise.restSeconds
                        } : undefined
                      }));
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition-colors active:scale-95 border border-blue-100 dark:border-blue-800"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white text-lg">😴</span></div>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">I'm Tired</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      dispatch(updateTimeContext('limited'));
                      dispatch(fetchWorkoutAdaptation({ 
                        activeContext: { energy: 'normal', time: 'limited', equipmentStatus: 'available' }, 
                        overrideHistory: overrideHistory || [],
                        currentExercise: activeContext?.currentExercise ? {
                          reps: activeContext.currentExercise.reps,
                          sets: activeContext.currentExercise.sets,
                          restSeconds: activeContext.currentExercise.restSeconds
                        } : undefined
                      }));
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-2xl transition-colors active:scale-95 border border-orange-100 dark:border-orange-800"
                  >
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-white text-lg">⏰</span></div>
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">Short on Time</span>
                  </button>
                </div>
              </div>

              <Button variant="primary" size="xl" onClick={handleLogSet} disabled={currentExercise ? completedSetsCount >= currentExercise.sets : true} className={`w-full font-black text-xl uppercase tracking-widest ${(currentExercise && completedSetsCount >= currentExercise.sets) ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : ''}`}>
                <CheckCircle2 size={28} />
                {(currentExercise && completedSetsCount >= currentExercise.sets) ? 'Exercise Complete' : `Log Set ${completedSetsCount + 1}`}
              </Button>

              <div className="flex flex-col items-center gap-4 py-4">
                {activeExerciseIndex < totalExercises - 1 && (
                   <button onClick={handleNextExercise} className="text-gray-400 dark:text-gray-500 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                     Skip to Next Exercise <SkipForward size={16} />
                   </button>
                )}
              </div>
            </div>
          </div>

          <RestTimer />

          {currentExercise && (
            <ExerciseDetailModal
              isOpen={showHowTo}
              onClose={() => setShowHowTo(false)}
              exercise={currentCatalogExercise || {
                id: currentExercise.id,
                slug: currentExercise.name.toLowerCase().replace(/\s+/g, '-'),
                name: currentExercise.name,
                primaryMuscle: ["abs" as any],
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
          )}

          {isLogging && (
            <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 animate-fade-in flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-md space-y-8 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2">Workout Complete!</h2>
                  <p className="text-gray-500 dark:text-gray-400">Great job crushing {day?.title}.</p>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest">{loggingStats.duration} Minutes</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Rate Effort (RPE)</label>
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Easy</span>
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{rpe}</span>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Max</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={rpe} onChange={(e) => setRpe(Number(e.target.value))} className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                  <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500 font-medium"><span>1</span><span>5</span><span>10</span></div>
                </div>

                <button onClick={submitLog} className="w-full bg-brand-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-brand-700 active:scale-95 transition-all text-lg">Save & Finish</button>
              </div>
            </div>
          )}

          <AdaptationPrompt
            opened={!!adaptation}
            onClose={handleRejectAdaptation}
            adaptation={mappedAdaptation as any}
            onAccept={handleAcceptAdaptation}
            onManualOverride={() => setManualOverrideOpen(true)}
          />

           {process.env.NODE_ENV === 'development' && performance.lastResponseTime && (
             <div className="fixed inset-x-4 top-20 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-lg z-50 max-w-xs mx-auto">
               <div className="flex items-center justify-between text-xs">
                 <div>
                   <p className="text-blue-800 dark:text-blue-200 font-medium">AI Response Time</p>
                   <p className={`font-bold ${performance.withinSLA ? 'text-green-600' : 'text-red-600'}`}>{performance.lastResponseTime}ms</p>
                 </div>
                 <div className="text-right">
                   <p className="text-blue-600 dark:text-blue-400">Avg: {performance.averageResponseTime.toFixed(0)}ms</p>
                   <p className="text-blue-600 dark:text-blue-400">Requests: {performance.requestCount}</p>
                 </div>
               </div>
             </div>
           )}

           {error && (
             <div className="fixed inset-x-4 bottom-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-xl z-50 max-sm mx-auto">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-red-800 dark:text-red-200 font-medium">Adaptation Failed</p>
                   <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                 </div>
                 <button onClick={handleRetryAdaptation} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Retry</button>
               </div>
             </div>
           )}

          <LiveGuidanceOverlay guidance={activeGuidance} />
          <SessionProgressHUD />
          <MilestoneCelebration milestones={milestoneHistory} />
          {transitionState.active && (
            <TransitionPrep 
              nextExercise={toTitleCase(transitionState.nextName)} 
              secondsRemaining={transitionState.seconds} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default LiveWorkoutSession;
