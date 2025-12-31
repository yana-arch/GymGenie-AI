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
  rpe?: number; // 1-10 intensity rating
  analysis?: WorkoutAnalysis;
  syncStatus: 'pending' | 'synced';
}

// Session State Management Types
export enum SessionState {
  INACTIVE = "inactive",
  ACTIVE = "active",
  COMPLETED = "completed",
  LOGGED = "logged",
}

export interface WorkoutSession {
  id: string;
  weekId: string;
  dayId: string;
  state: SessionState;
  startTime: number | null;
  completedTime: number | null;
  loggedTime: number | null;
  exerciseTimestamps: Record<string, number>;
  isReadOnly: boolean;
}

export interface SessionStateManager {
  currentSession: WorkoutSession | null;
  startSession: (weekId: string, dayId: string) => void;
  completeSession: () => void;
  logSession: (rpe: number, analysis?: WorkoutAnalysis) => void;
  abandonSession: () => void;
  getSessionForDay: (weekId: string, dayId: string) => WorkoutSession | null;
  isSessionActive: (weekId: string, dayId: string) => boolean;
  isSessionReadOnly: (weekId: string, dayId: string) => boolean;
}

export interface ExerciseState {
  isCompleted: boolean;
  isReadOnly: boolean;
  completedAt: number | null;
  canModify: boolean;
}

export interface ExerciseController {
  canToggleExercise: (
    exerciseId: string,
    weekId: string,
    dayId: string
  ) => boolean;
  toggleExercise: (
    exerciseId: string,
    weekId: string,
    dayId: string
  ) => boolean;
  getExerciseState: (
    exerciseId: string,
    weekId: string,
    dayId: string
  ) => ExerciseState;
}

export interface WorkoutLogger {
  canLogWorkout: (weekId: string, dayId: string) => boolean;
  logWorkout: (
    weekId: string,
    dayId: string,
    rpe: number,
    analysis?: WorkoutAnalysis
  ) => Promise<void>;
  getWorkoutLog: (weekId: string, dayId: string) => WorkoutHistoryEntry | null;
  isWorkoutLogged: (weekId: string, dayId: string) => boolean;
}

export enum SessionError {
  INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
  MULTIPLE_ACTIVE_SESSIONS = "MULTIPLE_ACTIVE_SESSIONS",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  STORAGE_FAILURE = "STORAGE_FAILURE",
  DATA_CORRUPTION = "DATA_CORRUPTION",
  STALE_SESSION = "STALE_SESSION",
}

export interface SessionErrorHandler {
  handleStateTransitionError: (
    from: SessionState,
    to: SessionState,
    error: Error
  ) => void;
  handleStorageError: (operation: string, error: Error) => void;
  handleDataCorruption: (sessionId: string, corruptedData: any) => void;
  recoverFromError: (error: SessionError, context: any) => Promise<void>;
}

export interface SessionStorageData {
  sessions: Record<string, WorkoutSession>;
  activeSessionKey: string | null;
  lastActivity: number;
}

export interface StorageSchema {
  USER_PROFILE: "gymgenie_user";
  EQUIPMENT: "gymgenie_equipment";
  WORKOUT_PLAN: "gymgenie_plan";
  APP_STEP: "gymgenie_step";
  WORKOUT_HISTORY: "gymgenie_history";
  WORKOUT_SESSIONS: "gymgenie_sessions";
  ACTIVE_SESSION: "gymgenie_active_session";
  SESSION_RECOVERY: "gymgenie_session_recovery";
}

export interface Recipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions: string[];
  cookingTimeMinutes: number;
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

// Enhanced AppContext interface with session management
export interface AppContextType extends AppState {
  // Existing methods
  setUser: (user: UserProfile) => void;
  setEquipment: (equipment: string[]) => void;
  setPlan: (plan: WorkoutPlan) => void;
  setStep: (step: AppStep) => void;
  setLoading: (loading: boolean) => void;
  toggleExercise: (exerciseId: string) => boolean;
  updateDayInPlan: (weekId: string, updatedDay: WorkoutDay) => void;
  logWorkout: (weekId: string, dayId: string, rpe: number, analysis?: WorkoutAnalysis) => void;
  resetApp: () => void;
  
  // Timer related
  timerSeconds: number;
  isTimerRunning: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  addTimerSeconds: (seconds: number) => void;

  // Reorder & Swap
  moveExercise: (weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down') => void;
  replaceExerciseInPlan: (weekId: string, dayId: string, oldExerciseId: string, newExerciseData: Omit<Exercise, 'id' | 'isCompleted'>) => void;

  // Session Tracking (existing)
  sessionStartTime: number | null;
  exerciseTimestamps: Record<string, number>;

  // New session management properties
  sessionManager: SessionStateManager;
  currentSession: WorkoutSession | null;

  // Enhanced session methods
  startWorkoutSession: (weekId: string, dayId: string) => void;
  completeWorkoutSession: () => void;
  logWorkoutSession: (rpe: number, analysis?: WorkoutAnalysis) => void;
  abandonWorkoutSession: () => void;

  // Session query methods
  isWorkoutReadOnly: (weekId: string, dayId: string) => boolean;
  canModifyExercise: (
    exerciseId: string,
    weekId: string,
    dayId: string
  ) => boolean;
  getSessionState: (weekId: string, dayId: string) => SessionState;
}