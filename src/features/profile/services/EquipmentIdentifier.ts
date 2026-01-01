import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getAiClient, getModelName } from "@/services/enhanced-gemini-service";

/**
 * Uses Gemini Vision (Flash) to identify gym equipment from an image.
 */
export const identifyEquipment = async (base64Image: string): Promise<string[]> => {
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
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Vision API Error:", error);
    throw new Error("Failed to identify equipment.");
  }
};