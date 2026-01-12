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
import { privacyValidationService } from "../privacy/PrivacyValidationService";
import { performanceMonitoringService } from "../performance/PerformanceMonitoringService";
import { toast } from "@/components/ui/Toast";
import { EncryptionService } from "@/features/privacy/services/EncryptionService";
import { PrivacyShieldService } from "@/features/privacy/services/PrivacyShieldService";
import { PrivacyAuditService } from "@/features/privacy/services/PrivacyAuditService";
import { recordSanitization, addAuditEntry } from "@/features/privacy/store/privacySlice";
import { DataCategories } from "@/features/privacy/types/privacy.types";
import { v4 as uuidv4 } from "uuid";
import { healthService } from "../HealthService";

// Schemas for AI Generation (Google GenAI SDK)
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

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI;
  private model: string;
  private privacyShield: PrivacyShieldService;

  // Circuit Breaker State
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT = 30000; // 30 seconds

  private constructor() {
    this.refreshConfig();
    this.privacyShield = new PrivacyShieldService(
      EncryptionService.getInstance(),
      (categories: DataCategories | undefined) => this.handleSanitization(categories)
    );
  }

  private async handleSanitization(categories?: DataCategories) {
    const categoriesShared = categories ? Object.entries(categories).filter(([_, v]) => v).map(([k]) => k) : [];
    const categoriesProtected = categories ? Object.entries(categories).filter(([_, v]) => !v).map(([k]) => k) : [];

    // Use dynamic import to avoid circular dependency
    const { store } = await import('@/store');
    store.dispatch(recordSanitization({ categoriesShared, categoriesProtected }));
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public isCircuitOpen(): boolean {
    return this.circuitState === CircuitState.OPEN;
  }

  /**
   * Perform a lightweight health check to see if the API is responsive
   */
  public async checkHealth(): Promise<boolean> {
    if (!healthService.isOnline()) return false;
    try {
      // Use a very simple, fast model if possible or just a basic prompt
      await this.ai.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: "health check" }] }],
        config: {
          maxOutputTokens: 1,
        }
      });
      this.handleSuccess();
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkCircuit(): boolean {
    if (!healthService.isOnline()) return false;

    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.RESET_TIMEOUT) {
        this.circuitState = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }
    return true;
  }

  private handleSuccess() {
    if (this.circuitState !== CircuitState.CLOSED) {
      this.circuitState = CircuitState.CLOSED;
      this.failureCount = 0;
      healthService.setServiceStatus('available', null);
    }
  }

  private handleFailure(error: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    const isRateLimit = error?.status === 429 || error?.message?.includes('429');
    const isServerError = error?.status >= 500 || error?.message?.includes('500');

    if (this.failureCount >= this.FAILURE_THRESHOLD || isRateLimit || isServerError) {
      this.circuitState = CircuitState.OPEN;
      healthService.setServiceStatus('degraded', 'api');
    }
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
    return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  private getModelName(): string {
    const config = StorageService.getAiConfig();
    return config && config.model ? config.model : "gemini-2.0-flash-exp";
  }

  /**
   * Identify equipment from an image
   */
  public async identifyEquipment(base64Image: string): Promise<string[]> {
    if (!this.checkCircuit()) return [];
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
        this.handleSuccess();
        PrivacyAuditService.logAiInference(this.model, {
          injuryHistory: false,
          biologicalData: false,
          locationData: false,
          workoutPatterns: false,
          usageAnalytics: false,
        }, 'success', 'Equipment identification');
        const rawData = JSON.parse(response.text);
        return ValidatedApiHandlers.equipment(rawData);
      }
      return [];
    } catch (error) {
      this.handleFailure(error);
      console.error("Equipment Identification Error:", error);
      toast.error("Equipment Identification Failed", "Could not identify equipment from image. Please try again or enter manually.");
      return [];
    }
  }

  /**
   * Generate healthy recipes from an image
   */
  public async generateRecipes(
    base64Image: string,
    user: UserProfile,
    privacyCategories?: DataCategories
  ): Promise<Recipe[]> {
    if (!this.checkCircuit()) return [];
    try {
      const sanitizedUser = this.privacyShield.sanitizeForExternalUse(user, privacyCategories);
      const prompt = `
        Analyze the food ingredients in this image.
        Based on the ingredients found AND the user's profile below, suggest 3 healthy recipes.
        
        User Profile:
        - TDEE: ${sanitizedUser.tdee} calories
        - Goal: ${sanitizedUser.goal}
        
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
        this.handleSuccess();
        PrivacyAuditService.logAiInference(
          this.model, 
          privacyCategories || {
            injuryHistory: false,
            biologicalData: false,
            locationData: false,
            workoutPatterns: false,
            usageAnalytics: false,
          }, 
          'success', 
          'Recipe generation'
        );
        const rawData = JSON.parse(response.text);
        const validatedRecipes = ValidatedApiHandlers.recipes(rawData);
        return validatedRecipes.map((r: any) => ({
          ...r,
          id: crypto.randomUUID(),
        }));
      }
      return [];
    } catch (error) {
      this.handleFailure(error);
      console.error("Recipe Generation Error:", error);
      toast.error("Recipe Generation Failed", "Could not generate recipes. Please try again with different ingredients.");
      return [];
    }
  }

  /**
   * Generate a comprehensive workout plan
   */
  public async generateWorkoutPlan(
    user: UserProfile,
    equipment: string[],
    privacyCategories?: DataCategories
  ): Promise<WorkoutPlan> {
    if (!this.checkCircuit()) throw new Error("Service unavailable");
    try {
      const sanitizedUser = this.privacyShield.sanitizeForExternalUse(user, privacyCategories);
      const prompt = `
        Act as an elite Personal Trainer. Create a comprehensive **4-Week Progressive Workout Plan** for this user.
        
        User Profile:
        - Goal: ${sanitizedUser.goal}
        - Has Injuries: ${sanitizedUser.injuries ? "Yes" : "No"}
        
        Available Equipment: ${
          equipment.length > 0 ? equipment.join(", ") : "Bodyweight only"
        }
        
        Requirements:
        1. **Duration:** Exactly 4 Weeks.
        2. **Structure:** Each week must have 3-5 workout days and rest days.
        3. **Progression:** The difficulty should slightly increase week over week (Progressive Overload).
        4. **Safety:** Adapt exercises for safety if injuries are present.
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

      this.handleSuccess();
      PrivacyAuditService.logAiInference(
        this.model, 
        privacyCategories || {
          injuryHistory: false,
          biologicalData: false,
          locationData: false,
          workoutPatterns: false,
          usageAnalytics: false,
        }, 
        'success', 
        'Workout planning'
      );

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
      this.handleFailure(error);
      console.error("Workout Planning Error:", error);
      toast.error("Workout Planning Failed", "Could not generate workout plan. Please try again.");
      throw error;
    }
  }

  /**
   * Modify a specific workout day
   */
  public async modifyWorkoutDay(
    currentDay: WorkoutDay,
    userRequest: string,
    user: UserProfile,
    privacyCategories?: DataCategories
  ): Promise<WorkoutDay> {
    if (!this.checkCircuit()) throw new Error("Service unavailable");
    try {
      const sanitizedUser = this.privacyShield.sanitizeForExternalUse(user, privacyCategories);
      const prompt = `
        You are an elite Personal Trainer. Modify this specific Workout Day based on the User's Request.
        
        User Profile: Goal: ${sanitizedUser.goal}
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

      this.handleSuccess();
      PrivacyAuditService.logAiInference(
        this.model, 
        privacyCategories || {
          injuryHistory: false,
          biologicalData: false,
          locationData: false,
          workoutPatterns: false,
          usageAnalytics: false,
        }, 
        'success', 
        'Workout modification'
      );

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
      this.handleFailure(error);
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
    if (!this.checkCircuit()) throw new Error("Service unavailable");
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

      this.handleSuccess();
      const rawData = JSON.parse(response.text);
      return ApiResponseValidator.validateExerciseDetailsResponse(rawData);
    } catch (error) {
      this.handleFailure(error);
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
    if (!this.checkCircuit()) throw new Error("Service unavailable");
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

      this.handleSuccess();
      const rawData = JSON.parse(response.text);
      return ApiResponseValidator.validateExerciseSwapResponse(rawData);
    } catch (error) {
      this.handleFailure(error);
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
    overrideHistory?: Array<{
      type: string;
      userAction: string;
      reasoning: string;
      timestamp?: number;
      relativeTime?: string;
      timeBucket?: string;
    }>;
  }, privacyCategories?: DataCategories): Promise<any> {
    if (!this.checkCircuit()) return null;
    // Start performance monitoring
    const monitoring = performanceMonitoringService.startMonitoring(
      'GeminiService.generateWorkoutAdaptation', 
      'generateWorkoutAdaptation',
      JSON.stringify(context).length
    );

    try {
      const sanitizedContext = this.privacyShield.sanitizeForExternalUse(context, privacyCategories);

      const adaptation = await this.generateWorkoutAdaptationInternal(sanitizedContext);
      
      this.handleSuccess();
      PrivacyAuditService.logAiInference(
        this.model, 
        privacyCategories || {
          injuryHistory: false,
          biologicalData: false,
          locationData: false,
          workoutPatterns: false,
          usageAnalytics: false,
        }, 
        'success', 
        'Workout adaptation'
      );

      // Record successful performance metrics
      performanceMonitoringService.endMonitoring(
        monitoring.monitoringId,
        monitoring.startTime,
        true
      );
      
      return adaptation;
    } catch (error) {
      this.handleFailure(error);
      // Record failed performance metrics
      performanceMonitoringService.endMonitoring(
        monitoring.monitoringId,
        monitoring.startTime,
        false,
        error.toString()
      );
      
      throw error;
    }
  }

  private async generateWorkoutAdaptationInternal(context: any): Promise<any> {
    // Safety-first prompt with privacy preservation
    const safeContext = {
      energy: context.energy,
      time: context.time,
      currentExercise: context.currentExercise || 'current exercise',
      hasInjuries: context.userProfile?.injuries ? "Yes" : "No",
      goal: context.userProfile?.goal || 'general fitness',
      overrideHistory: context.overrideHistory || []
    };

    const overrideContext = safeContext.overrideHistory.length > 0 
      ? `\n      RECENT OVERRIDE HISTORY:\n      ${safeContext.overrideHistory.slice(-3).map((o: any) => 
        `User ${o.userAction} "${o.type}" recommendation: ${o.reasoning}`
      ).join('\n      ')}`
      : '';

    const prompt = `
      The user is in a workout session with this context:
      - Energy Level: ${safeContext.energy}
      - Time Constraint: ${safeContext.time}
      - Current Exercise: ${safeContext.currentExercise}
      - Has Injuries: ${safeContext.hasInjuries}
      - Fitness Goal: ${safeContext.goal}${overrideContext}

      CRITICAL SAFETY RULES:
      1. If energy is 'tired', ONLY suggest lower intensity or shorter duration
      2. If time is 'limited', ONLY suggest reducing sets/reps or shorter rest periods
      3. NEVER increase weight or difficulty when user reports fatigue
      4. If user has injuries, avoid exercises that stress those areas
      5. Always maintain movement quality over intensity
      6. CRITICAL: Respect override history - if user consistently overrides certain types of recommendations, avoid suggesting similar ones
      7. Apply conservative safety defaults after any user override pattern

      Return a JSON adaptation that PRIORITIZES SAFETY AND USER PREFERENCES:
      {
        "newExercise": "safer alternative (optional)",
        "newReps": number (optional, should be ≤ current reps if tired),
        "newSets": number (optional, should be ≤ current sets if tired),
        "restTime": number (optional, in seconds),
        "notes": "safety-focused explanation accounting for user preferences"
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
    if (!this.checkCircuit()) return ValidatedApiHandlers.workoutAnalysis({});
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
        this.handleSuccess();
        const rawData = JSON.parse(response.text);
        return ValidatedApiHandlers.workoutAnalysis(rawData);
      }

      return ValidatedApiHandlers.workoutAnalysis({});
    } catch (error) {
      this.handleFailure(error);
      console.error("Workout Analysis Error:", error);
      return ValidatedApiHandlers.workoutAnalysis({});
    }
  }

  /**
   * Generate sets, reps, and rest for a list of exercises
   */
  public async generateSetsForExercises(
    user: UserProfile,
    exercises: Exercise[],
    privacyCategories?: DataCategories
  ): Promise<any> {
    if (exercises.length === 0) return [];
    if (!this.checkCircuit()) return [];

    const sanitizedUser = this.privacyShield.sanitizeForExternalUse(user, privacyCategories);

    const prompt = `
        Based on the user's profile and the provided list of exercises, suggest appropriate sets, reps, and rest times for a single workout day.
        
        User Profile:
        - Age: ${sanitizedUser.age}
        - Gender: ${sanitizedUser.gender}
        - Weight: ${sanitizedUser.weightKg}kg
        - Goal: ${sanitizedUser.goal}
        
        Exercises:
        ${exercises.map((ex) => `- ${ex.name}`).join("\n")}

        Provide the output as a JSON array of exercises, each with suggested sets, reps, and restSeconds.
        Ensure 'id', 'name', 'sets', 'reps', 'restSeconds', 'notes' and 'isCompleted' are present.
        For 'notes', provide concise progressive overload suggestions.
    `;

    try {
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

      this.handleSuccess();
      PrivacyAuditService.logAiInference(
        this.model, 
        privacyCategories || {
          injuryHistory: false,
          biologicalData: false,
          locationData: false,
          workoutPatterns: false,
          usageAnalytics: false,
        }, 
        'success', 
        'Exercise set generation'
      );

      return JSON.parse(response.text);
    } catch (error) {
      this.handleFailure(error);
      console.error("Generate Sets Error:", error);
      return [];
    }
  }

  public async generateTechniqueTip(exerciseName: string): Promise<string> {
    if (!this.checkCircuit()) return "Focus on form.";
    const prompt = `
          Give me a very concise (max 2 sentences) technique tip for the exercise: "${exerciseName}".
          Focus on safety and maximum muscle engagement.
          Return only the tip text.
      `;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      });

      if (response.text) this.handleSuccess();
      return response.text ? response.text.trim() : "Focus on form.";
    } catch (error) {
      this.handleFailure(error);
      return "Focus on form.";
    }
  }

  /**
   * Generate natural language explanation for progress predictions
   */
  public async generatePredictionExplanation(prompt: string): Promise<string> {
    if (!this.checkCircuit()) return "Unable to generate explanation at this time.";
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      if (response.text) this.handleSuccess();
      return response.text ? response.text.trim() : "Unable to generate explanation at this time.";
    } catch (error) {
      this.handleFailure(error);
      console.error("Prediction Explanation Error:", error);
      return "Based on your current trend, keep up the consistency to reach your goals.";
    }
  }

  public async suggestMeals(user: UserProfile, privacyCategories?: DataCategories): Promise<string[]> {
    if (!this.checkCircuit()) return ["Could not fetch suggestions."];
    try {
      const sanitizedUser = this.privacyShield.sanitizeForExternalUse(user, privacyCategories);
      const prompt = `
        Based on the user's profile, suggest 3 simple, healthy meal ideas (e.g., "Grilled Chicken Salad", "Oatmeal with Berries").
        User Profile:
        - TDEE: ${sanitizedUser.tdee} calories
        - Goal: ${sanitizedUser.goal}
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
        this.handleSuccess();
        PrivacyAuditService.logAiInference(
          this.model, 
          privacyCategories || {
            injuryHistory: false,
            biologicalData: false,
            locationData: false,
            workoutPatterns: false,
            usageAnalytics: false,
          }, 
          'success', 
          'Meal suggestions'
        );
        return JSON.parse(response.text) as string[];
      }
      return [];
    } catch (error) {
      this.handleFailure(error);
      console.error("Meal Suggestion API Error:", error);
      return ["Could not fetch suggestions."];
    }
  }
}

export const geminiService = GeminiService.getInstance();
