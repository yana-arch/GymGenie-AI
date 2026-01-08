import { WorkoutHistoryEntry } from '@/types';
import { EnhancedWorkoutSession } from '@/types/enhanced';

export type TimePeriod = 'Week' | 'Month' | 'Year' | 'All Time';

export interface StrengthGains {
  exerciseId: string;
  maxWeightTrend: { date: string; value: number }[];
  volumeTrend: { date: string; value: number }[];
}

export interface ConsistencyMetric {
  date: string;
  count: number;
}

export interface EnduranceMetrics {
  totalDuration: number;
  averageDuration: number;
  durationTrend: { date: string; value: number }[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Filter history by time period
   */
  public filterHistoryByPeriod(history: WorkoutHistoryEntry[], period: TimePeriod): WorkoutHistoryEntry[] {
    const now = new Date();
    let cutoffDate = new Date();

    switch (period) {
      case 'Week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'Month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'Year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'All Time':
        return history;
    }

    return history.filter(entry => new Date(entry.completedAt) >= cutoffDate);
  }

  /**
   * Calculate consistency (workouts per unit of time)
   */
  public calculateConsistency(history: WorkoutHistoryEntry[], period: TimePeriod): ConsistencyMetric[] {
    const filtered = this.filterHistoryByPeriod(history, period);
    const groups: Record<string, number> = {};

    filtered.forEach(entry => {
      const date = entry.completedAt.split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });

    return Object.entries(groups).map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate strength gains for a specific exercise
   */
  public calculateStrengthGains(
    sessions: Record<string, EnhancedWorkoutSession>, 
    exerciseId: string,
    period: TimePeriod = 'All Time'
  ): StrengthGains {
    const sessionIds = Object.keys(sessions).sort();
    const lastSessionUpdate = Math.max(...Object.values(sessions).map(s => s.updatedAt || s.completedTime || 0));
    const cacheKey = `strength-${exerciseId}-${period}-${sessionIds.length}-${lastSessionUpdate}`;
    
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    // 1. Filter by exercise first (efficient)
    let relevantSessions = Object.values(sessions)
      .filter(s => s.exerciseData && s.exerciseData[exerciseId]);

    // 2. Filter by period
    if (period !== 'All Time') {
      const now = Date.now();
      let cutoffMs = 0;
      switch (period) {
        case 'Week': cutoffMs = 7 * 24 * 60 * 60 * 1000; break;
        case 'Month': cutoffMs = 30 * 24 * 60 * 60 * 1000; break;
        case 'Year': cutoffMs = 365 * 24 * 60 * 60 * 1000; break;
      }
      const cutoffDate = now - cutoffMs;
      relevantSessions = relevantSessions.filter(s => (s.completedTime || s.startTime) >= cutoffDate);
    }

    // 3. Sort chronologically
    relevantSessions.sort((a, b) => (a.completedTime || a.startTime) - (b.completedTime || b.startTime));

    const maxWeightTrend = relevantSessions.map(s => {
      const data = s.exerciseData![exerciseId];
      const maxWeight = data.sets.length > 0 
        ? Math.max(...data.sets.map(set => set.weight || 0))
        : 0;
      return {
        date: new Date(s.completedTime || s.startTime).toISOString().split('T')[0],
        value: maxWeight
      };
    });

    const volumeTrend = relevantSessions.map(s => {
      const data = s.exerciseData![exerciseId];
      const volume = data.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
      return {
        date: new Date(s.completedTime || s.startTime).toISOString().split('T')[0],
        value: volume
      };
    });

    const result = { exerciseId, maxWeightTrend, volumeTrend };
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate endurance metrics
   */
  public calculateEndurance(history: WorkoutHistoryEntry[]): EnduranceMetrics {
    const totalDuration = history.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
    const averageDuration = history.length > 0 ? totalDuration / history.length : 0;
    
    const durationTrend = history.map(entry => ({
      date: entry.completedAt.split('T')[0],
      value: entry.durationMinutes || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { totalDuration, averageDuration, durationTrend };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}
