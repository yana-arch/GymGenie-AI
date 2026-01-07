/**
 * Historical Patterns Service
 * Implements historical pattern recognition and analysis for workout adaptation tracking
 */

import type {
  IHistoricalPatternsService,
  WorkoutHistoryEntry,
  HistoricalPattern,
  PatternAnalysis,
  PatternInsight,
  PatternRecommendation,
  ConfidenceUpdate,
  HistoricalPatternConfig,
  IHistoricalDataAggregationService
} from './types/historicalPatterns.types';
import type { TensorFlowJSService } from '../preference-learning/types/preferenceLearning.types';
import { HistoricalPatternError } from './types/historicalPatterns.types';
import { 
  WorkoutHistoryEntrySchema, 
  HistoricalPatternSchema, 
  PatternAnalysisSchema 
} from './types/historicalPatterns.types';
import type { PrivacyPreservingStorage } from '../preference-learning/types/preferenceLearning.types';

export class HistoricalPatternsService implements IHistoricalPatternsService {
  private privacyService: PrivacyPreservingStorage;
  private tensorFlowService: TensorFlowJSService;
  private dataAggregationService: IHistoricalDataAggregationService;
  private config: HistoricalPatternConfig;

  constructor(dependencies: {
    privacyService: PrivacyPreservingStorage;
    tensorFlowService: TensorFlowJSService;
    dataAggregationService: IHistoricalDataAggregationService;
    config: HistoricalPatternConfig;
  }) {
    this.privacyService = dependencies.privacyService;
    this.tensorFlowService = dependencies.tensorFlowService;
    this.dataAggregationService = dependencies.dataAggregationService;
    this.config = dependencies.config;
  }

