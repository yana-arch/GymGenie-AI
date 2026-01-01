import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WorkoutAnalysis } from "@/types";

// Note: In a real production app, never expose API keys on the client side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWorkoutSession = async (
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return {
        score: 7,
        mood: "Balanced",
        summary: "Good effort overall.",
        advice: "Keep consistent pace.",
        strengths: [],
        improvements: [],
        nextWorkoutRecommendations: []
    };

  } catch (e) {
      console.error(e);
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