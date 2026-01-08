import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { z } from 'zod';
import {
  FeedbackData,
  FeedbackType,
  FeedbackPattern,
  FeedbackImpact,
  FeedbackSettings,
  FeedbackProcessingResult,
  FeedbackValidationResult
} from '../types/feedbackPersonalization.types';

// Re-export types that are commonly used by components
export { FeedbackType };
import { feedbackServiceManager } from '../services/FeedbackServiceManager';

// Zod schemas for validation
const FeedbackContextSchema = z.object({
  currentWeight: z.number().optional(),
  currentReps: z.number().optional(),
  currentSets: z.number().optional(),
  userFatigue: z.number().min(0).max(1).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).optional(),
  previousPerformance: z.object({
    sets: z.number().optional(),
    reps: z.number().optional(),
    weight: z.number().optional()
  }).optional(),
  heartRateZones: z.object({
    current: z.number().optional(),
    max: z.number().optional(),
    zones: z.array(z.object({
      name: z.string(),
      min: z.number(),
      max: z.number()
    })).optional()
  }).optional(),
  environmental: z.object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    gymLocation: z.string().optional()
  }).optional()
});

const FeedbackDataSchema = z.object({
  id: z.string().min(1),
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
  type: z.nativeEnum(FeedbackType),
  rating: z.number().min(1).max(5),
  timestamp: z.string().datetime(),
  context: FeedbackContextSchema.optional(),
  comments: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional()
});

interface IFeedbackPersonalizationState {
  // Core data
  feedbackHistory: FeedbackData[];
  patterns: FeedbackPattern[];
  currentImpacts: FeedbackImpact[];
  
  // Service management
  isServiceInitialized: boolean;
  service: any | null; // Service instance (non-serializable, handled by Redux middleware)
  
  // Settings
  settings: FeedbackSettings;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Processing state
  isProcessingFeedback: boolean;
  lastProcessed: string | null;
  
  // Validation state
  validationResult: FeedbackValidationResult | null;
  showValidationErrors: boolean;
}

const defaultSettings: FeedbackSettings = {
  confidenceThreshold: 0.6,
  maxHistorySize: 1000,
  patternDetectionMinDataPoints: 5,
  overfittingPrevention: {
    maxFeedbackWeightPerExercise: 0.3,
    temporalDecay: 0.1,
    diversityThreshold: 0.7
  },
  privacy: {
    retentionDays: 365,
    anonymizationLevel: 'basic',
    allowPatternSharing: true
  },
  visualization: {
    showConfidenceIntervals: true,
    showHistoricalTrends: true,
    showCorrelationFactors: true
  }
};

const initialState: IFeedbackPersonalizationState = {
  feedbackHistory: [],
  patterns: [],
  currentImpacts: [],
  isServiceInitialized: false,
  service: null,
  settings: defaultSettings,
  isLoading: false,
  error: null,
  isProcessingFeedback: false,
  lastProcessed: null,
  validationResult: null,
  showValidationErrors: false
};

