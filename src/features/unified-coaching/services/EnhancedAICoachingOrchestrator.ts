/**
 * Enhanced AI Coaching Orchestrator
 * Integrates coaching intelligence for personalized, adaptive coaching
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
  AdaptationTrigger
} from '../types/unifiedCoaching.types';

import {
  EnhancedCoachingDecision,
  EnhancedAICoachingInput,
  CoachingIntelligenceConfig,
  IntelligenceMetrics
} from '../types/coachingIntelligence.types';

import { AICoachingOrchestrator } from '../AICoachingOrchestrator';
import { coachingIntelligenceService, CoachingIntelligenceService } from './CoachingIntelligenceService';
import { ContextCaptureService } from '@/features/session/services/ContextCaptureService';
import { AdaptationGenerator } from '@/features/session/services/AdaptationGenerator';

/**
 * Enhanced AI Coaching Orchestrator
 * Extends the base orchestrator with intelligence capabilities
 */
export class EnhancedAICoachingOrchestrator extends AICoachingOrchestrator {
  private intelligenceService: CoachingIntelligenceService;
  private adaptationGenerator: AdaptationGenerator;
  private enhancedSessionMetrics: Map<string, SessionMetrics> = new Map();

  constructor(config?: Partial<CoachingIntelligenceConfig>) {
    super();
    this.intelligenceService = new CoachingIntelligenceService(config);
    this.adaptationGenerator = new AdaptationGenerator();
  }

  /**
   * Initialize the enhanced orchestrator
   */
  async initialize(): Promise<void> {
    await this.intelligenceService.initialize();
  }

  /**
   * Process integrated coaching with intelligence enhancement
   */
  async processIntelligentCoaching(session: {
    liveSession: LiveSessionState;
    formCorrection: FormCorrectionState;
    safetyOverride: SafetyOverrideState;
    injuryAware: InjuryAwareState;
    userContext?: {
      currentMood?: 'energetic' | 'fatigued' | 'focused' | 'distracted';
      sessionPhase: 'warmup' | 'main' | 'cooldown' | 'recovery';
      recentPerformance: number;
      complianceHistory: number;
      adaptationTriggers?: AdaptationTrigger[];
    };
  }): Promise<EnhancedCoachingDecision> {
    const sessionId = this.generateSessionId(session);
    const startTime = performance.now();

    try {
      // Get base coaching decision from parent orchestrator
      const baseDecision = await super.processIntegratedCoaching(session);
      
      // Create enhanced AI inputs with user context
      const enhancedInputs = this.createEnhancedInputs(session, baseDecision);

      // Add local adaptation input if triggers are active
      const localAdaptationInput = await this.collectLocalAdaptationInput(session);
      if (localAdaptationInput) {
        enhancedInputs.push(localAdaptationInput);
      }
      
      // Enhance decision with intelligence
      const enhancedDecision = await this.intelligenceService.enhanceCoachingDecision(
        baseDecision,
        enhancedInputs
      );

      // Update session metrics
      this.updateSessionMetrics(sessionId, enhancedDecision, performance.now() - startTime);
      
      // Apply intelligent conflict resolution with learning
      const finalDecision = await this.applyIntelligentConflictResolution(enhancedDecision, enhancedInputs);

      return finalDecision;

    } catch (error) {
      console.error('Error in enhanced AI coaching orchestration:', error);
      return this.createIntelligentFallbackDecision(error, session);
    }
  }

  /**
   * Process user feedback for learning
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
    await this.intelligenceService.processUserFeedback(decisionId, feedback);
    
    // Update session metrics
    const metrics = this.enhancedSessionMetrics.get(decisionId);
    if (metrics) {
      metrics.userResponse = feedback;
      metrics.satisfaction = feedback.satisfaction || 0.5;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<void> {
    await this.intelligenceService.updatePreferences(preferences);
  }

  /**
   * Get current preferences and learning profile
   */
  getIntelligenceData() {
    return {
      preferences: this.intelligenceService.getPreferences(),
      learningProfile: this.intelligenceService.getLearningProfile(),
      metrics: this.intelligenceService.getMetrics()
    };
  }

  /**
   * Get session performance analytics
   */
  getSessionAnalytics(sessionId?: string): any {
    if (sessionId) {
      return this.enhancedSessionMetrics.get(sessionId);
    }
    
    // Return aggregated analytics for all sessions
    const allMetrics = Array.from(this.enhancedSessionMetrics.values());
    return this.aggregateSessionMetrics(allMetrics);
  }

