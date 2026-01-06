/**
 * Coaching Intelligence Service
 * Enhances AI coaching with user learning, preferences, and adaptive intelligence
 */

import {
  CoachingDecision,
  CoachingPriority,
  AICoachingInput,
  AISystemResponse
} from '../types/unifiedCoaching.types';

import {
  CoachingStylePreferences,
  UserLearningProfile,
  EnhancedCoachingDecision,
  LearningSignal,
  CoachingIntelligenceStorage,
  SessionLearningSummary,
  AdaptationRecord,
  PreferenceChange,
  PrivacyConfig,
  CoachingIntelligenceConfig,
  EnhancedAICoachingInput,
  IntelligenceMetrics,
  DEFAULT_COACHING_PREFERENCES,
  DEFAULT_LEARNING_PROFILE
} from '../types/coachingIntelligence.types';

import { PrivacyPreservingStorageService } from './PrivacyPreservingStorageService';
import { performanceMonitor } from '../PerformanceMonitor';

/**
 * Coaching Intelligence Service
 * Provides intelligent coaching with user learning and preference adaptation
 */
export class CoachingIntelligenceService {
  private storage: PrivacyPreservingStorageService;
  private cache: CoachingIntelligenceStorage;
  private config: CoachingIntelligenceConfig;
  private metrics: IntelligenceMetrics;
  private signalBuffer: LearningSignal[] = [];
  private isInitialized = false;

