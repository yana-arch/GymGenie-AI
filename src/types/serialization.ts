import { z } from "zod";
import {
  SerializationError,
  ValidationError,
  EnhancedUserProfile,
  EnhancedWorkoutSession,
  EnhancedWorkoutPlan,
  EnhancedExercise,
  EnhancedWorkoutDay,
  EnhancedWorkoutWeek,
} from "./enhanced";
import { Schemas } from "./schemas";

/**
 * Type-safe serialization utility class
 */
export class TypeSafeSerializer {
  /**
   * Serialize data to JSON string with validation
   */
  static serialize<T>(data: T, schema: z.ZodSchema<T>): string {
    try {
      // Validate data against schema before serialization
      const validatedData = schema.parse(data);
      return JSON.stringify(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed during serialization: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          data,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw new SerializationError(
        `Failed to serialize data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data,
        "serialize"
      );
    }
  }

  /**
   * Deserialize JSON string to typed object with validation
   */
  static deserialize<T>(jsonString: string, schema: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(jsonString);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SerializationError(
          `Invalid JSON format: ${error.message}`,
          jsonString,
          "deserialize"
        );
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed during deserialization: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          jsonString,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw new SerializationError(
        `Failed to deserialize data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        jsonString,
        "deserialize"
      );
    }
  }

  /**
   * Safe serialize with error handling
   */
  static safeSerialize<T>(
    data: T,
    schema: z.ZodSchema<T>
  ): { success: true; data: string } | { success: false; error: Error } {
    try {
      const result = this.serialize(data, schema);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Safe deserialize with error handling
   */
  static safeDeserialize<T>(
    jsonString: string,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; error: Error } {
    try {
      const result = this.deserialize(jsonString, schema);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Specialized serializers for domain objects
 */
export class DomainSerializers {
  /**
   * User Profile serialization
   */
  static serializeUserProfile(profile: EnhancedUserProfile): string {
    return TypeSafeSerializer.serialize(profile, Schemas.EnhancedUserProfile);
  }

  static deserializeUserProfile(jsonString: string): EnhancedUserProfile {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedUserProfile
    );
  }

  static safeDeserializeUserProfile(
    jsonString: string
  ):
    | { success: true; data: EnhancedUserProfile }
    | { success: false; error: Error } {
    return TypeSafeSerializer.safeDeserialize(
      jsonString,
      Schemas.EnhancedUserProfile
    );
  }

  /**
   * Workout Session serialization
   */
  static serializeWorkoutSession(session: EnhancedWorkoutSession): string {
    return TypeSafeSerializer.serialize(
      session,
      Schemas.EnhancedWorkoutSession
    );
  }

  static deserializeWorkoutSession(jsonString: string): EnhancedWorkoutSession {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedWorkoutSession
    );
  }

  static safeDeserializeWorkoutSession(
    jsonString: string
  ):
    | { success: true; data: EnhancedWorkoutSession }
    | { success: false; error: Error } {
    return TypeSafeSerializer.safeDeserialize(
      jsonString,
      Schemas.EnhancedWorkoutSession
    );
  }

  /**
   * Workout Plan serialization
   */
  static serializeWorkoutPlan(plan: EnhancedWorkoutPlan): string {
    return TypeSafeSerializer.serialize(
      plan,
      Schemas.EnhancedWorkoutPlan as any
    );
  }

  static deserializeWorkoutPlan(jsonString: string): EnhancedWorkoutPlan {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedWorkoutPlan as any
    );
  }

  static safeDeserializeWorkoutPlan(
    jsonString: string
  ):
    | { success: true; data: EnhancedWorkoutPlan }
    | { success: false; error: Error } {
    return TypeSafeSerializer.safeDeserialize(
      jsonString,
      Schemas.EnhancedWorkoutPlan as any
    );
  }

  /**
   * Exercise serialization
   */
  static serializeExercise(exercise: EnhancedExercise): string {
    return TypeSafeSerializer.serialize(
      exercise,
      Schemas.EnhancedExercise as any
    );
  }

  static deserializeExercise(jsonString: string): EnhancedExercise {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedExercise as any
    );
  }

  /**
   * Workout Day serialization
   */
  static serializeWorkoutDay(day: EnhancedWorkoutDay): string {
    return TypeSafeSerializer.serialize(day, Schemas.EnhancedWorkoutDay as any);
  }

  static deserializeWorkoutDay(jsonString: string): EnhancedWorkoutDay {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedWorkoutDay as any
    );
  }

  /**
   * Workout Week serialization
   */
  static serializeWorkoutWeek(week: EnhancedWorkoutWeek): string {
    return TypeSafeSerializer.serialize(
      week,
      Schemas.EnhancedWorkoutWeek as any
    );
  }

  static deserializeWorkoutWeek(jsonString: string): EnhancedWorkoutWeek {
    return TypeSafeSerializer.deserialize(
      jsonString,
      Schemas.EnhancedWorkoutWeek as any
    );
  }
}

/**
 * Batch serialization utilities
 */
export class BatchSerializer {
  /**
   * Serialize multiple objects of the same type
   */
  static serializeBatch<T>(items: T[], schema: z.ZodSchema<T>): string {
    try {
      const validatedItems = items.map((item) => schema.parse(item));
      return JSON.stringify(validatedItems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Batch validation failed: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          items,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw new SerializationError(
        `Failed to serialize batch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        items,
        "serialize"
      );
    }
  }

  /**
   * Deserialize multiple objects of the same type
   */
  static deserializeBatch<T>(jsonString: string, schema: z.ZodSchema<T>): T[] {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new SerializationError(
          "Expected array for batch deserialization",
          jsonString,
          "deserialize"
        );
      }
      return parsed.map((item) => schema.parse(item));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SerializationError(
          `Invalid JSON format: ${error.message}`,
          jsonString,
          "deserialize"
        );
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Batch validation failed: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          jsonString,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw new SerializationError(
        `Failed to deserialize batch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        jsonString,
        "deserialize"
      );
    }
  }
}

/**
 * Migration utilities for handling schema changes
 */
export class SchemaMigrator {
  private static migrations: Map<string, (data: any) => any> = new Map();

