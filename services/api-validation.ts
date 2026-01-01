import { z } from 'zod';
import { ValidationError } from '@/types/enhanced';

// Re-export ValidationError for use in other modules
export { ValidationError };

/**
 * API Response validation schemas
 */

// Equipment identification API response schema
export const EquipmentIdentificationResponseSchema = z.array(z.string().min(1, 'Equipment name cannot be empty'));

// Recipe generation API response schema
export const RecipeResponseSchema = z.object({
  id: z.string().uuid().optional(), // Will be added after validation
  name: z.string().min(1, 'Recipe name required').max(100, 'Recipe name too long'),
  calories: z.number().int().min(0, 'Calories cannot be negative').max(5000, 'Calories too high'),
  protein: z.number().int().min(0, 'Protein cannot be negative').max(500, 'Protein too high'),
  carbs: z.number().int().min(0, 'Carbs cannot be negative').max(1000, 'Carbs too high'),
  fats: z.number().int().min(0, 'Fats cannot be negative').max(500, 'Fats too high'),
  ingredients: z.array(z.string().min(1, 'Ingredient cannot be empty')).min(1, 'At least one ingredient required').max(20, 'Too many ingredients'),
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty')).min(1, 'At least one instruction required').max(20, 'Too many instructions'),
  cookingTimeMinutes: z.number().int().min(1, 'Cooking time must be positive').max(300, 'Cooking time too long')
});

export const RecipesResponseSchema = z.array(RecipeResponseSchema).max(10, 'Too many recipes returned');

// Exercise API response schemas
export const ExerciseResponseSchema = z.object({
  id: z.string().uuid().optional(), // Will be added after validation
  name: z.string().min(1, 'Exercise name required').max(100, 'Exercise name too long'),
  sets: z.number().int().min(1, 'At least 1 set required').max(10, 'Too many sets'),
  reps: z.string().min(1, 'Reps specification required').max(20, 'Reps specification too long'),
  restSeconds: z.number().int().min(0, 'Rest cannot be negative').max(600, 'Rest too long'),
  notes: z.string().max(500, 'Notes too long'),
  isCompleted: z.boolean().optional() // Will be added after validation
});

export const WorkoutDayResponseSchema = z.object({
  id: z.string().uuid().optional(), // Will be added after validation
  dayName: z.string().min(1, 'Day name required').max(20, 'Day name too long'),
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  isRestDay: z.boolean(),
  exercises: z.array(ExerciseResponseSchema).max(20, 'Too many exercises')
});

export const WorkoutWeekResponseSchema = z.object({
  id: z.string().uuid().optional(), // Will be added after validation
  weekNumber: z.number().int().min(1, 'Week number must be positive').max(52, 'Week number too high'),
  focus: z.string().min(1, 'Focus required').max(100, 'Focus too long'),
  days: z.array(WorkoutDayResponseSchema).min(1, 'At least one day required').max(7, 'Too many days')
});

export const WorkoutPlanResponseSchema = z.object({
  id: z.string().uuid().optional(), // Will be added after validation
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description required').max(1000, 'Description too long'),
  generatedAt: z.string().datetime().optional(), // Will be added after validation
  totalDurationWeeks: z.number().int().min(1, 'At least 1 week required').max(52, 'Too many weeks').optional(), // Will be calculated
  weeks: z.array(WorkoutWeekResponseSchema).min(1, 'At least one week required').max(52, 'Too many weeks')
});

// Exercise details API response schema
export const ExerciseDetailsResponseSchema = z.object({
  targetMuscles: z.array(z.string().min(1, 'Muscle name cannot be empty')).min(1, 'At least one target muscle required').max(10, 'Too many target muscles'),
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty')).min(1, 'At least one instruction required').max(20, 'Too many instructions'),
  commonMistakes: z.array(z.string().min(1, 'Mistake description cannot be empty')).max(10, 'Too many common mistakes'),
  proTips: z.array(z.string().min(1, 'Tip cannot be empty')).max(10, 'Too many pro tips')
});

