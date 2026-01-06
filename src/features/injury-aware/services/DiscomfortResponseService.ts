import type { DiscomfortEvent, DiscomfortResponse } from '../types';

export interface DiscomfortResponseAction {
  action: 'stop_exercise' | 'reduce_intensity' | 'suggest_alternative' | 'continue_monitoring';
  reason: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WorkoutModification {
  type: 'intensity' | 'exercise' | 'rest_time' | 'range_of_motion';
  oldValue: any;
  newValue: any;
  reason: string;
}

export class DiscomfortResponseService {
  // Pre-defined response patterns for common discomfort scenarios
  private readonly RESPONSE_PATTERNS = {
    knee_pain: {
      high: {
        action: 'stop_exercise' as const,
        recommendation: 'immediate_rest',
        alternatives: ['seated_exercises', 'upper_body_workout', 'swimming'],
        modifications: ['stop_current_exercise', 'take_5_min_rest']
      },
      medium: {
        action: 'suggest_alternative' as const,
        recommendation: 'reduce_weight_or_range',
        alternatives: ['partial_squats', 'leg_press', 'wall_sits'],
        modifications: ['reduce_weight_by_25%', 'reduce_range_by_30%']
      },
      low: {
        action: 'continue_monitoring' as const,
        recommendation: 'monitor_discomfort',
        alternatives: ['continue_with_caution'],
        modifications: ['monitor_form', 'increase_rest_time']
      }
    },
    back_pain: {
      high: {
        action: 'stop_exercise' as const,
        recommendation: 'immediate_rest',
        alternatives: ['light_cardio', 'stretching', 'core_stabilization'],
        modifications: ['stop_current_exercise', 'avoid_heavy_lifting']
      },
      medium: {
        action: 'suggest_alternative' as const,
        recommendation: 'reduce_intensity',
        alternatives: ['bodyweight_exercises', 'resistance_bands'],
        modifications: ['reduce_weight_by_50%', 'focus_on_core']
      },
      low: {
        action: 'continue_monitoring' as const,
        recommendation: 'monitor_posture',
        alternatives: ['continue_with_caution'],
        modifications: ['check_form', 'reduce_range_slightly']
      }
    },
    shoulder_pain: {
      high: {
        action: 'stop_exercise' as const,
        recommendation: 'immediate_rest',
        alternatives: ['lower_body_focus', 'core_exercises', 'cardio'],
        modifications: ['stop_overhead_movements', 'avoid_pressing']
      },
      medium: {
        action: 'suggest_alternative' as const,
        recommendation: 'modify_exercise',
        alternatives: ['lateral_raises', 'front_raises', 'resistance_bands'],
        modifications: ['avoid_overhead', 'reduce_weight_by_40%']
      },
      low: {
        action: 'continue_monitoring' as const,
        recommendation: 'monitor_shoulder_position',
        alternatives: ['continue_with_caution'],
        modifications: ['check_rotator_cuff_form', 'reduce_range']
      }
    }
  } as const;

  /**
   * Generate immediate response for discomfort event
   */
  async generateResponse(discomfortEvent: DiscomfortEvent): Promise<DiscomfortResponse> {
    const { severity, location, exercise, triggers = [] } = discomfortEvent;

    // Determine response pattern based on location and severity
    const patternKey = this.getPatternKey(location);
    const severityLevel = this.getSeverityLevel(severity);
    const pattern = this.getResponsePattern(patternKey, severityLevel);

    // Generate workout modifications
    const modifications = await this.generateWorkoutModifications(discomfortEvent, pattern);

    // Create comprehensive response
    const response: DiscomfortResponse = {
      adaptationRequired: pattern.action !== 'continue_monitoring',
      recommendedActions: [
        ...pattern.modifications,
        ...pattern.alternatives.map(alt => `consider_${alt}`)
      ],
      modifications: {
        reduceIntensity: severity >= 3,
        alternativeExercise: pattern.alternatives[0] || undefined,
        restTime: severity >= 4 ? 300 : severity >= 3 ? 180 : 60, // 5min, 3min, 1min
        modifications: [...pattern.modifications]
      }
    };

    return response;
  }

