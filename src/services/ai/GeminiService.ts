import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from "zod";
import {
  UserProfile,
  WorkoutPlan,
  WorkoutDay,
  Exercise,
  WorkoutAnalysis,
  Recipe,
  WorkoutExercise,
} from "@/types";
import {
  ApiResponseValidator,
  ValidatedApiHandlers,
  ApiValidationErrorHandler,
  ValidationError,
  ExerciseSwapResponseSchema,
  RecipeResponseSchema,
  WorkoutPlanResponseSchema,
  ExerciseDetailsResponseSchema,
  WorkoutAnalysisResponseSchema,
  EquipmentIdentificationResponseSchema,
} from "../api-validation";
import { StorageService } from "../storage/StorageService";

// Schemas for AI Generation (Google GenAI SDK)
// Recruited from enhanced-gemini-service.ts and AIGeneratorService.ts

const recipeSchema: Schema = {
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
      cookingTimeMinutes: { type: Type.INTEGER },
    },
    required: [
      "name",
      "calories",
      "protein",
      "carbs",
      "fats",
      "ingredients",
      "instructions",
      "cookingTimeMinutes",
    ],
  },
};

const workoutPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Name of the monthly program" },
    description: {
      type: Type.STRING,
      description: "Overview of the 4-week goal",
    },
    weeks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          weekNumber: { type: Type.INTEGER },
          focus: {
            type: Type.STRING,
            description: "Main focus of this week (e.g. Volume, Strength)",
          },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayName: {
                  type: Type.STRING,
                  description: "e.g. Monday, Tuesday",
                },
                title: {
                  type: Type.STRING,
                  description: "e.g. Push Day, Active Recovery",
                },
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
                      notes: { type: Type.STRING },
                    },
                    required: ["name", "sets", "reps", "restSeconds", "notes"],
                  },
                },
              },
              required: ["dayName", "title", "isRestDay", "exercises"],
            },
          },
        },
        required: ["weekNumber", "focus", "days"],
      },
    },
  },
  required: ["title", "description", "weeks"],
};

const workoutDaySchema: Schema = {
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
          notes: { type: Type.STRING },
        },
        required: ["name", "sets", "reps", "restSeconds", "notes"],
      },
    },
  },
  required: ["id", "dayName", "title", "isRestDay", "exercises"],
};

const exerciseDetailsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetMuscles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Primary muscle groups worked",
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 step-by-step execution instructions",
    },
    commonMistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 common form errors to avoid",
    },
    proTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "1-2 tips for better activation or safety",
    },
  },
  required: ["targetMuscles", "instructions", "commonMistakes", "proTips"],
};

const exerciseSwapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    sets: { type: Type.INTEGER },
    reps: { type: Type.STRING },
    restSeconds: { type: Type.INTEGER },
    notes: { type: Type.STRING, description: "Why this is a good alternative" },
  },
  required: ["name", "sets", "reps", "restSeconds", "notes"],
};

const workoutAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    mood: { type: Type.STRING },
    summary: { type: Type.STRING },
    advice: { type: Type.STRING },
  },
  required: ["score", "mood", "summary", "advice"],
};

