import {
  FeedbackData,
  FeedbackType,
  FeedbackImpact,
  FeedbackSettings,
  FeedbackProcessingResult
} from '../types/feedbackPersonalization.types';

// Integration interfaces for existing services
export interface IPreferenceLearningService {
  updatePreferences(userId: string, updates: Partial<any>): Promise<void>;
  
  getCurrentPreferences(exerciseId: string): Promise<{
    difficultyLevel: number;
    volumeLevel: number;
  }>;
}

export interface IHistoricalPatternsService {
  getExerciseHistory(exerciseId: string): Promise<Array<{
    workoutId: string;
    timestamp: string;
    performance: {
      weight: number;
      reps: number;
      sets: number;
    };
  }>>;
  
  detectPatterns(exerciseId: string): Promise<Array<{
    type: string;
    strength: number;
    confidence: number;
  }>>;
}

export interface IAICoachingOrchestrator {
  applyFeedbackImpact(impact: FeedbackImpact): Promise<void>;
  
  getCurrentRecommendation(exerciseId: string): Promise<{
    id: string;
    exerciseId: string;
    weight: number;
    reps: number;
    sets: number;
  } | null>;
}

export class FeedbackIntegrationEngine {
  private preferenceLearningService: IPreferenceLearningService;
  private historicalPatternsService: IHistoricalPatternsService;
  private aiCoachingOrchestrator: IAICoachingOrchestrator;
  private settings: FeedbackSettings;

  constructor(
    preferenceLearningService: IPreferenceLearningService,
    historicalPatternsService: IHistoricalPatternsService,
    aiCoachingOrchestrator: IAICoachingOrchestrator,
    settings?: Partial<FeedbackSettings>
  ) {
    this.preferenceLearningService = preferenceLearningService;
    this.historicalPatternsService = historicalPatternsService;
    this.aiCoachingOrchestrator = aiCoachingOrchestrator;
    this.settings = {
      confidenceThreshold: 0.6,
      maxHistorySize: 1000,
      patternDetectionMinDataPoints: 5,
      overfittingPrevention: {
        maxFeedbackWeightPerExercise: 0.3,
        temporalDecay: 0.1,
        diversityThreshold: 0.7
      },
      privacy: {
        retentionDays: 365,
        anonymizationLevel: 'basic',
        allowPatternSharing: true
      },
      visualization: {
        showConfidenceIntervals: true,
        showHistoricalTrends: true,
        showCorrelationFactors: true
      },
      ...settings
    };
  }

