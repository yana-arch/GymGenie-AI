/**
 * Integrated Safety Validator Service
 * Comprehensive safety validation across all AI systems
 * Implements safety-first coaching decision overrides with full transparency
 */

import {
  CoachingPriority,
  AICoachingInput,
  CoachingDecision
} from './types/unifiedCoaching.types';

export interface SafetyValidationResult {
  isValid: boolean;
  safetyScore: number;
  violations: SafetyViolation[];
  adjustedInput: AICoachingInput;
  explanation: string;
  timestamp: number;
  processingTime: number;
}

export interface SafetyViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  ruleId: string;
  recommendation: string;
}

export interface SafetyOverrideResult {
  response: {
    type: string;
    confidence: number;
    recommendation: any;
    reasoning: string;
    timestamp: number;
  };
  system: string;
  priority: CoachingPriority;
  originalAction: string;
  overrideReasoning: string;
  userNotification: {
    message: string;
    severity: 'low' | 'medium' | 'high';
    actionRequired: boolean;
  };
  timestamp: number;
}

export interface MultiSystemSafetyResult {
  isSafe: boolean;
  systemsValidated: number;
  primaryDecision: AICoachingInput;
  safetyOverrides: number;
  conflictsDetected: number;
  resolutionStrategy: string;
  compositeSafetyScore: number;
  recommendations: string[];
}

export interface SafetyReport {
  totalValidations: number;
  totalViolations: number;
  totalOverrides: number;
  safetyViolations: {
    high: number;
    medium: number;
    low: number;
  };
  systemBreakdown: Record<string, {
    validations: number;
    violations: number;
    overrides: number;
  }>;
  averageSafetyScore: number;
  period: {
    start: number;
    end: number;
  };
}

export interface ValidationHistoryEntry {
  id: string;
  system: string;
  priority: CoachingPriority;
  safetyScore: number;
  isValid: boolean;
  violations: number;
  overrides: number;
  timestamp: number;
  decision: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  system?: string;
  priority?: CoachingPriority;
  result: 'safe' | 'unsafe' | 'overridden';
  reasoning: string;
  userNotified: boolean;
}

export interface SystemFailureResult {
  response: {
    type: string;
    confidence: number;
    recommendation: {
      action: string;
      message: string;
    };
    reasoning: string;
    timestamp: number;
  };
  system: string;
  priority: CoachingPriority;
  metadata: {
    error: string;
    fallbackStrategy: string;
    timestamp: number;
  };
  contributingSystems: any[];
  conflictResolution: {
    strategy: string;
    conflicts: any[];
    reasoning: string;
  };
}

/**
 * IntegratedSafetyValidator
 * Comprehensive safety validation for all AI coaching systems
 */
