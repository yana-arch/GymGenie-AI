import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutExercise, WorkoutHistoryEntry } from '@/types';

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

      // Find and toggle the exercise
      for (const week of state.currentPlan.weeks) {
        for (const day of week.days) {
          const foundExercise = day.exercises.find(e => e.id === exerciseId);
          if (foundExercise) {
            foundExercise.isCompleted = !foundExercise.isCompleted;
            found = true;
            if (foundExercise.isCompleted && timestamp) {
              state.exerciseTimestamps[exerciseId] = timestamp;
            } else {
              delete state.exerciseTimestamps[exerciseId];
            }
            break;
          }
        }
        if (found) break;
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

      const newExercise: WorkoutExercise = {
        id: crypto.randomUUID(),
        name: newExerciseData.name,
        sets: 3, // Default sets
        reps: '10', // Default reps
        restSeconds: 60, // Default rest
        notes: '', // Default notes
        isCompleted: false
      };

      day.exercises[index] = newExercise;
    },
    
    updateExerciseInPlan: (state, action: PayloadAction<{
      weekId: string;
      dayId: string;
      exerciseId: string;
      updates: Partial<WorkoutExercise>;
    }>) => {
      const { weekId, dayId, exerciseId, updates } = action.payload;

      if (!state.currentPlan) return;

      const week = state.currentPlan.weeks.find(w => w.id === weekId);
      const day = week?.days.find(d => d.id === dayId);

      if (!day) return;

      const index = day.exercises.findIndex(e => e.id === exerciseId);
      if (index === -1) return;

      day.exercises[index] = {
        ...day.exercises[index],
        ...updates
      };
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
  updateExerciseInPlan,
  moveExercise,
  replaceExerciseInPlan,
  setExerciseTimestamps,
  updateExerciseTimestamp,
  removeExerciseTimestamp,
  clearWorkoutData,
} = workoutSlice.actions;

export default workoutSlice.reducer;