  /**
   * Integrate feedback with preference learning service
   */
  async integrateFeedbackWithPreferences(feedback: FeedbackData): Promise<void> {
    try {
      // Get current recommendation to understand baseline
      const currentRecommendation = await this.aiCoachingOrchestrator.getCurrentRecommendation(feedback.exerciseId);
      
      // Get historical context
      const historicalContext = await this.historicalPatternsService.getExerciseHistory(feedback.exerciseId);
      const historicalPatterns = await this.historicalPatternsService.detectPatterns(feedback.exerciseId);
      
      // Calculate preference adjustments based on feedback
      const preferenceAdjustments = this.calculatePreferenceAdjustments(feedback, historicalContext, historicalPatterns);
      
      // Update preference learning service
      await this.preferenceLearningService.updatePreferences(
        feedback.exerciseId, // Use exerciseId as userId for this context
        {
          difficultyLevel: preferenceAdjustments.difficultyAdjustment,
          volumeLevel: preferenceAdjustments.volumeAdjustment,
          confidence: preferenceAdjustments.confidence,
          lastUpdated: new Date().toISOString()
        }
      );
      
      
    } catch (error) {
      throw new Error(`Failed to integrate feedback ${feedback.id} for exercise ${feedback.exerciseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Modify AI coaching recommendations based on feedback
   */
  async modifyRecommendations(feedback: FeedbackData, impact: FeedbackImpact): Promise<void> {
    try {
      // Only apply modifications if confidence meets threshold
      if (impact.confidence >= this.settings.confidenceThreshold) {
        await this.aiCoachingOrchestrator.applyFeedbackImpact(impact);
        
        // Create feedback impact record for visualization
        this.createImpactRecord(impact);
        
        
      } else {
        
      }
    } catch (error) {
      throw new Error(`Failed to modify recommendations for feedback ${feedback.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create feedback impact from feedback data and current recommendation
   */
  createFeedbackImpact(feedback: FeedbackData, currentRecommendation: {
    id: string;
    exerciseId: string;
    weight: number;
    reps: number;
    sets: number;
  }): FeedbackImpact {
    // Validate feedback data first
    this.validateFeedbackData(feedback);
    
    // Calculate adjustments based on feedback
    const weightAdjustment = this.calculateWeightAdjustment(feedback, currentRecommendation);
    const repsAdjustment = this.calculateRepsAdjustment(feedback, currentRecommendation);
    
    const originalWeight = currentRecommendation.weight;
    const originalReps = currentRecommendation.reps;
    
    // Apply safety limits
    const maxWeightChange = originalWeight * this.settings.overfittingPrevention.maxFeedbackWeightPerExercise;
    const actualWeightChange = Math.max(-maxWeightChange, Math.min(maxWeightChange, weightAdjustment));
    
    const adjustedWeight = Math.max(0, originalWeight + actualWeightChange);
    const adjustedReps = Math.max(1, Math.round(originalReps + repsAdjustment));
    
    // Calculate confidence
    const confidence = this.calculateFeedbackConfidence(feedback, currentRecommendation);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(feedback, weightAdjustment, repsAdjustment, confidence);
    
    return {
      recommendationId: currentRecommendation.id,
      originalWeight,
      originalReps,
      adjustedWeight,
      adjustedReps,
      confidence,
      reasoning,
      feedbackSources: [feedback.id]
    };
  }

  /**
   * Process feedback through complete integration workflow
   */
  async processFeedbackWorkflow(feedback: FeedbackData): Promise<{
    impact?: FeedbackImpact;
    success: boolean;
    error?: string;
  }> {
    this.integrationMetrics.totalFeedbackProcessed++;
    
    try {
      // Step 1: Validate feedback
      this.validateFeedbackData(feedback);
      
      // Step 2: Get current recommendation
      const currentRecommendation = await this.aiCoachingOrchestrator.getCurrentRecommendation(feedback.exerciseId);
      
      if (!currentRecommendation) {
        this.integrationMetrics.errors++;
        return {
          success: false,
          error: 'No current recommendation found for exercise'
        };
      }
      
      // Step 3: Create impact analysis
      const impact = this.createFeedbackImpact(feedback, currentRecommendation);
      
      // Step 4: Integrate with preference learning (REAL INTEGRATION)
      await this.integrateFeedbackWithPreferences(feedback);
      this.integrationMetrics.successfulIntegrations++;
      
      // Step 5: Apply modifications if confidence is sufficient
      if (impact.confidence >= this.settings.confidenceThreshold) {
        await this.modifyRecommendations(feedback, impact);
        this.integrationMetrics.modificationsApplied++;
      }
      
      return {
        impact,
        success: true
      };
      
} catch (error) {
      throw new Error(`Failed to integrate feedback ${feedback.id} for exercise ${feedback.exerciseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private integrationMetrics = {
    totalFeedbackProcessed: 0,
    successfulIntegrations: 0,
    modificationsApplied: 0,
    errors: 0
  };

  /**
   * Get integration status and metrics
   */
  getIntegrationMetrics(): {
    totalFeedbackProcessed: number;
    averageConfidence: number;
    modificationRate: number;
    errorRate: number;
  } {
    const total = this.integrationMetrics.totalFeedbackProcessed;
    return {
      totalFeedbackProcessed: total,
      averageConfidence: total > 0 ? this.integrationMetrics.successfulIntegrations / total : 0,
      modificationRate: total > 0 ? this.integrationMetrics.modificationsApplied / total : 0,
      errorRate: total > 0 ? this.integrationMetrics.errors / total : 0
    };
  }

  // Private helper methods

  private calculatePreferenceAdjustments(
    feedback: FeedbackData,
    historicalContext: any[],
    patterns: any[]
  ): {
    difficultyAdjustment: number;
    volumeAdjustment: number;
    frequencyAdjustment: number;
    confidence: number;
  } {
    // Base adjustments from feedback
    let difficultyAdjustment = 0;
    let volumeAdjustment = 0;
    let frequencyAdjustment = 0;
    
    switch (feedback.type) {
      case FeedbackType.DIFFICULTY_RATING:
        difficultyAdjustment = (feedback.rating - 3) * 0.2; // Scale to preference adjustment
        break;
      case FeedbackType.ENERGY_LEVEL:
        volumeAdjustment = (feedback.rating - 3) * 0.15;
        break;
      case FeedbackType.COMFORT_LEVEL:
        frequencyAdjustment = (feedback.rating - 3) * 0.1;
        break;
      case FeedbackType.PAIN_FEEDBACK:
        if (feedback.rating > 3) {
          difficultyAdjustment = -0.3; // Reduce difficulty for pain
          volumeAdjustment = -0.2;
        }
        break;
      case FeedbackType.TECHNIQUE_FEEDBACK:
        if (feedback.rating < 3) {
          difficultyAdjustment = -0.15; // Reduce difficulty for poor technique
        }
        break;
    }
    
    // Apply confidence weighting
    const baseConfidence = this.calculateFeedbackConfidence(feedback, null as any);
    
    // Apply overfitting prevention
    const maxAdjustment = this.settings.overfittingPrevention.maxFeedbackWeightPerExercise;
    difficultyAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, difficultyAdjustment));
    volumeAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, volumeAdjustment));
    frequencyAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, frequencyAdjustment));
    
    return {
      difficultyAdjustment,
      volumeAdjustment,
      frequencyAdjustment,
      confidence: baseConfidence
    };
  }

  private calculateWeightAdjustment(feedback: FeedbackData, currentRecommendation: any): number {
    if (feedback.type !== FeedbackType.DIFFICULTY_RATING) return 0;
    
    const desiredChange = (feedback.rating - 3) * 0.1; // 10% adjustment per rating point
    return currentRecommendation.weight * desiredChange;
  }

  private calculateRepsAdjustment(feedback: FeedbackData, currentRecommendation: any): number {
    if (feedback.type !== FeedbackType.ENERGY_LEVEL) return 0;
    
    const energyMultiplier = feedback.rating / 3; // Energy affects capacity
    return Math.round(currentRecommendation.reps * (energyMultiplier - 1) * 0.2);
  }

  private calculateFeedbackConfidence(feedback: FeedbackData, currentRecommendation: any): number {
    let confidence = 0.5; // Base confidence
    
    // Pain feedback gets higher base confidence due to safety implications
    if (feedback.type === FeedbackType.PAIN_FEEDBACK) {
      confidence = 0.7; // Higher base confidence for pain feedback
    }
    
    // Context-based confidence
    if (feedback.context) {
      const contextFields = Object.keys(feedback.context).length;
      confidence += Math.min(contextFields * 0.1, 0.3);
    }
    
    // Comments-based confidence
    if (feedback.comments && feedback.comments.length > 10) {
      confidence += 0.1;
    }
    
    // Tags-based confidence
    if (feedback.tags && feedback.tags.length > 0) {
      confidence += 0.1;
    }
    
    // Priority-based confidence
    if (feedback.priority === 'high') confidence += 0.2;
    else if (feedback.priority === 'medium') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateReasoning(
    feedback: FeedbackData,
    weightChange: number,
    repsChange: number,
    confidence: number
  ): string[] {
    const reasoning: string[] = [];
    
    if (feedback.type === FeedbackType.DIFFICULTY_RATING) {
      if (weightChange > 0) {
        reasoning.push(`User rated difficulty ${feedback.rating}/5 - increasing weight for progression`);
      } else if (weightChange < 0) {
        reasoning.push(`User rated difficulty ${feedback.rating}/5 - decreasing weight for manageability`);
      }
    }
    
    if (feedback.type === FeedbackType.PAIN_FEEDBACK) {
      if (feedback.rating >= 4) {
        reasoning.push(`High pain reported (${feedback.rating}/5) - reducing intensity for safety`);
        reasoning.push(`Safety override triggered due to high pain feedback`);
      }
    }
    
    if (confidence < this.settings.confidenceThreshold) {
      reasoning.push(`Low confidence (${confidence.toFixed(2)}) - minimal adjustment applied`);
    }
    
    return reasoning;
  }

  private validateFeedbackData(feedback: FeedbackData): void {
    if (!feedback.id || !feedback.exerciseId || !feedback.workoutId) {
      throw new Error('Invalid feedback data: missing required fields');
    }
    
    if (feedback.rating < 1 || feedback.rating > 5) {
      throw new Error('Invalid feedback data: rating must be between 1 and 5');
    }
    
    if (!Object.values(FeedbackType).includes(feedback.type)) {
      throw new Error('Invalid feedback data: unknown feedback type');
    }
  }

  private createImpactRecord(impact: FeedbackImpact): void {
    // Store impact record for visualization and analysis
    // This would integrate with a tracking service
    console.log('Created feedback impact record:', {
      recommendationId: impact.recommendationId,
      weightChange: impact.adjustedWeight - impact.originalWeight,
      repsChange: impact.adjustedReps - impact.originalReps,
      confidence: impact.confidence,
      reasoning: impact.reasoning.join(', ')
    });
  }
}