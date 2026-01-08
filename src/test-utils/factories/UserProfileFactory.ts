import { faker } from '@faker-js/faker';
import { BaseFactory } from './BaseFactory';
import { 
  EnhancedUserProfile, 
  Gender, 
  FitnessGoal, 
  FitnessLevel, 
  TimeOfDay, 
  MuscleGroup
} from '@/types/enhanced';

/**
 * Factory for creating EnhancedUserProfile instances
 */
export class UserProfileFactory extends BaseFactory<EnhancedUserProfile> {
  protected getDefaults(): EnhancedUserProfile {
    const timestamps = this.generateTimestamps();
    const age = faker.number.int({ min: 16, max: 80 });
    const heightCm = faker.number.int({ min: 140, max: 220 });
    const weightKg = faker.number.int({ min: 40, max: 150 });
    
    // Calculate realistic BMI
    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
    
    // Calculate BMR using Mifflin-St Jeor Equation
    const bmr = this.calculateBMR(weightKg, heightCm, age);
    
    // Calculate TDEE (BMR * activity factor)
    const activityFactor = faker.number.float({ min: 1.2, max: 1.9, fractionDigits: 1 });
    const tdee = Math.round(bmr * activityFactor);

    return {
      id: this.generateId('user'),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      
      // Base profile
      name: faker.person.fullName(),
      age,
      heightCm,
      weightKg,
      gender: this.randomEnum(Gender),
      goal: this.randomEnum(FitnessGoal),
      injuries: faker.helpers.maybe(() => 
        faker.helpers.arrayElement([
          'Lower back pain', 'Knee discomfort', 'Shoulder impingement',
          'Elbow tendinitis', 'Ankle sprain', 'Wrist pain'
        ])
      ),

      // Calculated metrics
      bmi,
      tdee,
      bmr,
      bodyFatPercentage: faker.helpers.maybe(() => 
        faker.number.float({ min: 5, max: 40, fractionDigits: 1 })
      ),

      // Fitness and preferences
      fitnessLevel: this.randomEnum(FitnessLevel),
      preferences: this.generateUserPreferences(),
      medicalConditions: faker.helpers.arrayElements([
        'Hypertension', 'Diabetes Type 2', 'Asthma', 'Arthritis',
        'Heart condition', 'Thyroid condition'
      ], faker.number.int({ min: 0, max: 1 }))
    };
  }

  /**
   * Generate realistic user preferences
   */
  private generateUserPreferences() {
    return {
      workoutDuration: faker.number.int({ min: 20, max: 120 }),
      workoutsPerWeek: faker.number.int({ min: 2, max: 7 }),
      preferredTimeOfDay: this.randomEnum(TimeOfDay),
      equipmentPreferences: this.generateEquipmentPreferences(),
        exerciseRestrictions: faker.helpers.arrayElements([
          'No jumping', 'No heavy lifting', 'Low impact only',
          'No overhead pressing', 'No deep squats', 'No running'
        ], faker.number.int({ min: 0, max: 2 }))
    };
  }

  /**
   * Generate equipment preferences based on fitness level and goal
   */
  private generateEquipmentPreferences(): string[] {
    const basicEquipment = ['Dumbbells', 'Resistance bands', 'Exercise mat'];
    const intermediateEquipment = [...basicEquipment, 'Kettlebells', 'Pull-up bar', 'Bench'];
    const advancedEquipment = [...intermediateEquipment, 'Barbell', 'Cable machine', 'Squat rack'];

    // Simulate realistic equipment access
    const hasHomeGym = faker.datatype.boolean(0.3);
    const hasGymAccess = faker.datatype.boolean(0.7);

    if (hasGymAccess) {
      return faker.helpers.arrayElements(advancedEquipment);
    } else if (hasHomeGym) {
      return faker.helpers.arrayElements(intermediateEquipment);
    } else {
      return faker.helpers.arrayElements(basicEquipment);
    }
  }

  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
   */
  private calculateBMR(weightKg: number, heightCm: number, age: number): number {
    const gender = faker.helpers.arrayElement([Gender.Male, Gender.Female]);
    const s = gender === Gender.Male ? 5 : -161;
    
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
  }

  /**
   * Create a beginner-friendly user profile
   */
  createBeginner(overrides: Partial<EnhancedUserProfile> = {}): EnhancedUserProfile {
    return this.create({
      fitnessLevel: FitnessLevel.Beginner,
      preferences: {
        workoutDuration: faker.number.int({ min: 20, max: 45 }),
        workoutsPerWeek: faker.number.int({ min: 2, max: 3 }),
        preferredTimeOfDay: TimeOfDay.Morning,
        equipmentPreferences: ['Body weight', 'Resistance bands', 'Exercise mat'],
        exerciseRestrictions: []
      },
      goal: FitnessGoal.GeneralFitness,
      ...overrides
    });
  }

  /**
   * Create an advanced athlete profile
   */
  createAdvancedAthlete(overrides: Partial<EnhancedUserProfile> = {}): EnhancedUserProfile {
    return this.create({
      fitnessLevel: FitnessLevel.Advanced,
      age: faker.number.int({ min: 22, max: 45 }),
      preferences: {
        workoutDuration: faker.number.int({ min: 60, max: 120 }),
        workoutsPerWeek: faker.number.int({ min: 4, max: 6 }),
        preferredTimeOfDay: this.randomEnum(TimeOfDay),
        equipmentPreferences: ['Barbell', 'Squat rack', 'Cable machine', 'Dumbbells'],
        exerciseRestrictions: []
      },
      goal: faker.helpers.arrayElement([FitnessGoal.Strength, FitnessGoal.MuscleGain]),
      bodyFatPercentage: faker.number.float({ min: 8, max: 18, fractionDigits: 1 }),
      ...overrides
    });
  }

  /**
   * Create a rehabilitation-focused profile
   */
  createRehabUser(overrides: Partial<EnhancedUserProfile> = {}): EnhancedUserProfile {
    return this.create({
      fitnessLevel: FitnessLevel.Beginner,
      injuries: faker.helpers.arrayElement([
        'Lower back pain', 'Knee discomfort', 'Shoulder impingement'
      ]),
      medicalConditions: ['Arthritis'],
      preferences: {
        workoutDuration: faker.number.int({ min: 15, max: 30 }),
        workoutsPerWeek: faker.number.int({ min: 2, max: 3 }),
        preferredTimeOfDay: TimeOfDay.Afternoon,
        equipmentPreferences: ['Resistance bands', 'Exercise mat', 'Light dumbbells'],
        exerciseRestrictions: ['No jumping', 'Low impact only', 'No heavy lifting']
      },
      goal: FitnessGoal.Flexibility,
      ...overrides
    });
  }
}

// Export singleton instance for easy usage
export const userProfileFactory = new UserProfileFactory();