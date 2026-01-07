/**
 * Preference Intelligence Engine
 * Implements machine learning for preference pattern detection and validation
 */

import type {
  IPreferenceIntelligenceEngine,
  PreferencePattern,
  PreferenceRecommendation,
  WorkoutSession,
  PreferenceLearningConfig,
  MLModel,
  PatternPredictionInput,
  TrainingData
} from './types/preferenceLearning.types';

export class PreferenceIntelligenceEngine implements IPreferenceIntelligenceEngine {
  private config: PreferenceLearningConfig;
  private mlModel: MLModel; // TensorFlow.js model implementation

  constructor(config: PreferenceLearningConfig) {
    this.config = config;
    this.initializeModel();
  }

  /**
   * Analyze pattern strength using confidence metrics
   */
  async analyzePatternStrength(pattern: PreferencePattern): Promise<number> {
    const factors = {
      confidence: pattern.confidence,
      strength: pattern.strength,
      confirmations: Math.min(pattern.confirmations / 10, 1), // Normalize to 0-1
      contradictions: Math.max(0, 1 - (pattern.contradictions / this.config.maxContradictions)),
      recency: this.calculateRecencyScore(pattern.lastConfirmed),
      consistency: this.calculateConsistencyScore(pattern)
    };

    // Weighted average of factors
    const weights = {
      confidence: 0.3,
      strength: 0.2,
      confirmations: 0.2,
      contradictions: 0.15,
      recency: 0.1,
      consistency: 0.05
    };

    const weightedScore = Object.entries(factors).reduce((sum, [factor, score]) => {
      return sum + (score * weights[factor as keyof typeof weights]);
    }, 0);

    return Math.min(1.0, Math.max(0.0, weightedScore));
  }

  /**
   * Validate pattern using statistical methods
   */
  async validatePattern(pattern: PreferencePattern): Promise<boolean> {
    try {
      // Check minimum requirements
      if (pattern.confidence < this.config.confidenceThreshold) {
        return false;
      }

      if (pattern.contradictions >= this.config.maxContradictions) {
        return false;
      }

      // Validate data structure
      if (!this.validatePatternData(pattern)) {
        return false;
      }

      // Check statistical significance
      const statisticalSignificance = await this.calculateStatisticalSignificance(pattern);
      if (statisticalSignificance < 0.5) {
        return false;
      }

      // Validate against business rules
      const businessRuleValidation = this.validateBusinessRules(pattern);
      if (!businessRuleValidation) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating pattern:', error);
      return false;
    }
  }

  /**
   * Predict preference impact on coaching decisions
   */
  async predictPreferenceImpact(
    preferences: PreferencePattern[],
    session: WorkoutSession
  ): Promise<number> {
    try {
      let totalImpact = 0;
      let weightSum = 0;

      for (const preference of preferences) {
        const patternStrength = await this.analyzePatternStrength(preference);
        const sessionRelevance = this.calculateSessionRelevance(preference, session);
        const impact = this.calculatePreferenceImpact(preference, session);

        totalImpact += (patternStrength * sessionRelevance * impact);
        weightSum += (patternStrength * sessionRelevance);
      }

      if (weightSum === 0) {
        return 0.5; // Neutral impact
      }

      const weightedImpact = totalImpact / weightSum;
      
      // Apply gradual adaptation rate
      return Math.min(1.0, weightedImpact * this.config.gradualAdaptationRate);
    } catch (error) {
      console.error('Error predicting preference impact:', error);
      return 0.5; // Default to neutral
    }
  }

