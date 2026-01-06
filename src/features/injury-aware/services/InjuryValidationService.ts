import type {
  InjuryHistory,
  InjuryConstraints,
  AIRecommendation,
  FilteredRecommendations,
  ValidationResult
} from '../types';

export class InjuryValidationService {
  private readonly STORAGE_KEY = 'injury-history';
  
  // Performance optimization: cache constraint generation results
  private constraintCache = new Map<string, InjuryConstraints>();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  // Pre-defined constraint mappings for performance
  private readonly INJURY_CONSTRAINTS = {
    knee: {
      constraints: ['no_high_impact', 'no_deep_squats'],
      blockedMovements: ['jumping', 'deep_squats', 'lunges'],
      alternatives: ['seated_exercises', 'upper_body_focus']
    },
    shoulder: {
      constraints: ['no_overhead_press'],
      blockedMovements: ['overhead_press', 'pull_ups'],
      alternatives: ['lower_body_focus', 'core_exercises']
    },
    back: {
      constraints: ['no_heavy_lifting'],
      blockedMovements: ['deadlifts', 'heavy_squats'],
      alternatives: ['swimming', 'light_cardio']
    },
    ankle: {
      constraints: ['no_jumping'],
      blockedMovements: ['jumping', 'running'],
      alternatives: ['seated_cardio', 'upper_body_workout']
    }
  } as const;

  // Pre-defined constraint matching for performance
  private readonly CONSTRAINT_PATTERNS = {
    'no_high_impact': ['jump', 'run', 'plyometric'],
    'no_deep_squats': ['squat', 'squad'],
    'no_overhead_press': ['overhead', 'press', 'shoulder'],
    'no_heavy_lifting': ['deadlift', 'heavy'],
    'no_jumping': ['jump', 'hop']
  } as const;

  /**
   * Validate injury history and generate constraints with caching
   */
  async validateInjuryConstraints(injuryHistory: InjuryHistory): Promise<ValidationResult> {
    const startTime = Date.now();

    // Validate input structure
    if (!this.isValidInjuryHistory(injuryHistory)) {
      throw new Error('Invalid injury data');
    }

    // Generate cache key based on injury history
    const cacheKey = this.generateCacheKey(injuryHistory);
    
    // Check cache first for performance
    const cachedConstraints = this.constraintCache.get(cacheKey);
    if (cachedConstraints) {
      const processingTime = Date.now() - startTime;
      return {
        isValid: true,
        constraints: cachedConstraints,
        processingTime
      };
    }

    // Generate new constraints
    const constraints = this.generateConstraints(injuryHistory);
    
    // Cache the result
    this.constraintCache.set(cacheKey, constraints);
    
    // Clear old cache entries periodically
    this.cleanupCache();

    const processingTime = Date.now() - startTime;

    return {
      isValid: true,
      constraints,
      processingTime
    };
  }

  /**
   * Filter AI recommendations against injury constraints
   */
  async filterRecommendations(
    recommendations: AIRecommendation[],
    constraints: string[]
  ): Promise<FilteredRecommendations> {
    const filtered: AIRecommendation[] = [];
    const blocked: Array<{
      recommendation: AIRecommendation;
      reason: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const recommendation of recommendations) {
      const blockReason = this.shouldBlockRecommendation(recommendation, constraints);
      
      if (blockReason) {
        blocked.push({
          recommendation,
          reason: blockReason.reason,
          severity: blockReason.severity
        });
      } else {
        filtered.push(recommendation);
      }
    }

    return { filtered, blocked };
  }

