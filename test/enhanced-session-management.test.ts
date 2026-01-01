import { describe, it, expect, beforeEach } from 'vitest';
import { WorkoutSession } from '../src/features/session/services/WorkoutSession';
import { SessionConflictDetector } from '../src/features/session/services/SessionConflictDetector';
import { SessionRecoverySystem } from '../src/features/session/services/SessionRecoverySystem';
import { SessionState } from '../types';

describe('Enhanced Session Management', () => {
  describe('WorkoutSession', () => {
    it('should create a new session with immutable properties', () => {
      const session = WorkoutSession.create('week1', 'day1');
      
      expect(session.weekId).toBe('week1');
      expect(session.dayId).toBe('day1');
      expect(session.state).toBe(SessionState.ACTIVE);
      expect(session.isActive).toBe(true);
      expect(session.isReadOnly).toBe(false);
    });

    it('should validate state transitions correctly', () => {
      const session = WorkoutSession.create('week1', 'day1');
      
      // Valid transitions
      expect(session.canTransitionTo(SessionState.COMPLETED)).toBe(true);
      expect(session.canTransitionTo(SessionState.INACTIVE)).toBe(true);
      
      // Invalid transitions
      expect(session.canTransitionTo(SessionState.LOGGED)).toBe(false);
    });

    it('should create immutable updates', () => {
      const session = WorkoutSession.create('week1', 'day1');
      const completedSession = session.complete();
      
      // Original session unchanged
      expect(session.state).toBe(SessionState.ACTIVE);
      expect(session.completedTime).toBeNull();
      
      // New session has changes
      expect(completedSession.state).toBe(SessionState.COMPLETED);
      expect(completedSession.completedTime).toBeGreaterThan(0);
      expect(completedSession.id).toBe(session.id); // Same ID
    });

    it('should handle exercise timestamps immutably', () => {
      const session = WorkoutSession.create('week1', 'day1');
      const updatedSession = session.withExerciseTimestamp('exercise1', Date.now());
      
      // Original session unchanged
      expect(Object.keys(session.exerciseTimestamps)).toHaveLength(0);
      
      // New session has timestamp
      expect(Object.keys(updatedSession.exerciseTimestamps)).toHaveLength(1);
      expect(updatedSession.exerciseTimestamps['exercise1']).toBeGreaterThan(0);
    });

    it('should validate session data correctly', () => {
      const validData = {
        id: 'test-id',
        weekId: 'week1',
        dayId: 'day1',
        state: SessionState.ACTIVE,
        startTime: Date.now(),
        completedTime: null,
        loggedTime: null,
        exerciseTimestamps: {},
        isReadOnly: false
      };

      expect(WorkoutSession.isValidSessionData(validData)).toBe(true);
      
      const invalidData = { ...validData, state: 'invalid-state' };
      expect(WorkoutSession.isValidSessionData(invalidData)).toBe(false);
    });
  });

  describe('SessionConflictDetector', () => {
    let detector: SessionConflictDetector;
    let sessions: Map<string, WorkoutSession>;

    beforeEach(() => {
      detector = new SessionConflictDetector();
      sessions = new Map();
    });

    it('should detect multiple active sessions', () => {
      const session1 = WorkoutSession.create('week1', 'day1');
      const session2 = WorkoutSession.create('week1', 'day2');
      
      sessions.set('week1-day1', session1);
      sessions.set('week1-day2', session2);

      const conflict = detector.detectConflicts(sessions, 'week1-day1', 'week1', 'day3');
      
      expect(conflict).toBeTruthy();
      expect(conflict?.type).toBe('MULTIPLE_ACTIVE');
    });

    it('should detect duplicate session conflicts', () => {
      const session = WorkoutSession.create('week1', 'day1').complete();
      sessions.set('week1-day1', session);

      const conflict = detector.detectConflicts(sessions, null, 'week1', 'day1');
      
      expect(conflict).toBeTruthy();
      expect(conflict?.type).toBe('STATE_CONFLICT');
    });

    it('should validate session consistency', () => {
      const session1 = WorkoutSession.create('week1', 'day1');
      const session2 = WorkoutSession.create('week1', 'day2');
      
      sessions.set('week1-day1', session1);
      sessions.set('week1-day2', session2);

      const validation = detector.validateSessionConsistency(sessions, 'week1-day1');
      
      expect(validation.isValid).toBe(false); // Multiple active sessions
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Multiple active sessions');
    });
  });

  describe('SessionRecoverySystem', () => {
    let recoverySystem: SessionRecoverySystem;

    beforeEach(() => {
      recoverySystem = new SessionRecoverySystem();
    });

    it('should detect stale sessions', () => {
      const sessions = new Map<string, WorkoutSession>();
      
      // Create a stale session (older than 24 hours)
      const staleTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const staleSession = new WorkoutSession(
        'stale-id',
        'week1',
        'day1',
        SessionState.ACTIVE,
        staleTime,
        null,
        null,
        {},
        false
      );
      
      sessions.set('week1-day1', staleSession);

      const staleSessions = recoverySystem.detectStaleSessions(sessions);
      
      expect(staleSessions).toHaveLength(1);
      expect(staleSessions[0].session.id).toBe('stale-id');
      expect(staleSessions[0].staleDurationHours).toBeGreaterThan(24);
    });

    it('should analyze data corruption', () => {
      const corruptedData = {
        sessions: {
          'week1-day1': { invalid: 'data' },
          'week1-day2': {
            id: 'valid-id',
            weekId: 'week1',
            dayId: 'day2',
            state: SessionState.ACTIVE,
            startTime: Date.now(),
            completedTime: null,
            loggedTime: null,
            exerciseTimestamps: {},
            isReadOnly: false
          }
        }
      };

      const analysis = recoverySystem.analyzeDataCorruption(corruptedData);
      
      expect(analysis.corruptionType).toBe('PARTIAL');
      expect(analysis.totalLoss).toBe(false);
      expect(analysis.corruptedKeys).toContain('week1-day1');
      expect(Object.keys(analysis.recoverableData)).toContain('week1-day2');
    });
  });
});