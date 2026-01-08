import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GeminiService } from '@/services/ai/GeminiService';
import type { OverrideEvent, AIRecommendation } from '@/features/safety-override/services/OverrideDetectionService';
import { InjuryFilterService } from '@/features/injury-aware/services/InjuryFilterService';
import { CoachingDecision } from '@/features/unified-coaching/types/unifiedCoaching.types';
import { AdaptationEvent } from '@/features/preference-learning/types/preferenceLearning.types';
import { Milestone } from '../services/MilestoneService';

import { ContextCaptureService } from '../services/ContextCaptureService';

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
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  adaptation: WorkoutAdaptation | null;
  adaptationHistory: AdaptationEvent[];
  // Performance monitoring
  performance: {
    lastResponseTime?: number;
    averageResponseTime: number;
    requestCount: number;
    errorCount: number;
    withinSLA: boolean; // 2 second SLA
    lastSLABreach?: boolean; // Track if last request breached SLA
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
  // Live Guidance
  activeGuidance: CoachingDecision | null;
  milestoneHistory: Milestone[];
  quietMode: boolean;
  transitionStatus: 'idle' | 'resting' | 'preparing' | 'active';
  nextExercise: string | null;
  restRemaining: number;
  // Aggregate Progress
  sessionVolume: number;
  currentSetProgress: number; // 0 to 1
  exercisesCompleted: number;
  activeExerciseIndex: number;
  sessionStartTime: number | null;
  sessionProgress: number; // 0 to 1
  // Note: injuryFilterService is managed outside Redux to avoid non-serializable state
}

const initialState: LiveSessionState = {
  activeContext: {
    energy: 'normal',
    time: 'normal',
    equipmentStatus: 'available',
  },
  isActive: false,
  isLoading: false,
  error: null,
  adaptation: null,
  adaptationHistory: [],
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
    activeGuidance: null,
    milestoneHistory: [],
    quietMode: false,
    transitionStatus: 'idle',
    nextExercise: null,
    restRemaining: 0,
    sessionVolume: 0,
    currentSetProgress: 0,
    exercisesCompleted: 0,
    activeExerciseIndex: 0,
    sessionStartTime: null,
    sessionProgress: 0,
  };

export const fetchWorkoutAdaptation = createAsyncThunk(
  'liveSession/fetchWorkoutAdaptation',
  async (context: { 
    activeContext: LiveSessionState['activeContext'], 
    overrideHistory: OverrideEvent[],
    currentExercise?: { reps: string; sets: number; restSeconds: number }
  }, { rejectWithValue }) => {
    const startTime = Date.now();
    try {
      const geminiService = GeminiService.getInstance();
      
      const formattedOverrideHistory = context.overrideHistory.map(override => ({
        type: override.recommendationId,
        userAction: override.userAction,
        reasoning: override.interactionMethod,
        relativeTime: getRelativeTimeDescription(override.timestamp!)
      }));
      
      const adaptation = await geminiService.generateWorkoutAdaptation({
        ...context.activeContext,
        overrideHistory: formattedOverrideHistory
      });
      const responseTime = Date.now() - startTime;
      
      // Validate 2-second SLA with proper error handling
      if (responseTime > 2000) {
        console.warn(`AI adaptation SLA breach: ${responseTime}ms > 2000ms`);
        
        // Return fallback adaptation based on current exercise context if provided
        const currentReps = context.currentExercise ? parseInt(context.currentExercise.reps) || 10 : 10;
        const currentSets = context.currentExercise?.sets || 3;

        const fallbackAdaptation = context.activeContext.energy === 'tired' 
          ? { 
              newReps: Math.max(1, Math.floor(currentReps * 0.7)), 
              notes: "Conservative reduction due to system delay - safety first approach" 
            }
          : { 
              newSets: Math.max(1, currentSets - 1), 
              notes: "Reduced sets due to system delay - maintaining workout efficiency" 
            };
          
        return { adaptation: fallbackAdaptation, responseTime, slaBreach: true };
      }
      
      return { adaptation, responseTime, slaBreach: false };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Always provide fallback on error
      const fallbackAdaptation = { 
        notes: "System error - maintaining current workout parameters for safety" 
      };
      
      return rejectWithValue({ 
        error: error.toString(), 
        responseTime, 
        fallbackAdaptation 
      });
    }
  }
);

// Helper methods for privacy preservation
const getRelativeTimeDescription = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 5) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

const getTimeBucket = (timestamp: number): string => {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

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
    setIsActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
      if (action.payload) {
        state.sessionStartTime = Date.now();
      } else {
        ContextCaptureService.getInstance().clearContext();
        state.sessionStartTime = null;
      }
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
    },
    setActiveGuidance(state, action: PayloadAction<CoachingDecision | null>) {
      state.activeGuidance = action.payload;
    },
    addMilestone(state, action: PayloadAction<Milestone>) {
      if (!state.milestoneHistory.some(m => m.id === action.payload.id)) {
        state.milestoneHistory.push(action.payload);
      }
    },
    clearMilestones(state) {
      state.milestoneHistory = [];
    },
    toggleQuietMode(state) {
      state.quietMode = !state.quietMode;
    },
    recordAdaptationEvent(state, action: PayloadAction<AdaptationEvent>) {
      state.adaptationHistory.push(action.payload);
      // Keep last 20 adaptation events
      if (state.adaptationHistory.length > 20) {
        state.adaptationHistory.shift();
      }
    },
    setTransitionStatus(state, action: PayloadAction<'idle' | 'resting' | 'preparing' | 'active'>) {
      state.transitionStatus = action.payload;
    },
    setNextExercise(state, action: PayloadAction<string | null>) {
      state.nextExercise = action.payload;
    },
    updateRestRemaining(state, action: PayloadAction<number>) {
      state.restRemaining = action.payload;
    },
    setSessionProgress(state, action: PayloadAction<number>) {
      state.sessionProgress = action.payload;
    },
    addSessionVolume(state, action: PayloadAction<number>) {
      state.sessionVolume += action.payload;
    },
    setCurrentSetProgress(state, action: PayloadAction<number>) {
      state.currentSetProgress = action.payload;
    },
    setActiveExerciseIndex(state, action: PayloadAction<number>) {
      state.activeExerciseIndex = action.payload;
    },
    incrementExercisesCompleted(state) {
      state.exercisesCompleted += 1;
    },
    resetAggregateProgress(state) {
      state.sessionVolume = 0;
      state.currentSetProgress = 0;
      state.exercisesCompleted = 0;
      state.activeExerciseIndex = 0;
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
        state.performance.lastSLABreach = action.payload.slaBreach || false;
        
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

export const { 
  updateEnergyContext, 
  updateTimeContext, 
  clearAdaptation, 
  addRecommendation, 
  removeRecommendation, 
  applyOverride, 
  clearOverride, 
  clearRecommendations, 
  resetPerformanceMetrics, 
  setInjuryConstraints, 
  applyInjuryFiltering,
  setActiveGuidance,
  setIsActive,
  addMilestone,
  clearMilestones,
  toggleQuietMode,
  recordAdaptationEvent,
  setTransitionStatus,
  setNextExercise,
  updateRestRemaining,
  setSessionProgress,
  addSessionVolume,
  setCurrentSetProgress,
  setActiveExerciseIndex,
  incrementExercisesCompleted,
  resetAggregateProgress
} = liveSessionSlice.actions;

export default liveSessionSlice.reducer;
