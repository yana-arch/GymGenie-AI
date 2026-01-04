import { WorkoutSession, SessionState, WorkoutAnalysis } from '@/types';

export interface ISessionService {
  /**
   * Start a new workout session for the specified week and day
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns Promise resolving to the created WorkoutSession
   * @throws Error if another session is active or invalid state transition
   */
  startSession(weekId: string, dayId: string): Promise<WorkoutSession>;
  
  /**
   * Complete the current active session
   * @returns Promise that resolves when session is completed
   * @throws Error if no active session or invalid state transition
   */
  completeSession(): Promise<void>;
  
  /**
   * Log the completed session with RPE and optional analysis
   * @param rpe - Rate of Perceived Exertion (1-10)
   * @param analysis - Optional workout analysis data
   * @returns Promise that resolves when session is logged
   * @throws Error if session not completed or invalid RPE
   */
  logSession(rpe: number, analysis?: WorkoutAnalysis): Promise<void>;
  
  /**
   * Abandon the current session (removes it completely)
   * @returns Promise that resolves when session is abandoned
   * @throws Error if trying to abandon a logged session
   */
  abandonSession(): Promise<void>;
  
  /**
   * Recover from a stale session
   * @param shouldContinue - Whether to continue the stale session or reset
   * @returns Promise that resolves when recovery is complete
   */
  recoverStaleSession(shouldContinue: boolean): Promise<void>;
  
  /**
   * Get the session for a specific week and day
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns The session if it exists, null otherwise
   */
  getSessionForDay(weekId: string, dayId: string): WorkoutSession | null;
  
  /**
   * Check if a session is active for the specified week and day
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns True if session is active, false otherwise
   */
  isSessionActive(weekId: string, dayId: string): boolean;
  
  /**
   * Check if a session is read-only (logged) for the specified week and day
   * @param weekId - The week identifier
   * @param dayId - The day identifier
   * @returns True if session is read-only, false otherwise
   */
  isSessionReadOnly(weekId: string, dayId: string): boolean;
  
  /**
   * Get the current active session
   * @returns The current session if active, null otherwise
   */
  getCurrentSession(): WorkoutSession | null;
  
  /**
   * Update exercise timestamp in the current session
   * @param exerciseId - The exercise identifier
   * @param timestamp - The timestamp to record
   */
  updateExerciseTimestamp(exerciseId: string, timestamp: number): void;
  
  /**
   * Remove exercise timestamp from the current session
   * @param exerciseId - The exercise identifier
   */
  removeExerciseTimestamp(exerciseId: string): void;
  
  /**
   * Clear all sessions (used for app reset)
   */
  clearAllSessions(): void;
}