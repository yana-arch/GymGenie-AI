// Enhanced types with proper inheritance (these take priority)
export * from './enhanced';

// Zod validation schemas
export * from './schemas';

// Type-safe serialization utilities
export * from './serialization';

export type ActiveView = 'workout' | 'kitchen' | 'progress' | 'profile';

// Re-export original types for backward compatibility (excluding conflicting ones)
export type {
  UserProfile,
  Exercise,
  WorkoutDay,
  WorkoutWeek,
  WorkoutPlan,
  WorkoutHistoryEntry,
  SessionStateManager,
  ExerciseController,
  WorkoutLogger,
  SessionError,
  SessionErrorHandler,
  SessionStorageData,
  StorageSchema,
  Recipe,
  AppStep,
  AppState,
  AppContextType,
} from '@/types';

// Utility type helpers
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P];
};

// Type guards collection
import {
  isBaseEntity,
  isEnhancedUserProfile,
  isEnhancedWorkoutSession
} from './enhanced';

export const TypeGuards = {
  isBaseEntity,
  isEnhancedUserProfile,
  isEnhancedWorkoutSession
};

// Schema collection for easy access
export { Schemas } from './schemas';

// Serialization utilities
import { 
  TypeSafeSerializer,
  DomainSerializers,
  BatchSerializer,
  SchemaMigrator,
  SerializationUtils
} from './serialization';

export {
  TypeSafeSerializer,
  DomainSerializers,
  BatchSerializer,
  SchemaMigrator,
  SerializationUtils
};