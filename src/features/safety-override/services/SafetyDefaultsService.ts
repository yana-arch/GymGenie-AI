// Safety Defaults Service
// Implements conservative safety defaults that are automatically applied after user overrides

export interface SafetyLevel {
  id: 'conservative' | 'moderate' | 'progressive';
  name: string;
  description: string;
  intensityReduction: number; // percentage
  restIncrease: number; // percentage
  difficultyAdjustment: number; // percentage
}

export interface SafetyDefaults {
  level: SafetyLevel['id'];
  autoApply: boolean;
  userPreferences: {
    allowAutoIntensity: boolean;
    allowAutoRest: boolean;
    allowAutoExerciseChange: boolean;
    minimumRestTime: number; // seconds
    maximumIntensityReduction: number; // percentage
  };
}

export interface SafetyValidationRule {
  id: string;
  name: string;
  condition: (recommendation: any, context: any) => boolean;
  adjustment: (recommendation: any) => any;
  severity: 'low' | 'medium' | 'high';
}

export interface SafetyDefaultsConfig {
  enabled: boolean;
  currentLevel: SafetyLevel['id'];
  customRules: SafetyValidationRule[];
  userOverrides: Record<string, boolean>;
}

export class SafetyDefaultsService {
  private config: SafetyDefaultsConfig;
  private safetyLevels: SafetyLevel[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Maximum safety with significant reductions',
      intensityReduction: 30,
      restIncrease: 50,
      difficultyAdjustment: 40
    },
    {
      id: 'moderate',
      name: 'Moderate',
      description: 'Balanced approach with moderate safety adjustments',
      intensityReduction: 15,
      restIncrease: 25,
      difficultyAdjustment: 20
    },
    {
      id: 'progressive',
      name: 'Progressive',
      description: 'Gradual safety adjustments based on patterns',
      intensityReduction: 10,
      restIncrease: 15,
      difficultyAdjustment: 10
    }
  ];

  private defaultRules: SafetyValidationRule[] = [
    {
      id: 'max_intensity_cap',
      name: 'Maximum Intensity Cap',
      condition: (rec, context) => {
        const intensity = this.calculateIntensity(rec);
        return intensity > 85; // Cap at 85% max intensity
      },
      adjustment: (rec) => ({
        ...rec,
        suggestedReps: Math.max(1, Math.round((rec.suggestedReps || rec.originalReps || 1) * 0.8)),
        reasoning: 'Safety cap: Reduced intensity to prevent overexertion'
      }),
      severity: 'high'
    },
    {
      id: 'minimum_rest_enforcement',
      name: 'Minimum Rest Enforcement',
      condition: (rec, context) => {
        return (rec.restTime || 0) < 60; // Minimum 60 seconds rest
      },
      adjustment: (rec) => ({
        ...rec,
        restTime: Math.max(60, rec.restTime || 60),
        reasoning: 'Safety: Increased rest time for adequate recovery'
      }),
      severity: 'medium'
    },
    {
      id: 'fatigue_detection',
      name: 'Fatigue Detection Override',
      condition: (rec, context) => {
        return context.energyLevel === 'tired' && 
               (rec.suggestedReps || rec.originalReps || 1) > 8;
      },
      adjustment: (rec) => ({
        ...rec,
        suggestedReps: Math.max(1, Math.round((rec.suggestedReps || rec.originalReps || 1) * 0.7)),
        reasoning: 'Safety: Reduced volume due to detected fatigue'
      }),
      severity: 'high'
    },
    {
      id: 'time_constraint_safety',
      name: 'Time Constraint Safety',
      condition: (rec, context) => {
        return context.timeRemaining < 300 && // Less than 5 minutes
               (rec.originalSets || 1) > 2; // More than 2 sets
      },
      adjustment: (rec) => ({
        ...rec,
        suggestedSets: Math.max(1, Math.round((rec.originalSets || 1) * 0.6)),
        reasoning: 'Safety: Reduced sets for time constraints'
      }),
      severity: 'medium'
    }
  ];

  constructor(config?: Partial<SafetyDefaultsConfig>) {
    this.config = {
      enabled: true,
      currentLevel: 'moderate',
      customRules: [],
      userOverrides: {},
      ...config
    };
  }

  // Apply safety defaults after user override
  applySafetyDefaults(recommendation: any, context: any): any {
    if (!this.config.enabled) {
      return recommendation;
    }

    let adjustedRecommendation = { ...recommendation };
    const currentSafetyLevel = this.getCurrentSafetyLevel();

    // Apply safety level adjustments
    adjustedRecommendation = this.applySafetyLevelAdjustments(
      adjustedRecommendation, 
      currentSafetyLevel
    );

    // Apply validation rules
    for (const rule of this.getAllRules()) {
      if (rule.condition(adjustedRecommendation, context)) {
        adjustedRecommendation = rule.adjustment(adjustedRecommendation);
      }
    }

    return adjustedRecommendation;
  }

  // Get current safety level configuration
  getCurrentSafetyLevel(): SafetyLevel {
    return this.safetyLevels.find(level => level.id === this.config.currentLevel) || 
           this.safetyLevels[1]; // Default to moderate
  }

  // Set safety level
  setSafetyLevel(level: SafetyLevel['id']): void {
    this.config.currentLevel = level;
    this.saveConfig();
  }

  // Apply safety level specific adjustments
  private applySafetyLevelAdjustments(
    recommendation: any, 
    safetyLevel: SafetyLevel
  ): any {
    const adjusted = { ...recommendation };

    // Apply intensity reduction
    if (adjusted.suggestedReps && adjusted.originalReps) {
      const reduction = 1 - (safetyLevel.intensityReduction / 100);
      adjusted.suggestedReps = Math.max(1, Math.round(adjusted.originalReps * reduction));
    }

    // Apply rest increase
    if (adjusted.restTime) {
      const increase = 1 + (safetyLevel.restIncrease / 100);
      adjusted.restTime = Math.round(adjusted.restTime * increase);
    }

    // Apply difficulty adjustments
    if (adjusted.difficulty) {
      const reduction = 1 - (safetyLevel.difficultyAdjustment / 100);
      adjusted.difficulty = Math.max(1, adjusted.difficulty * reduction);
    }

    adjusted.reasoning = `Safety (${safetyLevel.name}): ${adjusted.reasoning || 'Applied safety adjustments'}`;

    return adjusted;
  }

  // Get all active rules
  private getAllRules(): SafetyValidationRule[] {
    return [...this.defaultRules, ...this.config.customRules];
  }

  // Add custom safety rule
  addCustomRule(rule: SafetyValidationRule): void {
    this.config.customRules.push(rule);
    this.saveConfig();
  }

  // Remove custom rule
  removeCustomRule(ruleId: string): void {
    this.config.customRules = this.config.customRules.filter(rule => rule.id !== ruleId);
    this.saveConfig();
  }

  // Validate recommendation against all safety rules
  validateRecommendation(recommendation: any, context: any): {
    isValid: boolean;
    violations: SafetyValidationRule[];
    adjusted: any;
  } {
    const violations: SafetyValidationRule[] = [];
    let adjusted = { ...recommendation };

    for (const rule of this.getAllRules()) {
      if (rule.condition(adjusted, context)) {
        violations.push(rule);
        adjusted = rule.adjustment(adjusted);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      adjusted
    };
  }

  // Override specific safety rule
  overrideRule(ruleId: string, enabled: boolean): void {
    this.config.userOverrides[ruleId] = !enabled;
    this.saveConfig();
  }

  // Get safety recommendations based on context
  getSafetyRecommendations(context: any): {
    level: SafetyLevel;
    suggestions: string[];
    reasoning: string;
  } {
    const currentLevel = this.getCurrentSafetyLevel();
    const suggestions: string[] = [];

    // Analyze context for safety recommendations
    if (context.energyLevel === 'tired') {
      suggestions.push('Consider reducing workout intensity by 20-30%');
      suggestions.push('Increase rest periods between sets');
      suggestions.push('Focus on form rather than volume');
    }

    if (context.timeRemaining < 600) { // Less than 10 minutes
      suggestions.push('Prioritize compound exercises');
      suggestions.push('Reduce isolation movements');
      suggestions.push('Consider shortening workout');
    }

    if (context.equipmentAvailable && context.equipmentAvailable.length === 1) {
      suggestions.push('Focus on exercises with available equipment');
      suggestions.push('Avoid complex multi-equipment movements');
    }

    return {
      level: currentLevel,
      suggestions,
      reasoning: `Based on current context: ${context.energyLevel} energy level, ${context.timeRemaining}s remaining, ${context.equipmentAvailable?.length || 0} equipment options`
    };
  }

  // Calculate exercise intensity (simplified)
  private calculateIntensity(recommendation: any): number {
    if (!recommendation) return 0;

    let intensity = 50; // Base intensity

    // Adjust based on reps (inverse relationship)
    if (recommendation.suggestedReps) {
      intensity += Math.max(0, (20 - recommendation.suggestedReps) * 2);
    }

    // Adjust based on sets (direct relationship)
    if (recommendation.suggestedSets) {
      intensity += recommendation.suggestedSets * 5;
    }

    // Adjust based on rest time (inverse relationship)
    if (recommendation.restTime) {
      intensity += Math.max(0, (180 - recommendation.restTime) / 10);
    }

    return Math.min(100, Math.max(0, intensity));
  }

  // Get available safety levels
  getAvailableSafetyLevels(): SafetyLevel[] {
    return [...this.safetyLevels];
  }

  // Check if rule is overridden
  isRuleOverridden(ruleId: string): boolean {
    return this.config.userOverrides[ruleId] === true;
  }

  // Get safety metrics
  getSafetyMetrics(): {
    totalRules: number;
    activeRules: number;
    overriddenRules: number;
    currentLevel: SafetyLevel;
  } {
    const allRules = this.getAllRules();
    const overriddenCount = Object.keys(this.config.userOverrides).filter(
      ruleId => this.config.userOverrides[ruleId]
    ).length;

    return {
      totalRules: allRules.length,
      activeRules: allRules.length - overriddenCount,
      overriddenRules: overriddenCount,
      currentLevel: this.getCurrentSafetyLevel()
    };
  }

  // Save configuration to local storage
  private saveConfig(): void {
    try {
      localStorage.setItem('safety-defaults-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save safety defaults config:', error);
    }
  }

  // Load configuration from local storage
  loadConfig(): void {
    try {
      const saved = localStorage.getItem('safety-defaults-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load safety defaults config:', error);
    }
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.config = {
      enabled: true,
      currentLevel: 'moderate',
      customRules: [],
      userOverrides: {}
    };
    this.saveConfig();
  }

  // Get current configuration
  getConfig(): SafetyDefaultsConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates: Partial<SafetyDefaultsConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  // Clean up resources
  destroy(): void {
    this.config.customRules = [];
    this.config.userOverrides = {};
    this.saveConfig();
  }
}