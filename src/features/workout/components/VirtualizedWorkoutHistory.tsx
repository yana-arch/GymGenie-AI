import React, { useState, useMemo, useCallback } from 'react';
import { List } from 'react-virtualized';
import { useApp } from '@/context/AppContext';
import { Calendar, CheckCircle2, TrendingUp, ArrowLeft, Cloud, CloudOff, BrainCircuit, Star, Trophy, Activity, Clock, Filter, Eye, Play } from 'lucide-react';

interface VirtualizedWorkoutHistoryProps {
  onBack: () => void;
  onNavigateToWorkout?: (weekId: string, dayId: string) => void;
}

interface WorkoutDayItem {
  type: 'workout-day';
  weekId: string;
  dayId: string;
  weekNumber: number;
  dayName: string;
  dayTitle: string;
  sessionState: string;
  exercises: any[];
  completedExercises: number;
  totalExercises: number;
}

interface HistoryItem {
  type: 'history';
  entry: any;
  day?: any;
  sessionState?: string;
}

interface SectionHeaderItem {
  type: 'section-header';
  title: string;
  icon: React.ReactNode;
}

type ListItem = WorkoutDayItem | HistoryItem | SectionHeaderItem;

const ITEM_HEIGHT = 120; // Height for workout items
const HEADER_HEIGHT = 60; // Height for section headers

  
  const VirtualizedWorkoutHistory: React.FC<VirtualizedWorkoutHistoryProps> = ({ onBack, onNavigateToWorkout }) => {
  const { history, currentPlan, getSessionState } = useApp();
  
  // Filter state for navigation
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'active'>('all');
  
  // Get all workout days with their session states
  const allWorkoutDays = useMemo(() => {
    if (!currentPlan) return [];
    
    const days = [];
    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        if (!day.isRestDay) {
          const sessionState = getSessionState(week.id, day.id);
          days.push({
            weekId: week.id,
            dayId: day.id,
            weekNumber: week.weekNumber,
            dayName: day.dayName,
            dayTitle: day.title,
            sessionState,
            exercises: day.exercises,
            completedExercises: day.exercises.filter((e: any) => e.isCompleted).length,
            totalExercises: day.exercises.length
          });
        }
      }
    }
    return days;
  }, [currentPlan, getSessionState]);
  
  // Filter workout days based on selected filter
  const filteredWorkoutDays = useMemo(() => {
    switch (filterType) {
      case 'completed':
        return allWorkoutDays.filter(day => day.sessionState === 'logged');
      case 'active':
        return allWorkoutDays.filter(day => day.sessionState === 'active' || day.sessionState === 'completed');
      default:
        return allWorkoutDays;
    }
  }, [allWorkoutDays, filterType]);
  
  // Filter history entries based on selected filter
  const filteredHistory = useMemo(() => {
    switch (filterType) {
      case 'completed':
        return history; // History only contains completed workouts
      case 'active':
        return []; // History doesn't contain active workouts
      default:
        return history;
    }
  }, [history, filterType]);

  // Create virtualized list items
  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    
    // Add active/in-progress workouts section
    if ((filterType === 'all' || filterType === 'active') && filteredWorkoutDays.length > 0) {
      items.push({
        type: 'section-header',
        title: filterType === 'active' ? 'Active & In-Progress Workouts' : 'Current Workouts',
        icon: <Activity size={20} className="text-green-600" />
      });
      
      filteredWorkoutDays.forEach(day => {
        items.push({
          type: 'workout-day',
          ...day
        });
      });
    }
    
    // Add completed workouts section
    if ((filterType === 'all' || filterType === 'completed') && filteredHistory.length > 0) {
      if (filterType === 'all' && filteredWorkoutDays.length > 0) {
        items.push({
          type: 'section-header',
          title: 'Completed Workouts',
          icon: <Trophy size={20} className="text-blue-600" />
        });
      }
      
      filteredHistory.forEach(entry => {
        const week = currentPlan?.weeks.find(w => w.weekNumber === entry.weekNumber);
        const day = week?.days.find(d => d.title === entry.dayTitle);
        const sessionState = week && day ? getSessionState(week.id, day.id) : 'inactive';
        
        items.push({
          type: 'history',
          entry,
          day,
          sessionState
        });
      });
    }
    
    return items;
  }, [filteredWorkoutDays, filteredHistory, filterType, currentPlan, getSessionState]);

  const handleNavigateToWorkout = useCallback((weekId: string, dayId: string) => {
    if (onNavigateToWorkout) {
      onNavigateToWorkout(weekId, dayId);
    } else {
      onBack(); // Fallback to just going back
    }
  }, [onNavigateToWorkout, onBack]);

  const getItemSize = useCallback(({ index }: { index: number }) => {
    const item = listItems[index];
    return item?.type === 'section-header' ? HEADER_HEIGHT : ITEM_HEIGHT;
  }, [listItems]);

    const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = listItems[index];
    
    if (!item) return null;

    if (item.type === 'section-header') {
      return (
        <div style={style} className="flex items-center gap-2 mb-4 px-4">
          {item.icon}
          <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
        </div>
      );
    }

    if (item.type === 'workout-day') {
      return (
        <div style={style} className="px-4 pb-4">
          <div 
            className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
              item.sessionState === 'active' ? 'border-green-200 bg-green-50/30' :
              item.sessionState === 'completed' ? 'border-yellow-200 bg-yellow-50/30' :
              'border-gray-100'
            }`} 
            onClick={() => handleNavigateToWorkout(item.weekId, item.dayId)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.sessionState === 'active' ? 'bg-green-500 text-white' :
                  item.sessionState === 'completed' ? 'bg-yellow-500 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {item.sessionState === 'active' ? <Activity size={16} /> :
                   item.sessionState === 'completed' ? <CheckCircle2 size={16} /> :
                   <Calendar size={16} />}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Week {item.weekNumber} • {item.dayName}
                  </p>
                  <p className={`text-sm font-bold ${
                    item.sessionState === 'active' ? 'text-green-800' :
                    item.sessionState === 'completed' ? 'text-yellow-800' :
                    'text-gray-800'
                  }`}>
                    {item.sessionState === 'active' ? 'Active Session' :
                     item.sessionState === 'completed' ? 'Ready to Log' :
                     'Not Started'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full border text-sm ${
                  item.completedExercises === item.totalExercises 
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : item.completedExercises > 0
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  <CheckCircle2 size={16} />
                  {item.completedExercises}/{item.totalExercises}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToWorkout(item.weekId, item.dayId);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    item.sessionState === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    item.sessionState === 'completed' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={item.sessionState === 'active' ? 'Continue workout' : 
                         item.sessionState === 'completed' ? 'Log workout' : 
                         'Start workout'}
                >
                  {item.sessionState === 'active' ? <Play size={16} /> :
                   item.sessionState === 'completed' ? <Eye size={16} /> :
                   <Play size={16} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.dayTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.totalExercises} exercises</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'history') {
      const { entry, day, sessionState } = item;
      const isLoggedWorkout = sessionState === 'logged';
      
      return (
        <div style={style} className="px-4 pb-4">
          <div className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${
            isLoggedWorkout ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {new Date(entry.completedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                {entry.syncStatus === 'synced' ? (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-blue-100">
                     <Cloud size={10} /> Synced
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-gray-200">
                     <CloudOff size={10} /> Local
                  </span>
                )}
                {isLoggedWorkout && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-blue-200">
                     <Trophy size={10} /> Logged
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                   <Clock size={10} />
                   {entry.durationMinutes || 0} mins
                </div>
                {entry.rpe && (
                  <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                    entry.rpe <= 4 ? 'bg-green-100 text-green-700 border border-green-200' :
                    entry.rpe <= 7 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    <Star size={10} />
                    RPE {entry.rpe}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-2">
                    {entry.dayTitle}
                    {isLoggedWorkout && <Trophy size={16} className="text-blue-600" />}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{entry.planTitle} • Week {entry.weekNumber}</p>
              </div>
              <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full border text-sm ${
                  entry.exercisesCompleted === entry.totalExercises 
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                 <CheckCircle2 size={16} />
                 {entry.exercisesCompleted}/{entry.totalExercises}
              </div>
            </div>

            {entry.analysis && (
              <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-lg">
                     {entry.analysis.score}
                   </div>
                   <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">AI Feedback</p>
                      <p className="text-sm font-bold text-gray-800">{entry.analysis.mood}</p>
                   </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 pl-1 leading-relaxed">
                   <BrainCircuit size={12} className="inline mr-1" />
                   {entry.analysis.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  }, [listItems, handleNavigateToWorkout]);

  if (listItems.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in absolute inset-0 z-20">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <TrendingUp className="text-brand-600" /> Workout History
            </h2>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  filterType === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('active')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  filterType === 'active' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterType('completed')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  filterType === 'completed' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 pb-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Calendar size={40} className="opacity-40" />
          </div>
          <p className="text-lg font-medium text-gray-600">
            {filterType === 'completed' ? 'No completed workouts yet.' : 'No workout history yet.'}
          </p>
          <p className="text-sm mt-1">
            {filterType === 'completed' ? 'Finish and log a workout to see it here.' : 'Finish a day in your plan to log it here.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in absolute inset-0 z-20">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <TrendingUp className="text-brand-600" /> Workout History
          </h2>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                filterType === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                filterType === 'active' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                filterType === 'completed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <div className="flex-1">
        <List
          height={window.innerHeight - 120} // Subtract header height
          width={window.innerWidth}
          rowCount={listItems.length}
          rowHeight={getItemSize}
          rowRenderer={renderItem}
        />
      </div>
    </div>
  );
};

export default VirtualizedWorkoutHistory;
