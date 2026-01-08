import { Achievement, AchievementDefinition } from '../types/achievement.types';
import { AnalyticsService } from './AnalyticsService';
import { WorkoutHistoryEntry } from '@/types';
import { EnhancedWorkoutSession } from '@/types/enhanced';
import { v4 as uuidv4 } from 'uuid';
import { PrivacyAuditService } from '@/features/privacy/services/PrivacyAuditService';

export class AchievementService {

  private static instance: AchievementService;
  private analyticsService: AnalyticsService;

  private readonly DEFINITIONS: AchievementDefinition[] = [
    // Consistency
    { id: 'consistency-10', type: 'CONSISTENCY', threshold: 10, label: 'Decathlon', description: 'Completed 10 workouts' },
    { id: 'consistency-25', type: 'CONSISTENCY', threshold: 25, label: 'Quarter Century', description: 'Completed 25 workouts' },
    { id: 'consistency-50', type: 'CONSISTENCY', threshold: 50, label: 'Silver Anniversary', description: 'Completed 50 workouts' },
    { id: 'consistency-100', type: 'CONSISTENCY', threshold: 100, label: 'Century Club', description: 'Completed 100 workouts' },
    
    // Volume
    { id: 'volume-1000', type: 'VOLUME', threshold: 1000, label: 'Ton Up', description: '1,000kg lifetime volume' },
    { id: 'volume-5000', type: 'VOLUME', threshold: 5000, label: 'Five Ton Titan', description: '5,000kg lifetime volume' },
    { id: 'volume-10000', type: 'VOLUME', threshold: 10000, label: 'The Heavyweight', description: '10,000kg lifetime volume' },

    // Streaks
    { id: 'streak-3', type: 'STREAK', threshold: 3, label: 'Heat Up', description: '3-day active streak' },
    { id: 'streak-7', type: 'STREAK', threshold: 7, label: 'On Fire', description: '7-day active streak' },
    { id: 'streak-30', type: 'STREAK', threshold: 30, label: 'Unstoppable', description: '30-day active streak' },

    // Major Lift PBs (First-time record detection for key lifts)
    { id: 'pb-bench-press', type: 'PERSONAL_BEST', threshold: 0, label: 'Iron Press Master', description: 'First Bench Press record' },
    { id: 'pb-squat', type: 'PERSONAL_BEST', threshold: 0, label: 'King of Squats', description: 'First Squat record' },
    { id: 'pb-deadlift', type: 'PERSONAL_BEST', threshold: 0, label: 'The Pull Master', description: 'First Deadlift record' },
    { id: 'pb-overhead-press', type: 'PERSONAL_BEST', threshold: 0, label: 'Titan Shoulders', description: 'First Overhead Press record' },
  ];

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Check for new achievements based on history and session data
   */
  public checkAchievements(
    history: WorkoutHistoryEntry[], 
    sessions: Record<string, EnhancedWorkoutSession>,
    existingAchievementIds: string[],
    userSkillLevel: string = 'beginner'
  ): Achievement[] {
    const newAchievements: Achievement[] = [];

    // 1. Check Consistency
    const totalWorkouts = history.length;
    this.DEFINITIONS
      .filter(d => d.type === 'CONSISTENCY' && totalWorkouts >= (d.threshold as number))
      .forEach(d => {
        if (!existingAchievementIds.includes(d.id)) {
          newAchievements.push(this.createAchievement(d, totalWorkouts, this.getEncouragement(d, userSkillLevel)));
        }
      });

    // 2. Check Volume
    const totalVolume = this.calculateTotalVolume(sessions);
    this.DEFINITIONS
      .filter(d => d.type === 'VOLUME' && totalVolume >= (d.threshold as number))
      .forEach(d => {
        if (!existingAchievementIds.includes(d.id)) {
          newAchievements.push(this.createAchievement(d, totalVolume, this.getEncouragement(d, userSkillLevel)));
        }
      });

    // 3. Check Streaks
    const currentStreak = this.calculateCurrentStreak(history);
    this.DEFINITIONS
      .filter(d => d.type === 'STREAK' && currentStreak >= (d.threshold as number))
      .forEach(d => {
        if (!existingAchievementIds.includes(d.id)) {
          newAchievements.push(this.createAchievement(d, currentStreak, this.getEncouragement(d, userSkillLevel)));
        }
      });

    // 4. Check Major Lift PBs
    this.checkMajorLifts(sessions, existingAchievementIds, newAchievements, userSkillLevel);

    // Audit local processing for privacy compliance
    if (newAchievements.length > 0) {
      PrivacyAuditService.logAccess('Achievement Detection', 'success', `Detected ${newAchievements.length} new milestones locally`);
    }

    return newAchievements;
  }


  private createAchievement(definition: AchievementDefinition, value: number | string, encouragement: string): Achievement {
    return {
      id: definition.id,
      type: definition.type,
      value,
      label: definition.label,
      description: definition.description,
      timestamp: Date.now(),
      earnedId: uuidv4(),
      encouragement
    };
  }

  private volumeCache: { count: number, total: number } | null = null;

  private calculateTotalVolume(sessions: Record<string, EnhancedWorkoutSession>): number {
    const sessionCount = Object.keys(sessions).length;
    
    // Simple cache optimization
    if (this.volumeCache && this.volumeCache.count === sessionCount) {
      return this.volumeCache.total;
    }

    const total = Object.values(sessions).reduce((total, session) => {
      if (!session.exerciseData) return total;
      const sessionVolume = Object.values(session.exerciseData).reduce((sessionSum, exercise) => {
        const exerciseVolume = exercise.sets.reduce((setSum: number, set: any) => {
          return setSum + (set.weight || 0) * (set.reps || 0);
        }, 0);
        return sessionSum + exerciseVolume;
      }, 0);
      return total + sessionVolume;
    }, 0);

    this.volumeCache = { count: sessionCount, total };
    return total;
  }


