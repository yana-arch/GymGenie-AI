import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PredictionResult, TargetEstimation } from '../services/PredictionService';
import { geminiService } from '@/services/ai/GeminiService';
import { RootState } from '@/store';

export interface UserTarget {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetValue: number;
  metric: 'weight' | 'volume' | 'reps';
  targetDate?: string;
}

interface AnalyticsState {
  targets: UserTarget[];
  predictions: Record<string, PredictionResult>;
  targetEstimations: Record<string, TargetEstimation>;
  explanations: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  targets: [],
  predictions: {},
  targetEstimations: {},
  explanations: {},
  loading: false,
  error: null,
};

export const fetchPredictionExplanation = createAsyncThunk(
  'analytics/fetchExplanation',
  async ({ exerciseName, prediction, target, isPlateau }: { 
    exerciseName: string; 
    prediction: PredictionResult; 
    target?: TargetEstimation;
    isPlateau?: boolean;
  }, { getState }) => {
    const state = getState() as RootState;
    const user = state.user.profile;
    
    const prompt = `
      Analyze these fitness predictions for ${exerciseName}:
      - Model: ${prediction.modelUsed}
      - Confidence: ${prediction.confidence}
      - Predicted Outcome: ${prediction.points[prediction.points.length - 1]?.value.toFixed(1) || 'N/A'} 
      ${target ? `- Target: ${target.targetValue} estimated by ${target.estimatedDate}` : ''}
      ${isPlateau ? '- NOTE: User is currently in a PLATEAU for this exercise.' : ''}
      
      User Context:
      - Goal: ${user?.goal}
      
      Provide a natural language explanation of what this means for the user. 
      Be encouraging but realistic. Highlight factors like consistency or plateaus.
      If there is a plateau, suggest why it might be happening (e.g., recovery, intensity, variety).
      Keep it to 2-3 sentences.
    `;

    const explanation = await geminiService.generatePredictionExplanation(prompt);
    return { exerciseName, explanation };
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    addTarget: (state, action: PayloadAction<UserTarget>) => {
      state.targets.push(action.payload);
    },
    removeTarget: (state, action: PayloadAction<string>) => {
      state.targets = state.targets.filter(t => t.id !== action.payload);
      // Clean up related data
      Object.keys(state.targetEstimations).forEach(key => {
        if (key === action.payload) delete state.targetEstimations[key];
      });
    },
    updateTarget: (state, action: PayloadAction<UserTarget>) => {
      const index = state.targets.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.targets[index] = action.payload;
      }
    },
    setPrediction: (state, action: PayloadAction<{ exerciseId: string; prediction: PredictionResult }>) => {
      state.predictions[action.payload.exerciseId] = action.payload.prediction;
    },
    setTargetEstimation: (state, action: PayloadAction<{ targetId: string; estimation: TargetEstimation }>) => {
      state.targetEstimations[action.payload.targetId] = action.payload.estimation;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPredictionExplanation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPredictionExplanation.fulfilled, (state, action) => {
        state.loading = false;
        state.explanations[action.payload.exerciseName] = action.payload.explanation;
      })
      .addCase(fetchPredictionExplanation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch explanation';
      });
  },
});

export const { 
  addTarget, 
  removeTarget, 
  updateTarget, 
  setPrediction, 
  setTargetEstimation, 
  setLoading, 
  setError 
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
