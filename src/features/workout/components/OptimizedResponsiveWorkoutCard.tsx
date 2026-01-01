import React, { memo, useCallback } from 'react';
import VirtualizedExerciseListWrapper from '@/src/features/workout/components/VirtualizedExerciseListWrapper';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useResponsiveComponent } from '@/hooks/useLayoutManager';
import { useExerciseById } from '@/hooks/useSelectiveSubscription';
import { useRenderPerformance, useRenderOptimization } from '@/hooks/usePerformanceMonitor';
import { optimizedMemo, useStableCallback, LazyRender } from '@/utils/renderOptimization';
import { LayoutPatterns } from '@/utils/layoutManager';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Shuffle, 
  Info, 
  Loader2 
} from 'lucide-react';

// Exercise interface (matching the existing types)
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  isCompleted: boolean;
}

// Workout card props
export interface OptimizedResponsiveWorkoutCardProps {
  exerciseId: string; // Use ID instead of full exercise object
  index: number;
  totalExercises: number;
  isReordering?: boolean;
  isReadOnly?: boolean;
  isSwapping?: boolean;
  onToggle?: (exerciseId: string) => void;
  onMoveUp?: (exerciseId: string) => void;
  onMoveDown?: (exerciseId: string) => void;
  onSwap?: (exerciseId: string, exerciseName: string) => void;
  onViewDetails?: (exerciseName: string) => void;
  className?: string;
}

