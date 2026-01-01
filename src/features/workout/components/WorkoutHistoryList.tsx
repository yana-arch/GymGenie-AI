import React from 'react';
import { WorkoutHistoryEntry } from '@/types';
import SimpleWorkoutHistoryCard from './SimpleWorkoutHistoryCard';
import { Calendar } from 'lucide-react';

interface WorkoutHistoryListProps {
  history: WorkoutHistoryEntry[];
}

const WorkoutHistoryList: React.FC<WorkoutHistoryListProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Calendar size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium text-center">No completed workouts yet.</p>
        <p className="text-xs text-gray-400 mt-1 text-center">Finish a workout to see it here.</p>
      </div>
    );
  }

  // Sort history by completedAt desc
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedHistory.map((entry) => (
        <SimpleWorkoutHistoryCard 
          key={entry.id} 
          entry={entry} 
        />
      ))}
    </div>
  );
};

export default React.memo(WorkoutHistoryList);