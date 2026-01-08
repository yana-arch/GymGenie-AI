/**
 * Preference Learning Types
 * Defines interfaces for AI preference learning and user personalization
 */

export interface WorkoutSession {
  id: string;
  userId: string;
  exercises: ExerciseSession[];
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  performance: SessionPerformance;
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseType: string;
  duration: number;
  sets: number;
  reps: number;
  weight?: number;
  intensity: number; // 0-1 scale
  completionRate: number; // 0-1 scale
  userFeedback?: {
    difficulty: number; // 1-5 scale
    satisfaction: number; // 1-5 scale
    energy: number; // 1-5 scale
  };
}

export interface SessionPerformance {
  overallScore: number; // 0-1 scale
  consistencyScore: number; // 0-1 scale
  fatigueLevel: number; // 0-1 scale
  motivationLevel: number; // 0-1 scale
}

export interface PreferencePattern {
  id: string;
  userId: string;
  patternType: PreferenceType;
  confidence: number; // 0-1 scale
  strength: number; // 0-1 scale
  firstDetected: Date;
  lastConfirmed: Date;
  confirmations: number;
  contradictions: number;
  data: {
    exercisePreferences?: ExercisePreference[];
    intensityPreferences?: IntensityPreference[];
    timingPreferences?: TimingPreference[];
    recoveryPreferences?: RecoveryPreference[];
    adaptationRate?: number;
  };
}

export type PreferenceType = 
  | 'exercise-selection'
  | 'intensity-level'
  | 'workout-timing'
  | 'recovery-duration'
  | 'exercise-order'
  | 'rest-periods'
  | 'motivation-style'
  | 'gradual-adaptation'
  | 'adaptation-rate'
  | 'error';

export interface ExercisePreference {
  exerciseId: string;
  preference: 'preferred' | 'avoided' | 'neutral';
  confidence: number;
  contexts: string[]; // e.g., ['warmup', 'main', 'cooldown']
}

export interface IntensityPreference {
  intensityRange: {
    min: number; // 0-1 scale
    max: number; // 0-1 scale
  };
  preference: 'comfortable' | 'challenging' | 'extreme';
  confidence: number;
  exerciseTypes?: string[]; // Specific to certain exercises
}

export interface TimingPreference {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string[];
  preference: 'optimal' | 'acceptable' | 'avoided';
  confidence: number;
  performanceImpact: number; // How much this timing affects performance
}

export interface RecoveryPreference {
  recommendedRestTime: number; // seconds
  minimumRestTime: number; // seconds
  maximumRestTime: number; // seconds
  confidence: number;
  exerciseType?: string; // Specific to certain exercises
}

export interface PreferenceLearningConfig {
  learningRate: number; // How fast to adapt to new preferences
  confidenceThreshold: number; // Minimum confidence to act on preferences
  maxContradictions: number; // Max contradictions before invalidating preference
  minSessions: number; // Minimum sessions before learning patterns
  gradualAdaptationRate: number; // How gradually to apply changes
  privacySettings: {
    localOnly: boolean;
    encryptionEnabled: boolean;
    retentionDays: number;
  };
}

export interface PreferenceLearningState {
  patterns: PreferencePattern[];
  config: PreferenceLearningConfig;
  learningStatus: 'inactive' | 'active' | 'paused';
  lastUpdated: Date;
  statistics: {
    totalSessions: number;
    patternsDetected: number;
    averageConfidence: number;
    userSatisfaction: number;
  };
}

export interface PreferenceLearningInput {
  session: WorkoutSession;
  existingPatterns: PreferencePattern[];
  userContext?: {
    currentMood?: 'energetic' | 'fatigued' | 'focused' | 'distracted';
    sessionPhase: 'warmup' | 'main' | 'cooldown' | 'recovery';
    recentPerformance: number;
  };
}

export interface PreferenceLearningOutput {
  detectedPatterns: PreferencePattern[];
  updatedPatterns: PreferencePattern[];
  invalidatedPatterns: string[]; // Pattern IDs that were invalidated
  confidenceUpdates: {
    patternId: string;
    oldConfidence: number;
    newConfidence: number;
  }[];
  recommendations: PreferenceRecommendation[];
}

export interface PreferenceRecommendation {
  type: PreferenceType;
  recommendation: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  reasoning: string;
  data: Record<string, unknown> | {
    adaptationRate?: number;
    exerciseId?: string;
    confidenceScore?: number;
    userFeedback?: number[];
    performanceMetrics?: number[];
  };
}

export interface PrivacyPreservingStorage {
  encrypt(data: Record<string, unknown> | unknown): Promise<string>;
  decrypt<T = unknown>(encryptedData: string): Promise<T>;
  store(key: string, data: Record<string, unknown> | unknown): Promise<void>;
  retrieve<T = unknown>(key: string): Promise<T>;
  delete(key: string): Promise<void>;
  auditTrail(): Promise<StorageAuditEntry[]>;
}

