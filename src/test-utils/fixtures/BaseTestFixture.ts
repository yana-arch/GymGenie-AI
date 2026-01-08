import { faker } from '@faker-js/faker';
import { EnhancedUserProfile, MuscleGroup } from '@/types/enhanced';
import { userProfileFactory } from '../factories/UserProfileFactory';
import { EnhancedExercise } from '@/types/enhanced';
import { exerciseFactory } from '../factories/ExerciseFactory';
import { EnhancedWorkoutSession } from '@/types/enhanced';
import { workoutSessionFactory } from '../factories/WorkoutSessionFactory';

/**
 * Base test fixture providing commonly needed data
 */
export interface BaseTestFixture {
  userProfile: EnhancedUserProfile;
  exercises: EnhancedExercise[];
  workoutSession: EnhancedWorkoutSession;
}

/**
 * Creates a standard test fixture with realistic data
 */
export function createBaseTestFixture(): BaseTestFixture {
  return {
    userProfile: userProfileFactory.create(),
    exercises: exerciseFactory.createMany(5),
    workoutSession: workoutSessionFactory.create()
  };
}

/**
 * Fixture for beginner-focused tests
 */
export function createBeginnerTestFixture(): BaseTestFixture {
  const beginnerProfile = userProfileFactory.createBeginner();
  const beginnerExercises = [
    exerciseFactory.createIsolation({ difficulty: 1 }),
    exerciseFactory.createIsolation({ difficulty: 1 }),
    exerciseFactory.createIsolation({ difficulty: 2 }),
    exerciseFactory.createCardio({ difficulty: 1 })
  ];
  
  return {
    userProfile: beginnerProfile,
    exercises: beginnerExercises,
    workoutSession: workoutSessionFactory.create({
      rpe: faker.helpers.arrayElement([3, 4, 5]),
      estimatedDuration: 30 * 60 * 1000, // 30 minutes
      totalExercises: 4
    })
  };
}

/**
 * Fixture for advanced athlete tests
 */
export function createAdvancedTestFixture(): BaseTestFixture {
  const advancedProfile = userProfileFactory.createAdvancedAthlete();
  const advancedExercises = [
    exerciseFactory.createCompound({ difficulty: 3 }),
    exerciseFactory.createCompound({ difficulty: 3 }),
    exerciseFactory.createIsolation({ difficulty: 3 }),
    exerciseFactory.createIsolation({ difficulty: 4 })
  ];
  
  return {
    userProfile: advancedProfile,
    exercises: advancedExercises,
    workoutSession: workoutSessionFactory.createHighIntensity({
      rpe: faker.helpers.arrayElement([8, 9, 10]),
      estimatedDuration: 75 * 60 * 1000, // 75 minutes
      totalExercises: 4
    })
  };
}

/**
 * Fixture for rehabilitation tests
 */
export function createRehabTestFixture(): BaseTestFixture {
  const rehabProfile = userProfileFactory.createRehabUser();
  const rehabExercises: EnhancedExercise[] = [
    exerciseFactory.createIsolation({ 
      difficulty: 1
    }),
    exerciseFactory.createIsolation({ 
      difficulty: 1
    }),
    exerciseFactory.createCardio({ difficulty: 1 })
  ];
  
  return {
    userProfile: rehabProfile,
    exercises: rehabExercises,
    workoutSession: workoutSessionFactory.createRehabilitation({
      notes: 'Low intensity rehabilitation session'
    })
  };
}

/**
 * Fixture for active workout session tests
 */
export function createActiveSessionFixture(): BaseTestFixture {
  return {
    userProfile: userProfileFactory.create(),
    exercises: exerciseFactory.createMany(4),
    workoutSession: workoutSessionFactory.createActive()
  };
}

/**
 * Fixture for completed workout session tests
 */
export function createCompletedSessionFixture(): BaseTestFixture {
  return {
    userProfile: userProfileFactory.create(),
    exercises: exerciseFactory.createMany(5),
    workoutSession: workoutSessionFactory.createCompleted()
  };
}

/**
 * Fixture for performance tracking tests
 */
export function createPerformanceFixture(): BaseTestFixture {
  const completedSessions = Array.from({ length: 5 }, () => 
    workoutSessionFactory.createCompleted()
  );
  
  return {
    userProfile: userProfileFactory.createAdvancedAthlete(),
    exercises: exerciseFactory.createMany(6),
    workoutSession: faker.helpers.arrayElement(completedSessions)
  };
}

/**
 * Utility to create multiple sessions for time-series analysis
 */
export function createTimeSeriesFixture(sessionCount: number = 30): {
  userProfile: EnhancedUserProfile;
  exercises: EnhancedExercise[];
  sessions: EnhancedWorkoutSession[];
} {
  const userProfile = userProfileFactory.create();
  const exercises = exerciseFactory.createMany(8);
  
  const sessions = Array.from({ length: sessionCount }, (_, index) => {
    const dateOffset = (sessionCount - index) * 24 * 60 * 60 * 1000; // days in ms
    const baseTime = Date.now() - dateOffset;
    
    return workoutSessionFactory.createCompleted({
      startTime: baseTime,
      completedTime: baseTime + faker.number.int({ min: 30, max: 90 }) * 60 * 1000
    });
  });
  
  return {
    userProfile,
    exercises,
    sessions: sessions.sort((a, b) => a.startTime - b.startTime)
  };
}