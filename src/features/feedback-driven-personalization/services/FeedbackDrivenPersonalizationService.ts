import {
  FeedbackData,
  FeedbackProcessingResult,
  FeedbackType,
  FeedbackPattern,
  EnhancedPatternData,
  FeedbackValidationResult,
  FeedbackConflictResolution,
  FeedbackSettings,
  FeedbackContext,
  SafetyOverrideEvent
} from '../types/feedbackPersonalization.types';

export class FeedbackDrivenPersonalizationService {
  private feedbackHistory: FeedbackData[] = [];
  private patterns: Map<string, FeedbackPattern> = new Map();
  private settings: FeedbackSettings;
  private safetyOverrideCallback?: (override: SafetyOverrideEvent) => void;

  constructor(settings?: Partial<FeedbackSettings>) {
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
   * Collect and process a single piece of feedback
   */
  collectFeedback(feedbackData: FeedbackData): FeedbackProcessingResult {
    const startTime = performance.now();

    try {
      // Validate feedback data
      const validation = this.validateFeedback(feedbackData);
      if (!validation.isValid) {
        return {
          success: false,
          feedbackId: feedbackData.id,
          confidenceScore: 0,
          processingTimestamp: new Date().toISOString(),
          error: validation.errors.join(', ')
        };
      }

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(feedbackData);

      // Add to history if confidence meets threshold
      if (confidenceScore >= this.settings.confidenceThreshold) {
        this.addToHistory(feedbackData);
      }

      const processingTime = performance.now() - startTime;

      // Validate 2-second real-time requirement
      if (processingTime > 2000) {
        console.warn(`PERFORMANCE WARNING: Feedback processing took ${processingTime.toFixed(2)}ms (exceeds 2s requirement)`);
      }

      return {
        success: true,
        feedbackId: feedbackData.id,
        confidenceScore,
        processingTimestamp: new Date().toISOString(),
          metadata: {
            processingTime: Math.round(processingTime),
            contextualFactors: this.extractContextualFactors(feedbackData.context),
            appliedWeights: this.calculateAppliedWeights(feedbackData),
            performanceCompliant: processingTime <= 2000
          }
      };
    } catch (error) {
      return {
        success: false,
        feedbackId: feedbackData.id,
        confidenceScore: 0,
        processingTimestamp: new Date().toISOString(),
        error: error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process multiple feedback items as a batch
   */
  async processFeedbackBatch(feedbackBatch: FeedbackData[]): Promise<FeedbackProcessingResult[]> {
    const results: FeedbackProcessingResult[] = [];

    for (const feedback of feedbackBatch) {
      // Add small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 1));
      results.push(this.collectFeedback(feedback));
    }

    return results;
  }

  /**
   * Get all feedback history
   */
  getFeedbackHistory(): FeedbackData[] {
    return [...this.feedbackHistory];
  }

  /**
   * Get feedback history for a specific exercise
   */
  getFeedbackForExercise(exerciseId: string): FeedbackData[] {
    return this.feedbackHistory.filter(feedback => feedback.exerciseId === exerciseId);
  }

  /**
   * Get feedback history for a specific type
   */
  getFeedbackByType(type: FeedbackType): FeedbackData[] {
    return this.feedbackHistory.filter(feedback => feedback.type === type);
  }

  /**
   * Detect patterns in feedback data
   */
  detectPatterns(exerciseId: string, feedbackType: FeedbackType): FeedbackPattern | null {
    const relevantFeedback = this.feedbackHistory.filter(
      feedback => feedback.exerciseId === exerciseId && feedback.type === feedbackType
    );

    if (relevantFeedback.length < this.settings.patternDetectionMinDataPoints) {
      return null;
    }

    // Enhanced pattern detection using statistical analysis + ML-inspired algorithms
    const ratings = relevantFeedback.map(f => f.rating);
    const trend = this.calculateTrend(ratings);
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(ratings);

    // Advanced correlation analysis
    const correlationFactors = this.analyzeCorrelations(relevantFeedback);
    
    // Enhanced pattern detection using multiple algorithms
    const volatilityIndex = this.calculateVolatility(ratings);
    const seasonalityPatterns = this.detectSeasonality(relevantFeedback);
    const momentumIndicator = this.calculateMomentum(ratings);
    
    // Combine all pattern insights
    const enhancedPattern: EnhancedPatternData = {
      trend,
      averageRating,
      confidenceInterval,
      correlationFactors,
      volatilityIndex,
      seasonalityPatterns,
      momentumIndicator,
      algorithmConfidence: this.calculatePatternConfidence(ratings.length, volatilityIndex)
    };

    const pattern: FeedbackPattern = {
      id: `${exerciseId}-${feedbackType}-pattern`,
      exerciseId,
      feedbackType,
      pattern: enhancedPattern,
      dataPoints: relevantFeedback.length,
      lastUpdated: new Date().toISOString()
    };

    this.patterns.set(pattern.id, pattern);
    return pattern;
  }

  /**
   * Validate feedback data structure and content
   */
  validateFeedback(feedback: FeedbackData): FeedbackValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Required fields validation
    if (!feedback.id || feedback.id.trim() === '') {
      errors.push('Feedback ID is required');
    }

    if (!feedback.workoutId || feedback.workoutId.trim() === '') {
      errors.push('Workout ID is required');
    }

    if (!feedback.exerciseId || feedback.exerciseId.trim() === '') {
      errors.push('Exercise ID is required');
    }

    if (!Object.values(FeedbackType).includes(feedback.type)) {
      errors.push('Invalid feedback type');
    }

    if (typeof feedback.rating !== 'number' || feedback.rating < 1 || feedback.rating > 5) {
      errors.push('Rating must be a number between 1 and 5');
    }

    if (!feedback.timestamp || isNaN(Date.parse(feedback.timestamp))) {
      errors.push('Valid timestamp is required');
    }

    // Content validation
    if (feedback.rating === 1 && !feedback.comments) {
      warnings.push('Low rating without comments may not provide actionable feedback');
      recommendations.push('Consider adding comments to explain the low rating');
    }

    if (feedback.context && feedback.context.currentWeight && feedback.context.currentReps) {
      const estimated1RM = feedback.context.currentWeight * (1 + feedback.context.currentReps / 30);
      if (estimated1RM > 1000) { // Sanity check for unreasonable weights
        warnings.push('Weight values seem unusually high');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate confidence score for feedback based on context and data quality
   */
  private calculateConfidenceScore(feedback: FeedbackData): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for detailed context
    if (feedback.context) {
      const contextFields = Object.keys(feedback.context).length;
      confidence += Math.min(contextFields * 0.1, 0.3); // Max 0.3 from context
    }

    // Increase confidence for comments
    if (feedback.comments && feedback.comments.length > 10) {
      confidence += 0.1;
    }

    // Apply temporal decay for older feedback
    const feedbackAge = Date.now() - new Date(feedback.timestamp).getTime();
    const daysOld = feedbackAge / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-this.settings.overfittingPrevention.temporalDecay * daysOld);
    confidence *= decayFactor;

    return Math.min(confidence, 1.0);
  }

  /**
   * Add feedback to history while managing size limits
   */
  private addToHistory(feedback: FeedbackData): void {
    this.feedbackHistory.push(feedback);

    // Maintain history size limit
    if (this.feedbackHistory.length > this.settings.maxHistorySize) {
      // Remove oldest feedback, but keep recent items (last 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentFeedback = this.feedbackHistory.filter(f => 
        new Date(f.timestamp).getTime() > sevenDaysAgo
      );
      
      const oldFeedback = this.feedbackHistory.filter(f => 
        new Date(f.timestamp).getTime() <= sevenDaysAgo
      );

      if (recentFeedback.length <= this.settings.maxHistorySize) {
        // Keep all recent, remove oldest from old
        const toRemove = oldFeedback.length - (this.settings.maxHistorySize - recentFeedback.length);
        if (toRemove > 0) {
          this.feedbackHistory = [...recentFeedback, ...oldFeedback.slice(toRemove)];
        }
      }
    }
  }

  /**
   * Calculate trend from a series of ratings
   */
  private calculateTrend(ratings: number[]): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (ratings.length < 3) return 'stable';

    const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
    const secondHalf = ratings.slice(Math.floor(ratings.length / 2));

    const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    if (Math.abs(difference) < 0.3) return 'stable';
    if (difference > 0.5) return 'increasing';
    if (difference < -0.5) return 'decreasing';
    return 'fluctuating';
  }

  /**
   * Calculate confidence interval for ratings
   */
  private calculateConfidenceInterval(ratings: number[]): [number, number] {
    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);
    const margin = 1.96 * (stdDev / Math.sqrt(ratings.length)); // 95% confidence interval

    return [mean - margin, mean + margin];
  }

  /**
   * Analyze correlations between feedback and contextual factors
   */
  private analyzeCorrelations(feedback: FeedbackData[]): Array<{factor: string; correlation: number; significance: number}> {
    const correlations: Array<{factor: string; correlation: number; significance: number}> = [];

    if (feedback.length < 3) return correlations;

    // Analyze correlation with fatigue level
    const fatigueData = feedback
      .filter(f => f.context?.userFatigue !== undefined)
      .map(f => ({ rating: f.rating, fatigue: f.context!.userFatigue! }));

    if (fatigueData.length >= 3) {
      const correlation = this.calculateCorrelation(
        fatigueData.map(d => d.rating),
        fatigueData.map(d => d.fatigue)
      );
      correlations.push({
        factor: 'fatigue_level',
        correlation: correlation * -1, // Higher fatigue -> lower ratings expected
        significance: Math.min(fatigueData.length / feedback.length, 1.0)
      });
    }

    // Analyze correlation with weight
    const weightData = feedback
      .filter(f => f.context?.currentWeight !== undefined)
      .map(f => ({ rating: f.rating, weight: f.context!.currentWeight! }));

    if (weightData.length >= 3) {
      const weightCorrelation = this.calculateCorrelation(
        weightData.map(d => d.rating),
        weightData.map(d => d.weight)
      );
      correlations.push({
        factor: 'weight',
        correlation: weightCorrelation,
        significance: Math.min(weightData.length / feedback.length, 1.0)
      });
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 5);
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const xMean = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let xSumSq = 0;
    let ySumSq = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xSumSq += xDiff * xDiff;
      ySumSq += yDiff * yDiff;
    }

    const denominator = Math.sqrt(xSumSq * ySumSq);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Extract relevant contextual factors from feedback
   */
  private extractContextualFactors(context?: FeedbackContext): string[] {
    if (!context) return [];

    const factors: string[] = [];
    
    if (context.currentWeight !== undefined) factors.push('weight');
    if (context.currentReps !== undefined) factors.push('reps');
    if (context.userFatigue !== undefined) factors.push('fatigue');
    if (context.timeOfDay !== undefined) factors.push('time_of_day');
    if (context.heartRateZones?.current !== undefined) factors.push('heart_rate');
    if (context.environmental?.temperature !== undefined) factors.push('temperature');

    return factors;
  }

  /**
   * Calculate applied weights for feedback processing
   */
  private calculateAppliedWeights(feedback: FeedbackData): Record<string, number> {
    const weights: Record<string, number> = {
      rating: 0.6,
      context: 0.3,
      comments: 0.1
    };

    // Adjust weights based on feedback characteristics
    if (feedback.comments && feedback.comments.length > 20) {
      weights.comments = 0.2;
      weights.context = 0.2;
    }

    if (feedback.context && Object.keys(feedback.context).length > 2) {
      weights.context = 0.4;
      weights.rating = 0.5;
    }

    return weights;
  }

  /**
    * Set safety override callback for integration with injury-aware system
    */
  setSafetyOverrideCallback(callback: (override: SafetyOverrideEvent) => void): void {
    this.safetyOverrideCallback = callback;
  }

  /**
    * Trigger safety override when high pain is detected
    */
  private triggerSafetyOverride(override: SafetyOverrideEvent): void {
    if (this.safetyOverrideCallback) {
      this.safetyOverrideCallback(override);
    }
    console.warn('SAFETY OVERRIDE TRIGGERED:', override);
  }

  /**
    * Get current settings
    */
  getSettings(): FeedbackSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<FeedbackSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Clear all feedback history and patterns
   */
  clearHistory(): void {
    this.feedbackHistory = [];
    this.patterns.clear();
  }

  /**
   * Convert feedback to preference adjustments
   */
  convertFeedbackToPreferences(exerciseId: string): {
    difficultyAdjustment: number;
    volumeAdjustment: number;
    frequencyAdjustment: number;
    confidence: number;
    reasoning: string[];
  } {
    const exerciseFeedback = this.getFeedbackForExercise(exerciseId);
    if (exerciseFeedback.length === 0) {
      return {
        difficultyAdjustment: 0,
        volumeAdjustment: 0,
        frequencyAdjustment: 0,
        confidence: 0,
        reasoning: ['No feedback available for exercise']
      };
    }

    // Group feedback by type and calculate weighted averages
    const feedbackByType = this.groupFeedbackByType(exerciseFeedback);
    const reasoning: string[] = [];
    let difficultyAdjustment = 0;
    let volumeAdjustment = 0;
    let frequencyAdjustment = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    // Process difficulty ratings
    if (feedbackByType[FeedbackType.DIFFICULTY_RATING]) {
      const difficultyFeedback = feedbackByType[FeedbackType.DIFFICULTY_RATING];
      const avgRating = this.calculateWeightedAverage(difficultyFeedback);
      const difficulty = (avgRating - 3) * 0.2; // Scale: -0.4 to +0.4
      difficultyAdjustment = Math.max(-0.3, Math.min(0.3, difficulty)); // Clamp to max adjustment
      
      const confidence = this.calculateFeedbackConfidence(difficultyFeedback);
      totalConfidence += confidence;
      confidenceCount++;

      reasoning.push(
        `Difficulty rating average: ${avgRating.toFixed(2)} (${confidence.toFixed(2)} confidence)`
      );
    }

    // Process energy levels
    if (feedbackByType[FeedbackType.ENERGY_LEVEL]) {
      const energyFeedback = feedbackByType[FeedbackType.ENERGY_LEVEL];
      const avgEnergy = this.calculateWeightedAverage(energyFeedback);
      const energyImpact = (avgEnergy - 3) * 0.15; // Energy affects volume
      volumeAdjustment += Math.max(-0.2, Math.min(0.2, energyImpact));
      
      const confidence = this.calculateFeedbackConfidence(energyFeedback);
      totalConfidence += confidence;
      confidenceCount++;

      reasoning.push(
        `Energy level average: ${avgEnergy.toFixed(2)} (${confidence.toFixed(2)} confidence)`
      );
    }

    // Process comfort levels
    if (feedbackByType[FeedbackType.COMFORT_LEVEL]) {
      const comfortFeedback = feedbackByType[FeedbackType.COMFORT_LEVEL];
      const avgComfort = this.calculateWeightedAverage(comfortFeedback);
      const comfortImpact = (avgComfort - 3) * 0.1; // Comfort affects frequency
      frequencyAdjustment += Math.max(-0.15, Math.min(0.15, comfortImpact));
      
      const confidence = this.calculateFeedbackConfidence(comfortFeedback);
      totalConfidence += confidence;
      confidenceCount++;

      reasoning.push(
        `Comfort level average: ${avgComfort.toFixed(2)} (${confidence.toFixed(2)} confidence)`
      );
    }

    // Process pain feedback (safety override)
    if (feedbackByType[FeedbackType.PAIN_FEEDBACK]) {
      const painFeedback = feedbackByType[FeedbackType.PAIN_FEEDBACK];
      const avgPain = this.calculateWeightedAverage(painFeedback);
      
      if (avgPain <= 2) {
        // Low pain might indicate exercise is too easy
        difficultyAdjustment += 0.1;
        reasoning.push('Low pain reported - exercise may be too easy');
      } else if (avgPain >= 4) {
        // High pain requires significant reduction and safety override
        difficultyAdjustment -= 0.25;
        volumeAdjustment -= 0.2;
        reasoning.push('High pain reported - significant reduction needed for safety');
        
        // TRIGGER SAFETY OVERRIDE: Integrate with injury-aware system
        this.triggerSafetyOverride({
          exerciseId,
          painLevel: avgPain,
          recommendation: 'immediate_reduction',
          severity: avgPain >= 4.5 ? 'critical' : 'high',
          timestamp: new Date().toISOString()
        });
      }
      
      const confidence = this.calculateFeedbackConfidence(painFeedback);
      totalConfidence += confidence;
      confidenceCount++;
    }

    // Process technique feedback
    if (feedbackByType[FeedbackType.TECHNIQUE_FEEDBACK]) {
      const techniqueFeedback = feedbackByType[FeedbackType.TECHNIQUE_FEEDBACK];
      const avgTechnique = this.calculateWeightedAverage(techniqueFeedback);
      
      if (avgTechnique < 3) {
        // Poor technique suggests reduce difficulty
        difficultyAdjustment -= 0.15;
        reasoning.push('Technique feedback indicates form issues - reducing difficulty');
      }
      
      const confidence = this.calculateFeedbackConfidence(techniqueFeedback);
      totalConfidence += confidence;
      confidenceCount++;
    }

    // Calculate overall confidence
    const overallConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    // Apply overfitting prevention
    const maxAdjustment = this.settings.overfittingPrevention.maxFeedbackWeightPerExercise;
    difficultyAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, difficultyAdjustment));
    volumeAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, volumeAdjustment));
    frequencyAdjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, frequencyAdjustment));

    // Apply temporal decay
    const timeWeight = this.calculateTimeWeight(exerciseFeedback);
    difficultyAdjustment *= timeWeight;
    volumeAdjustment *= timeWeight;
    frequencyAdjustment *= timeWeight;

    return {
      difficultyAdjustment,
      volumeAdjustment,
      frequencyAdjustment,
      confidence: overallConfidence * timeWeight,
      reasoning
    };
  }

  /**
   * Detect and resolve conflicting feedback
   */
  resolveConflictingFeedback(exerciseId: string): FeedbackConflictResolution | null {
    const exerciseFeedback = this.getFeedbackForExercise(exerciseId);
    if (exerciseFeedback.length < 2) return null;

    // Look for conflicting patterns
    const conflicts = this.identifyConflicts(exerciseFeedback);
    if (conflicts.length === 0) return null;

    // Use majority vote with confidence weighting
    const resolution = this.resolveByWeightedMajority(conflicts);

    return {
      conflictingFeedbacks: conflicts.map(c => c.feedbackId),
      resolutionStrategy: 'weighted_confidence',
      resolvedFeedback: resolution.resolvedFeedback,
      conflictReason: resolution.reason
    };
  }

  /**
   * Get preference recommendations based on feedback patterns
   */
  getPreferenceRecommendations(exerciseId: string): {
    recommendations: Array<{
      type: 'difficulty' | 'volume' | 'frequency' | 'technique' | 'safety';
      suggestion: string;
      confidence: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    summary: string;
  } {
    const preferences = this.convertFeedbackToPreferences(exerciseId);
    const patterns = this.detectPatterns(exerciseId, FeedbackType.DIFFICULTY_RATING);
    
    const recommendations: Array<{
      type: 'difficulty' | 'volume' | 'frequency' | 'technique' | 'safety';
      suggestion: string;
      confidence: number;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Difficulty recommendations
    if (Math.abs(preferences.difficultyAdjustment) > 0.1) {
      recommendations.push({
        type: 'difficulty',
        suggestion: preferences.difficultyAdjustment > 0 
          ? 'Consider increasing difficulty for better progression'
          : 'Reduce difficulty to match current capability',
        confidence: preferences.confidence,
        priority: Math.abs(preferences.difficultyAdjustment) > 0.2 ? 'high' : 'medium'
      });
    }

    // Volume recommendations
    if (Math.abs(preferences.volumeAdjustment) > 0.1) {
      recommendations.push({
        type: 'volume',
        suggestion: preferences.volumeAdjustment > 0
          ? 'Increase training volume for better adaptation'
          : 'Reduce volume to prevent overtraining',
        confidence: preferences.confidence,
        priority: Math.abs(preferences.volumeAdjustment) > 0.15 ? 'high' : 'medium'
      });
    }

    // Safety recommendations
    const painFeedback = this.getFeedbackForExercise(exerciseId).filter((f: FeedbackData) => f.type === FeedbackType.PAIN_FEEDBACK);
    if (painFeedback.length > 0) {
      const avgPain = this.calculateWeightedAverage(painFeedback);
      if (avgPain > 3) {
        recommendations.push({
          type: 'safety',
          suggestion: 'High pain reported - consider exercise modification or rest',
          confidence: preferences.confidence,
          priority: 'high'
        });
      }
    }

    // Pattern-based recommendations
    if (patterns) {
      if (patterns.pattern.trend === 'decreasing' && patterns.pattern.averageRating < 3) {
        recommendations.push({
          type: 'technique',
          suggestion: 'Declining satisfaction detected - review exercise technique',
          confidence: 0.7,
          priority: 'medium'
        });
      }
    }

    const summary = preferences.reasoning.join('. ') + '.';

    return { recommendations, summary };
  }

  // Private helper methods
  private groupFeedbackByType(feedback: FeedbackData[]): Record<FeedbackType, FeedbackData[]> {
    const grouped: Record<FeedbackType, FeedbackData[]> = {} as any;
    
    feedback.forEach((item: FeedbackData) => {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    });

    return grouped;
  }

  private calculateWeightedAverage(feedback: FeedbackData[]): number {
    if (feedback.length === 0) return 0;

    const weightedSum = feedback.reduce((sum, item) => {
      const weight = this.calculateConfidenceScore(item);
      return sum + (item.rating * weight);
    }, 0);

    const totalWeight = feedback.reduce((sum, item) => sum + this.calculateConfidenceScore(item), 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateFeedbackConfidence(feedback: FeedbackData[]): number {
    const confidences = feedback.map(item => this.calculateConfidenceScore(item));
    return confidences.reduce((sum, conf) => sum + conf, 0) / feedback.length;
  }

  private calculateTimeWeight(feedback: FeedbackData[]): number {
    if (feedback.length === 0) return 1;

    const now = Date.now();
    const ages = feedback.map(item => {
      const age = now - new Date(item.timestamp).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      return Math.exp(-this.settings.overfittingPrevention.temporalDecay * daysOld);
    });

    return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }

  private identifyConflicts(feedback: FeedbackData[]): Array<{feedbackId: string; type: string; description: string}> {
    const conflicts: Array<{feedbackId: string; type: string; description: string}> = [];

    // Check for conflicting difficulty vs pain feedback
    const difficultyFeedback = feedback.filter(f => f.type === FeedbackType.DIFFICULTY_RATING);
    const painFeedback = feedback.filter(f => f.type === FeedbackType.PAIN_FEEDBACK);

    if (difficultyFeedback.length > 0 && painFeedback.length > 0) {
      const avgDifficulty = this.calculateWeightedAverage(difficultyFeedback);
      const avgPain = this.calculateWeightedAverage(painFeedback);

      // Conflict: High difficulty but low pain, or low difficulty but high pain
      if (avgDifficulty > 4 && avgPain < 2) {
        conflicts.push({
          feedbackId: difficultyFeedback[0].id,
          type: 'difficulty_vs_pain',
          description: 'High difficulty reported with low pain'
        });
      } else if (avgDifficulty < 2 && avgPain > 4) {
        conflicts.push({
          feedbackId: painFeedback[0].id,
          type: 'difficulty_vs_pain',
          description: 'High pain reported with low difficulty'
        });
      }
    }

    // Check for conflicting energy vs motivation
    const energyFeedback = feedback.filter(f => f.type === FeedbackType.ENERGY_LEVEL);
    const motivationFeedback = feedback.filter(f => f.type === FeedbackType.MOTIVATION_LEVEL);

    if (energyFeedback.length > 0 && motivationFeedback.length > 0) {
      const avgEnergy = this.calculateWeightedAverage(energyFeedback);
      const avgMotivation = this.calculateWeightedAverage(motivationFeedback);

      if (Math.abs(avgEnergy - avgMotivation) > 2) {
        conflicts.push({
          feedbackId: energyFeedback[0].id,
          type: 'energy_vs_motivation',
          description: 'Energy and motivation levels significantly different'
        });
      }
    }

    return conflicts;
  }

  private resolveByWeightedMajority(conflicts: Array<{feedbackId: string; type: string; description: string}>): {
    resolvedFeedback: FeedbackData;
    reason: string;
  } {
    // This is a simplified resolution strategy
    // In practice, this would be more sophisticated and potentially use ML
    
    const reason = conflicts.map(c => c.description).join('; ');
    
    // For now, return a generic resolved feedback
    // In a real implementation, this would create a merged/averaged feedback
    const resolvedFeedback: FeedbackData = {
      id: `resolved-${Date.now()}`,
      workoutId: 'conflict-resolution',
      exerciseId: 'conflict-resolution',
      type: FeedbackType.DIFFICULTY_RATING,
      rating: 3, // Neutral rating after conflict resolution
      timestamp: new Date().toISOString(),
      comments: `Auto-resolved from conflicting feedback: ${reason}`,
      priority: 'medium'
    };

    return {
      resolvedFeedback,
      reason: `Conflicts detected and auto-resolved: ${reason}`
    };
  }

  /**
   * Calculate volatility index for pattern detection
   */
  private calculateVolatility(ratings: number[]): number {
    if (ratings.length < 2) return 0;
    
    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of variation as volatility measure
    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Detect seasonal patterns in feedback
   */
  private detectSeasonality(feedback: FeedbackData[]): Array<{period: string; pattern: string}> {
    if (feedback.length < 10) return [];
    
    const byTimeOfDay = {
      morning: [],
      afternoon: [],
      evening: []
    } as Record<string, number[]>;
    
    feedback.forEach(f => {
      const hour = new Date(f.timestamp).getHours();
      const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      byTimeOfDay[period].push(f.rating);
    });
    
    const patterns: Array<{period: string; pattern: string}> = [];
    
    Object.entries(byTimeOfDay).forEach(([period, ratings]) => {
      if (ratings.length >= 3) {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        patterns.push({
          period,
          pattern: avg >= 4 ? 'high_performance' : avg <= 2 ? 'low_performance' : 'moderate'
        });
      }
    });
    
    return patterns;
  }

  /**
   * Calculate momentum indicator for feedback trends
   */
  private calculateMomentum(ratings: number[]): number {
    if (ratings.length < 3) return 0;
    
    // Calculate momentum as weighted average of recent changes
    const recentRatings = ratings.slice(-5);
    let momentum = 0;
    
    for (let i = 1; i < recentRatings.length; i++) {
      momentum += (recentRatings[i] - recentRatings[i - 1]) * i;
    }
    
    return momentum / (recentRatings.length - 1);
  }

  /**
   * Calculate overall pattern confidence
   */
  private calculatePatternConfidence(dataPoints: number, volatility: number): number {
    let confidence = 0.5; // Base confidence
    
    // More data points = higher confidence
    confidence += Math.min(dataPoints / 50, 0.3);
    
    // Lower volatility = higher confidence
    confidence += Math.max(0, 0.2 - volatility);
    
    return Math.min(confidence, 1.0);
  }
}