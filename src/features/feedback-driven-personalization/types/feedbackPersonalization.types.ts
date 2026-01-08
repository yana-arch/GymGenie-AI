export enum FeedbackType {
  DIFFICULTY_RATING = 'difficulty_rating',
  ENERGY_LEVEL = 'energy_level',
  COMFORT_LEVEL = 'comfort_level',
  PAIN_FEEDBACK = 'pain_feedback',
  TECHNIQUE_FEEDBACK = 'technique_feedback',
  MOTIVATION_LEVEL = 'motivation_level'
}

export interface FeedbackContext {
  currentWeight?: number;
  currentReps?: number;
  currentSets?: number;
  userFatigue?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  previousPerformance?: {
    sets?: number;
    reps?: number;
    weight?: number;
  };
  heartRateZones?: {
    current?: number;
    max?: number;
    zones?: Array<{ name: string; min: number; max: number }>;
  };
  environmental?: {
    temperature?: number;
    humidity?: number;
    gymLocation?: string;
  };
}

export interface FeedbackData {
  id: string;
  workoutId: string;
  exerciseId: string;
  type: FeedbackType;
  rating: number; // 1-5 scale for most feedback types
  timestamp: string; // ISO string
  context?: FeedbackContext;
  comments?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface FeedbackProcessingResult {
  success: boolean;
  feedbackId: string;
  confidenceScore: number; // 0-1 scale
  processingTimestamp: string;
  error?: string;
  metadata?: {
    processingTime: number;
    contextualFactors: string[];
    appliedWeights: Record<string, number>;
    performanceCompliant: boolean;
  };
}

export interface EnhancedPatternData {
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  averageRating: number;
  confidenceInterval: [number, number];
  correlationFactors: Array<{factor: string; correlation: number; significance: number}>;
  volatilityIndex: number;
  seasonalityPatterns: Array<{period: string; pattern: string}>;
  momentumIndicator: number;
  algorithmConfidence: number;
}

export interface FeedbackPattern {
  id: string;
  exerciseId: string;
  feedbackType: FeedbackType;
  pattern: EnhancedPatternData;
  dataPoints: number;
  lastUpdated: string;
}

export interface FeedbackImpact {
  recommendationId: string;
  originalWeight: number;
  originalReps: number;
  adjustedWeight: number;
  adjustedReps: number;
  confidence: number;
  reasoning: string[];
  feedbackSources: string[]; // Feedback IDs that influenced this change
}

export interface FeedbackPersonalizationState {
  feedbackHistory: FeedbackData[];
  patterns: FeedbackPattern[];
  currentImpacts: FeedbackImpact[];
  settings: FeedbackSettings;
  lastProcessed: string;
}

export interface FeedbackSettings {
  confidenceThreshold: number; // Minimum confidence to apply feedback
  maxHistorySize: number; // Maximum feedback items to keep in memory
  patternDetectionMinDataPoints: number; // Minimum data points for pattern detection
  overfittingPrevention: {
    maxFeedbackWeightPerExercise: number;
    temporalDecay: number; // How quickly feedback influence decays over time
    diversityThreshold: number; // Prevents overfitting to similar feedback
  };
  privacy: {
    retentionDays: number;
    anonymizationLevel: 'none' | 'basic' | 'full';
    allowPatternSharing: boolean; // Allow patterns to be shared between similar exercises
  };
  visualization: {
    showConfidenceIntervals: boolean;
    showHistoricalTrends: boolean;
    showCorrelationFactors: boolean;
  };
}

export interface FeedbackValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface FeedbackConflictResolution {
  conflictingFeedbacks: string[];
  resolutionStrategy: 'majority_vote' | 'weighted_confidence' | 'recent_priority' | 'manual_review';
  resolvedFeedback: FeedbackData;
  conflictReason: string;
}

export interface SafetyOverrideEvent {
  exerciseId: string;
  painLevel: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}