  constructor(config?: Partial<CoachingIntelligenceConfig>) {
    this.config = this.mergeConfig(config);
    this.storage = new PrivacyPreservingStorageService(this.config.storage);
    this.cache = this.initializeStorage();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize the coaching intelligence service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadStorage();
      this.isInitialized = true;
      console.log('Coaching Intelligence Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Coaching Intelligence Service:', error);
      throw error;
    }
  }

  /**
   * Enhance coaching decision with user intelligence
   */
  async enhanceCoachingDecision(
    baseDecision: CoachingDecision,
    userInputs?: EnhancedAICoachingInput[]
  ): Promise<EnhancedCoachingDecision> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Apply user preferences to decision
      const adaptedDecision = await this.applyUserPreferences(baseDecision);
      
      // Apply learning profile adjustments
      const learnedDecision = await this.applyLearningProfile(adaptedDecision, userInputs);
      
      // Generate personalized content
      const personalizedContent = await this.generatePersonalizedContent(learnedDecision);
      
      // Predict user acceptance
      const predictedAcceptance = await this.predictUserAcceptance(learnedDecision);
      
      // Determine optimal timing
      const optimalTiming = await this.calculateOptimalTiming(learnedDecision);
      
      // Create enhanced decision
      const enhancedDecision: EnhancedCoachingDecision = {
        ...learnedDecision,
        intelligence: {
          userProfileApplied: true,
          adaptedRecommendation: adaptedDecision.response !== baseDecision.response,
          personalizationLevel: this.calculatePersonalizationLevel(learnedDecision),
          confidenceAdjustment: this.calculateConfidenceAdjustment(learnedDecision),
          predictedAcceptance,
          optimalTiming,
          learningSignals: this.extractLearningSignals(learnedDecision)
        },
        adaptedContent: personalizedContent,
        learningImpact: await this.assessLearningImpact(learnedDecision)
      };

      // Update metrics
      this.updateMetrics(enhancedDecision, performance.now() - startTime);
      
      // Store learning data
      await this.storeLearningData(enhancedDecision);

      // Track performance for monitoring
      performanceMonitor.trackSystemResponse('coaching-intelligence', Date.now() - startTime);

      return enhancedDecision;

    } catch (error) {
      console.error('Error enhancing coaching decision:', error);
      return this.createFallbackEnhancedDecision(baseDecision, error);
    }
  }

  /**
   * Process user feedback and learning signals
   */
  async processUserFeedback(
    decisionId: string,
    feedback: {
      accepted: boolean;
      responseTime: number;
      satisfaction?: number;
      notes?: string;
    }
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create learning signal
      const signal: LearningSignal = {
        type: feedback.accepted ? 'acceptance' : 'rejection',
        timestamp: Date.now(),
        context: await this.getDecisionContext(decisionId),
        strength: feedback.satisfaction || (feedback.accepted ? 0.8 : 0.2),
        metadata: {
          responseTime: feedback.responseTime,
          notes: feedback.notes
        }
      };

      // Add to signal buffer
      this.signalBuffer.push(signal);

      // Process signals if buffer is full
      if (this.signalBuffer.length >= this.config.performance.batchSize) {
        await this.processLearningSignals();
      }

      // Update learning profile
      await this.updateLearningProfile(signal);

    } catch (error) {
      console.error('Error processing user feedback:', error);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: Partial<CoachingStylePreferences>,
    source: 'explicit' | 'learned' = 'explicit'
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const oldPreferences = { ...this.cache.preferences };
      
      // Merge new preferences
      this.cache.preferences = {
        ...this.cache.preferences,
        ...preferences
      };

      // Record preference change
      const change: PreferenceChange = {
        timestamp: Date.now(),
        changeType: source,
        field: Object.keys(preferences)[0] as keyof CoachingStylePreferences,
        oldValue: oldPreferences[Object.keys(preferences)[0] as keyof CoachingStylePreferences],
        newValue: preferences[Object.keys(preferences)[0] as keyof CoachingStylePreferences],
        confidence: source === 'explicit' ? 1.0 : 0.7,
        reason: source === 'explicit' ? 'User preference update' : 'Learned from behavior'
      };

      this.cache.learningHistory.preferenceChanges.push(change);
      
      // Save to storage
      await this.saveStorage();

    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  /**
   * Get current user preferences
   */
  getPreferences(): CoachingStylePreferences {
    return this.cache.preferences;
  }

  /**
   * Get learning profile
   */
  getLearningProfile(): UserLearningProfile {
    return this.cache.learningProfile;
  }

  /**
   * Get intelligence metrics
   */
  getMetrics(): IntelligenceMetrics {
    return this.metrics;
  }

  /**
   * Apply user preferences to coaching decision
   */
  private async applyUserPreferences(
    decision: CoachingDecision
  ): Promise<CoachingDecision> {
    const preferences = this.cache.preferences;
    
    // Adapt communication style
    let adaptedResponse = { ...decision.response };
    
    // Adjust message tone based on preference
    if (adaptedResponse.recommendation.message) {
      adaptedResponse.recommendation.message = this.adaptMessageTone(
        adaptedResponse.recommendation.message,
        preferences.communicationTone
      );
    }

    // Adjust recommendation frequency
    if (preferences.communicationFrequency === 'minimal') {
      // Filter out low-priority recommendations
      if (decision.priority === CoachingPriority.ADAPTATION) {
        adaptedResponse.confidence *= 0.8; // Reduce confidence for adaptation recommendations
      }
    }

    // Apply primary focus preference
    if (preferences.primaryFocus !== 'balanced') {
      const focusWeight = this.getFocusWeight(decision.priority, preferences.primaryFocus);
      adaptedResponse.confidence *= focusWeight;
    }

    return {
      ...decision,
      response: adaptedResponse
    };
  }

  /**
   * Apply learning profile adjustments
   */
  private async applyLearningProfile(
    decision: CoachingDecision,
    userInputs?: EnhancedAICoachingInput[]
  ): Promise<CoachingDecision> {
    const profile = this.cache.learningProfile;
    
    // Adjust confidence based on historical response rate
    const responseRate = profile.responseRate.byPriority[decision.priority] || profile.responseRate.overall;
    const confidenceAdjustment = this.calculateConfidenceFromResponseRate(responseRate);
    
    // Adjust timing based on user response patterns
    const optimalTiming = this.calculateOptimalTimingFromProfile(decision, profile);
    
    // Apply adaptation rate
    const adaptedConfidence = this.applyAdaptationRate(
      decision.response.confidence,
      profile.adaptationRate,
      confidenceAdjustment
    );

    return {
      ...decision,
      response: {
        ...decision.response,
        confidence: adaptedConfidence,
        metadata: {
          ...decision.response.metadata,
          optimalTiming,
          responseRateAdjustment: confidenceAdjustment
        }
      }
    };
  }

  /**
   * Generate personalized content
   */
  private async generatePersonalizedContent(
    decision: CoachingDecision
  ): Promise<EnhancedCoachingDecision['adaptedContent']> {
    const preferences = this.cache.preferences;
    const profile = this.cache.learningProfile;
    
    const baseMessage = decision.response.recommendation.message || '';
    
    return {
      personalizedMessage: this.adaptMessageTone(baseMessage, preferences.communicationTone),
      tailoredExplanation: this.generateExplanation(decision, preferences.explanationLevel),
      contextualMotivation: this.generateMotivation(decision, profile),
      alternativeOptions: this.generateAlternatives(decision, preferences)
    };
  }

  /**
   * Predict user acceptance likelihood
   */
  private async predictUserAcceptance(decision: CoachingDecision): Promise<number> {
    const profile = this.cache.learningProfile;
    
    // Base acceptance rate by priority
    const baseRate = profile.responseRate.byPriority[decision.priority] || profile.responseRate.overall;
    
    // Adjust for confidence
    const confidenceFactor = decision.response.confidence;
    
    // Adjust for time of day
    const timeOfDay = new Date().getHours();
    const timeEffectiveness = profile.coachingEffectiveness.byTimeOfDay[timeOfDay.toString()] || 0.7;
    
    // Adjust for recent performance
    const recentPerformance = this.getRecentPerformanceTrend(profile);
    
    // Calculate predicted acceptance
    const predictedAcceptance = baseRate * confidenceFactor * timeEffectiveness * (1 + recentPerformance * 0.2);
    
    return Math.min(1.0, Math.max(0.0, predictedAcceptance));
  }

  /**
   * Calculate optimal timing for recommendation
   */
  private async calculateOptimalTiming(decision: CoachingDecision): Promise<number> {
    const preferences = this.cache.preferences;
    const profile = this.cache.learningProfile;
    
    // Check if within preferred coaching hours
    const currentTime = Date.now();
    const currentHour = new Date(currentTime).getHours();
    const preferredStart = parseInt(preferences.preferredCoachingHours.start.split(':')[0]);
    const preferredEnd = parseInt(preferences.preferredCoachingHours.end.split(':')[0]);
    
    if (currentHour >= preferredStart && currentHour <= preferredEnd) {
      return currentTime; // Optimal time
    }
    
    // Calculate next optimal time
    const nextOptimalTime = this.calculateNextOptimalTime(currentTime, preferences, profile);
    
    return nextOptimalTime;
  }

  /**
   * Process buffered learning signals
   */
  private async processLearningSignals(): Promise<void> {
    if (this.signalBuffer.length === 0) return;

    try {
      // Analyze signals for patterns
      const patterns = this.analyzeSignalPatterns(this.signalBuffer);
      
      // Update learning profile based on patterns
      await this.updateLearningProfileFromPatterns(patterns);
      
      // Adapt preferences if significant changes detected
      if (patterns.significantPreferenceShift) {
        await this.adaptPreferencesFromPatterns(patterns);
      }
      
      // Clear processed signals
      this.signalBuffer = [];
      
    } catch (error) {
      console.error('Error processing learning signals:', error);
    }
  }

  /**
   * Initialize storage with privacy-preserving defaults
   */
  private initializeStorage(): CoachingIntelligenceStorage {
    return {
      preferences: DEFAULT_COACHING_PREFERENCES,
      learningProfile: DEFAULT_LEARNING_PROFILE,
      metadata: {
        lastUpdated: Date.now(),
        dataPoints: 0,
        privacyLevel: 'local',
        version: '1.0.0'
      },
      learningHistory: {
        sessionSummaries: [],
        adaptationHistory: [],
        preferenceChanges: []
      }
    };
  }

  /**
   * Load storage from local storage
   */
  private async loadStorage(): Promise<void> {
    try {
      this.cache = await this.storage.retrieveData();
    } catch (error) {
      console.warn('Failed to load coaching intelligence data:', error);
      // Continue with default cache
    }
  }

  /**
   * Save storage to local storage
   */
  private async saveStorage(): Promise<void> {
    try {
      this.cache.metadata.lastUpdated = Date.now();
      await this.storage.storeData(this.cache);
    } catch (error) {
      console.error('Failed to save coaching intelligence data:', error);
    }
  }

  /**
   * Store learning data from enhanced decision
   */
  private async storeLearningData(decision: EnhancedCoachingDecision): Promise<void> {
    // Create session summary entry
    const summary: SessionLearningSummary = {
      sessionId: `session-${Date.now()}`,
      timestamp: Date.now(),
      duration: 0, // Will be updated when session ends
      recommendationsPresented: 1,
      recommendationsAccepted: decision.intelligence.predictedAcceptance > 0.5 ? 1 : 0,
      averageResponseTime: this.cache.learningProfile.averageResponseTime,
      satisfactionIndicators: decision.intelligence.predictedAcceptance,
      keyLearnings: decision.learningImpact.skillProgression,
      preferenceShifts: {} // Will be tracked over time
    };

    this.cache.learningHistory.sessionSummaries.push(summary);
    
    // Limit history size for privacy
    if (this.cache.learningHistory.sessionSummaries.length > 100) {
      this.cache.learningHistory.sessionSummaries = this.cache.learningHistory.sessionSummaries.slice(-100);
    }

    await this.saveStorage();
  }

  /**
   * Helper methods for content adaptation
   */
  private adaptMessageTone(message: string, tone: string): string {
    // Simple tone adaptation - could be enhanced with NLP
    switch (tone) {
      case 'encouraging':
        return message.includes('!') ? message : `${message} You're doing great!`;
      case 'motivational':
        return `Let's push through! ${message}`;
      case 'technical':
        return message; // Keep as-is for technical
      case 'professional':
        return message.replace(/!/g, '.'); // Make more formal
      default:
        return message;
    }
  }

  private generateExplanation(decision: CoachingDecision, level: string): string {
    const baseExplanation = decision.response.reasoning;
    
    switch (level) {
      case 'basic':
        return `Focus on the movement: ${baseExplanation.split('.')[0]}.`;
      case 'advanced':
        return `${baseExplanation} This adjustment optimizes your biomechanical efficiency and reduces injury risk.`;
      default:
        return baseExplanation;
    }
  }

  private generateMotivation(decision: CoachingDecision, profile: UserLearningProfile): string {
    const motivationMessages = [
      "Keep up the great work!",
      "You're making solid progress!",
      "Every rep counts towards your goals!",
      "Stay focused and strong!"
    ];
    
    return motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
  }

  private generateAlternatives(
    decision: CoachingDecision, 
    preferences: CoachingStylePreferences
  ): string[] {
    // Generate alternative approaches based on user preferences
    if (preferences.adaptationTolerance === 'high') {
      return [
        "Try a lighter variation",
        "Focus on form first",
        "Take a brief rest"
      ];
    }
    return [];
  }

  /**
   * Configuration and initialization helpers
   */
  private mergeConfig(config?: Partial<CoachingIntelligenceConfig>): CoachingIntelligenceConfig {
    const defaultConfig: CoachingIntelligenceConfig = {
      storage: {
        encryptionEnabled: true,
        dataRetentionDays: 365,
        anonymizationLevel: 'partial',
        sharingConsent: {
          analytics: false,
          improvement: false,
          research: false
        },
        sensitiveDataFields: ['healthData', 'personalInfo']
      },
      learning: {
        adaptationRate: 0.1,
        confidenceThreshold: 0.7,
        historyWeight: 0.3,
        explorationRate: 0.1
      },
      performance: {
        maxCacheSize: 1000,
        processingTimeoutMs: 500,
        batchSize: 10
      }
    };

    return {
      storage: { ...defaultConfig.storage, ...config?.storage },
      learning: { ...defaultConfig.learning, ...config?.learning },
      performance: { ...defaultConfig.performance, ...config?.performance }
    };
  }

  private initializeMetrics(): IntelligenceMetrics {
    return {
      adaptationAccuracy: 0.8,
      userSatisfactionScore: 0.75,
      predictionAccuracy: 0.7,
      personalizationEffectiveness: 0.8,
      processingTimeOverhead: 0,
      storageEfficiency: 0.9,
      privacyCompliance: 1.0,
      engagementRate: 0.7,
      retentionRate: 0.8,
      improvementRate: 0.6
    };
  }

  /**
   * Additional helper methods
   */
  private calculatePersonalizationLevel(decision: CoachingDecision): number {
    const preferences = this.cache.preferences;
    let personalizationScore = 0.5; // Base score

    // Check if message tone was adapted
    if (decision.response.recommendation.message) {
      const toneMarkers = {
        'encouraging': ['great', 'excellent', 'amazing'],
        'technical': ['biomechanical', 'posture', 'form'],
        'professional': ['please', 'recommended', 'suggested']
      };

      Object.entries(toneMarkers).forEach(([tone, markers]) => {
        if (preferences.communicationTone === tone) {
          const hasMarkers = markers.some(marker => 
            decision.response.recommendation.message.toLowerCase().includes(marker)
          );
          if (hasMarkers) personalizationScore += 0.2;
        }
      });
    }

    // Check if preference-based adjustments were made
    if (this.hasPreferenceBasedAdjustment(decision)) {
      personalizationScore += 0.3;
    }

    return Math.min(1.0, personalizationScore);
  }

  private calculateConfidenceAdjustment(decision: CoachingDecision): number {
    const profile = this.cache.learningProfile;
    let adjustment = 0;

    // Historical response rate for this priority
    const priorityResponseRate = profile.responseRate.byPriority[decision.priority] || profile.responseRate.overall;
    adjustment += (priorityResponseRate - 0.7) * 0.2; // Adjust based on response rate

    // Time-based adjustment
    const currentHour = new Date().getHours();
    const effectiveness = profile.coachingEffectiveness.byTimeOfDay[currentHour.toString()] || 0.7;
    adjustment += (effectiveness - 0.7) * 0.1;

    // Recent performance trend
    const recentPerformance = this.getRecentPerformanceTrend(profile);
    adjustment += recentPerformance * 0.1;

    return Math.max(-0.2, Math.min(0.3, adjustment));
  }

  private extractLearningSignals(decision: CoachingDecision): LearningSignal[] {
    const signals: LearningSignal[] = [];
    const timestamp = Date.now();

    // Signal from high confidence decisions
    if (decision.response.confidence > 0.8) {
      signals.push({
        type: 'satisfaction',
        timestamp: timestamp - 1000,
        context: {
          recommendationType: decision.response.type,
          priority: decision.priority,
          system: decision.system
        },
        strength: decision.response.confidence,
        metadata: {
          source: 'decision_confidence'
        }
      });
    }

    // Signal from conflict resolution
    if (decision.conflictResolution && decision.conflictResolution.conflicts.length > 0) {
      signals.push({
        type: 'acceptance',
        timestamp: timestamp - 500,
        context: {
          recommendationType: decision.response.type,
          priority: decision.priority,
          system: decision.system
        },
        strength: 0.8,
        metadata: {
          conflictsResolved: decision.conflictResolution.conflicts.length,
          strategy: decision.conflictResolution.strategy
        }
      });
    }

    return signals;
  }

  private hasPreferenceBasedAdjustment(decision: CoachingDecision): boolean {
    // Check if decision reflects user preferences
    const preferences = this.cache.preferences;
    
    // Check communication frequency preference
    if (preferences.communicationFrequency === 'minimal' && 
        decision.priority === CoachingPriority.ADAPTATION) {
      return true;
    }

    // Check primary focus preference
    if (preferences.primaryFocus !== 'balanced' && 
        decision.priority === preferences.primaryFocus) {
      return true;
    }

    return false;
  }

  private async assessLearningImpact(decision: CoachingDecision): Promise<EnhancedCoachingDecision['learningImpact']> {
    const profile = this.cache.learningProfile;
    const decisionCount = profile.trendData.engagementLevel.length;
    
    // Calculate retention based on recent engagement
    const recentEngagement = profile.trendData.engagementLevel.slice(-5);
    const avgEngagement = recentEngagement.reduce((sum, level) => sum + level, 0) / recentEngagement.length;
    
    return {
      skillProgression: [
        `${decision.response.type}: ${Math.max(0.1, avgEngagement).toFixed(2)} level (${((avgEngagement - 0.5) * 0.2).toFixed(2)} improvement)`,
        `Confidence: ${(decision.response.confidence * 100).toFixed(1)}%`
      ],
      adaptationComplexity: decision.priority === CoachingPriority.SAFETY ? 0.3 : 0.7,
      retentionPrediction: Math.min(0.95, Math.max(0.3, avgEngagement))
    };
  }

  private updateMetrics(decision: EnhancedCoachingDecision, processingTime: number): void {
    // Update internal metrics
    this.metrics.processingTimeOverhead = processingTime;
  }

  private createFallbackEnhancedDecision(baseDecision: CoachingDecision, error: Error): EnhancedCoachingDecision {
    return {
      ...baseDecision,
      intelligence: {
        userProfileApplied: false,
        adaptedRecommendation: false,
        personalizationLevel: 0,
        confidenceAdjustment: 0,
        predictedAcceptance: 0.5,
        optimalTiming: Date.now(),
        learningSignals: []
      },
      learningImpact: {
        skillProgression: [],
        adaptationComplexity: 0,
        retentionPrediction: 0.5
      }
    };
  }

  private async getDecisionContext(decisionId: string): Promise<LearningSignal['context']> {
    // Extract context from recent decisions and learning history
    const recentDecisions = this.cache.learningHistory.sessionSummaries.slice(-3);
    
    if (recentDecisions.length > 0) {
      const lastDecision = recentDecisions[recentDecisions.length - 1];
      return {
        recommendationType: 'adaptation', // Derived from learning history
        priority: CoachingPriority.ADAPTATION,
        system: 'unified-coaching'
      };
    }
    
    return {
      recommendationType: 'unknown',
      priority: CoachingPriority.ADAPTATION,
      system: 'unified-coaching'
    };
  }

  private async updateLearningProfile(signal: LearningSignal): Promise<void> {
    // Update response rates
    const profile = this.cache.learningProfile;
    
    // Update overall response rate
    const currentRate = profile.responseRate.overall;
    const newRate = currentRate * 0.9 + signal.strength * 0.1; // Weighted average
    profile.responseRate.overall = Math.max(0, Math.min(1, newRate));
    
    // Update priority-specific rate
    if (!profile.responseRate.byPriority['safety']) {
      profile.responseRate.byPriority = { ...profile.responseRate.byPriority };
    }
    
    // Update trend data
    profile.trendData.engagementLevel.push(signal.strength);
    if (profile.trendData.engagementLevel.length > 50) {
      profile.trendData.engagementLevel = profile.trendData.engagementLevel.slice(-50);
    }
    
    await this.saveStorage();
  }

  private getFocusWeight(currentPriority: CoachingPriority, primaryFocus: CoachingPriority | 'balanced'): number {
    if (primaryFocus === 'balanced') return 1.0;
    return currentPriority === primaryFocus ? 1.2 : 0.8;
  }

  private calculateConfidenceFromResponseRate(responseRate: number): number {
    return Math.min(1.2, Math.max(0.8, 1.0 + (responseRate - 0.7) * 0.5));
  }

  private calculateOptimalTimingFromProfile(decision: CoachingDecision, profile: UserLearningProfile): number {
    const preferences = this.cache.preferences;
    const currentHour = new Date().getHours();
    const preferredStart = parseInt(preferences.preferredCoachingHours.start.split(':')[0]);
    const preferredEnd = parseInt(preferences.preferredCoachingHours.end.split(':')[0]);
    
    if (currentHour >= preferredStart && currentHour <= preferredEnd) {
      return Date.now(); // Optimal time
    }
    
    // Calculate next optimal time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(preferredStart, 0, 0, 0);
    return tomorrow.getTime();
  }

  private applyAdaptationRate(baseConfidence: number, adaptationRate: number, adjustment: number): number {
    return Math.min(1.0, baseConfidence * (1 + adaptationRate * adjustment));
  }

  private getRecentPerformanceTrend(profile: UserLearningProfile): number {
    const trends = profile.trendData.engagementLevel;
    if (trends.length < 2) return 0;
    return trends[trends.length - 1] - trends[trends.length - 2];
  }

  private calculateNextOptimalTime(currentTime: number, preferences: CoachingStylePreferences, profile: UserLearningProfile): number {
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(preferences.preferredCoachingHours.start.split(':')[0]), 0, 0, 0);
    return tomorrow.getTime();
  }

  private analyzeSignalPatterns(signals: LearningSignal[]): any {
    // Analyze patterns in learning signals
    const acceptanceRate = signals.filter(s => s.type === 'acceptance').length / signals.length;
    const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
    
    return {
      significantPreferenceShift: acceptanceRate < 0.3 || acceptanceRate > 0.8,
      patterns: [
        {
          type: 'acceptance_pattern',
          value: acceptanceRate,
          threshold: 0.5
        },
        {
          type: 'engagement_pattern', 
          value: avgStrength,
          threshold: 0.7
        }
      ]
    };
  }

  private async updateLearningProfileFromPatterns(patterns: any): Promise<void> {
    // Update learning profile from analyzed patterns
    if (patterns.significantPreferenceShift) {
      // Reset some learning rates for rapid adaptation
      this.cache.learningProfile.responseRate.overall = 0.7;
      await this.saveStorage();
    }
  }

  private async adaptPreferencesFromPatterns(patterns: any): Promise<void> {
    // Adapt preferences based on learned patterns
    const acceptancePattern = patterns.patterns.find((p: any) => p.type === 'acceptance_pattern');
    
    if (acceptancePattern && acceptancePattern.value < 0.3) {
      // User is rejecting many recommendations, reduce frequency
      await this.updatePreferences({
        communicationFrequency: 'minimal'
      }, 'learned');
    }
  }
}

// Export singleton instance
export const coachingIntelligenceService = new CoachingIntelligenceService();