// Optimized mobile workout card with selective subscriptions
const OptimizedMobileWorkoutCard = optimizedMemo<OptimizedResponsiveWorkoutCardProps>(
  ({
    exerciseId,
    index,
    totalExercises,
    isReordering = false,
    isReadOnly = false,
    isSwapping = false,
    onToggle,
    onMoveUp,
    onMoveDown,
    onSwap,
    onViewDetails,
    className = ''
  }) => {
    // Performance monitoring
    useRenderPerformance('OptimizedMobileWorkoutCard');
    useRenderOptimization({ exerciseId, index, isReordering, isReadOnly, isSwapping }, 'OptimizedMobileWorkoutCard');

    // Selective subscription - only re-render when this specific exercise changes
    const exerciseData = useExerciseById(exerciseId);
    
    if (!exerciseData) {
      return null; // Exercise not found
    }

    const { exercise } = exerciseData;

    // Stable callbacks to prevent unnecessary re-renders
    const handleToggleClick = useStableCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isReadOnly) {
        onToggle?.(exerciseId);
      }
    }, [isReadOnly, onToggle, exerciseId]);

    const handleMoveUpClick = useStableCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveUp?.(exerciseId);
    }, [onMoveUp, exerciseId]);

    const handleMoveDownClick = useStableCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onMoveDown?.(exerciseId);
    }, [onMoveDown, exerciseId]);

    const handleSwapClick = useStableCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isReadOnly) {
        onSwap?.(exerciseId, exercise.name);
      }
    }, [isReadOnly, onSwap, exerciseId, exercise.name]);

    const handleDetailsClick = useStableCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      onViewDetails?.(exercise.name);
    }, [onViewDetails, exercise.name]);

    const handleExerciseNameClick = useStableCallback((e: React.MouseEvent) => {
      if (!isReordering && !isReadOnly) {
        e.stopPropagation();
        onToggle?.(exerciseId);
      }
    }, [isReordering, isReadOnly, onToggle, exerciseId]);

    return (
      <LazyRender fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
        <div 
          className={`group bg-white p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden touch-target ${
            isReadOnly 
              ? 'border-gray-200 bg-gray-50/30 shadow-none opacity-80' 
              : !isReordering && exercise.isCompleted 
                ? 'border-green-200 bg-green-50/50 shadow-none' 
                : 'border-gray-100 shadow-sm hover:shadow-md'
          } ${!isReordering && !isReadOnly ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
          data-component="optimized-mobile-workout-card"
        >
          {isSwapping && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="animate-spin text-brand-600" size={24} />
            </div>
          )}

          {/* Mobile Layout: Vertical Stack */}
          <div className="flex flex-col gap-3">
            {/* Header Row */}
            <div className="flex items-start gap-3">
              {/* Checkbox/Reorder Controls */}
              {isReordering ? (
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={handleMoveUpClick}
                    disabled={index === 0}
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:hover:bg-gray-100 touch-target"
                    aria-label="Move exercise up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    onClick={handleMoveDownClick}
                    disabled={index === totalExercises - 1}
                    className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:hover:bg-gray-100 touch-target"
                    aria-label="Move exercise down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleToggleClick}
                  disabled={isReadOnly}
                  className={`mt-1 transition-colors touch-target ${
                    isReadOnly 
                      ? 'cursor-not-allowed opacity-60' 
                      : 'cursor-pointer'
                  } ${
                    exercise.isCompleted 
                      ? 'text-green-500' 
                      : isReadOnly 
                        ? 'text-gray-300' 
                        : 'text-gray-300 group-hover:text-brand-300'
                  }`}
                >
                  {exercise.isCompleted ? <CheckCircle2 size={28} className="fill-green-100" /> : <Circle size={28} />}
                </button>
              )}
              
              {/* Exercise Name */}
              <h3 
                onClick={handleExerciseNameClick}
                className={`font-bold text-lg flex-1 ${
                  !isReordering && exercise.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                } ${
                  !isReordering && !isReadOnly ? 'cursor-pointer' : ''
                } ${
                  isReadOnly ? 'opacity-70' : ''
                }`}
              >
                {exercise.name}
              </h3>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSwapClick}
                  disabled={isSwapping || isReadOnly}
                  className="text-gray-300 hover:text-brand-500 hover:bg-brand-50 p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-target"
                  title={isReadOnly ? "Cannot modify logged workout" : "Swap for alternative"}
                >
                  <Shuffle size={18} />
                </button>
                <button 
                  onClick={handleDetailsClick}
                  className="text-gray-300 hover:text-brand-500 hover:bg-brand-50 p-2 rounded-lg transition-all touch-target"
                  title="View instructions"
                >
                  <Info size={18} />
                </button>
              </div>
            </div>
            
            {/* Exercise Details */}
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium border border-gray-200">{exercise.sets} Sets</span>
              <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium border border-gray-200">{exercise.reps} Reps</span>
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium border border-blue-100">
                <Clock size={14} /> {exercise.restSeconds}s Rest
              </span>
            </div>
            
            {/* Notes */}
            {exercise.notes && (
              <p className="text-sm text-gray-500 italic border-l-2 border-brand-200 pl-3 py-1 bg-gray-50/50 rounded-r-lg">
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </LazyRender>
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.exerciseId === nextProps.exerciseId &&
      prevProps.index === nextProps.index &&
      prevProps.totalExercises === nextProps.totalExercises &&
      prevProps.isReordering === nextProps.isReordering &&
      prevProps.isReadOnly === nextProps.isReadOnly &&
      prevProps.isSwapping === nextProps.isSwapping
    );
  },
  'OptimizedMobileWorkoutCard'
);

// Optimized tablet workout card
const OptimizedTabletWorkoutCard = optimizedMemo<OptimizedResponsiveWorkoutCardProps>(
  (props) => {
    useRenderPerformance('OptimizedTabletWorkoutCard');
    
    const exerciseData = useExerciseById(props.exerciseId);
    if (!exerciseData) return null;

    // Similar implementation to mobile but with tablet layout
    // ... (implementation similar to original TabletWorkoutCard but with optimizations)
    
    return (
      <LazyRender fallback={<div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />}>
        {/* Tablet layout implementation */}
        <div className="bg-white p-5 rounded-2xl border" data-component="optimized-tablet-workout-card">
          {/* Tablet-specific layout */}
        </div>
      </LazyRender>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.exerciseId === nextProps.exerciseId &&
      prevProps.index === nextProps.index &&
      prevProps.isReordering === nextProps.isReordering &&
      prevProps.isReadOnly === nextProps.isReadOnly &&
      prevProps.isSwapping === nextProps.isSwapping
    );
  },
  'OptimizedTabletWorkoutCard'
);

// Optimized desktop workout card
const OptimizedDesktopWorkoutCard = optimizedMemo<OptimizedResponsiveWorkoutCardProps>(
  (props) => {
    useRenderPerformance('OptimizedDesktopWorkoutCard');
    
    const exerciseData = useExerciseById(props.exerciseId);
    if (!exerciseData) return null;

    // Similar implementation to mobile but with desktop layout
    // ... (implementation similar to original DesktopWorkoutCard but with optimizations)
    
    return (
      <LazyRender fallback={<div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />}>
        {/* Desktop layout implementation */}
        <div className="bg-white p-6 rounded-2xl border" data-component="optimized-desktop-workout-card">
          {/* Desktop-specific layout */}
        </div>
      </LazyRender>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.exerciseId === nextProps.exerciseId &&
      prevProps.index === nextProps.index &&
      prevProps.isReordering === nextProps.isReordering &&
      prevProps.isReadOnly === nextProps.isReadOnly &&
      prevProps.isSwapping === nextProps.isSwapping
    );
  },
  'OptimizedDesktopWorkoutCard'
);

// Main optimized responsive workout card component
const OptimizedResponsiveWorkoutCard = optimizedMemo<OptimizedResponsiveWorkoutCardProps>(
  (props) => {
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint();
    
    // Performance monitoring
    useRenderPerformance('OptimizedResponsiveWorkoutCard');

    // Register responsive component
    const { ref } = useResponsiveComponent<HTMLDivElement>(
      'optimized-workout-card',
      LayoutPatterns.mobileStack('1rem'),
      { priority: 2 }
    );

    // Render appropriate layout based on breakpoint
    if (isMobile()) {
      return (
        <div ref={ref} data-component="optimized-workout-card">
          <OptimizedMobileWorkoutCard {...props} />
        </div>
      );
    }

    if (isTablet()) {
      return (
        <div ref={ref} data-component="optimized-workout-card">
          <OptimizedTabletWorkoutCard {...props} />
        </div>
      );
    }

    if (isDesktop() || isLargeDesktop()) {
      return (
        <div ref={ref} data-component="optimized-workout-card">
          <OptimizedDesktopWorkoutCard {...props} />
        </div>
      );
    }

    // Fallback to mobile layout
    return (
      <div ref={ref} data-component="optimized-workout-card">
        <OptimizedMobileWorkoutCard {...props} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.exerciseId === nextProps.exerciseId &&
      prevProps.index === nextProps.index &&
      prevProps.totalExercises === nextProps.totalExercises &&
      prevProps.isReordering === nextProps.isReordering &&
      prevProps.isReadOnly === nextProps.isReadOnly &&
      prevProps.isSwapping === nextProps.isSwapping
    );
  },
  'OptimizedResponsiveWorkoutCard'
);

// Optimized container component for workout card lists
export const OptimizedResponsiveWorkoutCardList = optimizedMemo<{
  exerciseIds: string[]; // Use IDs instead of full exercise objects
  isReordering?: boolean;
  isReadOnly?: boolean;
  swappingId?: string | null;
  onToggle?: (exerciseId: string) => void;
  onMoveUp?: (exerciseId: string) => void;
  onMoveDown?: (exerciseId: string) => void;
  onSwap?: (exerciseId: string, exerciseName: string) => void;
  onViewDetails?: (exerciseName: string) => void;
  className?: string;
}>(({
  exerciseIds,
  isReordering = false,
  isReadOnly = false,
  swappingId = null,
  onToggle,
  onMoveUp,
  onMoveDown,
  onSwap,
  onViewDetails,
  className = ''
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  
  // Performance monitoring
  useRenderPerformance('OptimizedResponsiveWorkoutCardList');

  // Register responsive component for the list container
  const { ref } = useResponsiveComponent<HTMLDivElement>(
    'optimized-workout-card-list',
    {
      sm: {
        flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch', gap: '1rem' },
        spacing: { padding: '0', margin: '0' },
        visibility: { display: 'flex' }
      },
      md: {
        grid: { columns: 2, gap: '1.5rem' },
        spacing: { padding: '0', margin: '0' },
        visibility: { display: 'grid' }
      },
      lg: {
        grid: { columns: 1, gap: '1rem' },
        spacing: { padding: '0', margin: '0' },
        visibility: { display: 'grid' }
      },
      xl: {
        grid: { columns: 1, gap: '1rem' },
        spacing: { padding: '0', margin: '0' },
        visibility: { display: 'grid' }
      }
    },
    { priority: 1 }
  );

  // Stable callback for container classes
  const getContainerClasses = useStableCallback(() => {
    if (isMobile()) {
      return 'space-y-4 flex-1';
    }
    if (isTablet()) {
      return 'grid grid-cols-2 gap-6 flex-1';
    }
    return 'space-y-4 flex-1'; // Desktop uses single column
  }, [isMobile, isTablet]);

  return (
    <div
      ref={ref}
      data-component="optimized-workout-card-list"
      className={`${getContainerClasses()} ${className}`}
    >
      <VirtualizedExerciseListWrapper
        exerciseIds={exerciseIds}
        onToggleExercise={onToggle}
        onExerciseDetails={(exercise) => onViewDetails(exercise.name)}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.exerciseIds) === JSON.stringify(nextProps.exerciseIds) &&
    prevProps.isReordering === nextProps.isReordering &&
    prevProps.isReadOnly === nextProps.isReadOnly &&
    prevProps.swappingId === nextProps.swappingId
  );
}, 'OptimizedResponsiveWorkoutCardList');

export default OptimizedResponsiveWorkoutCard;
