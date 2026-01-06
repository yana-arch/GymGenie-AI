import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GeminiService } from '@/services/ai/GeminiService';
import type { OverrideEvent, AIRecommendation } from '@/features/safety-override/services/OverrideDetectionService';

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
  // Override integration
  currentRecommendations: AIRecommendation[];
  recentOverride: OverrideEvent | null;
  overrideApplied: boolean;
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
  currentRecommendations: [],
  recentOverride: null,
  overrideApplied: false,
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
    },
    // Override integration
    addRecommendation(state, action: PayloadAction<AIRecommendation>) {
      state.currentRecommendations.push(action.payload);
    },
    removeRecommendation(state, action: PayloadAction<string>) {
      state.currentRecommendations = state.currentRecommendations.filter(r => r.id !== action.payload);
    },
    applyOverride(state, action: PayloadAction<OverrideEvent>) {
      state.recentOverride = action.payload;
      state.overrideApplied = true;
    },
    clearOverride(state) {
      state.recentOverride = null;
      state.overrideApplied = false;
    },
    clearRecommendations(state) {
      state.currentRecommendations = [];
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

export const { updateEnergyContext, updateTimeContext, clearAdaptation, addRecommendation, removeRecommendation, applyOverride, clearOverride, clearRecommendations } = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
