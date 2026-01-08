import { ServiceContainer, SERVICE_KEYS } from './ServiceContainer';
import { ISessionService } from '@/services/interfaces/ISessionService';
import { IWorkoutService } from '@/services/interfaces/IWorkoutService';
import { IStorageService } from '@/services/interfaces/IStorageService';

// Import concrete implementations (will be created later)
// import { SessionService } from '@/implementations/SessionService';
// import { WorkoutService } from '@/implementations/WorkoutService';
// import { StorageService } from '@/implementations/StorageService';

/**
 * Register all services with the dependency injection container
 */
export function registerServices(): void {
  const container = ServiceContainer.getInstance();

  // Register SessionService
  container.register<ISessionService>(
    SERVICE_KEYS.SESSION_SERVICE,
    () => {
      // For now, return a mock implementation
      // TODO: Replace with actual SessionService implementation
      return createMockSessionService();
    },
    true // singleton
  );

  // Register WorkoutService
  container.register<IWorkoutService>(
    SERVICE_KEYS.WORKOUT_SERVICE,
    () => {
      // For now, return a mock implementation
      // TODO: Replace with actual WorkoutService implementation
      return createMockWorkoutService();
    },
    true // singleton
  );

  // Register StorageService
  container.register<IStorageService>(
    SERVICE_KEYS.STORAGE_SERVICE,
    () => {
      // For now, return a mock implementation
      // TODO: Replace with actual StorageService implementation
      return createMockStorageService();
    },
    true // singleton
  );
}

/**
 * Get a service from the container
 * @param key - Service key
 * @returns The service instance
 */
export function getService<T>(key: string): T {
  const container = ServiceContainer.getInstance();
  return container.resolve<T>(key);
}

// Convenience functions for getting specific services
export function getSessionService(): ISessionService {
  return getService<ISessionService>(SERVICE_KEYS.SESSION_SERVICE);
}

export function getWorkoutService(): IWorkoutService {
  return getService<IWorkoutService>(SERVICE_KEYS.WORKOUT_SERVICE);
}

export function getStorageService(): IStorageService {
  return getService<IStorageService>(SERVICE_KEYS.STORAGE_SERVICE);
}

// Mock implementations for initial setup
// These will be replaced with actual implementations later

function createMockSessionService(): ISessionService {
  return {
    startSession: async (weekId: string, dayId: string) => {
      throw new Error('SessionService not implemented yet');
    },
    completeSession: async () => {
      throw new Error('SessionService not implemented yet');
    },
    logSession: async (rpe: number, analysis?) => {
      throw new Error('SessionService not implemented yet');
    },
    abandonSession: async () => {
      throw new Error('SessionService not implemented yet');
    },
    recoverStaleSession: async (shouldContinue: boolean) => {
      throw new Error('SessionService not implemented yet');
    },
    getSessionForDay: (weekId: string, dayId: string) => {
      return null;
    },
    isSessionActive: (weekId: string, dayId: string) => {
      return false;
    },
    isSessionReadOnly: (weekId: string, dayId: string) => {
      return false;
    },
    getCurrentSession: () => {
      return null;
    },
    updateExerciseTimestamp: (exerciseId: string, timestamp: number) => {
      // Mock implementation
    },
    removeExerciseTimestamp: (exerciseId: string) => {
      // Mock implementation
    },
    clearAllSessions: () => {
      // Mock implementation
    },
  };
}

function createMockWorkoutService(): IWorkoutService {
  return {
    generateWorkout: async (user, equipment) => {
      throw new Error('WorkoutService not implemented yet');
    },
    modifyWorkout: async (day, prompt) => {
      throw new Error('WorkoutService not implemented yet');
    },
    analyzeSession: async (metrics) => {
      throw new Error('WorkoutService not implemented yet');
    },
    getCurrentPlan: () => {
      return null;
    },
    setCurrentPlan: (plan) => {
      // Mock implementation
    },
    toggleExercise: (exerciseId, timestamp?) => {
      return false;
    },
    updateDayInPlan: (weekId, updatedDay) => {
      // Mock implementation
    },
    moveExercise: (weekId, dayId, exerciseId, direction) => {
      // Mock implementation
    },
    replaceExerciseInPlan: (weekId, dayId, oldExerciseId, newExerciseData) => {
      // Mock implementation
    },
    getHistory: () => {
      return [];
    },
    addHistoryEntry: (entry) => {
      // Mock implementation
    },
    logWorkout: (weekId, dayId, rpe, analysis?) => {
      // Mock implementation
    },
    isWorkoutReadOnly: (weekId, dayId) => {
      return false;
    },
    canModifyExercise: (exerciseId, weekId, dayId) => {
      return true;
    },
  };
}

function createMockStorageService(): IStorageService {
  return {
    save: async <T>(key: string, data: T): Promise<void> => {
      // Mock implementation
    },
    load: async <T>(key: string): Promise<T | null> => {
      return null;
    },
    remove: async (key: string): Promise<void> => {
      // Mock implementation
    },
    clear: async (): Promise<void> => {
      // Mock implementation
    },
    backup: async () => {
      throw new Error('StorageService not implemented yet');
    },
    restore: async (backupData) => {
      throw new Error('StorageService not implemented yet');
    },
    getStorageInfo: async () => {
      throw new Error('StorageService not implemented yet');
    },
    saveUser: async (user) => {
      // Mock implementation
    },
    getUser: async () => {
      return null;
    },
    saveEquipment: async (equipment) => {
      // Mock implementation
    },
    getEquipment: async () => {
      return null;
    },
    savePlan: async (plan) => {
      // Mock implementation
    },
    getPlan: async () => {
      return null;
    },
    saveStep: async (step) => {
      // Mock implementation
    },
    getStep: async () => {
      return null;
    },
    saveHistory: async (history) => {
      // Mock implementation
    },
    getHistory: async () => {
      return null;
    },
  };
}