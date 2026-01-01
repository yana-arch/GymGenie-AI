import { WorkoutSession } from './WorkoutSession';
import { SessionStorageData } from '@/types';
import { WorkoutSessionStorageObject, EnhancedWorkoutSession } from '@/types/enhanced';

export interface PersistenceConfig {
  storageKeys: {
    sessions: string;
    activeSession: string;
    recovery: string;
    backup: string;
  };
  backupInterval: number; // milliseconds
  maxBackups: number;
  compressionEnabled: boolean;
}

export interface BackupMetadata {
  timestamp: number;
  sessionCount: number;
  activeSessionKey: string | null;
  version: string;
}

export interface RecoveryData {
  sessions: SessionStorageData;
  backup: SessionStorageData | null;
  metadata: BackupMetadata;
  isCorrupted: boolean;
  corruptionDetails?: string[];
}

/**
 * Manages persistence of workout sessions with backup and recovery capabilities
 */
export class SessionPersistenceManager {
  private config: PersistenceConfig;
  private lastBackupTime: number = 0;
  private readonly VERSION = '1.0.0';

  constructor(config?: Partial<PersistenceConfig>) {
    this.config = {
      storageKeys: {
        sessions: 'gymgenie_sessions',
        activeSession: 'gymgenie_active_session',
        recovery: 'gymgenie_session_recovery',
        backup: 'gymgenie_session_backup'
      },
      backupInterval: 5 * 60 * 1000, // 5 minutes
      maxBackups: 5,
      compressionEnabled: false,
      ...config
    };
  }

