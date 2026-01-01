import { WorkoutPlan, WorkoutHistoryEntry } from '@/types';

export interface SequenceValidationResult {
  allowed: boolean;
  reason?: string;
  previousDay?: {
    weekId: string;
    dayId: string;
    title: string;
  };
}

export class SessionSequenceValidator {
  /**
   * Validate if the user is allowed to start the target day based on their history
   */
  static validateSequence(
    currentPlan: WorkoutPlan,
    history: WorkoutHistoryEntry[],
    targetWeekId: string,
    targetDayId: string
  ): SequenceValidationResult {
    // 1. Flatten the plan to get a linear sequence of days
    const flatDays: Array<{
      weekId: string;
      dayId: string;
      weekNumber: number;
      dayTitle: string;
      isRestDay: boolean;
    }> = [];

    // Sort weeks by number to ensure correct order
    const sortedWeeks = [...currentPlan.weeks].sort((a, b) => a.weekNumber - b.weekNumber);

    for (const week of sortedWeeks) {
      for (const day of week.days) {
        flatDays.push({
          weekId: week.id,
          dayId: day.id,
          weekNumber: week.weekNumber,
          dayTitle: day.title,
          isRestDay: day.isRestDay
        });
      }
    }

    // 2. Find index of target day
    const targetIndex = flatDays.findIndex(d => d.weekId === targetWeekId && d.dayId === targetDayId);

    if (targetIndex === -1) {
      // Target day not found in plan? Allow it but log warning (or block)
      return { allowed: true }; 
    }

    if (targetIndex === 0) {
      // First day of plan is always allowed
      return { allowed: true };
    }

    // 3. Check previous day
    // We walk backwards from targetIndex to find the first non-rest day (if we want to skip rest days check)
    // Or strictly check previous day even if it is rest day?
    // Usually validation applies to Workout Days. Rest days might not generate history entries.
    
    let previousWorkoutIndex = targetIndex - 1;
    while (previousWorkoutIndex >= 0 && flatDays[previousWorkoutIndex].isRestDay) {
      previousWorkoutIndex--;
    }

    if (previousWorkoutIndex < 0) {
      return { allowed: true }; // No previous actual workout found
    }

    const previousDay = flatDays[previousWorkoutIndex];

    // 4. Check if previous day exists in history
    // We match by weekNumber and dayTitle (or Day ID if we tracked it in history properly)
    // WorkoutHistoryEntry has weekNumber and dayTitle.
    // Ideally history should store dayId and weekId for precise matching.
    // Assuming history stores enough info.

    const isPrevCompleted = history.some(h => {
      // Match by plan title (optional, if user has multiple plans)
      // Match by week number and day title
      // This is a loose match. Ideally we'd match IDs. 
      // If history doesn't have IDs, we rely on weekNumber + dayTitle uniqueness.
      return (
        h.weekNumber === previousDay.weekNumber && 
        (h.dayTitle === previousDay.dayTitle || h.dayName === previousDay.dayTitle) && // Handling potential naming variations
        h.exercisesCompleted > 0 // Ensure it wasn't just an empty log
      );
    });

    if (!isPrevCompleted) {
      return {
        allowed: false,
        reason: `You haven't completed the previous workout: ${previousDay.dayTitle} (Week ${previousDay.weekNumber}). For best results, follow the plan order.`,
        previousDay: {
          weekId: previousDay.weekId,
          dayId: previousDay.dayId,
          title: previousDay.dayTitle
        }
      };
    }

    return { allowed: true };
  }
}