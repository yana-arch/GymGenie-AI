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
import { Exercise } from '@/types';
import { toTitleCase } from '@/utils/stringUtils';
import { Button, Indicator } from '@mantine/core';
import { useToast, toast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/utils/errorHandler';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { fetchWorkoutAdaptation, updateEnergyContext, updateTimeContext, clearAdaptation, setIsActive, addMilestone, addSessionVolume, setCurrentSetProgress, incrementExercisesCompleted, setActiveExerciseIndex as setActiveExerciseIndexAction, setSessionProgress, toggleFocusMode } from '../store/liveSessionSlice';
import { updateSettings as updateFormSettings, updateRepCount } from '@/features/form-correction/store/formCorrectionSlice';
import { useGuidanceLoop } from '../hooks/useGuidanceLoop';
import { useEncouragement } from '../hooks/useEncouragement';
import LiveGuidanceOverlay from './LiveGuidanceOverlay';
import MilestoneCelebration from './MilestoneCelebration';
import TransitionPrep from './TransitionPrep';
import SessionProgressHUD from './SessionProgressHUD';
import { MotionFeedback } from '@/components/ui/MotionFeedback';
import AtmosphericBackground from '@/components/ui/AtmosphericBackground';
import WorkoutHUD from './WorkoutHUD';
import ExerciseGuide from './ExerciseGuide';
import { Maximize2, Minimize2 } from 'lucide-react';
import FeatureGuard from '@/components/ui/FeatureGuard';

import { sessionGuidanceService } from '../services/SessionGuidanceService';
import { EncouragementService } from '../services/EncouragementService';
import { FormAnalysisService, FormAnalysis } from '@/features/form-correction/services/FormAnalysisService';
import { FormCorrectionService } from '@/features/form-correction/services/FormCorrectionService';
import { FormFeedbackOverlay } from '@/features/form-correction/components/FormFeedbackOverlay';
import { Pose } from '@/features/form-correction/services/PoseDetectionService';
import { RootState } from '@/store';

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
  const { focusMode, activeExerciseIndex } = liveSessionState;
  const isCoachingEnabled = useAppSelector((state: RootState) => state.featureFlags.enableCoaching);
  const cameraEnabled = useAppSelector((state: RootState) => state.formCorrection.settings.cameraEnabled && isCoachingEnabled);
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

  const [isLogging, setIsLogging] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [loggingStats, setLoggingStats] = useState({ duration: 0 });
  
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [inputReps, setInputReps] = useState<number>(0);

  const [setStartTime, setSetStartTime] = useState<number>(Date.now());
  const [lastRestTime] = useState<number>(0);

  const [showHowTo, setShowHowTo] = useState(false);
  const [isGuideMinimized, setIsGuideMinimized] = useState(false);
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

  // Form Correction Integration
  const videoRef = useRef<HTMLVideoElement>(null);
  const [formCorrectionActive, setFormCorrectionActive] = useState(false);
  const [currentPoses, setCurrentPoses] = useState<Pose[]>([]);
  const [currentFormAnalysis, setCurrentFormAnalysis] = useState<FormAnalysis | null>(null);
  const formCorrectionService = useRef<FormCorrectionService>(FormCorrectionService.getInstance());

  useEffect(() => {
    audioService.current = AudioCoachingService.getInstance();
    
    // Initialize form correction listeners
    formCorrectionService.current.registerListeners({
      onAnalysisUpdate: (analysis, poses) => {
        setCurrentPoses(poses);
        setCurrentFormAnalysis(analysis);
      },
      onStatusUpdate: (status) => {
        // Sync with Redux if needed
        dispatch(updateRepCount(status.repCount));
      },
      onAdaptationRequired: (params) => {
        dispatch(fetchWorkoutAdaptation({ 
          activeContext: { energy: 'tired', time: 'normal', equipmentStatus: 'available' }, 
          overrideHistory: [],
          currentExercise: activeContext?.currentExercise ? {
            reps: activeContext.currentExercise.reps,
            sets: activeContext.currentExercise.sets,
            restSeconds: activeContext.currentExercise.restSeconds
          } : undefined
        }));
      }
    });

    return () => {
      audioService.current?.stop();
      formCorrectionService.current.stopFormCorrection();
    };
  }, [dispatch, activeContext]);

  // Handle Form Correction Start/Stop
  useEffect(() => {
    const toggleFormCorrection = async () => {
      if (isCoachingEnabled && cameraEnabled && !formCorrectionActive && videoRef.current) {
        try {
          await formCorrectionService.current.initialize(videoRef.current);
          await formCorrectionService.current.startFormCorrection();
          setFormCorrectionActive(true);
        } catch (err) {
          console.error('Failed to start form correction:', err);
          showToast(toast.error('Camera Error', 'Could not start form correction.'));
        }
      } else if ((!cameraEnabled || !isCoachingEnabled) && formCorrectionActive) {
        await formCorrectionService.current.stopFormCorrection();
        setFormCorrectionActive(false);
        setCurrentPoses([]);
        setCurrentFormAnalysis(null);
      }
    };

    toggleFormCorrection();
  }, [cameraEnabled, isCoachingEnabled, formCorrectionActive, showToast]);

  // Update exercise type in service
  useEffect(() => {
    if (activeContext?.currentExercise) {
      formCorrectionService.current.setExercise(activeContext.currentExercise.name.toLowerCase());
    }
  }, [activeContext]);

  useEffect(() => {
    if (adaptation) {
      if (adaptation.notes) {
        audioService.current?.announceAdaptation(adaptation.notes);
      }
      showToast(toast.info("AI Adaptation Ready", "A new optimization is available for your workout."));
    }
  }, [adaptation, showToast]);

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
         const exerciseMap: Record<string, Exercise> = {};
         activeContext.day.exercises.forEach(e => {
           exerciseMap[e.id] = e as unknown as Exercise;
         });
         
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
      await Haptics.impact({ style: ImpactStyle.Heavy });
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
      volumeMilestones.forEach((m) => dispatch(addMilestone(m)));

      // Check for PBs
      const pbMilestones = sessionGuidanceService.checkPersonalBest(
        activeContext.currentExercise.id,
        inputWeight,
        inputReps,
        historicalData,
        liveSessionState.activeContext.energy
      );
      pbMilestones.forEach((m) => {
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
  }, [activeContext, completedSetsCount, activeExerciseIndex, setStartTime, startRestTimer, dispatch, inputWeight, inputReps, addSetToSession, showToast, liveSessionState.activeContext.energy, historicalData]);

  const { day, currentExercise, totalExercises } = activeContext || { day: null, currentExercise: null, totalExercises: 0 };

  useEffect(() => {
    if (currentExercise) {
      const progress = completedSetsCount / currentExercise.sets;
      dispatch(setCurrentSetProgress(progress));
    }
  }, [completedSetsCount, currentExercise?.sets, dispatch]);

  const currentRepCount = useAppSelector((state: RootState) => state.formCorrection.currentRepCount);

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

  const adjustWeight = (amount: number) => {
    Haptics.impact({ style: ImpactStyle.Light });
    setInputWeight(prev => Math.max(0, prev + amount));
  };
  
  const adjustReps = (amount: number) => {
    Haptics.impact({ style: ImpactStyle.Light });
    setInputReps(prev => Math.max(0, prev + amount));
  };

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
      action: (adaptation.newExercise ? 'substitute_exercise' : 'reduce_intensity') as 'substitute_exercise' | 'reduce_intensity',
      reasoning: adaptation.notes || ''
    };
  }, [adaptation]);

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      <AtmosphericBackground intensity={sessionProgressValue} />
      
      {!activeContext ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No active session found.</p>
          <Button variant="primary" size="lg" onClick={() => setStep("dashboard")}>Return to Dashboard</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-6 bg-transparent z-10">
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={() => setStep("dashboard")}
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20"
              >
                <ArrowLeft size={20} className="text-white" />
              </Button>
              <FeatureGuard feature="enableCoaching">
                <Button 
                  variant="secondary" 
                  size="md" 
                  onClick={() => {
                    hasShownCameraError.current = false;
                    dispatch(updateFormSettings({ cameraEnabled: !cameraEnabled }));
                  }}
                  title={cameraEnabled ? "Disable Camera" : "Enable Camera"}
                  className={`${cameraEnabled ? "text-brand-400" : "text-gray-400"} bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20`}
                >
                  {cameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
                </Button>
              </FeatureGuard>
              <Button
                variant="secondary"
                size="md"
                onClick={() => dispatch(toggleFocusMode())}
                title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                className={`${focusMode ? "text-brand-400" : "text-gray-400"} bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20`}
              >
                {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </Button>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleFinishWorkout} 
              className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-brand-400 font-black uppercase tracking-wider"
            >
              Finish
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-24 flex flex-col items-center z-10">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl space-y-6 md:space-y-10">
              <div className="text-center space-y-4 md:space-y-6">
                <div className="relative">
                  <p className="text-[10px] md:text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-2">
                    {activeExerciseIndex + 1} / {totalExercises} • {day?.title}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                      {currentExercise ? toTitleCase(currentExercise.name) : ''}
                    </h1>
                    {!focusMode && (
                      <button 
                        onClick={() => setShowHowTo(true)} 
                        className="p-2 md:p-3 bg-white/10 text-white hover:text-brand-400 rounded-full transition-all active:scale-95 backdrop-blur-sm border border-white/10"
                        aria-label="Exercise details"
                      >
                        <Search size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                {cameraEnabled && (
                  <div className="relative w-full aspect-video bg-black rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 max-w-3xl mx-auto">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <WorkoutHUD 
                      safetyStatus={currentFormAnalysis?.isValid === false ? 'warning' : 'safe'}
                      isThinking={isLoading}
                    />
                    <FormFeedbackOverlay
                      isVisible={formCorrectionActive}
                      currentPoses={currentPoses}
                      formAnalysis={currentFormAnalysis}
                      videoWidth={videoRef.current?.videoWidth || 640}
                      videoHeight={videoRef.current?.videoHeight || 480}
                    />
                    {!formCorrectionActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="text-center space-y-2">
                          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-white text-xs font-bold uppercase tracking-widest">Initializing AI Form Guard...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-center gap-2 md:gap-4">
                  <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 text-gray-300 text-[10px] md:text-xs font-bold rounded-full border border-white/10 backdrop-blur-md shadow-sm uppercase tracking-wider">{currentExercise?.sets} Sets</span>
                  <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 text-gray-300 text-[10px] md:text-xs font-bold rounded-full border border-white/10 backdrop-blur-md shadow-sm uppercase tracking-wider">{currentExercise?.reps} Reps</span>
                  <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 text-brand-400 text-[10px] md:text-xs font-bold rounded-full border border-white/10 backdrop-blur-md shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} /> {currentExercise?.restSeconds}s
                  </span>
                </div>

                {!focusMode && currentCatalogExercise?.media?.gif && (
                  <div className="w-full max-w-xl mx-auto">
                    <ExerciseGuide 
                      gifUrl={currentCatalogExercise.media.gif} 
                      exerciseName={currentExercise?.name || ''} 
                      isMinimized={isGuideMinimized}
                      onToggle={() => setIsGuideMinimized(!isGuideMinimized)}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl space-y-8 max-w-2xl mx-auto">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                   <div>
                      <p className="text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Current Set</p>
                      <p className="text-4xl md:text-5xl font-black text-white">
                        {completedSetsCount + 1} <span className="text-2xl md:text-3xl text-white/30 font-medium">/ {currentExercise?.sets}</span>
                      </p>
                   </div>
                   <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-400/20 rounded-2xl flex items-center justify-center"><Dumbbell className="text-brand-400" size={28} /></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest"><span>Weight (kg)</span></div>
                     <div className="flex items-center gap-4">
                         <button onClick={() => adjustWeight(-2.5)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-90 transition-all text-white/50 hover:text-white border border-white/10" aria-label="Decrease weight"><Minus size={24} /></button>
                         <div className="flex-1 bg-white/5 h-14 md:h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner"><span className="text-3xl md:text-4xl font-black text-white">{inputWeight}</span></div>
                         <button onClick={() => adjustWeight(2.5)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-90 transition-all text-white/50 hover:text-white border border-white/10" aria-label="Increase weight"><Plus size={24} /></button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest"><span>Reps</span></div>
                     <div className="flex items-center gap-4">
                         <button onClick={() => adjustReps(-1)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-90 transition-all text-white/50 hover:text-white border border-white/10" aria-label="Decrease reps"><Minus size={24} /></button>
                         <div className="flex-1 bg-white/5 h-14 md:h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner"><span className="text-3xl md:text-4xl font-black text-white">{inputReps}</span></div>
                         <button onClick={() => adjustReps(1)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-90 transition-all text-white/50 hover:text-white border border-white/10" aria-label="Increase reps"><Plus size={24} /></button>
                     </div>
                  </div>
                </div>
              </div>

              <FeatureGuard feature="enableCoaching">
                {!focusMode && (
                  <Indicator 
                    disabled={!adaptation} 
                    label="New" 
                    size={16} 
                    offset={10} 
                    position="top-end" 
                    color="brand" 
                    withBorder 
                    processing
                  >
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl space-y-4 max-w-2xl mx-auto">
                      <div className="text-center">
                        <p className="text-brand-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Need an Adjustment?</p>
                        <p className="text-white/50 text-sm">Let AI adapt your workout to your current state</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <MotionFeedback visible={true} type="glow" color="var(--mantine-color-blue-6)">
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
                            className="w-full flex flex-col items-center gap-2 p-4 md:p-6 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl transition-colors active:scale-95 border border-blue-500/30"
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><span className="text-white text-lg md:text-xl">😴</span></div>
                            <span className="text-sm font-bold text-blue-300">I'm Tired</span>
                          </button>
                        </MotionFeedback>
                        
                        <MotionFeedback visible={true} type="glow" color="var(--mantine-color-orange-6)">
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
                            className="w-full flex flex-col items-center gap-2 p-4 md:p-6 bg-orange-500/10 hover:bg-orange-500/20 rounded-2xl transition-colors active:scale-95 border border-orange-500/30"
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"><span className="text-white text-lg md:text-xl">⏰</span></div>
                            <span className="text-sm font-bold text-orange-300">Short on Time</span>
                          </button>
                        </MotionFeedback>
                      </div>
                    </div>
                  </Indicator>
                )}
              </FeatureGuard>

              <div className="max-w-2xl mx-auto w-full">
                <Button 
                  variant="primary" 
                  size="xl" 
                  onClick={handleLogSet} 
                  disabled={currentExercise ? completedSetsCount >= currentExercise.sets : true} 
                  className={`w-full font-black text-xl md:text-2xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 h-16 md:h-20 ${(currentExercise && completedSetsCount >= currentExercise.sets) ? 'bg-white/10 text-white/30 cursor-not-allowed border-white/10' : 'bg-brand-600 hover:bg-brand-500 border-none'}`}
                >
                  <CheckCircle2 size={32} />
                  {(currentExercise && completedSetsCount >= currentExercise.sets) ? 'Exercise Complete' : `Log Set ${completedSetsCount + 1}`}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                {activeExerciseIndex < totalExercises - 1 && (
                   <button onClick={handleNextExercise} className="text-white/30 font-bold text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors">
                     Skip to Next Exercise <SkipForward size={18} />
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
              exercise={currentCatalogExercise || ({
                id: currentExercise.id,
                slug: currentExercise.name.toLowerCase().replace(/\s+/g, '-'),
                name: currentExercise.name,
                primaryMuscle: ["abs"],
                secondaryMuscles: [],
                instructions: ["Perform the exercise as demonstrated."],
                contraindications: [],
                cues: [],
                bodyPart: ["waist"],
                equipment: ["bodyweight"],
                tags: [],
                sourceMeta: { ai_augmented: false },
                media: { gif: null }
              } as unknown as Exercise)}
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
            adaptation={mappedAdaptation!}
            currentValues={{
              weight: inputWeight,
              reps: inputReps,
              sets: currentExercise?.sets,
              rest: currentExercise?.restSeconds
            }}
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
                   <p className={`text-red-600 dark:text-red-400 text-sm`}>{error}</p>
                 </div>
                 <button onClick={handleRetryAdaptation} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Retry</button>
               </div>
             </div>
           )}

          <FeatureGuard feature="enableCoaching">
            <LiveGuidanceOverlay guidance={activeGuidance} />
            <MilestoneCelebration milestones={milestoneHistory} />
          </FeatureGuard>
          <SessionProgressHUD />
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
