import type {
  AIRecommendation,
  InjuryConstraints,
  FilteredRecommendations
} from '../types';

export interface FilterResult extends FilteredRecommendations {
  suggestions: string[];
  modified: AIRecommendation[];
  appliedConservativeDefaults: boolean;
}

export interface AIServiceInterface {
  generateRecommendations(): Promise<AIRecommendation[]>;
}

export class InjuryFilterService {
  // Performance optimization: cache for filtering results
  private filterCache = new Map<string, { result: FilterResult; timestamp: number }>();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  // Conservative safety defaults by safety level
  private readonly SAFETY_DEFAULTS = {
    normal: {
      intensityReduction: 0,
      restTimeIncrease: 0,
      blockThreshold: 'high' as const
    },
    conservative: {
      intensityReduction: 1, // Reduce by one level
      restTimeIncrease: 15, // Add 15 seconds
      blockThreshold: 'medium' as const
    },
    restricted: {
      intensityReduction: 2, // Reduce by two levels
      restTimeIncrease: 30, // Add 30 seconds
      blockThreshold: 'low' as const
    }
  } as const;

  // Injury-risk exercise mappings
  private readonly HIGH_RISK_EXERCISES = {
    knee: ['deep_squats', 'jumping', 'lunges', 'running'],
    shoulder: ['overhead_press', 'pull_ups', 'lateral_raises'],
    back: ['deadlifts', 'heavy_squats', 'bent_over_rows'],
    ankle: ['jumping', 'running', 'box_jumps']
  } as const;

  /**
   * Filter AI recommendations against injury constraints
   */
  async filterRecommendations(
    recommendations: AIRecommendation[],
    constraints: InjuryConstraints
  ): Promise<FilterResult> {
    const startTime = Date.now();
    
    // Generate cache key
    const cacheKey = this.generateFilterCacheKey(recommendations, constraints);
    
    // Check cache first
    const cached = this.filterCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.result;
    }

    const result: FilterResult = {
      filtered: [],
      blocked: [],
      suggestions: [...constraints.recommendedAlternatives],
      modified: [],
      appliedConservativeDefaults: false
    };

    // Apply conservative defaults based on safety level
    const modifiedRecommendations = await this.applyConservativeDefaults(recommendations, constraints);
    result.appliedConservativeDefaults = modifiedRecommendations.some((rec, index) => 
      rec.intensity !== recommendations[index].intensity || 
      rec.restTime !== recommendations[index].restTime
    );

    for (const recommendation of modifiedRecommendations) {
      const filterDecision = this.shouldFilterRecommendation(recommendation, constraints);
      
      if (filterDecision.shouldBlock) {
        result.blocked.push({
          recommendation,
          reason: filterDecision.reason,
          severity: filterDecision.severity
        });
      } else {
        result.filtered.push(recommendation);
        if (filterDecision.wasModified) {
          result.modified.push(recommendation);
        }
      }
    }

    // Cache the result
    this.filterCache.set(cacheKey, { result, timestamp: Date.now() });

    const processingTime = Date.now() - startTime;
    if (processingTime > 2000) {
      console.warn(`Injury filtering time ${processingTime}ms exceeds 2-second requirement`);
    }

