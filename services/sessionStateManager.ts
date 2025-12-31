import { 
  WorkoutSession, 
  SessionState, 
  SessionStateManager as ISessionStateManager,
  WorkoutAnalysis,
  SessionError,
  SessionStorageData 
} from '../types';
import { SessionErrorHandler } from './sessionErrorHandler';

export class SessionStateManager implements ISessionStateManager {
  private sessions: Map<string, WorkoutSession> = new Map();
  private activeSessionKey: string | null = null;
  private errorHandler: SessionErrorHandler;
  private readonly STORAGE_KEYS = {
    SESSIONS: 'gymgenie_sessions',
    ACTIVE_SESSION: 'gymgenie_active_session',
    SESSION_RECOVERY: 'gymgenie_session_recovery'
  };
  private readonly STALE_SESSION_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  constructor() {
    this.errorHandler = new SessionErrorHandler();
    // Load existing sessions from storage on initialization
    this.loadFromStorage();
  }

  get currentSession(): WorkoutSession | null {
    if (!this.activeSessionKey) return null;
    return this.sessions.get(this.activeSessionKey) || null;
  }

  /**
   * Start a new workout session for the specified day
   */
  startSession(weekId: string, dayId: string): void {
    try {
      const sessionKey = this.getSessionKey(weekId, dayId);
      
      // Check if there's already an active session
      if (this.activeSessionKey && this.activeSessionKey !== sessionKey) {
        const error = new Error(SessionError.MULTIPLE_ACTIVE_SESSIONS);
        this.errorHandler.handleStateTransitionError(SessionState.INACTIVE, SessionState.ACTIVE, error);
        throw error;
      }

      // Check if session already exists and is not inactive
      const existingSession = this.sessions.get(sessionKey);
      if (existingSession && existingSession.state !== SessionState.INACTIVE) {
        // If session is already active, just return
        if (existingSession.state === SessionState.ACTIVE) {
          this.activeSessionKey = sessionKey;
          return;
        }
        // If session is completed or logged, throw error
        const error = new Error(SessionError.INVALID_STATE_TRANSITION);
        this.errorHandler.handleStateTransitionError(existingSession.state, SessionState.ACTIVE, error);
        throw error;
      }

      // Create new session
      const newSession: WorkoutSession = {
        id: crypto.randomUUID(),
        weekId,
        dayId,
        state: SessionState.ACTIVE,
        startTime: Date.now(),
        completedTime: null,
        loggedTime: null,
        exerciseTimestamps: {},
        isReadOnly: false
      };

      this.sessions.set(sessionKey, newSession);
      this.activeSessionKey = sessionKey;
      this.saveToStorage(); // Persist changes
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Complete the current active session
   */
  completeSession(): void {
    if (!this.activeSessionKey) {
      const error = new Error(SessionError.SESSION_NOT_FOUND);
      this.errorHandler.handleStateTransitionError(SessionState.INACTIVE, SessionState.COMPLETED, error);
      throw error;
    }

    const session = this.sessions.get(this.activeSessionKey);
    if (!session) {
      const error = new Error(SessionError.SESSION_NOT_FOUND);
      this.errorHandler.handleStateTransitionError(SessionState.INACTIVE, SessionState.COMPLETED, error);
      throw error;
    }

    if (session.state !== SessionState.ACTIVE) {
      const error = new Error(SessionError.INVALID_STATE_TRANSITION);
      this.errorHandler.handleStateTransitionError(session.state, SessionState.COMPLETED, error);
      throw error;
    }

    // Store original state for rollback
    const originalState = session.state;
    const originalCompletedTime = session.completedTime;
    const originalIsReadOnly = session.isReadOnly;

    try {
      // Transition to completed state
      session.state = SessionState.COMPLETED;
      session.completedTime = Date.now();
      session.isReadOnly = false; // Still editable until logged

      this.sessions.set(this.activeSessionKey, session);
      this.saveToStorage(); // Persist changes - this may throw
    } catch (error) {
      // Rollback changes on storage failure
      session.state = originalState;
      session.completedTime = originalCompletedTime;
      session.isReadOnly = originalIsReadOnly;
      this.sessions.set(this.activeSessionKey, session);
      
      console.error('Failed to complete session:', error);
      throw error; // Re-throw storage errors
    }
  }

  /**
   * Log the completed session with RPE and analysis
   */
  logSession(rpe: number, analysis?: WorkoutAnalysis): void {
    try {
      if (!this.activeSessionKey) {
        const error = new Error(SessionError.SESSION_NOT_FOUND);
        this.errorHandler.handleStateTransitionError(SessionState.INACTIVE, SessionState.LOGGED, error);
        throw error;
      }

      const session = this.sessions.get(this.activeSessionKey);
      if (!session) {
        const error = new Error(SessionError.SESSION_NOT_FOUND);
        this.errorHandler.handleStateTransitionError(SessionState.INACTIVE, SessionState.LOGGED, error);
        throw error;
      }

      if (session.state !== SessionState.COMPLETED) {
        const error = new Error(SessionError.INVALID_STATE_TRANSITION);
        this.errorHandler.handleStateTransitionError(session.state, SessionState.LOGGED, error);
        throw error;
      }

      // Validate RPE
      if (rpe < 1 || rpe > 10) {
        const error = new Error('RPE must be between 1 and 10');
        this.errorHandler.handleStateTransitionError(session.state, SessionState.LOGGED, error);
        throw error;
      }

      // Transition to logged state
      session.state = SessionState.LOGGED;
      session.loggedTime = Date.now();
      session.isReadOnly = true; // Now read-only

      this.sessions.set(this.activeSessionKey, session);
      
      // Clear active session since it's now logged
      this.activeSessionKey = null;
      this.saveToStorage(); // Persist changes
    } catch (error) {
      console.error('Failed to log session:', error);
      throw error;
    }
  }

  /**
   * Abandon the current active session
   */
  abandonSession(): void {
    try {
      if (!this.activeSessionKey) {
        return; // Nothing to abandon
      }

      const session = this.sessions.get(this.activeSessionKey);
      if (!session) {
        this.activeSessionKey = null;
        this.saveToStorage(); // Persist the cleared active session
        return;
      }

      // Only allow abandoning active or completed sessions
      if (session.state === SessionState.LOGGED) {
        const error = new Error(SessionError.INVALID_STATE_TRANSITION);
        this.errorHandler.handleStateTransitionError(session.state, SessionState.INACTIVE, error);
        throw error;
      }

      // Remove the session entirely
      this.sessions.delete(this.activeSessionKey);
      this.activeSessionKey = null;
      this.saveToStorage(); // Persist changes
    } catch (error) {
      console.error('Failed to abandon session:', error);
      // Don't re-throw for abandon - it should be safe to call
    }
  }

  /**
   * Get session for a specific day
   */
  getSessionForDay(weekId: string, dayId: string): WorkoutSession | null {
    const sessionKey = this.getSessionKey(weekId, dayId);
    return this.sessions.get(sessionKey) || null;
  }

  /**
   * Check if a session is active for the specified day
   */
  isSessionActive(weekId: string, dayId: string): boolean {
    const session = this.getSessionForDay(weekId, dayId);
    return session?.state === SessionState.ACTIVE || false;
  }

  /**
   * Check if a session is read-only for the specified day
   */
  isSessionReadOnly(weekId: string, dayId: string): boolean {
    const session = this.getSessionForDay(weekId, dayId);
    return session?.isReadOnly || false;
  }

  /**
   * Update exercise timestamp for the current active session
   */
  updateExerciseTimestamp(exerciseId: string, timestamp: number): void {
    if (!this.activeSessionKey) {
      return; // No active session
    }

    const session = this.sessions.get(this.activeSessionKey);
    if (!session || session.state !== SessionState.ACTIVE) {
      return; // Session not active
    }

    session.exerciseTimestamps[exerciseId] = timestamp;
    this.sessions.set(this.activeSessionKey, session);
    this.saveToStorage(); // Persist changes
  }

  /**
   * Remove exercise timestamp for the current active session
   */
  removeExerciseTimestamp(exerciseId: string): void {
    if (!this.activeSessionKey) {
      return; // No active session
    }

    const session = this.sessions.get(this.activeSessionKey);
    if (!session || session.state !== SessionState.ACTIVE) {
      return; // Session not active
    }

    delete session.exerciseTimestamps[exerciseId];
    this.sessions.set(this.activeSessionKey, session);
    this.saveToStorage(); // Persist changes
  }

  /**
   * Validate state transition
   */
  private validateStateTransition(from: SessionState, to: SessionState): boolean {
    const validTransitions: Record<SessionState, SessionState[]> = {
      [SessionState.INACTIVE]: [SessionState.ACTIVE],
      [SessionState.ACTIVE]: [SessionState.COMPLETED, SessionState.INACTIVE],
      [SessionState.COMPLETED]: [SessionState.LOGGED, SessionState.ACTIVE],
      [SessionState.LOGGED]: [] // No transitions from logged state
    };

    return validTransitions[from].includes(to);
  }

  /**
   * Generate session key for a specific day
   */
  private getSessionKey(weekId: string, dayId: string): string {
    return `${weekId}-${dayId}`;
  }

  /**
   * Get the error handler instance for external use
   */
  getErrorHandler(): SessionErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get all sessions (for debugging/testing)
   */
  getAllSessions(): Map<string, WorkoutSession> {
    return new Map(this.sessions);
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.activeSessionKey = null;
    this.saveToStorage(); // Persist the cleared state
  }

  /**
   * Save current session state to localStorage
   */
  saveToStorage(): void {
    try {
      const sessionData: SessionStorageData = {
        sessions: Object.fromEntries(this.sessions.entries()),
        activeSessionKey: this.activeSessionKey,
        lastActivity: Date.now()
      };

      console.log('About to save to localStorage...');
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(sessionData));
      console.log('Successfully saved to localStorage');
      
      // Save recovery data separately for error handling
      const recoveryData = {
        timestamp: Date.now(),
        activeSessionKey: this.activeSessionKey,
        sessionCount: this.sessions.size
      };
      localStorage.setItem(this.STORAGE_KEYS.SESSION_RECOVERY, JSON.stringify(recoveryData));
      
    } catch (error) {
      console.error('Failed to save session data to storage:', error);
      this.errorHandler.handleStorageError('save', error as Error);
      throw new Error(SessionError.STORAGE_FAILURE);
    }
  }

  /**
   * Load session state from localStorage
   */
  loadFromStorage(): void {
    try {
      const sessionDataStr = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (!sessionDataStr) {
        return; // No saved data
      }

      const sessionData: SessionStorageData = JSON.parse(sessionDataStr);
      
      // Validate the loaded data
      if (!this.validateSessionData(sessionData)) {
        console.warn('Invalid session data found, clearing storage');
        this.errorHandler.handleDataCorruption('unknown', sessionData);
        this.clearStorage();
        return;
      }

      // Check for stale sessions
      const now = Date.now();
      const timeSinceLastActivity = now - sessionData.lastActivity;
      
      if (timeSinceLastActivity > this.STALE_SESSION_THRESHOLD) {
        console.log('Stale session detected, prompting for recovery');
        this.handleStaleSession(sessionData);
        return;
      }

      // Restore sessions
      this.sessions = new Map(Object.entries(sessionData.sessions));
      this.activeSessionKey = sessionData.activeSessionKey;

      // Validate active session still exists
      if (this.activeSessionKey && !this.sessions.has(this.activeSessionKey)) {
        console.warn('Active session key references non-existent session, clearing');
        this.activeSessionKey = null;
        this.saveToStorage();
      }

    } catch (error) {
      console.error('Failed to load session data from storage:', error);
      this.errorHandler.handleStorageError('load', error as Error);
      this.clearStorage();
    }
  }

  /**
   * Handle stale session recovery
   */
  private handleStaleSession(staleData: SessionStorageData): void {
    // Store stale data for potential recovery
    this.staleSessionData = staleData;
    
    // Emit event for UI to show stale session modal
    this.emitStaleSessionEvent(staleData);
  }

  private staleSessionData: SessionStorageData | null = null;
  private staleSessionCallbacks: Array<(data: SessionStorageData) => void> = [];

  /**
   * Register callback for stale session events
   */
  onStaleSession(callback: (data: SessionStorageData) => void): () => void {
    this.staleSessionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.staleSessionCallbacks.indexOf(callback);
      if (index > -1) {
        this.staleSessionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit stale session event to registered callbacks
   */
  private emitStaleSessionEvent(data: SessionStorageData): void {
    this.staleSessionCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in stale session callback:', error);
      }
    });
  }

