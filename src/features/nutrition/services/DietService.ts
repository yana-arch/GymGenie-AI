import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, Recipe } from "@/types";

// Note: In a real production app, never expose API keys on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini Vision to identify food ingredients and suggest recipes.
 */
export const generateRecipesFromImage = async (base64Image: string, user: UserProfile): Promise<Recipe[]> => {
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
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
      const recipes = JSON.parse(response.text);
      return recipes.map((r: any) => ({ ...r, id: crypto.randomUUID() }));
    }
    return [];
  } catch (error) {
    console.error("Recipe API Error:", error);
    throw new Error("Failed to generate recipes.");
  }
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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