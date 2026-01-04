import { GoogleGenAI, Type, Schema } from "@google/genai";
// Removed duplicate import { z } from 'zod';
import { UserProfile, WorkoutPlan, WorkoutDay, Exercise, ExerciseDetails, WorkoutExercise } from "@/types";
import exerciseRegistry from "@/src/data/ExerciseRegistry.json";
import {
  generateWorkoutPlanWithValidation,
  modifyWorkoutDayWithValidation,
  getExerciseDetailsWithValidation,
  swapExerciseWithValidation,
  getAiClient,
  getModelName
} from "@/services/enhanced-gemini-service";
import { ExerciseSwapResponseSchema } from "@/services/api-validation";
import { exerciseCatalogService } from "./ExerciseCatalogService"; // Import ExerciseCatalogService
import { EnhancedWorkoutPlanSchema } from '@/src/types/schemas'; // Import schema for validation
import { z } from 'zod'; // Import z for safeParse

/**
 * Uses Gemini Pro to generate a structured 4-week workout plan.
 * Delegates to the enhanced service with validation.
 *
 * NOTE: The existing `generateWorkoutPlan` directly calls `generateWorkoutPlanWithValidation`.
 * We will introduce a new `generateWorkoutPlanWithAI` for the onboarding flow
 * that provides more direct control over the prompt and uses the enhanced schema.
 */

/**
 * Generates a multi-week workout plan using AI based on user profile.
 */
