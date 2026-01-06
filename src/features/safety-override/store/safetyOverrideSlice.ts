import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { AIRecommendation, OverrideEvent } from '../services/OverrideDetectionService';

export interface SafetyOverrideState {
  // Override detection state
  isMonitoring: boolean;
  currentRecommendations: AIRecommendation[];
  
  // Override history and tracking
  overrideHistory: OverrideEvent[];
  pendingOverrides: Record<string, boolean>;
  
  // Safety defaults state
  safetyLevel: 'conservative' | 'moderate' | 'progressive';
  autoApplySafetyDefaults: boolean;
  safetyValidationResults: Record<string, any>;
  
  // Performance metrics
  lastProcessingTime: number;
  averageProcessingTime: number;
  totalOverrides: number;
  
  // Error handling
  error: string | null;
  isLoading: boolean;
}

const initialState: SafetyOverrideState = {
  isMonitoring: false,
  currentRecommendations: [],
  overrideHistory: [],
  pendingOverrides: {},
  safetyLevel: 'moderate',
  autoApplySafetyDefaults: true,
  safetyValidationResults: {},
  lastProcessingTime: 0,
  averageProcessingTime: 0,
  totalOverrides: 0,
  error: null,
  isLoading: false
};

export const safetyOverrideSlice = createSlice({
  name: 'safetyOverride',
  initialState,
  reducers: {
    // Monitoring control
    startMonitoring(state) {
      state.isMonitoring = true;
      state.error = null;
    },
    
    stopMonitoring(state) {
      state.isMonitoring = false;
    },
    
    // Recommendation management
    addRecommendation(state, action: PayloadAction<AIRecommendation>) {
      const existingIndex = state.currentRecommendations.findIndex(
        rec => rec.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.currentRecommendations[existingIndex] = action.payload;
      } else {
        state.currentRecommendations.push(action.payload);
      }
    },
    
    removeRecommendation(state, action: PayloadAction<string>) {
      state.currentRecommendations = state.currentRecommendations.filter(
        rec => rec.id !== action.payload
      );
    },
    
    updateRecommendation(state, action: PayloadAction<AIRecommendation>) {
      const index = state.currentRecommendations.findIndex(
        rec => rec.id === action.payload.id
      );
      
      if (index >= 0) {
        state.currentRecommendations[index] = action.payload;
      }
    },
    
    clearRecommendations(state) {
      state.currentRecommendations = [];
    },
    
    // Override handling
    setPendingOverride(state, action: PayloadAction<{ recommendationId: string; isPending: boolean }>) {
      const { recommendationId, isPending } = action.payload;
      state.pendingOverrides[recommendationId] = isPending;
    },
    
    addOverrideEvent(state, action: PayloadAction<OverrideEvent>) {
      state.overrideHistory.push(action.payload);
      state.totalOverrides += 1;
      
      // Update performance metrics (optimized incremental calculation)
      state.lastProcessingTime = action.payload.processingTime;
      
      // Optimized average calculation (avoid division on every update for large histories)
      if (state.overrideHistory.length <= 100) {
        // Exact calculation for smaller histories
        const totalProcessingTime = state.averageProcessingTime * (state.overrideHistory.length - 1) + action.payload.processingTime;
        state.averageProcessingTime = totalProcessingTime / state.overrideHistory.length;
      } else {
        // Weighted average for larger histories (more performant)
        state.averageProcessingTime = (state.averageProcessingTime * 0.95) + (action.payload.processingTime * 0.05);
      }
      
      // Clear pending state for this recommendation
      delete state.pendingOverrides[action.payload.recommendationId];
    },
    
    clearOverrideHistory(state) {
      state.overrideHistory = [];
      state.totalOverrides = 0;
      state.lastProcessingTime = 0;
      state.averageProcessingTime = 0;
    },
    
    // Error handling
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    
    clearError(state) {
      state.error = null;
    },
    
    // Safety defaults management
    setSafetyLevel(state, action: PayloadAction<SafetyOverrideState['safetyLevel']>) {
      state.safetyLevel = action.payload;
    },
    
    setAutoApplySafetyDefaults(state, action: PayloadAction<boolean>) {
      state.autoApplySafetyDefaults = action.payload;
    },
    
    setSafetyValidationResult(state, action: PayloadAction<{ recommendationId: string; result: any }>) {
      state.safetyValidationResults[action.payload.recommendationId] = action.payload.result;
    },
    
    clearSafetyValidationResults(state) {
      state.safetyValidationResults = {};
    },
    
    // Loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    }
  }
});

// Action creators
export const {
  startMonitoring,
  stopMonitoring,
  addRecommendation,
  removeRecommendation,
  updateRecommendation,
  clearRecommendations,
  setPendingOverride,
  addOverrideEvent,
  clearOverrideHistory,
  setSafetyLevel,
  setAutoApplySafetyDefaults,
  setSafetyValidationResult,
  clearSafetyValidationResults,
  setError,
  clearError,
  setLoading
} = safetyOverrideSlice.actions;

// Selectors
export const selectSafetyOverrideState = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride;

export const selectMonitoringState = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.isMonitoring;

export const selectCurrentRecommendations = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.currentRecommendations;

export const selectOverrideHistory = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.overrideHistory;

export const selectPendingOverrides = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.pendingOverrides;

export const selectPerformanceMetrics = createSelector(
  [(state: { safetyOverride: SafetyOverrideState }) => state.safetyOverride],
  (safetyOverride) => ({
    lastProcessingTime: safetyOverride.lastProcessingTime,
    averageProcessingTime: safetyOverride.averageProcessingTime,
    totalOverrides: safetyOverride.totalOverrides
  })
);

export const selectIsRecommendationPending = (recommendationId: string) => 
  (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.pendingOverrides[recommendationId] || false;

export const selectSafetyLevel = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.safetyLevel;

export const selectAutoApplySafetyDefaults = (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.autoApplySafetyDefaults;

export const selectSafetyValidationResults = createSelector(
  [(state: { safetyOverride: SafetyOverrideState }) => state.safetyOverride.safetyValidationResults],
  (results) => results
);

export const selectSafetyValidationForRecommendation = (recommendationId: string) => 
  (state: { safetyOverride: SafetyOverrideState }) => 
  state.safetyOverride.safetyValidationResults[recommendationId];

export default safetyOverrideSlice.reducer;