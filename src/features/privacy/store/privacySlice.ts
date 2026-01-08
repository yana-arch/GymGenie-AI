import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrivacySettings, PrivacyAuditEntry } from '../types/privacy.types';

interface PrivacyState {
  settings: PrivacySettings;
  auditLog: PrivacyAuditEntry[];
  isLocalProcessingActive: boolean;
  lastSanitizationTimestamp: number | null;
}

const initialState: PrivacyState = {
  settings: {
    localProcessingOnly: true,
    encryptionEnabled: true,
    anonymizeMetadata: true,
    consentGiven: false,
  },
  auditLog: [],
  isLocalProcessingActive: true,
  lastSanitizationTimestamp: null,
};

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<PrivacySettings>>) {
      state.settings = { ...state.settings, ...action.payload };
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
    recordSanitization(state) {
      state.lastSanitizationTimestamp = Date.now();
    },
    setLocalProcessingActive(state, action: PayloadAction<boolean>) {
      state.isLocalProcessingActive = action.payload;
    },
    clearAuditLog(state) {
      state.auditLog = [];
    },
  },
});

export const { updateSettings, addAuditEntry, recordSanitization, setLocalProcessingActive, clearAuditLog } = privacySlice.actions;
export default privacySlice.reducer;
