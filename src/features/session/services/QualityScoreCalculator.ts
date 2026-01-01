import { WorkoutSession, Exercise } from '@/types';
import { EnhancedWorkoutSession, SetPerformance, ExerciseSessionData } from '@/types/enhanced';

export interface QualityScoreResult {
  totalScore: number; // 0-100
  breakdown: {
    completionScore: number;
    restDisciplineScore: number;
    exertionConsistencyScore: number;
    tempoScore: number;
  };
  feedback: string;
}

export class QualityScoreCalculator {
  /**
   * Calculate quality score for a completed session
   */
  static calculate(
    session: WorkoutSession,
    planData: {
      totalExercisesInPlan: number;
      exercises: Record<string, Exercise>; // Map of exercise ID to Exercise definition for target values
    }
  ): QualityScoreResult {
    // If we don't have detailed data, fall back to simple completion calculation
    if (!session.exerciseData) {
      return this.calculateSimpleScore(session, planData.totalExercisesInPlan);
    }

    const sessionData = session as unknown as EnhancedWorkoutSession; // Cast to access detailed data
    const exercises = Object.values(sessionData.exerciseData || {});
    
    if (exercises.length === 0) {
      return {
        totalScore: 0,
        breakdown: { completionScore: 0, restDisciplineScore: 0, exertionConsistencyScore: 0, tempoScore: 0 },
        feedback: "No exercises recorded."
      };
    }

    // 1. Completion Score (40%)
    const completedCount = exercises.filter(e => e.isCompleted).length;
    const completionRate = Math.min(1, completedCount / planData.totalExercisesInPlan);
    const completionScore = completionRate * 100;

    // 2. Rest Timer Adherence (30%)
    let totalRestDeviation = 0;
    let totalSetsWithRest = 0;

    // 3. Tempo/Focus Score (30%) - Detecting rushed sets
    let rushedSets = 0;
    let totalSets = 0;

    exercises.forEach(exData => {
      exData.sets.forEach(set => {
        totalSets++;
        
        // Rest adherence
        if (set.targetRestTime > 0 && set.actualRestTime > 0) {
          const deviation = Math.abs(set.actualRestTime - set.targetRestTime);
          const percentageOff = deviation / set.targetRestTime;
          totalRestDeviation += Math.min(1, percentageOff); // Cap deviation penalty at 100% per set
          totalSetsWithRest++;
        }

        // Tempo check (very simplified: if set duration is suspicious < 5s)
        // In a real scenario we'd need reps count to estimate minimum realistic duration
        if (set.duration < 5000) { 
          rushedSets++;
        }
      });
    });

    const avgRestDeviation = totalSetsWithRest > 0 ? totalRestDeviation / totalSetsWithRest : 0;
    const restDisciplineScore = Math.max(0, 100 - (avgRestDeviation * 100)); // 0 deviation = 100 score

    const rushedRate = totalSets > 0 ? rushedSets / totalSets : 0;
    const tempoScore = Math.max(0, 100 - (rushedRate * 200)); // 50% rushed sets = 0 score

    // Exertion Consistency (Placeholder for now, could use RPE variance)
    const exertionConsistencyScore = 100; 

    // Weighted Total
    const totalScore = Math.round(
      (completionScore * 0.4) +
      (restDisciplineScore * 0.3) +
      (tempoScore * 0.3)
    );

    return {
      totalScore,
      breakdown: {
        completionScore,
        restDisciplineScore,
        exertionConsistencyScore,
        tempoScore
      },
      feedback: this.generateFeedback(totalScore, restDisciplineScore, tempoScore)
    };
  }

  private static calculateSimpleScore(session: WorkoutSession, totalExercises: number): QualityScoreResult {
    const completedCount = Object.keys(session.exerciseTimestamps).length;
    const score = Math.min(100, Math.round((completedCount / totalExercises) * 100));
    
    return {
      totalScore: score,
      breakdown: { 
        completionScore: score, 
        restDisciplineScore: 100, // Assume perfect if we can't measure
        exertionConsistencyScore: 100, 
        tempoScore: 100 
      },
      feedback: score > 80 ? "Good job completing the workout!" : "Keep pushing to complete all exercises next time."
    };
  }

  private static generateFeedback(totalScore: number, restScore: number, tempoScore: number): string {
    if (totalScore >= 90) return "Outstanding discipline! You hit your targets with precision.";
    
    if (restScore < 60) return "Great effort, but watch your rest times. Keeping them strict maximizes hypertrophy.";
    
    if (tempoScore < 60) return "You seem to be rushing your sets. Slow down the eccentric phase for better muscle engagement.";
    
    if (totalScore < 60) return "A tough session? Consistency is key. Make sure to fuel up before your next workout.";
    
    return "Solid workout. Recovery is where the growth happens - eat and sleep well!";
  }
}