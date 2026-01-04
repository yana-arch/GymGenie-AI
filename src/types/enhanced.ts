import { z } from 'zod';
import { SessionState, WorkoutAnalysis } from '../types';
export { SessionState };

// Base interfaces with proper inheritance
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface Timestamped {
  readonly timestamp: number;
}

export interface Versioned {
  readonly version: string;
}

// Enhanced User Profile with inheritance
export interface BaseUserProfile {
  readonly name: string;
  readonly age: number;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly gender: Gender;
  readonly goal: FitnessGoal;
  readonly injuries?: string;
}

export interface CalculatedUserMetrics {
  readonly bmi: number;
  readonly tdee: number;
  readonly bmr: number;
  readonly bodyFatPercentage?: number;
}

export interface EnhancedUserProfile extends BaseEntity, BaseUserProfile, CalculatedUserMetrics {
  readonly preferences: UserPreferences;
  readonly fitnessLevel: FitnessLevel;
  readonly medicalConditions: string[];
}

export interface UserPreferences {
  readonly workoutDuration: number; // minutes
  readonly workoutsPerWeek: number;
  readonly preferredTimeOfDay: TimeOfDay;
  readonly equipmentPreferences: string[];
  readonly exerciseRestrictions: string[];
}

// Enhanced Exercise with inheritance
export interface BaseExercise {
  readonly name: string;
  readonly sets: number;
  readonly reps: string;
  readonly restSeconds: number;
  readonly notes: string;
  readonly weight?: string; // Added weight property
}

export interface ExerciseMetadata {
  readonly targetMuscles: MuscleGroup[]; // Renamed muscleGroups to targetMuscles
  readonly equipment: string[];
  readonly difficulty: DifficultyLevel;
  readonly instructions: string[];
  readonly videoUrl?: string;
  readonly imageUrl?: string;
}

export interface ExerciseState {
  readonly isCompleted: boolean;
  readonly completedAt: number | null;
  readonly actualReps?: string;
  readonly actualWeight?: number;
  readonly actualSets?: number;
}

export interface EnhancedExercise extends BaseEntity, BaseExercise, ExerciseMetadata {
  readonly state: ExerciseState;
  readonly variations: ExerciseVariation[];
  readonly progressionRules: ProgressionRule[];
}

// Enhanced Workout structures
export interface BaseWorkoutDay {
  readonly dayName: string;
  readonly title: string;
  readonly isRestDay: boolean;
  readonly focus: WorkoutFocus;
}

export interface WorkoutDayMetadata {
  readonly estimatedDuration: number;
  readonly targetCalories: number;
  readonly difficulty: DifficultyLevel;
  readonly warmupExercises: string[];
  readonly cooldownExercises: string[];
}

export interface EnhancedWorkoutDay extends BaseEntity, BaseWorkoutDay, WorkoutDayMetadata {
  readonly exercises: EnhancedExercise[];
  readonly state: WorkoutDayState;
}

export interface EnhancedWorkoutWeek extends BaseEntity {
  readonly weekNumber: number;
  readonly focus: string;
  readonly phase: TrainingPhase;
  readonly days: EnhancedWorkoutDay[];
  readonly progressMetrics: WeekProgressMetrics;
}

export interface EnhancedWorkoutPlan extends BaseEntity, Versioned {
  readonly title: string;
  readonly description: string;
  readonly totalDurationWeeks: number;
  readonly targetUser: string; // User ID
  readonly weeks: EnhancedWorkoutWeek[];
  readonly metadata: WorkoutPlanMetadata;
}

// Enhanced Session Management
export interface BaseSession extends BaseEntity, Timestamped {
  readonly weekId: string;
  readonly dayId: string;
  readonly state: SessionState;
  readonly startTime: number;
}

export interface SessionTimestamps {
  readonly completedTime?: number | null;
  readonly loggedTime?: number | null;
  readonly exerciseTimestamps: Record<string, number>;
}

export interface SessionMetrics {
  readonly totalExercises: number;
  readonly completedExercises: number;
  readonly estimatedDuration: number;
  readonly actualDuration?: number | null;
  readonly caloriesBurned?: number;
}

export interface EnhancedWorkoutSession extends BaseSession, SessionTimestamps, SessionMetrics {
  readonly isReadOnly: boolean;
  readonly rpe?: number;
  readonly analysis?: WorkoutAnalysis;
  readonly notes?: string;
  readonly environment: SessionEnvironment;
  readonly exerciseData: Record<string, ExerciseSessionData>;
}