export const generateWorkoutPlanWithAI = async (
  user: UserProfile,
): Promise<WorkoutPlan> => {
  const ai = getAiClient();
  const model = getModelName();

  // Fetch all available exercise names and their primary muscle/equipment for context
  const allExercises = await exerciseCatalogService.getAllExercises();
  const exerciseSummary = allExercises.map(ex => ({
    name: ex.name,
    primaryMuscle: ex.primaryMuscle.join('/'),
    equipment: ex.equipment.join('/'),
    difficulty: ex.difficulty,
  }));

  const prompt = `
    You are a highly knowledgeable fitness coach AI. Your task is to create a comprehensive 4-week workout plan
    tailored to the user's profile and goals.

    User Profile:
    - Name: ${user.name}
    - Age: ${user.age}
    - Gender: ${user.gender}
    - Weight: ${user.weightKg}kg
    - Height: ${user.heightCm}cm
    - Goal: ${user.goal}
    - Equipment available: ${user.equipment?.join(', ') || 'None'}
    ${user.injuries ? `- Injuries/Considerations: ${user.injuries}` : ''}

    Workout Plan Requirements:
    - Create a 4-week plan.
    - Each week should have 7 days.
    - Design days with a clear focus (e.g., "Upper Body Strength", "Legs & Core", "Full Body", "Rest Day").
    - For each workout day (not rest days), include 4-7 exercises.
    - For each exercise, suggest appropriate sets (e.g., 3-4), reps (e.g., "8-12", "10-15"), and rest time in seconds (e.g., 60, 90, 120).
    - Include concise "notes" for each exercise with progressive overload suggestions or technique tips.
    - Ensure variety and progression across the weeks.
    - Consider the user's available equipment. You CAN suggest bodyweight exercises if no equipment is specified.
    - You MAY suggest exercises not explicitly in the provided list, but prioritize common and effective ones.

    Available Exercise Information (as a guide, not exhaustive):
    ${JSON.stringify(exerciseSummary.slice(0, 50), null, 2)}
    ... (truncated for brevity, focus on common exercise types)

    Return the entire 4-week workout plan as a JSON object, adhering strictly to the WorkoutPlan schema.
    Do NOT include any introductory or concluding text, only the JSON.
  `;

  // Define Gemini API compatible schema
  const workoutPlanSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Name of the workout plan" },
      description: { type: Type.STRING, description: "Description of the 4-week plan" },
      weeks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            weekNumber: { type: Type.INTEGER, description: "Week number (1-4)" },
            focus: { type: Type.STRING, description: "Main focus for this week" },
            phase: { type: Type.STRING, description: "Training phase (Build, Cut, etc.)" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING, description: "Name of the day (e.g., Monday, Day 1)" },
                  title: { type: Type.STRING, description: "Title of the workout day" },
                  isRestDay: { type: Type.BOOLEAN, description: "Whether this is a rest day" },
                  focus: { type: Type.STRING, description: "Focus of the workout" },
                  estimatedDuration: { type: Type.INTEGER, description: "Estimated duration in minutes" },
                  targetCalories: { type: Type.INTEGER, description: "Target calories to burn" },
                  difficulty: { type: Type.STRING, description: "Difficulty level" },
                  warmupExercises: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Warmup exercises" },
                  cooldownExercises: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Cooldown exercises" },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Exercise name" },
                        sets: { type: Type.INTEGER, description: "Number of sets" },
                        reps: { type: Type.STRING, description: "Reps specification" },
                        restSeconds: { type: Type.INTEGER, description: "Rest time in seconds" },
                        notes: { type: Type.STRING, description: "Notes and tips" }
                      },
                      required: ["name", "sets", "reps", "restSeconds", "notes"]
                    }
                  },
                  state: { type: Type.STRING, description: "State of the day" }
                },
                required: ["dayName", "title", "isRestDay", "focus", "estimatedDuration", "targetCalories", "difficulty", "warmupExercises", "cooldownExercises", "exercises", "state"]
              }
            },
            progressMetrics: {
              type: Type.OBJECT,
              properties: {
                totalWorkouts: { type: Type.INTEGER },
                completedWorkouts: { type: Type.INTEGER },
                averageRpe: { type: Type.NUMBER },
                totalVolume: { type: Type.NUMBER }
              },
              required: ["totalWorkouts", "completedWorkouts", "averageRpe", "totalVolume"]
            }
          },
          required: ["weekNumber", "focus", "phase", "days", "progressMetrics"]
        }
      }
    },
    required: ["title", "description", "weeks"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: workoutPlanSchema
      }
    });

    // Extract text from the response parts
    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI response was empty.");
    }

    const parsedResponse = JSON.parse(responseText);

    // Validate with Zod schema - use partial or custom validation since AI output doesn't include IDs/Timestamps
    // We will validate the structure but handle the conversion to the enhanced schema manually
    const validatedPlan = parsedResponse;

    // Post-processing: Enrich with actual exercise IDs from ExerciseRegistry if possible
    // This is a simplified version; a more robust matching would be needed for production
    // Post-processing: Enrich with actual exercise IDs from ExerciseRegistry if possible
    // This is a simplified version; a more robust matching would be needed for production
    const enrichWithRegistryIds = (plan: any): WorkoutPlan => {
      const registryMap = new Map<string, Exercise>();
      allExercises.forEach(ex => registryMap.set(ex.name.toLowerCase(), ex));

      return {
        id: crypto.randomUUID(),
        title: plan.title || "My Workout Plan",
        description: plan.description || "Custom AI generated workout plan",
        generatedAt: new Date().toISOString(),
        totalDurationWeeks: plan.weeks?.length || 4,
        weeks: (plan.weeks || []).map((week: any, weekIndex: number) => ({
          id: crypto.randomUUID(),
          weekNumber: week.weekNumber || weekIndex + 1,
          focus: week.focus || "General Fitness",
          days: (week.days || []).map((day: any) => ({
            id: crypto.randomUUID(),
            dayName: day.dayName || "Day",
            title: day.title || "Workout",
            isRestDay: !!day.isRestDay,
            exercises: (day.exercises || []).map((exercise: any) => {
              const matchedExercise = registryMap.get(exercise.name.toLowerCase());
              return {
                id: matchedExercise ? matchedExercise.id : crypto.randomUUID(),
                name: exercise.name,
                sets: exercise.sets || 3,
                reps: exercise.reps || "8-12",
                restSeconds: exercise.restSeconds || 60,
                notes: exercise.notes || "",
                isCompleted: false,
              };
            })
          }))
        }))
      };
    };

    return enrichWithRegistryIds(validatedPlan);
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    // Fallback: Return a simple default plan
    // This needs to be robust for a real application
    return {
      id: crypto.randomUUID(),
      title: "Default 4-Week Plan",
      description: "A generic plan for muscle gain.",
      generatedAt: new Date().toISOString(),
      totalDurationWeeks: 4,
      weeks: Array.from({ length: 4 }, (_, i) => ({
        id: crypto.randomUUID(),
        weekNumber: i + 1,
        focus: "Full Body Strength",
        phase: "Build", // Assuming default phase
        days: Array.from({ length: 7 }, (_, j) => ({
          id: crypto.randomUUID(),
          dayName: `Day ${j + 1}`,
          title: j < 3 ? "Full Body Workout" : "Rest Day",
          isRestDay: j >= 3,
          focus: j < 3 ? "Strength" : "Recovery",
          estimatedDuration: j < 3 ? 60 : 0,
          targetCalories: j < 3 ? 300 : 0,
          difficulty: "intermediate",
          warmupExercises: [],
          cooldownExercises: [],
          exercises: j < 3 ? [
            { id: crypto.randomUUID(), name: "Squats", sets: 3, reps: "8-12", restSeconds: 90, notes: "Focus on form", isCompleted: false },
            { id: crypto.randomUUID(), name: "Push-ups", sets: 3, reps: "AMRAP", restSeconds: 60, notes: "Chest & Triceps", isCompleted: false },
          ] : [],
          state: "pending",
        })),
        progressMetrics: {
          totalWorkouts: 0,
          completedWorkouts: 0,
          averageRpe: 0,
          totalVolume: 0,
          strengthGains: {},
        }
      }))
    };
  }
};

