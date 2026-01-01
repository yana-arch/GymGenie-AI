import { WorkoutSession } from './WorkoutSession';
import { SessionState, SessionStorageData, WorkoutAnalysis } from '@/types';
import { SessionErrorHandler } from './sessionErrorHandler';

export interface RecoveryOptions {
  autoRecoveryEnabled: boolean;
  staleThresholdHours: number;
  maxRecoveryAttempts: number;
  backupRetentionDays: number;
}

export interface RecoveryResult {
  success: boolean;
  recoveredSessions: Map<string, WorkoutSession>;
  activeSessionKey: string | null;
  errors: string[];
  warnings: string[];
  recoveryMethod: 'AUTO' | 'MANUAL' | 'BACKUP' | 'NONE';
}

export interface StaleSessionInfo {
  session: WorkoutSession;
  staleDurationHours: number;
  lastActivity: Date;
  canRecover: boolean;
  recommendedAction: 'CONTINUE' | 'ABANDON' | 'LOG_AND_CONTINUE';
}

export interface DataCorruptionInfo {
  corruptedKeys: string[];
  corruptionType: 'PARTIAL' | 'COMPLETE' | 'SCHEMA_MISMATCH';
  recoverableData: Record<string, any>;
  totalLoss: boolean;
}

/**
 * Comprehensive session recovery system with stale session detection,
 * data corruption recovery, and automatic backup restoration
 */
export class SessionRecoverySystem {
  private errorHandler: SessionErrorHandler;
  private options: RecoveryOptions;
  private readonly STORAGE_KEYS = {
    RECOVERY_LOG: 'gymgenie_recovery_log',
    BACKUP_METADATA: 'gymgenie_backup_metadata',
    CORRUPTION_REPORT: 'gymgenie_corruption_report'
  };

  constructor(options?: Partial<RecoveryOptions>) {
    this.errorHandler = new SessionErrorHandler();
    this.options = {
      autoRecoveryEnabled: true,
      staleThresholdHours: 24,
      maxRecoveryAttempts: 3,
      backupRetentionDays: 7,
      ...options
    };
  }

  /**
   * Detect stale sessions and provide recovery recommendations
   */
  detectStaleSessions(sessions: Map<string, WorkoutSession>): StaleSessionInfo[] {
    const now = Date.now();
    const staleThreshold = this.options.staleThresholdHours * 60 * 60 * 1000;
    const staleSessions: StaleSessionInfo[] = [];

    for (const session of sessions.values()) {
      const lastActivity = session.completedTime || session.startTime;
      const staleDuration = now - lastActivity;

      if (staleDuration > staleThreshold) {
        const staleDurationHours = staleDuration / (60 * 60 * 1000);
        
        staleSessions.push({
          session,
          staleDurationHours,
          lastActivity: new Date(lastActivity),
          canRecover: this.canRecoverSession(session),
          recommendedAction: this.getRecommendedAction(session, staleDurationHours)
        });
      }
    }

    return staleSessions.sort((a, b) => b.staleDurationHours - a.staleDurationHours);
  }

  /**
   * Attempt automatic recovery of session data
   */
  async attemptAutoRecovery(
    corruptedData: any,
    backupData?: SessionStorageData
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      recoveredSessions: new Map(),
      activeSessionKey: null,
      errors: [],
      warnings: [],
      recoveryMethod: 'NONE'
    };

