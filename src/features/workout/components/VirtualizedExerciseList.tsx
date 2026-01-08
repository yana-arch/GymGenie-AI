import React, { useMemo, useCallback } from 'react';
import { List } from 'react-virtualized';
import { CheckCircle2, Target, Info } from 'lucide-react';
import { useExerciseById } from '@/hooks/useSelectiveSubscription';
import { Exercise, WorkoutExercise } from '@/types'; // Assuming Exercise interface is defined in types
import CompletionStats from './CompletionStats';

export interface VirtualizedExerciseListProps {
  exerciseIds: string[];
  onToggleExercise: (exerciseId: string) => void;
  onExerciseDetails?: (exercise: Exercise | WorkoutExercise) => void;
  showCompletionStatus?: boolean;
  height?: number;
  width?: number; // Add width prop for react-virtualized List
}

const ITEM_HEIGHT = 80;

const VirtualizedExerciseList: React.FC<VirtualizedExerciseListProps> = ({
  exerciseIds,
  onToggleExercise,
  onExerciseDetails,
  showCompletionStatus = true,
  height = 400,
  width = 300 // Default width
}) => {
  const getDifficultyColor = useCallback((difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }, []);

  const ExerciseListItem = ({ 
    exerciseId, 
    style, 
    onToggleExercise, 
    onExerciseDetails, 
    showCompletionStatus, 
    getDifficultyColor 
  }: { 
    exerciseId: string; 
    style: React.CSSProperties; 
    onToggleExercise: (id: string) => void; 
    onExerciseDetails?: (exercise: Exercise | WorkoutExercise) => void; 
    showCompletionStatus: boolean; 
    getDifficultyColor: (difficulty?: string) => string;
  }) => {
    const exerciseData = useExerciseById(exerciseId);
    
    if (!exerciseData || !exerciseData.exercise) return null;

    const { exercise } = exerciseData;

    return (
      <div style={style} className="px-4 pb-2">
        <div
          className={`bg-white p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
            exercise.isCompleted
              ? 'border-green-200 bg-green-50/30'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onToggleExercise(exercise.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Completion Status */}
              {showCompletionStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExercise(exercise.id);
                  }}
                  className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    exercise.isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {exercise.isCompleted && <CheckCircle2 size={14} />}
                </button>
              )}
              
              {/* Exercise Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-sm truncate ${
                    exercise.isCompleted ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {exercise.name}
                  </h3>
                  
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Target size={12} />
                    <span>{exercise.sets} sets × {exercise.reps} reps</span>
                  </div>
                  
                </div>
                
                {exercise.notes && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {exercise.notes}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {onExerciseDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExerciseDetails(exercise);
                  }}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="View details"
                >
                  <Info size={14} />
                </button>
              )}
              
              {exercise.isCompleted && (
                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  <CheckCircle2 size={12} />
                  Done
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExerciseItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    return (
      <ExerciseListItem
        exerciseId={exerciseIds[index]}
        style={style}
        onToggleExercise={onToggleExercise}
        onExerciseDetails={onExerciseDetails}
        showCompletionStatus={showCompletionStatus}
        getDifficultyColor={getDifficultyColor}
      />
    );
  }, [exerciseIds, onToggleExercise, onExerciseDetails, showCompletionStatus, getDifficultyColor]);


  if (exerciseIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Target size={24} className="opacity-40" />
        </div>
        <p className="text-sm font-medium text-gray-600">No exercises available</p>
        <p className="text-xs mt-1">Add exercises to your workout plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      {showCompletionStatus && (
        <CompletionStats exerciseIds={exerciseIds} />
      )}
      
      {/* Virtualized Exercise List */}
      <div className="bg-gray-50 rounded-xl border border-gray-200">
        <List
          height={height}
          width={width}
          rowCount={exerciseIds.length}
          rowHeight={ITEM_HEIGHT}
          rowRenderer={renderExerciseItem}
        />
      </div>
    </div>
  );
};

export default VirtualizedExerciseList;
