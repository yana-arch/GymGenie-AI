// services/DataIntegrityService.ts
import { z } from 'zod';

// Define Zod schemas for your data structures
const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sets: z.number().min(1),
  reps: z.number().min(1),
});

const WorkoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.date(),
  exercises: z.array(ExerciseSchema),
  name: z.string().optional(),
});

export class DataIntegrityService {
  public static validateUserProfile(data: unknown): { success: boolean; error?: z.ZodError } {
    const result = UserProfileSchema.safeParse(data);
    return result;
  }

  public static validateWorkout(data: unknown): { success: boolean; error?: z.ZodError } {
    const result = WorkoutSchema.safeParse(data);
    return result;
  }

  /**
   * Attempts to recover corrupted data by filling in missing default values.
   * This is a simple recovery strategy. More complex strategies could be implemented.
   */
  public static recoverWorkout(data: any): { success: boolean; data?: any; error?: string } {
    try {
      const recoveredExercises = (data.exercises || [])
        .map((ex: any) => {
          const exercise = {
            id: ex.id || crypto.randomUUID(),
            name: ex.name || 'New Exercise',
            sets: ex.sets > 0 ? ex.sets : 1,
            reps: ex.reps > 0 ? ex.reps : 1,
          };
          return ExerciseSchema.safeParse(exercise).success ? exercise : null;
        })
        .filter((ex: any) => ex !== null);

      const partialWorkout = {
        id: data.id || crypto.randomUUID(),
        userId: data.userId,
        date: data.date ? new Date(data.date) : new Date(),
        exercises: recoveredExercises,
        name: data.name || '',
      };
      
      const validation = this.validateWorkout(partialWorkout);
      if (validation.success) {
        return { success: true, data: partialWorkout };
      } else {
        return { success: false, error: "Unable to recover data to a valid state." };
      }
    } catch (e) {
        return { success: false, error: "Recovery failed."}
    }
  }
}
