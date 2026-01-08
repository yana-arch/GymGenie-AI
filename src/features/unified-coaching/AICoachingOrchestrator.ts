/**
 * AI Coaching Orchestrator
 * Base orchestrator for coordinating multiple AI coaching systems
 * Implements priority-based decision making: safety > injury > form > adaptation
 */

import {
  CoachingDecision,
  CoachingPriority,
  AICoachingInput,
  AISystemResponse,
  UnifiedCoachingState,
  LiveSessionState,
  FormCorrectionState,
  SafetyOverrideState,
  InjuryAwareState,
  CoachingContribution,
  CoachingConflict
} from './types/unifiedCoaching.types';

/**
 * AI Coaching Orchestrator
 * Coordinates multiple AI systems for unified coaching decisions
 */
export class AICoachingOrchestrator {
  protected sessionMetrics: Map<string, any> = new Map();

  constructor() {
    // Initialize orchestrator
  }

  /**
   * Process integrated coaching from multiple AI systems
   */
  async processIntegratedCoaching(session: {
    liveSession: LiveSessionState;
    formCorrection: FormCorrectionState;
    safetyOverride: SafetyOverrideState;
    injuryAware: InjuryAwareState;
  }): Promise<CoachingDecision> {
    const startTime = performance.now();

    try {
      // Collect inputs from all AI systems
      const inputs = this.collectAIInputs(session);
      
      // Validate inputs for proper recommendation format
      const validInputs: AICoachingInput[] = [];
      for (const input of inputs) {
        if (!this.validateRecommendationFormat(input.response.recommendation)) {
          console.warn('Invalid recommendation format detected, filtering input:', input.system);
          continue; // Skip this input
        }
        validInputs.push(input);
      }
      
      // Apply priority-based decision making
      const decision = this.makePriorityDecision(validInputs);
      
      // Handle conflicts between systems
      const resolvedDecision = this.resolveConflicts(decision, validInputs);
      
      // Create final coaching decision
      const contributingSystems: CoachingContribution[] = validInputs.map(input => ({
        system: input.system,
        priority: input.priority,
        response: input.response,
        wasConflicted: resolvedDecision.conflictResolution?.conflicts.some(
          (conflict: any) => conflict.conflictingSystems.includes(input.system)
        ) || false
      }));

      const finalDecision: CoachingDecision = {
        system: 'unified-coaching',
        priority: resolvedDecision.priority,
        response: resolvedDecision.response,
        contributingSystems,
        conflictResolution: resolvedDecision.conflictResolution,
        metadata: {
          processingTime: performance.now() - startTime,
          systemsConsidered: validInputs.length,
          conflictsResolved: resolvedDecision.conflictResolution?.conflicts.length || 0,
          priorityUsed: resolvedDecision.priority,
          timestamp: Date.now()
        }
      };

      return finalDecision;

    } catch (error) {
      console.error('Error in AI coaching orchestration:', error);
      return this.createSafeDefaultDecision(error);
    }
  }

  /**
   * Collect inputs from all AI systems
   */
  protected collectAIInputs(session: any): AICoachingInput[] {
    const inputs: AICoachingInput[] = [];
    const CONFIDENCE_THRESHOLD = 0.5;

    // Live session adaptations input
    if ((session.liveSession?.isActive || session.adaptation?.isActive) && 
        ((session.liveSession?.confidence || session.adaptation?.confidence) || 0.7) >= CONFIDENCE_THRESHOLD) {
      const liveData = session.liveSession || session.adaptation;
      const recommendation = liveData.currentRecommendation || liveData.currentAdaptation;
      
      inputs.push({
        system: 'live-session',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: liveData.confidence || 0.7,
          recommendation: recommendation || {
            action: 'continue',
            message: 'Maintain current pace'
          },
          reasoning: 'Real-time performance adaptation',
          timestamp: Date.now()
        }
      });
    }

    // Form correction input
    if ((session.formCorrection?.isActive || session.form?.isActive) && 
        ((session.formCorrection?.confidence || session.form?.confidence) || 0.8) >= CONFIDENCE_THRESHOLD) {
      const formData = session.formCorrection || session.form;
      inputs.push({
        system: 'form-correction',
        priority: CoachingPriority.FORM,
        response: {
          type: 'form-correction',
          confidence: formData.confidence || 0.8,
          recommendation: formData.currentCorrection || {
            action: 'adjust_form',
            message: 'Focus on proper form'
          },
          reasoning: 'AI-detected form issues',
          timestamp: Date.now()
        }
      });
    }

