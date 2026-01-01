import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, WorkoutDay, Exercise, ExerciseDetails } from "@/types";
import {
  generateWorkoutPlanWithValidation,
  modifyWorkoutDayWithValidation,
  getExerciseDetailsWithValidation,
  swapExerciseWithValidation,
  getAiClient,
  getModelName
} from "@/services/enhanced-gemini-service";

/**
 * Uses Gemini Pro to generate a structured 4-week workout plan.
 * Delegates to the enhanced service with validation.
 */
export const generateWorkoutPlan = async (user: UserProfile, equipment: string[]): Promise<WorkoutPlan> => {
  return generateWorkoutPlanWithValidation(user, equipment);
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
): Promise<Omit<Exercise, 'id' | 'isCompleted'>> => {
  return swapExerciseWithValidation(currentExerciseName, availableEquipment);
};