  /**
   * Store injury history locally
   */
  async storeInjuryHistory(injuryHistory: InjuryHistory): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(injuryHistory));
    } catch (error) {
      // Handle storage errors gracefully
      console.error('Failed to store injury history:', error);
      throw new Error('Failed to store injury history');
    }
  }

  /**
   * Load injury history from local storage
   */
  async loadInjuryHistory(): Promise<InjuryHistory> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { injuries: [] };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load injury history:', error);
      return { injuries: [] };
    }
  }

  /**
   * Validate injury history structure
   */
  private isValidInjuryHistory(history: any): history is InjuryHistory {
    if (!history || typeof history !== 'object') {
      return false;
    }

    if (!Array.isArray(history.injuries)) {
      return false;
    }

    return history.injuries.every((injury: any) => {
      return (
        typeof injury.id === 'string' &&
        typeof injury.type === 'string' &&
        typeof injury.location === 'string' &&
        typeof injury.severity === 'string' &&
        typeof injury.date === 'string' &&
        typeof injury.status === 'string' &&
        Array.isArray(injury.restrictions)
      );
    });
  }

  /**
   * Generate injury constraints from injury history (optimized version)
   */
  private generateConstraints(injuryHistory: InjuryHistory): InjuryConstraints {
    const constraints = new Set<string>();
    const blockedMovements = new Set<string>();
    const recommendedAlternatives = new Set<string>();
    let safetyLevel: 'normal' | 'conservative' | 'restricted' = 'normal';

    // Process each injury
    for (const injury of injuryHistory.injuries) {
      const injuryConfig = this.INJURY_CONSTRAINTS[injury.type];
      
      if (injuryConfig) {
        // Add pre-defined constraints for better performance
        injuryConfig.constraints.forEach(constraint => constraints.add(constraint));
        injuryConfig.blockedMovements.forEach(movement => blockedMovements.add(movement));
        injuryConfig.alternatives.forEach(alternative => recommendedAlternatives.add(alternative));
      }
      
      // Add specific restrictions from injury data
      injury.restrictions.forEach(restriction => {
        constraints.add(this.normalizeRestriction(restriction));
      });

      // Adjust safety level based on injury severity
      if (injury.severity === 'severe' || injury.status === 'chronic') {
        safetyLevel = 'restricted';
      } else if (injury.severity === 'moderate' || injury.status === 'recovering') {
        safetyLevel = 'conservative';
      }
    }

    return {
      constraints: Array.from(constraints),
      safetyLevel,
      blockedMovements: Array.from(blockedMovements),
      recommendedAlternatives: Array.from(recommendedAlternatives)
    };
  }

  /**
   * Generate cache key from injury history
   */
  private generateCacheKey(injuryHistory: InjuryHistory): string {
    // Create a deterministic key based on injury data
    return JSON.stringify({
      injuries: injuryHistory.injuries.map(i => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        status: i.status,
        restrictions: i.restrictions.sort()
      }))
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    // Simple cleanup - in production, this would be more sophisticated
    if (this.constraintCache.size > 100) {
      this.constraintCache.clear();
    }
  }



  /**
   * Normalize restriction strings
   */
  private normalizeRestriction(restriction: string): string {
    return restriction.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Check if a recommendation should be blocked
   */
  private shouldBlockRecommendation(
    recommendation: AIRecommendation,
    constraints: string[]
  ): { reason: string; severity: 'low' | 'medium' | 'high' } | null {
    const exerciseName = recommendation.exercise.toLowerCase();
    const variation = recommendation.variation.toLowerCase();

    // Check against constraints
    for (const constraint of constraints) {
      if (this.matchesConstraint(exerciseName, variation, constraint)) {
        return {
          reason: `Blocked due to injury constraint: ${constraint}`,
          severity: this.getConstraintSeverity(constraint)
        };
      }
    }

    return null;
  }

  /**
   * Check if exercise matches a constraint (optimized with pre-defined patterns)
   */
  private matchesConstraint(exercise: string, variation: string, constraint: string): boolean {
    const matches = this.CONSTRAINT_PATTERNS[constraint as keyof typeof this.CONSTRAINT_PATTERNS] || [];
    return matches.some(match => 
      exercise.includes(match) || variation.includes(match)
    );
  }

  /**
   * Get severity level for constraint
   */
  private getConstraintSeverity(constraint: string): 'low' | 'medium' | 'high' {
    const highSeverityConstraints = ['no_high_impact', 'no_heavy_lifting'];
    const mediumSeverityConstraints = ['no_deep_squats', 'no_overhead_press'];
    
    if (highSeverityConstraints.includes(constraint)) {
      return 'high';
    } else if (mediumSeverityConstraints.includes(constraint)) {
      return 'medium';
    }
    
    return 'low';
  }
}