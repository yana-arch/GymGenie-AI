import { 
  SessionState, 
  SessionStateManager as ISessionStateManager,
  WorkoutAnalysis,
  SessionError,
  SessionStorageData 
} from '@/types';
import { SessionErrorHandler } from './sessionErrorHandler';
import { WorkoutSession } from './WorkoutSession';
import { SessionConflictDetector, SessionConflict } from './SessionConflictDetector';
import { SessionPersistenceManager } from './SessionPersistenceManager';
import { SessionRecoverySystem, StaleSessionInfo, RecoveryResult } from './SessionRecoverySystem';
import { SessionConflictResolver, ConflictResolutionResult, UserPromptConfig } from './SessionConflictResolver';

export class SessionStateManager implements ISessionStateManager {
  private sessions: Map<string, WorkoutSession> = new Map();
  private activeSessionKey: string | null = null;
  private errorHandler: SessionErrorHandler;
  private conflictDetector: SessionConflictDetector;
  private persistenceManager: SessionPersistenceManager;
  private recoverySystem: SessionRecoverySystem;
  private conflictResolver: SessionConflictResolver;
  private readonly STALE_SESSION_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private hasPendingStaleSessions: boolean = false;
  
  constructor() {
    this.errorHandler = new SessionErrorHandler();
    this.conflictDetector = new SessionConflictDetector();
    this.persistenceManager = new SessionPersistenceManager();
    this.recoverySystem = new SessionRecoverySystem();
    this.conflictResolver = new SessionConflictResolver();
    // Load existing sessions from storage on initialization
    this.loadFromStorageSync();
  }

  get currentSession(): WorkoutSession | null {
    if (!this.activeSessionKey) return null;
    return this.sessions.get(this.activeSessionKey) || null;
  }

