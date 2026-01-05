import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, CheckCircle2, Play, Pause, SkipForward, Save, Clock, Star, Minus, Plus, Repeat, Dumbbell, Search } from 'lucide-react';
import RestTimer from '@/features/workout/components/RestTimer';
import { SessionState } from '@/types';
import { SetPerformance, EnhancedWorkoutSession } from '@/types/enhanced';
import { useDispatch } from 'react-redux';
import { addSetToSession as addSetToSessionAction } from '../store/sessionSlice';
import { QualityScoreCalculator } from '../services/QualityScoreCalculator';
import { WorkoutSession } from '../services/WorkoutSession';
import exerciseRegistry from '@/data/ExerciseRegistry.json';
import ExerciseDetailModal from '@/features/workout/components/ExerciseDetailModal';
import { exerciseCatalogService } from '@/features/workout/services/ExerciseCatalogService';
import { Exercise } from '@/types/schemas';
import { toTitleCase } from '@/utils/stringUtils';
import { Button } from '@/components/ui';

const LiveWorkoutSession = () => {
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

  const dispatch = useDispatch();

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
    if (activeContext && currentSession) {
      // Calculate duration for display
      const duration = Math.max(1, Math.round((Date.now() - currentSession.startTime) / 60000));
      setLoggingStats({ duration });
      
      // Only complete if still active
      if (currentSession.state === SessionState.ACTIVE) {
        try {
          await sessionManager.completeSession();
        } catch (error) {
          console.error("Failed to complete session:", error);
          // If error suggests invalid transition, it might be already completed
          // We can proceed to logging UI
        }
      }
      
      setIsLogging(true);
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
         strengths: [],
         improvements: [],
         nextWorkoutRecommendations: []
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
    if (!activeContext) return;

    const now = Date.now();
    const duration = now - setStartTime;
    
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
    try {
        await addSetToSession(currentExercise.id, setPerformance);
    } catch (error) {
        console.error('Failed to log set:', error);
    }
    
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
  }, [activeContext, completedSetsCount, currentExercise, setStartTime, startRestTimer, dispatch, inputWeight, inputReps, addSetToSession]);

  const [showHowTo, setShowHowTo] = useState(false);
  const [currentCatalogExercise, setCurrentCatalogExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
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
    };
    loadDetails();
  }, [activeContext]);

  const adjustWeight = (amount: number) => setInputWeight(prev => Math.max(0, prev + amount));
  const adjustReps = (amount: number) => setInputReps(prev => Math.max(0, prev + amount));

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
    </div>
  );
};

export default LiveWorkoutSession;