// The original generateWorkoutPlan can be kept or removed/refactored
export const generateWorkoutPlan = async (user: UserProfile, equipment: string[]): Promise<WorkoutPlan> => {
  // This might need to be refactored to use the new generateWorkoutPlanWithAI
  // or if it serves a different purpose. For now, keeping it as is.
  const plan = await generateWorkoutPlanWithValidation(user, equipment);
  // return enrichPlanWithRegistry(plan); // Original enrichPlanWithRegistry is now deprecated/replaced by generateWorkoutPlanWithAI's internal logic
  return plan; // Returning raw plan as enrichment is handled by the new AI function
};

// Original enrichPlanWithRegistry is now effectively superseded by generateWorkoutPlanWithAI's logic
// It might be removed or refactored if no other parts of the app use it directly.
// For now, commenting it out to avoid confusion if it's no longer intended for use with current flow.
/*
const enrichPlanWithRegistry = (plan: WorkoutPlan): WorkoutPlan => {
    // ... original implementation ...
};
*/

/**
 * Smart Progressive Overload: Modifies future weeks based on user RPE feedback.
 */
export const adjustPlanProgressively = async (
  currentPlan: WorkoutPlan,
  completedDay: WorkoutDay,
  completedWeekNumber: number,
  rpe: number
): Promise<WorkoutPlan> => {
  try {
    // Only proceed if it was too easy (RPE < 6) or too hard (RPE > 9, though usually users self-regulate down)
    // Here we focus on Progressive Overload (making it harder)
    if (rpe >= 6) return currentPlan;

    const prompt = `
      The user just completed the workout day "${completedDay.title}" (Week ${completedWeekNumber}) and rated it as TOO EASY (RPE ${rpe}/10).
      
      Task: Apply "Progressive Overload" to the REMAINING weeks of this plan to ensure they continue to make progress.
      
      Instructions:
      1. Look at the provided full plan.
      2. Identify future instances of this specific day type (e.g. if today was "Leg Day", find "Leg Day" in Week ${completedWeekNumber + 1}, etc).
      3. Increase the difficulty for those FUTURE days ONLY.
         - Increase Sets slightly OR
         - Increase Reps OR
         - Decrease Rest OR
         - Add a note to "Increase Weight"
      4. Return the COMPLETE updated plan in JSON.
    `;

    // To save context window, we might strip completed items, but for simplicity/accuracy with Flash, we send the whole plan structure.
    // We remove IDs to save tokens, we will map them back or generate new ones.
    const cleanPlan = {
       title: currentPlan.title,
       weeks: currentPlan.weeks.map(w => ({
          weekNumber: w.weekNumber,
          days: w.days.map(d => ({
             dayName: d.dayName,
             title: d.title,
             isRestDay: d.isRestDay,
             exercises: d.exercises.map(e => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                restSeconds: e.restSeconds,
                notes: e.notes
             }))
          }))
       }))
    };

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekNumber: { type: Type.INTEGER },
                focus: { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayName: { type: Type.STRING },
                      title: { type: Type.STRING },
                      isRestDay: { type: Type.BOOLEAN },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            sets: { type: Type.INTEGER },
                            reps: { type: Type.STRING },
                            restSeconds: { type: Type.INTEGER },
                            notes: { type: Type.STRING }
                          },
                          required: ["name", "sets", "reps", "restSeconds", "notes"]
                        }
                      }
                    },
                    required: ["dayName", "title", "isRestDay", "exercises"]
                  }
                }
              },
              required: ["weekNumber", "focus", "days"]
            }
          }
        },
        required: ["weeks"]
      };

    const ai = getAiClient();
    const model = getModelName();
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
          parts: [
              { text: prompt },
              { text: `Current Plan JSON: ${JSON.stringify(cleanPlan)}` }
          ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) return currentPlan;
    
    const data = JSON.parse(response.text);

    // Merge logic: We need to preserve the IDs of the existing plan to avoid React key issues and lost progress.
    // However, since we are updating future weeks, we can technically replace the future week objects.
    // A safer bet is to reconstruct the plan using the new data but keeping old IDs where possible, 
    // OR just generate new IDs for the future weeks.
    
    // Let's create a deep copy of the current plan
    const updatedPlan: WorkoutPlan = JSON.parse(JSON.stringify(currentPlan));
    
    // Iterate and update
    data.weeks.forEach((newWeek: any, wIndex: number) => {
        // Only update future weeks or the current week if we really wanted to (but usually user is done with current week)
        // The prompt asked to update "Remaining weeks".
        
        if (wIndex >= updatedPlan.weeks.length) return; // Safety
        
        const existingWeek = updatedPlan.weeks[wIndex];
        
        newWeek.days.forEach((newDay: any, dIndex: number) => {
             if (dIndex >= existingWeek.days.length) return;
             
             const existingDay = existingWeek.days[dIndex];
             
             // If we are in a future week (relative to completed), OR same week but later day (unlikely for specific day update)
             if (newWeek.weekNumber > completedWeekNumber) {
                 // Update exercises
                 existingDay.exercises = newDay.exercises.map((ex: any) => ({
                     ...ex,
                     id: crypto.randomUUID(), // New ID for modified exercise
                     isCompleted: false
                 }));
                 // Update title/focus if changed
                 existingDay.title = newDay.title;
             }
        });
        
        if (newWeek.weekNumber > completedWeekNumber) {
            existingWeek.focus = newWeek.focus;
        }
    });

    return updatedPlan;

  } catch (error) {
    console.error("Progressive Overload API Error:", error);
    // If it fails, return original plan without crashing
    return currentPlan;
  }
};

