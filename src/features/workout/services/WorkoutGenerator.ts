import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, WorkoutDay, Exercise, ExerciseDetails } from "@/types";

// Note: In a real production app, never expose API keys on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini Pro to generate a structured 4-week workout plan.
 */
export const generateWorkoutPlan = async (user: UserProfile, equipment: string[]): Promise<WorkoutPlan> => {
  try {
    // We request a 4-week plan. To save tokens and response time, we ask for a structured routine.
    const prompt = `
      Act as an elite Personal Trainer. Create a comprehensive **4-Week Progressive Workout Plan** for this user.
      
      User Profile:
      - Age: ${user.age}, Gender: ${user.gender}
      - BMI: ${user.bmi.toFixed(1)}
      - Goal: ${user.goal}
      - Injuries: ${user.injuries || 'None'}
      
      Available Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Bodyweight only'}
      
      Requirements:
      1. **Duration:** Exactly 4 Weeks.
      2. **Structure:** Each week must have 3-5 workout days and rest days.
      3. **Progression:** The difficulty should slightly increase week over week (Progressive Overload).
      4. **Safety:** Adapt exercises for any injuries.
      5. **Specificity:** Return specific sets, reps, and rest times.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Name of the monthly program" },
        description: { type: Type.STRING, description: "Overview of the 4-week goal" },
        weeks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              weekNumber: { type: Type.INTEGER },
              focus: { type: Type.STRING, description: "Main focus of this week (e.g. Volume, Strength)" },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayName: { type: Type.STRING, description: "e.g. Monday, Tuesday" },
                    title: { type: Type.STRING, description: "e.g. Push Day, Active Recovery" },
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
      required: ["title", "description", "weeks"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No response from AI");

    const data = JSON.parse(response.text);
    
    // Process and hydrate with IDs
    return {
      id: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      title: data.title,
      description: data.description,
      totalDurationWeeks: data.weeks.length,
      weeks: data.weeks.map((week: any) => ({
        ...week,
        id: crypto.randomUUID(),
        days: week.days.map((day: any) => ({
          ...day,
          id: crypto.randomUUID(),
          exercises: day.exercises.map((ex: any) => ({
            ...ex,
            id: crypto.randomUUID(),
            isCompleted: false
          }))
        }))
      }))
    };

  } catch (error) {
    console.error("Planning API Error:", error);
    throw new Error("Failed to generate workout plan.");
  }
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  try {
    const prompt = `
      You are an elite Personal Trainer. Modify this specific Workout Day based on the User's Request.
      
      User Profile: Goal: ${user.goal}, Injuries: ${user.injuries || 'None'}
      User Request: "${userRequest}"
      
      Current Day Structure (JSON):
      ${JSON.stringify(currentDay)}
      
      Instructions:
      1. Keep the 'dayName' and 'id' exactly the same.
      2. Update 'title', 'isRestDay', and 'exercises' based on the request.
      3. If the user asks to make it easier/harder, adjust sets/reps/rest.
      4. If the user asks to swap exercises, provide suitable alternatives.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
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
      required: ["id", "dayName", "title", "isRestDay", "exercises"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No response from AI");

    const data = JSON.parse(response.text);

    // Hydrate new exercises with IDs
    return {
      ...data,
      exercises: data.exercises.map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID(),
        isCompleted: false
      }))
    };

  } catch (error) {
    console.error("Modify API Error:", error);
    throw new Error("Failed to modify workout day.");
  }
};

/**
 * Fetches detailed instructions for a specific exercise.
 */
export const getExerciseDetails = async (exerciseName: string): Promise<ExerciseDetails> => {
  try {
    const prompt = `
      Provide a concise, professional guide for the exercise: "${exerciseName}".
      Target Audience: Gym beginner.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        targetMuscles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Primary muscle groups worked" },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 step-by-step execution instructions" },
        commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 common form errors to avoid" },
        proTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 tips for better activation or safety" }
      },
      required: ["targetMuscles", "instructions", "commonMistakes", "proTips"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No details returned");
    return JSON.parse(response.text) as ExerciseDetails;

  } catch (error) {
    console.error("Exercise Details API Error:", error);
    throw new Error("Failed to get exercise details.");
  }
};

/**
 * Swaps a single exercise for an alternative based on available equipment.
 */
export const swapExercise = async (
  currentExerciseName: string, 
  availableEquipment: string[]
): Promise<Omit<Exercise, 'id' | 'isCompleted'>> => {
  try {
    const prompt = `
      The user wants to SWAP the exercise "${currentExerciseName}" for something else.
      Available Equipment: ${availableEquipment.length > 0 ? availableEquipment.join(', ') : 'Bodyweight only'}.
      
      Task: Suggest ONE alternative exercise that hits the same muscle group but uses available equipment.
      Return the result in JSON format matching the schema.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        sets: { type: Type.INTEGER },
        reps: { type: Type.STRING },
        restSeconds: { type: Type.INTEGER },
        notes: { type: Type.STRING, description: "Why this is a good alternative" }
      },
      required: ["name", "sets", "reps", "restSeconds", "notes"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No alternative found");
    return JSON.parse(response.text);

  } catch (error) {
    console.error("Swap Exercise API Error:", error);
    throw new Error("Failed to swap exercise.");
  }
};