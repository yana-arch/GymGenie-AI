import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionStateManager } from '../../services/sessionStateManager';
import { SessionState } from '../../types';

describe('Session Workflow Integration Tests', () => {
  let sessionManager: SessionStateManager;
  const mockWeekId = 'week-1';
  const mockDayId = 'day-1';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionManager = new SessionStateManager();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Complete User Workflow: Start to Finish', () => {
    it('should handle complete workout session lifecycle', () => {
      // 1. Start session
      expect(() => sessionManager.startSession(mockWeekId, mockDayId)).not.toThrow();
      
      const session = sessionManager.currentSession;
      expect(session).toBeTruthy();
      expect(session?.state).toBe(SessionState.ACTIVE);
      expect(session?.weekId).toBe(mockWeekId);
      expect(session?.dayId).toBe(mockDayId);
      expect(session?.isReadOnly).toBe(false);

      // 2. Verify session is active
      expect(sessionManager.isSessionActive(mockWeekId, mockDayId)).toBe(true);
      expect(sessionManager.isSessionReadOnly(mockWeekId, mockDayId)).toBe(false);

      // 3. Add exercise timestamps (simulate workout progress)
      sessionManager.updateExerciseTimestamp('exercise-1', Date.now());
      sessionManager.updateExerciseTimestamp('exercise-2', Date.now() + 1000);
      
      const updatedSession = sessionManager.currentSession;
      expect(Object.keys(updatedSession?.exerciseTimestamps || {})).toHaveLength(2);

      // 4. Complete session
      expect(() => sessionManager.completeSession()).not.toThrow();
      
      const completedSession = sessionManager.currentSession;
      expect(completedSession?.state).toBe(SessionState.COMPLETED);
      expect(completedSession?.completedTime).toBeTruthy();
      expect(completedSession?.isReadOnly).toBe(false); // Still editable until logged

      // 5. Log session with RPE
      const rpe = 7;
      expect(() => sessionManager.logSession(rpe)).not.toThrow();
      
      // Session should be cleared after logging
      expect(sessionManager.currentSession).toBeNull();
      
      // But session data should still exist for the day
      const loggedSession = sessionManager.getSessionForDay(mockWeekId, mockDayId);
      expect(loggedSession?.state).toBe(SessionState.LOGGED);
      expect(loggedSession?.loggedTime).toBeTruthy();
      expect(loggedSession?.isReadOnly).toBe(true);

      // 6. Verify read-only state
      expect(sessionManager.isSessionReadOnly(mockWeekId, mockDayId)).toBe(true);
      expect(sessionManager.isSessionActive(mockWeekId, mockDayId)).toBe(false);
    });

    it('should prevent multiple active sessions', () => {
      // Start first session
      sessionManager.startSession(mockWeekId, mockDayId);
      
      // Try to start second session on different day
      const mockWeekId2 = 'week-2';
      const mockDayId2 = 'day-2';
      
      expect(() => sessionManager.startSession(mockWeekId2, mockDayId2)).toThrow();
      
      // First session should still be active
      expect(sessionManager.isSessionActive(mockWeekId, mockDayId)).toBe(true);
      expect(sessionManager.isSessionActive(mockWeekId2, mockDayId2)).toBe(false);
    });

    it('should handle session abandonment', () => {
      // Start session
      sessionManager.startSession(mockWeekId, mockDayId);
      expect(sessionManager.currentSession).toBeTruthy();
      
      // Abandon session
      sessionManager.abandonSession();
      expect(sessionManager.currentSession).toBeNull();
      
      // Session should be completely removed
      expect(sessionManager.getSessionForDay(mockWeekId, mockDayId)).toBeNull();
      expect(sessionManager.isSessionActive(mockWeekId, mockDayId)).toBe(false);
    });
  });

  describe('Session State Persistence', () => {
    it('should persist session state across app restarts', () => {
      // Start session and add some data
      sessionManager.startSession(mockWeekId, mockDayId);
      sessionManager.updateExerciseTimestamp('exercise-1', Date.now());
      
      const originalSession = sessionManager.currentSession;
      expect(originalSession).toBeTruthy();

      // Simulate app restart by creating new session manager
      const newSessionManager = new SessionStateManager();
      
      // Session should be restored
      const restoredSession = newSessionManager.currentSession;
      expect(restoredSession).toBeTruthy();
      expect(restoredSession?.id).toBe(originalSession?.id);
      expect(restoredSession?.state).toBe(SessionState.ACTIVE);
      expect(restoredSession?.weekId).toBe(mockWeekId);
      expect(restoredSession?.dayId).toBe(mockDayId);
      expect(Object.keys(restoredSession?.exerciseTimestamps || {})).toHaveLength(1);
    });

    it('should handle corrupted session data gracefully', () => {
      // Manually corrupt localStorage data
      localStorage.setItem('gymgenie_sessions', 'invalid-json');
      
      // Should not throw and should start with clean state
      expect(() => new SessionStateManager()).not.toThrow();
      
      const sessionManager = new SessionStateManager();
      expect(sessionManager.currentSession).toBeNull();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle invalid state transitions', () => {
      // Try to complete session without starting
      expect(() => sessionManager.completeSession()).toThrow();
      
      // Try to log session without completing
      expect(() => sessionManager.logSession(7)).toThrow();
      
      // Start and complete session
      sessionManager.startSession(mockWeekId, mockDayId);
      sessionManager.completeSession();
      sessionManager.logSession(7);
      
      // Try to modify logged session
      const loggedSession = sessionManager.getSessionForDay(mockWeekId, mockDayId);
      expect(loggedSession?.isReadOnly).toBe(true);
      
      // Should not be able to abandon logged session
      expect(() => sessionManager.abandonSession()).not.toThrow(); // Should not throw but should not do anything
    });

    it('should validate RPE values', () => {
      sessionManager.startSession(mockWeekId, mockDayId);
      sessionManager.completeSession();
      
      // Invalid RPE values should throw
      expect(() => sessionManager.logSession(0)).toThrow();
      expect(() => sessionManager.logSession(11)).toThrow();
      expect(() => sessionManager.logSession(-1)).toThrow();
      
      // Valid RPE values should work
      expect(() => sessionManager.logSession(1)).not.toThrow();
    });

    it('should handle storage failures gracefully', () => {
      // Start session first
      sessionManager.startSession(mockWeekId, mockDayId);
      
      // Mock localStorage to throw errors for ALL setItem calls
      const originalSetItem = localStorage.setItem;
      let callCount = 0;
      localStorage.setItem = () => {
        callCount++;
        throw new Error(`Storage quota exceeded (call ${callCount})`);
      };
      
      try {
        // Should throw storage error when trying to save
        expect(() => sessionManager.completeSession()).toThrow();
      } finally {
        // Restore original localStorage
        localStorage.setItem = originalSetItem;
      }
    });
  });

  describe('Multi-Session Management', () => {
    it('should maintain separate sessions for different days', () => {
      const day1 = { weekId: 'week-1', dayId: 'day-1' };
      const day2 = { weekId: 'week-1', dayId: 'day-2' };
      const day3 = { weekId: 'week-2', dayId: 'day-1' };
      
      // Start and complete session for day 1
      sessionManager.startSession(day1.weekId, day1.dayId);
      sessionManager.completeSession();
      sessionManager.logSession(7);
      
      // Start and complete session for day 2
      sessionManager.startSession(day2.weekId, day2.dayId);
      sessionManager.completeSession();
      sessionManager.logSession(8);
      
      // Start session for day 3 (should be active)
      sessionManager.startSession(day3.weekId, day3.dayId);
      
      // Verify all sessions have correct states
      expect(sessionManager.getSessionForDay(day1.weekId, day1.dayId)?.state).toBe(SessionState.LOGGED);
      expect(sessionManager.getSessionForDay(day2.weekId, day2.dayId)?.state).toBe(SessionState.LOGGED);
      expect(sessionManager.getSessionForDay(day3.weekId, day3.dayId)?.state).toBe(SessionState.ACTIVE);
      
      // Verify read-only states
      expect(sessionManager.isSessionReadOnly(day1.weekId, day1.dayId)).toBe(true);
      expect(sessionManager.isSessionReadOnly(day2.weekId, day2.dayId)).toBe(true);
      expect(sessionManager.isSessionReadOnly(day3.weekId, day3.dayId)).toBe(false);
    });
  });

  describe('Session Recovery', () => {
    it('should detect and handle stale sessions', async () => {
      // Create a session with old timestamp
      const staleTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const staleSessionData = {
        sessions: {
          [`${mockWeekId}-${mockDayId}`]: {
            id: 'test-session',
            weekId: mockWeekId,
            dayId: mockDayId,
            state: SessionState.ACTIVE,
            startTime: staleTimestamp,
            completedTime: null,
            loggedTime: null,
            exerciseTimestamps: {},
            isReadOnly: false
          }
        },
        activeSessionKey: `${mockWeekId}-${mockDayId}`,
        lastActivity: staleTimestamp
      };
      
      localStorage.setItem('gymgenie_sessions', JSON.stringify(staleSessionData));
      
      let staleSessionDetected = false;
      
      // Create new session manager which should detect stale session during construction
      const newSessionManager = new SessionStateManager();
      
      // Set up stale session listener
      const unsubscribe = newSessionManager.onStaleSession(() => {
        staleSessionDetected = true;
      });
      
      // The stale session should be detected during construction
      // Since our current implementation calls handleStaleSession immediately,
      // we should check if the session manager has stale session data
      expect(newSessionManager.hasPendingStaleSession()).toBe(true);
      
      unsubscribe();
    });

    it('should allow recovery of stale sessions', () => {
      const staleTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const staleSessionData = {
        sessions: {
          [`${mockWeekId}-${mockDayId}`]: {
            id: 'test-session',
            weekId: mockWeekId,
            dayId: mockDayId,
            state: SessionState.ACTIVE,
            startTime: staleTimestamp,
            completedTime: null,
            loggedTime: null,
            exerciseTimestamps: { 'exercise-1': staleTimestamp + 1000 },
            isReadOnly: false
          }
        },
        activeSessionKey: `${mockWeekId}-${mockDayId}`,
        lastActivity: staleTimestamp
      };
      
      localStorage.setItem('gymgenie_sessions', JSON.stringify(staleSessionData));
      
      const newSessionManager = new SessionStateManager();
      
      // Should have no current session initially (stale session handling)
      expect(newSessionManager.currentSession).toBeNull();
      
      // Recover stale session
      newSessionManager.recoverStaleSession(true);
      
      // Session should be recovered
      const recoveredSession = newSessionManager.currentSession;
      expect(recoveredSession).toBeTruthy();
      expect(recoveredSession?.state).toBe(SessionState.ACTIVE);
      expect(recoveredSession?.weekId).toBe(mockWeekId);
      expect(recoveredSession?.dayId).toBe(mockDayId);
      expect(Object.keys(recoveredSession?.exerciseTimestamps || {})).toHaveLength(1);
    });
  });
});