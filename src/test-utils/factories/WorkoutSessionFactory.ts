import { faker } from '@faker-js/faker';
import { BaseFactory } from './BaseFactory';
import { 
  EnhancedWorkoutSession, 
  SessionState,
  SessionEnvironment,
  ExerciseSessionData,
  SetPerformance
} from '@/types/enhanced';
import { exerciseFactory } from './ExerciseFactory';

/**
 * Factory for creating EnhancedWorkoutSession instances
 */
export class WorkoutSessionFactory extends BaseFactory<EnhancedWorkoutSession> {
  protected getDefaults(): EnhancedWorkoutSession {
    const timestamps = this.generateTimestamps();
    const startTime = faker.date.past({ years: 1 }).getTime();
    const exerciseCount = faker.number.int({ min: 3, max: 8 });
    const exercises = exerciseFactory.createMany(exerciseCount);
    
    return {
      id: this.generateId('session'),
      weekId: this.generateId('week'),
      dayId: this.generateId('day'),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      timestamp: startTime,
      
      // Session state
      state: faker.helpers.arrayElement(Object.values(SessionState)),
      startTime,
      completedTime: faker.helpers.maybe(() => 
        faker.date.between({ 
          from: new Date(startTime), 
          to: new Date() 
        }).getTime()
      ),
      loggedTime: faker.helpers.maybe(() => 
        faker.date.between({ 
          from: new Date(startTime), 
          to: new Date() 
        }).getTime()
      ),
      exerciseTimestamps: this.generateExerciseTimestamps(exercises),
      
      // Session metrics
      totalExercises: exercises.length,
      completedExercises: faker.number.int({ min: 0, max: exercises.length }),
      estimatedDuration: faker.number.int({ min: 20, max: 90 }) * 60 * 1000, // Convert to ms
      actualDuration: faker.helpers.maybe(() => 
        faker.number.int({ min: 15, max: 120 }) * 60 * 1000
      ),
      caloriesBurned: faker.helpers.maybe(() => 
        faker.number.int({ min: 150, max: 800 })
      ),
      
      // Additional session data
      isReadOnly: false,
      rpe: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 })),
      notes: faker.helpers.maybe(() => faker.lorem.paragraph()),
      environment: this.generateSessionEnvironment(),
      exerciseData: this.generateExerciseData(exercises)
    };
  }

  /**
   * Generate exercise timestamps
   */
  private generateExerciseTimestamps(exercises: any[]): Record<string, number> {
    const timestamps: Record<string, number> = {};
    const baseTime = faker.date.past({ years: 1 }).getTime();
    
    exercises.forEach((exercise, index) => {
      timestamps[exercise.id] = baseTime + (index * 5 * 60 * 1000); // 5 minutes between exercises
    });
    
    return timestamps;
  }

  /**
   * Generate session environment
   */
  private generateSessionEnvironment(): SessionEnvironment {
    const location = faker.helpers.arrayElement(['home', 'gym', 'outdoor', 'other'] as const);
    
    return {
      location,
      temperature: location === 'outdoor' ? faker.number.int({ min: -10, max: 40 }) : undefined,
      humidity: location === 'outdoor' ? faker.number.int({ min: 20, max: 90 }) : undefined,
      equipment: this.generateEquipmentByLocation(location)
    };
  }

  /**
   * Generate equipment based on location
   */
  private generateEquipmentByLocation(location: string): string[] {
    const homeEquipment = ['Dumbbells', 'Resistance bands', 'Exercise mat', 'Kettlebells'];
    const gymEquipment = ['Barbell', 'Squat rack', 'Cable machine', 'Pull-up bar', 'Bench', 'Dumbbells'];
    const outdoorEquipment = ['Jump rope', 'Resistance bands', 'Exercise mat'];
    const otherEquipment = ['Body weight', 'Resistance bands', 'Exercise mat'];

    const equipmentMap = {
      home: homeEquipment,
      gym: gymEquipment,
      outdoor: outdoorEquipment,
      other: otherEquipment
    };

    const availableEquipment = equipmentMap[location as keyof typeof equipmentMap] || otherEquipment;
    return faker.helpers.arrayElements(availableEquipment, { min: 1, max: 5 });
  }

  /**
   * Generate exercise session data
   */
  private generateExerciseData(exercises: any[]): Record<string, ExerciseSessionData> {
    const exerciseData: Record<string, ExerciseSessionData> = {};
    
    exercises.forEach(exercise => {
      exerciseData[exercise.id] = this.generateExerciseSessionData(exercise.id);
    });
    
    return exerciseData;
  }

  /**
   * Generate data for a single exercise session
   */
  private generateExerciseSessionData(exerciseId: string): ExerciseSessionData {
    const setCount = faker.number.int({ min: 1, max: 5 });
    const isCompleted = faker.datatype.boolean(0.7); // 70% chance of completion
    
    return {
      exerciseId,
      sets: Array.from({ length: setCount }, (_, index) => 
        this.generateSetPerformance(index + 1)
      ),
      isCompleted,
      completedAt: isCompleted ? faker.date.recent().getTime() : undefined,
      notes: faker.helpers.maybe(() => faker.lorem.sentence())
    };
  }

  /**
   * Generate set performance data
   */
  private generateSetPerformance(setNumber: number): SetPerformance {
    return {
      id: this.generateId('set'),
      setNumber,
      weight: faker.number.float({ min: 5, max: 200, fractionDigits: 1 }),
      reps: faker.number.int({ min: 1, max: 20 }),
      rpe: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 10 })),
      completedAt: faker.date.recent().getTime(),
      targetRestTime: faker.number.int({ min: 30, max: 180 }),
      actualRestTime: faker.number.int({ min: 30, max: 300 }),
      duration: faker.number.int({ min: 10000, max: 120000 }) // 10s to 2min in ms
    };
  }

  /**
   * Create an active session
   */
  createActive(overrides: Partial<EnhancedWorkoutSession> = {}): EnhancedWorkoutSession {
    const startTime = faker.date.recent({ days: 1 }).getTime();
    const exercises = exerciseFactory.createMany(faker.number.int({ min: 3, max: 6 }));
    
    return this.create({
      state: SessionState.ACTIVE,
      startTime,
      completedTime: null,
      loggedTime: null,
      isReadOnly: false,
      completedExercises: faker.number.int({ min: 0, max: 1 }),
      totalExercises: exercises.length,
      exerciseTimestamps: this.generateExerciseTimestamps(exercises),
      exerciseData: this.generateExerciseData(exercises),
      ...overrides
    });
  }

  /**
   * Create a completed session
   */
  createCompleted(overrides: Partial<EnhancedWorkoutSession> = {}): EnhancedWorkoutSession {
    const startTime = faker.date.recent({ days: 7 }).getTime();
    const duration = faker.number.int({ min: 30, max: 90 }) * 60 * 1000; // 30-90 minutes
    const completedTime = startTime + duration;
    const exercises = exerciseFactory.createMany(faker.number.int({ min: 3, max: 8 }));
    
    return this.create({
      state: SessionState.COMPLETED,
      startTime,
      completedTime,
      loggedTime: faker.helpers.maybe(() => completedTime + faker.number.int({ min: 0, max: 3600000 })),
      actualDuration: duration,
      isReadOnly: true,
      completedExercises: exercises.length,
      totalExercises: exercises.length,
      rpe: faker.number.int({ min: 3, max: 9 }),
      caloriesBurned: faker.number.int({ min: 200, max: 700 }),
      exerciseTimestamps: this.generateExerciseTimestamps(exercises),
      exerciseData: this.generateCompletedExerciseData(exercises),
      ...overrides
    });
  }

  /**
   * Generate exercise data for completed session
   */
  private generateCompletedExerciseData(exercises: any[]): Record<string, ExerciseSessionData> {
    const exerciseData: Record<string, ExerciseSessionData> = {};
    
    exercises.forEach(exercise => {
      const setCount = faker.number.int({ min: 3, max: 4 });
      exerciseData[exercise.id] = {
        exerciseId: exercise.id,
        sets: Array.from({ length: setCount }, (_, index) => 
          this.generateSetPerformance(index + 1)
        ),
        isCompleted: true,
        completedAt: faker.date.recent().getTime(),
        notes: faker.helpers.maybe(() => faker.lorem.sentence())
      };
    });
    
    return exerciseData;
  }

  /**
   * Create a logged session
   */
  createLogged(overrides: Partial<EnhancedWorkoutSession> = {}): EnhancedWorkoutSession {
    const startTime = faker.date.past({ years: 0.08 }).getTime(); // ~30 days
    const duration = faker.number.int({ min: 30, max: 90 }) * 60 * 1000;
    const completedTime = startTime + duration;
    
    return this.create({
      state: SessionState.LOGGED,
      startTime,
      completedTime,
      loggedTime: completedTime + faker.number.int({ min: 0, max: 3600000 }),
      actualDuration: duration,
      isReadOnly: true,
      ...overrides
    });
  }

  /**
   * Create a high-intensity session
   */
  createHighIntensity(overrides: Partial<EnhancedWorkoutSession> = {}): EnhancedWorkoutSession {
    return this.create({
      estimatedDuration: faker.number.int({ min: 15, max: 45 }) * 60 * 1000,
      rpe: faker.number.int({ min: 7, max: 10 }),
      totalExercises: faker.number.int({ min: 5, max: 10 }),
      caloriesBurned: faker.number.int({ min: 400, max: 900 }),
      environment: {
        location: 'gym',
        equipment: ['Barbell', 'Kettlebells', 'Battle ropes', 'Rowing machine']
      },
      ...overrides
    });
  }

  /**
   * Create a rehabilitation session
   */
  createRehabilitation(overrides: Partial<EnhancedWorkoutSession> = {}): EnhancedWorkoutSession {
    return this.create({
      state: SessionState.ACTIVE,
      estimatedDuration: faker.number.int({ min: 20, max: 40 }) * 60 * 1000,
      rpe: faker.number.int({ min: 2, max: 5 }),
      totalExercises: faker.number.int({ min: 3, max: 6 }),
      environment: {
        location: 'home',
        equipment: ['Resistance bands', 'Exercise mat', 'Light dumbbells']
      },
      notes: 'Focus on controlled movements and proper form',
      ...overrides
    });
  }
}

// Export singleton instance for easy usage
export const workoutSessionFactory = new WorkoutSessionFactory();