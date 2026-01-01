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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ProgramOverview />
      <NextWorkout />
    </div>
  );
});

WorkoutDashboard.displayName = 'WorkoutDashboard';

export default WorkoutDashboard;
