import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GeminiService } from '@/services/ai/GeminiService';

// Define a type for the workout adaptation with safety constraints
export interface WorkoutAdaptation {
  newExercise?: string;
  newReps?: number; // Should be ≤ 20 for safety
  newSets?: number; // Should be ≤ 5 for safety  
  restTime?: number; // Should be ≥ 30 seconds for safety
  notes?: string; // Required for safety explanation
}

interface LiveSessionState {
  activeContext: {
    energy: 'normal' | 'tired';
    time: 'normal' | 'limited';
    equipmentStatus: 'available' | 'unavailable';
  };
  isLoading: boolean;
  error: string | null;
  adaptation: WorkoutAdaptation | null;
}

const initialState: LiveSessionState = {
  activeContext: {
    energy: 'normal',
    time: 'normal',
    equipmentStatus: 'available',
  },
  isLoading: false,
  error: null,
  adaptation: null,
};

export const fetchWorkoutAdaptation = createAsyncThunk(
  'liveSession/fetchWorkoutAdaptation',
  async (context: LiveSessionState['activeContext'], { rejectWithValue }) => {
    try {
      const geminiService = GeminiService.getInstance();
      const adaptation = await geminiService.generateWorkoutAdaptation(context);
      return adaptation;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const liveSessionSlice = createSlice({
  name: 'liveSession',
  initialState,
  reducers: {
    updateEnergyContext(state, action: PayloadAction<'normal' | 'tired'>) {
      state.activeContext.energy = action.payload;
    },
    updateTimeContext(state, action: PayloadAction<'normal' | 'limited'>) {
      state.activeContext.time = action.payload;
    },
    clearAdaptation(state) {
        state.adaptation = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkoutAdaptation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutAdaptation.fulfilled, (state, action: PayloadAction<WorkoutAdaptation>) => {
        state.isLoading = false;
        state.adaptation = action.payload;
      })
      .addCase(fetchWorkoutAdaptation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateEnergyContext, updateTimeContext, clearAdaptation } = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