export interface SetPerformance {
  readonly id: string;
  readonly setNumber: number;
  readonly weight: number;
  readonly reps: number;
  readonly rpe?: number;
  readonly completedAt: number;
  readonly targetRestTime: number; // in seconds
  readonly actualRestTime: number; // in seconds
  readonly duration: number; // Duration of the set in ms
}

export interface ExerciseSessionData {
  readonly exerciseId: string;
  readonly sets: SetPerformance[];
  readonly isCompleted: boolean;
  readonly completedAt?: number;
  readonly notes?: string;
}

export interface WorkoutSessionStorageObject {
  id: string;
  weekId: string;
  dayId: string;
  state: SessionState;
  startTime: number;
  completedTime: number | null;
  loggedTime: number | null;
  exerciseTimestamps: Record<string, number>;
  exerciseData?: Record<string, ExerciseSessionData>;
  isReadOnly: boolean;
  rpe?: number;
  analysis?: WorkoutAnalysis;
}

// Enums
export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export enum FitnessGoal {
  WeightLoss = 'Weight Loss',
  MuscleGain = 'Muscle Gain',
  Endurance = 'Endurance',
  Flexibility = 'Flexibility',
  Strength = 'Strength',
  GeneralFitness = 'General Fitness'
}

export enum FitnessLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
  Expert = 'Expert'
}

export enum TimeOfDay {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Evening = 'Evening',
  Night = 'Night'
}

export enum MuscleGroup {
  Chest = 'Chest',
  Back = 'Back',
  Shoulders = 'Shoulders',
  Arms = 'Arms',
  Legs = 'Legs',
  Core = 'Core',
  Glutes = 'Glutes',
  Cardio = 'Cardio'
}

export enum DifficultyLevel {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Expert = 4
}

export enum WorkoutFocus {
  Strength = 'Strength',
  Hypertrophy = 'Hypertrophy',
  Endurance = 'Endurance',
  Power = 'Power',
  Recovery = 'Recovery',
  Flexibility = 'Flexibility'
}

export enum TrainingPhase {
  Preparation = 'Preparation',
  Base = 'Base',
  Build = 'Build',
  Peak = 'Peak',
  Recovery = 'Recovery',
  Deload = 'Deload'
}



export enum WorkoutDayState {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOGGED = 'logged',
  SKIPPED = 'skipped'
}

// Supporting interfaces
export interface ExerciseVariation {
  readonly name: string;
  readonly difficulty: DifficultyLevel;
  readonly equipment: string[];
  readonly description: string;
}

export interface ProgressionRule {
  readonly type: 'reps' | 'weight' | 'time' | 'sets';
  readonly condition: string;
  readonly increment: number;
  readonly maxValue?: number;
}

export interface WeekProgressMetrics {
  readonly totalWorkouts: number;
  readonly completedWorkouts: number;
  readonly averageRpe: number;
  readonly totalVolume: number;
  readonly strengthGains: Record<string, number>;
}

export interface WorkoutPlanMetadata {
  readonly createdBy: string;
  readonly tags: string[];
  readonly isPublic: boolean;
  readonly rating: number;
  readonly reviews: number;
  readonly equipment: string[];
  readonly targetAudience: FitnessLevel[];
}

export interface SessionEnvironment {
  readonly location: 'home' | 'gym' | 'outdoor' | 'other';
  readonly temperature?: number;
  readonly humidity?: number;
  readonly equipment: string[];
}



// Error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
    public readonly constraint: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly data: unknown,
    public readonly operation: 'serialize' | 'deserialize'
  ) {
    super(message);
    this.name = 'SerializationError';
  }
}

// Type guards
export function isBaseEntity(obj: unknown): obj is BaseEntity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).createdAt === 'number' &&
    typeof (obj as any).updatedAt === 'number'
  );
}

export function isEnhancedUserProfile(obj: unknown): obj is EnhancedUserProfile {
  return (
    isBaseEntity(obj) &&
    'name' in obj &&
    'age' in obj &&
    'bmi' in obj &&
    'preferences' in obj &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).age === 'number' &&
    typeof (obj as any).bmi === 'number'
  );
}

export function isEnhancedWorkoutSession(obj: unknown): obj is EnhancedWorkoutSession {
  return (
    isBaseEntity(obj) &&
    'weekId' in obj &&
    'dayId' in obj &&
    'state' in obj &&
    'startTime' in obj &&
    typeof (obj as any).weekId === 'string' &&
    typeof (obj as any).dayId === 'string' &&
    Object.values(SessionState).includes((obj as any).state) &&
    typeof (obj as any).startTime === 'number'
  );
}