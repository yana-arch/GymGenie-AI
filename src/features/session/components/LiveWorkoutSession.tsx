import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, CheckCircle2, Play, Pause, SkipForward, Save, Clock, Star } from 'lucide-react';
import RestTimer from '@/src/features/workout/components/RestTimer';
import { SessionState } from '@/types';
import { SetPerformance, EnhancedWorkoutSession } from '@/types/enhanced';
import { useDispatch } from 'react-redux';
import { addSetToSession } from '../store/sessionSlice';
import { QualityScoreCalculator } from '../services/QualityScoreCalculator';
import { WorkoutSession } from '../services/WorkoutSession';

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
    isTimerRunning
  } = useApp();

  const dispatch = useDispatch();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [loggingStats, setLoggingStats] = useState({ duration: 0 });
  
  // Track set timing
  const [setStartTime, setSetStartTime] = useState<number>(Date.now());
  const [lastRestTime, setLastRestTime] = useState<number>(0);

  // Derived state for current workout context
  const activeContext = useMemo(() => {
    if (!currentPlan || !currentSession) return null;
    
    const week = currentPlan.weeks.find(w => w.id === currentSession.weekId);
    const day = week?.days.find(d => d.id === currentSession.dayId);
    
    if (!week || !day) return null;

    // Filter out completed exercises or just show all in order?
    // Usually live tracking follows the order.
    const currentExercise = day.exercises[activeExerciseIndex];
    
    return { week, day, currentExercise, totalExercises: day.exercises.length };
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">No active session found.</p>
        <button
          onClick={() => setStep('dashboard')}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold"
        >
          Return to Dashboard
        </button>
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
         // We might need to reconstruct the class instance if it's lost in Redux
         // For now, let's assume we pass the raw object and cast it inside if needed or utility handles it
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
      setStep('dashboard');
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

  const handleLogSet = React.useCallback(() => {
    if (!activeContext) return;

    const now = Date.now();
    const duration = now - setStartTime;
    // const actualRestTime = lastRestTime; // This needs better tracking logic to be accurate
    
    const setPerformance: SetPerformance = {
        id: crypto.randomUUID(),
        setNumber: completedSetsCount + 1,
        weight: 0, // Placeholder, would come from input
        reps: parseInt(currentExercise.reps) || 0, // Placeholder
        completedAt: now,
        targetRestTime: currentExercise.restSeconds,
        actualRestTime: 0, // Would need to track this from previous rest timer
        duration: duration
    };

    // Dispatch action to Redux to save set immediately
    dispatch(addSetToSession({
        exerciseId: currentExercise.id,
        set: setPerformance
    }));

    // Reset for next set
    setSetStartTime(now);

    // Auto-start rest timer if defined
    if (currentExercise.restSeconds > 0) {
      startRestTimer(currentExercise.restSeconds);
    }
  }, [activeContext, completedSetsCount, currentExercise, setStartTime, startRestTimer, dispatch]);

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      {/* Top Bar: Minimal Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
        <button 
          onClick={() => setStep('dashboard')}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-gray-900">{day.title}</h2>
          <p className="text-xs text-gray-500">{activeExerciseIndex + 1} of {totalExercises}</p>
        </div>
        <button 
          onClick={handleFinishWorkout}
          className="text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          Finish
        </button>
      </div>

      {/* Main Content: Current Exercise */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-md space-y-8">
          
          {/* Exercise Title & Info */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {currentExercise.name}
            </h1>
            <div className="flex justify-center gap-4 text-sm text-gray-500 font-medium">
              <span className="bg-gray-100 px-3 py-1 rounded-full">{currentExercise.sets} Sets</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full">{currentExercise.reps} Reps</span>
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={12} /> {currentExercise.restSeconds}s
              </span>
            </div>
          </div>

          {/* Active Set Card */}
          <div className="bg-brand-50/50 border-2 border-brand-100 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 shadow-sm">
            <div className="text-center">
              <p className="text-brand-600 font-bold uppercase tracking-widest text-sm mb-1">Current Set</p>
              <p className="text-5xl font-black text-gray-900">
                {completedSetsCount + 1} <span className="text-2xl text-gray-400 font-medium">/ {currentExercise.sets}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase">Weight</p>
                  <p className="text-2xl font-bold text-gray-900">-- <span className="text-sm text-gray-400">kg</span></p>
               </div>
               <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase">Reps</p>
                  <p className="text-2xl font-bold text-gray-900">{currentExercise.reps}</p>
               </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleLogSet}
            disabled={completedSetsCount >= currentExercise.sets}
            className={`w-full text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xl ${
                completedSetsCount >= currentExercise.sets ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900'
            }`}
          >
            <CheckCircle2 size={28} />
            {completedSetsCount >= currentExercise.sets ? 'Exercise Complete' : `Log Set ${completedSetsCount + 1}`}
          </button>

          {/* Navigation */}
          {activeExerciseIndex < totalExercises - 1 && (
             <button 
               onClick={handleNextExercise}
               className="w-full text-gray-500 font-bold py-3 flex items-center justify-center gap-2 hover:text-gray-900 transition-colors"
             >
               Skip to Next Exercise <SkipForward size={18} />
             </button>
          )}

        </div>
      </div>

      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Logging Modal */}
      {isLogging && (
        <div className="absolute inset-0 z-50 bg-white animate-fade-in flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Workout Complete!</h2>
              <p className="text-gray-500">Great job crushing {activeContext?.day.title}.</p>
              <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">{loggingStats.duration} Minutes</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Rate Effort (RPE)</label>
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-gray-400">Easy</span>
                <span className="text-2xl font-black text-brand-600">{rpe}</span>
                <span className="text-xs font-bold text-gray-400">Max</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
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