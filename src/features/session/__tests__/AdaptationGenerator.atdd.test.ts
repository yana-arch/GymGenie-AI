import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptationGenerator } from '../services/AdaptationGenerator';
import { AdaptationTrigger } from '../../unified-coaching/types/unifiedCoaching.types';

// Mocking exercise catalog service
vi.mock('@/features/workout/services/ExerciseCatalogService', () => ({
  exerciseCatalogService: {
    getAlternatives: vi.fn().mockResolvedValue([])
  }
}));

describe('AdaptationGenerator - ATDD failing tests @atdd', () => {
  let generator: AdaptationGenerator;

  beforeEach(() => {
    generator = new AdaptationGenerator();
    vi.clearAllMocks();
  });

  /**
   * Story 1.1: Real-Time Workout Adaptations
   * Requirement: modifications prioritize safety while maintaining training effectiveness
   */
  it('should prioritize safety when form breakdown is detected @p0', async () => {
    const currentExercise = {
      id: 'bench-press',
      name: 'Bench Press',
      suggestedWeight: 100,
      suggestedReps: 10,
      suggestedSets: 3,
      difficulty: 'intermediate'
    };

    const triggers = [AdaptationTrigger.FORM_BREAKDOWN];
    const adaptation = await generator.generateAdaptation(currentExercise, triggers);

    // Failing expectation: Should emphasize safety in message and reasoning
    expect(adaptation.message.toLowerCase()).toContain('safety');
    expect(adaptation.reasoning.toLowerCase()).toContain('injury prevention');
  });

  /**
   * Story 1.4: Injury-Aware Adaptations
   * Requirement: AI recommendations never conflict with injury restrictions
   */
  it('should never suggest exercises that conflict with documented injury history @p0', async () => {
    const currentExercise = {
      id: 'overhead-press',
      name: 'Overhead Press',
      suggestedWeight: 40,
      suggestedReps: 12,
      suggestedSets: 3,
      difficulty: 'intermediate'
    };

    // User has a shoulder injury
    const userProfile = {
      injuries: ['shoulder-impingement']
    };

    // Mock alternatives: one dangerous, one safe
    const mockAlternatives = [
      { id: 'military-press', name: 'Military Press' }, // Also dangerous
      { id: 'lateral-raise', name: 'Lateral Raise' }    // Safe
    ];
    
    const { exerciseCatalogService } = await import('@/features/workout/services/ExerciseCatalogService');
    vi.mocked(exerciseCatalogService.getAlternatives).mockResolvedValueOnce(mockAlternatives as any);

    const adaptation = await generator.generateAdaptation(currentExercise, [AdaptationTrigger.FATIGUE], { userProfile });

    // If the current exercise is dangerous for the injury, it should suggest substitution
    expect(adaptation.action).toBe('substitute_exercise');
    expect(adaptation.modifications.alternativeExerciseName).toBe('Lateral Raise');
    expect(adaptation.message).toContain('injury history');
  });

  /**
   * Story 1.1: Performance Requirement
   * Requirement: AI immediately suggests workout modifications within 2 seconds
   */
  it('should generate adaptation within 2 seconds @p1', async () => {
    const currentExercise = {
      id: 'squat',
      name: 'Squat',
      suggestedWeight: 100,
      suggestedReps: 10,
      suggestedSets: 3
    };

    const startTime = Date.now();
    await generator.generateAdaptation(currentExercise, [AdaptationTrigger.FATIGUE]);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });
});
