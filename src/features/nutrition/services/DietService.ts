import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, Recipe } from "@/types";
import {
  generateRecipesFromImageWithValidation,
  getAiClient,
  getModelName
} from "@/services/enhanced-gemini-service";

/**
 * Uses Gemini Vision to identify food ingredients and suggest recipes.
 * Delegates to the enhanced service with validation.
 */
export const generateRecipesFromImage = async (base64Image: string, user: UserProfile): Promise<Recipe[]> => {
  return generateRecipesFromImageWithValidation(base64Image, user);
};

export const getMealSuggestions = async (user: UserProfile): Promise<string[]> => {
  try {
    const prompt = `
      Based on the user's profile, suggest 3 simple, healthy meal ideas (e.g., "Grilled Chicken Salad", "Oatmeal with Berries").
      User Profile:
      - TDEE: ${user.tdee} calories
      - Goal: ${user.goal}
      Return a simple JSON array of strings.
    `;
    const schema: Schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING }
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
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Meal Suggestion API Error:", error);
    return ["Could not fetch suggestions."];
  }
};