  /**
   * Detect if there are stale sessions that need user attention
   */
  hasStaleSession(): boolean {
    try {
      const sessionDataStr = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (!sessionDataStr) return false;

      const sessionData: SessionStorageData = JSON.parse(sessionDataStr);
      const now = Date.now();
      const timeSinceLastActivity = now - sessionData.lastActivity;
      
      return timeSinceLastActivity > this.STALE_SESSION_THRESHOLD;
    } catch {
      return false;
    }
  }

  /**
   * Recover from stale session (user choice to continue or reset)
   */
  recoverStaleSession(shouldContinue: boolean): void {
    try {
      if (!this.staleSessionData) {
        console.warn('No stale session data to recover');
        return;
      }

      if (shouldContinue) {
        // User wants to continue - load the stale data
        console.log('Recovering stale session data');
        this.sessions = new Map(Object.entries(this.staleSessionData.sessions));
        this.activeSessionKey = this.staleSessionData.activeSessionKey;
        
        // Validate recovered sessions
        this.validateRecoveredSessions();
        
        // Update last activity and save
        this.saveToStorage();
        
        // Clear stale data
        this.staleSessionData = null;
        
        console.log('Successfully recovered stale session');
      } else {
        // User wants to reset - clear everything
        console.log('User chose to reset stale session');
        this.clearStorage();
        this.staleSessionData = null;
      }
    } catch (error) {
      console.error('Failed to recover stale session:', error);
      this.errorHandler.handleStorageError('recover', error as Error);
      this.clearStorage();
      this.staleSessionData = null;
    }
  }

