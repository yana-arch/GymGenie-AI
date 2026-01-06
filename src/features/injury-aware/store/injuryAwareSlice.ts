import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InjuryValidationService } from '../services/InjuryValidationService';
import { DiscomfortMonitoringService } from '../services/DiscomfortMonitoringService';
import { InjuryFilterService } from '../services/InjuryFilterService';
import type {
  InjuryHistory,
  InjuryConstraints,
  DiscomfortEvent,
  DiscomfortResponse,
  AIRecommendation,
  FilteredRecommendations
} from '../types';

// State interface for injury-aware feature
export interface InjuryAwareState {
  // Injury history data
  injuryHistory: InjuryHistory;
  constraints: InjuryConstraints | null;
  isLoadingInjuries: boolean;
  injuryError: string | null;
  
  // Discomfort monitoring
  discomfortEvents: DiscomfortEvent[];
  isMonitoringDiscomfort: boolean;
  lastDiscomfortEvent: DiscomfortEvent | null;
  discomfortResponse: DiscomfortResponse | null;
  
  // AI filtering
  filteredRecommendations: FilteredRecommendations | null;
  isFilteringRecommendations: boolean;
  filterError: string | null;
  
  // Integration state
  isIntegratedWithLiveSession: boolean;
  activeSessionInjuryStatus: 'safe' | 'caution' | 'stop' | 'unknown';
  
  // Settings
  settings: {
    severityThreshold: number;
    conservativeMode: boolean;
    autoAdaptation: boolean;
  };
  
  // Performance metrics
  lastValidationTime: number;
  lastFilterTime: number;
}

const initialState: InjuryAwareState = {
  injuryHistory: { injuries: [] },
  constraints: null,
  isLoadingInjuries: false,
  injuryError: null,
  
  discomfortEvents: [],
  isMonitoringDiscomfort: false,
  lastDiscomfortEvent: null,
  discomfortResponse: null,
  
  filteredRecommendations: null,
  isFilteringRecommendations: false,
  filterError: null,
  
  isIntegratedWithLiveSession: false,
  activeSessionInjuryStatus: 'unknown',
  
  settings: {
    severityThreshold: 3,
    conservativeMode: false,
    autoAdaptation: true
  },
  
  lastValidationTime: 0,
  lastFilterTime: 0
};

// Services
let injuryValidationService: InjuryValidationService | null = null;
let discomfortMonitoringService: DiscomfortMonitoringService | null = null;
let injuryFilterService: InjuryFilterService | null = null;

// Initialize services with error handling
const initializeServices = () => {
  try {
    if (!injuryValidationService) {
      injuryValidationService = new InjuryValidationService();
    }
    if (!discomfortMonitoringService) {
      discomfortMonitoringService = new DiscomfortMonitoringService();
    }
    if (!injuryFilterService) {
      injuryFilterService = new InjuryFilterService();
    }
  } catch (error) {
    console.error('Failed to initialize injury-aware services:', error);
    throw new Error('Service initialization failed - injury features unavailable');
  }
};

// Async thunks
export const loadInjuryHistory = createAsyncThunk(
  'injuryAware/loadInjuryHistory',
  async (_, { rejectWithValue }) => {
    try {
      initializeServices();
      const history = await injuryValidationService!.loadInjuryHistory();
      const validationResult = await injuryValidationService!.validateInjuryConstraints(history);
      return { history, constraints: validationResult.constraints };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load injury history');
    }
  }
);

export const saveInjuryHistory = createAsyncThunk(
  'injuryAware/saveInjuryHistory',
  async (injuryHistory: InjuryHistory, { rejectWithValue }) => {
    try {
      initializeServices();
      await injuryValidationService!.storeInjuryHistory(injuryHistory);
      const validationResult = await injuryValidationService!.validateInjuryConstraints(injuryHistory);
      return { history: injuryHistory, constraints: validationResult.constraints };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save injury history');
    }
  }
);

export const recordDiscomfort = createAsyncThunk(
  'injuryAware/recordDiscomfort',
  async (discomfortData: Omit<DiscomfortEvent, 'id' | 'timestamp'>, { rejectWithValue }) => {
    try {
      initializeServices();
      const event = await discomfortMonitoringService!.recordDiscomfort(discomfortData);
      return event;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to record discomfort');
    }
  }
);

export const filterAIRecommendations = createAsyncThunk(
  'injuryAware/filterRecommendations',
  async (recommendations: AIRecommendation[], { getState, rejectWithValue }) => {
    try {
      initializeServices();
      const state = getState() as { injuryAware: InjuryAwareState };
      
      if (!state.injuryAware.constraints) {
        throw new Error('No injury constraints available for filtering');
      }
      
      const filtered = await injuryFilterService!.filterRecommendations(
        recommendations, 
        state.injuryAware.constraints
      );
      
      return filtered;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to filter recommendations');
    }
  }
);

export const startDiscomfortMonitoring = createAsyncThunk(
  'injuryAware/startDiscomfortMonitoring',
  async (_, { rejectWithValue }) => {
    try {
      initializeServices();
      
      // Set up response callback for severe discomfort
      discomfortMonitoringService!.setResponseCallback((action) => {
        // This will be handled by the slice based on the action
        return { type: 'injuryAware/discomfortResponse', payload: action };
      });
      
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start discomfort monitoring');
    }
  }
);