  /**
   * Generate specific workout modifications based on discomfort
   */
  async generateWorkoutModifications(
    discomfortEvent: DiscomfortEvent,
    pattern: any
  ): Promise<WorkoutModification[]> {
    const modifications: WorkoutModification[] = [];
    const { severity, exercise } = discomfortEvent;

    // Intensity modifications
    if (severity >= 3) {
      const reductionPercent = severity >= 4 ? 0.5 : 0.25;
      modifications.push({
        type: 'intensity',
        oldValue: 'current',
        newValue: `reduce_by_${reductionPercent * 100}%`,
        reason: `${severity >= 4 ? 'Severe' : 'Moderate'} discomfort detected`
      });
    }

    // Exercise modifications
    if (pattern.action === 'suggest_alternative' && pattern.alternatives.length > 0) {
      modifications.push({
        type: 'exercise',
        oldValue: exercise || 'current_exercise',
        newValue: pattern.alternatives[0],
        reason: `Safer alternative for ${discomfortEvent.location} discomfort`
      });
    }

    // Rest time modifications
    if (severity >= 2) {
      const additionalRest = severity >= 4 ? 180 : severity >= 3 ? 60 : 30;
      modifications.push({
        type: 'rest_time',
        oldValue: 'current',
        newValue: `increase_by_${additionalRest}s`,
        reason: `Allow recovery for ${discomfortEvent.location} discomfort`
      });
    }

    // Range of motion modifications
    if (severity >= 3 && discomfortEvent.location.toLowerCase().includes('knee')) {
      modifications.push({
        type: 'range_of_motion',
        oldValue: 'full_range',
        newValue: 'reduced_range_70%',
        reason: 'Reduce knee stress during discomfort'
      });
    }

    return modifications;
  }

  /**
   * Get immediate action for severe discomfort (500ms requirement)
   */
  getImmediateResponse(discomfortEvent: DiscomfortEvent): DiscomfortResponseAction {
    const { severity, location } = discomfortEvent;

    if (severity >= 4) {
      return {
        action: 'stop_exercise',
        reason: 'high_severity_discomfort',
        recommendation: 'immediate_rest',
        severity: 'high'
      };
    }

    if (severity >= 3) {
      return {
        action: 'reduce_intensity',
        reason: 'moderate_discomfort',
        recommendation: 'reduce_weight_or_range',
        severity: 'medium'
      };
    }

    return {
      action: 'continue_monitoring',
      reason: 'mild_discomfort',
      recommendation: 'monitor_and_adjust',
      severity: 'low'
    };
  }

  /**
   * Suggest exercises alternatives based on discomfort
   */
  async suggestAlternatives(
    currentExercise: string,
    discomfortLocation: string,
    severity: number
  ): Promise<string[]> {
    const patternKey = this.getPatternKey(discomfortLocation);
    const severityLevel = this.getSeverityLevel(severity);
    const pattern = this.getResponsePattern(patternKey, severityLevel);

    return [...pattern.alternatives];
  }

  /**
   * Analyze if modifications are helping based on subsequent discomfort reports
   */
  analyzeModificationEffectiveness(
    originalDiscomfort: DiscomfortEvent,
    subsequentDiscomforts: DiscomfortEvent[]
  ): {
    effective: boolean;
    improvementRate: number;
    recommendations: string[];
  } {
    if (subsequentDiscomforts.length === 0) {
      return {
        effective: true,
        improvementRate: 100,
        recommendations: ['continue_modifications']
      };
    }

    // Calculate average severity reduction
    const avgOriginalSeverity = originalDiscomfort.severity;
    const avgSubsequentSeverity = subsequentDiscomforts.reduce(
      (sum, event) => sum + event.severity, 0
    ) / subsequentDiscomforts.length;

    const improvementRate = Math.max(0, 
      ((avgOriginalSeverity - avgSubsequentSeverity) / avgOriginalSeverity) * 100
    );

    const effective = improvementRate >= 50; // 50% improvement threshold
    const recommendations: string[] = [];

    if (effective) {
      recommendations.push('modifications_helpful');
      if (improvementRate >= 80) {
        recommendations.push('significant_improvement');
      }
    } else {
      recommendations.push('consider_different_approach');
      if (subsequentDiscomforts.some(d => d.severity >= originalDiscomfort.severity)) {
        recommendations.push('modifications_insufficient');
        recommendations.push('consider_exercise_change');
      }
    }

    return {
      effective,
      improvementRate,
      recommendations
    };
  }