  private calculateCurrentStreak(history: WorkoutHistoryEntry[]): number {
    if (history.length === 0) return 0;
    
    // Sort unique dates descending
    const sortedDates = [...new Set(history.map(h => h.completedAt.split('T')[0]))].sort().reverse();
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestWorkoutDate = new Date(sortedDates[0]);
    latestWorkoutDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - latestWorkoutDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If latest workout was more than 1 day ago, streak is broken
    if (diffDays > 1) return 0;

    for (let i = 0; i < sortedDates.length; i++) {
        const date = new Date(sortedDates[i]);
        date.setHours(0, 0, 0, 0);
        
        if (i === 0) {
            streak = 1;
        } else {
            const prevDate = new Date(sortedDates[i-1]);
            prevDate.setHours(0, 0, 0, 0);
            const diff = prevDate.getTime() - date.getTime();
            const dayDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
                streak++;
            } else {
                break;
            }
        }
    }
    return streak;
  }

  private checkMajorLifts(
    sessions: Record<string, EnhancedWorkoutSession>,
    existingAchievementIds: string[],
    newAchievements: Achievement[],
    userSkillLevel: string
  ): void {
    const majorLifts = [
      { id: 'pb-bench-press', patterns: ['bench press', 'chest press'] },
      { id: 'pb-squat', patterns: ['squat'] },
      { id: 'pb-deadlift', patterns: ['deadlift'] },
      { id: 'pb-overhead-press', patterns: ['overhead press', 'shoulder press', 'military press'] },
    ];

    majorLifts.forEach(lift => {
      if (existingAchievementIds.includes(lift.id)) return;

      // Filter sessions that have this lift
      const liftSessions = Object.values(sessions)
        .filter(session => {
          if (!session.exerciseData) return false;
          return Object.values(session.exerciseData).some(exercise => {
            const name = exercise.exerciseId.toLowerCase().replace(/-/g, ' ');
            return lift.patterns.some(p => name.includes(p));
          });
        })
        .sort((a, b) => (a.completedTime || 0) - (b.completedTime || 0));

      if (liftSessions.length === 0) return;

      // A "First-time record" for an intermediate user shouldn't just be "anything > 0"
      // Let's require a minimum weight threshold based on skill level if we wanted to be fancy,
      // but for "first-time record", let's at least ensure they've completed a full session with it.
      
      const latestSession = liftSessions[liftSessions.length - 1];
      const exerciseData = Object.values(latestSession.exerciseData!).find(exercise => {
        const name = exercise.exerciseId.toLowerCase().replace(/-/g, ' ');
        return lift.patterns.some(p => name.includes(p));
      });

      if (!exerciseData) return;

      const maxWeight = exerciseData.sets.reduce((max: number, set: any) => Math.max(max, set.weight || 0), 0);
      
      // Intermediate users should be lifting something meaningful to get a "Major Lift" achievement
      const minThreshold = userSkillLevel === 'intermediate' ? 20 : userSkillLevel === 'advanced' ? 40 : 0;

      if (maxWeight >= minThreshold) {
        const definition = this.DEFINITIONS.find(d => d.id === lift.id);
        if (definition) {
          newAchievements.push(this.createAchievement(definition, `${maxWeight}kg`, this.getEncouragement(definition, userSkillLevel)));
        }
      }
    });
  }

  private getEncouragement(definition: AchievementDefinition, userSkillLevel: string): string {
    const isIntermediate = userSkillLevel === 'intermediate' || userSkillLevel === 'advanced';

    const messages: Record<string, string[]> = {
      CONSISTENCY: isIntermediate 
        ? [
            "Your discipline is unmatched. Another milestone in your journey!",
            "Professional level consistency. You're making this a lifestyle.",
            "The grind never stops, and neither do you. Great work!"
          ]
        : [
            "Consistency is key! You're building a powerful habit.",
            "Every workout counts. Keep up the amazing dedication!",
            "You're making this look easy! Great work on staying consistent."
          ],
      VOLUME: isIntermediate
        ? [
            "Moving serious weight now! Your power is incredible.",
            "Elite level volume! You're turning into an absolute powerhouse.",
            "That's a massive amount of steel moved. Your strength is showing!"
          ]
        : [
            "Incredible strength! That's a lot of weight moved.",
            "You're becoming a powerhouse! Exceptional volume today.",
            "Feel that pump? That's the result of all those kilograms lifted!"
          ],
      STREAK: [
        "You're on fire! Don't let that streak break.",
        "Unstoppable momentum! You're in the zone.",
        "What a run! Your discipline is truly inspiring."
      ],
      PERSONAL_BEST: isIntermediate
        ? [
            "Another record smashed! You're constantly pushing your limits.",
            "New heights reached! This is what true progression looks like.",
            "Exceptional performance. You're reaching elite status!"
          ]
        : [
            "A new record! You're stronger than you were yesterday.",
            "Pushing boundaries! That's how progress is made.",
            "Smashed it! Your hard work is paying off in real results."
          ]
    };

    const typeMessages = messages[definition.type] || ["Amazing achievement!"];
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  }

}
