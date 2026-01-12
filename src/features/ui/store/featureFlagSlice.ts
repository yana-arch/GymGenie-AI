import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ServiceStatus = 'available' | 'degraded' | 'offline';
export type DegradationReason = 'network' | 'api' | null;

interface FeatureFlagState {
  enableAI: boolean;
  enableCoaching: boolean;
  enablePersonalization: boolean;
  enableAnalytics: boolean;
  enableFormCorrection: boolean;
  enableInjuryAwareness: boolean;
  enableUnifiedCoaching: boolean;
  debugMode: boolean;
  serviceStatus: ServiceStatus;
  degradationReason: DegradationReason;
}

const initialState: FeatureFlagState = {
  enableAI: false,
  enableCoaching: false,
  enablePersonalization: false,
  enableAnalytics: false,
  enableFormCorrection: false,
  enableInjuryAwareness: false,
  enableUnifiedCoaching: false,
  debugMode: process.env.NODE_ENV !== 'production',
  serviceStatus: 'available',
  degradationReason: null,
};

const featureFlagSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    toggleFeature: (state, action: PayloadAction<keyof FeatureFlagState>) => {
      const key = action.payload;
      if (typeof state[key] === 'boolean') {
        (state[key] as boolean) = !state[key];
      }
    },
    setFeature: (state, action: PayloadAction<{ feature: keyof FeatureFlagState; enabled: boolean }>) => {
      const { feature, enabled } = action.payload;
      if (typeof state[feature] === 'boolean') {
        (state[feature] as boolean) = enabled;
      }
    },
    updateServiceStatus: (state, action: PayloadAction<{ status: ServiceStatus; reason: DegradationReason }>) => {
      state.serviceStatus = action.payload.status;
      state.degradationReason = action.payload.reason;
      
      // If service is unavailable, we might want to temporarily disable AI features
      // but the FeatureGuard should handle this reactively based on serviceStatus
    },
    resetFlags: () => initialState,
  },
});

export const { toggleFeature, setFeature, updateServiceStatus, resetFlags } = featureFlagSlice.actions;

export default featureFlagSlice.reducer;
