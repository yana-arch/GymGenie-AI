import React, { memo } from 'react';
import { useApp } from '@/context/AppContext';
import ProgramOverview from './ProgramOverview';
import NextWorkout from './NextWorkout';

const WorkoutDashboard = memo(() => {
  const {
    currentPlan,
    user,
  } = useApp();

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
          
          {/* Quick Tip Widget for Desktop filling space */}
          <div className="hidden md:block bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
             <p className="text-sm text-gray-500 font-medium">Keep it up!</p>
             <p className="text-xs text-gray-400 mt-1">Consistency is key to progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
});

WorkoutDashboard.displayName = 'WorkoutDashboard';

export default WorkoutDashboard;