export class IntegratedSafetyValidator {
  private validationHistory: ValidationHistoryEntry[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private safetyReport: SafetyReport = this.initializeSafetyReport();

  // Safety validation rules
  private safetyRules = {
    // High severity rules
    maxIntensityCap: 85, // 85% max intensity
    minRestTime: 60, // 60 seconds minimum
    maxReps: 15, // Maximum recommended reps
    maxSets: 6, // Maximum recommended sets

    // Medium severity rules
    recommendedRestTime: 90, // Recommended rest time
    maxWeightIncrease: 10, // Maximum weight increase percentage

    // Low severity rules
    minRestWarning: 45, // Warning threshold for rest time
  };

  /**
   * Validate a coaching decision against safety rules
   */
  async validateCoachingDecision(input: AICoachingInput): Promise<SafetyValidationResult> {
    const startTime = performance.now();

    try {
      // Run safety validations
      const violations = this.detectSafetyViolations(input);

      // Calculate safety score
      const safetyScore = this.calculateSafetyScore(violations);

      // Adjust input based on violations
      const adjustedInput = violations.length > 0
        ? this.applySafetyAdjustments(input, violations)
        : { ...input };

      // Generate explanation
      const explanation = this.generateExplanation(input, violations, adjustedInput);

      const result: SafetyValidationResult = {
        isValid: violations.length === 0,
        safetyScore,
        violations,
        adjustedInput,
        explanation,
        timestamp: Date.now(),
        processingTime: performance.now() - startTime
      };

      // Add to validation history
      this.addToValidationHistory(input, result);

      // Update safety report
      this.updateSafetyReport(input, result);

      // Add to audit logs
      this.auditLogs.push({
        id: this.generateId(),
        timestamp: Date.now(),
        action: 'validate',
        system: input.system,
        priority: input.priority,
        result: result.isValid ? 'safe' : 'unsafe',
        reasoning: explanation,
        userNotified: violations.length > 0
      });

      // Keep logs within reasonable limits
      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-1000);
      }

      return result;

    } catch (error) {
      console.error('Error validating coaching decision:', error);
      throw error;
    }
  }

  /**
   * Apply safety override when safety system provides intervention
   */
  async applySafetyOverride(context: {
    primary: AICoachingInput;
    safetyOverride: AICoachingInput;
  }): Promise<SafetyOverrideResult> {
    const { primary, safetyOverride } = context;

    const originalAction = this.extractAction(primary.response.recommendation);
    const overrideAction = this.extractAction(safetyOverride.response.recommendation);

    const result: SafetyOverrideResult = {
      response: {
        type: safetyOverride.response.type,
        confidence: safetyOverride.response.confidence,
        recommendation: safetyOverride.response.recommendation,
        reasoning: `${safetyOverride.response.reasoning}. Overriding ${primary.system} recommendation for safety.`,
        timestamp: Date.now()
      },
      system: safetyOverride.system,
      priority: safetyOverride.priority,
      originalAction,
      overrideReasoning: `Safety override applied by ${safetyOverride.system} (priority: ${safetyOverride.priority}). Original action: ${originalAction} overridden for safety reasons.`,
      userNotification: {
        message: `Safety intervention: ${overrideAction} (original: ${originalAction}). ${safetyOverride.response.recommendation.reason || 'Safety precaution applied.'}`,
        severity: 'high',
        actionRequired: true
      },
      timestamp: Date.now()
    };

    // Update safety report with override
    this.safetyReport.totalOverrides++;
    if (this.safetyReport.systemBreakdown[safetyOverride.system]) {
      this.safetyReport.systemBreakdown[safetyOverride.system].overrides++;
    }

    // Add to audit logs
    this.auditLogs.push({
      id: this.generateId(),
      timestamp: Date.now(),
      action: 'override',
      system: safetyOverride.system,
      priority: safetyOverride.priority,
      result: 'overridden',
      reasoning: result.overrideReasoning,
      userNotified: true
    });

    // Keep logs within reasonable limits
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    return result;
  }

  /**
   * Validate multiple AI systems against safety
   */
  async validateAgainstSafety(inputs: AICoachingInput[]): Promise<MultiSystemSafetyResult> {
    const startTime = performance.now();
    const safetyInputs = inputs.filter(input => input.priority === CoachingPriority.SAFETY);

    let isSafe = true;
    let safetyOverrides = 0;
    let conflictsDetected = 0;
    const recommendations: string[] = [];

    // Validate each input individually
    for (const input of inputs) {
      const result = await this.validateCoachingDecision(input);
      if (!result.isValid && input.priority !== CoachingPriority.SAFETY) {
        isSafe = false;
      }
      if (result.violations.length > 0) {
        recommendations.push(`${input.system}: ${result.explanation}`);
      }
    }

    // Count safety overrides (safety inputs overriding lower priority)
    if (safetyInputs.length > 0 && inputs.some(i => i.priority !== CoachingPriority.SAFETY)) {
      safetyOverrides = safetyInputs.length;
      conflictsDetected = inputs.length - safetyInputs.length;
    }

    // Find primary decision (highest priority)
    const primaryDecision = this.findPrimaryDecision(inputs);

    // Calculate composite safety score
    const compositeSafetyScore = this.calculateCompositeSafetyScore(inputs);

    const result: MultiSystemSafetyResult = {
      isSafe,
      systemsValidated: inputs.length,
      primaryDecision,
      safetyOverrides,
      conflictsDetected,
      resolutionStrategy: safetyOverrides > 0 ? 'safety-priority-override' : 'priority-hierarchy',
      compositeSafetyScore,
      recommendations
    };

    return result;
  }

  /**
   * Handle system failure with graceful degradation
   */
  async handleSystemFailure(context: {
    system: string;
    error: string;
  }): Promise<SystemFailureResult> {
    const { system, error } = context;

    const result: SystemFailureResult = {
      response: {
        type: 'safe-default',
        confidence: 1.0,
        recommendation: {
          action: 'pause',
          message: `${system} system error - pausing for safety. Error: ${error}`
        },
        reasoning: `System failure in ${system}. Defaulting to safe pause for user protection.`,
        timestamp: Date.now()
      },
      system: 'unified-coaching',
      priority: CoachingPriority.SAFETY,
      metadata: {
        error,
        fallbackStrategy: 'safe-pause',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: {
        strategy: 'safe-default',
        conflicts: [],
        reasoning: 'System error - using safe default response'
      }
    };

    // Add to audit logs
    this.auditLogs.push({
      id: this.generateId(),
      timestamp: Date.now(),
      action: 'system-failure',
      system,
      result: 'safe',
      reasoning: result.response.reasoning,
      userNotified: true
    });

    // Keep logs within reasonable limits
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    return result;
  }

  /**
   * Get comprehensive safety report
   */
  getSafetyReport(): SafetyReport {
    return {
      ...this.safetyReport,
      period: {
        start: this.validationHistory[0]?.timestamp || Date.now(),
        end: this.validationHistory[this.validationHistory.length - 1]?.timestamp || Date.now()
      }
    };
  }

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationHistoryEntry[] {
    return [...this.validationHistory];
  }

  /**
   * Get audit logs
   */
  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  /**
   * Clear validation history
   */
  clearValidationHistory(): void {
    this.validationHistory = [];
    this.auditLogs = [];
    this.safetyReport = this.initializeSafetyReport();
  }

  /**
   * Detect safety violations in input
   */
  private detectSafetyViolations(input: AICoachingInput): SafetyViolation[] {
    const violations: SafetyViolation[] = [];
    const rec = input.response.recommendation;

    if (!rec || typeof rec !== 'object') {
      return violations;
    }

    // High severity violations
    if (rec.suggestedReps && rec.suggestedReps > this.safetyRules.maxReps) {
      violations.push({
        id: this.generateId(),
        type: 'volume-exceeded',
        severity: 'high',
        description: `Recommended reps (${rec.suggestedReps}) exceeds safe maximum (${this.safetyRules.maxReps})`,
        ruleId: 'max-reps',
        recommendation: `Reduce reps to ${this.safetyRules.maxReps} or less`
      });
    }

    if (rec.suggestedSets && rec.suggestedSets > this.safetyRules.maxSets) {
      violations.push({
        id: this.generateId(),
        type: 'volume-exceeded',
        severity: 'high',
        description: `Recommended sets (${rec.suggestedSets}) exceeds safe maximum (${this.safetyRules.maxSets})`,
        ruleId: 'max-sets',
        recommendation: `Reduce sets to ${this.safetyRules.maxSets} or less`
      });
    }

    if (rec.restTime && rec.restTime < this.safetyRules.minRestTime) {
      violations.push({
        id: this.generateId(),
        type: 'insufficient-rest',
        severity: 'high',
        description: `Rest time (${rec.restTime}s) below minimum (${this.safetyRules.minRestTime}s)`,
        ruleId: 'min-rest',
        recommendation: `Increase rest to at least ${this.safetyRules.minRestTime} seconds`
      });
    }

    // Medium severity violations
    if (rec.restTime && rec.restTime < this.safetyRules.recommendedRestTime && rec.restTime >= this.safetyRules.minRestTime) {
      violations.push({
        id: this.generateId(),
        type: 'suboptimal-rest',
        severity: 'medium',
        description: `Rest time (${rec.restTime}s) below recommended (${this.safetyRules.recommendedRestTime}s)`,
        ruleId: 'recommended-rest',
        recommendation: `Consider increasing rest to ${this.safetyRules.recommendedRestTime} seconds for better recovery`
      });
    }

    // Low severity violations
    if (rec.restTime && rec.restTime < this.safetyRules.minRestWarning) {
      violations.push({
        id: this.generateId(),
        type: 'low-rest-warning',
        severity: 'low',
        description: `Rest time (${rec.restTime}s) approaching minimum`,
        ruleId: 'rest-warning',
        recommendation: `Monitor fatigue levels closely with low rest periods`
      });
    }

    return violations;
  }

  /**
   * Calculate safety score based on violations
   */
  private calculateSafetyScore(violations: SafetyViolation[]): number {
    if (violations.length === 0) {
      return 1.0;
    }

    let score = 1.0;
    const severityWeights = {
      high: 0.3,
      medium: 0.15,
      low: 0.05
    };

    for (const violation of violations) {
      score -= severityWeights[violation.severity];
    }

    return Math.max(0, score);
  }

  /**
   * Apply safety adjustments to input
   */
  private applySafetyAdjustments(
    input: AICoachingInput,
    violations: SafetyViolation[]
  ): AICoachingInput {
    let adjusted = { ...input };
    const rec = { ...input.response.recommendation };

    for (const violation of violations) {
      switch (violation.ruleId) {
        case 'max-reps':
          rec.suggestedReps = this.safetyRules.maxReps;
          break;
        case 'max-sets':
          rec.suggestedSets = this.safetyRules.maxSets;
          break;
        case 'min-rest':
        case 'recommended-rest':
          rec.restTime = this.safetyRules.recommendedRestTime;
          break;
        case 'max-intensity':
          // Reduce intensity by 20%
          if (rec.suggestedReps && rec.originalReps) {
            rec.suggestedReps = Math.max(1, Math.round(rec.originalReps * 0.8));
          }
          break;
      }
    }

    adjusted.response = {
      ...input.response,
      recommendation: rec,
      reasoning: `${input.response.reasoning} Safety adjustments applied: ${violations.map(v => v.ruleId).join(', ')}`
    };

    return adjusted;
  }

  /**
   * Generate explanation for safety decision
   */
  private generateExplanation(
    original: AICoachingInput,
    violations: SafetyViolation[],
    adjusted: AICoachingInput
  ): string {
    if (violations.length === 0) {
      return `${original.system} recommendation validated - meets all safety requirements.`;
    }

    const highSeverity = violations.filter(v => v.severity === 'high').length;
    const mediumSeverity = violations.filter(v => v.severity === 'medium').length;
    const lowSeverity = violations.filter(v => v.severity === 'low').length;

    let explanation = `${original.system} recommendation requires safety adjustments: `;

    if (highSeverity > 0) {
      explanation += `${highSeverity} high-severity safety issue(s)`;
    }
    if (mediumSeverity > 0) {
      explanation += `${highSeverity > 0 ? ', ' : ''}${mediumSeverity} medium-severity issue(s)`;
    }
    if (lowSeverity > 0) {
      explanation += `${(highSeverity + mediumSeverity) > 0 ? ', ' : ''}${lowSeverity} low-severity warning(s)`;
    }

    explanation += `. Adjustments applied to ensure safety.`;

    return explanation;
  }

  /**
   * Extract action from recommendation
   */
  private extractAction(recommendation: any): string {
    if (!recommendation) return 'unknown';
    return recommendation.action || recommendation.type || 'unknown';
  }

  /**
   * Find primary decision (highest priority)
   */
  private findPrimaryDecision(inputs: AICoachingInput[]): AICoachingInput {
    if (inputs.length === 0) {
      throw new Error('No inputs provided');
    }

    const priorityOrder = [
      CoachingPriority.SAFETY,
      CoachingPriority.INJURY,
      CoachingPriority.FORM,
      CoachingPriority.ADAPTATION
    ];

    return inputs.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.priority);
      const bIndex = priorityOrder.indexOf(b.priority);
      return aIndex - bIndex;
    })[0];
  }

  /**
   * Calculate composite safety score across all inputs
   */
  private calculateCompositeSafetyScore(inputs: AICoachingInput[]): number {
    if (inputs.length === 0) {
      return 1.0;
    }

    const totalScore = inputs.reduce((sum, input) => {
      const result = this.detectSafetyViolations(input);
      return sum + this.calculateSafetyScore(result);
    }, 0);

    return totalScore / inputs.length;
  }

  /**
   * Add entry to validation history
   */
  private addToValidationHistory(
    input: AICoachingInput,
    result: SafetyValidationResult
  ): void {
    const entry: ValidationHistoryEntry = {
      id: this.generateId(),
      system: input.system,
      priority: input.priority,
      safetyScore: result.safetyScore,
      isValid: result.isValid,
      violations: result.violations.length,
      overrides: 0,
      timestamp: result.timestamp,
      decision: this.extractAction(input.response.recommendation)
    };

    this.validationHistory.push(entry);

    // Keep history within reasonable limits
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }
  }

  /**
   * Update safety report statistics
   */
  private updateSafetyReport(
    input: AICoachingInput,
    result: SafetyValidationResult
  ): void {
    this.safetyReport.totalValidations++;

    if (!result.isValid) {
      this.safetyReport.totalViolations += result.violations.length;

      for (const violation of result.violations) {
        this.safetyReport.safetyViolations[violation.severity]++;
      }
    }

    // Update system breakdown
    if (!this.safetyReport.systemBreakdown[input.system]) {
      this.safetyReport.systemBreakdown[input.system] = {
        validations: 0,
        violations: 0,
        overrides: 0
      };
    }

    this.safetyReport.systemBreakdown[input.system].validations++;
    if (!result.isValid) {
      this.safetyReport.systemBreakdown[input.system].violations += result.violations.length;
    }

    // Update average safety score
    this.safetyReport.averageSafetyScore =
      (this.safetyReport.averageSafetyScore * (this.safetyReport.totalValidations - 1) +
        result.safetyScore) / this.safetyReport.totalValidations;
  }

  /**
   * Initialize safety report
   */
  private initializeSafetyReport(): SafetyReport {
    return {
      totalValidations: 0,
      totalViolations: 0,
      totalOverrides: 0,
      safetyViolations: {
        high: 0,
        medium: 0,
        low: 0
      },
      systemBreakdown: {},
      averageSafetyScore: 1.0,
      period: {
        start: Date.now(),
        end: Date.now()
      }
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const integratedSafetyValidator = new IntegratedSafetyValidator();
