import { WorkoutPlan, WorkoutDay, Exercise, WorkoutHistoryEntry, UserProfile, WorkoutAnalysis } from '@/types';

export interface IWorkoutService {
  /**
   * Generate a new workout plan based on user profile and available equipment
   * @param user - The user profile containing fitness goals and preferences
   * @param equipment - Array of available equipment
   * @returns Promise resolving to the generated WorkoutPlan
   */
  generateWorkout(user: UserProfile, equipment: string[]): Promise<WorkoutPlan>;
  
  /**
   * Modify an existing workout day based on user prompt
   * @param day - The workout day to modify
   * @param prompt - User's modification request
   * @returns Promise resolving to the modified WorkoutDay
   */
  modifyWorkout(day: WorkoutDay, prompt: string): Promise<WorkoutDay>;
  
  /**
   * Analyze a completed workout session
   * @param metrics - Session metrics including duration, exercises completed, etc.
   * @returns Promise resolving to WorkoutAnalysis
   */
  analyzeSession(metrics: {
    duration: number;
    exercisesCompleted: number;
    totalExercises: number;
    rpe: number;
    exerciseTimestamps: Record<string, number>;
  }): Promise<WorkoutAnalysis>;
  
  /**
   * Get the current workout plan
   * @returns The current WorkoutPlan or null if none exists
   */
  getCurrentPlan(): WorkoutPlan | null;
  
  /**
   * Set the current workout plan
   * @param plan - The WorkoutPlan to set as current
   */
  setCurrentPlan(plan: WorkoutPlan): void;
  
  /**
   * Toggle completion status of an exercise
   * @param exerciseId - The exercise identifier
   * @param timestamp - Optional timestamp for completion
   * @returns True if toggle was successful, false otherwise
   */
  toggleExercise(exerciseId: string, timestamp?: number): boolean;
  
  /**
   * Update a specific day in the current workout plan
   * @param weekId - The week identifier
   * @param updatedDay - The updated WorkoutDay
   */
  updateDayInPlan(weekId: string, updatedDay: WorkoutDay): void;
  
  /**
   * Move an exercise up or down within a day
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @param exerciseId - The exercise identifier
   * @param direction - Direction to move ('up' or 'down')
   */
  moveExercise(weekId: string, dayId: string, exerciseId: string, direction: 'up' | 'down'): void;
  
  /**
   * Replace an exercise with new exercise data
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @param oldExerciseId - The exercise to replace
   * @param newExerciseData - The new exercise data
   */
  replaceExerciseInPlan(
    weekId: string, 
    dayId: string, 
    oldExerciseId: string, 
    newExerciseData: Omit<Exercise, 'id' | 'isCompleted'>
  ): void;
  
  /**
   * Get workout history
   * @returns Array of WorkoutHistoryEntry
   */
  getHistory(): WorkoutHistoryEntry[];
  
  /**
   * Add a new entry to workout history
   * @param entry - The WorkoutHistoryEntry to add
   */
  addHistoryEntry(entry: WorkoutHistoryEntry): void;
  
  /**
   * Log a completed workout
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @param rpe - Rate of Perceived Exertion (1-10)
   * @param analysis - Optional workout analysis
   */
  logWorkout(weekId: string, dayId: string, rpe: number, analysis?: WorkoutAnalysis): void;
  
  /**
   * Check if a workout day is read-only (completed and logged)
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns True if read-only, false otherwise
   */
  isWorkoutReadOnly(weekId: string, dayId: string): boolean;
  
  /**
   * Check if an exercise can be modified
   * @param exerciseId - The exercise identifier
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns True if modifiable, false otherwise
   */
  canModifyExercise(exerciseId: string, weekId: string, dayId: string): boolean;
}