import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutHistoryEntry } from '@/types';

interface WorkoutSliceState {
  currentPlan: WorkoutPlan | null;
  history: WorkoutHistoryEntry[];
  isLoading: boolean;
  exerciseTimestamps: Record<string, number>;
}

const initialState: WorkoutSliceState = {
  currentPlan: null,
  history: [],
  isLoading: false,
  exerciseTimestamps: {},
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setPlan: (state, action: PayloadAction<WorkoutPlan>) => {
      state.currentPlan = action.payload;
    },
    
    setHistory: (state, action: PayloadAction<WorkoutHistoryEntry[]>) => {
      state.history = action.payload;
    },
    
    addHistoryEntry: (state, action: PayloadAction<WorkoutHistoryEntry>) => {
      state.history.unshift(action.payload);
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    toggleExercise: (state, action: PayloadAction<{ exerciseId: string; timestamp?: number }>) => {
      const { exerciseId, timestamp } = action.payload;
      
      if (!state.currentPlan) return;
      
      let found = false;
      let exercise: Exercise | null = null;
      
      // Find and toggle the exercise
      for (const week of state.currentPlan.weeks) {
        for (const day of week.days) {
          const foundExercise = day.exercises.find(e => e.id === exerciseId);
          if (foundExercise) {
            foundExercise.isCompleted = !foundExercise.isCompleted;
            exercise = foundExercise;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      
      // Update exercise timestamps
      if (found && exercise) {
        if (exercise.isCompleted && timestamp) {
          state.exerciseTimestamps[exerciseId] = timestamp;
        } else {
          delete state.exerciseTimestamps[exerciseId];
        }
      }
    },
    
    updateDayInPlan: (state, action: PayloadAction<{ weekId: string; updatedDay: WorkoutDay }>) => {
      const { weekId, updatedDay } = action.payload;
      
      if (!state.currentPlan) return;
      
      const weekIndex = state.currentPlan.weeks.findIndex(w => w.id === weekId);
      if (weekIndex === -1) return;
      
      const dayIndex = state.currentPlan.weeks[weekIndex].days.findIndex(d => d.id === updatedDay.id);
      if (dayIndex !== -1) {
        state.currentPlan.weeks[weekIndex].days[dayIndex] = updatedDay;
      }
    },
    
    moveExercise: (state, action: PayloadAction<{ 
      weekId: string; 
      dayId: string; 
      exerciseId: string; 
      direction: 'up' | 'down' 
    }>) => {
      const { weekId, dayId, exerciseId, direction } = action.payload;
      
      if (!state.currentPlan) return;
      
      const week = state.currentPlan.weeks.find(w => w.id === weekId);
      const day = week?.days.find(d => d.id === dayId);
      
      if (!day) return;
      
      const index = day.exercises.findIndex(e => e.id === exerciseId);
      if (index === -1) return;
      
      if (direction === 'up' && index > 0) {
        // Swap with previous
        const temp = day.exercises[index];
        day.exercises[index] = day.exercises[index - 1];
        day.exercises[index - 1] = temp;
      } else if (direction === 'down' && index < day.exercises.length - 1) {
        // Swap with next
        const temp = day.exercises[index];
        day.exercises[index] = day.exercises[index + 1];
        day.exercises[index + 1] = temp;
      }
    },
    
    replaceExerciseInPlan: (state, action: PayloadAction<{
      weekId: string;
      dayId: string;
      oldExerciseId: string;
      newExerciseData: Omit<Exercise, 'id' | 'isCompleted'>;
    }>) => {
      const { weekId, dayId, oldExerciseId, newExerciseData } = action.payload;
      
      if (!state.currentPlan) return;
      
      const week = state.currentPlan.weeks.find(w => w.id === weekId);
      const day = week?.days.find(d => d.id === dayId);
      
      if (!day) return;
      
      const index = day.exercises.findIndex(e => e.id === oldExerciseId);
      if (index === -1) return;
      
      const newExercise: Exercise = {
        ...newExerciseData,
        id: crypto.randomUUID(),
        isCompleted: false
      };
      
      day.exercises[index] = newExercise;
    },
    
    setExerciseTimestamps: (state, action: PayloadAction<Record<string, number>>) => {
      state.exerciseTimestamps = action.payload;
    },
    
    updateExerciseTimestamp: (state, action: PayloadAction<{ exerciseId: string; timestamp: number }>) => {
      const { exerciseId, timestamp } = action.payload;
      state.exerciseTimestamps[exerciseId] = timestamp;
    },
    
    removeExerciseTimestamp: (state, action: PayloadAction<{ exerciseId: string }>) => {
      const { exerciseId } = action.payload;
      delete state.exerciseTimestamps[exerciseId];
    },
    
    clearWorkoutData: (state) => {
      state.currentPlan = null;
      state.history = [];
      state.exerciseTimestamps = {};
      state.isLoading = false;
    },
  },
});

export const {
  setPlan,
  setHistory,
  addHistoryEntry,
  setLoading,
  toggleExercise,
  updateDayInPlan,
  moveExercise,
  replaceExerciseInPlan,
  setExerciseTimestamps,
  updateExerciseTimestamp,
  removeExerciseTimestamp,
  clearWorkoutData,
} = workoutSlice.actions;

export default workoutSlice.reducer;