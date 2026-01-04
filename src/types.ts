export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other",
}

export enum FitnessGoal {
  WeightLoss = "Weight Loss",
  MuscleGain = "Muscle Gain",
  Endurance = "Endurance",
  Flexibility = "Flexibility",
}

export enum BodyPart {
  Neck = "neck",
  LowerArms = "lower arms",
  Shoulders = "shoulders",
  Cardio = "cardio",
  UpperArms = "upper arms",
  Chest = "chest",
  LowerLegs = "lower legs",
  Back = "back",
  UpperLegs = "upper legs",
  Waist = "waist",
}

export enum Muscle {
  Shins = "shins",
  Hands = "hands",
  Sternocleidomastoid = "sternocleidomastoid",
  Soleus = "soleus",
  InnerThighs = "inner thighs",
  LowerAbs = "lower abs",
  GripMuscles = "grip muscles",
  Abdominals = "abdominals",
  WristExtensors = "wrist extensors",
  WristFlexors = "wrist flexors",
  LatissimusDorsi = "latissimus dorsi",
  UpperChest = "upper chest",
  RotatorCuff = "rotator cuff",
  Wrists = "wrists",
  Groin = "groin",
  Brachialis = "brachialis",
  Deltoids = "deltoids",
  Feet = "feet",
  Ankles = "ankles",
  Trapezius = "trapezius",
  RearDeltoids = "rear deltoids",
  Chest = "chest",
  Quadriceps = "quadriceps",
  Back = "back",
  Core = "core",
  Shoulders = "shoulders",
  AnkleStabilizers = "ankle stabilizers",
  Rhomboids = "rhomboids",
  Obliques = "obliques",
  LowerBack = "lower back",
  HipFlexors = "hip flexors",
  LevatorScapulae = "levator scapulae",
  Abductors = "abductors",
  SerratusAnterior = "serratus anterior",
  Traps = "traps",
  Forearms = "forearms",
  Delts = "delts",
  Biceps = "biceps",
  UpperBack = "upper back",
  Spine = "spine",
  CardiovascularSystem = "cardiovascular system",
  Triceps = "triceps",
  Adductors = "adductors",
  Hamstrings = "hamstrings",
  Glutes = "glutes",
  Pectorals = "pectorals",
  Calves = "calves",
  Lats = "lats",
  Quads = "quads",
  Abs = "abs",
}

export enum Equipment {
  StepmillMachine = "stepmill machine",
  EllipticalMachine = "elliptical machine",
  TrapBar = "trap bar",
  Tire = "tire",
  StationaryBike = "stationary bike",
  WheelRoller = "wheel roller",
  SmithMachine = "smith machine",
  Hammer = "hammer",
  SkiErgMachine = "skierg machine",
  Roller = "roller",
  ResistanceBand = "resistance band",
  BosuBall = "bosu ball",
  Weighted = "weighted",
  OlympicBarbell = "olympic barbell",
  Kettlebell = "kettlebell",
  UpperBodyErgometer = "upper body ergometer",
  SledMachine = "sled machine",
  EzBarbell = "ez barbell",
  Dumbbell = "dumbbell",
  Rope = "rope",
  Barbell = "barbell",
  Band = "band",
  StabilityBall = "stability ball",
  MedicineBall = "medicine ball",
  Assisted = "assisted",
  LeverageMachine = "leverage machine",
  Cable = "cable",
  BodyWeight = "body weight",
}

export enum Difficulty {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

export enum Mechanics {
  Compound = "compound",
  Isolation = "isolation",
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  bodyPart: BodyPart[];
  primaryMuscle: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  difficulty?: Difficulty;
  mechanics?: Mechanics;
  instructions: string[];
  cues: string[];
  contraindications: string[];
  media: {
    gif?: string;
    video?: string;
    thumbnail?: string;
  };
  tags: string[];
  sourceMeta: {
    ai_augmented?: boolean;
    attribution?: string;
  };
}

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  gender: Gender;
  goal: FitnessGoal;
  injuries?: string;
  equipment?: string[]; // New: List of equipment the user has
  bmi: number;
  tdee: number;
  streak?: {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
  };
}

export type AiProvider = "google";

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  useCustomUrl: boolean;
  customUrl: string;
  model: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  isCompleted: boolean;
}

