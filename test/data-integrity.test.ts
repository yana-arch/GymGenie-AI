import { test, expect } from 'vitest';
import { DataIntegrityService } from '../services/DataIntegrityService';

const validWorkout = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  userId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef12',
  date: new Date(),
  exercises: [
    { id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', name: 'Bench Press', sets: 3, reps: 10 },
  ],
};

const corruptedWorkout = {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    // missing userId
    date: 'not a date',
    exercises: [
      { id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12', name: 'Bench Press', sets: -1, reps: 0 },
    ],
};

test('should validate a correct workout structure', () => {
  const result = DataIntegrityService.validateWorkout(validWorkout);
  expect(result.success).toBe(true);
});

test('should fail validation for a corrupted workout structure', () => {
  const result = DataIntegrityService.validateWorkout(corruptedWorkout);
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});

test('should recover a partially corrupted workout', () => {
  const partiallyCorrupted = {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    userId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef12',
    // Missing date, exercises
  };
  const { success, data } = DataIntegrityService.recoverWorkout(partiallyCorrupted);
  expect(success).toBe(true);
  expect(data).toBeDefined();
  expect(data.date).toBeInstanceOf(Date);
  expect(data.exercises).toEqual([]);
});

test('should fail to recover a severely corrupted workout', () => {
    const severelyCorrupted = {
      // Missing id, userId
    };
    const { success, error } = DataIntegrityService.recoverWorkout(severelyCorrupted);
    expect(success).toBe(false);
    expect(error).toBeDefined();
  });
