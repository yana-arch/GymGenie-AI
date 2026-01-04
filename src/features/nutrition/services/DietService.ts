import { UserProfile, Recipe } from "@/types";
import { geminiService } from "@/services/ai/GeminiService";

/**
 * Uses Gemini Vision to identify food ingredients and suggest recipes.
 * Delegates to the enhanced service with validation.
 */
export const generateRecipesFromImage = async (
  base64Image: string,
  user: UserProfile
): Promise<Recipe[]> => {
  return geminiService.generateRecipes(base64Image, user);
};

export const getMealSuggestions = async (
  user: UserProfile
): Promise<string[]> => {
  return geminiService.suggestMeals(user);
};
