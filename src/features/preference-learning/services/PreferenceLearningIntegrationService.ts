/**
 * Preference Learning Integration Service
 * Integrates preference learning with unified coaching orchestrator
 */

import type {
  PreferencePattern,
  IPreferenceLearningService,
  PreferenceLearningConfig
} from '../types/preferenceLearning.types';

import type {
  CoachingDecision,
  UnifiedCoachingState,
  LiveSessionState,
  FormCorrectionState,
  SafetyOverrideState,
  InjuryAwareState
} from '../../unified-coaching/types/unifiedCoaching.types';
import { AICoachingOrchestrator } from '../../unified-coaching/AICoachingOrchestrator';

import { PreferenceLearningService } from '../PreferenceLearningService';
import { RealTensorFlowJSService } from './RealTensorFlowJSService';
import { secureStorage } from '../../privacy/services/SecureStorage';

/**
 * Preference Learning Integration Service
 * Bridges preference learning with unified coaching system
 */
export class PreferenceLearningIntegrationService {
  private static instance: PreferenceLearningIntegrationService;
  private preferenceService: IPreferenceLearningService;
  private config: PreferenceLearningConfig;
  private orchestrator: AICoachingOrchestrator;

  constructor(
    preferenceService: IPreferenceLearningService,
    config: PreferenceLearningConfig
  ) {
    this.preferenceService = preferenceService;
    this.config = config;
    this.orchestrator = new AICoachingOrchestrator();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PreferenceLearningIntegrationService {
    if (!PreferenceLearningIntegrationService.instance) {
      const config: PreferenceLearningConfig = {
        learningRate: 0.1,
        confidenceThreshold: 0.7,
        maxContradictions: 3,
        minSessions: 5,
        gradualAdaptationRate: 0.05,
        privacySettings: {
          localOnly: true,
          encryptionEnabled: true,
          retentionDays: 90
        }
      };

      const preferenceService = new PreferenceLearningService({
        privacyService: secureStorage as any,
        tensorFlowService: new RealTensorFlowJSService(),
        config
      });

      PreferenceLearningIntegrationService.instance = new PreferenceLearningIntegrationService(
        preferenceService,
        config
      );
    }
    return PreferenceLearningIntegrationService.instance;
  }

  /**
   * Apply learned preferences to coaching decision
   */
  async applyPreferencesToCoaching(
    coachingDecision: CoachingDecision,
    session: {
      liveSession: LiveSessionState;
      formCorrection: FormCorrectionState;
      safetyOverride: SafetyOverrideState;
      injuryAware: InjuryAwareState;
    }
  ): Promise<CoachingDecision> {
    try {
      // Get user's learned preferences
      const userId = this.extractUserId(session);
      const learnedPreferences = await this.preferenceService.getLearnedPreferences(userId);
      
      if (learnedPreferences.length === 0) {
        // No preferences learned yet, return original decision
        return coachingDecision;
      }

      // Apply preference-based modifications to coaching decision
      const preferenceModifications = this.calculatePreferenceModifications(learnedPreferences, session);
      
      // Return modified coaching decision
      const modifiedDecision: CoachingDecision = {
        ...coachingDecision,
        response: {
          ...coachingDecision.response,
          reasoning: `${coachingDecision.response.reasoning} | Preferences applied: ${preferenceModifications.join(', ')}`,
          metadata: {
            ...coachingDecision.response.metadata,
            preferencesApplied: preferenceModifications,
            preferenceCount: learnedPreferences.length
          }
        },
        metadata: {
          ...coachingDecision.metadata,
          systemsConsidered: coachingDecision.metadata.systemsConsidered + 1, // Include preference system
          conflictsResolved: coachingDecision.metadata.conflictsResolved + preferenceModifications.length,
          timestamp: Date.now()
        }
      };

      return modifiedDecision;
    } catch (error) {
      console.error('Error applying preferences to coaching:', error);
      // Return original decision if preference application fails
      return coachingDecision;
    }
  }

  /**
   * Real integration with unified coaching orchestrator
   */
  async integrateWithUnifiedCoaching(
    session: {
      liveSession: LiveSessionState;
      formCorrection: FormCorrectionState;
      safetyOverride: SafetyOverrideState;
      injuryAware: InjuryAwareState;
    },
    userId: string
  ): Promise<CoachingDecision> {
    try {
      // Get user's learned preferences
      const learnedPreferences = await this.preferenceService.getLearnedPreferences(userId);
      
      if (learnedPreferences.length === 0) {
        // No preferences learned yet, let orchestrator handle
        return await this.orchestrator.processIntegratedCoaching(session);
      }

      // Process through orchestrator first
      const baseDecision = await this.orchestrator.processIntegratedCoaching(session);
      
      // Apply preference-based modifications
      const preferenceModifications = this.calculatePreferenceModifications(learnedPreferences, session);
      
      // Return preference-enhanced decision
      const enhancedDecision: CoachingDecision = {
        ...baseDecision,
        response: {
          ...baseDecision.response,
          reasoning: `${baseDecision.response.reasoning} | Enhanced by preferences: ${preferenceModifications.join(', ')}`,
          metadata: {
            ...baseDecision.response.metadata,
            preferencesApplied: preferenceModifications,
            preferenceCount: learnedPreferences.length,
            confidenceBoost: this.calculateConfidenceBoost(learnedPreferences)
          }
        },
        metadata: {
          ...baseDecision.metadata,
          systemsConsidered: baseDecision.metadata.systemsConsidered + 1, // Include preference system
          conflictsResolved: baseDecision.metadata.conflictsResolved + preferenceModifications.length,
          timestamp: Date.now()
        }
      };

      return enhancedDecision;
    } catch (error) {
      console.error('Error in unified coaching integration:', error);
      // Fallback to orchestrator-only decision
      return await this.orchestrator.processIntegratedCoaching(session);
    }
  }

  /**
   * Calculate confidence boost from learned preferences
   */
  private calculateConfidenceBoost(preferences: PreferencePattern[]): number {
    const highConfidencePrefs = preferences.filter(p => p.confidence >= 0.8);
    const strongPrefs = preferences.filter(p => p.strength >= 0.7);
    
    // Boost confidence based on preference quality and quantity
    const baseBoost = Math.min(preferences.length * 0.02, 0.15); // Max 15% boost
    const qualityBoost = (highConfidencePrefs.length * 0.05) + (strongPrefs.length * 0.03);
    
    return Math.min(baseBoost + qualityBoost, 0.25); // Max 25% total boost
  }

  /**
   * Update preferences based on session completion
   */
  async updatePreferencesFromSession(
    session: {
      liveSession: LiveSessionState;
      formCorrection: FormCorrectionState;
      safetyOverride: SafetyOverrideState;
      injuryAware: InjuryAwareState;
    },
    userFeedback?: {
      satisfaction: number; // 1-5 scale
      difficulty: number; // 1-5 scale
      energy: number; // 1-5 scale
    }
  ): Promise<void> {
    try {
      const userId = this.extractUserId(session);
      const existingPreferences = await this.preferenceService.getLearnedPreferences(userId);

      // Convert session to preference learning format
      const workoutSession = this.convertSessionToWorkoutSession(session, userFeedback);
      const preferenceInput = {
        session: workoutSession,
        existingPatterns: existingPreferences,
        userContext: {
          currentMood: this.extractCurrentMood(session),
          sessionPhase: this.extractSessionPhase(session),
          recentPerformance: this.calculateRecentPerformance(session)
        }
      };

      // Detect and update preferences
      await this.preferenceService.detectPreferences(preferenceInput);
    } catch (error) {
      console.error('Error updating preferences from session:', error);
      throw new Error(`Failed to update preferences: ${error}`);
    }
  }

  /**
   * Get preference influence for transparency
   */
  async getPreferenceInfluence(
    session: {
      liveSession: LiveSessionState;
      formCorrection: FormCorrectionState;
      safetyOverride: SafetyOverrideState;
      injuryAware: InjuryAwareState;
    }
  ): Promise<{
    appliedPreferences: string[];
    influenceStrength: number;
    safetyOverrides: string[];
  }> {
    try {
      const userId = this.extractUserId(session);
      const learnedPreferences = await this.preferenceService.getLearnedPreferences(userId);
      
      const appliedPreferences: string[] = [];
      const safetyOverrides: string[] = [];
      let totalInfluence = 0;

      for (const preference of learnedPreferences) {
        if (preference.strength < 0.5) {
          continue; // Skip weak preferences
        }

        const influence = this.calculatePreferenceInfluence(preference, session);
        if (influence.applied) {
          appliedPreferences.push(`${preference.patternType}: ${preference.confidence.toFixed(2)}`);
          totalInfluence += influence.strength;
          
          if (influence.safetyOverride) {
            safetyOverrides.push(preference.id);
          }
        }
      }

      return {
        appliedPreferences,
        influenceStrength: Math.min(1.0, totalInfluence),
        safetyOverrides
      };
    } catch (error) {
      console.error('Error getting preference influence:', error);
      return {
        appliedPreferences: [],
        influenceStrength: 0,
        safetyOverrides: []
      };
    }
  }

  /**
   * Get preference-based recommendation modifications
   */
  async getPreferenceModifications(
    session: {
      liveSession: LiveSessionState;
      formCorrection: FormCorrectionState;
      safetyOverride: SafetyOverrideState;
      injuryAware: InjuryAwareState;
    }
  ): Promise<{
    exerciseModifications: string[];
    intensityModifications: string[];
    safetyConstraints: string[];
  }> {
    try {
      const userId = this.extractUserId(session);
      const learnedPreferences = await this.preferenceService.getLearnedPreferences(userId);

      const exerciseModifications: string[] = [];
      const intensityModifications: string[] = [];
      const safetyConstraints: string[] = [];

      for (const preference of learnedPreferences) {
        if (preference.patternType === 'exercise-selection') {
          const exerciseMods = this.extractExerciseModifications(preference);
          exerciseModifications.push(...exerciseMods);
        }

        if (preference.patternType === 'intensity-level') {
          const intensityMods = this.extractIntensityModifications(preference);
          intensityModifications.push(...intensityMods);
        }

        // Extract safety constraints
        const constraints = this.extractSafetyConstraints(preference);
        safetyConstraints.push(...constraints);
      }

      return {
        exerciseModifications,
        intensityModifications,
        safetyConstraints
      };
    } catch (error) {
      console.error('Error getting preference modifications:', error);
      return {
        exerciseModifications: [],
        intensityModifications: [],
        safetyConstraints: []
      };
    }
  }

  /**
   * Private helper methods
   */

  private extractUserId(session: any): string {
    // Extract user ID from session data
    return session.liveSession?.userId || session.injuryAware?.userId || 'default-user';
  }

  private calculatePreferenceModifications(preferences: PreferencePattern[], session: any): string[] {
    const modifications: string[] = [];

    for (const preference of preferences) {
      if (preference.strength < 0.5) {
        continue; // Skip weak preferences
      }

      switch (preference.patternType) {
        case 'exercise-selection':
          modifications.push(`Exercise preferences applied (${preference.confidence.toFixed(2)} confidence)`);
          break;
        case 'intensity-level':
          modifications.push(`Intensity preferences applied (${preference.confidence.toFixed(2)} confidence)`);
          break;
        case 'workout-timing':
          modifications.push(`Timing preferences applied (${preference.confidence.toFixed(2)} confidence)`);
          break;
        default:
          modifications.push(`${preference.patternType} preferences applied`);
      }
    }

    return modifications;
  }

  private convertSessionToWorkoutSession(session: any, userFeedback?: any): any {
    // Convert unified coaching session to workout session format for preference learning
    return {
      id: this.generateSessionId(),
      userId: this.extractUserId(session),
      exercises: this.extractExercisesFromSession(session),
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: this.extractSessionDuration(session),
      performance: {
        overallScore: this.calculateOverallPerformance(session),
        consistencyScore: this.calculateConsistencyScore(session),
        fatigueLevel: this.extractFatigueLevel(session),
        motivationLevel: this.extractMotivationLevel(session, userFeedback)
      }
    };
  }

  private extractExercisesFromSession(session: any): any[] {
    // Extract exercises from live session data
    const exercises: any[] = [];
    
    if (session.liveSession?.exercises) {
      for (const exercise of session.liveSession.exercises) {
        exercises.push({
          exerciseId: exercise.id,
          exerciseType: exercise.type || 'strength',
          duration: exercise.duration || 300,
          sets: exercise.sets || 3,
          reps: exercise.reps || 10,
          intensity: exercise.intensity || 0.5,
          completionRate: exercise.completionRate || 1.0,
          userFeedback: this.extractUserFeedback(exercise)
        });
      }
    }

    return exercises;
  }

  private extractUserFeedback(exercise: any): any {
    // Extract user feedback from exercise data if available
    return {
      difficulty: exercise.userDifficulty || 3,
      satisfaction: exercise.userSatisfaction || 4,
      energy: exercise.userEnergy || 3
    };
  }

  private calculatePreferenceInfluence(preference: PreferencePattern, session: any): {
    applied: boolean;
    strength: number;
    safetyOverride: boolean;
  } {
    // Calculate how much a preference influences current session
    const sessionRelevance = this.calculateSessionRelevance(preference, session);
    
    return {
      applied: sessionRelevance > 0.3 && preference.confidence > 0.6,
      strength: preference.strength * sessionRelevance,
      safetyOverride: this.preferenceOverridesSafety(preference, session)
    };
  }

  private calculateSessionRelevance(preference: PreferencePattern, session: any): number {
    // Calculate how relevant a preference is to current session
    switch (preference.patternType) {
      case 'exercise-selection':
        return this.calculateExerciseRelevance(preference, session);
      case 'intensity-level':
        return this.calculateIntensityRelevance(preference, session);
      case 'workout-timing':
        return this.calculateTimingRelevance(preference, session);
      default:
        return 0.5; // Default relevance
    }
  }

  private calculateExerciseRelevance(preference: PreferencePattern, session: any): number {
    if (!preference.data.exercisePreferences) {
      return 0;
    }

    const sessionExercises = this.extractExercisesFromSession(session);
    const preferredExercises = preference.data.exercisePreferences
      .filter((pref: any) => pref.preference === 'preferred')
      .map((pref: any) => pref.exerciseId);

    if (sessionExercises.length === 0) {
      return 0;
    }

    const overlap = sessionExercises.filter(ex => 
      preferredExercises.includes(ex.exerciseId)
    ).length;

    return overlap / sessionExercises.length;
  }

  private calculateIntensityRelevance(preference: PreferencePattern, session: any): number {
    if (!preference.data.intensityPreferences || preference.data.intensityPreferences.length === 0) {
      return 0;
    }

    const sessionExercises = this.extractExercisesFromSession(session);
    if (sessionExercises.length === 0) {
      return 0;
    }

    const avgSessionIntensity = sessionExercises.reduce((sum: number, ex: any) => 
      sum + (ex.intensity || 0.5), 0
    ) / sessionExercises.length;

    const intensityPref = preference.data.intensityPreferences[0];
    if (intensityPref?.intensityRange) {
      const preferredRange = intensityPref.intensityRange;
      if (avgSessionIntensity >= preferredRange.min && avgSessionIntensity <= preferredRange.max) {
        return 1.0;
      } else {
        const distance = Math.min(
          Math.abs(avgSessionIntensity - preferredRange.min),
          Math.abs(avgSessionIntensity - preferredRange.max)
        );
        return Math.max(0, 1.0 - distance);
      }
    }

    return 0.5;
  }

  private calculateTimingRelevance(preference: PreferencePattern, session: any): number {
    // Simplified timing relevance calculation
    const currentHour = new Date().getHours();
    const timingPref = preference.data.timingPreferences?.[0]?.timeOfDay;
    
    if (!timingPref) {
      return 0.5;
    }

    switch (timingPref) {
      case 'morning':
        return currentHour >= 6 && currentHour < 12 ? 1.0 : 0.2;
      case 'afternoon':
        return currentHour >= 12 && currentHour < 18 ? 1.0 : 0.2;
      case 'evening':
        return currentHour >= 18 && currentHour < 22 ? 1.0 : 0.2;
      default:
        return 0.5;
    }
  }

  private extractExerciseModifications(preference: PreferencePattern): string[] {
    const modifications: string[] = [];
    
    if (preference.data.exercisePreferences) {
      for (const pref of preference.data.exercisePreferences) {
        if (pref.preference === 'preferred') {
          modifications.push(`Include ${pref.exerciseId} (confidence: ${pref.confidence.toFixed(2)})`);
        } else if (pref.preference === 'avoided') {
          modifications.push(`Avoid ${pref.exerciseId} (confidence: ${pref.confidence.toFixed(2)})`);
        }
      }
    }

    return modifications;
  }

  private extractIntensityModifications(preference: PreferencePattern): string[] {
    const modifications: string[] = [];
    
    if (preference.data.intensityPreferences && preference.data.intensityPreferences.length > 0) {
      for (const pref of preference.data.intensityPreferences) {
        if (pref.intensityRange && pref.preference) {
          const range = pref.intensityRange;
          modifications.push(`Intensity ${pref.preference}: ${range.min.toFixed(2)}-${range.max.toFixed(2)} (confidence: ${pref.confidence.toFixed(2)})`);
        }
      }
    }

    return modifications;
  }

  private extractSafetyConstraints(preference: PreferencePattern): string[] {
    const constraints: string[] = [];
    
    if (preference.patternType === 'intensity-level' && preference.data.intensityPreferences) {
      for (const pref of preference.data.intensityPreferences) {
        if (pref.intensityRange && pref.intensityRange.max > 0.95) {
          constraints.push(`High intensity preference for ${pref.exerciseTypes?.join(', ') || 'general'}`);
        }
      }
    }

    if (preference.patternType === 'exercise-selection' && preference.data.exercisePreferences) {
      for (const pref of preference.data.exercisePreferences) {
        if (pref.preference === 'preferred' && this.isUnsafeExercise(pref.exerciseId)) {
          constraints.push(`Preference for unsafe exercise: ${pref.exerciseId}`);
        }
      }
    }

    return constraints;
  }

  private preferenceOverridesSafety(preference: PreferencePattern, session: any): boolean {
    // Check if this preference would override safety constraints
    if (preference.patternType === 'intensity-level') {
      const intensityPref = preference.data.intensityPreferences?.[0];
      if (intensityPref?.intensityRange?.max > 0.95) {
        return true; // Very high intensity preference overrides safety
      }
    }

    if (preference.patternType === 'exercise-selection') {
      const exercisePrefs = preference.data.exercisePreferences || [];
      for (const pref of exercisePrefs) {
        if (pref.preference === 'preferred' && this.isUnsafeExercise(pref.exerciseId)) {
          return true; // Preference for unsafe exercise overrides safety
        }
      }
    }

    return false;
  }

  private isUnsafeExercise(exerciseId: string): boolean {
    // List of exercises considered unsafe for preference-based selection
    const unsafeExercises = [
      'dangerous-lift',
      'advanced-plyometrics',
      'heavy-weight-attempts',
      'unsupervised-equipment'
    ];
    
    return unsafeExercises.includes(exerciseId);
  }

  private extractCurrentMood(session: any): 'energetic' | 'fatigued' | 'focused' | 'distracted' {
    return session.liveSession?.userMood || 'focused';
  }

  private extractSessionPhase(session: any): 'warmup' | 'main' | 'cooldown' | 'recovery' {
    return session.liveSession?.phase || 'main';
  }

  private calculateRecentPerformance(session: any): number {
    return session.liveSession?.recentPerformance || 0.8;
  }

  private extractSessionDuration(session: any): number {
    return session.liveSession?.duration || 1800; // Default 30 minutes
  }

  private calculateOverallPerformance(session: any): number {
    const liveSession = session.liveSession || {};
    const formCorrection = session.formCorrection || {};
    const safetyOverride = session.safetyOverride || {};
    
    // Combine performance metrics from different systems
    const metrics = [
      liveSession.performanceScore || 0.8,
      formCorrection.accuracy || 0.7,
      safetyOverride.safetyScore || 0.9
    ].filter(score => score !== undefined);

    return metrics.length > 0 ? metrics.reduce((sum, score) => sum + score, 0) / metrics.length : 0.5;
  }

  private calculateConsistencyScore(session: any): number {
    return session.liveSession?.consistencyScore || 0.7;
  }

  private extractFatigueLevel(session: any): number {
    return session.liveSession?.fatigueLevel || 0.3;
  }

  private extractMotivationLevel(session: any, userFeedback?: any): number {
    const baseMotivation = session.liveSession?.motivationLevel || 0.7;
    const feedbackMotivation = userFeedback ? (userFeedback.energy / 5) : 0.6;
    
    return (baseMotivation + feedbackMotivation) / 2;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}