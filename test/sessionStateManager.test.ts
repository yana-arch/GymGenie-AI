import { SessionStateManager } from '@/features/session/services/sessionStateManager';
import { SessionState, SessionError } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SessionStateManager', () => {
  let manager: SessionStateManager;

  beforeEach(() => {
    localStorageMock.clear();
    manager = new SessionStateManager();
  });

  describe('Session Lifecycle', () => {
    test('should start a new session', () => {
      manager.startSession('week1', 'day1');
      
      const session = manager.currentSession;
      expect(session).not.toBeNull();
      expect(session?.state).toBe(SessionState.ACTIVE);
      expect(session?.weekId).toBe('week1');
      expect(session?.dayId).toBe('day1');
      expect(session?.startTime).toBeDefined();
      expect(session?.isReadOnly).toBe(false);
    });

    test('should complete an active session', () => {
      manager.startSession('week1', 'day1');
      manager.completeSession();
      
      const session = manager.currentSession;
      expect(session?.state).toBe(SessionState.COMPLETED);
      expect(session?.completedTime).toBeDefined();
      expect(session?.isReadOnly).toBe(false);
    });

    test('should log a completed session', () => {
      manager.startSession('week1', 'day1');
      manager.completeSession();
      manager.logSession(8);
      
      const session = manager.getSessionForDay('week1', 'day1');
      expect(session?.state).toBe(SessionState.LOGGED);
      expect(session?.loggedTime).toBeDefined();
      expect(session?.isReadOnly).toBe(true);
      expect(manager.currentSession).toBeNull(); // Active session cleared after logging
    });

    test('should abandon an active session', () => {
      manager.startSession('week1', 'day1');
      manager.abandonSession();
      
      expect(manager.currentSession).toBeNull();
      expect(manager.getSessionForDay('week1', 'day1')).toBeNull();
    });
  });

  describe('Session State Validation', () => {
    test('should throw error when trying to complete non-active session', async () => {
      await expect(manager.completeSession()).rejects.toThrow(SessionError.SESSION_NOT_FOUND);
    });

    test('should throw error when trying to log non-completed session', async () => {
      await manager.startSession('week1', 'day1');
      await expect(manager.logSession(8)).rejects.toThrow('Cannot log session in state active');
    });

    test('should throw error when trying to start multiple active sessions', async () => {
      await manager.startSession('week1', 'day1');
      await expect(manager.startSession('week1', 'day2')).rejects.toThrow(SessionError.MULTIPLE_ACTIVE_SESSIONS);
    });

    test('should throw error for invalid RPE values', async () => {
      await manager.startSession('week1', 'day1');
      await manager.completeSession();
      
      await expect(manager.logSession(0)).rejects.toThrow('RPE must be between 1 and 10');
      await expect(manager.logSession(11)).rejects.toThrow('RPE must be between 1 and 10');
    });
  });

  describe('Session Query Methods', () => {
    test('should correctly identify active sessions', () => {
      expect(manager.isSessionActive('week1', 'day1')).toBe(false);
      
      manager.startSession('week1', 'day1');
      expect(manager.isSessionActive('week1', 'day1')).toBe(true);
      
      manager.completeSession();
      expect(manager.isSessionActive('week1', 'day1')).toBe(false);
    });

    test('should correctly identify read-only sessions', () => {
      expect(manager.isSessionReadOnly('week1', 'day1')).toBe(false);
      
      manager.startSession('week1', 'day1');
      expect(manager.isSessionReadOnly('week1', 'day1')).toBe(false);
      
      manager.completeSession();
      expect(manager.isSessionReadOnly('week1', 'day1')).toBe(false);
      
      manager.logSession(8);
      expect(manager.isSessionReadOnly('week1', 'day1')).toBe(true);
    });
  });

  describe('Exercise Timestamps', () => {
    test('should update exercise timestamps for active session', () => {
      manager.startSession('week1', 'day1');
      const timestamp = Date.now();
      
      manager.updateExerciseTimestamp('exercise1', timestamp);
      
      const session = manager.currentSession;
      expect(session?.exerciseTimestamps['exercise1']).toBe(timestamp);
    });

    test('should remove exercise timestamps for active session', () => {
      manager.startSession('week1', 'day1');
      manager.updateExerciseTimestamp('exercise1', Date.now());
      manager.removeExerciseTimestamp('exercise1');
      
      const session = manager.currentSession;
      expect(session?.exerciseTimestamps['exercise1']).toBeUndefined();
    });

    test('should not update timestamps for non-active sessions', () => {
      manager.updateExerciseTimestamp('exercise1', Date.now());
      expect(manager.currentSession).toBeNull();
    });
  });

  describe('Persistence', () => {
    test('should save and load session data', async () => {
      // Create a session
      await manager.startSession('week1', 'day1');
      await manager.updateExerciseTimestamp('exercise1', 12345);
      
      // Create a new manager instance (simulates app restart)
      const newManager = new SessionStateManager();
      
      // Should load the saved session
      expect(newManager.currentSession).not.toBeNull();
      expect(newManager.currentSession?.weekId).toBe('week1');
      expect(newManager.currentSession?.dayId).toBe('day1');
      expect(newManager.currentSession?.state).toBe(SessionState.ACTIVE);
      expect(newManager.currentSession?.exerciseTimestamps['exercise1']).toBe(12345);
    });

    test('should persist session state changes', async () => {
      await manager.startSession('week1', 'day1');
      await manager.completeSession();
      await manager.logSession(8);
      
      // Create new manager instance
      const newManager = new SessionStateManager();
      
      // Should load the logged session
      const session = newManager.getSessionForDay('week1', 'day1');
      expect(session?.state).toBe(SessionState.LOGGED);
      expect(session?.isReadOnly).toBe(true);
      expect(newManager.currentSession).toBeNull(); // No active session after logging
    });

    test('should handle corrupted storage data gracefully', () => {
      // Corrupt the storage
      localStorageMock.setItem('gymgenie_sessions', 'invalid json');
      
      // Should not throw and should start with clean state
      const newManager = new SessionStateManager();
      expect(newManager.currentSession).toBeNull();
      expect(newManager.getAllSessions().size).toBe(0);
    });

    test('should detect stale sessions', () => {
      // Create a session
      manager.startSession('week1', 'day1');
      
      // Manually modify the storage to simulate old data
      const staleData = {
        sessions: Object.fromEntries(manager.getAllSessions().entries()),
        activeSessionKey: 'week1-day1',
        lastActivity: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      localStorageMock.setItem('gymgenie_sessions', JSON.stringify(staleData));
      
      // Create new manager - should detect stale session
      const newManager = new SessionStateManager();
      expect(newManager.currentSession).toBeNull(); // Should clear stale session
    });

    test('should clear all sessions and persist', () => {
      manager.startSession('week1', 'day1');
      expect(manager.currentSession).not.toBeNull();
      
      manager.clearAllSessions();
      
      // Create new manager instance
      const newManager = new SessionStateManager();
      expect(newManager.currentSession).toBeNull();
      expect(newManager.getAllSessions().size).toBe(0);
    });
  });
});