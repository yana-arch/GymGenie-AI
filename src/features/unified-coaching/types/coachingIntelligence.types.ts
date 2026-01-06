/**
 * Coaching Intelligence Types
 * Type definitions for enhanced coaching with user learning and preferences
 */

import {
  CoachingDecision,
  CoachingPriority,
  AISystemResponse,
  AICoachingInput,
  UnifiedCoachingState
} from './unifiedCoaching.types';

/**
 * User coaching style preferences
 */
export interface CoachingStylePreferences {
  // Communication style preferences
  communicationFrequency: 'minimal' | 'moderate' | 'frequent';
  communicationTone: 'professional' | 'encouraging' | 'motivational' | 'technical';
  feedbackStyle: 'direct' | 'gentle' | 'detailed' | 'summary' | 'balanced';

  // Coaching focus preferences
  primaryFocus: CoachingPriority | 'balanced';
  secondaryFocus?: CoachingPriority;
  adaptSpeed: 'conservative' | 'moderate' | 'aggressive';

  // Learning preferences
  explanationLevel: 'basic' | 'intermediate' | 'advanced';
  correctionPromptness: 'immediate' | 'delayed' | 'batched';
  adaptationTolerance: 'low' | 'medium' | 'high';

  // Session preferences
  maxRecommendationsPerSession: number;
  allowConcurrentRecommendations: boolean;
  preferredCoachingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

/**
 * User interaction patterns and learning data
 */
export interface UserLearningProfile {
  // Response patterns
  responseRate: {
    overall: number; // percentage of recommendations acted upon
    byPriority: Record<CoachingPriority, number>;
    byType: Record<string, number>;
  };

  // Response timing
  averageResponseTime: number; // milliseconds
  responseTimeDistribution: {
    fast: number; // < 5 seconds
    medium: number; // 5-30 seconds
    slow: number; // > 30 seconds
  };

  // Preference evolution
  preferredCoachingTimes: number[]; // timestamps when user most responsive
  coachingEffectiveness: {
    byTimeOfDay: Record<string, number>;
    bySessionPhase: Record<string, number>;
  };

  // Learning patterns
  adaptationRate: number; // how quickly user adapts to coaching
  correctionAcceptance: number; // percentage of form corrections accepted
  confusionEvents: number; // number of times user seemed confused

  // Historical trends
  trendData: {
    engagementLevel: number[]; // over last N sessions
    complianceRate: number[];   // over last N sessions
    satisfactionScore: number[]; // implicit satisfaction metrics
  };
}

/**
 * Enhanced coaching decision with intelligence
 */
export interface EnhancedCoachingDecision extends CoachingDecision {
  // Intelligence metadata
  intelligence: {
    userProfileApplied: boolean;
    adaptedRecommendation: boolean;
    personalizationLevel: number; // 0-1 scale
    confidenceAdjustment: number; // +/- adjustment based on user history
    predictedAcceptance: number; // likelihood user will accept recommendation
    optimalTiming: number; // best time to present this recommendation
    learningSignals: LearningSignal[];
  };

  // Adapted content
  adaptedContent?: {
    personalizedMessage: string;
    tailoredExplanation: string;
    contextualMotivation: string;
    alternativeOptions: string[];
  };

  // Long-term learning impact
  learningImpact: {
    skillProgression: string[];
    adaptationComplexity: number;
    retentionPrediction: number;
  };
}

/**
 * Learning signals from user interactions
 */
export interface LearningSignal {
  type: 'acceptance' | 'rejection' | 'delay' | 'confusion' | 'satisfaction';
  timestamp: number;
  context: {
    recommendationType: string;
    priority: CoachingPriority;
    system: string;
  };
  strength: number; // 0-1 confidence in signal
  metadata?: Record<string, any>;
}

/**
 * Coaching intelligence storage interface
 */
export interface CoachingIntelligenceStorage {
  // User preferences
  preferences: CoachingStylePreferences;
  
  // Learning profile
  learningProfile: UserLearningProfile;
  
  // Intelligence metadata
  metadata: {
    lastUpdated: number;
    dataPoints: number;
    privacyLevel: 'local' | 'encrypted' | 'cloud';
    version: string;
  };

