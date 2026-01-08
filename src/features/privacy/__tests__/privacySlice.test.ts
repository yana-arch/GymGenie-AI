import { describe, it, expect } from 'vitest';
import reducer, { updateSettings, toggleDataCategory } from '../store/privacySlice';
import { DataCategories, PrivacyAuditEntry } from '../types/privacy.types';

describe('privacySlice', () => {
  const initialState = {
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
      } as DataCategories
    },
    auditLog: [] as PrivacyAuditEntry[],
    isLocalProcessingActive: true,
    lastSanitizationTimestamp: null as number | null,
    lastSanitizationInsights: null as { categoriesShared: string[], categoriesProtected: string[] } | null,
  };

  it('should handle toggleDataCategory', () => {
    const nextState = reducer(initialState, toggleDataCategory('injuryHistory'));
    expect(nextState.settings.dataCategories.injuryHistory).toBe(true);
  });

  it('should update specific data category via updateSettings', () => {
    const nextState = reducer(initialState, updateSettings({
      dataCategories: {
        ...initialState.settings.dataCategories,
        biologicalData: true
      }
    }));
    expect(nextState.settings.dataCategories.biologicalData).toBe(true);
  });
});
