import { z } from 'zod';

export const BodyPartEnum = z.enum([
  'neck', 'lower arms', 'shoulders', 'cardio', 'upper arms', 'chest',
  'lower legs', 'back', 'upper legs', 'waist'
]);

export const MuscleEnum = z.enum([
  'shins', 'hands', 'sternocleidomastoid', 'soleus', 'inner thighs', 'lower abs',
  'grip muscles', 'abdominals', 'wrist extensors', 'wrist flexors', 'latissimus dorsi',
  'upper chest', 'rotator cuff', 'wrists', 'groin', 'brachialis', 'deltoids', 'feet',
  'ankles', 'trapezius', 'rear deltoids', 'chest', 'quadriceps', 'back', 'core',
  'shoulders', 'ankle stabilizers', 'rhomboids', 'obliques', 'lower back', 'hip flexors',
  'levator scapulae', 'abductors', 'serratus anterior', 'traps', 'forearms', 'delts',
  'biceps', 'upper back', 'spine', 'cardiovascular system', 'triceps', 'adductors',
  'hamstrings', 'glutes', 'pectorals', 'calves', 'lats', 'quads', 'abs'
]);

export const EquipmentEnum = z.enum([
  'stepmill machine', 'elliptical machine', 'trap bar', 'tire', 'stationary bike',
  'wheel roller', 'smith machine', 'hammer', 'skierg machine', 'roller',
  'resistance band', 'bosu ball', 'weighted', 'olympic barbell', 'kettlebell',
  'upper body ergometer', 'sled machine', 'ez barbell', 'dumbbell', 'rope',
  'barbell', 'band', 'stability ball', 'medicine ball', 'assisted',
  'leverage machine', 'cable', 'body weight'
]);

export const DifficultyEnum = z.enum(['beginner', 'intermediate', 'advanced']);

export const MechanicsEnum = z.enum(['compound', 'isolation']);

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  bodyPart: z.array(BodyPartEnum).min(1),
  primaryMuscle: z.array(MuscleEnum).min(1),
  secondaryMuscles: z.array(MuscleEnum),
  equipment: z.array(EquipmentEnum).min(1),
  difficulty: DifficultyEnum.optional(),
  mechanics: MechanicsEnum.optional(),
  instructions: z.array(z.string()).min(1),
  cues: z.array(z.string()),
  contraindications: z.array(z.string()),
  media: z.object({
    gif: z.string().optional(),
    video: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
  tags: z.array(z.string()),
  sourceMeta: z.object({
    ai_augmented: z.boolean().optional(),
    attribution: z.string().optional(),
  }),
}).strict();

export type BodyPart = z.infer<typeof BodyPartEnum>;
export type Muscle = z.infer<typeof MuscleEnum>;
export type Equipment = z.infer<typeof EquipmentEnum>;
export type Difficulty = z.infer<typeof DifficultyEnum>;
export type Mechanics = z.infer<typeof MechanicsEnum>;
export type Exercise = z.infer<typeof ExerciseSchema>;

// Enhanced schemas (from the original schemas file)
import { Gender, FitnessGoal, FitnessLevel, TimeOfDay, MuscleGroup, DifficultyLevel, WorkoutFocus, TrainingPhase, WorkoutDayState, SessionState, ExerciseSessionData } from '../../types/enhanced';

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
  createdAt: z.number().positive('Created timestamp must be positive'),
  updatedAt: z.number().positive('Updated timestamp must be positive')
});

export const TimestampedSchema = z.object({
  timestamp: z.number().positive('Timestamp must be positive')
});

export const VersionedSchema = z.object({
  version: z.string().min(1, 'Version cannot be empty')
});

// Enum schemas
export const GenderSchema = z.nativeEnum(Gender);
export const FitnessGoalSchema = z.nativeEnum(FitnessGoal);
export const FitnessLevelSchema = z.nativeEnum(FitnessLevel);
export const TimeOfDaySchema = z.nativeEnum(TimeOfDay);
export const MuscleGroupSchema = z.nativeEnum(MuscleGroup);
export const DifficultyLevelSchema = z.nativeEnum(DifficultyLevel);
export const WorkoutFocusSchema = z.nativeEnum(WorkoutFocus);
export const TrainingPhaseSchema = z.nativeEnum(TrainingPhase);
export const SessionStateSchema = z.nativeEnum(SessionState);
export const WorkoutDayStateSchema = z.nativeEnum(WorkoutDayState);

// User Profile schemas
export const BaseUserProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name too long'),
  age: z.number().int().min(13, 'Must be at least 13 years old').max(120, 'Invalid age'),
  heightCm: z.number().min(100, 'Height too low').max(250, 'Height too high'),
  weightKg: z.number().min(30, 'Weight too low').max(300, 'Weight too high'),
  gender: GenderSchema,
  goal: FitnessGoalSchema,
  injuries: z.string().optional()
});

export const CalculatedUserMetricsSchema = z.object({
  bmi: z.number().min(10, 'BMI too low').max(50, 'BMI too high'),
  tdee: z.number().min(1000, 'TDEE too low').max(5000, 'TDEE too high'),
  bmr: z.number().min(800, 'BMR too low').max(4000, 'BMR too high'),
  bodyFatPercentage: z.number().min(3).max(50).optional()
});