    return result;
  }

  /**
   * Apply conservative safety defaults to recommendations
   */
  async applyConservativeDefaults(
    recommendations: AIRecommendation[],
    constraints: InjuryConstraints
  ): Promise<AIRecommendation[]> {
    const safetyDefaults = this.SAFETY_DEFAULTS[constraints.safetyLevel];
    
    return recommendations.map(rec => {
      const modified = { ...rec };
      
      // Reduce intensity based on safety level
      if (safetyDefaults.intensityReduction > 0) {
        modified.intensity = this.reduceIntensity(rec.intensity, safetyDefaults.intensityReduction);
      }
      
      // Increase rest time for safety
      if (safetyDefaults.restTimeIncrease > 0) {
        modified.restTime = (rec.restTime || 60) + safetyDefaults.restTimeIncrease;
      }
      
      return modified;
    });
  }

  /**
   * Filter recommendations from AI service
   */
  async filterAIRecommendations(
    aiService: AIServiceInterface,
    constraints: InjuryConstraints
  ): Promise<FilterResult> {
    const recommendations = await aiService.generateRecommendations();
    return this.filterRecommendations(recommendations, constraints);
  }

  /**
   * Determine if a recommendation should be filtered
   */
  private shouldFilterRecommendation(
    recommendation: AIRecommendation,
    constraints: InjuryConstraints
  ): {
    shouldBlock: boolean;
    reason: string;
    severity: 'low' | 'medium' | 'high';
    wasModified: boolean;
  } {
    const exerciseName = recommendation.exercise.toLowerCase();
    const variation = recommendation.variation.toLowerCase();

    // Check against blocked movements
    for (const blockedMovement of constraints.blockedMovements) {
      if (this.matchesExercise(exerciseName, variation, blockedMovement)) {
        return {
          shouldBlock: true,
          reason: `Exercise conflicts with injury restriction: ${blockedMovement}`,
          severity: 'high',
          wasModified: false
        };
      }
    }

    // Check against constraints
    for (const constraint of constraints.constraints) {
      if (this.matchesConstraint(exerciseName, variation, constraint)) {
        return {
          shouldBlock: true,
          reason: `Blocked by injury constraint: ${constraint}`,
          severity: this.getConstraintSeverity(constraint),
          wasModified: false
        };
      }
    }

    // Apply safety level filtering
    const safetyDefaults = this.SAFETY_DEFAULTS[constraints.safetyLevel];
    if (this.isHighRiskExercise(exerciseName) && 
        constraints.safetyLevel !== 'normal') {
      return {
        shouldBlock: true,
        reason: `High-risk exercise blocked for ${constraints.safetyLevel} safety level`,
        severity: constraints.safetyLevel === 'restricted' ? 'high' : 'medium',
        wasModified: false
      };
    }

    return {
      shouldBlock: false,
      reason: '',
      severity: 'low',
      wasModified: false
    };
  }

  /**
   * Check if exercise matches a blocked movement
   */
  private matchesExercise(exercise: string, variation: string, blocked: string): boolean {
    const blockedLower = blocked.toLowerCase();
    return exercise.includes(blockedLower) || variation.includes(blockedLower);
  }

  /**
   * Check if exercise matches a constraint
   */
  private matchesConstraint(exercise: string, variation: string, constraint: string): boolean {
    const constraintMappings: Record<string, string[]> = {
      'no_deep_squats': ['deep_squat', 'full_squat'],
      'no_high_impact': ['jump', 'run', 'plyometric', 'burpee'],
      'no_overhead_press': ['overhead_press', 'shoulder_press'],
      'no_heavy_lifting': ['deadlift', 'heavy'],
      'no_jumping': ['jump', 'hop', 'box_jump']
    };

    const patterns = constraintMappings[constraint] || [];
    return patterns.some(pattern => 
      exercise.includes(pattern) || variation.includes(pattern)
    );
  }

  /**
   * Get severity level for constraint
   */
  private getConstraintSeverity(constraint: string): 'low' | 'medium' | 'high' {
    const highSeverity = ['no_high_impact', 'no_heavy_lifting'];
    const mediumSeverity = ['no_deep_squats', 'no_overhead_press'];
    
    if (highSeverity.includes(constraint)) {
      return 'high';
    } else if (mediumSeverity.includes(constraint)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Check if exercise is high risk
   */
  private isHighRiskExercise(exercise: string): boolean {
    return Object.values(this.HIGH_RISK_EXERCISES)
      .flat()
      .some(risk => exercise.includes(risk.toLowerCase()));
  }

  /**
   * Reduce intensity level
   */
  private reduceIntensity(
    currentIntensity: 'low' | 'moderate' | 'high',
    reduction: number
  ): 'low' | 'moderate' | 'high' {
    const levels = ['low', 'moderate', 'high'] as const;
    const currentIndex = levels.indexOf(currentIntensity);
    const newIndex = Math.max(0, currentIndex - reduction);
    return levels[newIndex];
  }

  /**
   * Generate cache key for filtering
   */
  private generateFilterCacheKey(
    recommendations: AIRecommendation[],
    constraints: InjuryConstraints
  ): string {
    return JSON.stringify({
      recommendations: recommendations.map(r => ({
        exercise: r.exercise,
        variation: r.variation,
        intensity: r.intensity
      })),
      constraints: {
        safetyLevel: constraints.safetyLevel,
        constraints: constraints.constraints.sort(),
        blockedMovements: constraints.blockedMovements.sort()
      }
    });
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(cached: { result: FilterResult; timestamp: number }): boolean {
    return (Date.now() - cached.timestamp) < this.CACHE_EXPIRY_MS;
  }

  /**
   * Clear filter cache
   */
  clearFilterCache(): void {
    this.filterCache.clear();
  }

  /**
   * Get filter statistics
   */
  getFilterStatistics(): {
    cacheSize: number;
    totalFiltered: number;
    totalBlocked: number;
    blockRate: number;
  } {
    const totalFiltered = Array.from(this.filterCache.values())
      .reduce((sum, cached) => sum + cached.result.filtered.length, 0);
    const totalBlocked = Array.from(this.filterCache.values())
      .reduce((sum, cached) => sum + cached.result.blocked.length, 0);
    const total = totalFiltered + totalBlocked;
    
    return {
      cacheSize: this.filterCache.size,
      totalFiltered,
      totalBlocked,
      blockRate: total > 0 ? totalBlocked / total : 0
    };
  }

  /**
   * Validate constraints are properly formatted
   */
  validateConstraints(constraints: InjuryConstraints): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!constraints || typeof constraints !== 'object') {
      errors.push('Constraints must be an object');
      return { isValid: false, errors };
    }
    
    if (!['normal', 'conservative', 'restricted'].includes(constraints.safetyLevel)) {
      errors.push('Invalid safety level');
    }
    
    if (!Array.isArray(constraints.constraints)) {
      errors.push('Constraints must be an array');
    }
    
    if (!Array.isArray(constraints.blockedMovements)) {
      errors.push('Blocked movements must be an array');
    }
    
    if (!Array.isArray(constraints.recommendedAlternatives)) {
      errors.push('Recommended alternatives must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}