import { describe, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../src/services/storage/StorageService';
import { SessionState } from '../src/types';
import { workoutSessionFactory, mockLocalStorage, resetAllMocks } from '../src/test-utils';
import { 
  given, 
  when, 
  then, 
  and, 
  createStorageTest, 
  createCriticalTest,
  createHighPriorityTest,
  createMediumPriorityTest,
  createLowPriorityTest,
  TestCategory,
  TestType, 
  TestPriority 
} from '../src/test-utils';
import { createSmokeTest as createSmokeTestId } from '../src/test-utils/ids/TestIdGenerator';

// Setup mock localStorage
const mockStorage = mockLocalStorage();

describe('[Storage Service]', () => {
  beforeEach(() => {
    resetAllMocks();
    mockStorage.__store = {}; // Clear the mock store
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Data Management', () => {
    given('a user starts a workout session', () => {
      when('the session data is saved to localStorage', () => {
        then(createSmokeTestId(TestCategory.STORAGE, TestType.UNIT, 1, 'the session should be retrievable with all metadata'), () => {
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

        and(createSmokeTestId(TestCategory.STORAGE, TestType.UNIT, 2, 'the active session key should be properly set'), () => {
          const session = workoutSessionFactory.createActive();
          const sessionKey = `${session.weekId}-${session.dayId}`;
          
          StorageService.saveActiveSessionKey(sessionKey);
          const retrieved = StorageService.getActiveSessionKey();
          
          expect(retrieved).toBe(sessionKey);
        });
      });
    });

    given('multiple workout sessions are created', () => {
      when('all sessions are saved to storage', () => {
        then(createHighPriorityTest(TestCategory.STORAGE, TestType.UNIT, 3, 'all sessions should be retrievable with correct metadata'), () => {
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

          StorageService.saveSessionData(sessionData);
          const retrieved = StorageService.getSessionData();

          expect(retrieved).not.toBeNull();
          expect(Object.keys(retrieved!.sessions)).toHaveLength(3);
        });
      });
    });

    given('a workout session is completed', () => {
      when('the completed session data is saved', () => {
        then(createHighPriorityTest(TestCategory.STORAGE, TestType.UNIT, 4, 'the session should be marked as completed with completion metadata'), () => {
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
      });
    });
  });

  describe('Active Session Key Management', () => {
    given('a user has no active session', () => {
      when('checking for active session key', () => {
        then(createSmokeTestId(TestCategory.STORAGE, TestType.UNIT, 5, 'should return null'), () => {
          StorageService.saveActiveSessionKey(null);
          const retrieved = StorageService.getActiveSessionKey();
          expect(retrieved).toBeNull();
        });
      });
    });

    given('a user sets an active session and then clears it', () => {
      when('the active session key is set to null', () => {
        then(createSmokeTestId(TestCategory.STORAGE, TestType.UNIT, 6, 'should remove the active session key from storage'), () => {
          const session = workoutSessionFactory.createActive();
          const sessionKey = `${session.weekId}-${session.dayId}`;
          
          StorageService.saveActiveSessionKey(sessionKey);
          StorageService.saveActiveSessionKey(null);
          const retrieved = StorageService.getActiveSessionKey();
          
          expect(retrieved).toBeNull();
        });
      });
    });
  });

  describe('Error Handling', () => {
    given('localStorage is corrupted with invalid JSON', () => {
      when('attempting to retrieve session data', () => {
        then(createCriticalTest(TestCategory.STORAGE, TestType.UNIT, 7, 'should handle corrupted data gracefully and return null'), () => {
          mockStorage.setItem('gymgenie_sessions', 'invalid json');
          const retrieved = StorageService.getSessionData();
          expect(retrieved).toBeNull();
        });
      });
    });

    given('localStorage storage quota is exceeded', () => {
      when('attempting to save session data', () => {
        then(createCriticalTest(TestCategory.STORAGE, TestType.UNIT, 8, 'should throw STORAGE_FAILURE error'), () => {
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
      });
    });

    given('localStorage throws errors during retrieval', () => {
      when('attempting to get session data', () => {
        then(createCriticalTest(TestCategory.STORAGE, TestType.UNIT, 9, 'should handle retrieval errors and return null'), () => {
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
  });

  describe('Session Data Cleanup', () => {
    given('a user has multiple session data stored', () => {
      when('clearing all session data', () => {
        then(createHighPriorityTest(TestCategory.STORAGE, TestType.UNIT, 10, 'should remove all session-related data from storage'), () => {
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
    });
  });
});