    try {
      // Log recovery attempt
      await this.logRecoveryAttempt('AUTO', corruptedData);

      // Try primary data recovery first
      const primaryRecovery = await this.recoverFromPrimaryData(corruptedData);
      if (primaryRecovery.success) {
        result.recoveredSessions = primaryRecovery.recoveredSessions;
        result.activeSessionKey = primaryRecovery.activeSessionKey;
        result.success = true;
        result.recoveryMethod = 'AUTO';
        result.warnings = primaryRecovery.warnings;
        return result;
      }

      result.errors.push(...primaryRecovery.errors);

      // Try backup recovery if primary failed
      if (backupData) {
        const backupRecovery = await this.recoverFromBackup(backupData);
        if (backupRecovery.success) {
          result.recoveredSessions = backupRecovery.recoveredSessions;
          result.activeSessionKey = backupRecovery.activeSessionKey;
          result.success = true;
          result.recoveryMethod = 'BACKUP';
          result.warnings = backupRecovery.warnings;
          result.warnings.push('Recovered from backup data - some recent changes may be lost');
          return result;
        }

        result.errors.push(...backupRecovery.errors);
      }

      // Try partial recovery as last resort
      const partialRecovery = await this.attemptPartialRecovery(corruptedData);
      if (partialRecovery.success) {
        result.recoveredSessions = partialRecovery.recoveredSessions;
        result.activeSessionKey = partialRecovery.activeSessionKey;
        result.success = true;
        result.recoveryMethod = 'MANUAL';
        result.warnings = partialRecovery.warnings;
        result.warnings.push('Partial recovery completed - some data may be incomplete');
        return result;
      }

      result.errors.push(...partialRecovery.errors);
      result.errors.push('All recovery methods failed');

    } catch (error) {
      result.errors.push(`Recovery system error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Recover sessions from primary data with corruption handling
   */
  private async recoverFromPrimaryData(data: any): Promise<{
    success: boolean;
    recoveredSessions: Map<string, WorkoutSession>;
    activeSessionKey: string | null;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      success: false,
      recoveredSessions: new Map<string, WorkoutSession>(),
      activeSessionKey: null as string | null,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      if (!data || typeof data !== 'object') {
        result.errors.push('Primary data is not a valid object');
        return result;
      }

      // Validate basic structure
      if (!data.sessions || typeof data.sessions !== 'object') {
        result.errors.push('Sessions data is missing or invalid');
        return result;
      }

      // Attempt to recover individual sessions
      let recoveredCount = 0;
      const totalSessions = Object.keys(data.sessions).length;

      for (const [key, sessionData] of Object.entries(data.sessions)) {
        try {
          // Validate and create session
          if (WorkoutSession.isValidSessionData(sessionData)) {
            const session = WorkoutSession.fromStoredData(sessionData);
            result.recoveredSessions.set(key, session);
            recoveredCount++;
          } else {
            // Try to repair session data
            const repairedSession = await this.repairSessionData(key, sessionData);
            if (repairedSession) {
              result.recoveredSessions.set(key, repairedSession);
              recoveredCount++;
              result.warnings.push(`Repaired corrupted session: ${key}`);
            } else {
              result.warnings.push(`Could not recover session: ${key}`);
            }
          }
        } catch (error) {
          result.warnings.push(`Failed to process session ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Validate active session key
      if (data.activeSessionKey && typeof data.activeSessionKey === 'string') {
        if (result.recoveredSessions.has(data.activeSessionKey)) {
          const activeSession = result.recoveredSessions.get(data.activeSessionKey);
          if (activeSession && activeSession.isActive) {
            result.activeSessionKey = data.activeSessionKey;
          } else {
            result.warnings.push('Active session key points to non-active session');
          }
        } else {
          result.warnings.push('Active session key points to non-existent session');
        }
      }

      result.success = recoveredCount > 0;
      
      if (recoveredCount < totalSessions) {
        result.warnings.push(`Recovered ${recoveredCount}/${totalSessions} sessions`);
      }

    } catch (error) {
      result.errors.push(`Primary recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Recover sessions from backup data
   */
  private async recoverFromBackup(backupData: SessionStorageData): Promise<{
    success: boolean;
    recoveredSessions: Map<string, WorkoutSession>;
    activeSessionKey: string | null;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      success: false,
      recoveredSessions: new Map<string, WorkoutSession>(),
      activeSessionKey: null as string | null,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Use the same recovery logic as primary data
      const primaryResult = await this.recoverFromPrimaryData(backupData);
      
      result.recoveredSessions = primaryResult.recoveredSessions;
      result.activeSessionKey = primaryResult.activeSessionKey;
      result.success = primaryResult.success;
      result.errors = primaryResult.errors;
      result.warnings = primaryResult.warnings;

      if (result.success) {
        result.warnings.push('Successfully recovered from backup data');
      }

    } catch (error) {
      result.errors.push(`Backup recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Attempt partial recovery from severely corrupted data
   */
  private async attemptPartialRecovery(data: any): Promise<{
    success: boolean;
    recoveredSessions: Map<string, WorkoutSession>;
    activeSessionKey: string | null;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      success: false,
      recoveredSessions: new Map<string, WorkoutSession>(),
      activeSessionKey: null as string | null,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // Try to extract any recoverable session-like objects
      const potentialSessions = this.extractPotentialSessions(data);
      
      for (const [key, sessionLike] of potentialSessions) {
        try {
          const minimalSession = await this.createMinimalSession(sessionLike);
          if (minimalSession) {
            result.recoveredSessions.set(key, minimalSession);
            result.warnings.push(`Created minimal session from corrupted data: ${key}`);
          }
        } catch (error) {
          result.warnings.push(`Could not create minimal session for ${key}`);
        }
      }

      result.success = result.recoveredSessions.size > 0;

    } catch (error) {
      result.errors.push(`Partial recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Repair corrupted session data
   */
  private async repairSessionData(key: string, sessionData: any): Promise<WorkoutSession | null> {
    try {
      // Create a template for missing fields
      const template = {
        id: sessionData.id || crypto.randomUUID(),
        weekId: sessionData.weekId || 'unknown',
        dayId: sessionData.dayId || 'unknown',
        state: sessionData.state || SessionState.INACTIVE,
        startTime: sessionData.startTime || Date.now(),
        completedTime: sessionData.completedTime || null,
        loggedTime: sessionData.loggedTime || null,
        exerciseTimestamps: sessionData.exerciseTimestamps || {},
        isReadOnly: sessionData.isReadOnly || false,
        rpe: sessionData.rpe,
        analysis: sessionData.analysis
      };

      // Validate repaired data
      if (WorkoutSession.isValidSessionData(template)) {
        return WorkoutSession.fromStoredData(template);
      }

      return null;
    } catch (error) {
      console.warn(`Failed to repair session data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Extract potential session objects from corrupted data
   */
  private extractPotentialSessions(data: any): Map<string, any> {
    const potentialSessions = new Map<string, any>();

    try {
      // Look for session-like objects in various places
      if (data && typeof data === 'object') {
        // Check direct sessions property
        if (data.sessions && typeof data.sessions === 'object') {
          for (const [key, value] of Object.entries(data.sessions)) {
            if (value && typeof value === 'object') {
              potentialSessions.set(key, value);
            }
          }
        }

        // Check for session-like objects at root level
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 
              (value as any).weekId && (value as any).dayId) {
            potentialSessions.set(key, value);
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting potential sessions:', error);
    }

    return potentialSessions;
  }

  /**
   * Create minimal session from partial data
   */
  private async createMinimalSession(sessionLike: any): Promise<WorkoutSession | null> {
    try {
      if (!sessionLike.weekId || !sessionLike.dayId) {
        return null;
      }

      // Create a minimal valid session
      return WorkoutSession.create(sessionLike.weekId, sessionLike.dayId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a session can be recovered
   */
  private canRecoverSession(session: WorkoutSession): boolean {
    // Sessions can be recovered unless they are corrupted beyond repair
    try {
      // Basic validation - if we can access these properties, session is recoverable
      return !!(session.id && session.weekId && session.dayId && session.state);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recommended action for stale session
   */
  private getRecommendedAction(
    session: WorkoutSession, 
    staleDurationHours: number
  ): 'CONTINUE' | 'ABANDON' | 'LOG_AND_CONTINUE' {
    // If session is completed but not logged, recommend logging
    if (session.isCompleted) {
      return 'LOG_AND_CONTINUE';
    }

    // If session is very old (more than 7 days), recommend abandoning
    if (staleDurationHours > 168) { // 7 days
      return 'ABANDON';
    }

    // If session is active or recently completed, recommend continuing
    if (session.isActive || staleDurationHours < 48) { // 2 days
      return 'CONTINUE';
    }

    // Default to abandoning for old inactive sessions
    return 'ABANDON';
  }

  /**
   * Log recovery attempt for debugging and monitoring
   */
  private async logRecoveryAttempt(method: string, data: any): Promise<void> {
    try {
      const logEntry = {
        timestamp: Date.now(),
        method,
        dataType: typeof data,
        hasData: !!data,
        attempt: this.getRecoveryAttemptCount() + 1
      };

      const existingLog = localStorage.getItem(this.STORAGE_KEYS.RECOVERY_LOG);
      const log = existingLog ? JSON.parse(existingLog) : [];
      
      log.push(logEntry);
      
      // Keep only recent entries
      const maxEntries = 50;
      if (log.length > maxEntries) {
        log.splice(0, log.length - maxEntries);
      }

      localStorage.setItem(this.STORAGE_KEYS.RECOVERY_LOG, JSON.stringify(log));
    } catch (error) {
      console.warn('Failed to log recovery attempt:', error);
    }
  }

  /**
   * Get current recovery attempt count
   */
  private getRecoveryAttemptCount(): number {
    try {
      const logStr = localStorage.getItem(this.STORAGE_KEYS.RECOVERY_LOG);
      if (!logStr) return 0;

      const log = JSON.parse(logStr);
      const recentAttempts = log.filter((entry: any) => 
        Date.now() - entry.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      return recentAttempts.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Analyze data corruption and provide detailed report
   */
  analyzeDataCorruption(data: any): DataCorruptionInfo {
    const info: DataCorruptionInfo = {
      corruptedKeys: [],
      corruptionType: 'COMPLETE',
      recoverableData: {},
      totalLoss: true
    };

    try {
      if (!data) {
        info.corruptionType = 'COMPLETE';
        return info;
      }

      if (typeof data !== 'object') {
        info.corruptionType = 'SCHEMA_MISMATCH';
        return info;
      }

      // Check for partial corruption
      let hasValidData = false;
      let hasCorruptedData = false;

      if (data.sessions && typeof data.sessions === 'object') {
        for (const [key, sessionData] of Object.entries(data.sessions)) {
          if (WorkoutSession.isValidSessionData(sessionData)) {
            info.recoverableData[key] = sessionData;
            hasValidData = true;
          } else {
            info.corruptedKeys.push(key);
            hasCorruptedData = true;
          }
        }
      }

      if (hasValidData && hasCorruptedData) {
        info.corruptionType = 'PARTIAL';
        info.totalLoss = false;
      } else if (hasValidData) {
        info.corruptionType = 'PARTIAL';
        info.totalLoss = false;
      } else {
        info.corruptionType = 'COMPLETE';
        info.totalLoss = true;
      }

    } catch (error) {
      info.corruptionType = 'COMPLETE';
      info.totalLoss = true;
    }

    return info;
  }

  /**
   * Get recovery statistics for monitoring
   */
  getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    lastRecoveryTime: number | null;
    averageRecoveryTime: number;
  } {
    try {
      const logStr = localStorage.getItem(this.STORAGE_KEYS.RECOVERY_LOG);
      if (!logStr) {
        return {
          totalAttempts: 0,
          successfulRecoveries: 0,
          lastRecoveryTime: null,
          averageRecoveryTime: 0
        };
      }

      const log = JSON.parse(logStr);
      const totalAttempts = log.length;
      const successfulRecoveries = log.filter((entry: any) => entry.success).length;
      const lastRecoveryTime = log.length > 0 ? log[log.length - 1].timestamp : null;

      // Calculate average recovery time (simplified)
      const averageRecoveryTime = totalAttempts > 0 ? 
        log.reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0) / totalAttempts : 0;

      return {
        totalAttempts,
        successfulRecoveries,
        lastRecoveryTime,
        averageRecoveryTime
      };
    } catch (error) {
      return {
        totalAttempts: 0,
        successfulRecoveries: 0,
        lastRecoveryTime: null,
        averageRecoveryTime: 0
      };
    }
  }

  /**
   * Clear recovery logs (for maintenance)
   */
  clearRecoveryLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.RECOVERY_LOG);
      localStorage.removeItem(this.STORAGE_KEYS.CORRUPTION_REPORT);
    } catch (error) {
      console.warn('Failed to clear recovery logs:', error);
    }
  }
}