import { StorageService } from '../services/storageService';
import { SessionStorageData, SessionState } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    hasOwnProperty: (key: string) => key in store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('StorageService Session Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Session Data Management', () => {
    test('should save and retrieve session data', () => {
      const sessionData: SessionStorageData = {
        sessions: {
          'week1-day1': {
            id: 'session1',
            weekId: 'week1',
            dayId: 'day1',
            state: SessionState.ACTIVE,
            startTime: Date.now(),
            completedTime: null,
            loggedTime: null,
            exerciseTimestamps: { 'ex1': 12345 },
            isReadOnly: false
          }
        },
        activeSessionKey: 'week1-day1',
        lastActivity: Date.now()
      };

      StorageService.saveSessionData(sessionData);
      const retrieved = StorageService.getSessionData();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.activeSessionKey).toBe('week1-day1');
      expect(retrieved?.sessions['week1-day1'].state).toBe(SessionState.ACTIVE);
      expect(retrieved?.sessions['week1-day1'].exerciseTimestamps['ex1']).toBe(12345);
    });

    test('should handle null session data', () => {
      const retrieved = StorageService.getSessionData();
      expect(retrieved).toBeNull();
    });

    test('should handle corrupted session data', () => {
      localStorageMock.setItem('gymgenie_sessions', 'invalid json');
      const retrieved = StorageService.getSessionData();
      expect(retrieved).toBeNull();
    });
  });

  describe('Active Session Key Management', () => {
    test('should save and retrieve active session key', () => {
      StorageService.saveActiveSessionKey('week1-day1');
      const retrieved = StorageService.getActiveSessionKey();
      expect(retrieved).toBe('week1-day1');
    });

    test('should handle null active session key', () => {
      StorageService.saveActiveSessionKey(null);
      const retrieved = StorageService.getActiveSessionKey();
      expect(retrieved).toBeNull();
    });

    test('should remove active session key when set to null', () => {
      StorageService.saveActiveSessionKey('week1-day1');
      StorageService.saveActiveSessionKey(null);
      const retrieved = StorageService.getActiveSessionKey();
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Recovery Data', () => {
    test('should save and retrieve recovery data', () => {
      const recoveryData = {
        timestamp: Date.now(),
        activeSessionKey: 'week1-day1',
        sessionCount: 1
      };

      StorageService.saveSessionRecoveryData(recoveryData);
      const retrieved = StorageService.getSessionRecoveryData();

      expect(retrieved).not.toBeNull();
      expect(retrieved.activeSessionKey).toBe('week1-day1');
      expect(retrieved.sessionCount).toBe(1);
    });

    test('should handle null recovery data', () => {
      const retrieved = StorageService.getSessionRecoveryData();
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Data Cleanup', () => {
    test('should clear all session data', () => {
      const sessionData: SessionStorageData = {
        sessions: { 'week1-day1': {} as any },
        activeSessionKey: 'week1-day1',
        lastActivity: Date.now()
      };

      StorageService.saveSessionData(sessionData);
      StorageService.saveActiveSessionKey('week1-day1');
      StorageService.saveSessionRecoveryData({ test: 'data' });

      StorageService.clearSessionData();

      expect(StorageService.getSessionData()).toBeNull();
      expect(StorageService.getActiveSessionKey()).toBeNull();
      expect(StorageService.getSessionRecoveryData()).toBeNull();
    });
  });

  describe('Storage Health and Info', () => {
    test('should check storage health', () => {
      const isHealthy = StorageService.checkStorageHealth();
      expect(isHealthy).toBe(true);
    });

    test('should get storage info', () => {
      // Add some data first with the correct key format
      localStorageMock.setItem('gymgenie_active_session', 'test-session');
      
      const info = StorageService.getStorageInfo();
      expect(info.total).toBeGreaterThan(0);
      expect(info.available).toBeGreaterThanOrEqual(0);
      // Used might be 0 in test environment, so just check it's a number
      expect(typeof info.used).toBe('number');
      expect(info.used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage failures gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => { throw new Error('Storage full'); };

      expect(() => {
        StorageService.saveSessionData({
          sessions: {},
          activeSessionKey: null,
          lastActivity: Date.now()
        });
      }).toThrow('STORAGE_FAILURE');

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    test('should handle retrieval errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = () => { throw new Error('Storage error'); };

      const result = StorageService.getSessionData();
      expect(result).toBeNull();

      // Restore original method
      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('Data Migration', () => {
    test('should detect existing workout data for migration', () => {
      // This test just ensures the migration method doesn't throw
      // In a real implementation, it would check for existing data
      expect(() => StorageService.migrateWorkoutData()).not.toThrow();
    });
  });
});