const workoutExerciseSchema: Schema = {
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
    required: [
      "id",
      "name",
      "sets",
      "reps",
      "restSeconds",
      "notes",
      "isCompleted",
    ],
  },
};

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI;
  private model: string;

  private constructor() {
    this.refreshConfig();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public refreshConfig(): void {
    this.ai = this.getAiClient();
    this.model = this.getModelName();
  }

  private getAiClient(): GoogleGenAI {
    const config = StorageService.getAiConfig();

    // Use custom config if available and valid
    if (config && config.apiKey) {
      const clientOptions: any = { apiKey: config.apiKey };

      // Handle Custom Base URL (Proxy)
      if (config.useCustomUrl && config.customUrl) {
        clientOptions.httpOptions = {
          baseUrl: config.customUrl.replace(/\/+$/, ""), // Remove trailing slash
          apiVersion: "v1beta",
        };
      }

      return new GoogleGenAI(clientOptions);
    }

    // Fallback to env var (build time)
    // Note: In Vite, we should use import.meta.env, but trying process.env for compatibility with existing code
    return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  private getModelName(): string {
    const config = StorageService.getAiConfig();
    return config && config.model ? config.model : "gemini-2.0-flash-exp"; // Updated default model to faster one
  }

  /**
   * Identify equipment from an image
   */
  public async identifyEquipment(base64Image: string): Promise<string[]> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            {
              text: 'Analyze this image and list all visible gym equipment. Return ONLY a JSON array of strings, e.g., ["Dumbbells", "Treadmill"]. If no equipment is found, return an empty array.',
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      if (response.text) {
        const rawData = JSON.parse(response.text);
        return ValidatedApiHandlers.equipment(rawData);
      }
      return [];
    } catch (error) {
      console.error("Equipment Identification Error:", error);
      return [];
    }
  }

  /**
   * Generate healthy recipes from an image
   */
  public async generateRecipes(
    base64Image: string,
    user: UserProfile
  ): Promise<Recipe[]> {
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

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        },
      });

      if (response.text) {
        const rawData = JSON.parse(response.text);
        const validatedRecipes = ValidatedApiHandlers.recipes(rawData);
        return validatedRecipes.map((r: any) => ({
          ...r,
          id: crypto.randomUUID(),
        }));
      }
      return [];
    } catch (error) {
      console.error("Recipe Generation Error:", error);
      return [];
    }
  }

  /**
   * Generate a comprehensive workout plan
   */
  public async generateWorkoutPlan(
    user: UserProfile,
    equipment: string[]
  ): Promise<WorkoutPlan> {
    try {
      const prompt = `
        Act as an elite Personal Trainer. Create a comprehensive **4-Week Progressive Workout Plan** for this user.
        
        User Profile:
        - Age: ${user.age}, Gender: ${user.gender}
        - BMI: ${user.bmi.toFixed(1)}
        - Goal: ${user.goal}
        - Injuries: ${user.injuries || "None"}
        
        Available Equipment: ${
          equipment.length > 0 ? equipment.join(", ") : "Bodyweight only"
        }
        
        Requirements:
        1. **Duration:** Exactly 4 Weeks.
        2. **Structure:** Each week must have 3-5 workout days and rest days.
        3. **Progression:** The difficulty should slightly increase week over week (Progressive Overload).
        4. **Safety:** Adapt exercises for any injuries.
        5. **Specificity:** Return specific sets, reps, and rest times.
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: workoutPlanSchema,
        },
      });

      if (!response.text) throw new Error("No response from AI");

      const rawData = JSON.parse(response.text);
      const validatedPlan = ValidatedApiHandlers.workoutPlan(rawData);

      if (!validatedPlan) throw new Error("Validation failed");

      // Hydrate with IDs
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
              isCompleted: false,
            })),
          })),
        })),
      };
    } catch (error) {
      console.error("Workout Planning Error:", error);
      throw error;
    }
  }

  /**
   * Modify a specific workout day
   */
  public async modifyWorkoutDay(
    currentDay: WorkoutDay,
    userRequest: string,
    user: UserProfile
  ): Promise<WorkoutDay> {
    try {
      const prompt = `
        You are an elite Personal Trainer. Modify this specific Workout Day based on the User's Request.
        
        User Profile: Goal: ${user.goal}, Injuries: ${user.injuries || "None"}
        User Request: "${userRequest}"
        
        Current Day Structure (JSON):
        ${JSON.stringify(currentDay)}
        
        Instructions:
        1. Keep the 'dayName' and 'id' exactly the same.
        2. Update 'title', 'isRestDay', and 'exercises' based on the request.
        3. If the user asks to make it easier/harder, adjust sets/reps/rest.
        4. If the user asks to swap exercises, provide suitable alternatives.
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: workoutDaySchema,
        },
      });

      if (!response.text) throw new Error("No response from AI");

      const rawData = JSON.parse(response.text);
      const validatedDay =
        ApiResponseValidator.validateWorkoutDayResponse(rawData);

      return {
        ...validatedDay,
        id: validatedDay.id || crypto.randomUUID(),
        exercises: validatedDay.exercises.map((ex: any) => ({
          ...ex,
          id: crypto.randomUUID(),
          isCompleted: false,
        })),
      };
    } catch (error) {
      console.error("Modify Workout Day Error:", error);
      throw error;
    }
  }

  /**
   * Get details for a specific exercise
   */
  public async getExerciseDetails(exerciseName: string): Promise<{
    targetMuscles: string[];
    instructions: string[];
    commonMistakes: string[];
    proTips: string[];
  }> {
    try {
      const prompt = `
        Provide a concise, professional guide for the exercise: "${exerciseName}".
        Target Audience: Gym beginner.
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: exerciseDetailsSchema,
        },
      });

      if (!response.text) throw new Error("No details returned");

      const rawData = JSON.parse(response.text);
      return ApiResponseValidator.validateExerciseDetailsResponse(rawData);
    } catch (error) {
      console.error("Exercise Details Error:", error);
      throw error;
    }
  }

  /**
   * Swap an exercise for an alternative
   */
  public async swapExercise(
    currentExerciseName: string,
    availableEquipment: string[]
  ): Promise<z.infer<typeof ExerciseSwapResponseSchema>> {
    try {
      const prompt = `
        The user wants to SWAP the exercise "${currentExerciseName}" for something else.
        Available Equipment: ${
          availableEquipment.length > 0
            ? availableEquipment.join(", ")
            : "Bodyweight only"
        }.
        
        Task: Suggest ONE alternative exercise that hits the same muscle group but uses available equipment.
        Return the result in JSON format matching the schema.
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: exerciseSwapSchema,
        },
      });

      if (!response.text) throw new Error("No alternative found");

      const rawData = JSON.parse(response.text);
      return ApiResponseValidator.validateExerciseSwapResponse(rawData);
    } catch (error) {
      console.error("Exercise Swap Error:", error);
      throw error;
    }
  }

  public async generateWorkoutAdaptation(context: {
    energy: 'normal' | 'tired';
    time: 'normal' | 'limited';
    currentExercise?: string;
    userProfile?: {
      injuries?: string[];
      goal: string;
    };
  }): Promise<any> {
    // Safety-first prompt with privacy preservation
    const safeContext = {
      energy: context.energy,
      time: context.time,
      currentExercise: context.currentExercise || 'current exercise',
      hasInjuries: context.userProfile?.injuries && context.userProfile.injuries.length > 0,
      goal: context.userProfile?.goal || 'general fitness'
    };

    const prompt = `
      The user is in a workout session with this context:
      - Energy Level: ${safeContext.energy}
      - Time Constraint: ${safeContext.time}
      - Current Exercise: ${safeContext.currentExercise}
      - Has Injuries: ${safeContext.hasInjuries}
      - Fitness Goal: ${safeContext.goal}

      CRITICAL SAFETY RULES:
      1. If energy is 'tired', ONLY suggest lower intensity or shorter duration
      2. If time is 'limited', ONLY suggest reducing sets/reps or shorter rest periods
      3. NEVER increase weight or difficulty when user reports fatigue
      4. If user has injuries, avoid exercises that stress those areas
      5. Always maintain movement quality over intensity

      Return a JSON adaptation that PRIORITIZES SAFETY:
      {
        "newExercise": "safer alternative (optional)",
        "newReps": number (optional, should be ≤ current reps if tired),
        "newSets": number (optional, should be ≤ current sets if tired),
        "restTime": number (optional, in seconds),
        "notes": "safety-focused explanation"
      }
    `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("No adaptation returned");
    }

    const adaptation = JSON.parse(response.text);
    
    // Validate adaptation safety
    if (context.energy === 'tired') {
      if (adaptation.newReps && adaptation.newReps > 20) {
        throw new Error("Unsafe adaptation: too many reps for tired user");
      }
      if (adaptation.newSets && adaptation.newSets > 5) {
        throw new Error("Unsafe adaptation: too many sets for tired user");
      }
    }

    return adaptation;
  }

  /**
   * Analyze a completed workout session
   */
  public async analyzeWorkoutSession(
    durationMinutes: number,
    completedCount: number,
    totalCount: number,
    averageGapSeconds: number
  ): Promise<WorkoutAnalysis> {
    try {
      const prompt = `
        Analyze this workout session based on the metrics.
        
        Metrics:
        - Duration: ${durationMinutes} minutes
        - Exercises Completed: ${completedCount}/${totalCount}
        - Avg Rest/Gap between completion: ${averageGapSeconds} seconds
        
        Infer the user's "Mood" and "Attitude".
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: workoutAnalysisSchema,
        },
      });

      if (response.text) {
        const rawData = JSON.parse(response.text);
        return ValidatedApiHandlers.workoutAnalysis(rawData);
      }

      return ValidatedApiHandlers.workoutAnalysis({});
    } catch (error) {
      console.error("Workout Analysis Error:", error);
      return ValidatedApiHandlers.workoutAnalysis({});
    }
  }

  /**
   * Generate sets, reps, and rest for a list of exercises
   */
  public async generateSetsForExercises(
    user: UserProfile,
    exercises: Exercise[]
  ): Promise<any> {
    if (exercises.length === 0) return [];

    const prompt = `
        Based on the user's profile and the provided list of exercises, suggest appropriate sets, reps, and rest times for a single workout day.
        
        User Profile:
        - Age: ${user.age}
        - Gender: ${user.gender}
        - Weight: ${user.weightKg}kg
        - Goal: ${user.goal}
        
        Exercises:
        ${exercises.map((ex) => `- ${ex.name}`).join("\n")}

        Provide the output as a JSON array of exercises, each with suggested sets, reps, and restSeconds.
        Ensure 'id', 'name', 'sets', 'reps', 'restSeconds', 'notes' and 'isCompleted' are present.
        For 'notes', provide concise progressive overload suggestions.
    `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: workoutExerciseSchema,
      },
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  }

  public async generateTechniqueTip(exerciseName: string): Promise<string> {
    const prompt = `
          Give me a very concise (max 2 sentences) technique tip for the exercise: "${exerciseName}".
          Focus on safety and maximum muscle engagement.
          Return only the tip text.
      `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.text ? response.text.trim() : "Focus on form.";
  }
  public async suggestMeals(user: UserProfile): Promise<string[]> {
    try {
      const prompt = `
        Based on the user's profile, suggest 3 simple, healthy meal ideas (e.g., "Grilled Chicken Salad", "Oatmeal with Berries").
        User Profile:
        - TDEE: ${user.tdee} calories
        - Goal: ${user.goal}
        Return a simple JSON array of strings.
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as string[];
      }
      return [];
    } catch (error) {
      console.error("Meal Suggestion API Error:", error);
      return ["Could not fetch suggestions."];
    }
  }
}

export const geminiService = GeminiService.getInstance();
