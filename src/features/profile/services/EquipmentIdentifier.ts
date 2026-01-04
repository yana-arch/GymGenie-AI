import { geminiService } from "@/services/ai/GeminiService";

/**
 * Uses Gemini Vision (Flash) to identify gym equipment from an image.
 */
export const identifyEquipment = async (
  base64Image: string
): Promise<string[]> => {
  return geminiService.identifyEquipment(base64Image);
};
