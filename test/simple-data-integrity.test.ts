import { test, expect } from 'vitest';
import { DataIntegrityService } from '@/services/DataIntegrityService';

test('should validate a minimal workout', () => {
  const workout = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    date: new Date(),
    exercises: [] as any[],
  };
  const result = DataIntegrityService.validateWorkout(workout);
  expect(result.success).toBe(true);
});
