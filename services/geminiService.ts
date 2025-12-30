import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, WorkoutPlan, WorkoutDay } from "../types";

// Note: In a real production app, never expose API keys on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini Vision (Flash) to identify gym equipment from an image.
 */
export const identifyEquipment = async (base64Image: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this image and list all visible gym equipment. Return ONLY a JSON array of strings, e.g., [\"Dumbbells\", \"Treadmill\"]. If no equipment is found, return an empty array."
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Vision API Error:", error);
    throw new Error("Failed to identify equipment.");
  }
};

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

export interface ExerciseDetails {
  targetMuscles: string[];
  instructions: string[];
  commonMistakes: string[];
  proTips: string[];
}

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