  /**
   * Register a migration function for a specific version
   */
  static registerMigration(
    fromVersion: string,
    toVersion: string,
    migrationFn: (data: any) => any
  ): void {
    const key = `${fromVersion}->${toVersion}`;
    this.migrations.set(key, migrationFn);
  }

  /**
   * Apply migrations to bring data to current version
   */
  static migrate(data: any, fromVersion: string, toVersion: string): any {
    const key = `${fromVersion}->${toVersion}`;
    const migration = this.migrations.get(key);

    if (!migration) {
      throw new SerializationError(
        `No migration found from version ${fromVersion} to ${toVersion}`,
        data,
        "deserialize"
      );
    }

    try {
      return migration(data);
    } catch (error) {
      throw new SerializationError(
        `Migration failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data,
        "deserialize"
      );
    }
  }

  /**
   * Deserialize with automatic migration
   */
  static deserializeWithMigration<T>(
    jsonString: string,
    schema: z.ZodSchema<T>,
    currentVersion: string
  ): T {
    try {
      const parsed = JSON.parse(jsonString);

      // Check if data has version information
      if (parsed.version && parsed.version !== currentVersion) {
        const migratedData = this.migrate(
          parsed,
          parsed.version,
          currentVersion
        );
        return schema.parse(migratedData);
      }

      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new SerializationError(
          `Invalid JSON format: ${error.message}`,
          jsonString,
          "deserialize"
        );
      }
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed after migration: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          jsonString,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw error;
    }
  }
}

/**
 * Utility functions for common serialization tasks
 */
export const SerializationUtils = {
  /**
   * Create a deep clone of an object using serialization
   */
  deepClone<T>(obj: T, schema: z.ZodSchema<T>): T {
    const serialized = TypeSafeSerializer.serialize(obj, schema);
    return TypeSafeSerializer.deserialize(serialized, schema);
  },

  /**
   * Validate object without serialization
   */
  validate<T>(obj: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(obj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed: ${error.message}`,
          error.issues[0]?.path?.join(".") || "unknown",
          obj,
          error.issues[0]?.message || "unknown constraint"
        );
      }
      throw error;
    }
  },

  /**
   * Safe validation with error handling
   */
  safeValidate<T>(
    obj: unknown,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; error: Error } {
    try {
      const result = this.validate(obj, schema);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  /**
   * Check if object matches schema without throwing
   */
  isValid<T>(obj: unknown, schema: z.ZodSchema<T>): boolean {
    try {
      schema.parse(obj);
      return true;
    } catch {
      return false;
    }
  },
};