  /**
   * Analyze patterns from workout history
   */
  async analyzePatterns(userId: string, workoutHistory: WorkoutHistoryEntry[]): Promise<PatternAnalysis> {
    try {
      // Validate input
      this.validateWorkoutHistory(workoutHistory);

      // Check minimum data requirements
      if (workoutHistory.length < this.config.minWorkoutsForAnalysis) {
        return this.createInsufficientDataAnalysis(userId, workoutHistory.length);
      }

      // Calculate analysis period
      const sortedHistory = workoutHistory.sort((a, b) => 
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
      const analysisPeriod = {
        start: sortedHistory[0].completedAt,
        end: sortedHistory[sortedHistory.length - 1].completedAt
      };

      // Check minimum time span
      const timeSpanWeeks = this.calculateTimeSpanWeeks(analysisPeriod.start, analysisPeriod.end);
      if (timeSpanWeeks < this.config.minTimeSpanWeeks) {
        return this.createInsufficientTimeSpanAnalysis(userId, workoutHistory.length, timeSpanWeeks);
      }

      // Get existing patterns
      let existingPatterns: HistoricalPattern[] = [];
      let insights: PatternInsight[] = [];
      let recommendations: PatternRecommendation[] = [];
      
      // Perform pattern analysis with error handling
      const detectedPatterns: HistoricalPattern[] = [];
      const updatedPatterns: HistoricalPattern[] = [];
      const invalidatedPatterns: string[] = [];
      const confidenceUpdates: ConfidenceUpdate[] = [];

      try {
        existingPatterns = await this.getPatterns(userId);

        // Analyze adaptation trends
        const adaptationTrend = await this.analyzeAdaptationTrends(userId, workoutHistory, existingPatterns);
        if (adaptationTrend && adaptationTrend.confidence >= this.config.confidenceThreshold) {
          await this.processPatternResult(
            adaptationTrend,
            existingPatterns,
            detectedPatterns,
            updatedPatterns,
            invalidatedPatterns,
            confidenceUpdates
          );
        }

        // Analyze performance correlations
        const performanceCorrelation = await this.analyzePerformanceCorrelations(userId, workoutHistory, existingPatterns);
        if (performanceCorrelation && performanceCorrelation.confidence >= this.config.confidenceThreshold) {
          await this.processPatternResult(
            performanceCorrelation,
            existingPatterns,
            detectedPatterns,
            updatedPatterns,
            invalidatedPatterns,
            confidenceUpdates
          );
        }

        // Analyze exercise preferences
        const exercisePreference = await this.analyzeExercisePreferences(userId, workoutHistory, existingPatterns);
        if (exercisePreference && exercisePreference.confidence >= this.config.confidenceThreshold) {
          await this.processPatternResult(
            exercisePreference,
            existingPatterns,
            detectedPatterns,
            updatedPatterns,
            invalidatedPatterns,
            confidenceUpdates
          );
        }

        // Analyze intensity progression
        const intensityProgression = await this.analyzeIntensityProgression(userId, workoutHistory, existingPatterns);
        if (intensityProgression && intensityProgression.confidence >= this.config.confidenceThreshold) {
          await this.processPatternResult(
            intensityProgression,
            existingPatterns,
            detectedPatterns,
            updatedPatterns,
            invalidatedPatterns,
            confidenceUpdates
          );
        }

        // Generate insights and recommendations
        insights = await this.generateInsights(detectedPatterns, updatedPatterns, workoutHistory);
        recommendations = await this.generateRecommendations(detectedPatterns, updatedPatterns, insights);

        // If no patterns detected and no existing patterns, likely due to service failures
        if (detectedPatterns.length === 0 && updatedPatterns.length === 0 && existingPatterns.length === 0) {
          insights.push({
            type: 'analysis-error',
            insight: 'Pattern analysis encountered technical difficulties',
            supportingData: { error: 'All pattern analysis methods failed' },
            confidence: 0,
            actionable: false
          });
        }

      } catch (analysisError) {
        console.error('Error in pattern analysis:', analysisError);
        insights.push({
          type: 'analysis-error',
          insight: 'Pattern analysis encountered technical difficulties',
          supportingData: { error: analysisError instanceof Error ? analysisError.message : 'Unknown error' },
          confidence: 0,
          actionable: false
        });
        recommendations = [];
      }

      // Store new and updated patterns
      if (detectedPatterns.length > 0 || updatedPatterns.length > 0) {
        await this.storePatterns(userId, [...detectedPatterns, ...updatedPatterns]);
      }

      // Delete invalidated patterns
      if (invalidatedPatterns.length > 0) {
        await this.deleteInvalidatedPatterns(userId, invalidatedPatterns);
      }

      return {
        userId,
        analysisPeriod,
        totalWorkouts: workoutHistory.length,
        detectedPatterns,
        updatedPatterns,
        invalidatedPatterns,
        insights,
        recommendations,
        confidenceUpdates
      };

    } catch (error) {
      console.error('Error in pattern analysis:', error);
      
      return {
        userId,
        analysisPeriod: { start: new Date(), end: new Date() },
        totalWorkouts: workoutHistory.length,
        detectedPatterns: [],
        updatedPatterns: [],
        invalidatedPatterns: [],
        insights: [{
          type: 'analysis-error',
          insight: 'Pattern analysis encountered technical difficulties',
          supportingData: { error: error instanceof Error ? error.message : 'Unknown error' },
          confidence: 0,
          actionable: false
        }],
        recommendations: [],
        confidenceUpdates: []
      };
    }
  }

  /**
   * Get existing patterns for a user
   */
  async getPatterns(userId: string): Promise<HistoricalPattern[]> {
    try {
      // Add audit trail call
      await this.privacyService.auditTrail();
      
      const encryptedData = await this.privacyService.retrieve<string>(`gymgenie_historical_patterns-${userId}`);
      
      if (!encryptedData) {
        return [];
      }

      const patterns = await this.privacyService.decrypt<HistoricalPattern[]>(encryptedData);
      return Array.isArray(patterns) ? patterns : [];
    } catch (error) {
      console.error('Error retrieving historical patterns:', error);
      // Preserve original error message for decryption errors
      if (error instanceof Error && error.message.includes('Decryption failed')) {
        throw error;
      }
      throw new HistoricalPatternError(
        'Failed to retrieve historical patterns',
        'RETRIEVAL_ERROR',
        error
      );
    }
  }

  /**
   * Update existing pattern
   */
  async updatePattern(userId: string, patternId: string, updates: Partial<HistoricalPattern>): Promise<void> {
    // Validate updates before try block to throw validation errors directly
    this.validatePatternUpdates(updates);

    try {
      const existingPatterns = await this.getPatterns(userId);
      const updatedPatterns = existingPatterns.map(pattern => 
        pattern.id === patternId ? { ...pattern, ...updates } : pattern
      );

      await this.storePatterns(userId, updatedPatterns);
    } catch (error) {
      throw new HistoricalPatternError(
        'Failed to update historical pattern',
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Delete a specific pattern
   */
  async deletePattern(userId: string, patternId: string): Promise<void> {
    try {
      const existingPatterns = await this.getPatterns(userId);
      const filteredPatterns = existingPatterns.filter(pattern => pattern.id !== patternId);
      
      await this.storePatterns(userId, filteredPatterns);
    } catch (error) {
      throw new HistoricalPatternError(
        'Failed to delete historical pattern',
        'DELETE_ERROR',
        error
      );
    }
  }

  /**
   * Export encrypted patterns
   */
  async exportPatterns(userId: string): Promise<string> {
    try {
      const patterns = await this.getPatterns(userId);
      return await this.privacyService.encrypt(patterns);
    } catch (error) {
      throw new HistoricalPatternError(
        'Failed to export historical patterns',
        'EXPORT_ERROR',
        error
      );
    }
  }

  /**
   * Import encrypted patterns
   */
  async importPatterns(userId: string, encryptedData: string): Promise<void> {
    try {
      const importedPatterns = await this.privacyService.decrypt<HistoricalPattern[]>(encryptedData);
      
      if (!Array.isArray(importedPatterns)) {
        throw new HistoricalPatternError(
          'Invalid pattern data',
          'VALIDATION_ERROR',
          'Imported data must be an array'
        );
      }

      // Validate imported patterns
      for (const pattern of importedPatterns) {
        this.validateHistoricalPattern(pattern);
        // Update userId to match current user
        pattern.userId = userId;
      }

      await this.storePatterns(userId, importedPatterns);
    } catch (error) {
      if (error instanceof HistoricalPatternError) {
        throw error; // Re-throw validation errors directly
      }
      throw new HistoricalPatternError(
        'Failed to import historical patterns',
        'IMPORT_ERROR',
        error
      );
    }
  }

  /**
   * Private helper methods
   */

  private validateWorkoutHistory(workoutHistory: WorkoutHistoryEntry[]): void {
    for (const entry of workoutHistory) {
      try {
        WorkoutHistoryEntrySchema.parse(entry);
      } catch (error) {
        throw new HistoricalPatternError(
          'Invalid workout history entry',
          'VALIDATION_ERROR',
          error
        );
      }
    }
  }

  private createInsufficientDataAnalysis(userId: string, workoutCount: number): PatternAnalysis {
    return {
      userId,
      analysisPeriod: { start: new Date(), end: new Date() },
      totalWorkouts: workoutCount,
      detectedPatterns: [],
      updatedPatterns: [],
      invalidatedPatterns: [],
      insights: [{
        type: 'data-insufficiency',
        insight: `Insufficient workout history for pattern analysis. Current: ${workoutCount}, Required: ${this.config.minWorkoutsForAnalysis}`,
        supportingData: { currentWorkouts: workoutCount, requiredWorkouts: this.config.minWorkoutsForAnalysis },
        confidence: 1.0,
        actionable: false
      }],
      recommendations: [{
        type: 'training-adjustment',
        recommendation: 'Continue regular workouts to build sufficient history for pattern analysis',
        rationale: 'Pattern recognition requires sufficient data points',
        expectedImpact: 'Enable AI-driven insights about your workout evolution',
        confidence: 0.9,
        priority: 'medium'
      }],
      confidenceUpdates: []
    };
  }

  private createInsufficientTimeSpanAnalysis(userId: string, workoutCount: number, timeSpanWeeks: number): PatternAnalysis {
    return {
      userId,
      analysisPeriod: { start: new Date(), end: new Date() },
      totalWorkouts: workoutCount,
      detectedPatterns: [],
      updatedPatterns: [],
      invalidatedPatterns: [],
      insights: [{
        type: 'time-span-insufficiency',
        insight: `Insufficient time span for pattern analysis. Current: ${timeSpanWeeks} weeks, Required: ${this.config.minTimeSpanWeeks} weeks`,
        supportingData: { currentWeeks: timeSpanWeeks, requiredWeeks: this.config.minTimeSpanWeeks },
        confidence: 1.0,
        actionable: false
      }],
      recommendations: [{
        type: 'training-adjustment',
        recommendation: 'Continue consistent workouts over a longer period',
        rationale: 'Pattern recognition requires extended time period to detect trends',
        expectedImpact: 'Enable AI-driven insights about long-term fitness evolution',
        confidence: 0.9,
        priority: 'medium'
      }],
      confidenceUpdates: []
    };
  }

  private calculateTimeSpanWeeks(startDate: Date, endDate: Date): number {
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msInWeek);
  }

  private async analyzeAdaptationTrends(
    userId: string, 
    workoutHistory: WorkoutHistoryEntry[], 
    existingPatterns: HistoricalPattern[]
  ): Promise<HistoricalPattern | null> {
    try {
      const prediction = await this.tensorFlowService.predictPattern({
        type: 'adaptation-rate',
        sessionData: {
          id: workoutHistory[workoutHistory.length - 1].id,
          userId: workoutHistory[workoutHistory.length - 1].userId,
          exercises: workoutHistory[workoutHistory.length - 1].exercises.map(e => ({
            exerciseId: e.exerciseId,
            exerciseType: e.exerciseType,
            duration: 45, // Default duration
            sets: e.sets.length,
            reps: e.sets.reduce((sum, s) => sum + (s.reps || 0), 0),
            intensity: workoutHistory[workoutHistory.length - 1].performance.intensity,
            completionRate: workoutHistory[workoutHistory.length - 1].performance.completionRate
          })),
          startTime: workoutHistory[workoutHistory.length - 1].completedAt,
          endTime: new Date(workoutHistory[workoutHistory.length - 1].completedAt.getTime() + workoutHistory[workoutHistory.length - 1].duration * 60 * 1000),
          totalDuration: workoutHistory[workoutHistory.length - 1].duration,
          performance: {
            overallScore: workoutHistory[workoutHistory.length - 1].performance.overallScore / 10,
            consistencyScore: 0.8,
            fatigueLevel: 0.2,
            motivationLevel: 0.9
          }
        },
        userId
      });

      if (prediction.confidence < this.config.confidenceThreshold) {
        return null;
      }

      // Analyze adaptation history using data aggregation service
      const adaptationHistory = await this.dataAggregationService.extractAdaptationHistory(workoutHistory);

      return {
        id: `adaptation-trend-${userId}-${Date.now()}`,
        userId,
        patternType: 'adaptation-trend',
        confidence: prediction.confidence,
        strength: prediction.confidence * 0.8,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 1,
        contradictions: 0,
        timeSpan: this.calculateTimeSpanWeeks(workoutHistory[0].completedAt, workoutHistory[workoutHistory.length - 1].completedAt),
        data: {
          adaptationTrends: {
            direction: this.determineAdaptationDirection(adaptationHistory),
            rate: this.calculateAdaptationRate(adaptationHistory),
            consistency: this.calculateAdaptationConsistency(adaptationHistory),
            plateaus: this.detectPlateaus(workoutHistory)
          }
        }
      };
    } catch (error) {
      console.error('Error analyzing adaptation trends:', error);
      return null;
    }
  }

  private async analyzePerformanceCorrelations(
    userId: string, 
    workoutHistory: WorkoutHistoryEntry[], 
    existingPatterns: HistoricalPattern[]
  ): Promise<HistoricalPattern | null> {
    try {
      const performanceTrends = await this.dataAggregationService.calculatePerformanceTrends(workoutHistory);
      
      // Find strongest correlation
      const strongCorrelation = performanceTrends.find(trend => 
        trend.confidence > this.config.confidenceThreshold && Math.abs(trend.rate) > 0.02
      );

      if (!strongCorrelation) {
        return null;
      }

      return {
        id: `performance-correlation-${userId}-${Date.now()}`,
        userId,
        patternType: 'performance-correlation',
        confidence: strongCorrelation.confidence,
        strength: Math.abs(strongCorrelation.rate),
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 1,
        contradictions: 0,
        timeSpan: this.calculateTimeSpanWeeks(workoutHistory[0].completedAt, workoutHistory[workoutHistory.length - 1].completedAt),
        data: {
          performanceCorrelations: {
            correlations: performanceTrends.map(trend => ({
              factor: trend.metric,
              correlation: trend.rate,
              significance: trend.confidence,
              sampleSize: workoutHistory.length,
              description: `${trend.metric} shows ${trend.direction} trend`
            })),
            strongestCorrelation: {
              factor: strongCorrelation.metric,
              correlation: strongCorrelation.rate,
              significance: strongCorrelation.confidence,
              sampleSize: workoutHistory.length,
              description: `${strongCorrelation.metric} shows ${strongCorrelation.direction} trend`
            },
            insights: [
              `Performance shows ${strongCorrelation.direction} trend in ${strongCorrelation.metric}`,
              `Sample size: ${workoutHistory.length} workouts`
            ]
          }
        }
      };
    } catch (error) {
      console.error('Error analyzing performance correlations:', error);
      return null;
    }
  }

  private async analyzeExercisePreferences(
    userId: string, 
    workoutHistory: WorkoutHistoryEntry[], 
    existingPatterns: HistoricalPattern[]
  ): Promise<HistoricalPattern | null> {
    try {
      // Aggregate exercise data
      const exerciseFrequency = new Map<string, number>();
      const exercisePerformance = new Map<string, number[]>();

      for (const workout of workoutHistory) {
        for (const exercise of workout.exercises) {
          const count = exerciseFrequency.get(exercise.exerciseId) || 0;
          exerciseFrequency.set(exercise.exerciseId, count + 1);

          const performances = exercisePerformance.get(exercise.exerciseId) || [];
          performances.push(exercise.performance.effectiveness);
          exercisePerformance.set(exercise.exerciseId, performances);
        }
      }

      // Calculate preferences based on frequency and performance
      const preferences: any[] = [];
      for (const [exerciseId, frequency] of exerciseFrequency.entries()) {
        const performances = exercisePerformance.get(exerciseId) || [];
        const avgPerformance = performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
        
        if (frequency >= 3) { // Minimum frequency for preference detection
          preferences.push({
            exerciseId,
            exerciseName: workoutHistory.flatMap(w => w.exercises)
              .find(e => e.exerciseId === exerciseId)?.exerciseName || exerciseId,
            preference: avgPerformance > 7 ? 'preferred' : 'neutral',
            confidence: Math.min(frequency / workoutHistory.length, 0.9),
            reasoning: `Completed ${frequency} times with avg performance ${avgPerformance.toFixed(1)}/10`
          });
        }
      }

      if (preferences.length === 0) {
        return null;
      }

      return {
        id: `exercise-preference-${userId}-${Date.now()}`,
        userId,
        patternType: 'exercise-preference',
        confidence: 0.7,
        strength: 0.6,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 1,
        contradictions: 0,
        timeSpan: this.calculateTimeSpanWeeks(workoutHistory[0].completedAt, workoutHistory[workoutHistory.length - 1].completedAt),
        data: {
          exercisePreferences: {
            preferredExercises: preferences.filter(p => p.preference === 'preferred'),
            avoidedExercises: [], // Would need negative feedback data
            seasonalPreferences: [],
            progressionPreferences: []
          }
        }
      };
    } catch (error) {
      console.error('Error analyzing exercise preferences:', error);
      return null;
    }
  }

  private async analyzeIntensityProgression(
    userId: string, 
    workoutHistory: WorkoutHistoryEntry[], 
    existingPatterns: HistoricalPattern[]
  ): Promise<HistoricalPattern | null> {
    try {
      // Calculate intensity progression
      const intensityData = workoutHistory.map(workout => workout.performance.intensity);
      const progressionRate = this.calculateProgressionRate(intensityData);
      
      if (Math.abs(progressionRate) < 0.01) { // Too flat for meaningful pattern
        return null;
      }

      const currentLevel = intensityData[intensityData.length - 1];
      const targetLevel = Math.min(1.0, currentLevel + (progressionRate * 4)); // 4 weeks projection

      return {
        id: `intensity-progression-${userId}-${Date.now()}`,
        userId,
        patternType: 'intensity-progression',
        confidence: 0.75,
        strength: Math.abs(progressionRate) * 10,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 1,
        contradictions: 0,
        timeSpan: this.calculateTimeSpanWeeks(workoutHistory[0].completedAt, workoutHistory[workoutHistory.length - 1].completedAt),
        data: {
          intensityProgression: {
            currentLevel,
            targetLevel,
            progressionRate,
            optimalZone: { min: 0.6, max: 0.8 },
            zoneComfort: this.calculateZoneComfort(intensityData),
            adaptationResponses: []
          }
        }
      };
    } catch (error) {
      console.error('Error analyzing intensity progression:', error);
      return null;
    }
  }

  private async processPatternResult(
    newPattern: HistoricalPattern,
    existingPatterns: HistoricalPattern[],
    detectedPatterns: HistoricalPattern[],
    updatedPatterns: HistoricalPattern[],
    invalidatedPatterns: string[],
    confidenceUpdates: ConfidenceUpdate[]
  ): Promise<void> {
    const existingPattern = existingPatterns.find(p => p.patternType === newPattern.patternType);
    
    if (existingPattern) {
      const updatedPattern = await this.updateExistingPattern(existingPattern, newPattern);
      if (updatedPattern) {
        updatedPatterns.push(updatedPattern);
        confidenceUpdates.push({
          patternId: existingPattern.id,
          patternType: existingPattern.patternType,
          oldConfidence: existingPattern.confidence,
          newConfidence: updatedPattern.confidence,
          reason: 'Pattern confirmed with new data'
        });
      } else {
        invalidatedPatterns.push(existingPattern.id);
      }
    } else {
      detectedPatterns.push(newPattern);
    }
  }

  private async updateExistingPattern(
    existingPattern: HistoricalPattern,
    newPatternData: HistoricalPattern
  ): Promise<HistoricalPattern | null> {
    // Check for contradictions (simplified)
    const confidenceChange = Math.abs(existingPattern.confidence - newPatternData.confidence);
    const isContradiction = confidenceChange > 0.3;
    
    if (isContradiction) {
      existingPattern.contradictions++;
      
      if (existingPattern.contradictions >= this.config.maxContradictions) {
        return null; // Invalidate pattern
      }
    } else {
      // Update pattern with new data
      existingPattern.confirmations++;
      existingPattern.lastConfirmed = new Date();
      existingPattern.confidence = Math.min(1.0, existingPattern.confidence + this.config.learningRate);
      existingPattern.strength = Math.min(1.0, existingPattern.strength + (this.config.learningRate * 0.8));
    }

    return existingPattern;
  }

  private async generateInsights(
    detectedPatterns: HistoricalPattern[],
    updatedPatterns: HistoricalPattern[],
    workoutHistory: WorkoutHistoryEntry[]
  ): Promise<PatternInsight[]> {
    const insights: PatternInsight[] = [];
    const allPatterns = [...detectedPatterns, ...updatedPatterns];

    for (const pattern of allPatterns) {
      if (pattern.patternType === 'adaptation-trend' && pattern.strength > 0.7) {
        insights.push({
          type: 'adaptation-effectiveness',
          insight: 'Your body is responding well to AI adaptations, showing consistent improvement',
          supportingData: { patternStrength: pattern.strength, confidence: pattern.confidence },
          confidence: pattern.confidence,
          actionable: true
        });
      }

      if (pattern.patternType === 'performance-correlation' && pattern.confidence > 0.8) {
        insights.push({
          type: 'performance-trend',
          insight: 'Strong performance patterns detected that can guide future optimizations',
          supportingData: { correlationStrength: pattern.strength, confidence: pattern.confidence },
          confidence: pattern.confidence,
          actionable: true
        });
      }
    }

    return insights;
  }

  private async generateRecommendations(
    detectedPatterns: HistoricalPattern[],
    updatedPatterns: HistoricalPattern[],
    insights: PatternInsight[]
  ): Promise<PatternRecommendation[]> {
    const recommendations: PatternRecommendation[] = [];
    const allPatterns = [...detectedPatterns, ...updatedPatterns];

    for (const pattern of allPatterns) {
      if (pattern.patternType === 'intensity-progression' && pattern.data.intensityProgression?.progressionRate > 0.02) {
        recommendations.push({
          type: 'training-adjustment',
          recommendation: 'Continue gradual intensity increases - your body is adapting well',
          rationale: 'Positive progression rate indicates effective training stimulus',
          expectedImpact: 'Continue strength and performance improvements',
          confidence: pattern.confidence,
          priority: 'high'
        });
      }

      if (pattern.patternType === 'exercise-preference' && pattern.confidence > 0.7) {
        recommendations.push({
          type: 'preference-honor',
          recommendation: 'Include more of your preferred exercises in workout plans',
          rationale: 'You perform better and stay more consistent with preferred exercises',
          expectedImpact: 'Improved adherence and workout satisfaction',
          confidence: pattern.confidence,
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }

  private async storePatterns(userId: string, patterns: HistoricalPattern[]): Promise<void> {
    try {
      const encryptedData = await this.privacyService.encrypt(patterns);
      await this.privacyService.store(`gymgenie_historical_patterns-${userId}`, encryptedData);
    } catch (error) {
      throw new HistoricalPatternError(
        'Failed to store historical patterns',
        'STORAGE_ERROR',
        error
      );
    }
  }

  private async deleteInvalidatedPatterns(userId: string, invalidatedPatternIds: string[]): Promise<void> {
    try {
      const existingPatterns = await this.getPatterns(userId);
      const validPatterns = existingPatterns.filter(pattern => 
        !invalidatedPatternIds.includes(pattern.id)
      );
      await this.storePatterns(userId, validPatterns);
    } catch (error) {
      console.error('Error deleting invalidated patterns:', error);
    }
  }

  private validatePatternUpdates(updates: Partial<HistoricalPattern>): void {
    if (updates.confidence !== undefined && (updates.confidence < 0 || updates.confidence > 1)) {
      throw new HistoricalPatternError(
        'Invalid pattern data',
        'VALIDATION_ERROR',
        'Confidence must be between 0 and 1'
      );
    }

    if (updates.strength !== undefined && (updates.strength < 0 || updates.strength > 1)) {
      throw new HistoricalPatternError(
        'Invalid pattern data',
        'VALIDATION_ERROR',
        'Strength must be between 0 and 1'
      );
    }

    if (updates.contradictions !== undefined && updates.contradictions < 0) {
      throw new HistoricalPatternError(
        'Invalid pattern data',
        'VALIDATION_ERROR',
        'Contradictions cannot be negative'
      );
    }
  }

  private validateHistoricalPattern(pattern: HistoricalPattern): void {
    try {
      HistoricalPatternSchema.parse(pattern);
    } catch (error) {
      throw new HistoricalPatternError(
        'Invalid pattern data',
        'VALIDATION_ERROR',
        error
      );
    }
  }

  // Helper methods for pattern analysis
  private determineAdaptationDirection(adaptationHistory: any): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (!adaptationHistory || !adaptationHistory.adaptationEffectiveness) {
      return 'stable';
    }
    
    const effectivenessValues = Object.values(adaptationHistory.adaptationEffectiveness) as number[];
    if (effectivenessValues.length < 2) {
      return 'stable';
    }
    
    const average = effectivenessValues.reduce((sum, val) => sum + val, 0) / effectivenessValues.length;
    const trend = effectivenessValues[effectivenessValues.length - 1] - effectivenessValues[0];
    
    if (Math.abs(trend) < 0.05) {
      return 'stable';
    } else if (trend > 0) {
      return 'increasing';
    } else {
      return 'decreasing';
    }
  }

  private calculateAdaptationRate(adaptationHistory: any): number {
    if (!adaptationHistory || adaptationHistory.totalAdaptations === 0) {
      return 0;
    }
    
    // Calculate adaptation rate as adaptations per week over the time span
    // For now, assume 4-week period if no specific time data available
    const timeSpanWeeks = Math.max(1, 4); // Default to 4 weeks
    return adaptationHistory.totalAdaptations / timeSpanWeeks;
  }

  private calculateAdaptationConsistency(adaptationHistory: any): number {
    if (!adaptationHistory || !adaptationHistory.adaptationEffectiveness) {
      return 0.5; // Neutral consistency
    }
    
    const effectivenessValues = Object.values(adaptationHistory.adaptationEffectiveness) as number[];
    if (effectivenessValues.length === 0) {
      return 0.5;
    }
    
    const average = effectivenessValues.reduce((sum, val) => sum + val, 0) / effectivenessValues.length;
    const variance = effectivenessValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / effectivenessValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consistency is inverse of variance, normalized to 0-1
    return Math.max(0, Math.min(1, 1 - (standardDeviation / average)));
  }

  private detectPlateaus(workoutHistory: WorkoutHistoryEntry[]): any[] {
    const plateaus: any[] = [];
    
    if (workoutHistory.length < 4) {
      return plateaus; // Not enough data for plateau detection
    }
    
    // Analyze performance scores for plateau periods
    const performanceScores = workoutHistory.map(workout => workout.performance.overallScore);
    
    let plateauStart = 0;
    let plateauLength = 1;
    
    for (let i = 1; i < performanceScores.length; i++) {
      const diff = Math.abs(performanceScores[i] - performanceScores[i - 1]);
      
      if (diff < 0.3) { // Performance change less than 0.3 indicates potential plateau
        plateauLength++;
      } else {
        if (plateauLength >= 3) { // Minimum 3 workouts for a plateau
          plateaus.push({
            startDate: workoutHistory[plateauStart].completedAt,
            endDate: workoutHistory[i - 1].completedAt,
            characteristics: ['Performance stagnation'],
            averagePerformance: performanceScores.slice(plateauStart, i).reduce((a, b) => a + b, 0) / plateauLength
          });
        }
        plateauStart = i;
        plateauLength = 1;
      }
    }
    
    // Check for plateau at the end
    if (plateauLength >= 3) {
      plateaus.push({
        startDate: workoutHistory[plateauStart].completedAt,
        endDate: workoutHistory[workoutHistory.length - 1].completedAt,
        characteristics: ['Performance stagnation'],
        averagePerformance: performanceScores.slice(plateauStart).reduce((a, b) => a + b, 0) / plateauLength
      });
    }
    
    return plateaus;
  }

  private calculateProgressionRate(intensityData: number[]): number {
    if (intensityData.length < 2) return 0;
    
    // Simple linear regression to find trend
    const n = intensityData.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = intensityData.reduce((sum, val) => sum + val, 0);
    const sumXY = intensityData.reduce((sum, val, index) => sum + (val * index), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateZoneComfort(intensityData: number[]): number {
    // Calculate how often user is in optimal zone (0.6-0.8)
    const inOptimalZone = intensityData.filter(intensity => intensity >= 0.6 && intensity <= 0.8).length;
    return inOptimalZone / intensityData.length;
  }

}