export interface StorageAuditEntry {
  timestamp: Date;
  action: 'store' | 'retrieve' | 'update' | 'delete';
  key: string;
  success: boolean;
  error?: string;
}

export interface AdaptationEvent {
  id: string;
  timestamp: number;
  triggers: string[];
  action: string;
  modifications: any;
  userResponse: 'accepted' | 'rejected' | 'ignored' | 'manual_override';
  responseTime?: number; // ms from display to response
}

// Service interfaces
export interface IPreferenceLearningService {
  detectPreferences(input: PreferenceLearningInput): Promise<PreferenceLearningOutput>;
  getLearnedPreferences(userId: string): Promise<PreferencePattern[]>;
  updatePreferences(userId: string, updates: Partial<PreferencePattern>): Promise<void>;
  deletePreference(userId: string, patternId: string): Promise<void>;
  exportPreferences(userId: string): Promise<string>; // Encrypted export
  importPreferences(userId: string, encryptedData: string): Promise<void>;
  resetPreferences(userId: string): Promise<void>;
  recordAdaptationResponse(userId: string, event: AdaptationEvent): Promise<void>;
}

export interface IPreferenceIntelligenceEngine {
  analyzePatternStrength(pattern: PreferencePattern): Promise<number>;
  validatePattern(pattern: PreferencePattern): Promise<boolean>;
  predictPreferenceImpact(preferences: PreferencePattern[], session: WorkoutSession): Promise<number>;
  generateRecommendations(patterns: PreferencePattern[]): Promise<PreferenceRecommendation[]>;
}

// Redux slice state
export interface PreferenceLearningReduxState extends PreferenceLearningState {
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

// Action types
export type PreferenceLearningAction = 
  | { type: 'preference-learning/startLearning' }
  | { type: 'preference-learning/stopLearning' }
  | { type: 'preference-learning/patternsUpdated'; payload: PreferencePattern[] }
  | { type: 'preference-learning/configUpdated'; payload: PreferenceLearningConfig }
  | { type: 'preference-learning/setLoading'; payload: boolean }
  | { type: 'preference-learning/setError'; payload: string | null };

// TensorFlow.js integration types
export interface TensorFlowJSService {
  predictPattern(input: PatternPredictionInput): Promise<PatternPredictionOutput>;
  loadModel(modelPath: string): Promise<void>;
  isModelLoaded(): boolean;
  getModelMetadata(): ModelMetadata;
}

export interface PatternPredictionInput {
  type: PreferenceType;
  sessionData: WorkoutSession;
  userId?: string;
  historicalPatterns?: PreferencePattern[];
  userContext?: {
    sessionPhase?: string;
    recentPerformance?: number;
    timeOfDay?: string;
    currentMood?: string;
  };
}

export interface PatternPredictionOutput {
  predictedPattern?: PreferenceType;
  confidence: number;
  features: {
    exerciseSelection: number;
    intensityLevel: number;
    timingPreference: number;
    recoveryNeed: number;
  };
  reasoning: string;
  preferences?: ExercisePreference[];
  intensityRange?: {
    min: number;
    max: number;
  };
  preference?: 'preferred' | 'avoided' | 'neutral' | 'comfortable' | 'challenging' | 'extreme';
}

export interface ModelMetadata {
  version: string;
  trainedOn: Date;
  accuracy: number;
  inputShape: number[];
  outputShape: number[];
}

export interface MLModel {
  predict(input: PatternPredictionInput): Promise<PatternPredictionOutput>;
  train(data: TrainingData[]): Promise<TrainingResult>;
  save(path: string): Promise<void>;
  load(path: string): Promise<void>;
}

export interface TrainingData {
  input: PatternPredictionInput;
  expectedOutput: PatternPredictionOutput;
}

export interface TrainingResult {
  epochs: number;
  finalAccuracy: number;
  loss: number;
  validationAccuracy: number;
}

// Integration types for existing systems
export interface CoachingPreferenceInput {
  preferences: PreferencePattern[];
  confidence: number;
  adaptationLevel: number; // 0-1 scale, how much to adapt based on preferences
  safetyConstraints: string[]; // Preferences that cannot override safety
}

export interface CoachingPreferenceOutput {
  modifiedRecommendations: {
    type: string;
    content: string;
    priority: number;
    source: string;
  }[];
  preferencesApplied: string[];
  confidenceAdjusted: boolean;
  safetyOverrides: string[];
}

// Error types
export class PreferenceLearningError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PreferenceLearningError';
  }
}

// Validation schemas
export const PreferencePatternValidation = {
  required: ['id', 'userId', 'patternType', 'confidence', 'strength'],
  optional: ['data', 'firstDetected', 'lastConfirmed'],
  constraints: {
    confidence: { min: 0, max: 1 },
    strength: { min: 0, max: 1 },
    confirmations: { min: 0 },
    contradictions: { min: 0 }
  }
} as const;