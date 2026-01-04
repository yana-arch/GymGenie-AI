import { WorkoutAnalysis } from "@/types";
import { geminiService } from "@/services/ai/GeminiService";

export const analyzeWorkoutSession = async (
  durationMinutes: number,
  completedCount: number,
  totalCount: number,
  averageGapSeconds: number
): Promise<WorkoutAnalysis> => {
  return geminiService.analyzeWorkoutSession(
    durationMinutes,
    completedCount,
    totalCount,
    averageGapSeconds
  );
};
