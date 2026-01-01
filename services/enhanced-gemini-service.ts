import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from 'zod';
import { UserProfile, WorkoutPlan, WorkoutDay, Exercise, WorkoutAnalysis, Recipe } from "../types";
import {
  ApiResponseValidator,
  ValidatedApiHandlers,
  ApiValidationErrorHandler,
  ValidationError
} from "./api-validation";
import { StorageService } from "./storageService";

export const getAiClient = () => {
  const config = StorageService.getAiConfig();
  
  // Use custom config if available and valid
  if (config && config.apiKey) {
    const clientOptions: any = { apiKey: config.apiKey };
    
    // Handle Custom Base URL (Proxy)
    if (config.useCustomUrl && config.customUrl) {
      // The @google/genai SDK uses 'httpOptions' for base URL configuration
      // We need to set baseUrl inside httpOptions, and also ensure apiVersion is set if needed
      clientOptions.httpOptions = {
        baseUrl: config.customUrl.replace(/\/+$/, ""), // Remove trailing slash
        apiVersion: 'v1beta' // Default version, can be made configurable if needed
      };
    }
    
    return new GoogleGenAI(clientOptions);
  }
  
  // Fallback to env var
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getModelName = () => {
  const config = StorageService.getAiConfig();
  return config && config.model ? config.model : 'gemini-3-flash-preview';
};

/**
 * Enhanced version of identifyEquipmentWithValidation
 */
export const identifyEquipmentWithValidation = async (base64Image: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const model = getModelName();
    
    const response = await ai.models.generateContent({
      model: model,
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
      const rawData = JSON.parse(response.text);
      // Validate the API response
      return ValidatedApiHandlers.equipment(rawData);
    }
    return [];
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Equipment API validation error:", error.message);
      // Return empty array for validation failures
      return [];
    }
    console.error("Vision API Error:", error);
    throw new Error("Failed to identify equipment.");
  }
};

/**
 * Enhanced version of generateRecipesFromImage with API response validation
 */
export const generateRecipesFromImageWithValidation = async (base64Image: string, user: UserProfile): Promise<Recipe[]> => {
  try {
    const prompt = `
      Analyze the food ingredients in this image.
      Based on the ingredients found AND the user's profile below, suggest 3 healthy recipes.
      
      User Profile:
      - TDEE: ${user.tdee} calories
      - Goal: ${user.goal}
      
      Requirements:
      1. Recipes must use the detected ingredients as main components.
      2. Provide approximate macros (Protein, Carbs, Fat) and Calories.
      3. Keep cooking time under 45 minutes.
    `;

    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.INTEGER },
          protein: { type: Type.INTEGER },
          carbs: { type: Type.INTEGER },
          fats: { type: Type.INTEGER },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          cookingTimeMinutes: { type: Type.INTEGER }
        },
        required: ["name", "calories", "protein", "carbs", "fats", "ingredients", "instructions", "cookingTimeMinutes"]
      }
    };

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      // Validate the API response
      const validatedRecipes = ValidatedApiHandlers.recipes(rawData);
      
      // Add IDs to validated recipes
      return validatedRecipes.map((r: any) => ({ 
        ...r, 
        id: crypto.randomUUID() 
      }));
    }
    return [];
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Recipes API validation error:", error.message);
      // Return empty array for validation failures
      return [];
    }
    console.error("Recipe API Error:", error);
    throw new Error("Failed to generate recipes.");
  }
};

/**
 * Enhanced version of generateWorkoutPlan with API response validation
 */
export const generateWorkoutPlanWithValidation = async (user: UserProfile, equipment: string[]): Promise<WorkoutPlan> => {
  try {
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

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No response from AI");

    const rawData = JSON.parse(response.text);
    
    // Validate the API response
    const validatedPlan = ValidatedApiHandlers.workoutPlan(rawData);
    
    if (!validatedPlan) {
      throw new Error("Failed to validate workout plan response");
    }
    
    // Process and hydrate with IDs
    return {
      id: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      title: validatedPlan.title,
      description: validatedPlan.description,
      totalDurationWeeks: validatedPlan.weeks.length,
      weeks: validatedPlan.weeks.map((week: any) => ({
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
    if (error instanceof ValidationError) {
      console.error("Workout plan API validation error:", error.message);
      throw new Error("Failed to validate workout plan response. Please try again.");
    }
    console.error("Planning API Error:", error);
    throw new Error("Failed to generate workout plan.");
  }
};

/**
 * Enhanced version of modifyWorkoutDay with API response validation
 */
export const modifyWorkoutDayWithValidation = async (
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

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No response from AI");

    const rawData = JSON.parse(response.text);
    
    // Validate the API response
    const validatedDay = ApiResponseValidator.validateWorkoutDayResponse(rawData);

    // Hydrate new exercises with IDs
    return {
      ...validatedDay,
      id: validatedDay.id || crypto.randomUUID(), // Ensure id is present
      exercises: validatedDay.exercises.map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID(),
        isCompleted: false
      }))
    };

  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Modify workout day API validation error:", error.message);
      throw new Error("Failed to validate modified workout day. Please try again.");
    }
    console.error("Modify API Error:", error);
    throw new Error("Failed to modify workout day.");
  }
};