  /**
   * Collect local adaptation input based on current context triggers
   */
  private async collectLocalAdaptationInput(session: any): Promise<EnhancedAICoachingInput | null> {
    const contextSnapshot = ContextCaptureService.getInstance().getContextSnapshot();
    if (contextSnapshot.activeTriggers.length === 0) return null;

    const currentExercise = session.liveSession?.currentExercise || session.adaptation?.currentExercise;
    if (!currentExercise) return null;

    const adaptation = await this.adaptationGenerator.generateAdaptation(
      currentExercise,
      contextSnapshot.activeTriggers
    );

    return {
      system: 'local-adaptation-engine',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'local-adaptation',
        confidence: 0.9,
        recommendation: adaptation,
        reasoning: adaptation.reasoning,
        timestamp: Date.now()
      },
      userContext: {
        currentMood: contextSnapshot.recentFatigue ? 'fatigued' : 'focused',
        sessionPhase: 'main',
        recentPerformance: contextSnapshot.formQualityHistory.length > 0 
          ? contextSnapshot.formQualityHistory.reduce((a, b) => a + b, 0) / contextSnapshot.formQualityHistory.length 
          : 0.8,
        complianceHistory: 0.7,
        adaptationTriggers: contextSnapshot.activeTriggers
      },
      timing: {
        optimalDeliveryTime: Date.now(),
        urgency: 0.7,
        persistence: 0.5
      }
    };
  }

  /**
   * Create enhanced AI inputs with user context
   */
  private createEnhancedInputs(
    session: any,
    baseDecision: CoachingDecision
  ): EnhancedAICoachingInput[] {
    const baseInputs = this['collectAIInputs'](session); // Access parent method
    
    // Get real-time context from ContextCaptureService
    const contextSnapshot = ContextCaptureService.getInstance().getContextSnapshot();
    
    return baseInputs.map(input => ({
      ...input,
      userContext: {
        currentMood: session.userContext?.currentMood || (contextSnapshot.recentFatigue ? 'fatigued' : 'focused'),
        sessionPhase: session.userContext?.sessionPhase || 'main',
        recentPerformance: contextSnapshot.formQualityHistory.length > 0 
          ? contextSnapshot.formQualityHistory.reduce((a, b) => a + b, 0) / contextSnapshot.formQualityHistory.length 
          : (session.userContext?.recentPerformance || 0),
        complianceHistory: session.userContext?.complianceHistory || 0.7,
        adaptationTriggers: contextSnapshot.activeTriggers
      },
      timing: {
        optimalDeliveryTime: Date.now(),
        urgency: this.calculateUrgency(input.priority, session),
        persistence: this.calculatePersistence(input.priority, baseDecision)
      }
    }));
  }

  /**
   * Apply intelligent conflict resolution with learning
   */
  private async applyIntelligentConflictResolution(
    decision: EnhancedCoachingDecision,
    inputs: EnhancedAICoachingInput[]
  ): Promise<EnhancedCoachingDecision> {
    // Check if conflicts exist that need intelligent resolution
    if (!decision.conflictResolution || decision.conflictResolution.conflicts.length === 0) {
      return decision;
    }

    // Apply learning-based conflict resolution
    const learningProfile = this.intelligenceService.getLearningProfile();
    const preferences = this.intelligenceService.getPreferences();

    // Adjust conflict resolution based on user learning patterns
    const adaptedResolution = this.adaptConflictResolution(
      decision.conflictResolution,
      learningProfile,
      preferences
    );

    return {
      ...decision,
      conflictResolution: adaptedResolution
    };
  }

  /**
   * Adapt conflict resolution based on user learning
   */
  private adaptConflictResolution(
    originalResolution: any,
    learningProfile: any,
    preferences: any
  ): any {
    // Adapt resolution strategy based on user response patterns
    const adaptedStrategy = this.selectAdaptiveStrategy(originalResolution.strategy, learningProfile);
    
    return {
      ...originalResolution,
      strategy: adaptedStrategy,
      reasoning: `${originalResolution.reasoning} (adapted based on user learning patterns)`
    };
  }

  /**
   * Select adaptive resolution strategy
   */
  private selectAdaptiveStrategy(baseStrategy: string, learningProfile: any): string {
    // Based on user learning, select best conflict resolution strategy
    const responseRate = learningProfile.responseRate.overall;
    
    if (responseRate > 0.8) {
      return 'user-trusting'; // User responds well to coaching
    } else if (responseRate < 0.5) {
      return 'conservative'; // Be more cautious with recommendations
    } else {
      return baseStrategy; // Use default strategy
    }
  }

  /**
   * Calculate urgency based on priority and context
   */
  private calculateUrgency(priority: CoachingPriority, session: any): number {
    const baseUrgency = {
      [CoachingPriority.SAFETY]: 1.0,
      [CoachingPriority.INJURY]: 0.9,
      [CoachingPriority.FORM]: 0.7,
      [CoachingPriority.ADAPTATION]: 0.5
    };

    let urgency = baseUrgency[priority] || 0.5;
    
    // SAFETY and INJURY should NEVER be deprioritized
    if (priority === CoachingPriority.SAFETY || priority === CoachingPriority.INJURY) {
      return urgency;
    }

    // Deprioritize non-critical coaching during rest periods
    const isResting = session.liveSession?.transitionStatus === 'resting';
    if (isResting) {
      urgency *= 0.5; // Reduce urgency by half during rest
    }

    // Adjust based on user context for non-critical priorities

    return Math.min(1.0, urgency);
  }

  /**
   * Calculate persistence based on priority and user compliance
   */
  private calculatePersistence(priority: CoachingPriority, decision: CoachingDecision): number {
    const basePersistence = {
      [CoachingPriority.SAFETY]: 0.9,
      [CoachingPriority.INJURY]: 0.8,
      [CoachingPriority.FORM]: 0.6,
      [CoachingPriority.ADAPTATION]: 0.4
    };

    return basePersistence[priority] || 0.5;
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(
    sessionId: string,
    decision: EnhancedCoachingDecision,
    processingTime: number
  ): void {
    const metrics: SessionMetrics = {
      sessionId,
      timestamp: Date.now(),
      decision,
      processingTime,
      userResponse: null,
      satisfaction: 0.5,
      effectiveness: decision.intelligence.predictedAcceptance
    };

    this.enhancedSessionMetrics.set(sessionId, metrics);
  }

  /**
   * Aggregate session metrics for analytics
   */
  private aggregateSessionMetrics(metrics: SessionMetrics[]): any {
    if (metrics.length === 0) return null;

    const totalProcessingTime = metrics.reduce((sum, m) => sum + m.processingTime, 0);
    const averageSatisfaction = metrics.reduce((sum, m) => sum + (m.satisfaction || 0), 0) / metrics.length;
    const averageEffectiveness = metrics.reduce((sum, m) => sum + m.effectiveness, 0) / metrics.length;

    return {
      sessionCount: metrics.length,
      totalProcessingTime,
      averageProcessingTime: totalProcessingTime / metrics.length,
      averageSatisfaction,
      averageEffectiveness,
      recentSessions: metrics.slice(-10) // Last 10 sessions
    };
  }

  /**
   * Generate session ID
   */
  private generateSessionId(session: any): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create intelligent fallback decision
   */
  private createIntelligentFallbackDecision(error: Error, session: any): EnhancedCoachingDecision {
    const baseDecision = super['createSafeDefaultDecision'](error);
    
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

  /**
   * Get intelligence configuration
   */
  getIntelligenceConfig(): CoachingIntelligenceConfig {
    return (this.intelligenceService as any).config;
  }

  /**
   * Update intelligence configuration
   */
  async updateIntelligenceConfig(config: Partial<CoachingIntelligenceConfig>): Promise<void> {
    // Note: This would require recreating the intelligence service
    // For now, this is a placeholder for future enhancement
    console.warn('Dynamic config update not yet implemented');
  }
}

/**
 * Session metrics interface
 */
interface SessionMetrics {
  sessionId: string;
  timestamp: number;
  decision: EnhancedCoachingDecision;
  processingTime: number;
  userResponse: {
    accepted: boolean;
    responseTime: number;
    satisfaction?: number;
    notes?: string;
  } | null;
  satisfaction: number;
  effectiveness: number;
}

// Export enhanced singleton instance
export const enhancedAICoachingOrchestrator = new EnhancedAICoachingOrchestrator();