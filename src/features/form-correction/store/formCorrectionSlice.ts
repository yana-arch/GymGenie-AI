import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { FormCorrectionState } from '../services/FormCorrectionService';

// Type aliases for better readability
interface FormCorrectionPayload {
  isActive?: boolean;
  hasCameraPermission?: boolean;
  isDetecting?: boolean;
  currentPoses?: any[];
  feedback?: string | null;
  performance?: Partial<FormCorrectionState['performance']>;
}

interface FormCorrectionSliceState extends FormCorrectionState {
  // Additional state specific to Redux
  isInitialized: boolean;
  currentExercise: string;
  settings: {
    cameraEnabled: boolean;
    audioEnabled: boolean;
    visualFeedbackEnabled: boolean;
    correctionSensitivity: 'strict' | 'normal' | 'lenient';
  };
  lastAnalysis: {
    score: number;
    feedback: string;
    timestamp: number;
  } | null;
}

const initialState: FormCorrectionSliceState = {
  // Core FormCorrectionState
  isActive: false,
  hasCameraPermission: false,
  isDetecting: false,
  currentPoses: [],
  feedback: null,
  performance: {
    lastProcessingTime: 0,
    averageProcessingTime: 0,
    frameCount: 0
  },
  
  // Redux-specific state
  isInitialized: false,
  currentExercise: '',
  settings: {
    cameraEnabled: true,
    audioEnabled: true,
    visualFeedbackEnabled: true,
    correctionSensitivity: 'normal'
  },
  lastAnalysis: null
};

// Async thunks for form correction operations
export const startFormCorrection = createAsyncThunk(
  'formCorrection/startFormCorrection',
  async (_, { rejectWithValue }) => {
    try {
      // Dynamic import to avoid circular dependencies
      const { FormCorrectionService } = await import('../services/FormCorrectionService');
      const service = new FormCorrectionService();
      
      await service.initialize();
      await service.startFormCorrection();
      
      return service.getState();
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const stopFormCorrection = createAsyncThunk(
  'formCorrection/stopFormCorrection',
  async (_, { rejectWithValue }) => {
    try {
      // Dynamic import to avoid circular dependencies
      const { FormCorrectionService } = await import('../services/FormCorrectionService');
      const service = new FormCorrectionService();
      
      await service.stopFormCorrection();
      
      return { stopped: true };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const updateFormSettings = createAsyncThunk(
  'formCorrection/updateFormSettings',
  async (settings: Partial<FormCorrectionSliceState['settings']>, { rejectWithValue }) => {
    try {
      // Apply settings to service
      if (settings.audioEnabled !== undefined) {
        // Update audio service configuration when needed
        console.log('Audio settings updated:', settings.audioEnabled);
      }
      
      return settings;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const formCorrectionSlice = createSlice({
  name: 'formCorrection',
  initialState,
  reducers: {
    // Core state updates
    setFormCorrectionState: (state, action: PayloadAction<Partial<FormCorrectionState>>) => {
      Object.assign(state, action.payload);
    },
    
    updateCurrentPoses: (state, action: PayloadAction<any[]>) => {
      state.currentPoses = action.payload;
    },
    
    updateFeedback: (state, action: PayloadAction<string | null>) => {
      state.feedback = action.payload;
    },
    
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<FormCorrectionState['performance']>>) => {
      Object.assign(state.performance, action.payload);
    },
    
    // Initialization state
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    
    // Exercise management
    setCurrentExercise: (state, action: PayloadAction<string>) => {
      state.currentExercise = action.payload;
    },
    
    // Settings management
    updateSettings: (state, action: PayloadAction<Partial<FormCorrectionSliceState['settings']>>) => {
      Object.assign(state.settings, action.payload);
    },
    
    // Analysis tracking
    setLastAnalysis: (state, action: PayloadAction<FormCorrectionSliceState['lastAnalysis']>) => {
      state.lastAnalysis = action.payload;
    },
    
    // Camera permission
    setCameraPermission: (state, action: PayloadAction<boolean>) => {
      state.hasCameraPermission = action.payload;
    },
    
    // Detection control
    setDetecting: (state, action: PayloadAction<boolean>) => {
      state.isDetecting = action.payload;
    },
    
    // Reset form correction state
    resetFormCorrection: (state) => {
      return {
        ...initialState,
        settings: state.settings // Preserve user settings
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Start form correction
      .addCase(startFormCorrection.pending, (state) => {
        state.isActive = false;
        state.isDetecting = false;
        state.feedback = 'Initializing form correction...';
      })
      .addCase(startFormCorrection.fulfilled, (state, action) => {
        state.isActive = true;
        state.isDetecting = true;
        state.hasCameraPermission = action.payload.hasCameraPermission;
        state.currentPoses = action.payload.currentPoses;
        state.feedback = action.payload.feedback;
        state.performance = action.payload.performance;
        state.feedback = 'Form correction active';
      })
      .addCase(startFormCorrection.rejected, (state, action) => {
        state.isActive = false;
        state.isDetecting = false;
        state.feedback = `Error: ${action.payload}`;
      })
      
      // Stop form correction
      .addCase(stopFormCorrection.pending, (state) => {
        state.feedback = 'Stopping form correction...';
      })
      .addCase(stopFormCorrection.fulfilled, (state) => {
        state.isActive = false;
        state.isDetecting = false;
        state.currentPoses = [];
        state.feedback = null;
        state.performance = {
          lastProcessingTime: 0,
          averageProcessingTime: 0,
          frameCount: 0
        };
      })
      .addCase(stopFormCorrection.rejected, (state, action) => {
        state.feedback = `Error stopping form correction: ${action.payload}`;
      })
      
      // Update settings
      .addCase(updateFormSettings.pending, (state) => {
        state.feedback = 'Updating settings...';
      })
      .addCase(updateFormSettings.fulfilled, (state, action) => {
        Object.assign(state.settings, action.payload);
        state.feedback = 'Settings updated successfully';
      })
      .addCase(updateFormSettings.rejected, (state, action) => {
        state.feedback = `Error updating settings: ${action.payload}`;
      });
  }
});

// Export actions
export const {
  setFormCorrectionState,
  updateCurrentPoses,
  updateFeedback,
  updatePerformanceMetrics,
  setInitialized,
  setCurrentExercise,
  updateSettings,
  setLastAnalysis,
  setCameraPermission,
  setDetecting,
  resetFormCorrection
} = formCorrectionSlice.actions;

// Export selectors
export const selectFormCorrectionState = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection;

export const selectFormCorrectionActive = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.isActive;

export const selectFormCorrectionDetecting = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.isDetecting;

export const selectCurrentPoses = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.currentPoses;

export const selectFormFeedback = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.feedback;

export const selectFormPerformance = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.performance;

export const selectFormSettings = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.settings;

export const selectCurrentExercise = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.currentExercise;

export const selectLastAnalysis = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.lastAnalysis;

export const selectCameraPermission = (state: { formCorrection: FormCorrectionSliceState }) => 
  state.formCorrection.hasCameraPermission;

// Export reducer
export default formCorrectionSlice.reducer;
