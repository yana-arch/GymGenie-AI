import { AppState, UserProfile, WorkoutPlan, WorkoutHistoryEntry, SessionStorageData, AiProviderConfig } from '@/types';

const KEYS = {
  USER_PROFILE: 'gymgenie_user',
  EQUIPMENT: 'gymgenie_equipment',
  WORKOUT_PLAN: 'gymgenie_plan',
  APP_STEP: 'gymgenie_step',
  WORKOUT_HISTORY: 'gymgenie_history',
  AI_CONFIG: 'gymgenie_ai_config',
  // Session management keys
  WORKOUT_SESSIONS: 'gymgenie_sessions',
  ACTIVE_SESSION: 'gymgenie_active_session',
  SESSION_RECOVERY: 'gymgenie_session_recovery'
};

export const StorageService = {
  saveUser: (user: UserProfile): void => {
    try {
      localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  getUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveEquipment: (equipment: string[]): void => {
    localStorage.setItem(KEYS.EQUIPMENT, JSON.stringify(equipment));
  },

  getEquipment: (): string[] => {
    const data = localStorage.getItem(KEYS.EQUIPMENT);
    return data ? JSON.parse(data) : [];
  },

  savePlan: (plan: WorkoutPlan): void => {
    localStorage.setItem(KEYS.WORKOUT_PLAN, JSON.stringify(plan));
  },

  getPlan: (): WorkoutPlan | null => {
    const data = localStorage.getItem(KEYS.WORKOUT_PLAN);
    return data ? JSON.parse(data) : null;
  },

  saveStep: (step: string): void => {
    localStorage.setItem(KEYS.APP_STEP, step);
  },

  getStep: (): string | null => {
    return localStorage.getItem(KEYS.APP_STEP);
  },

  saveHistory: (history: WorkoutHistoryEntry[]): void => {
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
  },

  getHistory: (): WorkoutHistoryEntry[] => {
    const data = localStorage.getItem(KEYS.WORKOUT_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  clearAll: (): void => {
    localStorage.clear();
  },

  saveAiConfig: (config: AiProviderConfig): void => {
    try {
      localStorage.setItem(KEYS.AI_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save AI config', e);
    }
  },

  getAiConfig: (): AiProviderConfig | null => {
    try {
      const data = localStorage.getItem(KEYS.AI_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // Session management methods
  saveSessionData: (sessionData: SessionStorageData): void => {
    try {
      localStorage.setItem(KEYS.WORKOUT_SESSIONS, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Failed to save session data', e);
      throw new Error('STORAGE_FAILURE');
    }
  },

  getSessionData: (): SessionStorageData | null => {
    try {
      const data = localStorage.getItem(KEYS.WORKOUT_SESSIONS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get session data', e);
      return null;
    }
  },

  saveActiveSessionKey: (sessionKey: string | null): void => {
    try {
      if (sessionKey) {
        localStorage.setItem(KEYS.ACTIVE_SESSION, sessionKey);
      } else {
        localStorage.removeItem(KEYS.ACTIVE_SESSION);
      }
    } catch (e) {
      console.error('Failed to save active session key', e);
    }
  },

  getActiveSessionKey: (): string | null => {
    try {
      return localStorage.getItem(KEYS.ACTIVE_SESSION);
    } catch (e) {
      console.error('Failed to get active session key', e);
      return null;
    }
  },

  saveSessionRecoveryData: (recoveryData: any): void => {
    try {
      localStorage.setItem(KEYS.SESSION_RECOVERY, JSON.stringify(recoveryData));
    } catch (e) {
      console.error('Failed to save session recovery data', e);
    }
  },

  getSessionRecoveryData: (): any => {
    try {
      const data = localStorage.getItem(KEYS.SESSION_RECOVERY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get session recovery data', e);
      return null;
    }
  },

  clearSessionData: (): void => {
    try {
      localStorage.removeItem(KEYS.WORKOUT_SESSIONS);
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
      localStorage.removeItem(KEYS.SESSION_RECOVERY);
    } catch (e) {
      console.error('Failed to clear session data', e);
    }
  },

  // Migration helper for existing workout data
  migrateWorkoutData: (): void => {
    try {
      // Check if there's existing workout data that needs migration
      const existingPlan = StorageService.getPlan();
      const existingHistory = StorageService.getHistory();
      
      if (existingPlan || existingHistory.length > 0) {
        console.log('Existing workout data found, migration may be needed');
        // For now, we'll just log this. In a full implementation,
        // we might need to migrate exercise completion states to sessions
      }
    } catch (e) {
      console.error('Failed to migrate workout data', e);
    }
  },

  // Check storage health
  checkStorageHealth: (): boolean => {
    try {
      const testKey = 'gymgenie_storage_test';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === testValue;
    } catch (e) {
      console.error('Storage health check failed', e);
      return false;
    }
  },

  // Get storage usage info
  getStorageInfo: (): { used: number; available: number; total: number } => {
    try {
      let used = 0;
      
      // Check if we're in a test environment with mock localStorage
      if (typeof localStorage.hasOwnProperty === 'function') {
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.startsWith('gymgenie_')) {
            used += localStorage[key].length + key.length;
          }
        }
      } else {
        // Fallback for mock localStorage in tests
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('gymgenie_')) {
            const value = localStorage.getItem(key);
            if (value) {
              used += value.length + key.length;
            }
          }
        }
      }
      
      // Estimate available storage (most browsers have ~5-10MB limit)
      const estimatedTotal = 5 * 1024 * 1024; // 5MB
      const available = Math.max(0, estimatedTotal - used);
      
      return {
        used,
        available,
        total: estimatedTotal
      };
    } catch (e) {
      console.error('Failed to get storage info', e);
      return { used: 0, available: 0, total: 0 };
    }
  }
};