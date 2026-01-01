import React, { useCallback, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, TrendingUp, Calendar, History, BarChart2, X, Dumbbell, Clock, Flame } from 'lucide-react';
import TrainingVolumeChart from './TrainingVolumeChart';
import WeeklyProgressCalendar from './WeeklyProgressCalendar';
import WorkoutHistoryList from './WorkoutHistoryList';
import { SessionState, Exercise } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface ProgressDashboardProps {
  onBack: () => void;
  onNavigateToWorkout?: (weekId: string, dayId: string) => void;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onBack, onNavigateToWorkout }) => {
  const { history, currentPlan, getSessionState } = useApp();
  const { isDesktop: isDesktopFn } = useBreakpoint();
  const isDesktop = isDesktopFn();
  
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    weekIndex: number;
    dayIndex: number;
    weekId: string;
    dayId: string;
    exercises: Exercise[];
    title: string;
    dayName: string;
  } | null>(null);

  // State for Week Selection in Calendar
  // Default to current week or first week
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => {
    if (!currentPlan) return 0;
    // Find first incomplete week or return last week
    return Math.max(0, currentPlan.weeks.findIndex(w => {
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
    if (!currentPlan) return;
    const week = currentPlan.weeks[weekIndex];
    const day = week?.days[dayIndex];
    if (week && day && !day.isRestDay) {
        // Instead of navigating, we set selected day details for inline view/modal
        setSelectedDayDetails({
            weekIndex,
            dayIndex,
            weekId: week.id,
            dayId: day.id,
            exercises: day.exercises,
            title: day.title,
            dayName: day.dayName
        });
    }
  }, [currentPlan]);

  const closeDayDetails = () => setSelectedDayDetails(null);

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
        <div className={`${isDesktop ? 'col-span-8 space-y-6' : 'space-y-6 order-2 md:order-1'}`}>
            
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
        <div className={`${isDesktop ? 'col-span-4 order-2' : 'order-1'}`}>
            <div className={`${isDesktop ? 'sticky top-24 space-y-6' : 'space-y-6'}`}>
                {/* Calendar */}
                <WeeklyProgressCalendar
                    selectedWeekIndex={selectedWeekIndex}
                    onWeekSelect={handleWeekSelect}
                    onDaySelect={handleDaySelect}
                />

                {/* Desktop Day Details Panel */}
                {isDesktop && selectedDayDetails && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{selectedDayDetails.dayName}</h4>
                                 <h3 className="text-xl font-bold text-gray-900">{selectedDayDetails.title}</h3>
                             </div>
                             <button onClick={closeDayDetails} className="p-1 hover:bg-gray-100 rounded-full">
                                 <X size={20} className="text-gray-400" />
                             </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                             {selectedDayDetails.exercises.map((ex, i) => (
                                 <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                     <div className="bg-white p-2 rounded-lg border border-gray-100 shrink-0">
                                         <Dumbbell size={16} className="text-brand-600" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm text-gray-900">{ex.name}</p>
                                         <p className="text-xs text-gray-500">{ex.sets} sets × {ex.reps} reps</p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                         
                         {onNavigateToWorkout && (
                             <button
                                onClick={() => onNavigateToWorkout(selectedDayDetails.weekId, selectedDayDetails.dayId)}
                                className="w-full mt-4 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                             >
                                 Go to Workout
                             </button>
                         )}
                    </div>
                )}

                {/* Empty State Call to Action (if no history) */}
                {history.length === 0 && !selectedDayDetails && (
                     <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Start Your Journey!</h3>
                        <p className="text-brand-50 text-sm mb-4">
                            You haven't logged any workouts yet. Select a day from the calendar to begin.
                        </p>
                     </div>
                )}
            </div>
        </div>

      </div>

      {/* Mobile Day Details Modal */}
      {!isDesktop && selectedDayDetails && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeDayDetails}>
              <div
                className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
                onClick={e => e.stopPropagation()}
              >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedDayDetails.dayName}</p>
                          <h3 className="text-lg font-bold text-gray-900">{selectedDayDetails.title}</h3>
                      </div>
                      <button onClick={closeDayDetails} className="p-2 bg-gray-100 rounded-full">
                          <X size={20} className="text-gray-600" />
                      </button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto">
                      <div className="space-y-3">
                           {selectedDayDetails.exercises.map((ex, i) => (
                               <div key={i} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                                   <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0 text-brand-600">
                                       <Dumbbell size={18} />
                                   </div>
                                   <div className="flex-1">
                                       <p className="font-bold text-gray-900 text-sm">{ex.name}</p>
                                       <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                           <span className="flex items-center gap-1"><Flame size={10} /> Set {ex.sets}</span>
                                           <span className="flex items-center gap-1"><Clock size={10} /> Reps {ex.reps}</span>
                                       </div>
                                   </div>
                               </div>
                           ))}
                      </div>
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                       {onNavigateToWorkout && (
                             <button
                                onClick={() => {
                                    onNavigateToWorkout(selectedDayDetails.weekId, selectedDayDetails.dayId);
                                    closeDayDetails();
                                }}
                                className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-lg active:scale-95"
                             >
                                 Start Workout
                             </button>
                         )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProgressDashboard;