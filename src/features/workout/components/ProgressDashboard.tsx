import React, { useCallback, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, TrendingUp, Calendar, History, BarChart2 } from 'lucide-react';
import TrainingVolumeChart from './TrainingVolumeChart';
import WeeklyProgressCalendar from './WeeklyProgressCalendar';
import WorkoutHistoryList from './WorkoutHistoryList';
import { SessionState } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ProgressDashboardProps {
  onBack: () => void;
  onNavigateToWorkout?: (weekId: string, dayId: string) => void;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onBack, onNavigateToWorkout }) => {
  const { history, currentPlan, getSessionState } = useApp();
  const { isDesktop: isDesktopFn } = useBreakpoint();
  const isDesktop = isDesktopFn();
  
  // State for Week Selection in Calendar
  // Default to current week or first week
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => {
    if (!currentPlan) return 0;
    // Find first incomplete week or return last week
    // Logic can be refined based on requirement "Current Week"
    return Math.max(0, currentPlan.weeks.findIndex(w => {
        // Simple heuristic: week is "current" if it has any non-completed active days
        // or just default to 0 for now if complex.
        // Let's stick to 0 or passed in prop if we had one.
        // Actually, let's try to find the active week.
        const hasActiveOrPending = w.days.some(d => {
            const state = getSessionState(w.id, d.id);
            return state === SessionState.ACTIVE || state === SessionState.INACTIVE;
        });
        return hasActiveOrPending;
    }));
  });

  const handleWeekSelect = useCallback((weekIndex: number) => {
    setSelectedWeekIndex(weekIndex);
  }, []);

  const handleDaySelect = useCallback((weekIndex: number, dayIndex: number) => {
    if (!currentPlan || !onNavigateToWorkout) return;
    const week = currentPlan.weeks[weekIndex];
    const day = week?.days[dayIndex];
    if (week && day && !day.isRestDay) {
        onNavigateToWorkout(week.id, day.id);
    }
  }, [currentPlan, onNavigateToWorkout]);

  // Derived stats for the header
  const totalWorkouts = history.length;
  const totalMinutes = useMemo(() => history.reduce((acc, curr) => acc + curr.durationMinutes, 0), [history]);

  if (!currentPlan) {
      return null; // Or loading state
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in absolute inset-0 z-20 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <TrendingUp className="text-brand-600" /> Progress
            </h2>
          </div>
        </div>
        
        {/* Mini Stats in Header for Mobile */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <div className="text-right hidden sm:block">
                <p className="font-bold text-gray-900">{totalWorkouts}</p>
                <p>Workouts</p>
            </div>
            <div className="text-right hidden sm:block">
                <p className="font-bold text-gray-900">{totalMinutes}m</p>
                <p>Total Time</p>
            </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={`p-4 ${isDesktop ? 'max-w-7xl mx-auto w-full grid grid-cols-12 gap-6' : 'space-y-6'}`}>
        
        {/* Main Column (Charts & History) - Takes more space on Desktop */}
        <div className={`${isDesktop ? 'col-span-8 space-y-6' : 'space-y-6'}`}>
            
            {/* Training Volume Chart */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart2 size={20} className="text-brand-600" />
                        <h3 className="text-lg font-bold text-gray-900">Training Volume</h3>
                    </div>
                </div>
                <TrainingVolumeChart history={history} />
            </section>

             {/* Recent History List */}
             <section>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <History size={20} className="text-brand-600" />
                    <h3 className="text-lg font-bold text-gray-900">Recent History</h3>
                </div>
                <WorkoutHistoryList history={history} />
            </section>
        </div>

        {/* Side Column (Calendar & Summary) - Sticky on Desktop */}
        <div className={`${isDesktop ? 'col-span-4' : ''}`}>
            <div className={`${isDesktop ? 'sticky top-24 space-y-6' : 'space-y-6'}`}>
                {/* Calendar */}
                <WeeklyProgressCalendar 
                    selectedWeekIndex={selectedWeekIndex}
                    onWeekSelect={handleWeekSelect}
                    onDaySelect={handleDaySelect}
                />

                {/* Empty State Call to Action (if no history) */}
                {history.length === 0 && (
                     <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Start Your Journey!</h3>
                        <p className="text-brand-50 text-sm mb-4">
                            You haven't logged any workouts yet. Select a day from the calendar to begin.
                        </p>
                        <button 
                            className="w-full bg-white text-brand-600 font-bold py-2 px-4 rounded-lg hover:bg-brand-50 transition-colors"
                            onClick={() => {
                                // Default action: find first active day?
                                // For now, just a visual cue since calendar is right there
                            }}
                        >
                            View Plan
                        </button>
                     </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressDashboard;