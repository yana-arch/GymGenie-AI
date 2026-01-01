import { WorkoutSession } from './WorkoutSession';
import { SessionState } from '@/types';

export interface SessionConflict {
  type: 'MULTIPLE_ACTIVE' | 'DUPLICATE_SESSION' | 'STATE_CONFLICT';
  existingSession: WorkoutSession;
  newSessionRequest: {
    weekId: string;
    dayId: string;
  };
  message: string;
  resolutionOptions: ConflictResolutionOption[];
}

export interface ConflictResolutionOption {
  id: string;
  label: string;
  description: string;
  action: 'ABANDON_EXISTING' | 'ABANDON_NEW' | 'CONTINUE_EXISTING' | 'FORCE_NEW';
}

/**
 * Detects and manages session conflicts in the workout session system
 */
export class SessionConflictDetector {
  /**
   * Check for conflicts when starting a new session
   */
  detectConflicts(
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null,
    newWeekId: string,
    newDayId: string
  ): SessionConflict | null {
    const newSessionKey = `${newWeekId}-${newDayId}`;
    
    // Check for multiple active sessions
    const multipleActiveConflict = this.checkMultipleActiveSessions(
      sessions,
      activeSessionKey,
      newWeekId,
      newDayId
    );
    if (multipleActiveConflict) return multipleActiveConflict;

    // Check for duplicate session conflicts
    const duplicateSessionConflict = this.checkDuplicateSession(
      sessions,
      newWeekId,
      newDayId
    );
    if (duplicateSessionConflict) return duplicateSessionConflict;

    return null;
  }

  /**
   * Check for multiple active sessions conflict
   */
  private checkMultipleActiveSessions(
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null,
    newWeekId: string,
    newDayId: string
  ): SessionConflict | null {
    const newSessionKey = `${newWeekId}-${newDayId}`;
    
    // If there's an active session and it's not the same as the new one
    if (activeSessionKey && activeSessionKey !== newSessionKey) {
      const existingSession = sessions.get(activeSessionKey);
      if (existingSession && existingSession.isActive) {
        return {
          type: 'MULTIPLE_ACTIVE',
          existingSession,
          newSessionRequest: { weekId: newWeekId, dayId: newDayId },
          message: `You have an active session for ${existingSession.weekId}-${existingSession.dayId}. You can only have one active session at a time.`,
          resolutionOptions: [
            {
              id: 'continue_existing',
              label: 'Continue Existing Session',
              description: `Continue with your current session for ${existingSession.weekId}-${existingSession.dayId}`,
              action: 'CONTINUE_EXISTING'
            },
            {
              id: 'abandon_existing',
              label: 'Abandon Current Session',
              description: `Abandon your current session and start a new one for ${newWeekId}-${newDayId}`,
              action: 'ABANDON_EXISTING'
            }
          ]
        };
      }
    }

    return null;
  }

  /**
   * Check for duplicate session conflicts
   */
  private checkDuplicateSession(
    sessions: Map<string, WorkoutSession>,
    newWeekId: string,
    newDayId: string
  ): SessionConflict | null {
    const sessionKey = `${newWeekId}-${newDayId}`;
    const existingSession = sessions.get(sessionKey);

    if (existingSession) {
      // If session is already logged, cannot restart
      if (existingSession.isLogged) {
        return {
          type: 'STATE_CONFLICT',
          existingSession,
          newSessionRequest: { weekId: newWeekId, dayId: newDayId },
          message: `This workout has already been completed and logged. You cannot restart a logged session.`,
          resolutionOptions: [
            {
              id: 'abandon_new',
              label: 'View Completed Session',
              description: 'View the details of your completed workout',
              action: 'ABANDON_NEW'
            }
          ]
        };
      }

      // If session is completed but not logged
      if (existingSession.isCompleted) {
        return {
          type: 'STATE_CONFLICT',
          existingSession,
          newSessionRequest: { weekId: newWeekId, dayId: newDayId },
          message: `This workout is completed but not yet logged. You can log it or restart it.`,
          resolutionOptions: [
            {
              id: 'continue_existing',
              label: 'Log Completed Session',
              description: 'Log your completed workout with RPE and notes',
              action: 'CONTINUE_EXISTING'
            },
            {
              id: 'force_new',
              label: 'Restart Workout',
              description: 'Restart this workout from the beginning',
              action: 'FORCE_NEW'
            }
          ]
        };
      }

      // If session is active, just continue it
      if (existingSession.isActive) {
        return {
          type: 'DUPLICATE_SESSION',
          existingSession,
          newSessionRequest: { weekId: newWeekId, dayId: newDayId },
          message: `This workout session is already active. Continue where you left off.`,
          resolutionOptions: [
            {
              id: 'continue_existing',
              label: 'Continue Session',
              description: 'Continue your active workout session',
              action: 'CONTINUE_EXISTING'
            },
            {
              id: 'force_new',
              label: 'Restart Session',
              description: 'Restart this workout from the beginning',
              action: 'FORCE_NEW'
            }
          ]
        };
      }
    }

    return null;
  }

