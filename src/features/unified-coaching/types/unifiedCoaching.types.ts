/**
 * Unified Coaching Types
 * Type definitions for AI coaching orchestration system
 */

export enum CoachingPriority {
  SAFETY = 'safety',
  INJURY = 'injury', 
  FORM = 'form',
  ADAPTATION = 'adaptation',
  ENCOURAGEMENT = 'encouragement'
}

export enum AdaptationTrigger {
  FATIGUE = 'fatigue',
  TIME_CONSTRAINT = 'time_constraint',
  ENERGY_LOW = 'energy_low',
  FORM_BREAKDOWN = 'form_breakdown',
  PERFORMANCE_DROP = 'performance_drop',
  DISCOMFORT = 'discomfort'
}

export interface AISystemResponse {
  type: string;
  confidence: number;
  recommendation: any;
  reasoning: string;
  timestamp: number;
  metadata?: {
    conflictsResolved?: number;
    conflictStrategy?: string;
    [key: string]: any;
  };
}

export interface AICoachingInput {
  system: string;
  priority: CoachingPriority;
  response: AISystemResponse;
}

export interface CoachingConflict {
  severity: 'high' | 'medium' | 'low';
  conflictingSystems: string[];
  primarySystem: string;
  conflictingSystem: string;
  description: string;
  resolution: string;
}

export interface CoachingContribution {
  system: string;
  priority: CoachingPriority;
  response: AISystemResponse;
  wasConflicted: boolean;
}

export interface ConflictResolution {
  strategy: string;
  conflicts: CoachingConflict[];
  reasoning: string;
}

export interface CoachingDecisionMetadata {
  processingTime: number;
  systemsConsidered: number;
  conflictsResolved: number;
  priorityUsed: CoachingPriority;
  timestamp: number;
  error?: string;
}

export interface CoachingDecision {
  system: string;
  priority: CoachingPriority;
  response: AISystemResponse;
  contributingSystems: CoachingContribution[];
  conflictResolution: ConflictResolution | null;
  metadata: CoachingDecisionMetadata;
}

export interface UnifiedCoachingState {
  currentDecision: CoachingDecision | null;
  coachingHistory: CoachingDecision[];
  isActive: boolean;
  sessionStartTime: number | null;
  totalProcessingTime: number;
  averageProcessingTime: number;
  conflictCount: number;
  lastUpdated: number | null;
}

// Coaching Intelligence Types
export interface UserCoachingPreferences {
  safetyLevel: 'conservative' | 'moderate' | 'aggressive';
  communicationStyle: 'minimal' | 'balanced' | 'detailed' | 'encouraging';
  enableAdaptiveCoaching: boolean;
  enableFormCorrection: boolean;
  enableInjuryPrevention: boolean;
  privacyMode: 'standard' | 'enhanced';
  feedbackFrequency: 'minimal' | 'normal' | 'frequent';
  intensityPreference?: 'low' | 'moderate' | 'high';
  lastUpdated: number;
  active: boolean;
}

export interface CoachingStyleProfile {
  communicationStyle: 'minimal' | 'balanced' | 'detailed' | 'encouraging';
  intensityPreference?: 'low' | 'moderate' | 'high';
  feedbackFrequency: 'minimal' | 'normal' | 'frequent';
  adaptationSpeed: 'slow' | 'moderate' | 'fast';
  communicationStyleWeights: Record<string, number>;
  learningRate: number;
  version: number;
  lastUpdated: number;
}

export interface CoachingFeedback {
  id: string;
  decisionId?: string;
  decisionContext?: {
    priority: CoachingPriority;
    responseType: string;
    action: string;
  };
  rating: number; // 1-5 scale
  helpful: boolean;
  communicationStyleFeedback?: {
    preferred: 'minimal' | 'balanced' | 'detailed' | 'encouraging';
    reason?: string;
  };
  intensityFeedback?: {
    preferred: 'low' | 'moderate' | 'high';
    reason?: string;
  };
  suggestedModification?: any;
  timestamp: number;
  userNotes?: string;
}

export interface AdaptationPattern {
  id: string;
  priority: CoachingPriority;
  responseType: string;
  modification: any;
  successRate: number;
  confidence: number;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
}

export interface CoachingIntelligenceState {
  userPreferences: UserCoachingPreferences;
  styleProfile: CoachingStyleProfile;
  adaptationPatterns: AdaptationPattern[];
  feedbackHistory?: CoachingFeedback[];
  version: number;
  lastSaved?: number;
}

// Mock types for existing slices (to be replaced with actual imports)
export interface LiveSessionState {
  isActive: boolean;
  currentAdaptation?: any;
  confidence?: number;
}

export interface FormCorrectionState {
  isActive: boolean;
  currentCorrection?: any;
  confidence?: number;
}

export interface SafetyOverrideState {
  isActive: boolean;
  overrideAction?: any;
}

export interface InjuryAwareState {
  isActive: boolean;
  currentRecommendation?: any;
  confidence?: number;
}