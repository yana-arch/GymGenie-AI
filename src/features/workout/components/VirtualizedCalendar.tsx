import React, { useMemo, useCallback } from 'react';
import { List } from 'react-window';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Circle, Activity, Trophy, Calendar, Clock, ChevronRight } from 'lucide-react';
import { SessionState } from '@/types';

interface VirtualizedCalendarProps {
  selectedWeekIndex: number;
  onWeekSelect: (weekIndex: number) => void;
  onDaySelect: (weekIndex: number, dayIndex: number) => void;
  height?: number;
}

interface CalendarItem {
  type: 'week' | 'day-grid';
  weekIndex?: number;
  week?: any;
  progress?: {
    completed: number;
    total: number;
    active: number;
  };
  isSelected?: boolean;
}

const WEEK_ITEM_HEIGHT = 100;
const DAY_GRID_HEIGHT = 200;

const VirtualizedCalendar: React.FC<VirtualizedCalendarProps> = ({
  selectedWeekIndex,
  onWeekSelect,
  onDaySelect,
  height = 600
}) => {
  const { currentPlan, getSessionState } = useApp();

  const getSessionStateIcon = useCallback((state: SessionState, size: number = 16) => {
    switch (state) {
      case SessionState.ACTIVE:
        return <Activity size={size} className="text-green-600 dark:text-green-400" />;
      case SessionState.COMPLETED:
        return <CheckCircle2 size={size} className="text-yellow-600 dark:text-yellow-400" />;
      case SessionState.LOGGED:
        return <Trophy size={size} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Circle size={size} className="text-gray-300 dark:text-gray-600" />;
    }
  }, []);

  const getSessionStateColor = useCallback((state: SessionState) => {
    switch (state) {
      case SessionState.ACTIVE:
        return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200';
      case SessionState.COMPLETED:
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case SessionState.LOGGED:
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400';
    }
  }, []);

  const getWeekProgress = useCallback((weekIndex: number) => {
    if (!currentPlan) return { completed: 0, total: 0, active: 0 };
    
    const week = currentPlan.weeks[weekIndex];
    if (!week) return { completed: 0, total: 0, active: 0 };

    let completed = 0;
    let active = 0;
    let total = 0;

    week.days.forEach((day: any) => {
      if (!day.isRestDay) {
        total++;
        const state = getSessionState(week.id, day.id);
        if (state === SessionState.LOGGED) completed++;
        if (state === SessionState.ACTIVE || state === SessionState.COMPLETED) active++;
      }
    });

    return { completed, total, active };
  }, [currentPlan, getSessionState]);

  // Create calendar items for virtualization
  const calendarItems = useMemo(() => {
    if (!currentPlan) return [];
    
    const items: CalendarItem[] = [];
    
    currentPlan.weeks.forEach((week: any, weekIndex: number) => {
      const progress = getWeekProgress(weekIndex);
      const isSelected = weekIndex === selectedWeekIndex;
      
      // Add week item
      items.push({
        type: 'week',
        weekIndex,
        week,
        progress,
        isSelected
      });
      
      // Add day grid for selected week
      if (isSelected) {
        items.push({
          type: 'day-grid',
          weekIndex,
          week
        });
      }
    });
    
    return items;
  }, [currentPlan, selectedWeekIndex, getWeekProgress]);

  const getItemSize = useCallback((index: number) => {
    const item = calendarItems[index];
    return item?.type === 'day-grid' ? DAY_GRID_HEIGHT : WEEK_ITEM_HEIGHT;
  }, [calendarItems]);

  class Row extends React.PureComponent<{ index: number; style: React.CSSProperties; data: any }> {
    render() {
      const { index, style, data } = this.props;
      const {
        calendarItems,
        onWeekSelect,
        onDaySelect,
        getSessionState,
        getSessionStateIcon,
        getSessionStateColor,
      } = data;
      const item = calendarItems[index];

      if (!item) return null;

      if (item.type === 'week') {
        const { week, weekIndex, progress, isSelected } = item;
        const progressPercentage = progress!.total > 0 ? (progress!.completed / progress!.total) * 100 : 0;

        return (
          <div style={style} className="px-4 pb-3">
            <button
              onClick={() => onWeekSelect(weekIndex!)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-lg ${isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-gray-900 dark:text-gray-100'}`}>
                      Week {week.weekNumber}
                    </h4>
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform ${isSelected ? 'rotate-90 text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} 
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{week.focus}</p>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    progress!.completed === progress!.total && progress!.total > 0
                      ? 'text-green-600 dark:text-green-400'
                      : progress!.active > 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {progress!.completed}/{progress!.total}
                  </div>
                  {progress!.active > 0 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      {progress!.active} active
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercentage === 100
                      ? 'bg-green-500'
                      : progressPercentage > 0
                        ? 'bg-brand-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </button>
          </div>
        );
      }

      if (item.type === 'day-grid') {
        const { week, weekIndex } = item;
        
        return (
          <div style={style} className="px-4 pb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Week {week.weekNumber} Days
              </h4>
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {week.days.map((day: any, dayIndex: number) => {
                  const sessionState = getSessionState(week.id, day.id);
                  
                  return (
                    <button
                      key={day.id}
                      onClick={() => onDaySelect(weekIndex!, dayIndex)}
                      className={`aspect-square p-2 rounded-lg border text-center transition-all hover:shadow-sm ${
                        day.isRestDay
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-default'
                          : getSessionStateColor(sessionState)
                      }`}
                      disabled={day.isRestDay}
                      title={day.isRestDay ? 'Rest Day' : `${day.dayName} - ${day.title}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {day.dayName.slice(0, 3)}
                        </div>
                        <div className="flex items-center justify-center">
                          {day.isRestDay ? (
                            <Clock size={12} className="text-gray-400 dark:text-gray-500" />
                          ) : (
                            getSessionStateIcon(sessionState, 12)
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Circle size={12} className="text-gray-300 dark:text-gray-600" />
                    <span className="text-gray-600 dark:text-gray-400">Not Started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-green-600 dark:text-green-400" />
                    <span className="text-gray-600 dark:text-gray-400">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-yellow-600 dark:text-yellow-400" />
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy size={12} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">Logged</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return null;
    }
  }

  if (!currentPlan) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Weekly Progress</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400 dark:text-gray-500">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <Calendar size={24} className="opacity-40" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No workout plan available</p>
          <p className="text-xs mt-1">Generate a plan to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-brand-600 dark:text-brand-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Weekly Progress</h3>
      </div>

      {/* Virtualized Calendar */}
      <div style={{ height: `${height}px`, overflowY: 'auto' }}>
        {calendarItems.map((item, index) => (
          <Row
            key={index}
            index={index}
            style={{}}
            data={{
              calendarItems,
              onWeekSelect,
              onDaySelect,
              getSessionState,
              getSessionStateIcon,
              getSessionStateColor,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VirtualizedCalendar;
