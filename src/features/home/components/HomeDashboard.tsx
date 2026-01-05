import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PlayCircle, Camera, Scale, Home, Calendar, Flame, Target, Zap } from 'lucide-react';
import { SessionState } from '@/types';
import { Button } from '@/components/ui';

const HomeDashboard: React.FC = () => {
  const { user, currentPlan, getSessionState, startWorkoutSession, setStep, setActiveView } = useApp();

  const todayInfo = useMemo(() => {
    if (!currentPlan) return null;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find the current week and day based on the day of week
    // This is a simplified approach - in a real app you'd track progress
    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        // For demo purposes, we'll just show the first non-rest day
        if (!day.isRestDay) {
          const sessionState = getSessionState(week.id, day.id);
          return {
            weekId: week.id,
            dayId: day.id,
            weekNumber: week.weekNumber,
            dayName: day.dayName,
            title: day.title,
            exerciseCount: day.exercises.length,
            sessionState: sessionState,
            isRestDay: day.isRestDay,
          };
        }
      }
    }

    return null;
  }, [currentPlan, getSessionState]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleStartWorkout = async () => {
    if (!todayInfo) return;
    const { weekId, dayId, sessionState } = todayInfo;
    const isSessionActive = sessionState === SessionState.ACTIVE || sessionState === SessionState.COMPLETED;

    if (!isSessionActive) {
      try {
        await startWorkoutSession(weekId, dayId);
      } catch (error) {
        console.error("Failed to start session:", error);
        return;
      }
    }
    setStep('session');
  };

  const handleScanMeal = () => {
    setActiveView('kitchen');
  };

  const handleLogWeight = () => {
    setActiveView('profile');
  };

  const handleViewProgress = () => {
    setActiveView('progress');
  };

  // Calculate nutrition summary (mock data for now)
  const nutritionSummary = {
    consumed: 1200,
    goal: user?.tdee || 2000,
    remaining: (user?.tdee || 2000) - 1200,
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 md:bg-white md:dark:bg-gray-800 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {greeting}, {user?.name || 'User'}!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {todayDate}
            </p>
          </div>
          <Home className="text-brand-600 dark:text-brand-400" size={32} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 desktop:grid-cols-12 gap-6">
            {/* Main Content Area */}
            <div className="desktop:col-span-8 space-y-6">
              {/* Widgets Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workout Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Target className="text-blue-500" size={20} />
                      Today's Workout
                    </h3>
                    <Calendar className="text-gray-400" size={16} />
                  </div>

                  {todayInfo ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {todayInfo.dayName}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {todayInfo.title} • {todayInfo.exerciseCount} exercises
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleStartWorkout}
                        className="w-full"
                      >
                        <PlayCircle size={20} />
                        {todayInfo.sessionState === SessionState.ACTIVE || todayInfo.sessionState === SessionState.COMPLETED
                          ? 'Continue Workout'
                          : 'Start Workout'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <Target size={32} className="mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">Rest Day</p>
                    </div>
                  )}
                </div>

                {/* Nutrition Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Flame className="text-orange-500" size={20} />
                      Nutrition Summary
                    </h3>
                    <Scale className="text-gray-400" size={16} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Consumed</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {nutritionSummary.consumed} kcal
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Goal</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {nutritionSummary.goal} kcal
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Remaining
                        </span>
                        <span className={`font-bold ${nutritionSummary.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(nutritionSummary.remaining)} kcal
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleScanMeal}
                      className="w-full"
                    >
                      <Camera size={20} />
                      Scan Meal
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <Zap className="text-purple-500" size={20} />
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartWorkout}
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <PlayCircle size={24} />
                    <span className="text-sm">Start Workout</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleScanMeal}
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <Camera size={24} />
                    <span className="text-sm">Scan Meal</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleLogWeight}
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <Scale size={24} />
                    <span className="text-sm">Log Weight</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleViewProgress}
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <Target size={24} />
                    <span className="text-sm">View Progress</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar - Only visible on extra large screens */}
            <div className="hidden desktop:block desktop:col-span-4 space-y-6">
              {/* Streak Card */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    🔥 Current Streak
                  </h3>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {user?.streak?.currentStreak || 0}
                  </div>
                  <p className="text-sm opacity-90">
                    {user?.streak?.currentStreak === 1 ? 'day' : 'days'} in a row
                  </p>
                  {user?.streak?.longestStreak && user.streak.longestStreak > (user.streak.currentStreak || 0) && (
                    <p className="text-xs opacity-75 mt-2">
                      Personal best: {user.streak.longestStreak} days
                    </p>
                  )}
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">💪</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Daily Motivation</h3>
                </div>
                <blockquote className="text-gray-600 dark:text-gray-400 italic">
                  "The only bad workout is the one that didn't happen."
                </blockquote>
                <cite className="text-sm text-gray-500 dark:text-gray-500 mt-2 block">
                  - Unknown
                </cite>
              </div>

              {/* Recent Activity Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    📈 Recent Activity
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Workout Completed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                      <Camera className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Meal Logged</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
