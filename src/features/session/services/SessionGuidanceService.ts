import { aiCoachingOrchestrator } from '@/features/unified-coaching/AICoachingOrchestrator';
import { 
  LiveSessionState, 
  FormCorrectionState, 
  SafetyOverrideState, 
  InjuryAwareState,
  CoachingDecision
} from '@/features/unified-coaching/types/unifiedCoaching.types';
import { MilestoneService, Milestone } from './MilestoneService';

export class SessionGuidanceService {
  private loopRunning: boolean = false;
  private milestoneService: MilestoneService = new MilestoneService();
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
   * @param energy Energy context ('normal' | 'tired')
   */
  checkMilestones(progress: number, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    return this.milestoneService.checkProgressMilestones(progress, energy);
  }

  /**
   * Record form quality and return milestones if any
   * @param isPerfect Whether form was perfect
   * @param energy Energy context ('normal' | 'tired')
   */
  recordFormQuality(isPerfect: boolean, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    return this.milestoneService.recordFormQuality(isPerfect, energy);
  }

  /**
   * Record volume and return milestones if any
   * @param weight Weight lifted
   * @param energy Energy context ('normal' | 'tired')
   */
  recordVolume(weight: number, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    return this.milestoneService.addVolume(weight, energy);
  }

  /**
   * Check for personal bests
   */
  checkPersonalBest(exerciseId: string, weight: number, reps: number, history: any[], energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    return this.milestoneService.checkPersonalBest(exerciseId, weight, reps, history, energy);
  }

  /**
   * Resets the milestone history (e.g., when starting a new session)
   */
  resetMilestones(): void {
    this.milestoneService = new MilestoneService();
  }
}

export const sessionGuidanceService = new SessionGuidanceService();
