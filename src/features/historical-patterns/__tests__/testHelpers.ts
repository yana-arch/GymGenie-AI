/**
 * Shared test helpers for HistoricalPatternsService tests
 */

import type { WorkoutHistoryEntry } from '../types/historicalPatterns.types';

/**
 * Helper function to create mock workout history
 */
export function createMockWorkoutHistory(count: number): WorkoutHistoryEntry[] {
  const workouts: WorkoutHistoryEntry[] = [];
  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < count; i++) {
    workouts.push({
      id: `workout-${i}`,
      userId: 'test-user-123',
      workoutId: `workout-plan-${i % 3}`,
      completedAt: new Date(baseDate.getTime() + (i * 2 * 24 * 60 * 60 * 1000)), // Every 2 days
      duration: 45 + (i * 5),
      exercises: [
        {
          exerciseId: 'exercise-1',
          exerciseName: 'Push-ups',
          exerciseType: 'strength',
          sets: [
            { reps: 15, weight: 0, difficulty: 6, restTime: 60 }
          ],
          performance: {
            effectiveness: 7 + i * 0.1,
            technique: 8,
            perceivedExertion: 6
          },
          adaptations: [
            {
              timestamp: new Date(),
              type: 'intensity',
              original: { difficulty: 5 },
              adapted: { difficulty: 6 },
              reason: 'Performance improvement',
              effectiveness: 0.8
            }
          ]
        }
      ],
      performance: {
        overallScore: 7 + i * 0.1,
        completionRate: 0.9 + (i * 0.01),
        difficulty: 6 + (i % 2),
        intensity: 0.7 + (i * 0.01),
        effort: 7,
        enjoyment: 8
      },
      aiRecommendations: [
        {
          type: 'intensity',
          recommendation: 'Increase weight gradually',
          confidence: 0.8,
          impact: 'medium',
          applied: true,
          effectiveness: 0.7
        }
      ],
      userFeedback: {
        overallRating: 4,
        difficultyRating: 3,
        enjoymentRating: 5,
        comments: 'Good workout',
        wouldRecommend: true
      }
    });
  }
  
  return workouts;
}