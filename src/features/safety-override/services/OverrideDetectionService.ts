// Types for Override Detection System
import { SafetyDefaultsService } from './SafetyDefaultsService';

export interface AIRecommendation {
  id: string;
  type: 'exercise_modification' | 'rest_adjustment' | 'intensity_change';
  exerciseName?: string;
  originalReps?: number;
  suggestedReps?: number;
  originalSets?: number;
  suggestedSets?: number;
  restTime?: number;
  reasoning: string;
  timestamp: number;
  context: {
    energyLevel: 'normal' | 'tired';
    timeRemaining: number;
    equipmentAvailable: string[];
  };
}

export interface OverrideEvent {
  id: string;
  recommendationId: string;
  userAction: 'disagree' | 'override_tap' | 'skip_exercise';
  interactionMethod: 'one_tap' | 'menu_selection';
  timestamp: number;
  context: AIRecommendation['context'];
  processingTime: number;
}

export interface OverrideDetectionState {
  isMonitoring: boolean;
  overrideHistory: OverrideEvent[];
  currentRecommendations: AIRecommendation[];
}

export type UserAction = 'disagree' | 'override_tap' | 'view_details' | 'skip_exercise';

export class OverrideDetectionService {
  private state: OverrideDetectionState = {
    isMonitoring: false,
    overrideHistory: [],
    currentRecommendations: []
  };

  private safetyDefaultsService: SafetyDefaultsService;

  private performanceTracker = {
    lastProcessingTime: 0,
    averageProcessingTime: 0,
    processCount: 0
  };

  constructor() {
    // Initialize safety defaults service
    this.safetyDefaultsService = new SafetyDefaultsService();
  }

  // Start monitoring for user overrides
  startMonitoring(): void {
    this.state.isMonitoring = true;
  }

  // Stop monitoring for user overrides
  stopMonitoring(): void {
    this.state.isMonitoring = false;
  }

  // Detect if user is overriding a recommendation
  async detectOverride(
    recommendation: AIRecommendation, 
    userAction: UserAction
  ): Promise<OverrideEvent | null> {
    const startTime = Date.now();

    if (!this.state.isMonitoring) {
      return null;
    }

    // Check if this action constitutes an override
    if (!this.isOverrideAction(userAction)) {
      return null;
    }

    // Create override event
    const overrideEvent: OverrideEvent = {
      id: this.generateOverrideId(),
      recommendationId: recommendation.id,
      userAction: userAction as 'disagree' | 'override_tap' | 'skip_exercise',
      interactionMethod: userAction === 'override_tap' ? 'one_tap' : 'menu_selection',
      timestamp: Date.now(),
      context: recommendation.context,
      processingTime: Date.now() - startTime
    };

    // Store in history
    this.state.overrideHistory.push(overrideEvent);
    this.updatePerformanceMetrics(overrideEvent.processingTime);

    // Apply safety defaults after override (AC #6)
    this.applySafetyDefaultsAfterOverride(recommendation);

    return overrideEvent;
  }

  // Add a recommendation to current tracking
  addRecommendation(recommendation: AIRecommendation): void {
    this.state.currentRecommendations.push(recommendation);
  }

  // Remove a recommendation from tracking
  removeRecommendation(recommendationId: string): void {
    this.state.currentRecommendations = 
      this.state.currentRecommendations.filter(r => r.id !== recommendationId);
  }

  // Clear all recommendations
  clearRecommendations(): void {
    this.state.currentRecommendations = [];
  }

  // Get current service state
  getState(): OverrideDetectionState {
    return { ...this.state };
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return { ...this.performanceTracker };
  }

  // Clean up resources
  destroy(): void {
    this.stopMonitoring();
    this.clearRecommendations();
    this.state.overrideHistory = [];
  }

  // Private methods
  private isOverrideAction(userAction: UserAction): boolean {
    const overrideActions: UserAction[] = ['disagree', 'override_tap', 'skip_exercise'];
    return overrideActions.includes(userAction);
  }

  private generateOverrideId(): string {
    return `override_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceTracker.lastProcessingTime = processingTime;
    this.performanceTracker.processCount++;
    
    // Calculate average processing time
    const total = this.performanceTracker.averageProcessingTime * (this.performanceTracker.processCount - 1) + processingTime;
    this.performanceTracker.averageProcessingTime = total / this.performanceTracker.processCount;
  }

  // Apply safety defaults after override (AC #6)
  private applySafetyDefaultsAfterOverride(recommendation: AIRecommendation): void {
    try {
      // Apply safety defaults to future recommendations
      const safetyAdjusted = this.safetyDefaultsService.applySafetyDefaults(recommendation, recommendation.context);
      
      // Log safety adjustment for learning (without PII)
      console.log('Safety defaults applied after override:', {
        recommendationId: recommendation.id,
        originalReps: recommendation.originalReps,
        adjustedReps: safetyAdjusted.suggestedReps,
        reasoning: safetyAdjusted.reasoning
      });
    } catch (error) {
      console.warn('Failed to apply safety defaults after override:', error);
    }
  }
}