  /**
   * Generate recommendations based on learned preferences
   */
  async generateRecommendations(patterns: PreferencePattern[]): Promise<PreferenceRecommendation[]> {
    const recommendations: PreferenceRecommendation[] = [];

    try {
      // Analyze patterns by type
      const patternTypes = this.groupPatternsByType(patterns);

      for (const [type, typePatterns] of patternTypes.entries()) {
        const typeRecommendations = await this.generateTypeSpecificRecommendations(type, typePatterns);
        recommendations.push(...typeRecommendations);
      }

      // Generate cross-pattern recommendations
      const crossPatternRecommendations = await this.generateCrossPatternRecommendations(patterns);
      recommendations.push(...crossPatternRecommendations);

      // Sort by impact and confidence
      recommendations.sort((a, b) => {
        const scoreA = a.confidence * (a.impact === 'high' ? 1 : a.impact === 'medium' ? 0.7 : 0.4);
        const scoreB = b.confidence * (b.impact === 'high' ? 1 : b.impact === 'medium' ? 0.7 : 0.4);
        return scoreB - scoreA;
      });

      // Return top recommendations
      return recommendations.slice(0, 10); // Limit to top 10 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Private helper methods
   */

  private async initializeModel(): Promise<void> {
    // Initialize TensorFlow.js model with proper integration
    // NOTE: In production, this would:
    // 1. Load actual TensorFlow.js with @tensorflow/tfjs
    // 2. Create neural network with inputShape [10], outputShape [5]
    // 3. Train on real preference data for pattern recognition
    // 4. Use real tensor operations for predictions
    // For now, create enhanced mock model interface that matches TensorFlow.js patterns
    this.mlModel = {
      predict: async (input: PatternPredictionInput) => {
        // Mock prediction logic matching PatternPredictionOutput interface
        return {
          confidence: Math.random() * 0.8 + 0.2, // 0.2-1.0
          predictedPattern: input.type || 'exercise-selection',
          features: {
            exerciseSelection: Math.random(),
            intensityLevel: Math.random(),
            timingPreference: Math.random(),
            recoveryNeed: Math.random()
          },
          reasoning: 'Mock prediction for testing purposes'
        };
      },
      train: async (data: TrainingData[]) => {
        // Mock training logic
        return {
          epochs: 10,
          finalAccuracy: Math.random() * 0.2 + 0.8, // 0.8-1.0
          loss: Math.random() * 0.1,
          validationAccuracy: Math.random() * 0.2 + 0.8
        };
      },
      save: async (path: string) => {
        // Mock save logic
        console.log(`Mock model saved to ${path}`);
      },
      load: async (path: string) => {
        // Mock load logic
        console.log(`Mock model loaded from ${path}`);
      }
    };
  }

  private calculateRecencyScore(lastConfirmed: Date): number {
    const now = Date.now();
    const daysSinceConfirmation = (now - lastConfirmed.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: recent confirmations score higher
    return Math.exp(-daysSinceConfirmation / 30); // Half-life of 30 days
  }

  private calculateConsistencyScore(pattern: PreferencePattern): number {
    if (pattern.confirmations === 0) {
      return 0;
    }

    const consistency = pattern.confirmations / (pattern.confirmations + pattern.contradictions);
    return Math.min(1.0, consistency);
  }

  private validatePatternData(pattern: PreferencePattern): boolean {
    // Validate required fields
    if (!pattern.id || !pattern.userId || !pattern.patternType) {
      return false;
    }

    // Validate confidence and strength ranges
    if (pattern.confidence < 0 || pattern.confidence > 1) {
      return false;
    }

    if (pattern.strength < 0 || pattern.strength > 1) {
      return false;
    }

    // Validate data structure based on pattern type
    switch (pattern.patternType) {
      case 'exercise-selection':
        return this.validateExerciseSelectionData(pattern.data);
      case 'intensity-level':
        return this.validateIntensityLevelData(pattern.data);
      case 'workout-timing':
        return this.validateTimingData(pattern.data);
      default:
        return true; // Allow other pattern types
    }
  }

  private validateExerciseSelectionData(data: any): boolean {
    if (!data.exercisePreferences || !Array.isArray(data.exercisePreferences)) {
      return false;
    }

    return data.exercisePreferences.every((pref: any) => {
      return pref.exerciseId && pref.preference && pref.confidence >= 0 && pref.confidence <= 1;
    });
  }

  private validateIntensityLevelData(data: any): boolean {
    if (!data.intensityPreferences || !Array.isArray(data.intensityPreferences)) {
      return false;
    }

    return data.intensityPreferences.every((pref: any) => {
      return pref.intensityRange && 
             typeof pref.intensityRange.min === 'number' &&
             typeof pref.intensityRange.max === 'number' &&
             pref.intensityRange.min >= 0 && pref.intensityRange.min <= 1 &&
             pref.intensityRange.max >= 0 && pref.intensityRange.max <= 1 &&
             pref.intensityRange.min <= pref.intensityRange.max;
    });
  }

  private validateTimingData(data: any): boolean {
    if (!data.timingPreferences || !Array.isArray(data.timingPreferences)) {
      return false;
    }

    return data.timingPreferences.every((pref: any) => {
      return pref.timeOfDay && pref.preference && pref.confidence >= 0 && pref.confidence <= 1;
    });
  }

  private async calculateStatisticalSignificance(pattern: PreferencePattern): Promise<number> {
    // Mock statistical significance calculation
    // In real implementation, this would use proper statistical tests
    const sampleSize = pattern.confirmations + pattern.contradictions;
    const effectSize = Math.abs(pattern.confidence - 0.5); // Distance from neutral
    
    if (sampleSize < 5) {
      return 0;
    }

    // Simple significance approximation
    const significance = Math.min(1.0, (sampleSize / 10) * effectSize);
    return significance;
  }

  private validateBusinessRules(pattern: PreferencePattern): boolean {
    // Business rule: exercise preferences must not include unsafe exercises
    if (pattern.patternType === 'exercise-selection') {
      const unsafeExercises = ['dangerous-lift', 'unsafe-movement'];
      const exercisePreferences = pattern.data.exercisePreferences || [];
      
      for (const pref of exercisePreferences) {
        if (pref.preference === 'preferred' && unsafeExercises.includes(pref.exerciseId)) {
          return false; // Business rule violation
        }
      }
    }

    // Business rule: intensity preferences must be within safe ranges
    if (pattern.patternType === 'intensity-level') {
      const intensityPreferences = pattern.data.intensityPreferences || [];
      
      for (const pref of intensityPreferences) {
        if (pref.intensityRange.max > 0.95) { // 95% max intensity for safety
          return false;
        }
      }
    }

    return true;
  }

  private calculateSessionRelevance(pattern: PreferencePattern, session: WorkoutSession): number {
    // Calculate how relevant a pattern is to current session
    if (pattern.patternType === 'exercise-selection') {
      const exerciseIds = session.exercises.map(ex => ex.exerciseId);
      const preferredExercises = pattern.data.exercisePreferences?.filter((pref: any) => pref.preference === 'preferred').map((pref: any) => pref.exerciseId) || [];
      
      const overlap = exerciseIds.filter(id => preferredExercises.includes(id)).length;
      return overlap / Math.max(exerciseIds.length, 1);
    }

    if (pattern.patternType === 'intensity-level') {
      const avgIntensity = session.exercises.reduce((sum, ex) => sum + ex.intensity, 0) / session.exercises.length;
      const preferredRange = pattern.data.intensityPreferences?.[0]?.intensityRange;
      
      if (preferredRange) {
        return avgIntensity >= preferredRange.min && avgIntensity <= preferredRange.max ? 1 : 0.5;
      }
    }

    return 0.5; // Default relevance
  }

  private calculatePreferenceImpact(pattern: PreferencePattern, session: WorkoutSession): number {
    // Calculate how much applying this preference would impact the session
    switch (pattern.patternType) {
      case 'exercise-selection':
        return pattern.strength * 0.8; // High impact
      case 'intensity-level':
        return pattern.strength * 0.6; // Medium impact
      case 'workout-timing':
        return pattern.strength * 0.3; // Low impact
      default:
        return pattern.strength * 0.5; // Default impact
    }
  }

  private groupPatternsByType(patterns: PreferencePattern[]): Map<string, PreferencePattern[]> {
    const grouped = new Map<string, PreferencePattern[]>();
    
    for (const pattern of patterns) {
      if (!grouped.has(pattern.patternType)) {
        grouped.set(pattern.patternType, []);
      }
      grouped.get(pattern.patternType)!.push(pattern);
    }

    return grouped;
  }

  private async generateTypeSpecificRecommendations(
    type: string,
    patterns: PreferencePattern[]
  ): Promise<PreferenceRecommendation[]> {
    const recommendations: PreferenceRecommendation[] = [];

    switch (type) {
      case 'exercise-selection':
        recommendations.push({
          type: 'exercise-selection',
          recommendation: 'Incorporate user-preferred exercises into workout plan',
          confidence: this.averageConfidence(patterns),
          impact: 'high',
          reasoning: 'User shows consistent exercise preferences',
          data: { patternCount: patterns.length, avgConfidence: this.averageConfidence(patterns) }
        });
        break;

      case 'intensity-level':
        recommendations.push({
          type: 'intensity-level',
          recommendation: 'Adjust workout intensity based on user comfort zones',
          confidence: this.averageConfidence(patterns),
          impact: 'medium',
          reasoning: 'User has clear intensity preferences',
          data: { patternCount: patterns.length, avgConfidence: this.averageConfidence(patterns) }
        });
        break;

      case 'workout-timing':
        recommendations.push({
          type: 'workout-timing',
          recommendation: 'Schedule workouts during user\'s preferred times',
          confidence: this.averageConfidence(patterns),
          impact: 'low',
          reasoning: 'User performs better at specific times',
          data: { patternCount: patterns.length, avgConfidence: this.averageConfidence(patterns) }
        });
        break;
    }

    return recommendations;
  }

  private async generateCrossPatternRecommendations(patterns: PreferencePattern[]): Promise<PreferenceRecommendation[]> {
    const recommendations: PreferenceRecommendation[] = [];

    // Check for conflicting patterns
    const conflictingPatterns = this.findConflictingPatterns(patterns);
    if (conflictingPatterns.length > 0) {
      recommendations.push({
        type: 'gradual-adaptation',
        recommendation: 'Apply preferences gradually to resolve conflicts',
        confidence: 0.7,
        impact: 'medium',
        reasoning: 'Detected conflicting preference patterns',
        data: { conflicts: conflictingPatterns }
      });
    }

    // Check for adaptation opportunities
    const adaptationOpportunities = this.findAdaptationOpportunities(patterns);
    if (adaptationOpportunities.length > 0) {
      recommendations.push({
        type: 'adaptation-rate',
        recommendation: 'Increase adaptation rate for well-established patterns',
        confidence: 0.8,
        impact: 'low',
        reasoning: 'User patterns are stable and consistent',
        data: { opportunities: adaptationOpportunities }
      });
    }

    return recommendations;
  }

  private findConflictingPatterns(patterns: PreferencePattern[]): string[] {
    const conflicts: string[] = [];
    
    // Simple conflict detection logic
    const intensityPatterns = patterns.filter(p => p.patternType === 'intensity-level');
    const exercisePatterns = patterns.filter(p => p.patternType === 'exercise-selection');
    
    for (const intPattern of intensityPatterns) {
      const intensityPref = intPattern.data.intensityPreferences?.[0];
      if (intensityPref && intensityPref.intensityRange.min > 0.8) {
        // High intensity preference might conflict with exercise preferences for low-impact exercises
        const conflictingExercises = exercisePatterns
          .filter(p => p.data.exercisePreferences?.some((pref: any) => 
            pref.exerciseId.includes('low-impact') && pref.preference === 'preferred'
          ))
          .map(p => p.id);
        
        conflicts.push(...conflictingExercises);
      }
    }

    return [...new Set(conflicts)]; // Remove duplicates
  }

  private findAdaptationOpportunities(patterns: PreferencePattern[]): string[] {
    return patterns
      .filter(p => 
        p.confidence > 0.8 && 
        p.strength > 0.8 && 
        p.confirmations > 10 &&
        p.contradictions === 0
      )
      .map(p => p.id);
  }

  private averageConfidence(patterns: PreferencePattern[]): number {
    if (patterns.length === 0) {
      return 0;
    }
    return patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  }
}