// Slice
const injuryAwareSlice = createSlice({
  name: 'injuryAware',
  initialState,
  reducers: {
    // Discomfort management
    addDiscomfortEvent: (state, action: PayloadAction<DiscomfortEvent>) => {
      state.discomfortEvents.push(action.payload);
      state.lastDiscomfortEvent = action.payload;
      
      // Update active session status based on severity
      if (action.payload.severity >= 4) {
        state.activeSessionInjuryStatus = 'stop';
      } else if (action.payload.severity >= 3) {
        state.activeSessionInjuryStatus = 'caution';
      } else {
        state.activeSessionInjuryStatus = 'safe';
      }
    },
    
    // Settings management
    updateInjurySettings: (state, action: PayloadAction<Partial<InjuryAwareState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Live session integration
    setLiveSessionIntegration: (state, action: PayloadAction<boolean>) => {
      state.isIntegratedWithLiveSession = action.payload;
    },
    
    updateSessionInjuryStatus: (state, action: PayloadAction<'safe' | 'caution' | 'stop' | 'unknown'>) => {
      state.activeSessionInjuryStatus = action.payload;
    },
    
    // Discomfort response handling
    handleDiscomfortResponse: (state, action: PayloadAction<DiscomfortResponse>) => {
      state.discomfortResponse = action.payload;
    },
    
    // Clear state
    clearDiscomfortHistory: (state) => {
      state.discomfortEvents = [];
      state.lastDiscomfortEvent = null;
      state.discomfortResponse = null;
    },
    
    // Reset error states
    clearInjuryError: (state) => {
      state.injuryError = null;
      state.filterError = null;
    },
    
    // Manual state updates
    setInjuryConstraints: (state, action: PayloadAction<InjuryConstraints>) => {
      state.constraints = action.payload;
    },
    
    setIsMonitoringDiscomfort: (state, action: PayloadAction<boolean>) => {
      state.isMonitoringDiscomfort = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Load injury history
    builder
      .addCase(loadInjuryHistory.pending, (state) => {
        state.isLoadingInjuries = true;
        state.injuryError = null;
      })
      .addCase(loadInjuryHistory.fulfilled, (state, action) => {
        state.isLoadingInjuries = false;
        state.injuryHistory = action.payload.history;
        state.constraints = action.payload.constraints;
        state.lastValidationTime = Date.now();
      })
      .addCase(loadInjuryHistory.rejected, (state, action) => {
        state.isLoadingInjuries = false;
        state.injuryError = action.payload as string;
      });
    
    // Save injury history
    builder
      .addCase(saveInjuryHistory.pending, (state) => {
        state.isLoadingInjuries = true;
        state.injuryError = null;
      })
      .addCase(saveInjuryHistory.fulfilled, (state, action) => {
        state.isLoadingInjuries = false;
        state.injuryHistory = action.payload.history;
        state.constraints = action.payload.constraints;
        state.lastValidationTime = Date.now();
      })
      .addCase(saveInjuryHistory.rejected, (state, action) => {
        state.isLoadingInjuries = false;
        state.injuryError = action.payload as string;
      });
    
    // Record discomfort
    builder
      .addCase(recordDiscomfort.fulfilled, (state, action) => {
        state.discomfortEvents.push(action.payload);
        state.lastDiscomfortEvent = action.payload;
        
        // Auto-update session status
        if (action.payload.severity >= 4) {
          state.activeSessionInjuryStatus = 'stop';
        } else if (action.payload.severity >= 3) {
          state.activeSessionInjuryStatus = 'caution';
        }
      })
      .addCase(recordDiscomfort.rejected, (state, action) => {
        state.injuryError = action.payload as string;
      });
    
    // Filter recommendations
    builder
      .addCase(filterAIRecommendations.pending, (state) => {
        state.isFilteringRecommendations = true;
        state.filterError = null;
      })
      .addCase(filterAIRecommendations.fulfilled, (state, action) => {
        state.isFilteringRecommendations = false;
        state.filteredRecommendations = action.payload;
        state.lastFilterTime = Date.now();
      })
      .addCase(filterAIRecommendations.rejected, (state, action) => {
        state.isFilteringRecommendations = false;
        state.filterError = action.payload as string;
      });
    
    // Start discomfort monitoring
    builder
      .addCase(startDiscomfortMonitoring.fulfilled, (state) => {
        state.isMonitoringDiscomfort = true;
      })
      .addCase(startDiscomfortMonitoring.rejected, (state, action) => {
        state.injuryError = action.payload as string;
      });
  }
});

// Export actions
export const {
  addDiscomfortEvent,
  updateInjurySettings,
  setLiveSessionIntegration,
  updateSessionInjuryStatus,
  handleDiscomfortResponse,
  clearDiscomfortHistory,
  clearInjuryError,
  setInjuryConstraints,
  setIsMonitoringDiscomfort
} = injuryAwareSlice.actions;

// Export selectors
export const selectInjuryHistory = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.injuryHistory;

export const selectInjuryConstraints = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.constraints;

export const selectDiscomfortEvents = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.discomfortEvents;

export const selectLastDiscomfortEvent = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.lastDiscomfortEvent;

export const selectFilteredRecommendations = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.filteredRecommendations;

export const selectInjurySettings = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.settings;

export const selectActiveSessionInjuryStatus = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.activeSessionInjuryStatus;

export const selectIsMonitoringDiscomfort = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.isMonitoringDiscomfort;

export const selectInjuryError = (state: { injuryAware: InjuryAwareState }) => 
  state.injuryAware.injuryError || state.injuryAware.filterError;

// Export reducer
export default injuryAwareSlice.reducer;