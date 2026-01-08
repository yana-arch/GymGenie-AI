import { 
  PreferencePattern, 
  PreferenceType, 
  ExercisePreference, 
  IntensityPreference 
} from '../../../preference-learning/types/preferenceLearning.types';

export class PreferenceFactory {
  static createPattern(overrides: Partial<PreferencePattern> = {}): PreferencePattern {
    return {
      id: 'pat-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-123',
      patternType: 'exercise-selection',
      confidence: 0.8,
      strength: 0.7,
      firstDetected: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastConfirmed: new Date(),
      confirmations: 5,
      contradictions: 0,
      data: {},
      ...overrides
    };
  }

  static createExercisePreference(overrides: Partial<ExercisePreference> = {}): ExercisePreference {
    return {
      exerciseId: 'bench-press',
      preference: 'preferred',
      confidence: 0.9,
      contexts: ['main'],
      ...overrides
    };
  }

  static createIntensityPreference(overrides: Partial<IntensityPreference> = {}): IntensityPreference {
    return {
      intensityRange: {
        min: 0.7,
        max: 0.85
      },
      preference: 'challenging',
      confidence: 0.8,
      ...overrides
    };
  }

  static createPersonaPattern(persona: 'consistent' | 'warrior'): PreferencePattern {
    if (persona === 'consistent') {
      return this.createPattern({
        patternType: 'exercise-selection',
        data: {
          exercisePreferences: [
            this.createExercisePreference({ exerciseId: 'bench-press', preference: 'preferred' }),
            this.createExercisePreference({ exerciseId: 'squat', preference: 'preferred' })
          ]
        }
      });
    } else {
      return this.createPattern({
        patternType: 'intensity-level',
        data: {
          intensityPreferences: [
            this.createIntensityPreference({ intensityRange: { min: 0.85, max: 0.95 }, preference: 'extreme' })
          ]
        }
      });
    }
  }
}
