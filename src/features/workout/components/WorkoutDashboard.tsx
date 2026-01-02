import React, { memo } from 'react'; // Removed useState
import { useApp } from '@/context/AppContext';
import ProgramOverview from './ProgramOverview';
import NextWorkout from './NextWorkout';
// Removed ExerciseFinder import

const WorkoutDashboard = memo(() => {
  const {
    currentPlan,
    user,
  } = useApp();

  // Removed isFinderOpen state

  if (!currentPlan || !user) {
    // A loading or empty state could go here
    return (
      <div className="p-4 text-center text-gray-500">
        Loading your workout plan...
      </div>
    );
  }

  // This is where the new, simplified dashboard will be built.
  // We will add the `ProgramOverview` and `NextWorkout` components here.
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Column - Next Workout (Hero) */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <NextWorkout />
        </div>

        {/* Sidebar - Overview & Stats */}
        <div className="md:col-span-5 lg:col-span-4 space-y-6">
          <ProgramOverview />

          {/* Streak Widget */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                   🔥
                </div>
                <div>
                   <p className="text-sm text-orange-800 font-bold uppercase tracking-wider">Current Streak</p>
                   <p className="text-2xl font-black text-orange-900">
                      {user.streak?.currentStreak || 0} <span className="text-sm font-medium text-orange-700">Days</span>
                   </p>
                </div>
             </div>
             <p className="text-xs text-orange-700 mt-3 pl-13">
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
