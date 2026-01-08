import { faker } from '@faker-js/faker';
import { BaseFactory } from './BaseFactory';
import { 
  EnhancedExercise, 
  DifficultyLevel, 
  MuscleGroup,
  ExerciseVariation,
  ProgressionRule
} from '@/types/enhanced';

/**
 * Factory for creating EnhancedExercise instances
 */
export class ExerciseFactory extends BaseFactory<EnhancedExercise> {
  protected getDefaults(): EnhancedExercise {
    const timestamps = this.generateTimestamps();
    const targetMuscles = this.generateTargetMuscles();
    
    return {
      id: this.generateId('exercise'),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      
      // Base exercise
      name: this.generateExerciseName(targetMuscles),
      sets: faker.number.int({ min: 1, max: 5 }),
      reps: this.generateRepRange(),
      restSeconds: faker.number.int({ min: 30, max: 180 }),
      notes: faker.helpers.maybe(() => faker.lorem.sentence()),
      weight: faker.helpers.maybe(() => this.generateWeightRange()),
      
      // Metadata
      targetMuscles,
      equipment: this.generateEquipment(targetMuscles),
      difficulty: faker.helpers.arrayElement([DifficultyLevel.Beginner, DifficultyLevel.Intermediate, DifficultyLevel.Advanced, DifficultyLevel.Expert]),
      instructions: this.generateInstructions(),
      videoUrl: faker.helpers.maybe(() => `https://example.com/videos/${faker.string.alphanumeric(8)}.mp4`),
      imageUrl: faker.helpers.maybe(() => `https://example.com/images/${faker.string.alphanumeric(8)}.jpg`),
      
      // State and additional data
      state: {
        isCompleted: false,
        completedAt: null,
        actualReps: undefined,
        actualWeight: undefined,
        actualSets: undefined
      },
      
      variations: this.generateVariations(),
      progressionRules: this.generateProgressionRules()
    };
  }

  /**
   * Generate realistic exercise names based on target muscles
   */
  private generateExerciseName(targetMuscles: MuscleGroup[]): string {
    const exerciseNames = {
      [MuscleGroup.Chest]: ['Bench Press', 'Push-ups', 'Chest Flyes', 'Incline Press', 'Decline Press'],
      [MuscleGroup.Back]: ['Pull-ups', 'Deadlifts', 'Bent-over Rows', 'Lat Pulldowns', 'Seated Rows'],
      [MuscleGroup.Shoulders]: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Shrugs', 'Face Pulls'],
      [MuscleGroup.Arms]: ['Bicep Curls', 'Tricep Dips', 'Hammer Curls', 'Tricep Extensions', 'Chin-ups'],
      [MuscleGroup.Legs]: ['Squats', 'Lunges', 'Leg Press', 'Calf Raises', 'Romanian Deadlifts'],
      [MuscleGroup.Core]: ['Plank', 'Crunches', 'Russian Twists', 'Leg Raises', 'Mountain Climbers'],
      [MuscleGroup.Glutes]: ['Hip Thrusts', 'Glute Bridges', 'Donkey Kicks', 'Squats', 'Lunges'],
      [MuscleGroup.Cardio]: ['Running', 'Cycling', 'Jumping Jacks', 'Burpees', 'High Knees']
    };

    const primaryMuscle = targetMuscles[0];
    const exercises = exerciseNames[primaryMuscle] || exerciseNames[MuscleGroup.Chest];
    return faker.helpers.arrayElement(exercises);
  }

  /**
   * Generate realistic rep ranges
   */
  private generateRepRange(): string {
    const repRanges = ['5-8', '8-12', '12-15', '15-20', '20+'];
    return faker.helpers.arrayElement(repRanges);
  }

  /**
   * Generate realistic weight ranges
   */
  private generateWeightRange(): string {
    const weightRanges = ['10-20', '20-30', '30-40', '40-50', '50-60', '60-70'];
    return faker.helpers.arrayElement(weightRanges);
  }

