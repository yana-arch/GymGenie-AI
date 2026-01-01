import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Circle, Activity, Trophy, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionState } from '@/types';

interface WeeklyProgressCalendarProps {
  selectedWeekIndex: number;
  onWeekSelect: (weekIndex: number) => void;
  onDaySelect: (weekIndex: number, dayIndex: number) => void;
}

const WeeklyProgressCalendar: React.FC<WeeklyProgressCalendarProps> = ({
  selectedWeekIndex,
  onWeekSelect,
  onDaySelect
}) => {
  const { currentPlan, getSessionState } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  // Default to showing only the selected week (or current week if not provided) when collapsed
  // But the UI requirement says "Current Week" by default. 
  // We'll stick to selectedWeekIndex as the "current" view context for simplicity in this component,
  // but allow expansion to see others.

  if (!currentPlan) return null;

  const getSessionStateIcon = (state: SessionState, size: number = 16) => {
    switch (state) {
      case SessionState.ACTIVE:
        return <Activity size={size} className="text-green-600" />;
      case SessionState.COMPLETED:
        return <CheckCircle2 size={size} className="text-yellow-600" />;
      case SessionState.LOGGED:
        return <Trophy size={size} className="text-blue-600" />;
      default:
        return <Circle size={size} className="text-gray-300" />;
    }
  };

  const getSessionStateColor = (state: SessionState) => {
    switch (state) {
      case SessionState.ACTIVE:
        return 'bg-green-100 border-green-300 text-green-800';
      case SessionState.COMPLETED:
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case SessionState.LOGGED:
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getWeekProgress = (weekIndex: number) => {
    const week = currentPlan.weeks[weekIndex];
    if (!week) return { completed: 0, total: 0, active: 0 };

    let completed = 0;
    let active = 0;
    let total = 0;

    week.days.forEach(day => {
      if (!day.isRestDay) {
        total++;
        const state = getSessionState(week.id, day.id);
        if (state === SessionState.LOGGED) completed++;
        if (state === SessionState.ACTIVE || state === SessionState.COMPLETED) active++;
      }
    });

    return { completed, total, active };
  };

  // Helper to determine if a day is accessible
  const isDayAccessible = (weekIndex: number, dayIndex: number) => {
      // In a real app, this would check against current date or if previous days are done
      // For now, we'll allow all days up to the first future/locked day?
      // Or simply: Previous days + current active day are accessible. Future days are locked.
      // Simplification: All days in past weeks are accessible.
      // In current week, days are accessible sequentially?
      // Let's implement a simple logic: Day is accessible if it's logged, active, or the immediate next available workout.
      // Or even simpler: Don't restrict viewing details, but maybe restrict *starting* them (which is handled elsewhere).
      // BUT requirement says: "Validate... interact with past or current days... future days disabled"
      
      // Let's assume sequential unlock for now based on state
      // Actually, standard logic: Any day with state !== inactive is accessible.
      // Plus the first inactive day (next workout).
      
      // For the purpose of "Calendar View", usually you can see the plan for future.
      // But the requirement specifically asks to disable "Future (not arrived) days".
      // Since we don't have real dates mapped to plan days yet in this schema (it's Week 1 Day 1 etc),
      // We will treat "Future" as "Days after the current active day".
      
      // Find the latest active/logged day
      // All days before and including it are accessible.
      // Plus one day ahead?
      
      // Let's stick to the prompt's "Validate date" logic.
      // Since we don't have `date` field in Day schema visible here, we'll simulate.
      // If we assume linear progression:
      
      return true; // Placeholder: Real validation needs date-based logic or sequence-based
  };

  const visibleWeeks = useMemo(() => {
    if (isExpanded) {
      return currentPlan.weeks.map((week, index) => ({ week, index }));
    }
    // Show only the selected week when collapsed
    const selectedWeek = currentPlan.weeks[selectedWeekIndex];
    return selectedWeek ? [{ week: selectedWeek, index: selectedWeekIndex }] : [];
  }, [currentPlan, selectedWeekIndex, isExpanded]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-brand-600" />
          <h3 className="text-lg font-bold text-gray-900">
            {isExpanded ? 'Full Schedule' : 'Current Week'}
          </h3>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors"
        >
          {isExpanded ? (
            <>Less <ChevronUp size={16} /></>
          ) : (
            <>More <ChevronDown size={16} /></>
          )}
        </button>
      </div>

      {/* Week List */}
      <div className="space-y-3 mb-6">
        {visibleWeeks.map(({ week, index }) => {
          const progress = getWeekProgress(index);
          const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
          const isSelected = index === selectedWeekIndex;

          return (
            <div key={week.id} className="animate-fade-in">
              <button
                onClick={() => onWeekSelect(index)}
                className={`w-full p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-100'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className={`font-bold ${isSelected ? 'text-brand-900' : 'text-gray-900'}`}>
                      Week {week.weekNumber}
                    </h4>
                    <p className="text-xs text-gray-500">{week.focus}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      progress.completed === progress.total && progress.total > 0
                        ? 'text-green-600'
                        : progress.active > 0
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                    }`}>
                      {progress.completed}/{progress.total}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressPercentage === 100
                        ? 'bg-green-500'
                        : progressPercentage > 0
                          ? 'bg-brand-500'
                          : 'bg-gray-300'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Week Day Grid - Always Visible for Context */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
          <span>Week {currentPlan.weeks[selectedWeekIndex]?.weekNumber} Overview</span>
          <span className="text-xs font-normal text-gray-400">Tap to view day</span>
        </h4>
        
        <div className="grid grid-cols-7 gap-2">
          {currentPlan.weeks[selectedWeekIndex]?.days.map((day, dayIndex) => {
            const sessionState = getSessionState(
              currentPlan.weeks[selectedWeekIndex].id,
              day.id
            );
            
            // Validation Logic:
            // A day is "future/locked" if it's not a rest day AND state is inactive AND it's far ahead?
            // Simplified for Minimalist/Workout-First:
            // - Past/Done days: Accessible
            // - Active/Today: Accessible
            // - Immediate Next: Accessible
            // - Far future: Locked/Grayed out (Visual only, or disabled interaction)
            
            // For this UI fix, let's enable all for viewing (User might want to see what's coming),
            // BUT if requirement says "Disable future", we'll style them as disabled.
            // Let's assume we can view details of any day, but visual emphasis is on past/current.
            // Wait, requirement: "Ensure user can only view/interact with past or current... Future... disabled".
            // Okay, we need to enforce disable.
            
            // Heuristic: Find index of first "Inactive" day. All days after that are disabled.
            // We need to calculate this outside the loop effectively, but for small arrays here it's fine.
            const week = currentPlan.weeks[selectedWeekIndex];
            const firstInactiveIndex = week.days.findIndex(d =>
                !d.isRestDay && getSessionState(week.id, d.id) === SessionState.INACTIVE
            );
            
            // If all done, firstInactive is -1.
            // If we are before the first inactive day, we are unlocked.
            // If we are AT the first inactive day, we are unlocked (it's the next workout).
            // If we are AFTER the first inactive day, we are locked.
            
            let isLocked = false;
            if (firstInactiveIndex !== -1 && dayIndex > firstInactiveIndex) {
                 isLocked = true;
            }
            
            // Override: Rest days are always "locked" for interaction in this context (can't click to view workout)
            if (day.isRestDay) isLocked = true;

            return (
              <button
                key={day.id}
                onClick={() => {
                    if (isLocked && !day.isRestDay) {
                        // Toast notification could go here
                        alert("You can't jump ahead! Complete previous workouts first.");
                        return;
                    }
                    onDaySelect(selectedWeekIndex, dayIndex);
                }}
                className={`aspect-square p-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  day.isRestDay
                    ? 'bg-gray-50 border-gray-100 cursor-default opacity-40'
                    : isLocked
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed grayscale'
                        : `${getSessionStateColor(sessionState)} hover:scale-105 active:scale-95 cursor-pointer`
                }`}
                disabled={day.isRestDay} // We handle custom click for locked non-rest days to show toast
                title={day.isRestDay ? 'Rest Day' : isLocked ? 'Complete previous workouts to unlock' : `${day.dayName} - ${day.title}`}
              >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {day.dayName.slice(0, 1)}
                  </div>
                  <div className="flex items-center justify-center">
                    {day.isRestDay ? (
                      <Clock size={10} className="text-gray-400" />
                    ) : (
                      getSessionStateIcon(sessionState, 12)
                    )}
                  </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simplified Legend */}
      {isExpanded && (
        <div className="border-t border-gray-100 pt-3 mt-4 animate-fade-in">
          <div className="flex justify-between text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <Circle size={8} className="text-gray-300" />
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity size={8} className="text-green-600" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy size={8} className="text-blue-600" />
              <span>Done</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WeeklyProgressCalendar);
