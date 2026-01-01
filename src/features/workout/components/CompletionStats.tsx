import React, { useMemo } from 'react';
import { useExerciseById } from '@/hooks/useSelectiveSubscription';
import { Exercise } from '@/types';

interface CompletionStatsProps {
  exerciseIds: string[];
}

const CompletionStatsRenderer: React.FC<{ exercises: Exercise[] }> = ({ exercises }) => {
  const completionStats = useMemo(() => {
    const completed = exercises.filter(ex => ex.isCompleted).length;
    const total = exercises.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }, [exercises]);

  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-gray-900">Exercise Progress</h3>
      <div className="text-sm font-bold text-gray-600">
        {completionStats.completed}/{completionStats.total} completed
      </div>
    </div>
  );
};

const CompletionStats: React.FC<CompletionStatsProps> = ({ exerciseIds }) => {
  const exercises = exerciseIds.map(id => {
    const exerciseData = useExerciseById(id);
    return exerciseData?.exercise;
  }).filter(Boolean) as Exercise[];

  return <CompletionStatsRenderer exercises={exercises} />;
};

export default CompletionStats;