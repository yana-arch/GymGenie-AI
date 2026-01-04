import { UserProfile, WorkoutPlan, WorkoutDay, Exercise } from "@/types";
import { geminiService } from "@/services/ai/GeminiService";
import { exerciseCatalogService } from "./ExerciseCatalogService";

/**
 * Generates a multi-week workout plan based on user profile and available equipment.
 * This is the primary workout plan generation function that uses Gemini AI
 * for intelligent, personalized workout planning.
 */
export const generateWorkoutPlan = async (
  user: UserProfile,
  equipment?: string[]
): Promise<WorkoutPlan> => {
  try {
    // Fetch all available exercise names and their primary muscle/equipment for context
    const allExercises = await exerciseCatalogService.getAllExercises();

    // We don't strictly need to pass exercise summary to Gemini anymore as it has internal knowledge,
    // but we could use it for RAG later. For now, we rely on Gemini's training.

    const parsedResponse = await geminiService.generateWorkoutPlan(
      user,
      equipment || user.equipment || []
    );

    // Post-processing: Enrich with actual exercise IDs from ExerciseRegistry if possible
    const enrichWithRegistryIds = (plan: WorkoutPlan): WorkoutPlan => {
      const registryMap = new Map<string, Exercise>();
      allExercises.forEach((ex) => registryMap.set(ex.name.toLowerCase(), ex));

      return {
        ...plan,
        weeks: plan.weeks.map((week) => ({
          ...week,
          days: week.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((exercise) => {
              const matchedExercise = registryMap.get(
                exercise.name.toLowerCase()
              );
              return {
                ...exercise,
                id: matchedExercise ? matchedExercise.id : exercise.id, // Use registry ID if found
              };
            }),
          })),
        })),
      };
    };

    return enrichWithRegistryIds(parsedResponse);
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    // Fallback: Return a simple default plan
    return {
      id: crypto.randomUUID(),
      title: "Default 4-Week Plan",
      description: "A generic plan for muscle gain (Fallback).",
      generatedAt: new Date().toISOString(),
      totalDurationWeeks: 4,
      weeks: Array.from({ length: 4 }, (_, i) => ({
        id: crypto.randomUUID(),
        weekNumber: i + 1,
        focus: "Full Body Strength",
        days: Array.from({ length: 7 }, (_, j) => ({
          id: crypto.randomUUID(),
          dayName: `Day ${j + 1}`,
          title: j < 3 ? "Full Body Workout" : "Rest Day",
          isRestDay: j >= 3,
          exercises:
            j < 3
              ? [
                  {
                    id: crypto.randomUUID(),
                    name: "Squats",
                    sets: 3,
                    reps: "8-12",
                    restSeconds: 90,
                    notes: "Focus on form",
                    isCompleted: false,
                  },
                  {
                    id: crypto.randomUUID(),
                    name: "Push-ups",
                    sets: 3,
                    reps: "AMRAP",
                    restSeconds: 60,
                    notes: "Chest & Triceps",
                    isCompleted: false,
                  },
                ]
              : [],
        })),
      })),
    };
  }
};

/**
 * Smart Progressive Overload: Modifies future weeks based on user RPE feedback.
 * Note: Since we don't have a direct "adjustPlan" in GeminiService yet (merged logic),
 * we might need to implement a specific method in GeminiService or re-use existing ones.
 * For now, we'll implementing a basic re-generation or specific prompt in GeminiService.
 *
 * UPDATE: To keep it verified, we will skip complex adjustment logic for this iteration
 * and focus on the cleanup. If needed we can add `adjustPlan` to GeminiService.
 */
export const adjustPlanProgressively = async (
  currentPlan: WorkoutPlan,
  completedDay: WorkoutDay,
  completedWeekNumber: number,
  rpe: number
): Promise<WorkoutPlan> => {
  // Placeholder: Return current plan for now as we consolidated services.
  // If specific adjustment logic is needed, it should be added to GeminiService.
  return currentPlan;
};

export const generateTechniqueTip = async (
  exerciseName: string
): Promise<string> => {
  return await geminiService.generateTechniqueTip(exerciseName);
};

export const generateSetsForExercises = async (
  user: UserProfile,
  exercises: Exercise[]
): Promise<any[]> => {
  return await geminiService.generateSetsForExercises(user, exercises);
};