  // Learning history (limited, privacy-preserving)
  learningHistory: {
    sessionSummaries: SessionLearningSummary[];
    adaptationHistory: AdaptationRecord[];
    preferenceChanges: PreferenceChange[];
  };
}

/**
 * Session learning summary
 */
export interface SessionLearningSummary {
  sessionId: string;
  timestamp: number;
  duration: number;
  recommendationsPresented: number;
  recommendationsAccepted: number;
  averageResponseTime: number;
  satisfactionIndicators: number;
  keyLearnings: string[];
  preferenceShifts: Partial<CoachingStylePreferences>;
}

/**
 * Adaptation record
 */
export interface AdaptationRecord {
  timestamp: number;
  trigger: AICoachingInput | string;
  adaptation: {
    type: string;
    magnitude: number;
    effectiveness: number;
    retentionDuration: number;
  };
  context: {
    sessionPhase: string;
    userState: string;
    environmentalFactors: string[];
  };
}

/**
 * Preference change record
 */
export interface PreferenceChange {
  timestamp: number;
  changeType: 'explicit' | 'learned' | 'adapted';
  field: keyof CoachingStylePreferences;
  oldValue: any;
  newValue: any;
  confidence: number;
  reason: string;
}

/**
 * Privacy-preserving data config
 */
export interface PrivacyConfig {
  encryptionEnabled: boolean;
  dataRetentionDays: number;
  anonymizationLevel: 'none' | 'partial' | 'full';
  sharingConsent: {
    analytics: boolean;
    improvement: boolean;
    research: boolean;
  };
  sensitiveDataFields: string[];
}

/**
 * Coaching intelligence service configuration
 */
export interface CoachingIntelligenceConfig {
  storage: PrivacyConfig;
  learning: {
    adaptationRate: number; // how quickly to adapt to user patterns
    confidenceThreshold: number; // minimum confidence for adaptations
    historyWeight: number; // how much to weight historical data
    explorationRate: number; // how much to explore new recommendations
  };
  performance: {
    maxCacheSize: number;
    processingTimeoutMs: number;
    batchSize: number;
  };
}

/**
 * Extended coaching input with user context
 */
export interface EnhancedAICoachingInput extends AICoachingInput {
  userContext: {
    currentMood?: 'energetic' | 'fatigued' | 'focused' | 'distracted';
    sessionPhase: 'warmup' | 'main' | 'cooldown' | 'recovery';
    recentPerformance: number; // -1 to 1 scale
    complianceHistory: number; // 0-1 scale
  };
  timing: {
    optimalDeliveryTime: number;
    urgency: number; // 0-1 scale
    persistence: number; // how long to keep trying
  };
}

/**
 * Intelligence metrics
 */
export interface IntelligenceMetrics {
  // Learning effectiveness
  adaptationAccuracy: number;
  userSatisfactionScore: number;
  predictionAccuracy: number;
  personalizationEffectiveness: number;

  // System performance
  processingTimeOverhead: number;
  storageEfficiency: number;
  privacyCompliance: number;

  // User engagement
  engagementRate: number;
  retentionRate: number;
  improvementRate: number;
}

/**
 * Default coaching preferences
 */
export const DEFAULT_COACHING_PREFERENCES: CoachingStylePreferences = {
  communicationFrequency: 'moderate',
  communicationTone: 'encouraging',
  feedbackStyle: 'balanced',
  primaryFocus: 'balanced',
  adaptSpeed: 'moderate',
  explanationLevel: 'intermediate',
  correctionPromptness: 'immediate',
  adaptationTolerance: 'medium',
  maxRecommendationsPerSession: 5,
  allowConcurrentRecommendations: false,
  preferredCoachingHours: {
    start: '06:00',
    end: '22:00'
  }
};

/**
 * Default learning profile
 */
export const DEFAULT_LEARNING_PROFILE: UserLearningProfile = {
  responseRate: {
    overall: 0.7,
    byPriority: {
      [CoachingPriority.SAFETY]: 0.95,
      [CoachingPriority.INJURY]: 0.9,
      [CoachingPriority.FORM]: 0.75,
      [CoachingPriority.ADAPTATION]: 0.6
    },
    byType: {}
  },
  averageResponseTime: 15000,
  responseTimeDistribution: {
    fast: 0.3,
    medium: 0.5,
    slow: 0.2
  },
  preferredCoachingTimes: [],
  coachingEffectiveness: {
    byTimeOfDay: {},
    bySessionPhase: {}
  },
  adaptationRate: 0.5,
  correctionAcceptance: 0.8,
  confusionEvents: 0,
  trendData: {
    engagementLevel: [],
    complianceRate: [],
    satisfactionScore: []
  }
};