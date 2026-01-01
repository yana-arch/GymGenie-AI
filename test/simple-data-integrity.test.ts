import { test, expect } from 'vitest';
import { DataIntegrityService } from '../services/DataIntegrityService';

test('should validate a minimal workout', () => {
  const workout = {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    userId: 'b2c3d4e5-f6a7-8901-2345-67890abcdef12',
    date: new Date(),
    exercises: [],
  };
  const result = DataIntegrityService.validateWorkout(workout);
  expect(result.success).toBe(true);
});
