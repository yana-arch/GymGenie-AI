/**
 * Preference Learning Feature Exports
 * Main entry point for preference learning feature
 */

// Main service export
export { PreferenceLearningService } from './PreferenceLearningService';
export type { IPreferenceLearningService } from './types/preferenceLearning.types';

// Supporting services
export { PreferenceIntelligenceEngine } from './PreferenceIntelligenceEngine';
export type { IPreferenceIntelligenceEngine } from './types/preferenceLearning.types';
export { PreferenceLearningIntegrationService } from './services/PreferenceLearningIntegrationService';
export { PreferenceEncryptionService } from './services/PreferenceEncryptionService';
export type { PrivacyPreservingStorage } from './types/preferenceLearning.types';

// All types
export type {
  PreferenceLearningInput,
  PreferenceLearningOutput,
  PreferencePattern,
  PreferenceRecommendation,
  WorkoutSession,
  PreferenceType,
  ExerciseSession,
  PreferenceLearningConfig,
  PreferenceLearningState,
  PreferenceLearningReduxState,
  CoachingPreferenceInput,
  CoachingPreferenceOutput,
  ExercisePreference,
  IntensityPreference,
  TimingPreference,
  RecoveryPreference,
  StorageAuditEntry
} from './types/preferenceLearning.types';

export { PreferenceLearningError } from './types/preferenceLearning.types';

// Redux slice exports
export {
  detectPreferences,
  updatePreferencePatterns,
  exportPreferences,
  importPreferences,
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
  clearError,
  selectPreferenceLearning,
  selectPreferencePatterns,
  selectPreferenceLearningLoading,
  selectPreferenceLearningError,
  selectPreferenceLearningConfig,
  selectPreferenceLearningStatistics,
  selectPreferenceLearningStatus,
  selectPatternsByType,
  selectHighConfidencePatterns,
  selectActivePatterns
} from '../../store/preferenceLearningSlice';

// Component exports
export {
  PreferenceManagementComponent,
  PreferenceDashboard,
  PreferenceTransparencyView
} from '../../components/preferences';

// Utility functions
export const createPreferenceLearningService = (dependencies: {
  privacyService: PrivacyPreservingStorage;
  tensorFlowService: any;
  config: PreferenceLearningConfig;
}): PreferenceLearningService => {
  return new PreferenceLearningService(dependencies);
};

export const createPreferenceIntelligenceEngine = (config: PreferenceLearningConfig): PreferenceIntelligenceEngine => {
  return new PreferenceIntelligenceEngine(config);
};

export const createPreferenceEncryptionService = (baseStorage: PrivacyPreservingStorage): PreferenceEncryptionService => {
  return new PreferenceEncryptionService(baseStorage);
};

// Default configurations
export const DEFAULT_PREFERENCE_LEARNING_CONFIG: PreferenceLearningConfig = {
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

// Utility functions
export const validatePreferencePattern = (pattern: Partial<PreferencePattern>): boolean => {
  const required = ['id', 'userId', 'patternType', 'confidence', 'strength'];
  
  for (const field of required) {
    if (pattern[field as keyof PreferencePattern] === undefined || pattern[field as keyof PreferencePattern] === null) {
      return false;
    }
  }

  if (pattern.confidence !== undefined && (pattern.confidence < 0 || pattern.confidence > 1)) {
    return false;
  }

  if (pattern.strength !== undefined && (pattern.strength < 0 || pattern.strength > 1)) {
    return false;
  }

  return true;
};

export const calculatePatternConfidence = (
  confirmations: number,
  contradictions: number,
  baseConfidence: number = 0.5
): number => {
  const total = confirmations + contradictions;
  if (total === 0) {
    return baseConfidence;
  }

  const confirmationRate = confirmations / total;
  const volumeBonus = Math.min(total / 20, 0.3); // Max 30% bonus for volume
  const adjustedConfidence = baseConfidence + (confirmationRate * 0.5) + volumeBonus;

  return Math.min(1.0, Math.max(0.0, adjustedConfidence));
};

export const getPreferenceImpact = (patternType: PreferenceType): 'low' | 'medium' | 'high' => {
  switch (patternType) {
    case 'exercise-selection':
      return 'high';
    case 'intensity-level':
      return 'medium';
    case 'workout-timing':
      return 'low';
    case 'recovery-duration':
      return 'medium';
    case 'exercise-order':
      return 'low';
    case 'rest-periods':
      return 'low';
    case 'motivation-style':
      return 'medium';
    default:
      return 'medium';
  }
};