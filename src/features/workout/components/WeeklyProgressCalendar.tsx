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
            
            return (
              <button
                key={day.id}
                onClick={() => onDaySelect(selectedWeekIndex, dayIndex)}
                className={`aspect-square p-1 rounded-lg border text-center transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 ${
                  day.isRestDay
                    ? 'bg-gray-50 border-gray-100 cursor-default opacity-60'
                    : getSessionStateColor(sessionState)
                }`}
                disabled={day.isRestDay}
                title={day.isRestDay ? 'Rest Day' : `${day.dayName} - ${day.title}`}
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
