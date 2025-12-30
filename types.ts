export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export enum FitnessGoal {
  WeightLoss = 'Weight Loss',
  MuscleGain = 'Muscle Gain',
  Endurance = 'Endurance',
  Flexibility = 'Flexibility'
}

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  gender: Gender;
  goal: FitnessGoal;
  injuries?: string;
  bmi: number;
  tdee: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  isCompleted: boolean;
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g., "Monday", "Day 1"
  title: string; // e.g., "Upper Body Power", "Active Recovery"
  isRestDay: boolean;
  exercises: Exercise[];
}

export interface WorkoutWeek {
  id: string;
  weekNumber: number;
  focus: string; // e.g., "Hypertrophy Phase", "Deload"
  days: WorkoutDay[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string; // Overall monthly goal
  generatedAt: string;
  totalDurationWeeks: number;
  weeks: WorkoutWeek[];
}

export interface WorkoutAnalysis {
  score: number; // 1-10
  mood: string; // e.g. "Focused", "Distracted", "Beast Mode"
  summary: string;
  advice: string;
}

export interface WorkoutHistoryEntry {
  id: string;
  completedAt: string;
  planTitle: string;
  weekNumber: number;
  dayName: string;
  dayTitle: string;
  exercisesCompleted: number;
  totalExercises: number;
  durationMinutes: number;
  analysis?: WorkoutAnalysis;
  syncStatus: 'pending' | 'synced';
}

export type AppStep = 'onboarding' | 'scanning' | 'dashboard';

export interface AppState {
  user: UserProfile | null;
  equipment: string[];
  currentPlan: WorkoutPlan | null;
  step: AppStep;
  isLoading: boolean;
  history: WorkoutHistoryEntry[];
}