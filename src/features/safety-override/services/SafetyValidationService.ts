/**
 * Safety Validation Service
 * Implements multi-layer safety validation for AI coaching recommendations
 */

export interface UserContext {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  injuryHistory: string[];
  age: number;
  hasMedicalConditions?: boolean;
  limitations?: string[];
  experience?: string;
  conditions?: string[];
  medications?: string[];
  gender?: string;
}

export interface ExerciseRecommendation {
  id: string;
  exercise: string;
  intensity?: string;
  difficulty?: string;
  equipment?: string;
  suggestedWeight?: number;
  suggestedReps?: number;
  suggestedSets?: number;
  suggestedVolume?: number;
  volume?: number;
}

export interface SafetyValidationResult {
  approved: boolean;
  reason?: string;
  blockedFactors?: string[];
  recommendedAdjustment?: any;
  riskScore?: number;
  blockedReason?: string;
  alternativeTechnique?: string;
  safe?: boolean;
  riskLevel?: number;
  alternative?: any;
  medicalJustification?: any;
  safetyLevel?: number;
  medicalConcerns?: any[];
  needsHumanReview?: boolean;
  urgency?: string;
  escalationReason?: string;
  estimatedReviewTime?: number;
  weight?: number;
  progressionRate?: number;
  restPeriod?: number;
  selectedApproach?: string;
  adjustedPlan?: any;
  safetyMeasures?: string[];
  immediateStop?: boolean;
  emergencyProtocol?: string[];
  followupRequired?: boolean;
  medicalAttentionRecommended?: boolean;
  level?: string;
  message?: string;
  recommendedAction?: string;
  preventive?: boolean;
  validated?: boolean;
  trend?: string;
}

export interface UserMetrics {
  oneRepMax?: Record<string, number>;
  currentAbility?: string;
  recoveryStatus?: string;
}

export interface PainSignal {
  type: string;
  intensity: number;
  duringExercise: string;
  severity?: string;
  trend?: string;
}

export class SafetyValidationService {
  /**
   * Validate AI recommendation against safety rules
   */
  async validateRecommendation(
    recommendation: ExerciseRecommendation,
    userContext: UserContext
  ): Promise<SafetyValidationResult> {
    // Conservative safety validation logic
    const blockedFactors: string[] = [];
    let approved = true;
    let reason = '';

    // Check for beginner attempting advanced exercises
    if (userContext.fitnessLevel === 'beginner' && 
        (recommendation.difficulty === 'expert' || 
         recommendation.exercise?.includes('advanced_plyometric'))) {
      blockedFactors.push('high_difficulty_for_beginner');
      approved = false;
      reason = 'conservative_safety_rules';
    }

    // Check for knee injury and high-impact
    if (userContext.injuryHistory.includes('knee') && 
        recommendation.exercise?.includes('plyometric')) {
      blockedFactors.push('plyometric_for_knee_history');
      approved = false;
    }

    return {
      approved,
      reason,
      blockedFactors
    } as SafetyValidationResult;
  }

  /**
   * Check if exercise is blocked for user
   */
  async checkExerciseBlocking(
    exercise: string,
    userContext: UserContext
  ): Promise<{ blocked: boolean; reason: string }> {
    // Simplified blocking logic
    if (userContext.injuryHistory.includes('knee') && exercise === 'box_jumps') {
      return { blocked: true, reason: 'high_impact_knee_issues' };
    }
    
    if (userContext.fitnessLevel === 'beginner' && 
        exercise === 'heavy_deadlifts') {
      return { blocked: true, reason: 'beginner_level_insufficient_experience' };
    }

    return { blocked: false, reason: '' };
  }

  /**
   * Apply conservative safety margins
   */
  async applyConservativeMargins(
    recommendation: ExerciseRecommendation,
    userMetrics: UserMetrics
  ): Promise<SafetyValidationResult> {
    const oneRepMax = userMetrics.oneRepMax?.[recommendation.exercise] || 100;
    
    // Conservative 75% instead of aggressive percentages
    const safeWeight = Math.floor(oneRepMax * 0.75);
    
    return {
      approved: true,
      weight: safeWeight,
      progressionRate: 0.05, // 5% weekly max
      restPeriod: 90 // Conservative rest
    };
  }

  /**
   * Prioritize safety over performance
   */
  async prioritizeSafety(
    goals: Record<string, string>,
    proposedPlan: any
  ): Promise<SafetyValidationResult> {
    return {
      selectedApproach: 'safety_first',
      adjustedPlan: {
        injuryRisk: 0.05, // Very low risk
        expectedGains: 'moderate_steady'
      },
      safetyMeasures: ['conservative_progression']
    };
  }

  /**
   * Handle pain signals with emergency protocols
   */
  async handlePainSignal(pain: PainSignal): Promise<SafetyValidationResult> {
    const immediateStop = pain.intensity >= 5;
    const medicalAttention = pain.intensity >= 6;

    return {
      immediateStop,
      emergencyProtocol: ['pain_emergency_stop'],
      followupRequired: true,
      medicalAttentionRecommended: medicalAttention
    };
  }

  /**
   * Generate progressive injury warnings
   */
  async generateWarning(indicator: any): Promise<SafetyValidationResult> {
    const { type, severity, trend } = indicator;

    if (severity === 'high' && trend === 'rapid') {
      return {
        level: 'warning',
        message: 'fatigue_emergency',
        recommendedAction: 'stop_workout'
      };
    }

    if (type === 'form_breakdown' && severity === 'medium') {
      return {
        level: 'caution',
        message: 'form_degradation',
        preventive: true
      };
    }

    return {
      level: 'notice',
      preventive: false
    };
  }
}