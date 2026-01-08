import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptationGenerator } from '../services/AdaptationGenerator';
import { AdaptationTrigger } from '../../unified-coaching/types/unifiedCoaching.types';

describe('AdaptationGenerator', () => {
  let generator: AdaptationGenerator;

  beforeEach(() => {
    generator = new AdaptationGenerator();
  });

  it('should generate fatigue-based modifications @p0', async () => {
    const currentExercise = {
      id: 'squat',
      name: 'Squat',
      suggestedWeight: 100,
      suggestedReps: 10,
      suggestedSets: 3,
      difficulty: 'intermediate'
    };

    const triggers = [AdaptationTrigger.FATIGUE];
    const adaptation = await generator.generateAdaptation(currentExercise, triggers);

    expect(adaptation.action).toBe('reduce_intensity');
    expect(adaptation.modifications.suggestedWeight).toBe(90); // -10%
    expect(adaptation.modifications.suggestedReps).toBe(8); // -2
    expect(adaptation.message).toContain('fatigue');
  });

  it('should generate time-constraint modifications @p1', async () => {
    const currentExercise = {
      id: 'squat',
      name: 'Squat',
      suggestedWeight: 100,
      suggestedReps: 10,
      suggestedSets: 3
    };

    const triggers = [AdaptationTrigger.TIME_CONSTRAINT];
    const adaptation = await generator.generateAdaptation(currentExercise, triggers);

    expect(adaptation.action).toBe('reduce_volume');
    expect(adaptation.modifications.suggestedSets).toBe(2); // Reduced sets
    expect(adaptation.message).toContain('time');
  });
});
