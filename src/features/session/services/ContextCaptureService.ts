import { AdaptationTrigger } from '@/features/unified-coaching/types/unifiedCoaching.types';

/**
 * Session Context State
 * Tracks real-time signals for adaptation triggers
 */
export interface SessionContextState {
  timeRemaining: number; // in seconds
  exercisesRemaining: number;
  energyLevel?: 'low' | 'medium' | 'high';
  manualFatigueReport?: boolean;
}

/**
 * ContextCaptureService
 * Singleton service to aggregate energy, time, and fatigue signals
 * and detect adaptation triggers.
 */
export class ContextCaptureService {
  private static instance: ContextCaptureService;
  private formQualityHistory: number[] = [];
  private sessionState: SessionContextState = {
    timeRemaining: 3600,
    exercisesRemaining: 0
  };

  private constructor() {}

  /**
   * Get Singleton instance
   */
  public static getInstance(): ContextCaptureService {
    if (!ContextCaptureService.instance) {
      ContextCaptureService.instance = new ContextCaptureService();
    }
    return ContextCaptureService.instance;
  }

  /**
   * Reset context for new session
   */
  public clearContext(): void {
    this.formQualityHistory = [];
    this.sessionState = {
      timeRemaining: 3600,
      exercisesRemaining: 0
    };
  }

  /**
   * Record a new form quality data point
   * Detects fatigue trend ( < 70% quality over 3 reps )
   */
  public recordFormQuality(quality: number): AdaptationTrigger[] {
    this.formQualityHistory.push(quality);
    if (this.formQualityHistory.length > 3) {
      this.formQualityHistory.shift();
    }

    return this.detectFatigue();
  }

  /**
   * Update general session state
   * Detects time constraints ( < 5 mins and 3+ exercises left )
   */
  public updateSessionState(state: Partial<SessionContextState>): AdaptationTrigger[] {
    this.sessionState = { ...this.sessionState, ...state };
    return this.getActiveTriggers();
  }

  /**
   * Detect fatigue based on history
   */
  private detectFatigue(): AdaptationTrigger[] {
    const triggers: AdaptationTrigger[] = [];
    if (this.formQualityHistory.length === 3 && 
        this.formQualityHistory.every(q => q < 0.7)) {
      triggers.push(AdaptationTrigger.FATIGUE);
      triggers.push(AdaptationTrigger.FORM_BREAKDOWN);
    }
    return triggers;
  }

  /**
   * Get all currently active triggers
   */
  public getActiveTriggers(): AdaptationTrigger[] {
    const triggers: Set<AdaptationTrigger> = new Set();
    
    // Fatigue detection
    this.detectFatigue().forEach(t => triggers.add(t));

    // Time constraint detection: < 5 mins (300s) and 3+ exercises left
    if (this.sessionState.timeRemaining < 300 && this.sessionState.exercisesRemaining >= 3) {
      triggers.add(AdaptationTrigger.TIME_CONSTRAINT);
    }

    // Energy level detection
    if (this.sessionState.energyLevel === 'low' || this.sessionState.manualFatigueReport) {
      triggers.add(AdaptationTrigger.ENERGY_LOW);
    }

    return Array.from(triggers);
  }

  /**
   * Get the current context snapshot
   */
  public getContextSnapshot() {
    return {
      formQualityHistory: [...this.formQualityHistory],
      sessionState: { ...this.sessionState },
      activeTriggers: this.getActiveTriggers(),
      recentFatigue: this.formQualityHistory.length === 3 && this.formQualityHistory.every(q => q < 0.7)
    };
  }
}