/**
 * Modifies a specific workout day based on user request.
 */
export const modifyWorkoutDay = async (
  currentDay: WorkoutDay,
  userRequest: string,
  user: UserProfile
): Promise<WorkoutDay> => {
  return modifyWorkoutDayWithValidation(currentDay, userRequest, user);
};

/**
 * Fetches detailed instructions for a specific exercise.
 */
export const getExerciseDetails = async (exerciseName: string): Promise<ExerciseDetails> => {
  return getExerciseDetailsWithValidation(exerciseName);
};

/**
 * Swaps a single exercise for an alternative based on available equipment.
 */
export const swapExercise = async (
  currentExerciseName: string,
  availableEquipment: string[]
): Promise<z.infer<typeof ExerciseSwapResponseSchema>> => {
  return swapExerciseWithValidation(currentExerciseName, availableEquipment);
};

/**
 * Generates a concise technique tip for a specific exercise using AI.
 */
export const generateTechniqueTip = async (exerciseName: string): Promise<string> => {
  const ai = getAiClient();
  const model = getModelName();

  const prompt = `
    Give me a very concise (max 2 sentences) technique tip for the exercise: "${exerciseName}".
    Focus on safety and maximum muscle engagement.
    Return only the tip text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    return response.text.trim();
  } catch (error) {
    console.error("AI Technique Tip Error:", error);
    return "Focus on controlled movement and full range of motion.";
  }
};

/**
 * Generates suggested sets, reps, and rest times for a list of exercises using AI.
 */
export const generateSetsForExercises = async (
  user: UserProfile,
  exercises: Exercise[]
): Promise<WorkoutExercise[]> => {
  if (exercises.length === 0) return [];

  const ai = getAiClient();
  const model = getModelName();

  const prompt = `
    Based on the user's profile and the provided list of exercises, suggest appropriate sets, reps, and rest times for a single workout day.
    
    User Profile:
    - Age: ${user.age}
    - Gender: ${user.gender}
    - Weight: ${user.weightKg}kg
    - Height: ${user.heightCm}cm
    - Goal: ${user.goal}
    - Equipment: ${user.equipment?.join(', ') || 'None'}
    ${user.injuries ? `- Injuries: ${user.injuries}` : ''}

    Exercises for the day:
    ${exercises.map(ex => `- ${ex.name} (Primary Muscle: ${ex.primaryMuscle.join('/')}, Equipment: ${ex.equipment.join('/')})`).join('\n')}

    Provide the output as a JSON array of exercises, each with suggested sets, reps, and restSeconds.
    Ensure 'id', 'name', 'sets', 'reps', 'restSeconds', 'notes' and 'isCompleted' are present.
    For 'notes', provide concise progressive overload suggestions (e.g., "Increase weight next time").
    Do NOT include any additional text or markdown outside the JSON array.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        sets: { type: Type.INTEGER },
        reps: { type: Type.STRING },
        restSeconds: { type: Type.INTEGER },
        notes: { type: Type.STRING },
        isCompleted: { type: Type.BOOLEAN },
      },
      required: ["id", "name", "sets", "reps", "restSeconds", "notes", "isCompleted"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const parsedResponse = JSON.parse(response.text);
    return parsedResponse.map((item: any) => ({
      ...item,
      id: exercises.find(ex => ex.name === item.name)?.id || crypto.randomUUID(), // Preserve original ID if possible
      isCompleted: false // Ensure it's false initially
    }));
  } catch (error) {
    console.error("AI Generate Sets API Error:", error);
    // Fallback: return exercises with default sets/reps
    return exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: 3,
      reps: '8-12',
      restSeconds: 60,
      notes: 'AI suggestion failed, default values.',
      isCompleted: false,
    }));
  }
};
