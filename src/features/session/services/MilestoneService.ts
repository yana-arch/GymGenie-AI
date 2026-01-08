export type MilestoneType = 'PROGRESS' | 'STREAK' | 'PERSONAL_BEST' | 'VOLUME';

export interface Milestone {
  type: MilestoneType;
  value: number | string;
  label: string;
  timestamp: number;
  id: string;
  encouragement?: string;
  priority: 'low' | 'high'; // High for PBs, low for progress
}

export interface HistoricalSet {
  exerciseId: string;
  weight: number;
  reps: number;
}

export class MilestoneService {
  private formStreak = 0;
  private totalVolume = 0;
  private milestoneHistory: Set<string> = new Set();

  private messageBank = {
    PROGRESS: {
      normal: [
        "Starting strong!",
        "Quarter way through, looking good!",
        "Halfway there! Keep that intensity!",
        "The finish line is in sight!",
        "100% Complete! Phenomenal effort!"
      ],
      tired: [
        "Good start, focus on steady breathing.",
        "25% in, maintain your rhythm.",
        "50% done, great persistence.",
        "Almost there, focus on every rep.",
        "Workout complete! Excellent grit today."
      ]
    },
    STREAK: {
      normal: [
        "3 in a row! You're in the zone!",
        "6 perfect reps! Incredible consistency!",
        "9 in a row! Elite level form!"
      ],
      tired: [
        "3 in a row! Form is holding up well.",
        "6 in a row! Great discipline despite fatigue.",
        "9 in a row! Exceptional focus!"
      ]
    },
    PERSONAL_BEST: {
      normal: [
        "NEW PERSONAL BEST! You're getting stronger!",
        "RECORD BROKEN! Incredible power!",
        "UNSTOPPABLE! That's a new PB!"
      ],
      tired: [
        "PB ACHIEVED! Amazing strength despite the grind!",
        "NEW RECORD! Your hard work is paying off!",
        "SENSATIONAL! You found that extra gear!"
      ]
    },
    VOLUME: {
      normal: [
        "1,000kg lifted! You're a machine!",
        "5,000kg! Serious volume today!",
        "10,000kg! Absolute beast mode!"
      ],
      tired: [
        "1,000kg reached! Great work today.",
        "5,000kg lifted! Exceptional volume.",
        "10,000kg! You really pushed through today."
      ]
    }
  };

  checkProgressMilestones(progress: number, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    const milestones = [25, 50, 75, 100];
    const reached: Milestone[] = [];
    const progressPercent = Math.round(progress * 100);

    for (const m of milestones) {
      const milestoneKey = `PROGRESS_${m}`;
      if (progressPercent >= m && !this.milestoneHistory.has(milestoneKey)) {
        this.milestoneHistory.add(milestoneKey);
        
        const messageIndex = milestones.indexOf(m);
        const encouragement = this.messageBank.PROGRESS[energy][messageIndex] || "Keep it up!";

        reached.push({
          type: 'PROGRESS',
          value: m,
          label: `${m}% Workout Complete!`,
          encouragement,
          timestamp: Date.now(),
          id: milestoneKey, // Stable ID for Redux de-duplication
          priority: 'low'
        });
      }
    }
    return reached;
  }

  recordFormQuality(isPerfect: boolean, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    if (isPerfect) {
      this.formStreak++;
      if (this.formStreak >= 3 && this.formStreak % 3 === 0) {
        const streakLevel = Math.min(Math.floor(this.formStreak / 3) - 1, 2);
        const encouragement = this.messageBank.STREAK[energy][streakLevel] || "Perfect form!";
        const milestoneKey = `STREAK_${this.formStreak}`;

        return [{
          type: 'STREAK',
          value: this.formStreak,
          label: `${this.formStreak} Exercises with Perfect Form!`,
          encouragement,
          timestamp: Date.now(),
          id: milestoneKey,
          priority: 'low'
        }];
      }
    } else {
      this.formStreak = 0;
    }
    return [];
  }

  checkPersonalBest(exerciseId: string, weight: number, reps: number, history: HistoricalSet[], energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    const previousBest = history
      .filter(h => h.exerciseId === exerciseId)
      .reduce((best, curr) => (curr.weight > best ? curr.weight : best), 0);

    // Fix: Allow PB for first time exercise (previousBest === 0)
    if (weight > previousBest) {
      const encouragement = this.messageBank.PERSONAL_BEST[energy][Math.floor(Math.random() * 3)];
      const milestoneKey = `PB_${exerciseId}_${weight}`;

      return [{
        type: 'PERSONAL_BEST',
        value: weight,
        label: `New Personal Best! ${weight}kg ${exerciseId}`,
        encouragement,
        timestamp: Date.now(),
        id: milestoneKey,
        priority: 'high'
      }];
    }
    return [];
  }

  addVolume(weight: number, energy: 'normal' | 'tired' = 'normal'): Milestone[] {
    const oldVolume = this.totalVolume;
    this.totalVolume += weight;
    
    const milestones = [1000, 5000, 10000];
    const reached: Milestone[] = [];

    for (const m of milestones) {
      const milestoneKey = `VOLUME_${m}`;
      if (this.totalVolume >= m && oldVolume < m && !this.milestoneHistory.has(milestoneKey)) {
        this.milestoneHistory.add(milestoneKey);
        
        const volumeIndex = milestones.indexOf(m);
        const encouragement = this.messageBank.VOLUME[energy][volumeIndex] || "Serious volume!";

        reached.push({
          type: 'VOLUME',
          value: m,
          label: `Volume Milestone: ${m}kg Lifted!`,
          encouragement,
          timestamp: Date.now(),
          id: milestoneKey,
          priority: 'low'
        });
      }
    }
    return reached;
  }
}
