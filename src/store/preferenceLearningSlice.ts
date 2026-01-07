/**
 * Preference Learning Redux Slice
 * Manages state for AI preference learning feature
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  PreferenceLearningReduxState,
  PreferencePattern,
  PreferenceLearningConfig,
  PreferenceLearningAction,
  PreferenceRecommendation
} from '../features/preference-learning/types/preferenceLearning.types';

// Service factory to avoid duplicate initialization
let serviceInstance: any = null;

const getServiceInstance = async () => {
  if (serviceInstance) return serviceInstance;
  
  // Import services dynamically to avoid circular dependencies
  const { PreferenceLearningService } = await import('../features/preference-learning/PreferenceLearningService');
  const { PreferenceEncryptionService } = await import('../features/preference-learning/services/PreferenceEncryptionService');
  const { RealTensorFlowJSService } = await import('../features/preference-learning/services/RealTensorFlowJSService');
  
  // Initialize services with real dependencies
  const config: PreferenceLearningConfig = {
    learningRate: 0.1,
    confidenceThreshold: 0.7,
    maxContradictions: 3,
    minSessions: 5,
    gradualAdaptationRate: 0.05,
    privacySettings: {
      localOnly: true,
      encryptionEnabled: true,
      retentionDays: 90
    }
  };

  const privacyService = new PreferenceEncryptionService({});
  const tensorFlowService = new RealTensorFlowJSService();
  serviceInstance = new PreferenceLearningService({
    privacyService,
    tensorFlowService,
    config
  });
  
  return serviceInstance;
};

// Async thunks for preference learning operations
export const detectPreferences = createAsyncThunk(
  'preference-learning/detectPreferences',
  async (payload: {
    session: any;
    existingPatterns: PreferencePattern[];
    userContext?: any;
  }) => {
    const preferenceService = await getServiceInstance();
    
    const preferenceInput = {
      session: payload.session,
      existingPatterns: payload.existingPatterns,
      userContext: payload.userContext
    };

    return await preferenceService.detectPreferences(preferenceInput);
  }
);

export const updatePreferencePatterns = createAsyncThunk(
  'preference-learning/updatePreferencePatterns',
  async (payload: { userId: string; patterns: PreferencePattern[] }) => {
    // Import services dynamically to avoid circular dependencies
    const { PreferenceLearningService } = await import('../features/preference-learning/PreferenceLearningService');
    const { PreferenceEncryptionService } = await import('../features/preference-learning/services/PreferenceEncryptionService');
    const { RealTensorFlowJSService } = await import('../features/preference-learning/services/RealTensorFlowJSService');
    
    // Initialize services with real dependencies
    const config: PreferenceLearningConfig = {
      learningRate: 0.1,
      confidenceThreshold: 0.7,
      maxContradictions: 3,
      minSessions: 5,
      gradualAdaptationRate: 0.05,
      privacySettings: {
        localOnly: true,
        encryptionEnabled: true,
        retentionDays: 90
      }
    };

    const privacyService = new PreferenceEncryptionService({});
    const tensorFlowService = new RealTensorFlowJSService();
    const preferenceService = new PreferenceLearningService({
      privacyService,
      tensorFlowService,
      config
    });

    // Update each preference through the service
    for (const pattern of payload.patterns) {
      await preferenceService.updatePreferences(payload.userId, pattern);
    }

    return payload.patterns;
  }
);

export const exportPreferences = createAsyncThunk(
  'preference-learning/exportPreferences',
  async (userId: string) => {
    // Import services dynamically to avoid circular dependencies
    const { PreferenceLearningService } = await import('../features/preference-learning/PreferenceLearningService');
    const { PreferenceEncryptionService } = await import('../features/preference-learning/services/PreferenceEncryptionService');
    const { RealTensorFlowJSService } = await import('../features/preference-learning/services/RealTensorFlowJSService');
    
    // Initialize services with real dependencies
    const config: PreferenceLearningConfig = {
      learningRate: 0.1,
      confidenceThreshold: 0.7,
      maxContradictions: 3,
      minSessions: 5,
      gradualAdaptationRate: 0.05,
      privacySettings: {
        localOnly: true,
        encryptionEnabled: true,
        retentionDays: 90
      }
    };

    const privacyService = new PreferenceEncryptionService({});
    const tensorFlowService = new RealTensorFlowJSService();
    const preferenceService = new PreferenceLearningService({
      privacyService,
      tensorFlowService,
      config
    });

    return await preferenceService.exportPreferences(userId);
  }
);

export const importPreferences = createAsyncThunk(
  'preference-learning/importPreferences',
  async (payload: { userId: string; encryptedData: string }) => {
    // Import services dynamically to avoid circular dependencies
    const { PreferenceLearningService } = await import('../features/preference-learning/PreferenceLearningService');
    const { PreferenceEncryptionService } = await import('../features/preference-learning/services/PreferenceEncryptionService');
    const { RealTensorFlowJSService } = await import('../features/preference-learning/services/RealTensorFlowJSService');
    
    // Initialize services with real dependencies
    const config: PreferenceLearningConfig = {
      learningRate: 0.1,
      confidenceThreshold: 0.7,
      maxContradictions: 3,
      minSessions: 5,
      gradualAdaptationRate: 0.05,
      privacySettings: {
        localOnly: true,
        encryptionEnabled: true,
        retentionDays: 90
      }
    };

    const privacyService = new PreferenceEncryptionService({});
    const tensorFlowService = new RealTensorFlowJSService();
    const preferenceService = new PreferenceLearningService({
      privacyService,
      tensorFlowService,
      config
    });

    await preferenceService.importPreferences(payload.userId, payload.encryptedData);
    return true;
  }
);

const initialState: PreferenceLearningReduxState = {
  patterns: [],
  config: {
    learningRate: 0.1,
    confidenceThreshold: 0.7,
    maxContradictions: 3,
    minSessions: 5,
    gradualAdaptationRate: 0.05,
    privacySettings: {
      localOnly: true,
      encryptionEnabled: true,
      retentionDays: 90
    }
  },
  learningStatus: 'inactive',
  lastUpdated: new Date(),
  statistics: {
    totalSessions: 0,
    patternsDetected: 0,
    averageConfidence: 0,
    userSatisfaction: 0.5
  },
  loading: false,
  error: null,
  lastSync: null
};

const preferenceLearningSlice = createSlice({
  name: 'preferenceLearning',
  initialState,
  reducers: {
    startLearning: (state) => {
      state.learningStatus = 'active';
      state.lastUpdated = new Date();
    },
    stopLearning: (state) => {
      state.learningStatus = 'paused';
      state.lastUpdated = new Date();
    },
    patternsUpdated: (state, action: PayloadAction<PreferencePattern[]>) => {
      state.patterns = action.payload;
      state.lastUpdated = new Date();
      state.statistics.patternsDetected = action.payload.length;
      state.statistics.averageConfidence = action.payload.length > 0 
        ? action.payload.reduce((sum, p) => sum + p.confidence, 0) / action.payload.length 
        : 0;
    },
    configUpdated: (state, action: PayloadAction<Partial<PreferenceLearningConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      state.lastUpdated = new Date();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addPattern: (state, action: PayloadAction<PreferencePattern>) => {
      state.patterns.push(action.payload);
      state.statistics.patternsDetected = state.patterns.length;
      state.statistics.averageConfidence = state.patterns.reduce((sum, p) => sum + p.confidence, 0) / state.patterns.length;
      state.lastUpdated = new Date();
    },
    removePattern: (state, action: PayloadAction<string>) => {
      state.patterns = state.patterns.filter(p => p.id !== action.payload);
      state.statistics.patternsDetected = state.patterns.length;
      state.statistics.averageConfidence = state.patterns.length > 0 
        ? state.patterns.reduce((sum, p) => sum + p.confidence, 0) / state.patterns.length 
        : 0;
      state.lastUpdated = new Date();
    },
    updatePattern: (state, action: PayloadAction<{ id: string; updates: Partial<PreferencePattern> }>) => {
      const { id, updates } = action.payload;
      const index = state.patterns.findIndex(p => p.id === id);
      if (index !== -1) {
        state.patterns[index] = { ...state.patterns[index], ...updates };
        state.statistics.averageConfidence = state.patterns.reduce((sum, p) => sum + p.confidence, 0) / state.patterns.length;
        state.lastUpdated = new Date();
      }
    },
    incrementSessions: (state) => {
      state.statistics.totalSessions += 1;
      state.lastUpdated = new Date();
    },
    updateUserSatisfaction: (state, action: PayloadAction<number>) => {
      state.statistics.userSatisfaction = action.payload;
      state.lastUpdated = new Date();
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // detectPreferences
      .addCase(detectPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(detectPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdated = new Date();
        
        // Update patterns with detected and updated patterns
        const { detectedPatterns, updatedPatterns, invalidatedPatterns } = action.payload;
        
        // Remove invalidated patterns
        state.patterns = state.patterns.filter(p => !invalidatedPatterns.includes(p.id));
        
        // Add detected patterns
        state.patterns.push(...detectedPatterns);
        
        // Update existing patterns
        for (const updated of updatedPatterns) {
          const index = state.patterns.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            state.patterns[index] = updated;
          }
        }
        
        // Update statistics
        state.statistics.patternsDetected = state.patterns.length;
        state.statistics.averageConfidence = state.patterns.length > 0 
          ? state.patterns.reduce((sum, p) => sum + p.confidence, 0) / state.patterns.length 
          : 0;
      })
      .addCase(detectPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to detect preferences';
      })
      
      // updatePreferencePatterns
      .addCase(updatePreferencePatterns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePreferencePatterns.fulfilled, (state, action) => {
        state.loading = false;
        state.patterns = action.payload;
        state.statistics.patternsDetected = action.payload.length;
        state.statistics.averageConfidence = action.payload.length > 0 
          ? action.payload.reduce((sum, p) => sum + p.confidence, 0) / action.payload.length 
          : 0;
        state.lastUpdated = new Date();
        state.lastSync = new Date();
      })
      .addCase(updatePreferencePatterns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update preference patterns';
      })
      
      // exportPreferences
      .addCase(exportPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportPreferences.fulfilled, (state) => {
        state.loading = false;
        // Export success could trigger a toast notification
      })
      .addCase(exportPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to export preferences';
      })
      
      // importPreferences
      .addCase(importPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importPreferences.fulfilled, (state) => {
        state.loading = false;
        state.lastSync = new Date();
        // Import success could trigger a refresh of patterns
      })
      .addCase(importPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to import preferences';
      });
  }
});

export const {
  startLearning,
  stopLearning,
  patternsUpdated,
  configUpdated,
  setLoading,
  setError,
  addPattern,
  removePattern,
  updatePattern,
  incrementSessions,
  updateUserSatisfaction,
  clearError
} = preferenceLearningSlice.actions;

// Selectors
export const selectPreferenceLearning = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning;

export const selectPreferencePatterns = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.patterns;

export const selectPreferenceLearningLoading = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.loading;

export const selectPreferenceLearningError = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.error;

export const selectPreferenceLearningConfig = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.config;

export const selectPreferenceLearningStatistics = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.statistics;

export const selectPreferenceLearningStatus = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.learningStatus;

// Helper selectors
export const selectPatternsByType = (type: string) => (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.patterns.filter(pattern => pattern.patternType === type);

export const selectHighConfidencePatterns = (minConfidence: number = 0.8) => (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.patterns.filter(pattern => pattern.confidence >= minConfidence);

export const selectActivePatterns = (state: { preferenceLearning: PreferenceLearningReduxState }) => 
  state.preferenceLearning.patterns.filter(pattern => 
    pattern.confidence >= 0.7 && 
    pattern.strength >= 0.5 && 
    pattern.contradictions < 3
  );

export default preferenceLearningSlice.reducer;