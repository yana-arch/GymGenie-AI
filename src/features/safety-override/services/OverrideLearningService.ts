import type { OverrideEvent } from './OverrideDetectionService';
import type { AIRecommendation } from './OverrideDetectionService';

export interface LearningPattern {
  overrideCount: number;
  averageConfidence: number;
  lastSeen: number;
  contexts: {
    energyLevel: Record<string, number>;
    timeOfDay: Record<string, number>;
    equipmentType: Record<string, number>;
  };
  preferences: {
    recommendationTypes: Record<string, number>;
    interactionMethods: Record<string, number>;
  };
}

export interface LearningInsights {
  patterns: Record<string, LearningPattern>;
  confidence: number;
  patternStrength: 'weak' | 'moderate' | 'strong';
  adaptationSuggestions: AdaptationSuggestion[];
  lastAnalyzed: number;
}

export interface AdaptationSuggestion {
  type: 'reduce_intensity' | 'increase_rest' | 'alternative_exercise' | 'maintain_current';
  confidence: number;
  reasoning: string;
  safetyConstraints: string[];
  contextApplicable: string[];
}

export interface OverrideLearningState {
  overrideHistory: OverrideEvent[];
  learningPatterns: Record<string, LearningPattern>;
  isLearning: boolean;
  lastAnalysis: number;
  privacySettings: {
    enableLearning: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
  };
}

export interface OverrideLearningConfig {
  enableLearning?: boolean;
  dataRetentionDays?: number;
  anonymizeData?: boolean;
  storageKey?: string;
  analysisThreshold?: number;
}

export class OverrideLearningService {
  private state: OverrideLearningState;
  private config: Required<OverrideLearningConfig>;
  private analysisTimer: NodeJS.Timeout | null = null;

  constructor(config: OverrideLearningConfig = {}) {
    this.config = {
      enableLearning: true,
      dataRetentionDays: 90,
      anonymizeData: true,
      storageKey: 'safety-override-learning',
      analysisThreshold: 5,
      ...config
    };

    this.state = {
      overrideHistory: [],
      learningPatterns: {},
      isLearning: false,
      lastAnalysis: 0,
      privacySettings: {
        enableLearning: this.config.enableLearning,
        dataRetentionDays: this.config.dataRetentionDays,
        anonymizeData: this.config.anonymizeData
      }
    };

    this.loadStoredData();
  }

  // Log override events with full context
  async logOverride(overrideEvent: OverrideEvent): Promise<void> {
    if (!this.validateOverrideEvent(overrideEvent)) {
      throw new Error('Invalid override event: missing required fields');
    }

    if (!this.state.privacySettings.enableLearning) {
      return; // Skip logging if learning is disabled
    }

    // Apply privacy settings - anonymize data if required
    const processedEvent = this.state.privacySettings.anonymizeData 
      ? this.anonymizeEvent(overrideEvent)
      : overrideEvent;

    // Add to history
    this.state.overrideHistory.push(processedEvent);
    
    // Maintain retention policy
    this.enforceDataRetention();
    
    // Store locally (federated architecture)
    this.saveData();
    
    // Trigger learning if threshold met
    if (this.state.overrideHistory.length >= this.config.analysisThreshold) {
      this.schedulePatternAnalysis();
    }
  }

