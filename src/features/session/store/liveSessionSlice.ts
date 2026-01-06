import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GeminiService } from '@/services/ai/GeminiService';
import type { OverrideEvent, AIRecommendation } from '@/features/safety-override/services/OverrideDetectionService';
import { InjuryFilterService } from '@/features/injury-aware/services/InjuryFilterService';

// Performance monitoring interface
interface PerformanceMetrics {
  requestStartTime: number;
  responseTime?: number;
  error?: string;
}

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
  // Performance monitoring
  performance: {
    lastResponseTime?: number;
    averageResponseTime: number;
    requestCount: number;
    errorCount: number;
    withinSLA: boolean; // 2 second SLA
  };
  // Override integration
  currentRecommendations: AIRecommendation[];
  recentOverride: OverrideEvent | null;
  overrideApplied: boolean;
  overrideHistory: OverrideEvent[];
  // Injury-aware integration
  injuryConstraints?: {
    hasInjuries: boolean;
    injuryAreas: string[];
    safetyLevel: 'normal' | 'conservative' | 'restricted';
  };
  // Note: injuryFilterService is managed outside Redux to avoid non-serializable state
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
  performance: {
    lastResponseTime: undefined,
    averageResponseTime: 0,
    requestCount: 0,
    errorCount: 0,
    withinSLA: true,
  },
  currentRecommendations: [],
    recentOverride: null,
    overrideApplied: false,
    overrideHistory: [],
    injuryConstraints: {
      hasInjuries: false,
      injuryAreas: [],
      safetyLevel: 'normal'
    },
  };

export const fetchWorkoutAdaptation = createAsyncThunk(
  'liveSession/fetchWorkoutAdaptation',
  async (context: { activeContext: LiveSessionState['activeContext'], overrideHistory: OverrideEvent[] }, { rejectWithValue }) => {
    const startTime = Date.now();
    try {
      const geminiService = GeminiService.getInstance();
      
      // Format override history for AI context
      const formattedOverrideHistory = context.overrideHistory.map(override => ({
        type: override.recommendationId,
        userAction: override.userAction,
        reasoning: override.interactionMethod,
        timestamp: override.timestamp
      }));
      
      const adaptation = await geminiService.generateWorkoutAdaptation({
        ...context.activeContext,
        overrideHistory: formattedOverrideHistory
      });
      const responseTime = Date.now() - startTime;
      
      // Validate 2-second SLA
      if (responseTime > 2000) {
        console.warn(`AI adaptation SLA breach: ${responseTime}ms > 2000ms`);
      }
      
      return { adaptation, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return rejectWithValue({ error: error.toString(), responseTime });
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
      // Add to history (keep last 10)
      state.overrideHistory = [...state.overrideHistory.slice(-9), action.payload];
    },
    clearOverride(state) {
      state.recentOverride = null;
      state.overrideApplied = false;
    },
    clearRecommendations(state) {
      state.currentRecommendations = [];
    },
    resetPerformanceMetrics(state) {
      state.performance = {
        lastResponseTime: undefined,
        averageResponseTime: 0,
        requestCount: 0,
        errorCount: 0,
        withinSLA: true,
      };
    },
    setInjuryConstraints(state, action: PayloadAction<{hasInjuries: boolean, injuryAreas: string[], safetyLevel: 'normal' | 'conservative' | 'restricted'}>) {
      state.injuryConstraints = action.payload;
    },
    applyInjuryFiltering(state, action: PayloadAction<WorkoutAdaptation>) {
      if (!state.injuryConstraints?.hasInjuries) {
        state.adaptation = action.payload;
        return;
      }

      // Apply conservative defaults for injury safety
      let modifiedAdaptation = { ...action.payload };
      
      if (state.injuryConstraints.safetyLevel === 'conservative') {
        modifiedAdaptation.newReps = Math.min(action.payload.newReps || 0, 12);
        modifiedAdaptation.newSets = Math.min(action.payload.newSets || 0, 3);
        modifiedAdaptation.restTime = Math.max(action.payload.restTime || 60, 90);
        modifiedAdaptation.notes = `Conservative modification for injury safety: ${action.payload.notes || 'Applied for safety'}`;
      } else if (state.injuryConstraints.safetyLevel === 'restricted') {
        modifiedAdaptation.newReps = Math.min(action.payload.newReps || 0, 8);
        modifiedAdaptation.newSets = Math.min(action.payload.newSets || 0, 2);
        modifiedAdaptation.restTime = Math.max(action.payload.restTime || 60, 120);
        modifiedAdaptation.notes = `Restricted modification for injury recovery: ${action.payload.notes || 'Applied for safety'}`;
      }

      // Filter exercises that stress injury areas
      if (action.payload.newExercise && state.injuryConstraints.injuryAreas.length > 0) {
        const riskyForKnee = ['deep_squats', 'jumping', 'lunges'].some(ex => 
          action.payload.newExercise?.toLowerCase().includes(ex)
        );
        const riskyForShoulder = ['overhead_press', 'pull_ups'].some(ex => 
          action.payload.newExercise?.toLowerCase().includes(ex)
        );
        const riskyForBack = ['deadlifts', 'heavy_squats'].some(ex => 
          action.payload.newExercise?.toLowerCase().includes(ex)
        );

        if ((state.injuryConstraints.injuryAreas.includes('knee') && riskyForKnee) ||
            (state.injuryConstraints.injuryAreas.includes('shoulder') && riskyForShoulder) ||
            (state.injuryConstraints.injuryAreas.includes('back') && riskyForBack)) {
          modifiedAdaptation.notes = `Exercise blocked due to injury conflict: ${action.payload.notes || 'Safety override applied'}`;
          // Keep current exercise, modify intensity only
          modifiedAdaptation.newExercise = undefined;
        }
      }

      state.adaptation = modifiedAdaptation;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkoutAdaptation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.performance.requestCount++;
      })
      .addCase(fetchWorkoutAdaptation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adaptation = action.payload.adaptation;
        
        // Update performance metrics
        const responseTime = action.payload.responseTime;
        state.performance.lastResponseTime = responseTime;
        state.performance.withinSLA = responseTime <= 2000;
        
        // Calculate running average
        const totalResponseTime = state.performance.averageResponseTime * (state.performance.requestCount - 1) + responseTime;
        state.performance.averageResponseTime = totalResponseTime / state.performance.requestCount;
      })
      .addCase(fetchWorkoutAdaptation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any).error || 'Unknown error';
        state.performance.errorCount++;
        
        // Still track performance on errors
        const responseTime = (action.payload as any).responseTime;
        if (responseTime) {
          state.performance.lastResponseTime = responseTime;
          const totalResponseTime = state.performance.averageResponseTime * (state.performance.requestCount - 1) + responseTime;
          state.performance.averageResponseTime = totalResponseTime / state.performance.requestCount;
        }
      });
  },
});

export const { updateEnergyContext, updateTimeContext, clearAdaptation, addRecommendation, removeRecommendation, applyOverride, clearOverride, clearRecommendations, resetPerformanceMetrics, setInjuryConstraints, applyInjuryFiltering } = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