  /**
   * Get pattern key from discomfort location
   */
  private getPatternKey(location: string): keyof typeof this.RESPONSE_PATTERNS {
    const normalizedLocation = location.toLowerCase();
    
    if (normalizedLocation.includes('knee')) return 'knee_pain';
    if (normalizedLocation.includes('back')) return 'back_pain';
    if (normalizedLocation.includes('shoulder')) return 'shoulder_pain';
    
    // Default to knee pain pattern for unspecified locations
    return 'knee_pain';
  }

  /**
   * Get severity level from numeric severity
   */
  private getSeverityLevel(severity: number): 'high' | 'medium' | 'low' {
    if (severity >= 4) return 'high';
    if (severity >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get response pattern for location and severity
   */
  private getResponsePattern(
    patternKey: keyof typeof this.RESPONSE_PATTERNS,
    severityLevel: 'high' | 'medium' | 'low'
  ) {
    const patterns = this.RESPONSE_PATTERNS[patternKey];
    if (!patterns) {
      // Fallback to knee pain pattern
      return this.RESPONSE_PATTERNS.knee_pain[severityLevel];
    }
    return patterns[severityLevel];
  }

  /**
   * Generate progressive adaptation plan for chronic discomfort
   */
  generateProgressivePlan(
    discomfortHistory: DiscomfortEvent[],
    location: string
  ): {
    phases: Array<{
      phase: string;
      duration: number; // days
      modifications: string[];
      goals: string[];
    }>;
    timeline: string;
  } {
    const locationEvents = discomfortHistory.filter(event => 
      event.location.toLowerCase().includes(location.toLowerCase())
    );

    const avgSeverity = locationEvents.reduce((sum, event) => sum + event.severity, 0) / locationEvents.length;
    const frequency = locationEvents.length;

    const phases: Array<{
      phase: string;
      duration: number;
      modifications: string[];
      goals: string[];
    }> = [];

    // Phase 1: Immediate recovery (if high severity)
    if (avgSeverity >= 3) {
      phases.push({
        phase: 'Recovery',
        duration: 7,
        modifications: [
          'stop_offending_exercises',
          'light_cardio_only',
          'stretching_and_mobility'
        ],
        goals: [
          'reduce_inflammation',
          'maintain_mobility',
          'prevent_deconditioning'
        ]
      });
    }

    // Phase 2: Gradual reintroduction
    phases.push({
      phase: 'Reintroduction',
      duration: 14,
      modifications: [
        'bodyweight_exercises',
        'reduced_intensity_50%',
        'focus_on_form',
        'increase_rest_periods'
      ],
      goals: [
        'rebuild_strength_safely',
        'assess_tolerance',
        'establish_safe_movement_patterns'
      ]
    });

    // Phase 3: Progressive loading
    phases.push({
      phase: 'Progression',
      duration: 21,
      modifications: [
        'gradual_intensity_increase',
        'introduce_resistance',
        'monitor_discomfort_response',
        'modify_based_on_feedback'
      ],
      goals: [
        'return_to_baseline_strength',
        'establish_new_limits',
        'build_confidence'
      ]
    });

    const totalDays = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const timeline = `Approximately ${Math.ceil(totalDays / 7)} weeks for full recovery and return to normal training`;

    return { phases, timeline };
  }
}