// Exercise swap API response schema
export const ExerciseSwapResponseSchema = z.object({
  name: z.string().min(1, 'Exercise name required').max(100, 'Exercise name too long'),
  sets: z.number().int().min(1, 'At least 1 set required').max(10, 'Too many sets'),
  reps: z.string().min(1, 'Reps specification required').max(20, 'Reps specification too long'),
  restSeconds: z.number().int().min(0, 'Rest cannot be negative').max(600, 'Rest too long'),
  notes: z.string().max(500, 'Notes too long')
});

// Workout analysis API response schema
export const WorkoutAnalysisResponseSchema = z.object({
  score: z.number().int().min(1, 'Score must be at least 1').max(10, 'Score cannot exceed 10'),
  mood: z.string().min(1, 'Mood cannot be empty').max(50, 'Mood description too long'),
  summary: z.string().min(1, 'Summary cannot be empty').max(500, 'Summary too long'),
  advice: z.string().min(1, 'Advice cannot be empty').max(500, 'Advice too long'),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  nextWorkoutRecommendations: z.array(z.string())
});

/**
 * Type guards for API responses
 */
export function isValidEquipmentResponse(data: unknown): data is string[] {
  try {
    EquipmentIdentificationResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidRecipesResponse(data: unknown): data is Array<z.infer<typeof RecipeResponseSchema>> {
  try {
    RecipesResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidWorkoutPlanResponse(data: unknown): data is z.infer<typeof WorkoutPlanResponseSchema> {
  try {
    WorkoutPlanResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidExerciseDetailsResponse(data: unknown): data is z.infer<typeof ExerciseDetailsResponseSchema> {
  try {
    ExerciseDetailsResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidWorkoutAnalysisResponse(data: unknown): data is z.infer<typeof WorkoutAnalysisResponseSchema> {
  try {
    WorkoutAnalysisResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * API Response Validator class
 */
export class ApiResponseValidator {
  /**
   * Validate equipment identification response
   */
  static validateEquipmentResponse(data: unknown): string[] {
    try {
      return EquipmentIdentificationResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Equipment API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate recipes response
   */
  static validateRecipesResponse(data: unknown): Array<z.infer<typeof RecipeResponseSchema>> {
    try {
      return RecipesResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Recipes API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate workout plan response
   */
  static validateWorkoutPlanResponse(data: unknown): z.infer<typeof WorkoutPlanResponseSchema> {
    try {
      return WorkoutPlanResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Workout plan API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate workout day response
   */
  static validateWorkoutDayResponse(data: unknown): z.infer<typeof WorkoutDayResponseSchema> {
    try {
      return WorkoutDayResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Workout day API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate exercise details response
   */
  static validateExerciseDetailsResponse(data: unknown): z.infer<typeof ExerciseDetailsResponseSchema> {
    try {
      return ExerciseDetailsResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Exercise details API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate exercise swap response
   */
  static validateExerciseSwapResponse(data: unknown): z.infer<typeof ExerciseSwapResponseSchema> {
    try {
      return ExerciseSwapResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Exercise swap API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Validate workout analysis response
   */
  static validateWorkoutAnalysisResponse(data: unknown): z.infer<typeof WorkoutAnalysisResponseSchema> {
    try {
      return WorkoutAnalysisResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Workout analysis API response validation failed: ${error.message}`,
          error.issues[0]?.path?.join('.') || 'unknown',
          data,
          error.issues[0]?.message || 'unknown constraint'
        );
      }
      throw error;
    }
  }

  /**
   * Safe validation with error handling
   */
  static safeValidateEquipmentResponse(data: unknown): { success: true; data: string[] } | { success: false; error: Error } {
    try {
      const result = this.validateEquipmentResponse(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static safeValidateRecipesResponse(data: unknown): { success: true; data: Array<z.infer<typeof RecipeResponseSchema>> } | { success: false; error: Error } {
    try {
      const result = this.validateRecipesResponse(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static safeValidateWorkoutPlanResponse(data: unknown): { success: true; data: z.infer<typeof WorkoutPlanResponseSchema> } | { success: false; error: Error } {
    try {
      const result = this.validateWorkoutPlanResponse(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static safeValidateExerciseDetailsResponse(data: unknown): { success: true; data: z.infer<typeof ExerciseDetailsResponseSchema> } | { success: false; error: Error } {
    try {
      const result = this.validateExerciseDetailsResponse(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static safeValidateWorkoutAnalysisResponse(data: unknown): { success: true; data: z.infer<typeof WorkoutAnalysisResponseSchema> } | { success: false; error: Error } {
    try {
      const result = this.validateWorkoutAnalysisResponse(data);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

/**
 * Error handling utilities for API validation failures
 */
export class ApiValidationErrorHandler {
  /**
   * Handle validation errors with fallback strategies
   */
  static handleEquipmentValidationError(error: ValidationError, originalData: unknown): string[] {
    console.error('Equipment validation failed:', error.message);
    
    // Fallback: try to extract valid strings from array-like data
    if (Array.isArray(originalData)) {
      const validEquipment = originalData.filter(item => 
        typeof item === 'string' && item.trim().length > 0
      );
      if (validEquipment.length > 0) {
        console.warn('Using partial equipment data after validation failure');
        return validEquipment;
      }
    }
    
    // Ultimate fallback
    return [];
  }

  static handleRecipesValidationError(error: ValidationError, originalData: unknown): Array<z.infer<typeof RecipeResponseSchema>> {
    console.error('Recipes validation failed:', error.message);
    
    // Fallback: try to extract valid recipes
    if (Array.isArray(originalData)) {
      const validRecipes = originalData.filter(item => {
        try {
          RecipeResponseSchema.parse(item);
          return true;
        } catch {
          return false;
        }
      });
      
      if (validRecipes.length > 0) {
        console.warn('Using partial recipes data after validation failure');
        return validRecipes;
      }
    }
    
    // Ultimate fallback
    return [];
  }

  static handleWorkoutPlanValidationError(error: ValidationError, originalData: unknown): z.infer<typeof WorkoutPlanResponseSchema> | null {
    console.error('Workout plan validation failed:', error.message);
    
    // For workout plans, we can't provide a meaningful fallback
    // The calling code should handle null and show appropriate error to user
    return null;
  }

  static handleWorkoutAnalysisValidationError(error: ValidationError, originalData: unknown): z.infer<typeof WorkoutAnalysisResponseSchema> {
    console.error('Workout analysis validation failed:', error.message);
    
    // Provide a safe fallback analysis
    return {
      score: 5,
      mood: 'Unknown',
      summary: 'Workout completed successfully.',
      advice: 'Keep up the good work!',
      strengths: [],
      improvements: [],
      nextWorkoutRecommendations: []
    };
  }
}

/**
 * Utility to create validated API response handlers
 */
export function createValidatedApiHandler<T>(
  validator: (data: unknown) => T,
  errorHandler?: (error: ValidationError, data: unknown) => T
) {
  return (data: unknown): T => {
    try {
      return validator(data);
    } catch (error) {
      if (error instanceof ValidationError && errorHandler) {
        return errorHandler(error, data);
      }
      throw error;
    }
  };
}

// Pre-configured validated handlers
export const ValidatedApiHandlers = {
  equipment: createValidatedApiHandler(
    ApiResponseValidator.validateEquipmentResponse,
    ApiValidationErrorHandler.handleEquipmentValidationError
  ),
  recipes: createValidatedApiHandler(
    ApiResponseValidator.validateRecipesResponse,
    ApiValidationErrorHandler.handleRecipesValidationError
  ),
  workoutPlan: createValidatedApiHandler(
    ApiResponseValidator.validateWorkoutPlanResponse,
    ApiValidationErrorHandler.handleWorkoutPlanValidationError
  ),
  workoutAnalysis: createValidatedApiHandler(
    ApiResponseValidator.validateWorkoutAnalysisResponse,
    ApiValidationErrorHandler.handleWorkoutAnalysisValidationError
  )
};