/**
 * Enhanced version of getExerciseDetails with API response validation
 */
export const getExerciseDetailsWithValidation = async (exerciseName: string): Promise<{
  targetMuscles: string[];
  instructions: string[];
  commonMistakes: string[];
  proTips: string[];
}> => {
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

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No details returned");
    
    const rawData = JSON.parse(response.text);
    
    // Validate the API response
    return ApiResponseValidator.validateExerciseDetailsResponse(rawData);

  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Exercise details API validation error:", error.message);
      throw new Error("Failed to validate exercise details. Please try again.");
    }
    console.error("Exercise Details API Error:", error);
    throw new Error("Failed to get exercise details.");
  }
};

/**
 * Enhanced version of swapExercise with API response validation
 */
export const swapExerciseWithValidation = async (
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

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("No alternative found");
    
    const rawData = JSON.parse(response.text);
    
    // Validate the API response
    return ApiResponseValidator.validateExerciseSwapResponse(rawData);

  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Swap exercise API validation error:", error.message);
      throw new Error("Failed to validate exercise swap. Please try again.");
    }
    console.error("Swap Exercise API Error:", error);
    throw new Error("Failed to swap exercise.");
  }
};

/**
 * Enhanced version of analyzeWorkoutSession with API response validation
 */
export const analyzeWorkoutSessionWithValidation = async (
  durationMinutes: number,
  completedCount: number,
  totalCount: number,
  averageGapSeconds: number
): Promise<WorkoutAnalysis> => {
  try {
    const prompt = `
      Analyze this workout session based on the metrics.
      
      Metrics:
      - Duration: ${durationMinutes} minutes
      - Exercises Completed: ${completedCount}/${totalCount}
      - Avg Rest/Gap between completion: ${averageGapSeconds} seconds
      
      Infer the user's "Mood" and "Attitude":
      - Very short gaps (<45s) might mean "Rushing" or "High Intensity".
      - Long gaps (>4 mins) might mean "Distracted" or "Powerlifting Rest".
      - Consistent medium gaps mean "In the Zone".
      - Low completion rate means "Giving Up".
      
      Return JSON:
      {
        "score": number (1-10 performance score),
        "mood": string (e.g., "Laser Focused", "Distracted", "Rushing", "Beast Mode"),
        "summary": string (1 sentence observation),
        "advice": string (1 sentence constructive advice for next time)
      }
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        mood: { type: Type.STRING },
        summary: { type: Type.STRING },
        advice: { type: Type.STRING }
      },
      required: ["score", "mood", "summary", "advice"]
    };

    const ai = getAiClient();
    const model = getModelName();

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      // Validate the API response with fallback handling
      return ValidatedApiHandlers.workoutAnalysis(rawData);
    }
    
    // Fallback if no response
    return ValidatedApiHandlers.workoutAnalysis({});

  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Workout analysis API validation error:", error.message);
      // Return fallback analysis for validation failures
      return ValidatedApiHandlers.workoutAnalysis({});
    }
    console.error("Workout analysis API Error:", error);
    // Return fallback analysis for other errors
    return {
      score: 5,
      mood: "Unknown",
      summary: "Workout completed.",
      advice: "Great job showing up.",
      strengths: [],
      improvements: [],
      nextWorkoutRecommendations: []
    };
  }
};

/**
 * Utility function to validate any API response with custom schema
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  errorContext: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `${errorContext} validation failed: ${error.message}`,
        error.issues[0]?.path?.join('.') || 'unknown',
        data,
        error.issues[0]?.message || 'unknown constraint'
      );
    }
    throw error;
  }
}