import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from 'zod';
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

/**
 * Uses Gemini Pro to generate a structured 4-week workout plan.
 * Delegates to the enhanced service with validation.
 */
/**
 * Helper to match AI generated exercise names with our static registry
 * to enrich with metadata (images, IDs)
 */
const enrichPlanWithRegistry = (plan: WorkoutPlan): WorkoutPlan => {
    // Helper for fuzzy matching (very simple substring match for now)
    const findRegistryMatch = (name: string) => {
        const lowerName = name.toLowerCase();
        return exerciseRegistry.find(ex =>
            ex.name.toLowerCase() === lowerName ||
            ex.aliases.some(alias => alias.toLowerCase() === lowerName) ||
            ex.name.toLowerCase().includes(lowerName) ||
            lowerName.includes(ex.name.toLowerCase())
        );
    };

    return {
        ...plan,
        weeks: plan.weeks.map(week => ({
            ...week,
            days: week.days.map(day => ({
                ...day,
                exercises: day.exercises.map(exercise => {
                    const match = findRegistryMatch(exercise.name);
                    // We don't overwrite the ID if it's already a UUID from generation,
                    // but we might want to store the registry ID for reference.
                    // For now, let's keep the name from AI but maybe standardise it if matched?
                    // Actually, let's append the image URL if matched.
                    // Since Exercise type doesn't have image field yet, we rely on UI to look it up by name,
                    // OR we modify the Exercise type.
                    // Given we can't easily change types.ts globally right this second without reading it again,
                    // we will rely on the UI component (LiveWorkoutSession) to look up the registry based on name.
                    // However, we can at least standardise the NAME to match our registry if found.
                    
                    if (match) {
                        return {
                            ...exercise,
                            name: match.name // Standardise name
                        };
                    }
                    return exercise;
                })
            }))
        }))
    };
};

export const generateWorkoutPlan = async (user: UserProfile, equipment: string[]): Promise<WorkoutPlan> => {
  const plan = await generateWorkoutPlanWithValidation(user, equipment);
  return enrichPlanWithRegistry(plan);
};

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
