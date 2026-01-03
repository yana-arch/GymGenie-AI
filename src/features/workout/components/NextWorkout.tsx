import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { SessionState } from '@/types';

const NextWorkout: React.FC = () => {
  const { currentPlan, getSessionState, startWorkoutSession, setStep } = useApp();

  const nextWorkoutInfo = useMemo(() => {
    if (!currentPlan) return null;

    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        if (day.isRestDay) continue;

        const sessionState = getSessionState(week.id, day.id);
        if (sessionState !== SessionState.LOGGED) {
          return {
            weekId: week.id,
            dayId: day.id,
            weekNumber: week.weekNumber,
            dayName: day.dayName,
            title: day.title,
            exerciseCount: day.exercises.length,
            sessionState: sessionState,
          };
        }
      }
    }

    return null; // All workouts completed
  }, [currentPlan, getSessionState]);

  if (!nextWorkoutInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">All Done!</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">You've completed all workouts in this plan.</p>
      </div>
    );
  }

  const { weekId, dayId, dayName, title, exerciseCount, sessionState } = nextWorkoutInfo;
  const isSessionActive = sessionState === SessionState.ACTIVE || sessionState === SessionState.COMPLETED;

  const handleStartSession = async () => {
    if (!isSessionActive) {
      try {
        await startWorkoutSession(weekId, dayId);
      } catch (error) {
        console.error("Failed to start session:", error);
        return; // Don't navigate if start failed
      }
    }
    setStep('session');
  };

  return (
    <div className="bg-gradient-to-br from-brand-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg opacity-80">{dayName}</p>
          <h3 className="text-3xl font-extrabold mt-1">{title}</h3>
          <p className="mt-2 opacity-90">{exerciseCount} exercises</p>
        </div>
      </div>
      <button
        onClick={handleStartSession}
        className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-lg shadow-md"
      >
        <PlayCircle size={24} />
        <span>{isSessionActive ? 'Continue Workout' : 'Start Workout'}</span>
      </button>
    </div>
  );
};

export default NextWorkout;