  /**
   * Generate target muscles with realistic combinations
   */
  private generateTargetMuscles(): MuscleGroup[] {
    const muscleGroups = [
      [MuscleGroup.Chest],
      [MuscleGroup.Back],
      [MuscleGroup.Shoulders],
      [MuscleGroup.Arms],
      [MuscleGroup.Legs],
      [MuscleGroup.Core],
      [MuscleGroup.Glutes],
      [MuscleGroup.Cardio],
      [MuscleGroup.Chest, MuscleGroup.Shoulders, MuscleGroup.Arms],
      [MuscleGroup.Back, MuscleGroup.Arms],
      [MuscleGroup.Legs, MuscleGroup.Glutes],
      [MuscleGroup.Core, MuscleGroup.Shoulders]
    ];

    return faker.helpers.arrayElement(muscleGroups);
  }

  /**
   * Generate equipment based on target muscles
   */
  private generateEquipment(targetMuscles: MuscleGroup[]): string[] {
    const allEquipment = [
      'Dumbbells', 'Barbell', 'Resistance bands', 'Exercise mat', 'Pull-up bar',
      'Kettlebells', 'Cable machine', 'Squat rack', 'Bench', 'Medicine ball',
      'Foam roller', 'Jump rope', 'Treadmill', 'Exercise bike'
    ];

    const equipmentByMuscle = {
      [MuscleGroup.Chest]: ['Dumbbells', 'Barbell', 'Bench', 'Resistance bands'],
      [MuscleGroup.Back]: ['Pull-up bar', 'Dumbbells', 'Cable machine', 'Barbell'],
      [MuscleGroup.Shoulders]: ['Dumbbells', 'Barbell', 'Resistance bands', 'Cable machine'],
      [MuscleGroup.Arms]: ['Dumbbells', 'Barbell', 'Cable machine', 'Resistance bands'],
      [MuscleGroup.Legs]: ['Squat rack', 'Barbell', 'Dumbbells', 'Kettlebells'],
      [MuscleGroup.Core]: ['Exercise mat', 'Medicine ball', 'Resistance bands'],
      [MuscleGroup.Glutes]: ['Squat rack', 'Barbell', 'Dumbbells', 'Resistance bands'],
      [MuscleGroup.Cardio]: ['Treadmill', 'Exercise bike', 'Jump rope', 'Exercise mat']
    };

    let availableEquipment: string[] = [];
    targetMuscles.forEach(muscle => {
      availableEquipment = [...availableEquipment, ...(equipmentByMuscle[muscle] || [])];
    });

    // Remove duplicates and return a subset
    const uniqueEquipment = [...new Set(availableEquipment)];
    return faker.helpers.arrayElements(uniqueEquipment, { min: 1, max: 3 });
  }

  /**
   * Generate exercise instructions
   */
  private generateInstructions(): string[] {
    const baseInstructions = [
      'Stand with feet shoulder-width apart',
      'Keep your back straight',
      'Engage your core muscles',
      'Breathe in during the eccentric phase',
      'Breathe out during the concentric phase',
      'Maintain proper form throughout',
      'Control the movement, don\'t use momentum',
      'Focus on the target muscle group'
    ];

    return faker.helpers.arrayElements(baseInstructions, { min: 3, max: 6 });
  }

  /**
   * Generate exercise variations
   */
  private generateVariations(): ExerciseVariation[] {
    const count = faker.number.int({ min: 0, max: 3 });
    
    return Array.from({ length: count }, (_, index) => ({
      name: `${faker.lorem.word()} Variation`,
      difficulty: faker.helpers.arrayElement([DifficultyLevel.Beginner, DifficultyLevel.Intermediate, DifficultyLevel.Advanced, DifficultyLevel.Expert]),
      equipment: faker.helpers.arrayElements(['Dumbbells', 'Barbell', 'Body weight', 'Resistance bands']),
      description: faker.lorem.sentence()
    } as ExerciseVariation));
  }