    // Safety override input (always include if active, no confidence threshold)
    if (session.safetyOverride?.isActive || session.safety?.isActive) {
      const safetyData = session.safetyOverride || session.safety;
      inputs.push({
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 1.0, // Safety is always high confidence
          recommendation: safetyData.overrideAction || {
            action: 'stop',
            message: 'Safety override activated'
          },
          reasoning: 'Safety system intervention',
          timestamp: Date.now()
        }
      });
    }

    // Injury awareness input
    if (session.injuryAware?.isActive || session.injury?.isActive) {
      const injuryData = session.injuryAware || session.injury;
      inputs.push({
        system: 'injury-aware',
        priority: CoachingPriority.INJURY,
        response: {
          type: 'injury-prevention',
          confidence: injuryData.confidence || 0.9,
          recommendation: injuryData.currentRecommendation || {
            action: 'reduce_intensity',
            message: 'Injury prevention measure'
          },
          reasoning: 'Injury risk detected',
          timestamp: Date.now()
        }
      });
    }

    return inputs;
  }

  /**
   * Make priority-based decision
   */
  protected makePriorityDecision(inputs: AICoachingInput[]): any {
    if (inputs.length === 0) {
      return {
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'no-input',
          confidence: 0.5,
          recommendation: {
            action: 'continue',
            message: 'No active coaching systems'
          },
          reasoning: 'No AI systems currently active',
          timestamp: Date.now()
        }
      };
    }

    // Sort by priority (safety > injury > form > adaptation > encouragement)
    const priorityOrder = {
      [CoachingPriority.SAFETY]: 0,
      [CoachingPriority.INJURY]: 1,
      [CoachingPriority.FORM]: 2,
      [CoachingPriority.ADAPTATION]: 3,
      [CoachingPriority.ENCOURAGEMENT]: 4
    };

    const sortedInputs = inputs.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Select highest priority input
    const selectedInput = sortedInputs[0];
    
    return {
      priority: selectedInput.priority,
      response: { ...selectedInput.response }
    };
  }

  /**
   * Resolve conflicts between AI systems
   */
  protected resolveConflicts(decision: any, inputs: AICoachingInput[]): any {
    const conflicts: CoachingConflict[] = [];

    // Check for conflicting recommendations
    const safetyInputs = inputs.filter(i => i.priority === CoachingPriority.SAFETY);
    const injuryInputs = inputs.filter(i => i.priority === CoachingPriority.INJURY);
    
    if (safetyInputs.length > 0 && injuryInputs.length > 0) {
      conflicts.push({
        severity: 'medium',
        conflictingSystems: ['safety-override', 'injury-aware'],
        primarySystem: 'safety-override',
        conflictingSystem: 'injury-aware',
        description: 'Safety and injury systems both active',
        resolution: 'Safety takes precedence'
      });
    }

    // Check for action contradictions between all inputs
    for (let i = 0; i < inputs.length; i++) {
      for (let j = i + 1; j < inputs.length; j++) {
        const conflict = this.analyzeConflict(inputs[i], inputs[j]);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    if (conflicts.length > 0) {
      return {
        ...decision,
        conflictResolution: {
          strategy: 'priority-hierarchy',
          conflicts,
          reasoning: 'Applied priority-based conflict resolution'
        }
      };
    }

    return {
      ...decision,
      conflictResolution: null
    };
  }

  /**
   * Analyze conflict between two AI system inputs
   */
  protected analyzeConflict(input1: AICoachingInput, input2: AICoachingInput): CoachingConflict | null {
    // Check for contradictory actions
    const action1 = this.extractAction(input1.response.recommendation);
    const action2 = this.extractAction(input2.response.recommendation);
    
    if (this.areContradictoryActions(action1, action2)) {
      return {
        severity: this.calculateConflictSeverity(input1, input2),
        conflictingSystems: [input1.system, input2.system],
        primarySystem: input1.priority < input2.priority ? input1.system : input2.system,
        conflictingSystem: input1.priority < input2.priority ? input2.system : input1.system,
        description: `Conflict between ${input1.system} (${action1}) and ${input2.system} (${action2})`,
        resolution: `${input1.priority < input2.priority ? input1.system : input2.system} takes precedence`
      };
    }
    
    return null;
  }

  /**
   * Extract action from recommendation
   */
  protected extractAction(recommendation: any): string {
    if (!recommendation) return 'unknown';
    return recommendation.action || recommendation.type || 'unknown';
  }

  /**
   * Check if two actions are contradictory
   */
  protected areContradictoryActions(action1: string, action2: string): boolean {
    const contradictoryPairs = [
      ['increase', 'decrease'],
      ['increase_intensity', 'decrease_intensity'],
      ['increase_weight', 'reduce_weight'],
      ['continue', 'stop'],
      ['intensify', 'reduce']
    ];
    
    return contradictoryPairs.some(([increase, decrease]) =>
      (action1.includes(increase) && action2.includes(decrease)) ||
      (action2.includes(increase) && action1.includes(decrease))
    );
  }

  /**
   * Calculate conflict severity based on priority and confidence
   */
  protected calculateConflictSeverity(input1: AICoachingInput, input2: AICoachingInput): 'high' | 'medium' | 'low' {
    const highPrioritySystem = [input1, input2].find(i => i.priority === CoachingPriority.SAFETY);
    if (highPrioritySystem) return 'high';
    
    const avgConfidence = (input1.response.confidence + input2.response.confidence) / 2;
    if (avgConfidence > 0.8) return 'high';
    if (avgConfidence > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Validate recommendation format
   */
  protected validateRecommendationFormat(recommendation: any): boolean {
    if (!recommendation || typeof recommendation !== 'object') {
      return false;
    }
    
    // Action is required, message is optional
    if (!recommendation.action || typeof recommendation.action !== 'string') {
      return false;
    }
    
    return true;
  }

  /**
   * Create safe default decision when errors occur
   */
  protected createSafeDefaultDecision(error: Error): CoachingDecision {
    return {
      system: 'unified-coaching',
      priority: CoachingPriority.SAFETY,
      response: {
        type: 'safe-default',
        confidence: 0.5,
        recommendation: {
          action: 'pause',
          message: 'AI coaching temporarily unavailable - continue with caution'
        },
        reasoning: `Safe fallback due to error: ${error.message}`,
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: {
        strategy: 'safe-fallback',
        conflicts: [],
        reasoning: 'Error occurred - using safe fallback mode'
      },
      metadata: {
        processingTime: 0,
        systemsConsidered: 0,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.SAFETY,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics(): any {
    return {
      sessionMetrics: Array.from(this.sessionMetrics.values()),
      activeSessions: this.sessionMetrics.size
    };
  }

  /**
   * Clear session metrics
   */
  clearMetrics(): void {
    this.sessionMetrics.clear();
  }
}

// Export singleton instance
export const aiCoachingOrchestrator = new AICoachingOrchestrator();