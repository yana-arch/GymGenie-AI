import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Circle, Activity, Trophy, Calendar, Clock } from 'lucide-react';
import { SessionState } from '../types';

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-brand-600" />
        <h3 className="text-lg font-bold text-gray-900">Weekly Progress</h3>
      </div>

      {/* Week Selector with Progress */}
      <div className="space-y-3 mb-6">
        {currentPlan.weeks.map((week, weekIndex) => {
          const progress = getWeekProgress(weekIndex);
          const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
          const isSelected = weekIndex === selectedWeekIndex;

          return (
            <button
              key={week.id}
              onClick={() => onWeekSelect(weekIndex)}
              className={`w-full p-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-brand-50 border-brand-200 shadow-sm'
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
                  <div className="text-xs text-gray-400">
                    {progress.active > 0 && `${progress.active} active`}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
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
          );
        })}
      </div>

      {/* Selected Week Day Grid */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-bold text-gray-700 mb-3">
          Week {currentPlan.weeks[selectedWeekIndex]?.weekNumber} Days
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
                className={`aspect-square p-2 rounded-lg border text-center transition-all hover:shadow-sm ${
                  day.isRestDay
                    ? 'bg-gray-50 border-gray-200 cursor-default'
                    : getSessionStateColor(sessionState)
                }`}
                disabled={day.isRestDay}
                title={day.isRestDay ? 'Rest Day' : `${day.dayName} - ${day.title}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs font-bold">
                    {day.dayName.slice(0, 3)}
                  </div>
                  <div className="flex items-center justify-center">
                    {day.isRestDay ? (
                      <Clock size={12} className="text-gray-400" />
                    ) : (
                      getSessionStateIcon(sessionState, 12)
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Circle size={12} className="text-gray-300" />
            <span className="text-gray-600">Not Started</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-green-600" />
            <span className="text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={12} className="text-yellow-600" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={12} className="text-blue-600" />
            <span className="text-gray-600">Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgressCalendar;