import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrivacySettings, PrivacyAuditEntry, DataCategories } from '../types/privacy.types';

interface PrivacyState {
  settings: PrivacySettings;
  auditLog: PrivacyAuditEntry[];
  isLocalProcessingActive: boolean;
  lastSanitizationTimestamp: number | null;
  lastSanitizationInsights: {
    categoriesShared: string[];
    categoriesProtected: string[];
  } | null;
}

const initialState: PrivacyState = {
  settings: {
    localProcessingOnly: true,
    encryptionEnabled: true,
    anonymizeMetadata: true,
    consentGiven: false,
    dataCategories: {
      injuryHistory: false,
      biologicalData: false,
      locationData: false,
      workoutPatterns: true,
      usageAnalytics: true,
    },
  },
  auditLog: [],
  isLocalProcessingActive: true,
  lastSanitizationTimestamp: null,
  lastSanitizationInsights: null,
};

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<PrivacySettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
    toggleDataCategory(state, action: PayloadAction<keyof DataCategories>) {
      state.settings.dataCategories[action.payload] = !state.settings.dataCategories[action.payload];
    },
    addAuditEntry(state, action: PayloadAction<PrivacyAuditEntry>) {
      state.auditLog.unshift(action.payload);
      if (state.auditLog.length > 100) {
        state.auditLog.pop();
      }
      if (action.payload.operation === 'transmission' && action.payload.details?.includes('anonymized')) {
        state.lastSanitizationTimestamp = action.payload.timestamp;
      }
    },
    recordSanitization(state, action: PayloadAction<{ categoriesShared: string[], categoriesProtected: string[] }>) {
      state.lastSanitizationTimestamp = Date.now();
      state.lastSanitizationInsights = action.payload;
    },
    setLocalProcessingActive(state, action: PayloadAction<boolean>) {
      state.isLocalProcessingActive = action.payload;
    },
    clearAuditLog(state) {
      state.auditLog = [];
    },
  },
});

export const { 
  updateSettings, 
  toggleDataCategory,
  addAuditEntry, 
  recordSanitization, 
  setLocalProcessingActive, 
  clearAuditLog 
} = privacySlice.actions;

export const selectPrivacySettings = (state: { privacy: PrivacyState }) => state.privacy.settings;
export const selectDataCategories = (state: { privacy: PrivacyState }) => state.privacy.settings.dataCategories;

export default privacySlice.reducer;