export const UserPreferencesSchema = z.object({
  workoutDuration: z.number().int().min(15, 'Workout too short').max(180, 'Workout too long'),
  workoutsPerWeek: z.number().int().min(1, 'At least 1 workout per week').max(7, 'Max 7 workouts per week'),
  preferredTimeOfDay: TimeOfDaySchema,
  equipmentPreferences: z.array(z.string()).max(20, 'Too many equipment preferences'),
  exerciseRestrictions: z.array(z.string()).max(10, 'Too many exercise restrictions')
});

export const EnhancedUserProfileSchema = BaseEntitySchema.merge(BaseUserProfileSchema).merge(CalculatedUserMetricsSchema).extend({
  preferences: UserPreferencesSchema,
  fitnessLevel: FitnessLevelSchema,
  medicalConditions: z.array(z.string()).max(10, 'Too many medical conditions')
});

// Exercise schemas
export const BaseExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name cannot be empty').max(100, 'Exercise name too long'),
  sets: z.number().int().min(1, 'At least 1 set required').max(10, 'Too many sets'),
  reps: z.string().min(1, 'Reps specification required').max(20, 'Reps specification too long'),
  restSeconds: z.number().int().min(0, 'Rest cannot be negative').max(600, 'Rest too long'),
  notes: z.string().max(500, 'Notes too long')
});

export const ExerciseMetadataSchema = z.object({
  muscleGroups: z.array(MuscleGroupSchema).min(1, 'At least one muscle group required').max(5, 'Too many muscle groups'),
  equipment: z.array(z.string()).max(10, 'Too much equipment'),
  difficulty: DifficultyLevelSchema,
  instructions: z.array(z.string()).max(20, 'Too many instructions'),
  videoUrl: z.string().url('Invalid video URL').optional(),
  imageUrl: z.string().url('Invalid image URL').optional()
});

export const ExerciseStateSchema = z.object({
  isCompleted: z.boolean(),
  completedAt: z.number().positive().nullable(),
  actualReps: z.string().max(20).optional(),
  actualWeight: z.number().positive().max(1000).optional(),
  actualSets: z.number().int().min(1).max(10).optional()
});

export const EnhancedExerciseSchema = BaseEntitySchema.merge(BaseExerciseSchema).merge(ExerciseMetadataSchema).extend({
  state: ExerciseStateSchema,
  variations: z.array(z.object({
    name: z.string().min(1).max(100),
    difficulty: DifficultyLevelSchema,
    equipment: z.array(z.string()).max(5),
    description: z.string().max(500)
  })).max(10, 'Too many variations'),
  progressionRules: z.array(z.object({
    type: z.enum(['reps', 'weight', 'time', 'sets']),
    condition: z.string().min(1).max(100),
    increment: z.number().positive(),
    maxValue: z.number().positive().optional()
  })).max(5, 'Too many progression rules')
});

// Workout schemas
export const BaseWorkoutDaySchema = z.object({
  dayName: z.string().min(1, 'Day name required').max(20, 'Day name too long'),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  isRestDay: z.boolean(),
  focus: WorkoutFocusSchema
});

export const WorkoutDayMetadataSchema = z.object({
  estimatedDuration: z.number().int().min(15).max(180),
  targetCalories: z.number().int().min(50).max(1000),
  difficulty: DifficultyLevelSchema,
  warmupExercises: z.array(z.string()).max(10),
  cooldownExercises: z.array(z.string()).max(10)
});

export const EnhancedWorkoutDaySchema = BaseEntitySchema.merge(BaseWorkoutDaySchema).merge(WorkoutDayMetadataSchema).extend({
  exercises: z.array(EnhancedExerciseSchema).max(20, 'Too many exercises'),
  state: WorkoutDayStateSchema
});

export const WeekProgressMetricsSchema = z.object({
  totalWorkouts: z.number().int().min(0).max(7),
  completedWorkouts: z.number().int().min(0).max(7),
  averageRpe: z.number().min(1).max(10),
  totalVolume: z.number().min(0),
  strengthGains: z.record(z.string(), z.number())
});

export const EnhancedWorkoutWeekSchema = BaseEntitySchema.extend({
  weekNumber: z.number().int().min(1).max(52),
  focus: z.string().min(1).max(100),
  phase: TrainingPhaseSchema,
  days: z.array(EnhancedWorkoutDaySchema).length(7, 'Week must have 7 days'),
  progressMetrics: WeekProgressMetricsSchema
});

export const WorkoutPlanMetadataSchema = z.object({
  createdBy: z.string().min(1),
  tags: z.array(z.string()).max(20),
  isPublic: z.boolean(),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().min(0),
  equipment: z.array(z.string()).max(50),
  targetAudience: z.array(FitnessLevelSchema).max(4)
});

