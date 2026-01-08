import { WorkoutSession, ExerciseSession } from '../../../preference-learning/types/preferenceLearning.types';

export class HistoryFixture {
  private userId: string;

  constructor(userId: string = 'test-user-123') {
    this.userId = userId;
  }

  generateExercise(overrides: Partial<ExerciseSession> = {}): ExerciseSession {
    return {
      exerciseId: 'ex-' + Math.random().toString(36).substr(2, 9),
      exerciseType: 'strength',
      duration: 300,
      sets: 3,
      reps: 10,
      weight: 50,
      intensity: 0.7,
      completionRate: 1.0,
      userFeedback: {
        difficulty: 3,
        satisfaction: 4,
        energy: 4
      },
      ...overrides
    };
  }

  generateSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
    const startTime = overrides.startTime || new Date();
    const endTime = overrides.endTime || new Date(startTime.getTime() + 3600000);
    
    return {
      id: 'sess-' + Math.random().toString(36).substr(2, 9),
      userId: this.userId,
      exercises: overrides.exercises || [this.generateExercise(), this.generateExercise()],
      startTime,
      endTime,
      totalDuration: 3600,
      performance: {
        overallScore: 0.8,
        consistencyScore: 0.9,
        fatigueLevel: 0.4,
        motivationLevel: 0.8,
        ...overrides.performance
      },
      ...overrides
    };
  }

  generateHistory(count: number, persona: 'consistent' | 'warrior' | 'experimentalist' = 'consistent'): WorkoutSession[] {
    const history: WorkoutSession[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - (count - i) * 24 * 60 * 60 * 1000);
      let session: WorkoutSession;

      switch (persona) {
        case 'consistent':
          session = this.generateSession({
            startTime: date,
            exercises: [
              this.generateExercise({ exerciseId: 'bench-press', intensity: 0.7, userFeedback: { difficulty: 3, satisfaction: 5, energy: 4 } }),
              this.generateExercise({ exerciseId: 'squat', intensity: 0.7, userFeedback: { difficulty: 3, satisfaction: 5, energy: 4 } })
            ]
          });
          break;
        case 'warrior':
          session = this.generateSession({
            startTime: date,
            exercises: [
              this.generateExercise({ exerciseId: 'deadlift', intensity: 0.9, userFeedback: { difficulty: 5, satisfaction: 5, energy: 5 } }),
              this.generateExercise({ exerciseId: 'overhead-press', intensity: 0.8, userFeedback: { difficulty: 4, satisfaction: 4, energy: 3 } })
            ]
          });
          break;
        case 'experimentalist':
          session = this.generateSession({
            startTime: date,
            exercises: [
              this.generateExercise({ exerciseId: 'random-' + i, intensity: Math.random(), userFeedback: { difficulty: Math.floor(Math.random() * 5) + 1, satisfaction: Math.floor(Math.random() * 5) + 1, energy: 3 } })
            ]
          });
          break;
      }
      history.push(session);
    }

    return history;
  }

  injectNoise(sessions: WorkoutSession[], frequency: number = 0.1): WorkoutSession[] {
    return sessions.map(session => {
      if (Math.random() < frequency) {
        return {
          ...session,
          exercises: session.exercises.map(ex => ({
            ...ex,
            intensity: Math.random(),
            userFeedback: {
              difficulty: Math.floor(Math.random() * 5) + 1,
              satisfaction: 1,
              energy: 1
            }
          }))
        };
      }
      return session;
    });
  }
}
