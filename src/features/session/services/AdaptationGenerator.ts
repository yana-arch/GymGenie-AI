import { AdaptationTrigger } from '@/features/unified-coaching/types/unifiedCoaching.types';
import { exerciseCatalogService } from '@/features/workout/services/ExerciseCatalogService';

/**
 * Adaptation Recommendation
 * Specific modifications for an exercise
 */
export interface AdaptationRecommendation {
  action: 'reduce_intensity' | 'reduce_volume' | 'increase_rest' | 'substitute_exercise';
  modifications: {
    suggestedWeight?: number;
    suggestedReps?: number;
    suggestedSets?: number;
    suggestedRest?: number;
    alternativeExerciseId?: string;
    alternativeExerciseName?: string;
  };
  message: string;
  reasoning: string;
}

/**
 * AdaptationGenerator
 * Generates specific exercise-level modifications based on contextual triggers.
 */
export class AdaptationGenerator {
  /**
   * Generate exercise-level modifications based on active triggers
   */
  public async generateAdaptation(
    currentExercise: {
      id: string;
      name: string;
      suggestedWeight?: number;
      suggestedReps?: number;
      suggestedSets?: number;
      suggestedRest?: number;
      difficulty?: string;
    },
    triggers: AdaptationTrigger[]
  ): Promise<AdaptationRecommendation> {
    // Severe Fatigue: Substitute with lower intensity alternative
    if (triggers.includes(AdaptationTrigger.FATIGUE) && currentExercise.difficulty !== 'beginner') {
      const alternatives = await exerciseCatalogService.getAlternatives(currentExercise.id);
      const easierAlternative = alternatives.find(ex => ex.difficulty === 'beginner' || (currentExercise.difficulty === 'advanced' && ex.difficulty === 'intermediate'));
      
      if (easierAlternative) {
        return {
          action: 'substitute_exercise',
          modifications: {
            alternativeExerciseId: easierAlternative.id,
            alternativeExerciseName: easierAlternative.name,
            suggestedSets: currentExercise.suggestedSets,
            suggestedReps: currentExercise.suggestedReps
          },
          message: `Noticing heavy fatigue. Let's switch to ${easierAlternative.name} to finish safely.`,
          reasoning: 'Severe fatigue detected; substituting with a lower-difficulty exercise.'
        };
      }
    }

    // Fatigue / Form Breakdown: Reduce intensity (Weight -10%, Reps -2)
    if (triggers.includes(AdaptationTrigger.FATIGUE) || triggers.includes(AdaptationTrigger.FORM_BREAKDOWN)) {
      const weight = currentExercise.suggestedWeight;
      const reps = currentExercise.suggestedReps;

      return {
        action: 'reduce_intensity',
        modifications: {
          suggestedWeight: weight ? Math.round(weight * 0.9) : undefined,
          suggestedReps: reps ? Math.max(1, reps - 2) : undefined
        },
        message: 'Noticing some fatigue - let\'s drop the weight by 10% to keep your form perfect.',
        reasoning: 'Fatigue detected via form quality trends or performance drop.'
      };
    }

    // Time Constraint: Reduce volume (Sets -1)
    if (triggers.includes(AdaptationTrigger.TIME_CONSTRAINT)) {
      const sets = currentExercise.suggestedSets;

      return {
        action: 'reduce_volume',
        modifications: {
          suggestedSets: sets ? Math.max(1, sets - 1) : undefined
        },
        message: 'Short on time? Let\'s reduce the sets to finish strong.',
        reasoning: 'Session time limit approaching with multiple exercises remaining.'
      };
    }

    // Low Energy: Increase rest
    if (triggers.includes(AdaptationTrigger.ENERGY_LOW)) {
      const rest = currentExercise.suggestedRest || 60;

      return {
        action: 'increase_rest',
        modifications: {
          suggestedRest: Math.round(rest * 1.3)
        },
        message: 'Energy feeling a bit low? Let\'s take a slightly longer rest break.',
        reasoning: 'User reported low energy or slow recovery detected.'
      };
    }

    // Default: Continue
    return {
      action: 'reduce_intensity', // Use a safe default for types
      modifications: {},
      message: 'Maintain current pace',
      reasoning: 'No specific adaptation triggers identified'
    };
  }
}
