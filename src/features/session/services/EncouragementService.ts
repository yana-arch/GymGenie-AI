import { AudioCoachingService } from '@/features/form-correction/services/AudioCoachingService';
import { CoachingPriority } from '@/features/unified-coaching/types/unifiedCoaching.types';
import { ContextCaptureService } from './ContextCaptureService';
import { coachingIntelligenceService } from '@/features/unified-coaching/services/CoachingIntelligenceService';

export class EncouragementService {
  private static instance: EncouragementService;
  private lastEncouragementTime = 0;
  private encouragementCooldown = 30000; // 30 seconds
  private setProgressMilestonesReached: Set<number> = new Set();
  private repTimestamps: number[] = [];

  private phrases = {
    progress: [
      "Keep pushing!",
      "Halfway through the set, you've got this!",
      "Almost done, stay strong!",
      "Final reps, give it everything!"
    ],
    pace: [
      "Great pace! Keep it up.",
      "Nice and steady, perfect rhythm.",
      "Consistency is key, looking good!"
    ],
    fatigue: [
      "I know it's getting tough, stay focused on form!",
      "Deep breaths, you're stronger than you think.",
      "Push through the burn, you're doing great!"
    ]
  };

  private constructor() {}

  public static getInstance(): EncouragementService {
    if (!EncouragementService.instance) {
      EncouragementService.instance = new EncouragementService();
    }
    return EncouragementService.instance;
  }

  /**
   * Check set progress and trigger encouragement at 50% and 90%
   */
  public checkSetProgress(currentReps: number, targetReps: number): string | null {
    if (targetReps <= 0) return null;
    const progress = currentReps / targetReps;
    
    let message: string | null = null;
    
    if (progress >= 0.9 && !this.setProgressMilestonesReached.has(90)) {
      message = this.phrases.progress[2];
      this.setProgressMilestonesReached.add(90);
      this.setProgressMilestonesReached.add(50); // Mark 50 as reached too if we jump past it
    } else if (progress >= 0.5 && !this.setProgressMilestonesReached.has(50)) {
      message = this.phrases.progress[1];
      this.setProgressMilestonesReached.add(50);
    }

    if (message) {
      this.triggerEncouragement(message);
    }
    return message;
  }

  /**
   * Reset set-specific milestones (call at start of new set)
   */
  public resetSetProgress(): void {
    this.setProgressMilestonesReached.clear();
    this.repTimestamps = [];
    this.paceConsistencyStreak = 0;
  }

  private paceConsistencyStreak = 0;

  /**
   * Record a rep and check for pace consistency
   */
  public recordRep(): void {
    const now = Date.now();
    this.repTimestamps.push(now);
    if (this.repTimestamps.length > 5) {
      this.repTimestamps.shift();
    }
    this.checkPaceConsistency();
  }

  /**
   * Check pace consistency and trigger encouragement
   */
  private checkPaceConsistency(): void {
    if (this.repTimestamps.length < 3) return;
    
    const intervals = [];
    for (let i = 1; i < this.repTimestamps.length; i++) {
      intervals.push(this.repTimestamps[i] - this.repTimestamps[i-1]);
    }
    
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < avg * 0.15) { // Within 15% consistency
      this.paceConsistencyStreak++;
      if (this.paceConsistencyStreak >= 3) {
        this.speakRandom('pace');
        this.paceConsistencyStreak = 0; // Reset after speaking to avoid spam
      }
    } else {
      this.paceConsistencyStreak = 0;
    }
  }

  /**
   * Specifically celebrate a personal best
   */
  public celebratePersonalBest(label: string): void {
    this.triggerEncouragement(`New Personal Best! ${label}`, true);
  }

  /**
   * Check for fatigue and trigger encouragement
   */
  public checkFatigue(): void {
    const context = ContextCaptureService.getInstance().getContextSnapshot();
    if (context.recentFatigue) {
      this.speakRandom('fatigue');
    }
  }

  /**
   * Trigger encouragement with cooldown and preference check
   */
  public triggerEncouragement(message: string, force = false): void {
    const preferences = coachingIntelligenceService.getPreferences();
    
    // Respect minimal frequency preference
    if (preferences.communicationFrequency === 'minimal' && !force) {
      return;
    }

    const now = Date.now();
    
    // Adjust cooldown based on frequency preference
    let cooldown = this.encouragementCooldown;
    if (preferences.communicationFrequency === 'frequent') {
      cooldown = 15000; // 15 seconds
    } else if (preferences.communicationFrequency === 'moderate') {
      cooldown = 30000; // Default
    } else if (preferences.communicationFrequency === 'minimal') {
      cooldown = 60000; // 1 minute
    }

    // Boost frequency if tone is 'encouraging'
    if (preferences.communicationTone === 'encouraging') {
      cooldown *= 0.75;
    }

    if (force || now - this.lastEncouragementTime > cooldown) {
      this.lastEncouragementTime = now;
      AudioCoachingService.getInstance().speak(message, CoachingPriority.ENCOURAGEMENT);
    }
  }

  /**
   * Speak random encouragement based on category
   */
  public speakRandom(category: 'progress' | 'pace' | 'fatigue'): void {
    const categoryPhrases = this.phrases[category];
    const message = categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
    this.triggerEncouragement(message);
  }
}