  // Analyze override patterns from multiple events
  async analyzePatterns(): Promise<void> {
    if (!this.state.privacySettings.enableLearning) {
      return;
    }

    this.state.isLearning = true;

    try {
      const patterns = this.extractPatterns();
      const insights = this.generateInsights(patterns);
      
      this.state.learningPatterns = patterns;
      this.state.lastAnalysis = Date.now();
      
      this.saveData();
      
      console.log('Override Learning Analysis Complete:', {
        patternsCount: Object.keys(patterns).length,
        confidence: insights.confidence,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      this.state.isLearning = false;
    }
  }

  // Get current learning patterns
  getLearningPatterns(): Record<string, LearningPattern> {
    return { ...this.state.learningPatterns };
  }

  // Get learning insights and recommendations
  getLearningInsights(): LearningInsights {
    const patterns = this.state.learningPatterns;
    const insights = this.generateInsights(patterns);
    
    return {
      ...insights,
      patterns,
      confidence: insights.confidence,
      patternStrength: insights.patternStrength,
      adaptationSuggestions: insights.adaptationSuggestions,
      lastAnalyzed: this.state.lastAnalysis
    };
  }

  // Get adaptive recommendations based on patterns
  getAdaptiveRecommendations(context: AIRecommendation['context']): {
    recommendations: AdaptationSuggestion[];
    strategy: string;
    confidence: number;
    safetyConstraints: string[];
  } {
    if (!this.state.privacySettings.enableLearning || Object.keys(this.state.learningPatterns).length === 0) {
      return {
        recommendations: [],
        strategy: 'no_learning_data',
        confidence: 0,
        safetyConstraints: ['conservative_defaults']
      };
    }

    const relevantPatterns = this.findRelevantPatterns(context);
    const suggestions = this.generateAdaptiveSuggestions(relevantPatterns, context);
    
    return {
      recommendations: suggestions,
      strategy: this.determineStrategy(relevantPatterns, context),
      confidence: this.calculateOverallConfidenceFromRecord(Object.values(relevantPatterns) as any),
      safetyConstraints: ['conservative_defaults', 'safety_first']
    };
  }

  // Get current service state
  getState(): OverrideLearningState {
    return { ...this.state };
  }

  // Clear all learning data
  async clearAllData(): Promise<void> {
    this.state.overrideHistory = [];
    this.state.learningPatterns = {};
    this.state.lastAnalysis = 0;
    
    // Clear local storage
    localStorage.removeItem(this.config.storageKey);
    
    console.log('Override learning data cleared');
  }

  // Get data retention settings
  getDataRetentionDays(): number {
    return this.state.privacySettings.dataRetentionDays;
  }

  // Update privacy settings
  updatePrivacySettings(settings: Partial<OverrideLearningState['privacySettings']>): void {
    this.state.privacySettings = {
      ...this.state.privacySettings,
      ...settings
    };
    this.saveData();
  }

  // Integration with Stories 1.1 and 1.2 (AC #7)
  integrateWithLiveSessionData(liveSessionContext: any): void {
    if (!this.state.privacySettings.enableLearning) return;

    // Extract relevant context from live session
    const context = {
      energyLevel: liveSessionContext.energy || 'normal',
      timeRemaining: liveSessionContext.timeRemaining || 600,
      equipmentAvailable: liveSessionContext.equipment || []
    };

    // Update learning patterns with live session data
    this.updateContextPatterns(context);
  }

  // Integration with form correction data from Story 1.2
  integrateWithFormCorrectionData(formCorrectionData: any): void {
    if (!this.state.privacySettings.enableLearning) return;

    // Extract form quality indicators to influence safety learning
    const context = {
      formQuality: formCorrectionData.averageFormScore || 0.8,
      fatigueIndicators: formCorrectionData.fatigueSigns || [],
      techniqueIssues: formCorrectionData.techniqueProblems || []
    };

    // Use form data to enhance safety learning
    this.enhanceSafetyLearning(context);
  }

  // Get preference suggestions for AI pipeline
  getPreferenceSuggestionsForAI(): {
    exerciseTypePreferences: Record<string, number>;
    intensityPreferences: Record<string, number>;
    timingPreferences: Record<string, number>;
    safetyAdjustments: string[];
    confidence: number;
  } {
    const patterns = Object.values(this.state.learningPatterns);
    
    if (patterns.length === 0) {
      return {
        exerciseTypePreferences: {},
        intensityPreferences: {},
        timingPreferences: {},
        safetyAdjustments: ['conservative_defaults'],
        confidence: 0
      };
    }

    const exerciseTypePreferences: Record<string, number> = {};
    const intensityPreferences: Record<string, number> = {};
    const timingPreferences: Record<string, number> = {};

    // Analyze patterns for preference insights
    patterns.forEach(pattern => {
      // Exercise type preferences
      Object.entries(pattern.preferences.recommendationTypes).forEach(([type, count]) => {
        exerciseTypePreferences[type] = (exerciseTypePreferences[type] || 0) + count;
      });

      // Intensity preferences based on context
      Object.entries(pattern.contexts.energyLevel).forEach(([level, count]) => {
        intensityPreferences[level] = (intensityPreferences[level] || 0) + count;
      });

      // Timing preferences
      if (pattern.contexts.timeOfDay) {
        Object.entries(pattern.contexts.timeOfDay).forEach(([time, count]) => {
          timingPreferences[time] = (timingPreferences[time] || 0) + count;
        });
      }
    });

    // Generate safety adjustments based on learning
    const safetyAdjustments = this.generateSafetyAdjustments(patterns);

    return {
      exerciseTypePreferences,
      intensityPreferences,
      timingPreferences,
      safetyAdjustments,
      confidence: this.calculateOverallConfidenceFromRecord(patterns as any)
    };
  }

  // Clean up resources
  destroy(): void {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }
    this.saveData();
  }

  // Helper methods for integration
  private updateContextPatterns(context: any): void {
    // Create or update pattern for current context
    const contextKey = `${context.energyLevel}_${Math.floor(context.timeRemaining / 60)}min`;
    
    if (!this.state.learningPatterns[contextKey]) {
      this.state.learningPatterns[contextKey] = {
        overrideCount: 0,
        averageConfidence: 0,
        lastSeen: Date.now(),
        contexts: {
          energyLevel: {},
          timeOfDay: {},
          equipmentType: {}
        },
        preferences: {
          recommendationTypes: {},
          interactionMethods: {}
        }
      };
    }

    // Update context tracking
    this.state.learningPatterns[contextKey].contexts.energyLevel[context.energyLevel] = 
      (this.state.learningPatterns[contextKey].contexts.energyLevel[context.energyLevel] || 0) + 1;
  }

  private enhanceSafetyLearning(context: any): void {
    // Enhance safety learning based on form correction data
    const safetyKey = `form_quality_${Math.round(context.formQuality * 10)}`;
    
    if (!this.state.learningPatterns[safetyKey]) {
      this.state.learningPatterns[safetyKey] = {
        overrideCount: 0,
        averageConfidence: 0,
        lastSeen: Date.now(),
        contexts: {
          energyLevel: {},
          timeOfDay: {},
          equipmentType: {}
        },
        preferences: {
          recommendationTypes: {},
          interactionMethods: {}
        }
      };
    }

    // Track fatigue indicators for safety learning
    if (context.fatigueIndicators && context.fatigueIndicators.length > 0) {
      this.state.learningPatterns[safetyKey].contexts.energyLevel['tired'] = 
        (this.state.learningPatterns[safetyKey].contexts.energyLevel['tired'] || 0) + 1;
    }
  }

  private generateSafetyAdjustments(patterns: LearningPattern[]): string[] {
    const adjustments: string[] = [];

    // Analyze patterns for safety adjustments
    patterns.forEach(pattern => {
      // If user frequently overrides when tired, add conservative adjustments
      const tiredOverrides = pattern.contexts.energyLevel['tired'] || 0;
      if (tiredOverrides > pattern.overrideCount * 0.6) {
        adjustments.push('reduce_intensity_when_tired');
      }

      // If user prefers gentle interactions, add safety-first adjustments
      const gentleInteractions = pattern.preferences.interactionMethods['one_tap'] || 0;
      if (gentleInteractions > pattern.overrideCount * 0.8) {
        adjustments.push('conservative_defaults');
        adjustments.push('clear_explanations');
      }

      // If overrides happen frequently, strengthen safety validation
      if (pattern.overrideCount > 10) {
        adjustments.push('enhanced_safety_validation');
        adjustments.push('progressive_trust_building');
      }
    });

    // Ensure conservative defaults are always included
    if (!adjustments.includes('conservative_defaults')) {
      adjustments.push('conservative_defaults');
    }

    return [...new Set(adjustments)]; // Remove duplicates
  }

  // Private methods
  private validateOverrideEvent(event: OverrideEvent): boolean {
    return !!(
      event.id &&
      event.recommendationId &&
      event.userAction &&
      event.interactionMethod &&
      event.timestamp &&
      event.context &&
      typeof event.processingTime === 'number'
    );
  }

  private anonymizeEvent(event: OverrideEvent): OverrideEvent {
    // Remove any potential PII while preserving workout context
    return {
      ...event,
      // Remove any fields that could contain personal data
      userId: undefined,
      sessionId: undefined,
      location: undefined,
      deviceInfo: undefined
    } as OverrideEvent;
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        this.state = {
          ...this.state,
          overrideHistory: parsed.overrideHistory || [],
          learningPatterns: parsed.learningPatterns || {},
          lastAnalysis: parsed.lastAnalysis || 0
        };
      }
    } catch (error) {
      console.warn('Failed to load stored learning data:', error);
    }
  }

  private saveData(): void {
    try {
      const dataToSave = {
        overrideHistory: this.state.overrideHistory,
        learningPatterns: this.state.learningPatterns,
        lastAnalysis: this.state.lastAnalysis
      };
      
      localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  private enforceDataRetention(): void {
    const cutoffDate = Date.now() - (this.state.privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000);
    
    this.state.overrideHistory = this.state.overrideHistory.filter(
      event => event.timestamp > cutoffDate
    );
  }

  private extractPatterns(): Record<string, LearningPattern> {
    const patterns: Record<string, LearningPattern> = {};
    
    // Group overrides by recommendation type
    const overridesByType = this.groupBy(this.state.overrideHistory, 'type');
    
    for (const [type, overrides] of Object.entries(overridesByType)) {
      if (overrides.length >= 3) { // Minimum for pattern detection
        patterns[type] = {
          overrideCount: overrides.length,
          averageConfidence: this.calculateAverageConfidence(overrides),
          lastSeen: Math.max(...overrides.map(o => o.timestamp)),
          contexts: this.analyzeContexts(overrides),
          preferences: this.analyzePreferences(overrides)
        };
      }
    }
    
    return patterns;
  }

  private groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = (item as any)[key] || 'unknown';
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private calculateAverageConfidence(overrides: OverrideEvent[]): number {
    // Calculate confidence based on consistency and frequency
    const timeSpans = this.getTimeSpans(overrides);
    const mean = timeSpans.length > 0 ? timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length : 0;
    const consistency = 1 - (this.calculateVariance(timeSpans) / mean);
    
    return Math.min(consistency, 1.0);
  }

  private getTimeSpans(overrides: OverrideEvent[]): number[] {
    if (overrides.length < 2) return [];
    
    const sorted = [...overrides].sort((a, b) => a.timestamp - b.timestamp);
    const spans: number[] = [];
    
    for (let i = 1; i < sorted.length; i++) {
      spans.push(sorted[i].timestamp - sorted[i-1].timestamp);
    }
    
    return spans;
  }

  // CalculateMean is defined above at line 346

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.length > 0 ? squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length : 0;
  }

  private calculateMean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private analyzeContexts(overrides: OverrideEvent[]): LearningPattern['contexts'] {
    return {
      energyLevel: this.countByField(overrides, 'context.energyLevel'),
      timeOfDay: this.countByTimeOfDay(overrides),
      equipmentType: this.countByField(overrides, 'context.equipmentAvailable.0')
    };
  }

  private analyzePreferences(overrides: OverrideEvent[]): LearningPattern['preferences'] {
    return {
      recommendationTypes: this.countByField(overrides, 'type'),
      interactionMethods: this.countByField(overrides, 'interactionMethod')
    };
  }

  private countByField(overrides: OverrideEvent[], fieldPath: string): Record<string, number> {
    const counts: Record<string, number> = {};
    
    overrides.forEach(override => {
      const value = this.getNestedValue(override, fieldPath) || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    
    return counts;
  }

  private countByTimeOfDay(overrides: OverrideEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    overrides.forEach(override => {
      const hour = new Date(override.timestamp).getHours();
      const timeOfDay = this.getTimeOfDay(hour);
      counts[timeOfDay] = (counts[timeOfDay] || 0) + 1;
    });
    
    return counts;
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateInsights(patterns: Record<string, LearningPattern>): LearningInsights {
    const patternCount = Object.keys(patterns).length;
    const totalOverrides = Object.values(patterns).reduce((sum, p) => sum + p.overrideCount, 0);
    
    return {
      patterns,
      confidence: this.calculateOverallConfidenceFromRecord(patterns),
      patternStrength: this.determinePatternStrength(patternCount, totalOverrides),
      adaptationSuggestions: [],
      lastAnalyzed: Date.now()
    };
  }

  private calculateOverallConfidenceFromRecord(patterns: Record<string, LearningPattern>): number {
    const confidences = Object.values(patterns).map(p => p.averageConfidence);
    return confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  }

  private determinePatternStrength(patternCount: number, totalOverrides: number): 'weak' | 'moderate' | 'strong' {
    if (patternCount < 3) return 'weak';
    if (patternCount < 6) return 'moderate';
    return 'strong';
  }

  private findRelevantPatterns(context: AIRecommendation['context']): LearningPattern[] {
    return Object.values(this.state.learningPatterns).filter(pattern => {
      // Check if pattern matches current context
      return pattern.contexts.energyLevel[context.energyLevel] > 0;
    });
  }

  private generateAdaptiveSuggestions(patterns: LearningPattern[], context: AIRecommendation['context']): AdaptationSuggestion[] {
    const suggestions: AdaptationSuggestion[] = [];
    
    if (context.energyLevel === 'tired') {
      suggestions.push({
        type: 'reduce_intensity',
        confidence: 0.8,
        reasoning: 'User consistently overrides when tired - suggest conservative approach',
        safetyConstraints: ['maintain_form', 'reduce_volume'],
        contextApplicable: ['tired']
      });
    }
    
    return suggestions;
  }

  private determineStrategy(patterns: LearningPattern[], context: AIRecommendation['context']): string {
    if (context.energyLevel === 'tired') {
      return 'conservative_safety_first';
    }
    if (context.timeRemaining < 10) {
      return 'time_efficient';
    }
    return 'standard_adaptive';
  }



  private schedulePatternAnalysis(): void {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }
    
    this.analysisTimer = setTimeout(() => {
      this.analyzePatterns();
    }, 1000); // Analyze patterns after short delay
  }
}