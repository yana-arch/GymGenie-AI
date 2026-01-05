import React, { memo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import ProgramOverview from './ProgramOverview';
import NextWorkout from './NextWorkout';
import TodaysWorkout from './TodaysWorkout';
import ExerciseFinder from './ExerciseFinder';
import { Exercise } from '@/types';

const WorkoutDashboard = memo(() => {
  const {
    currentPlan,
    user,
    startWorkoutSession,
    setStep,
  } = useApp();
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  if (!currentPlan || !user) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading your workout plan...
      </div>
    );
  }

  if (isFinderOpen) {
    return <ExerciseFinder onSelectExercise={() => setIsFinderOpen(false)} onClose={() => setIsFinderOpen(false)} isOpen={isFinderOpen} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NextWorkout />
          <TodaysWorkout 
            onStartWorkout={async (weekId, dayId) => {
              await startWorkoutSession(weekId, dayId);
              setStep('session');
            }} 
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ProgramOverview />
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                   🔥
                </div>
                <div>
                   <p className="text-sm text-orange-800 dark:text-orange-200 font-bold uppercase tracking-wider">Current Streak</p>
                   <p className="text-2xl font-black text-orange-900 dark:text-orange-100">
                      {user.streak?.currentStreak || 0} <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Days</span>
                   </p>
                </div>
             </div>
             <p className="text-xs text-orange-700 dark:text-orange-300 mt-3 pl-13">
                Longest: {user.streak?.longestStreak || 0} Days
             </p>
          </div>
        </div>
      </div>
    </div>
  );
});

WorkoutDashboard.displayName = 'WorkoutDashboard';

export default WorkoutDashboard;
