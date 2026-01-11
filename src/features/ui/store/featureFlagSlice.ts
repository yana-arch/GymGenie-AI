import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeatureFlagState {
  enableAI: boolean;
  enableFormCorrection: boolean;
  enableInjuryAwareness: boolean;
  enableUnifiedCoaching: boolean;
  debugMode: boolean;
}

const initialState: FeatureFlagState = {
  enableAI: true,
  enableFormCorrection: true,
  enableInjuryAwareness: true,
  enableUnifiedCoaching: true,
  debugMode: process.env.NODE_ENV !== 'production',
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
    resetFlags: () => initialState,
  },
});

export const { toggleFeature, setFeature, resetFlags } = featureFlagSlice.actions;
export default featureFlagSlice.reducer;
