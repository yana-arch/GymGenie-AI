import { aiCoachingOrchestrator } from '@/features/unified-coaching/AICoachingOrchestrator';
import { 
  LiveSessionState, 
  FormCorrectionState, 
  SafetyOverrideState, 
  InjuryAwareState,
  CoachingDecision
} from '@/features/unified-coaching/types/unifiedCoaching.types';

export class SessionGuidanceService {
  private loopRunning: boolean = false;
  private milestoneHistory: Set<number> = new Set();
  private guidanceInterval: number | null = null;

  /**
   * Starts the real-time guidance loop
   */
  startGuidanceLoop(intervalMs: number = 5000): void {
    if (this.loopRunning) return;
    
    this.loopRunning = true;
    console.log('Session guidance loop started');
    
    // In a real implementation, this might be triggered by a timer or telemetry events
    // For now, we'll expose a manual tick for the UI to call or use an interval
  }

  /**
   * Stops the guidance loop
   */
  stopGuidanceLoop(): void {
    this.loopRunning = false;
    if (this.guidanceInterval) {
      clearInterval(this.guidanceInterval);
      this.guidanceInterval = null;
    }
    console.log('Session guidance loop stopped');
  }

  /**
   * Checks if the loop is currently running
   */
  isLoopRunning(): boolean {
    return this.loopRunning;
  }

  /**
   * Processes a single guidance tick by querying the orchestrator
   */
  async processGuidanceTick(session: {
    liveSession: LiveSessionState;
    formCorrection: FormCorrectionState;
    safetyOverride: SafetyOverrideState;
    injuryAware: InjuryAwareState;
  }): Promise<CoachingDecision> {
    try {
      return await aiCoachingOrchestrator.processIntegratedCoaching(session);
    } catch (error) {
      console.error('Error processing guidance tick:', error);
      throw error;
    }
  }

  /**
   * Checks for workout milestones (25%, 50%, 75%, 100%)
   * @param progress Progress between 0 and 1
   */
  checkMilestones(progress: number): number[] {
    const milestones = [25, 50, 75, 100];
    const reached: number[] = [];
    
    const progressPercent = progress * 100;
    
    for (const milestone of milestones) {
      if (progressPercent >= milestone && !this.milestoneHistory.has(milestone)) {
        this.milestoneHistory.add(milestone);
        reached.push(milestone);
      }
    }
    
    return reached;
  }

  /**
   * Resets the milestone history (e.g., when starting a new session)
   */
  resetMilestones(): void {
    this.milestoneHistory.clear();
  }
}

export const sessionGuidanceService = new SessionGuidanceService();