export const EnhancedWorkoutPlanSchema = BaseEntitySchema.merge(VersionedSchema).extend({
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description required').max(1000, 'Description too long'),
  totalDurationWeeks: z.number().int().min(1, 'At least 1 week required').max(52, 'Too many weeks'),
  targetUser: z.string().uuid('Invalid user ID'),
  generatedAt: z.string().datetime('Generated At must be a valid ISO 8601 datetime string'), // Added generatedAt
  weeks: z.array(EnhancedWorkoutWeekSchema).min(1, 'At least 1 week required').max(52, 'Too many weeks'),
  metadata: WorkoutPlanMetadataSchema
});

// Session schemas
export const BaseSessionSchema = BaseEntitySchema.merge(TimestampedSchema).extend({
  weekId: z.string().uuid('Invalid week ID'),
  dayId: z.string().uuid('Invalid day ID'),
  state: SessionStateSchema,
  startTime: z.number().positive('Start time must be positive')
});

export const SessionTimestampsSchema = z.object({
  completedTime: z.number().positive().nullable(),
  loggedTime: z.number().positive().nullable(),
  exerciseTimestamps: z.record(z.string(), z.number().positive())
});

export const SessionMetricsSchema = z.object({
  totalExercises: z.number().int().min(0).max(50),
  completedExercises: z.number().int().min(0).max(50),
  estimatedDuration: z.number().int().min(0).max(300),
  actualDuration: z.number().int().min(0).max(300).nullable(),
  caloriesBurned: z.number().int().min(0).max(2000).optional()
});

export const SessionEnvironmentSchema = z.object({
  location: z.enum(['home', 'gym', 'outdoor', 'other']),
  temperature: z.number().min(-20).max(50).optional(),
  humidity: z.number().min(0).max(100).optional(),
  equipment: z.array(z.string()).max(20)
});

export const WorkoutAnalysisSchema = z.object({
  score: z.number().min(1).max(10),
  mood: z.string().min(1).max(50),
  summary: z.string().min(1).max(500),
  advice: z.string().min(1).max(500),
  strengths: z.array(z.string()).max(10),
  improvements: z.array(z.string()).max(10),
  nextWorkoutRecommendations: z.array(z.string()).max(10)
});

export const EnhancedWorkoutSessionSchema = BaseSessionSchema.merge(SessionTimestampsSchema).merge(SessionMetricsSchema).extend({
  isReadOnly: z.boolean(),
  rpe: z.number().int().min(1).max(10).optional(),
  analysis: WorkoutAnalysisSchema.optional(),
  notes: z.string().max(1000).optional(),
  environment: SessionEnvironmentSchema,
  exerciseData: z.record(z.string(), z.object({
    exerciseId: z.string(),
    sets: z.array(z.object({
      id: z.string(),
      setNumber: z.number(),
      weight: z.number(),
      reps: z.number(),
      rpe: z.number().optional(),
      completedAt: z.number(),
      targetRestTime: z.number(),
      actualRestTime: z.number(),
      duration: z.number()
    })),
    isCompleted: z.boolean(),
    completedAt: z.number().optional(),
    notes: z.string().optional()
  })).default({})
});

export const EnhancedWorkoutSessionWithRefinements = EnhancedWorkoutSessionSchema.refine(
  (data) => {
    // If session is completed, it must have completedTime
    if (data.state === SessionState.COMPLETED && !data.completedTime) {
      return false;
    }
    // If session is logged, it must have loggedTime and rpe
    if (data.state === SessionState.LOGGED && (!data.loggedTime || !data.rpe)) {
      return false;
    }
    // Completed exercises cannot exceed total exercises
    if (data.completedExercises > data.totalExercises) {
      return false;
    }
    return true;
  },
  {
    message: "Session state and data are inconsistent"
  }
);

export const EnhancedUserProfileWithRefinements = EnhancedUserProfileSchema.refine(
  (data) => {
    // BMI should be calculated correctly
    const calculatedBmi = data.weightKg / Math.pow(data.heightCm / 100, 2);
    return Math.abs(data.bmi - calculatedBmi) < 0.1;
  },
  {
    message: "BMI calculation is incorrect"
  }
);

// Export schemas object for compatibility
export const Schemas = {
  BaseEntity: BaseEntitySchema,
  Timestamped: TimestampedSchema,
  Versioned: VersionedSchema,
  EnhancedUserProfile: EnhancedUserProfileWithRefinements,
  UserPreferences: UserPreferencesSchema,
  EnhancedExercise: EnhancedExerciseSchema,
  EnhancedWorkoutDay: EnhancedWorkoutDaySchema,
  EnhancedWorkoutWeek: EnhancedWorkoutWeekSchema,
  EnhancedWorkoutPlan: EnhancedWorkoutPlanSchema,
  EnhancedWorkoutSession: EnhancedWorkoutSessionSchema,
  EnhancedWorkoutSessionWithRefinements: EnhancedWorkoutSessionWithRefinements,
  WorkoutAnalysis: WorkoutAnalysisSchema,
  SessionEnvironment: SessionEnvironmentSchema,
  // Basic schemas
  Exercise: ExerciseSchema,
  BodyPart: BodyPartEnum,
  Muscle: MuscleEnum,
  Equipment: EquipmentEnum,
  Difficulty: DifficultyEnum,
  Mechanics: MechanicsEnum,
};