export interface ExerciseDetails {
  targetMuscles: string[];
  instructions: string[];
  commonMistakes: string[];
  proTips: string[];
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g., "Monday", "Day 1"
  title: string; // e.g., "Upper Body Power", "Active Recovery"
  isRestDay: boolean;
  exercises: WorkoutExercise[];
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
  readonly score: number; // 1-10
  readonly mood: string;
  readonly summary: string;
  readonly advice: string;
  readonly strengths: string[];
  readonly improvements: string[];
  readonly nextWorkoutRecommendations: string[];
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
  syncStatus: "pending" | "synced";
}

// Session State Management Types
export enum SessionState {
  INACTIVE = "inactive",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  LOGGED = "logged",
  ABANDONED = "abandoned",
}

export interface WorkoutSession {
  readonly id: string;
  readonly weekId: string;
  readonly dayId: string;
  readonly state: SessionState;
  readonly startTime: number;
  readonly completedTime: number | null;
  readonly loggedTime: number | null;
  readonly exerciseTimestamps: Record<string, number>;
  readonly isReadOnly: boolean;
  readonly rpe?: number;
  readonly analysis?: WorkoutAnalysis;
  // This needs to be typed as Record<string, any> to avoid circular dependencies with enhanced.ts
  // In enhanced.ts it is properly typed as Record<string, ExerciseSessionData>
  readonly exerciseData?: Record<string, any>;
}

export interface SessionStateManager {
  currentSession: WorkoutSession | null;
  startSession: (weekId: string, dayId: string) => Promise<void>;
  completeSession: () => Promise<void>;
  logSession: (rpe: number, analysis?: WorkoutAnalysis) => Promise<void>;
  abandonSession: () => Promise<void>;
  getSessionForDay: (weekId: string, dayId: string) => WorkoutSession | null;
  isSessionActive: (weekId: string, dayId: string) => boolean;
  isSessionReadOnly: (weekId: string, dayId: string) => boolean;
  addSet: (exerciseId: string, set: any) => Promise<void>;
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

export type AppStep =
  | "onboarding"
  | "scanning"
  | "generatePlan"
  | "dashboard"
  | "session";
export type ActiveView =
  | "home"
  | "workout"
  | "kitchen"
  | "progress"
  | "profile"
  | "createWorkoutDay";

export interface AppState {
  user: UserProfile | null;
  equipment: string[];
  currentPlan: WorkoutPlan | null;
  step: AppStep;
  activeView: ActiveView;
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
  setActiveView: (view: ActiveView) => void;
  setLoading: (loading: boolean) => void;
  toggleExercise: (exerciseId: string) => Promise<boolean>;
  updateDayInPlan: (weekId: string, updatedDay: WorkoutDay) => void;
  logWorkout: (
    weekId: string,
    dayId: string,
    rpe: number,
    analysis?: WorkoutAnalysis
  ) => Promise<void>;
  resetApp: () => Promise<void>;

  // Timer related
  timerSeconds: number;
  isTimerRunning: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  addTimerSeconds: (seconds: number) => void;

  // Reorder & Swap
  moveExercise: (
    weekId: string,
    dayId: string,
    exerciseId: string,
    direction: "up" | "down"
  ) => void;
  replaceExerciseInPlan: (
    weekId: string,
    dayId: string,
    oldExerciseId: string,
    newExerciseData: Omit<Exercise, "id" | "isCompleted">
  ) => void;

  // Session Tracking (existing)
  sessionStartTime: number | null;
  exerciseTimestamps: Record<string, number>;

  // New session management properties
  sessionManager: SessionStateManager;
  currentSession: WorkoutSession | null;

  // Enhanced session methods
  startWorkoutSession: (weekId: string, dayId: string) => Promise<void>;
  completeWorkoutSession: () => Promise<void>;
  logWorkoutSession: (rpe: number, analysis?: WorkoutAnalysis) => Promise<void>;
  abandonWorkoutSession: () => Promise<void>;
  addSetToSession: (exerciseId: string, set: any) => Promise<void>;

  // Session query methods
  isWorkoutReadOnly: (weekId: string, dayId: string) => boolean;
  canModifyExercise: (
    exerciseId: string,
    weekId: string,
    dayId: string
  ) => boolean;
  getSessionState: (weekId: string, dayId: string) => SessionState;
}
