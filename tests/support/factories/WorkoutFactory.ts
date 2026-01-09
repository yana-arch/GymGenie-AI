import { faker } from '@faker-js/faker';

export const createExercise = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Pull Up']),
  suggestedWeight: faker.number.int({ min: 20, max: 200 }),
  suggestedReps: faker.number.int({ min: 5, max: 15 }),
  suggestedSets: faker.number.int({ min: 1, max: 5 }),
  difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
  ...overrides,
});

export const createWorkoutSession = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  exercises: Array.from({ length: 3 }, () => createExercise()),
  startTime: faker.date.recent().toISOString(),
  status: 'active',
  ...overrides,
});

export const createInjuryProfile = (overrides = {}) => ({
  userId: faker.string.uuid(),
  injuries: faker.helpers.arrayElements(['shoulder-impingement', 'lower-back-pain', 'knee-strain', 'wrist-tendonitis'], { min: 1, max: 2 }),
  ...overrides,
});
