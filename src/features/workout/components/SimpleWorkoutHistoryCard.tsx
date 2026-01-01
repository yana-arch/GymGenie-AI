import React from 'react';
import { WorkoutHistoryEntry } from '@/types';
import { Clock, CheckCircle2, Dumbbell } from 'lucide-react';

interface SimpleWorkoutHistoryCardProps {
  entry: WorkoutHistoryEntry;
  onClick?: () => void;
}

const SimpleWorkoutHistoryCard: React.FC<SimpleWorkoutHistoryCardProps> = ({ entry, onClick }) => {
  const date = new Date(entry.completedAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span className="text-xs text-gray-400">Week {entry.weekNumber}</span>
        </div>
        <h4 className="font-bold text-gray-900 leading-tight">{entry.dayTitle}</h4>
      </div>

      <div className="flex items-center gap-3">
        {/* Key Metric 1: Duration */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
            <Clock size={10} />
            <span>Time</span>
          </div>
          <p className="font-bold text-gray-800 text-sm">{entry.durationMinutes}m</p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-100"></div>

        {/* Key Metric 2: Exercises */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
            <Dumbbell size={10} />
            <span>Done</span>
          </div>
          <p className="font-bold text-gray-800 text-sm">
             {entry.exercisesCompleted}/{entry.totalExercises}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SimpleWorkoutHistoryCard);