import React, { memo, useCallback } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useResponsiveComponent } from '@/hooks/useLayoutManager';
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
export interface ResponsiveWorkoutCardProps {
  exercise: Exercise;
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

// Mobile vertical layout component
const MobileWorkoutCard: React.FC<ResponsiveWorkoutCardProps> = memo(({
  exercise,
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
  // Memoized event handlers
  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReadOnly) {
      onToggle?.(exercise.id);
    }
  }, [isReadOnly, onToggle, exercise.id]);

  const handleMoveUpClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveUp?.(exercise.id);
  }, [onMoveUp, exercise.id]);

  const handleMoveDownClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveDown?.(exercise.id);
  }, [onMoveDown, exercise.id]);

  const handleSwapClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isReadOnly) {
      onSwap?.(exercise.id, exercise.name);
    }
  }, [isReadOnly, onSwap, exercise.id, exercise.name]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(exercise.name);
  }, [onViewDetails, exercise.name]);

  const handleExerciseNameClick = useCallback((e: React.MouseEvent) => {
    if (!isReordering && !isReadOnly) {
      e.stopPropagation();
      onToggle?.(exercise.id);
    }
  }, [isReordering, isReadOnly, onToggle, exercise.id]);
  return (
    <div 
      className={`group bg-white dark:bg-gray-800 p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden touch-target ${
        isReadOnly 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 shadow-none opacity-80' 
          : !isReordering && exercise.isCompleted 
            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 shadow-none' 
            : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
      } ${!isReordering && !isReadOnly ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {isSwapping && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-20 flex items-center justify-center backdrop-blur-sm">
          <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={24} />
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
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100 touch-target"
                aria-label="Move exercise up"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                onClick={handleMoveDownClick}
                disabled={index === totalExercises - 1}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100 touch-target"
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
              !isReordering && exercise.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
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
              className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-target"
              title={isReadOnly ? "Cannot modify logged workout" : "Swap for alternative"}
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={handleDetailsClick}
              className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-2 rounded-lg transition-all touch-target"
              title="View instructions"
            >
              <Info size={18} />
            </button>
          </div>
        </div>
        
        {/* Exercise Details */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.sets} Sets</span>
          <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.reps} Reps</span>
          <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
            <Clock size={14} /> {exercise.restSeconds}s Rest
          </span>
        </div>
        
        {/* Notes */}
        {exercise.notes && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-brand-200 pl-3 py-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-r-lg">
            {exercise.notes}
          </p>
        )}
      </div>
    </div>
  );
});

MobileWorkoutCard.displayName = 'MobileWorkoutCard';

// Tablet grid layout component
const TabletWorkoutCard: React.FC<ResponsiveWorkoutCardProps> = ({
  exercise,
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
  return (
    <div 
      className={`group bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        isReadOnly 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 shadow-none opacity-80' 
          : !isReordering && exercise.isCompleted 
            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 shadow-none' 
            : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
      } ${!isReordering && !isReadOnly ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {isSwapping && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-20 flex items-center justify-center backdrop-blur-sm">
          <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={24} />
        </div>
      )}

      {/* Tablet Layout: Compact Grid */}
      <div className="flex items-start gap-4">
        {/* Checkbox/Reorder Controls */}
        {isReordering ? (
          <div className="flex flex-col gap-1 mt-1">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onMoveUp?.(exercise.id); 
              }}
              disabled={index === 0}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100"
              aria-label="Move exercise up"
            >
              <ArrowUp size={18} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onMoveDown?.(exercise.id); 
              }}
              disabled={index === totalExercises - 1}
              className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100"
              aria-label="Move exercise down"
            >
              <ArrowDown size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isReadOnly) {
                onToggle?.(exercise.id); 
              }
            }}
            disabled={isReadOnly}
            className={`mt-1 transition-colors ${
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
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-3">
            <h3 
              onClick={(e) => { 
                if (!isReordering && !isReadOnly) { 
                  e.stopPropagation(); 
                  onToggle?.(exercise.id); 
                }
              }}
              className={`font-bold text-lg ${
                !isReordering && exercise.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
              } ${
                !isReordering && !isReadOnly ? 'cursor-pointer' : ''
              } ${
                isReadOnly ? 'opacity-70' : ''
              } truncate`}
            >
              {exercise.name}
            </h3>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) {
                    onSwap?.(exercise.id, exercise.name);
                  }
                }}
                disabled={isSwapping || isReadOnly}
                className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title={isReadOnly ? "Cannot modify logged workout" : "Swap for alternative"}
              >
                <Shuffle size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.(exercise.name);
                }}
                className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-1.5 rounded-lg transition-all"
                title="View instructions"
              >
                <Info size={16} />
              </button>
            </div>
          </div>
          
          {/* Exercise Details */}
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.sets} Sets</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.reps} Reps</span>
            <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
              <Clock size={12} /> {exercise.restSeconds}s
            </span>
          </div>
          
          {/* Notes */}
          {exercise.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-brand-200 pl-3 py-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-r-lg line-clamp-2">
              {exercise.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Desktop multi-column layout component
const DesktopWorkoutCard: React.FC<ResponsiveWorkoutCardProps> = ({
  exercise,
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
  return (
    <div 
      className={`group bg-white dark:bg-gray-800 p-6 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        isReadOnly 
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 shadow-none opacity-80' 
          : !isReordering && exercise.isCompleted 
            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 shadow-none' 
            : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
      } ${!isReordering && !isReadOnly ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {isSwapping && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-20 flex items-center justify-center backdrop-blur-sm">
          <Loader2 className="animate-spin text-brand-600 dark:text-brand-400" size={24} />
        </div>
      )}

      {/* Desktop Layout: Enhanced with more space */}
      <div className="flex items-start gap-4">
        {/* Checkbox/Reorder Controls */}
        {isReordering ? (
          <div className="flex flex-col gap-1 mt-1">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onMoveUp?.(exercise.id); 
              }}
              disabled={index === 0}
              className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100"
              aria-label="Move exercise up"
            >
              <ArrowUp size={20} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onMoveDown?.(exercise.id); 
              }}
              disabled={index === totalExercises - 1}
              className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:hover:bg-gray-100"
              aria-label="Move exercise down"
            >
              <ArrowDown size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isReadOnly) {
                onToggle?.(exercise.id); 
              }
            }}
            disabled={isReadOnly}
            className={`mt-1 transition-colors ${
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
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 
              onClick={(e) => { 
                if (!isReordering && !isReadOnly) { 
                  e.stopPropagation(); 
                  onToggle?.(exercise.id); 
                }
              }}
              className={`font-bold text-lg mb-2 ${
                !isReordering && exercise.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isReadOnly) {
                    onSwap?.(exercise.id, exercise.name);
                  }
                }}
                disabled={isSwapping || isReadOnly}
                className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title={isReadOnly ? "Cannot modify logged workout" : "Swap for alternative"}
              >
                <Shuffle size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.(exercise.name);
                }}
                className="text-gray-300 dark:text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-1.5 rounded-lg transition-all"
                title="View instructions"
              >
                <Info size={18} />
              </button>
            </div>
          </div>
          
          {/* Exercise Details */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.sets} Sets</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium border border-gray-200 dark:border-gray-600">{exercise.reps} Reps</span>
            <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
              <Clock size={14} /> {exercise.restSeconds}s Rest
            </span>
          </div>
          
          {/* Notes */}
          {exercise.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-brand-200 pl-3 py-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-r-lg">
              {exercise.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main responsive workout card component
const ResponsiveWorkoutCard: React.FC<ResponsiveWorkoutCardProps> = memo((props) => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint();

  // Register responsive component
  const { ref } = useResponsiveComponent<HTMLDivElement>(
    'workout-card',
    LayoutPatterns.mobileStack('1rem'),
    { priority: 2 }
  );

  // Render appropriate layout based on breakpoint
  if (isMobile()) {
    return (
      <div ref={ref} data-component="workout-card">
        <MobileWorkoutCard {...props} />
      </div>
    );
  }

  if (isTablet()) {
    return (
      <div ref={ref} data-component="workout-card">
        <TabletWorkoutCard {...props} />
      </div>
    );
  }

  if (isDesktop() || isLargeDesktop()) {
    return (
      <div ref={ref} data-component="workout-card">
        <DesktopWorkoutCard {...props} />
      </div>
    );
  }

  // Fallback to mobile layout
  return (
    <div ref={ref} data-component="workout-card">
      <MobileWorkoutCard {...props} />
    </div>
  );
});

ResponsiveWorkoutCard.displayName = 'ResponsiveWorkoutCard';

// Container component for workout card lists
export const ResponsiveWorkoutCardList: React.FC<{
  exercises: Exercise[];
  isReordering?: boolean;
  isReadOnly?: boolean;
  swappingId?: string | null;
  onToggle?: (exerciseId: string) => void;
  onMoveUp?: (exerciseId: string) => void;
  onMoveDown?: (exerciseId: string) => void;
  onSwap?: (exerciseId: string, exerciseName: string) => void;
  onViewDetails?: (exerciseName: string) => void;
  className?: string;
}> = memo(({
  exercises,
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

  // Register responsive component for the list container
  const { ref } = useResponsiveComponent<HTMLDivElement>(
    'workout-card-list',
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

  // Determine container classes based on breakpoint
  const getContainerClasses = useCallback(() => {
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
      data-component="workout-card-list"
      className={`${getContainerClasses()} ${className}`}
    >
      {exercises.map((exercise, index) => (
        <ResponsiveWorkoutCard
          key={exercise.id}
          exercise={exercise}
          index={index}
          totalExercises={exercises.length}
          isReordering={isReordering}
          isReadOnly={isReadOnly}
          isSwapping={swappingId === exercise.id}
          onToggle={onToggle}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onSwap={onSwap}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
});

ResponsiveWorkoutCardList.displayName = 'ResponsiveWorkoutCardList';

export default ResponsiveWorkoutCard;
