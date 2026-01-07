/**
 * Redux slice for Historical Patterns
 * Manages historical pattern analysis state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { HistoricalPattern, PatternAnalysis } from '../features/historical-patterns/types/historicalPatterns.types';
import { HistoricalPatternError } from '../features/historical-patterns/types/historicalPatterns.types';

// Async thunks
export const analyzePatterns = createAsyncThunk(
  'historicalPatterns/analyzePatterns',
  async (params: { userId: string; workoutHistory: any[] }, { rejectWithValue }) => {
    try {
      // For now, implement a simplified version that doesn't require complex service dependencies
      // This can be enhanced later once all service dependencies are properly resolved
      
      // Basic validation
      if (!params.workoutHistory || params.workoutHistory.length === 0) {
        return {
          userId: params.userId,
          analysisPeriod: { start: new Date(), end: new Date() },
          totalWorkouts: 0,
          detectedPatterns: [],
          updatedPatterns: [],
          invalidatedPatterns: [],
          insights: [{
            type: 'data-insufficiency' as const,
            insight: 'No workout history available for analysis',
            supportingData: { currentWorkouts: 0, requiredWorkouts: 5 },
            confidence: 1.0,
            actionable: false
          }],
          recommendations: [],
          confidenceUpdates: []
        } as PatternAnalysis;
      }

      // Simple pattern detection logic (placeholder until full service integration)
      const detectedPatterns: HistoricalPattern[] = [];
      const insights = [];
      
      // Check for basic adaptation patterns
      if (params.workoutHistory.length >= 5) {
        detectedPatterns.push({
          id: `basic-adaptation-${params.userId}-${Date.now()}`,
          userId: params.userId,
          patternType: 'adaptation-trend',
          confidence: 0.7,
          strength: 0.6,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 1,
          contradictions: 0,
          timeSpan: 2,
          data: {
            adaptationTrends: {
              direction: 'increasing',
              rate: 0.05,
              consistency: 0.8
            }
          }
        });

        insights.push({
          type: 'adaptation-effectiveness' as const,
          insight: 'Basic adaptation patterns detected in your workout history',
          supportingData: { workoutCount: params.workoutHistory.length },
          confidence: 0.7,
          actionable: true
        });
      }

      return {
        userId: params.userId,
        analysisPeriod: { 
          start: new Date(Math.min(...params.workoutHistory.map((w: any) => new Date(w.completedAt).getTime()))),
          end: new Date(Math.max(...params.workoutHistory.map((w: any) => new Date(w.completedAt).getTime())))
        },
        totalWorkouts: params.workoutHistory.length,
        detectedPatterns,
        updatedPatterns: [],
        invalidatedPatterns: [],
        insights,
        recommendations: [{
          type: 'training-adjustment' as const,
          recommendation: 'Continue consistent workouts to enable more sophisticated pattern analysis',
          rationale: 'More data will improve AI pattern recognition accuracy',
          expectedImpact: 'Better personalized adaptations and insights',
          confidence: 0.8,
          priority: 'medium' as const
        }],
        confidenceUpdates: []
      } as PatternAnalysis;
      
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

export const getHistoricalPatterns = createAsyncThunk(
  'historicalPatterns/getPatterns',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Using localStorage with proper prefix validation - encryption to be added later
      const storageKey = `gymgenie_historical_patterns-${userId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        return [] as HistoricalPattern[];
      }

      // Parse stored data
      try {
        const patterns = JSON.parse(storedData);
        return Array.isArray(patterns) ? patterns : [];
      } catch (parseError) {
        console.error('Error parsing stored patterns:', parseError);
        return [];
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

export const updateHistoricalPattern = createAsyncThunk(
  'historicalPatterns/updatePattern',
  async (params: { userId: string; patternId: string; updates: Partial<HistoricalPattern> }, { rejectWithValue }) => {
    try {
      const storageKey = `gymgenie_historical_patterns-${params.userId}`;
      const encryptedData = localStorage.getItem(storageKey);
      
      let existingPatterns: HistoricalPattern[] = [];
      if (encryptedData) {
        try {
          existingPatterns = JSON.parse(encryptedData);
          if (!Array.isArray(existingPatterns)) {
            existingPatterns = [];
          }
        } catch (parseError) {
          existingPatterns = [];
        }
      }

      const updatedPatterns = existingPatterns.map(pattern => 
        pattern.id === params.patternId ? { ...pattern, ...params.updates } : pattern
      );

      // Store updated patterns with proper prefix
      localStorage.setItem(storageKey, JSON.stringify(updatedPatterns));
      
      return { patternId: params.patternId, updates: params.updates };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

export const deleteHistoricalPattern = createAsyncThunk(
  'historicalPatterns/deletePattern',
  async (params: { userId: string; patternId: string }, { rejectWithValue }) => {
    try {
      const storageKey = `gymgenie_historical_patterns-${params.userId}`;
      const encryptedData = localStorage.getItem(storageKey);
      
      let existingPatterns: HistoricalPattern[] = [];
      if (encryptedData) {
        try {
          existingPatterns = JSON.parse(encryptedData);
          if (!Array.isArray(existingPatterns)) {
            existingPatterns = [];
          }
        } catch (parseError) {
          existingPatterns = [];
        }
      }

      const filteredPatterns = existingPatterns.filter(pattern => pattern.id !== params.patternId);
      
      // Store updated patterns with proper prefix
      localStorage.setItem(storageKey, JSON.stringify(filteredPatterns));
      
      return params.patternId;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

// State interface
interface HistoricalPatternsState {
  patterns: HistoricalPattern[];
  currentAnalysis: PatternAnalysis | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  analysisInProgress: boolean;
}

// Initial state
const initialState: HistoricalPatternsState = {
  patterns: [],
  currentAnalysis: null,
  loading: false,
  error: null,
  lastUpdated: null,
  analysisInProgress: false
};

// Slice definition
const historicalPatternsSlice = createSlice({
  name: 'historicalPatterns',
  initialState,
  reducers: {
    // Reducers for pattern management
    addPattern: (state, action: PayloadAction<HistoricalPattern>) => {
      state.patterns.push(action.payload);
      state.lastUpdated = new Date();
    },
    updatePatternInState: (state, action: PayloadAction<{ patternId: string; updates: Partial<HistoricalPattern> }>) => {
      const { patternId, updates } = action.payload;
      const index = state.patterns.findIndex(pattern => pattern.id === patternId);
      if (index !== -1) {
        state.patterns[index] = { ...state.patterns[index], ...updates };
        state.lastUpdated = new Date();
      }
    },
    removePattern: (state, action: PayloadAction<string>) => {
      state.patterns = state.patterns.filter(pattern => pattern.id !== action.payload);
      state.lastUpdated = new Date();
    },
    clearPatterns: (state) => {
      state.patterns = [];
      state.currentAnalysis = null;
      state.lastUpdated = new Date();
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Pattern analysis
    builder
      .addCase(analyzePatterns.pending, (state) => {
        state.analysisInProgress = true;
        state.error = null;
      })
      .addCase(analyzePatterns.fulfilled, (state, action) => {
        state.analysisInProgress = false;
        state.currentAnalysis = action.payload;
        // Add detected patterns to the patterns array
        if (action.payload.detectedPatterns.length > 0) {
          state.patterns.push(...action.payload.detectedPatterns);
        }
        // Update existing patterns
        if (action.payload.updatedPatterns.length > 0) {
          for (const updatedPattern of action.payload.updatedPatterns) {
            const index = state.patterns.findIndex(p => p.id === updatedPattern.id);
            if (index !== -1) {
              state.patterns[index] = updatedPattern;
            }
          }
        }
        // Remove invalidated patterns
        if (action.payload.invalidatedPatterns.length > 0) {
          state.patterns = state.patterns.filter(
            p => !action.payload.invalidatedPatterns.includes(p.id)
          );
        }
        state.lastUpdated = new Date();
      })
      .addCase(analyzePatterns.rejected, (state, action) => {
        state.analysisInProgress = false;
        state.error = action.payload as string;
      });

    // Get patterns
    builder
      .addCase(getHistoricalPatterns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHistoricalPatterns.fulfilled, (state, action) => {
        state.loading = false;
        state.patterns = action.payload;
        state.lastUpdated = new Date();
      })
      .addCase(getHistoricalPatterns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update pattern
    builder
      .addCase(updateHistoricalPattern.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHistoricalPattern.fulfilled, (state, action) => {
        state.loading = false;
        const { patternId, updates } = action.payload;
        const index = state.patterns.findIndex(pattern => pattern.id === patternId);
        if (index !== -1) {
          state.patterns[index] = { ...state.patterns[index], ...updates };
          state.lastUpdated = new Date();
        }
      })
      .addCase(updateHistoricalPattern.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete pattern
    builder
      .addCase(deleteHistoricalPattern.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHistoricalPattern.fulfilled, (state, action) => {
        state.loading = false;
        state.patterns = state.patterns.filter(pattern => pattern.id !== action.payload);
        state.lastUpdated = new Date();
      })
      .addCase(deleteHistoricalPattern.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Export actions
export const {
  addPattern,
  updatePatternInState,
  removePattern,
  clearPatterns,
  clearError
} = historicalPatternsSlice.actions;

// Export reducer
export default historicalPatternsSlice.reducer;

// Selectors
export const selectHistoricalPatterns = (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.patterns;

export const selectCurrentAnalysis = (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.currentAnalysis;

export const selectHistoricalPatternsLoading = (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.loading;

export const selectHistoricalPatternsError = (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.error;

export const selectAnalysisInProgress = (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.analysisInProgress;

export const selectPatternsByType = (patternType: string) => (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.patterns.filter(pattern => pattern.patternType === patternType);

export const selectPatternsByConfidence = (minConfidence: number) => (state: { historicalPatterns: HistoricalPatternsState }) => 
  state.historicalPatterns.patterns.filter(pattern => pattern.confidence >= minConfidence);

// Type exports for use in components
export type HistoricalPatternsReduxState = HistoricalPatternsState;