  /**
   * Validate recovered sessions and clean up invalid ones
   */
  private validateRecoveredSessions(): void {
    const validSessions = new Map<string, WorkoutSession>();
    
    for (const [key, session] of this.sessions.entries()) {
      if (this.validateSession(session)) {
        validSessions.set(key, session);
      } else {
        console.warn(`Removing invalid recovered session: ${key}`);
        this.errorHandler.handleDataCorruption((session as any).id || key, session);
      }
    }
    
    this.sessions = validSessions;
    
    // Validate active session key
    if (this.activeSessionKey && !this.sessions.has(this.activeSessionKey)) {
      console.warn('Active session key references non-existent session after recovery');
      this.activeSessionKey = null;
    }
  }

  /**
   * Check if there's pending stale session data
   */
  hasPendingStaleSession(): boolean {
    return this.staleSessionData !== null;
  }

  /**
   * Get stale session data for UI display
   */
  getStaleSessionData(): SessionStorageData | null {
    return this.staleSessionData;
  }

  /**
   * Clear all storage data
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(this.STORAGE_KEYS.SESSION_RECOVERY);
    } catch (error) {
      console.error('Failed to clear session storage:', error);
    }
  }

  /**
   * Validate session data structure
   */
  private validateSessionData(data: any): data is SessionStorageData {
    if (!data || typeof data !== 'object') return false;
    if (!data.sessions || typeof data.sessions !== 'object') return false;
    if (typeof data.lastActivity !== 'number') return false;
    if (data.activeSessionKey !== null && typeof data.activeSessionKey !== 'string') return false;

    // Validate each session
    for (const [key, session] of Object.entries(data.sessions)) {
      if (!this.validateSession(session)) return false;
    }

    return true;
  }

  /**
   * Validate individual session structure
   */
  private validateSession(session: any): session is WorkoutSession {
    if (!session || typeof session !== 'object') return false;
    if (typeof session.id !== 'string') return false;
    if (typeof session.weekId !== 'string') return false;
    if (typeof session.dayId !== 'string') return false;
    if (!Object.values(SessionState).includes(session.state)) return false;
    if (typeof session.isReadOnly !== 'boolean') return false;
    if (session.startTime !== null && typeof session.startTime !== 'number') return false;
    if (session.completedTime !== null && typeof session.completedTime !== 'number') return false;
    if (session.loggedTime !== null && typeof session.loggedTime !== 'number') return false;
    if (!session.exerciseTimestamps || typeof session.exerciseTimestamps !== 'object') return false;

    return true;
  }
}