  /**
   * Start a new workout session for the specified day with advanced conflict resolution
   */
  async startSession(weekId: string, dayId: string): Promise<void> {
    try {
      // Check for conflicts before starting
      const conflict = this.conflictDetector.detectConflicts(
        this.sessions,
        this.activeSessionKey,
        weekId,
        dayId
      );

      if (conflict) {
        // For synchronous operation, throw immediately for conflicts that require user input
        if (conflict.type === 'MULTIPLE_ACTIVE') {
          throw new Error(SessionError.MULTIPLE_ACTIVE_SESSIONS);
        }
        
        // Handle other conflicts synchronously where possible
        throw new Error(`SESSION_CONFLICT_REQUIRES_USER_INPUT: ${conflict.message}`);
      }

      const sessionKey = this.getSessionKey(weekId, dayId);
      
      // Check if session already exists and handle appropriately
      const existingSession = this.sessions.get(sessionKey);
      if (existingSession) {
        if (existingSession.isActive) {
          // Session is already active, just set it as current
          this.activeSessionKey = sessionKey;
          await this.saveToStorageAsync(); // Persist asynchronously
          return;
        }
        
        if (existingSession.isLogged) {
          const error = new Error(SessionError.INVALID_STATE_TRANSITION);
          this.errorHandler.handleStateTransitionError(existingSession.state, SessionState.ACTIVE, error);
          throw error;
        }
      }

      // Create new session using enhanced WorkoutSession class
      const newSession = WorkoutSession.create(weekId, dayId);
      
      this.sessions.set(sessionKey, newSession);
      this.activeSessionKey = sessionKey;
      await this.saveToStorageAsync(); // Persist changes asynchronously
      
      console.log(`Started new session: ${sessionKey}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Complete the current active session
   */
  async completeSession(): Promise<void> {
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

    try {
      // Use enhanced WorkoutSession's immutable update method
      const completedSession = session.complete();
      this.sessions.set(this.activeSessionKey, completedSession);
      await this.saveToStorageAsync(); // Persist changes asynchronously
      
      console.log(`Completed session: ${this.activeSessionKey}`);
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }

  /**
   * Log the completed session with RPE and analysis
   */
  async logSession(rpe: number, analysis?: WorkoutAnalysis): Promise<void> {
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

      // Use enhanced WorkoutSession's immutable log method
      const loggedSession = session.log(rpe, analysis);
      this.sessions.set(this.activeSessionKey, loggedSession);
      
      // Clear active session since it's now logged
      this.activeSessionKey = null;
      await this.saveToStorageAsync(); // Persist changes asynchronously
      
      console.log(`Logged session with RPE ${rpe}`);
    } catch (error) {
      console.error('Failed to log session:', error);
      throw error;
    }
  }

  /**
   * Abandon the current active session
   */
  async abandonSession(): Promise<void> {
    try {
      if (!this.activeSessionKey) {
        return; // Nothing to abandon
      }

      const session = this.sessions.get(this.activeSessionKey);
      if (!session) {
        this.activeSessionKey = null;
        await this.saveToStorageAsync(); // Persist the cleared active session
        return;
      }

      // Only allow abandoning active or completed sessions
      if (session.isLogged) {
        const error = new Error(SessionError.INVALID_STATE_TRANSITION);
        this.errorHandler.handleStateTransitionError(session.state, SessionState.INACTIVE, error);
        throw error;
      }

      // Remove the session entirely
      this.sessions.delete(this.activeSessionKey);
      this.activeSessionKey = null;
      await this.saveToStorageAsync(); // Persist changes
      
      console.log(`Abandoned session: ${session.sessionKey}`);
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
  async updateExerciseTimestamp(exerciseId: string, timestamp: number): Promise<void> {
    if (!this.activeSessionKey) {
      return; // No active session
    }

    const session = this.sessions.get(this.activeSessionKey);
    if (!session || !session.isActive) {
      return; // Session not active
    }

    try {
      // Use enhanced WorkoutSession's immutable update method
      const updatedSession = session.withExerciseTimestamp(exerciseId, timestamp);
      this.sessions.set(this.activeSessionKey, updatedSession);
      await this.saveToStorageAsync(); // Persist changes
    } catch (error) {
      console.error('Failed to update exercise timestamp:', error);
    }
  }

  /**
   * Remove exercise timestamp for the current active session
   */
  async removeExerciseTimestamp(exerciseId: string): Promise<void> {
    if (!this.activeSessionKey) {
      return; // No active session
    }

    const session = this.sessions.get(this.activeSessionKey);
    if (!session || !session.isActive) {
      return; // Session not active
    }

    try {
      // Use enhanced WorkoutSession's immutable update method
      const updatedSession = session.withoutExerciseTimestamp(exerciseId);
      this.sessions.set(this.activeSessionKey, updatedSession);
      await this.saveToStorageAsync(); // Persist changes
    } catch (error) {
      console.error('Failed to remove exercise timestamp:', error);
    }
  }

  /**
   * Validate state transition
   */
  private validateStateTransition(from: SessionState, to: SessionState): boolean {
    const validTransitions: Record<SessionState, SessionState[]> = {
      [SessionState.INACTIVE]: [SessionState.ACTIVE],
      [SessionState.ACTIVE]: [SessionState.PAUSED, SessionState.COMPLETED, SessionState.ABANDONED],
      [SessionState.PAUSED]: [SessionState.ACTIVE, SessionState.ABANDONED],
      [SessionState.COMPLETED]: [SessionState.LOGGED, SessionState.ACTIVE],
      [SessionState.LOGGED]: [],
      [SessionState.ABANDONED]: []
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
  async clearAllSessions(): Promise<void> {
    this.sessions.clear();
    this.activeSessionKey = null;
    await this.saveToStorageAsync(); // Persist the cleared state
  }

  /**
   * Resolve a session conflict
   */
  async resolveSessionConflict(conflict: SessionConflict, resolutionId: string): Promise<void> {
    try {
      const resolution = this.conflictDetector.resolveConflict(
        conflict,
        resolutionId,
        this.sessions,
        this.activeSessionKey
      );

      this.sessions = resolution.sessions;
      this.activeSessionKey = resolution.activeSessionKey;

      await this.saveToStorageAsync();

      // If resolution allows proceeding with new session, start it
      if (resolution.shouldProceedWithNewSession) {
        await this.startSession(
          conflict.newSessionRequest.weekId,
          conflict.newSessionRequest.dayId
        );
      }

      console.log(`Resolved conflict: ${conflict.type} with resolution: ${resolutionId}`);
    } catch (error) {
      console.error('Failed to resolve session conflict:', error);
      throw error;
    }
  }

  /**
   * Get conflict detector for external use
   */
  getConflictDetector(): SessionConflictDetector {
    return this.conflictDetector;
  }

  /**
   * Validate session consistency
   */
  validateSessionConsistency(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return this.conflictDetector.validateSessionConsistency(this.sessions, this.activeSessionKey);
  }

  /**
   * Save current session state to storage using enhanced persistence manager
   */
  saveToStorage(): void {
    try {
      // Use async version but don't wait for it in sync context
      this.saveToStorageAsync().catch(error => {
        console.error('Failed to save session data to storage:', error);
        this.errorHandler.handleStorageError('save', error as Error);
      });
    } catch (error) {
      console.error('Failed to save session data to storage:', error);
      this.errorHandler.handleStorageError('save', error as Error);
      throw new Error(SessionError.STORAGE_FAILURE);
    }
  }

  /**
   * Save current session state to storage asynchronously
   */
  async saveToStorageAsync(): Promise<void> {
    try {
      await this.persistenceManager.saveSessionData(this.sessions, this.activeSessionKey);
    } catch (error) {
      console.error('Failed to save session data to storage:', error);
      this.errorHandler.handleStorageError('save', error as Error);
      throw new Error(SessionError.STORAGE_FAILURE);
    }
  }

  /**
   * Load session state from storage synchronously (for constructor)
   */
  private loadFromStorageSync(): void {
    try {
      const rawData = localStorage.getItem('gymgenie_sessions');
      if (!rawData) {
        this.sessions = new Map();
        this.activeSessionKey = null;
        return;
      }

      const sessionData = JSON.parse(rawData);
      const sessions = new Map<string, WorkoutSession>();
      
      // Check if data is stale (older than 24 hours)
      const isStale = sessionData.lastActivity && 
        (Date.now() - sessionData.lastActivity) > this.STALE_SESSION_THRESHOLD;
      
      // Convert stored data back to WorkoutSession instances
      for (const [key, sessionDataItem] of Object.entries(sessionData.sessions)) {
        try {
          const session = WorkoutSession.fromStoredData(sessionDataItem);
          sessions.set(key, session);
        } catch (error) {
          console.warn(`Failed to restore session ${key}:`, error);
          // Skip corrupted individual sessions
        }
      }

      this.sessions = sessions;
      this.activeSessionKey = sessionData.activeSessionKey || null;

      if (isStale) {
        console.log('Detected stale session data, clearing sessions');
        // For stale sessions, clear the active session but keep the sessions for recovery
        this.activeSessionKey = null;
        this.hasPendingStaleSessions = true;
        // Emit stale session event for UI handling
        this.emitStaleSessionEvent(sessionData);
      }

      console.log(`Loaded ${sessions.size} sessions from storage`);
    } catch (error) {
      console.error('Failed to load session data from storage:', error);
      // Initialize with empty state on failure
      this.sessions = new Map();
      this.activeSessionKey = null;
    }
  }

  /**
   * Load session state from storage using enhanced persistence manager with recovery
   */
  async loadFromStorage(): Promise<void> {
    try {
      const { sessions, activeSessionKey } = await this.persistenceManager.loadSessionData();
      
      this.sessions = sessions;
      this.activeSessionKey = activeSessionKey;

      // Validate consistency after loading
      const validation = this.validateSessionConsistency();
      if (!validation.isValid) {
        console.warn('Session consistency issues detected after loading:', validation.errors);
        // Attempt to fix consistency issues
        await this.fixConsistencyIssues(validation);
      }

      // Check for stale sessions and attempt recovery
      await this.checkForStaleSessionsWithRecovery();

    } catch (error) {
      console.error('Failed to load session data from storage:', error);
      
      // Attempt recovery using the recovery system
      const recoveryResult = await this.attemptDataRecovery(error);
      
      if (recoveryResult.success) {
        this.sessions = recoveryResult.recoveredSessions;
        this.activeSessionKey = recoveryResult.activeSessionKey;
        console.log(`Recovery successful using method: ${recoveryResult.recoveryMethod}`);
        
        if (recoveryResult.warnings.length > 0) {
          console.warn('Recovery warnings:', recoveryResult.warnings);
        }
      } else {
        console.error('Recovery failed:', recoveryResult.errors);
        this.errorHandler.handleStorageError('load', error as Error);
        // Initialize with empty state on complete failure
        this.sessions = new Map();
        this.activeSessionKey = null;
      }
    }
  }

  /**
   * Attempt data recovery using the recovery system
   */
  private async attemptDataRecovery(originalError: any): Promise<RecoveryResult> {
    try {
      // Try to get any available data for recovery
      let corruptedData: any = null;
      let backupData: SessionStorageData | undefined;

      try {
        const rawData = localStorage.getItem('gymgenie_sessions');
        if (rawData) {
          corruptedData = JSON.parse(rawData);
        }
      } catch (parseError) {
        console.warn('Could not parse corrupted data:', parseError);
      }

      try {
        const backupRaw = localStorage.getItem('gymgenie_session_backup');
        if (backupRaw) {
          const backupInfo = JSON.parse(backupRaw);
          if (backupInfo.data) {
            backupData = JSON.parse(backupInfo.data);
          }
        }
      } catch (backupError) {
        console.warn('Could not load backup data:', backupError);
      }

      // Attempt recovery
      const recoveryResult = await this.recoverySystem.attemptAutoRecovery(corruptedData, backupData);
      
      // Log recovery attempt
      console.log('Recovery attempt completed:', {
        success: recoveryResult.success,
        method: recoveryResult.recoveryMethod,
        recoveredCount: recoveryResult.recoveredSessions.size,
        errors: recoveryResult.errors,
        warnings: recoveryResult.warnings
      });

      return recoveryResult;
    } catch (recoveryError) {
      console.error('Recovery system failed:', recoveryError);
      return {
        success: false,
        recoveredSessions: new Map(),
        activeSessionKey: null,
        errors: [`Recovery system error: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`],
        warnings: [],
        recoveryMethod: 'NONE'
      };
    }
  }

  /**
   * Check for stale sessions with enhanced recovery options
   */
  private async checkForStaleSessionsWithRecovery(): Promise<void> {
    const staleSessions = this.recoverySystem.detectStaleSessions(this.sessions);
    
    if (staleSessions.length > 0) {
      console.log(`Detected ${staleSessions.length} stale sessions`);
      
      // Create stale session data for UI
      const sessionsObject: Record<string, any> = {};
      for (const [key, session] of this.sessions.entries()) {
        sessionsObject[key] = session.toStorageObject();
      }
      
      const staleData: SessionStorageData = {
        sessions: sessionsObject,
        activeSessionKey: this.activeSessionKey,
        lastActivity: Math.min(...staleSessions.map(s => s.session.completedTime || s.session.startTime))
      };
      
      // Add recovery recommendations to the stale data
      (staleData as any).staleSessionsInfo = staleSessions;
      
      this.emitStaleSessionEvent(staleData);
    }
  }

  /**
   * Get stale session information with recovery recommendations
   */
  getStaleSessionsInfo(): StaleSessionInfo[] {
    return this.recoverySystem.detectStaleSessions(this.sessions);
  }

  /**
   * Recover specific stale session with recommended action
   */
  async recoverStaleSessionWithAction(
    sessionKey: string, 
    action: 'CONTINUE' | 'ABANDON' | 'LOG_AND_CONTINUE',
    rpe?: number,
    analysis?: WorkoutAnalysis
  ): Promise<void> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      throw new Error(`Session not found: ${sessionKey}`);
    }

    try {
      switch (action) {
        case 'CONTINUE':
          // Just update the session to mark it as recovered
          await this.saveToStorageAsync();
          console.log(`Continued stale session: ${sessionKey}`);
          break;

        case 'ABANDON':
          // Remove the stale session
          this.sessions.delete(sessionKey);
          if (this.activeSessionKey === sessionKey) {
            this.activeSessionKey = null;
          }
          await this.saveToStorageAsync();
          console.log(`Abandoned stale session: ${sessionKey}`);
          break;

        case 'LOG_AND_CONTINUE':
          // Log the completed session if it's in completed state
          if (session.isCompleted && rpe) {
            const loggedSession = session.log(rpe, analysis);
            this.sessions.set(sessionKey, loggedSession);
            
            // Clear active session if this was the active one
            if (this.activeSessionKey === sessionKey) {
              this.activeSessionKey = null;
            }
            
            await this.saveToStorageAsync();
            console.log(`Logged and recovered stale session: ${sessionKey}`);
          } else {
            throw new Error('Cannot log session: session must be completed and RPE must be provided');
          }
          break;

        default:
          throw new Error(`Unknown recovery action: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to recover stale session ${sessionKey}:`, error);
      throw error;
    }
  }

  /**
   * Get recovery system for external access
   */
  getRecoverySystem(): SessionRecoverySystem {
    return this.recoverySystem;
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    return this.recoverySystem.getRecoveryStats();
  }

  /**
   * Resolve session conflict with user choice
   */
  async resolveSessionConflictWithUserChoice(
    conflict: SessionConflict,
    resolutionId: string
  ): Promise<void> {
    try {
      const resolutionResult = await this.conflictResolver.resolveConflict(
        conflict,
        this.sessions,
        this.activeSessionKey,
        resolutionId
      );

      if (resolutionResult.resolved) {
        this.sessions = resolutionResult.newSessions;
        this.activeSessionKey = resolutionResult.newActiveSessionKey;
        await this.saveToStorageAsync();

        console.log(`Conflict resolved with user choice: ${resolutionId}`);
      } else {
        throw new Error('Failed to resolve conflict with user choice');
      }
    } catch (error) {
      console.error('Failed to resolve session conflict:', error);
      throw error;
    }
  }

  /**
   * Get conflict resolver for external access
   */
  getConflictResolver(): SessionConflictResolver {
    return this.conflictResolver;
  }

  /**
   * Update conflict resolution preferences
   */
  updateConflictResolutionPreferences(preferences: any): void {
    this.conflictResolver.updateUserPreferences(preferences);
  }

  /**
   * Get conflict resolution statistics
   */
  getConflictResolutionStats() {
    return this.conflictResolver.getResolutionStats();
  }

  private conflictResolutionCallbacks: Array<(conflict: SessionConflict, promptConfig: UserPromptConfig) => void> = [];
  private staleSessionCallbacks: Array<(data: SessionStorageData) => void> = [];
  private conflictCallbacks: Array<(conflict: SessionConflict) => void> = [];

  /**
   * Register callback for conflict resolution events (requires user input)
   */
  onConflictResolution(callback: (conflict: SessionConflict, promptConfig: UserPromptConfig) => void): () => void {
    this.conflictResolutionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.conflictResolutionCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictResolutionCallbacks.splice(index, 1);
      }
    };
  }

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
   * Register callback for session conflict events
   */
  onSessionConflict(callback: (conflict: SessionConflict) => void): () => void {
    this.conflictCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.conflictCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictCallbacks.splice(index, 1);
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
   * Emit conflict resolution event to registered callbacks
   */
  private emitConflictResolutionEvent(conflict: SessionConflict, promptConfig: UserPromptConfig): void {
    this.conflictResolutionCallbacks.forEach(callback => {
      try {
        callback(conflict, promptConfig);
      } catch (error) {
        console.error('Error in conflict resolution callback:', error);
      }
    });
  }

  /**
   * Check for stale sessions after loading (legacy method - use checkForStaleSessionsWithRecovery)
   */
  private async checkForStaleSessions(): Promise<void> {
    await this.checkForStaleSessionsWithRecovery();
  }

  /**
   * Fix consistency issues detected during validation
   */
  private async fixConsistencyIssues(validation: { errors: string[]; warnings: string[] }): Promise<void> {
    let hasChanges = false;

    // Fix multiple active sessions by keeping only the most recent
    const activeSessions = this.conflictDetector.getActiveSessions(this.sessions);
    if (activeSessions.length > 1) {
      console.log('Fixing multiple active sessions');
      const mostRecent = activeSessions.reduce((latest, current) => 
        current.startTime > latest.startTime ? current : latest
      );
      
      // Deactivate all but the most recent
      for (const session of activeSessions) {
        if (session.id !== mostRecent.id) {
          const updatedSession = session.withState(SessionState.INACTIVE);
          this.sessions.set(session.sessionKey, updatedSession);
          hasChanges = true;
        }
      }
      
      this.activeSessionKey = mostRecent.sessionKey;
    }

    // Fix orphaned active session key
    if (this.activeSessionKey && !this.sessions.has(this.activeSessionKey)) {
      console.log('Fixing orphaned active session key');
      this.activeSessionKey = null;
      hasChanges = true;
    }

    // Save changes if any were made
    if (hasChanges) {
      await this.saveToStorageAsync();
    }
  }

  /**
   * Detect if there are stale sessions that need user attention
   */
  hasStaleSession(): boolean {
    return Array.from(this.sessions.values()).some(session => session.isStale);
  }

  /**
   * Check if there are pending stale sessions that need user attention
   */
  hasPendingStaleSession(): boolean {
    return this.hasPendingStaleSessions;
  }

  /**
   * Recover from stale session (user choice to continue or reset)
   */
  async recoverStaleSession(shouldContinue: boolean): Promise<void> {
    try {
      if (shouldContinue) {
        // User wants to continue - restore the active session if there was one
        console.log('User chose to continue with stale sessions');
        // Find the first active session to restore
        for (const [key, session] of this.sessions.entries()) {
          if (session.isActive) {
            this.activeSessionKey = key;
            break;
          }
        }
        this.hasPendingStaleSessions = false;
        await this.saveToStorageAsync(); // This updates the lastActivity timestamp
      } else {
        // User wants to reset - clear everything
        console.log('User chose to reset stale sessions');
        this.hasPendingStaleSessions = false;
        await this.clearAllSessions();
      }
    } catch (error) {
      console.error('Failed to recover stale session:', error);
      this.errorHandler.handleStorageError('recover', error as Error);
      this.hasPendingStaleSessions = false;
      await this.clearAllSessions();
    }
  }
}