  /**
   * Generate progression rules
   */
  private generateProgressionRules(): ProgressionRule[] {
    const rules: ProgressionRule[] = [
      {
        type: 'reps',
        condition: 'complete_all_sets_with_good_form',
        increment: 2,
        maxValue: 20
      },
      {
        type: 'weight',
        condition: 'complete_all_sets_with_target_reps',
        increment: 5,
        maxValue: 200
      }
    ];

    return faker.helpers.arrayElements(rules, { min: 0, max: 2 });
  }

  /**
   * Create a compound exercise (targets multiple muscle groups)
   */
  createCompound(overrides: Partial<EnhancedExercise> = {}): EnhancedExercise {
    const compoundMuscles = faker.helpers.arrayElements([
      MuscleGroup.Chest, MuscleGroup.Back, MuscleGroup.Shoulders,
      MuscleGroup.Legs, MuscleGroup.Glutes
    ], { min: 2, max: 3 });

    return this.create({
      name: this.generateCompoundExerciseName(compoundMuscles),
      targetMuscles: compoundMuscles,
      difficulty: faker.helpers.arrayElement([DifficultyLevel.Intermediate, DifficultyLevel.Advanced]),
      sets: faker.number.int({ min: 3, max: 4 }),
      equipment: ['Barbell', 'Dumbbells'],
      ...overrides
    });
  }

  /**
   * Generate compound exercise names
   */
  private generateCompoundExerciseName(targetMuscles: MuscleGroup[]): string {
    const compoundExercises = {
      [MuscleGroup.Chest + ',' + MuscleGroup.Shoulders]: ['Push Press', 'Incline Bench Press'],
      [MuscleGroup.Back + ',' + MuscleGroup.Arms]: ['Pull-ups', 'Bent-over Rows'],
      [MuscleGroup.Legs + ',' + MuscleGroup.Glutes]: ['Squats', 'Deadlifts'],
      [MuscleGroup.Chest + ',' + MuscleGroup.Arms]: ['Bench Press', 'Dips']
    };

    const key = targetMuscles.join(',');
    const exercises = compoundExercises[key as keyof typeof compoundExercises] || ['Compound Movement'];
    return faker.helpers.arrayElement(exercises);
  }

  /**
   * Create an isolation exercise (targets single muscle group)
   */
  createIsolation(overrides: Partial<EnhancedExercise> = {}): EnhancedExercise {
    return this.create({
      sets: faker.number.int({ min: 2, max: 3 }),
      reps: faker.helpers.arrayElement(['8-12', '12-15', '15-20']),
      restSeconds: faker.number.int({ min: 30, max: 60 }),
      difficulty: faker.helpers.arrayElement([DifficultyLevel.Beginner, DifficultyLevel.Intermediate]),
      equipment: ['Dumbbells', 'Resistance bands', 'Cable machine'],
      ...overrides
    });
  }

  /**
   * Create a cardio exercise
   */
  createCardio(overrides: Partial<EnhancedExercise> = {}): EnhancedExercise {
    return this.create({
      name: faker.helpers.arrayElement(['Running', 'Cycling', 'Rowing', 'Jumping Jacks', 'Burpees']),
      targetMuscles: [MuscleGroup.Cardio],
      sets: 1,
      reps: faker.helpers.arrayElement(['30-60s', '1-2 min', '2-3 min', '5-10 min']),
      restSeconds: faker.number.int({ min: 30, max: 90 }),
      equipment: ['Treadmill', 'Exercise bike', 'Rower', 'Exercise mat'],
      difficulty: faker.helpers.arrayElement([DifficultyLevel.Beginner, DifficultyLevel.Intermediate]),
      ...overrides
    });
  }
}

// Export singleton instance for easy usage
export const exerciseFactory = new ExerciseFactory();