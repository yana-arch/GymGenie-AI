import { StorageService } from '../src/services/storage/StorageService';
import { SessionState } from '../src/types';
import { workoutSessionFactory, mockLocalStorage, resetAllMocks } from '../src/test-utils';

// Setup mock localStorage
const mockStorage = mockLocalStorage();

describe('StorageService Session Management (with Test Infrastructure)', () => {
  beforeEach(() => {
    resetAllMocks();
    mockStorage.__store = {}; // Clear the mock store
  });

  describe('Session Data Management', () => {
    test('should save and retrieve session data using factory', () => {
      // Generate realistic test data using our factory
      const session = workoutSessionFactory.createActive();
      const sessionData: any = {
        sessions: {},
        activeSessionKey: null,
        lastActivity: Date.now()
      };

      StorageService.saveSessionData(sessionData);
      const retrieved = StorageService.getSessionData();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.activeSessionKey).toBe(`${session.weekId}-${session.dayId}`);
      expect(retrieved?.sessions[`${session.weekId}-${session.dayId}`].state).toBe(session.state);
      expect(retrieved?.sessions[`${session.weekId}-${session.dayId}`].id).toBe(session.id);
    });

    test('should handle multiple sessions from factory', () => {
      const sessions = workoutSessionFactory.createMany(3);
      const sessionData: any = {
        sessions: {},
        activeSessionKey: null,
        lastActivity: Date.now()
      };

      // Add all generated sessions to storage data
      sessions.forEach(session => {
        const key = `${session.weekId}-${session.dayId}`;
        sessionData.sessions[key] = {
          id: session.id,
          weekId: session.weekId,
          dayId: session.dayId,
          state: session.state,
          startTime: session.startTime,
          completedTime: session.completedTime,
          loggedTime: session.loggedTime,
          exerciseTimestamps: session.exerciseTimestamps,
          isReadOnly: session.isReadOnly
        };
      });

      // Set the first session as active
      const firstSession = sessions[0];
      sessionData.activeSessionKey = `${firstSession.weekId}-${firstSession.dayId}`;

      StorageService.saveSessionData(sessionData);
      const retrieved = StorageService.getSessionData();

      expect(retrieved).not.toBeNull();
      expect(Object.keys(retrieved!.sessions)).toHaveLength(3);
      expect(retrieved?.activeSessionKey).toBe(`${firstSession.weekId}-${firstSession.dayId}`);
    });

    test('should handle completed session with realistic data', () => {
      const completedSession = workoutSessionFactory.createCompleted();
      const sessionData = {
        sessions: {
          [`${completedSession.weekId}-${completedSession.dayId}`]: {
            id: completedSession.id,
            weekId: completedSession.weekId,
            dayId: completedSession.dayId,
            state: completedSession.state,
            startTime: completedSession.startTime,
            completedTime: completedSession.completedTime,
            loggedTime: completedSession.loggedTime,
            exerciseTimestamps: completedSession.exerciseTimestamps,
            isReadOnly: completedSession.isReadOnly
          }
        },
        activeSessionKey: null as any,
        lastActivity: completedSession.timestamp
      };

      StorageService.saveSessionData(sessionData);
      const retrieved = StorageService.getSessionData();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessions[`${completedSession.weekId}-${completedSession.dayId}`].state).toBe(SessionState.COMPLETED);
      expect(retrieved?.sessions[`${completedSession.weekId}-${completedSession.dayId}`].completedTime).toBe(completedSession.completedTime);
      expect(retrieved?.activeSessionKey).toBeNull();
    });

    test('should handle null session data', () => {
      const retrieved = StorageService.getSessionData();
      expect(retrieved).toBeNull();
    });

    test('should handle corrupted session data', () => {
      mockStorage.setItem('gymgenie_sessions', 'invalid json');
      const retrieved = StorageService.getSessionData();
      expect(retrieved).toBeNull();
    });
  });

  describe('Active Session Key Management', () => {
    test('should save and retrieve active session key', () => {
      const session = workoutSessionFactory.createActive();
      const sessionKey = `${session.weekId}-${session.dayId}`;
      
      StorageService.saveActiveSessionKey(sessionKey);
      const retrieved = StorageService.getActiveSessionKey();
      
      expect(retrieved).toBe(sessionKey);
    });

    test('should handle null active session key', () => {
      StorageService.saveActiveSessionKey(null);
      const retrieved = StorageService.getActiveSessionKey();
      expect(retrieved).toBeNull();
    });

    test('should remove active session key when set to null', () => {
      const session = workoutSessionFactory.createActive();
      const sessionKey = `${session.weekId}-${session.dayId}`;
      
      StorageService.saveActiveSessionKey(sessionKey);
      StorageService.saveActiveSessionKey(null);
      const retrieved = StorageService.getActiveSessionKey();
      
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Recovery Data', () => {
    test('should save and retrieve recovery data with factory timestamps', () => {
      const session = workoutSessionFactory.createActive();
      const recoveryData = {
        timestamp: session.timestamp,
        activeSessionKey: `${session.weekId}-${session.dayId}`,
        sessionCount: 1
      };

      StorageService.saveSessionRecoveryData(recoveryData);
      const retrieved = StorageService.getSessionRecoveryData();

      expect(retrieved).not.toBeNull();
      expect(retrieved.activeSessionKey).toBe(`${session.weekId}-${session.dayId}`);
      expect(retrieved.sessionCount).toBe(1);
      expect(retrieved.timestamp).toBe(session.timestamp);
    });

    test('should handle null recovery data', () => {
      const retrieved = StorageService.getSessionRecoveryData();
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Data Cleanup', () => {
    test('should clear all session data', () => {
      const sessions = workoutSessionFactory.createMany(2);
      const sessionData: any = {
        sessions: {},
        activeSessionKey: null,
        lastActivity: Date.now()
      };

      sessions.forEach(session => {
        const key = `${session.weekId}-${session.dayId}`;
        sessionData.sessions[key] = {
          id: session.id,
          weekId: session.weekId,
          dayId: session.dayId,
          state: session.state,
          startTime: session.startTime,
          completedTime: session.completedTime,
          loggedTime: session.loggedTime,
          exerciseTimestamps: session.exerciseTimestamps,
          isReadOnly: session.isReadOnly
        };
      });

      const firstSession = sessions[0];
      const sessionKey = `${firstSession.weekId}-${firstSession.dayId}`;

      StorageService.saveSessionData(sessionData);
      StorageService.saveActiveSessionKey(sessionKey);
      StorageService.saveSessionRecoveryData({ 
        timestamp: firstSession.timestamp,
        activeSessionKey: sessionKey,
        sessionCount: 2 
      });

      StorageService.clearSessionData();

      expect(StorageService.getSessionData()).toBeNull();
      expect(StorageService.getActiveSessionKey()).toBeNull();
      expect(StorageService.getSessionRecoveryData()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage failures gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = mockStorage.setItem;
      (mockStorage.setItem as any) = () => { throw new Error('Storage full'); };

      expect(() => {
        StorageService.saveSessionData({
          sessions: {},
        activeSessionKey: null as string | null,
          lastActivity: Date.now()
        });
      }).toThrow('STORAGE_FAILURE');

      // Restore original method
      mockStorage.setItem = originalSetItem;
    });

    test('should handle retrieval errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalGetItem = mockStorage.getItem;
      (mockStorage.getItem as any) = () => { throw new Error('Storage error'); };

      const result = StorageService.getSessionData();
      expect(result).toBeNull();

      // Restore original method
      mockStorage.getItem = originalGetItem;
    });
  });
});