// Async thunks
export const initializeFeedbackService = createAsyncThunk(
  'feedbackPersonalization/initialize',
  async (settings: Partial<FeedbackSettings> = {}, { rejectWithValue }) => {
    try {
      const service = feedbackServiceManager.initializeService(settings);
      return { settings: service.getSettings(), service };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize service');
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'feedbackPersonalization/submitFeedback',
  async (feedbackData: FeedbackData, { rejectWithValue }) => {
    try {
      // Validate with Zod first
      FeedbackDataSchema.parse(feedbackData);
      
      const service = feedbackServiceManager.getService();
      if (!service) {
        throw new Error('Feedback service not initialized');
      }

      const result = service.collectFeedback(feedbackData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process feedback');
      }

      return { feedbackData, result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return rejectWithValue(`Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to submit feedback');
    }
  }
);

export const submitFeedbackBatch = createAsyncThunk(
  'feedbackPersonalization/submitFeedbackBatch',
  async (feedbackBatch: FeedbackData[], { rejectWithValue }) => {
    try {
      // Validate all feedback data
      feedbackBatch.forEach(feedback => FeedbackDataSchema.parse(feedback));
      
      const service = feedbackServiceManager.getService();
      if (!service) {
        throw new Error('Feedback service not initialized');
      }

      const results = await service.processFeedbackBatch(feedbackBatch);
      
      return { feedbackBatch, results };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return rejectWithValue(`Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to submit feedback batch');
    }
  }
);

export const detectPatterns = createAsyncThunk(
  'feedbackPersonalization/detectPatterns',
  async (params: { exerciseId: string; feedbackType: FeedbackType }, { rejectWithValue }) => {
    try {
      const service = feedbackServiceManager.getService();
      if (!service) {
        throw new Error('Feedback service not initialized');
      }

      const pattern = service.detectPatterns(params.exerciseId, params.feedbackType);
      return { exerciseId: params.exerciseId, feedbackType: params.feedbackType, pattern };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to detect patterns');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'feedbackPersonalization/updateSettings',
  async (newSettings: Partial<FeedbackSettings>, { rejectWithValue }) => {
    try {
      const service = feedbackServiceManager.getService();
      if (!service) {
        throw new Error('Feedback service not initialized');
      }

      service.updateSettings(newSettings);
      const updatedSettings = service.getSettings();
      return updatedSettings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update settings');
    }
  }
);

const feedbackPersonalizationSlice = createSlice({
  name: 'feedbackPersonalization',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    addFeedbackImpact: (state, action: PayloadAction<FeedbackImpact>) => {
      state.currentImpacts.push(action.payload);
    },
    
    removeFeedbackImpact: (state, action: PayloadAction<string>) => {
      state.currentImpacts = state.currentImpacts.filter(
        impact => impact.recommendationId !== action.payload
      );
    },
    
    clearFeedbackImpacts: (state) => {
      state.currentImpacts = [];
    },
    
    toggleValidationErrorDisplay: (state) => {
      state.showValidationErrors = !state.showValidationErrors;
    },
    
    clearHistory: (state) => {
      state.feedbackHistory = [];
      state.patterns = [];
      const service = feedbackServiceManager.getService();
      if (service) {
        service.clearHistory();
      }
    },
    
    validateFeedbackData: (state, action: PayloadAction<FeedbackData>) => {
      try {
        FeedbackDataSchema.parse(action.payload);
        const service = feedbackServiceManager.getService();
        if (service) {
          state.validationResult = service.validateFeedback(action.payload);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          state.validationResult = {
            isValid: false,
            errors: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
            warnings: [],
            recommendations: []
          };
        }
      }
    }
  },
  extraReducers: (builder) => {
    // Initialize service
    builder
      .addCase(initializeFeedbackService.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeFeedbackService.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isServiceInitialized = true;
        state.service = action.payload.service;
        state.settings = action.payload.settings;
        state.error = null;
      })
      .addCase(initializeFeedbackService.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isServiceInitialized = false;
      });

    // Submit single feedback
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.isProcessingFeedback = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.isProcessingFeedback = false;
        state.error = null;
        state.lastProcessed = new Date().toISOString();
        
        // Add to history if service confirms it was added
        if (action.payload.result.confidenceScore >= state.settings.confidenceThreshold) {
          state.feedbackHistory.push(action.payload.feedbackData);
        }
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.isProcessingFeedback = false;
        state.error = action.payload as string;
      });

    // Submit feedback batch
    builder
      .addCase(submitFeedbackBatch.pending, (state) => {
        state.isProcessingFeedback = true;
        state.error = null;
      })
      .addCase(submitFeedbackBatch.fulfilled, (state, action) => {
        state.isProcessingFeedback = false;
        state.error = null;
        state.lastProcessed = new Date().toISOString();
        
        // Add successfully processed feedback to history
        const successfulFeedback = action.payload.feedbackBatch.filter((_, index) => 
          action.payload.results[index].success && 
          action.payload.results[index].confidenceScore >= state.settings.confidenceThreshold
        );
        state.feedbackHistory.push(...successfulFeedback);
      })
      .addCase(submitFeedbackBatch.rejected, (state, action) => {
        state.isProcessingFeedback = false;
        state.error = action.payload as string;
      });

    // Detect patterns
    builder
      .addCase(detectPatterns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(detectPatterns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        
        if (action.payload.pattern) {
          // Replace existing pattern for this exercise/type combo
          state.patterns = state.patterns.filter(
            pattern => !(pattern.exerciseId === action.payload.exerciseId && 
                        pattern.feedbackType === action.payload.feedbackType)
          );
          state.patterns.push(action.payload.pattern);
        }
      })
      .addCase(detectPatterns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const feedbackPersonalizationActions = feedbackPersonalizationSlice.actions;

// Selectors
export const selectFeedbackHistory = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.feedbackHistory;

export const selectFeedbackPatterns = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.patterns;

export const selectFeedbackImpacts = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.currentImpacts;

export const selectFeedbackSettings = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.settings;

export const selectFeedbackService = () => feedbackServiceManager.getService();

export const selectFeedbackLoading = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.isLoading;

export const selectFeedbackError = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.error;

export const selectIsProcessingFeedback = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.isProcessingFeedback;

export const selectValidationResult = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.validationResult;

export const selectShowValidationErrors = (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.showValidationErrors;

// Derived selectors
export const selectFeedbackByExercise = (exerciseId: string) => (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.feedbackHistory.filter(feedback => feedback.exerciseId === exerciseId);

export const selectFeedbackByType = (feedbackType: FeedbackType) => (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.feedbackHistory.filter(feedback => feedback.type === feedbackType);

export const selectPatternsByExercise = (exerciseId: string) => (state: { feedbackPersonalization: FeedbackPersonalizationState }) => 
  state.feedbackPersonalization.patterns.filter(pattern => pattern.exerciseId === exerciseId);

export const feedbackPersonalizationReducer = feedbackPersonalizationSlice.reducer;

// Export the state type for testing
export type FeedbackPersonalizationState = ReturnType<typeof feedbackPersonalizationSlice.getInitialState>;