  /**
   * Resolve a session conflict based on user choice
   */
  resolveConflict(
    conflict: SessionConflict,
    resolutionId: string,
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null
  ): {
    sessions: Map<string, WorkoutSession>;
    activeSessionKey: string | null;
    shouldProceedWithNewSession: boolean;
  } {
    const resolution = conflict.resolutionOptions.find(opt => opt.id === resolutionId);
    if (!resolution) {
      throw new Error(`Invalid resolution option: ${resolutionId}`);
    }

    const newSessions = new Map(sessions);
    let newActiveSessionKey = activeSessionKey;
    let shouldProceedWithNewSession = false;

    switch (resolution.action) {
      case 'ABANDON_EXISTING':
        // Remove the existing active session
        if (activeSessionKey) {
          newSessions.delete(activeSessionKey);
          newActiveSessionKey = null;
        }
        shouldProceedWithNewSession = true;
        break;

      case 'ABANDON_NEW':
        // Do nothing, keep existing state
        shouldProceedWithNewSession = false;
        break;

      case 'CONTINUE_EXISTING':
        // Keep existing session active
        shouldProceedWithNewSession = false;
        break;

      case 'FORCE_NEW':
        // Remove existing session for the same day and proceed with new
        const newSessionKey = `${conflict.newSessionRequest.weekId}-${conflict.newSessionRequest.dayId}`;
        newSessions.delete(newSessionKey);
        
        // If the existing session was the active one, clear active key
        if (activeSessionKey === newSessionKey) {
          newActiveSessionKey = null;
        }
        
        shouldProceedWithNewSession = true;
        break;

      default:
        throw new Error(`Unknown resolution action: ${resolution.action}`);
    }

    return {
      sessions: newSessions,
      activeSessionKey: newActiveSessionKey,
      shouldProceedWithNewSession
    };
  }

  /**
   * Get conflict summary for logging/debugging
   */
  getConflictSummary(conflict: SessionConflict): string {
    const existing = conflict.existingSession;
    const newReq = conflict.newSessionRequest;
    
    return `${conflict.type}: Existing session ${existing.sessionKey} (${existing.state}) conflicts with new session request ${newReq.weekId}-${newReq.dayId}`;
  }

  /**
   * Check if a session can be safely started without conflicts
   */
  canStartSessionSafely(
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null,
    weekId: string,
    dayId: string
  ): boolean {
    return this.detectConflicts(sessions, activeSessionKey, weekId, dayId) === null;
  }

  /**
   * Get all active sessions (for debugging/monitoring)
   */
  getActiveSessions(sessions: Map<string, WorkoutSession>): WorkoutSession[] {
    return Array.from(sessions.values()).filter(session => session.isActive);
  }

  /**
   * Get sessions by state
   */
  getSessionsByState(sessions: Map<string, WorkoutSession>, state: SessionState): WorkoutSession[] {
    return Array.from(sessions.values()).filter(session => session.state === state);
  }

  /**
   * Validate session consistency across the entire session map
   */
  validateSessionConsistency(
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for multiple active sessions
    const activeSessions = this.getActiveSessions(sessions);
    if (activeSessions.length > 1) {
      errors.push(`Multiple active sessions detected: ${activeSessions.map(s => s.sessionKey).join(', ')}`);
    }

    // Check if active session key points to valid active session
    if (activeSessionKey) {
      const activeSession = sessions.get(activeSessionKey);
      if (!activeSession) {
        errors.push(`Active session key '${activeSessionKey}' points to non-existent session`);
      } else if (!activeSession.isActive) {
        errors.push(`Active session key '${activeSessionKey}' points to non-active session (${activeSession.state})`);
      }
    }

    // Check for orphaned active sessions
    if (!activeSessionKey && activeSessions.length > 0) {
      warnings.push(`Found ${activeSessions.length} active sessions but no active session key set`);
    }

    // Check for duplicate session keys
    const sessionKeys = new Set<string>();
    for (const [key, session] of sessions) {
      if (key !== session.sessionKey) {
        errors.push(`Session key mismatch: map key '${key}' vs session key '${session.sessionKey}'`);
      }
      
      if (sessionKeys.has(session.sessionKey)) {
        errors.push(`Duplicate session key detected: '${session.sessionKey}'`);
      }
      sessionKeys.add(session.sessionKey);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}