  /**
   * Save session data with automatic backup
   */
  async saveSessionData(
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null
  ): Promise<void> {
    try {
      const sessionData: SessionStorageData = {
        sessions: Object.fromEntries(
          Array.from(sessions.entries()).map(([key, session]) => [
            key,
            session.toStorageObject() as WorkoutSessionStorageObject
          ])
        ),
        activeSessionKey,
        lastActivity: Date.now()
      };

      // Validate data before saving
      this.validateSessionData(sessionData);

      // Save main data
      const serializedData = this.serializeData(sessionData);
      localStorage.setItem(this.config.storageKeys.sessions, serializedData);

      // Create backup if needed
      await this.createBackupIfNeeded(sessionData);

      // Update recovery metadata
      await this.updateRecoveryMetadata(sessions.size, activeSessionKey);

      console.log(`Saved ${sessions.size} sessions to storage`);
    } catch (error) {
      console.error('Failed to save session data:', error);
      throw new Error(`Session persistence failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load session data with corruption detection and recovery
   */
  async loadSessionData(): Promise<{
    sessions: Map<string, WorkoutSession>; // Return concrete class instances
    activeSessionKey: string | null;
  }> {
    try {
      const recoveryData = await this.loadWithRecovery();
      
      if (recoveryData.isCorrupted) {
        console.warn('Corrupted session data detected, attempting recovery');
        return this.recoverFromCorruption(recoveryData);
      }

      const sessions = new Map<string, WorkoutSession>();
      
      // Convert stored data back to WorkoutSession instances
      for (const [key, sessionData] of Object.entries(recoveryData.sessions.sessions)) {
        try {
          const session = WorkoutSession.fromStoredData(sessionData);
          sessions.set(key, session);
        } catch (error) {
          console.warn(`Failed to restore session ${key}:`, error);
          // Skip corrupted individual sessions
        }
      }

      console.log(`Loaded ${sessions.size} sessions from storage`);
      
      return {
        sessions,
        activeSessionKey: recoveryData.sessions.activeSessionKey
      };
    } catch (error) {
      console.error('Failed to load session data:', error);
      // Return empty state on complete failure
      return {
        sessions: new Map(),
        activeSessionKey: null
      };
    }
  }

  /**
   * Load data with automatic recovery attempt
   */
  private async loadWithRecovery(): Promise<RecoveryData> {
    let primaryData: SessionStorageData | null = null;
    let backupData: SessionStorageData | null = null;
    let isCorrupted = false;
    const corruptionDetails: string[] = [];

    // Try to load primary data
    try {
      const primaryDataStr = localStorage.getItem(this.config.storageKeys.sessions);
      if (primaryDataStr) {
        primaryData = this.deserializeData(primaryDataStr);
        this.validateSessionData(primaryData);
      }
    } catch (error) {
      isCorrupted = true;
      corruptionDetails.push(`Primary data corruption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Try to load backup data if primary failed
    if (!primaryData) {
      try {
        const backupDataStr = localStorage.getItem(this.config.storageKeys.backup);
        if (backupDataStr) {
          const backupInfo = JSON.parse(backupDataStr);
          if (backupInfo.data) {
            backupData = this.deserializeData(backupInfo.data);
            this.validateSessionData(backupData);
          }
        }
      } catch (error) {
        corruptionDetails.push(`Backup data corruption: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Load recovery metadata
    const metadata = await this.loadRecoveryMetadata();

    return {
      sessions: primaryData || backupData || { sessions: {}, activeSessionKey: null, lastActivity: Date.now() },
      backup: backupData,
      metadata,
      isCorrupted,
      corruptionDetails
    };
  }

  /**
   * Recover from data corruption
   */
  private async recoverFromCorruption(recoveryData: RecoveryData): Promise<{
    sessions: Map<string, WorkoutSession>;
    activeSessionKey: string | null;
  }> {
    console.log('Attempting recovery from corruption:', recoveryData.corruptionDetails);

    const sessions = new Map<string, WorkoutSession>();
    let activeSessionKey: string | null = null;

    // Try to recover individual sessions
    const sessionEntries = Object.entries(recoveryData.sessions.sessions);
    let recoveredCount = 0;

    for (const [key, sessionData] of sessionEntries) {
      try {
        // Attempt to create session with validation
        const session = WorkoutSession.fromStoredData(sessionData);
        sessions.set(key, session);
        recoveredCount++;
      } catch (error) {
        console.warn(`Could not recover session ${key}:`, error);
        // Try to create a minimal valid session if possible
        try {
          if (sessionData && typeof sessionData === 'object' && 'weekId' in sessionData && 'dayId' in sessionData) {
            const minimalSession = WorkoutSession.create(sessionData.weekId, sessionData.dayId);
            sessions.set(key, minimalSession);
            recoveredCount++;
            console.log(`Created minimal session for ${key}`);
          }
        } catch (minimalError) {
          console.warn(`Could not create minimal session for ${key}:`, minimalError);
        }
      }
    }

    // Validate active session key
    if (recoveryData.sessions.activeSessionKey && sessions.has(recoveryData.sessions.activeSessionKey)) {
      const activeSession = sessions.get(recoveryData.sessions.activeSessionKey);
      if (activeSession && activeSession.isActive) {
        activeSessionKey = recoveryData.sessions.activeSessionKey;
      }
    }

    console.log(`Recovery completed: ${recoveredCount}/${sessionEntries.length} sessions recovered`);

    // Save the recovered data
    await this.saveSessionData(sessions, activeSessionKey);

    return { sessions, activeSessionKey };
  }

  /**
   * Create backup if enough time has passed
   */
  private async createBackupIfNeeded(sessionData: SessionStorageData): Promise<void> {
    const now = Date.now();
    if (now - this.lastBackupTime >= this.config.backupInterval) {
      await this.createBackup(sessionData);
      this.lastBackupTime = now;
    }
  }

  /**
   * Create a backup of session data
   */
  private async createBackup(sessionData: SessionStorageData): Promise<void> {
    try {
      const backupInfo = {
        timestamp: Date.now(),
        version: this.VERSION,
        data: this.serializeData(sessionData),
        metadata: {
          sessionCount: Object.keys(sessionData.sessions).length,
          activeSessionKey: sessionData.activeSessionKey
        }
      };

      localStorage.setItem(this.config.storageKeys.backup, JSON.stringify(backupInfo));
      console.log('Session backup created');
    } catch (error) {
      console.warn('Failed to create backup:', error);
      // Don't throw - backup failure shouldn't prevent normal operation
    }
  }

  /**
   * Update recovery metadata
   */
  private async updateRecoveryMetadata(sessionCount: number, activeSessionKey: string | null): Promise<void> {
    try {
      const metadata: BackupMetadata = {
        timestamp: Date.now(),
        sessionCount,
        activeSessionKey,
        version: this.VERSION
      };

      localStorage.setItem(this.config.storageKeys.recovery, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to update recovery metadata:', error);
    }
  }

  /**
   * Load recovery metadata
   */
  private async loadRecoveryMetadata(): Promise<BackupMetadata> {
    try {
      const metadataStr = localStorage.getItem(this.config.storageKeys.recovery);
      if (metadataStr) {
        return JSON.parse(metadataStr);
      }
    } catch (error) {
      console.warn('Failed to load recovery metadata:', error);
    }

    // Return default metadata
    return {
      timestamp: Date.now(),
      sessionCount: 0,
      activeSessionKey: null,
      version: this.VERSION
    };
  }

  /**
   * Validate session data structure
   */
  private validateSessionData(data: SessionStorageData): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid session data: not an object');
    }

    if (!data.sessions || typeof data.sessions !== 'object') {
      throw new Error('Invalid session data: missing or invalid sessions');
    }

    if (typeof data.lastActivity !== 'number') {
      throw new Error('Invalid session data: missing or invalid lastActivity');
    }

    if (data.activeSessionKey !== null && typeof data.activeSessionKey !== 'string') {
      throw new Error('Invalid session data: invalid activeSessionKey');
    }

    // Validate individual sessions
    for (const [key, sessionData] of Object.entries(data.sessions)) {
      if (!WorkoutSession.isValidSessionData(sessionData)) {
        throw new Error(`Invalid session data for key ${key}`);
      }
    }
  }

  /**
   * Serialize data with optional compression
   */
  private serializeData(data: SessionStorageData): string {
    const jsonString = JSON.stringify(data);
    
    if (this.config.compressionEnabled) {
      // Simple compression could be added here
      // For now, just return the JSON string
      return jsonString;
    }
    
    return jsonString;
  }

  /**
   * Deserialize data with optional decompression
   */
  private deserializeData(serializedData: string): SessionStorageData {
    if (this.config.compressionEnabled) {
      // Simple decompression could be added here
      // For now, just parse the JSON
      return JSON.parse(serializedData);
    }
    
    return JSON.parse(serializedData);
  }

  /**
   * Clear all stored session data
   */
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.config.storageKeys.sessions);
      localStorage.removeItem(this.config.storageKeys.activeSession);
      localStorage.removeItem(this.config.storageKeys.recovery);
      localStorage.removeItem(this.config.storageKeys.backup);
      
      this.lastBackupTime = 0;
      console.log('All session data cleared');
    } catch (error) {
      console.error('Failed to clear session data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalSize: number;
    sessionDataSize: number;
    backupSize: number;
    recoverySize: number;
  } {
    const getItemSize = (key: string): number => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };

    const sessionDataSize = getItemSize(this.config.storageKeys.sessions);
    const backupSize = getItemSize(this.config.storageKeys.backup);
    const recoverySize = getItemSize(this.config.storageKeys.recovery);

    return {
      totalSize: sessionDataSize + backupSize + recoverySize,
      sessionDataSize,
      backupSize,
      recoverySize
    };
  }

  /**
   * Check if storage is available and working
   */
  async testStorage(): Promise<boolean> {
    try {
      const testKey = 'gymgenie_storage_test';
      const testData = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      return retrieved.test === true;
    } catch (error) {
      console.error('Storage test failed:', error);
      return false;
    }
  }
}