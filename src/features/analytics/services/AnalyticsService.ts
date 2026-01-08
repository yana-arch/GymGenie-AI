import { WorkoutHistoryEntry } from '@/types';
import { EnhancedWorkoutSession } from '@/types/enhanced';

export type TimePeriod = 'Week' | 'Month' | 'Year' | 'All Time';

export type Trajectory = 'upward' | 'stable' | 'downward';

export interface TrendTrajectory {
  trajectory: Trajectory;
  slope: number;
  changePercentage: number;
}

export interface PlateauInfo {
  exerciseId: string;
  isPlateau: boolean;
  weeksStalled: number;
  currentValue: number;
  historicalMax: number;
}

export interface StrengthGains {
  exerciseId: string;
  maxWeightTrend: { date: string; value: number }[];
  volumeTrend: { date: string; value: number }[];
  repsTrend: { date: string; value: number }[];
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

const SLOPE_THRESHOLD = 0.01;
const DROP_THRESHOLD_PERCENT = 20;
const PLATEAU_WEEKS_THRESHOLD = 3;

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
  public filterHistoryByPeriod(history: WorkoutHistoryEntry[] | undefined, period: TimePeriod): WorkoutHistoryEntry[] {
    if (!history || !Array.isArray(history)) return [];
    
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

    return history.filter(entry => entry.completedAt && new Date(entry.completedAt) >= cutoffDate);
  }

  /**
   * Calculate consistency (workouts per unit of time)
   */
  public calculateConsistency(history: WorkoutHistoryEntry[] | undefined, period: TimePeriod): ConsistencyMetric[] {
    const filtered = this.filterHistoryByPeriod(history, period);
    const groups: Record<string, number> = {};

    filtered.forEach(entry => {
      if (!entry.completedAt) return;
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

    const repsTrend = relevantSessions.map(s => {
      const data = s.exerciseData![exerciseId];
      const maxReps = data.sets.length > 0 
        ? Math.max(...data.sets.map(set => set.reps || 0))
        : 0;
      return {
        date: new Date(s.completedTime || s.startTime).toISOString().split('T')[0],
        value: maxReps
      };
    });

    const result = { exerciseId, maxWeightTrend, volumeTrend, repsTrend };
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
   * Calculate trend trajectory (slope and change percentage)
   */
  public calculateTrendTrajectory(data: { date: string; value: number }[]): TrendTrajectory {
    if (data.length < 2) {
      return { trajectory: 'stable', slope: 0, changePercentage: 0 };
    }

    // Linear regression for slope
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((d, i) => {
      sumX += i;
      sumY += d.value;
      sumXY += i * d.value;
      sumXX += i * i;
    });

    const denominator = (n * sumXX - sumX * sumX);
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const changePercentage = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;

    let trajectory: Trajectory = 'stable';
    if (slope > SLOPE_THRESHOLD) trajectory = 'upward';
    else if (slope < -SLOPE_THRESHOLD) trajectory = 'downward';

    return { trajectory, slope, changePercentage };
  }

  /**
   * Calculate moving average for a series of data points
   */
  public calculateMovingAverage(data: { value: number }[], windowSize: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const sum = window.reduce((acc, curr) => acc + curr.value, 0);
      result.push(sum / window.length);
    }
    return result;
  }

  /**
   * Detect plateaus for a specific exercise
   */
  public detectPlateaus(
    sessions: Record<string, EnhancedWorkoutSession> | undefined,
    exerciseId: string,
    weeksThreshold: number = PLATEAU_WEEKS_THRESHOLD
  ): PlateauInfo {
    if (!sessions) return { exerciseId, isPlateau: false, weeksStalled: 0, currentValue: 0, historicalMax: 0 };

    const relevantSessions = Object.values(sessions)
      .filter(s => s.exerciseData && s.exerciseData[exerciseId])
      .sort((a, b) => (a.completedTime || a.startTime || 0) - (b.completedTime || b.startTime || 0));

    if (relevantSessions.length === 0) {
      return { exerciseId, isPlateau: false, weeksStalled: 0, currentValue: 0, historicalMax: 0 };
    }

    const values = relevantSessions.map(s => {
      const data = s.exerciseData![exerciseId];
      return data.sets.length > 0 ? Math.max(...data.sets.map((set: any) => set.weight || 0)) : 0;
    });

    const historicalMax = Math.max(...values);
    const currentValue = values[values.length - 1];

    let sessionsStalled = 0;
    const lastSessionDate = relevantSessions[relevantSessions.length - 1].completedTime || relevantSessions[relevantSessions.length - 1].startTime || Date.now();
    let firstStalledDate = lastSessionDate;
    
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] <= currentValue) {
        sessionsStalled++;
        firstStalledDate = relevantSessions[i].completedTime || relevantSessions[i].startTime || firstStalledDate;
      } else {
        break;
      }
    }

    const timeDiffWeeks = (lastSessionDate - firstStalledDate) / (7 * 24 * 60 * 60 * 1000);
    
    // A plateau is defined as no improvement for weeksThreshold or more AND at least weeksThreshold sessions
    const isPlateau = timeDiffWeeks >= weeksThreshold && sessionsStalled >= weeksThreshold && currentValue <= historicalMax;

    return { exerciseId, isPlateau, weeksStalled: Math.floor(timeDiffWeeks), currentValue, historicalMax };
  }

  /**
   * Detect significant drops in performance (>20%) using rolling averages
   */
  public detectSignificantDrops(
    data: { value: number; date: string }[], 
    threshold: number = DROP_THRESHOLD_PERCENT
  ): { drop: number; message: string; category: string }[] {
    if (data.length < 2) return [];

    const drops: { drop: number; message: string; category: string }[] = [];
    const windowSize = 3; // Rolling window for comparison

    for (let i = windowSize; i < data.length; i++) {
      const current = data[i].value;
      
      // Calculate average of previous window
      const prevWindow = data.slice(i - windowSize, i);
      const prevAvg = prevWindow.reduce((acc, curr) => acc + curr.value, 0) / windowSize;
      
      if (prevAvg > 0) {
        const dropPercent = ((prevAvg - current) / prevAvg) * 100;
        if (dropPercent >= threshold) {
          drops.push({
            drop: dropPercent,
            category: 'Intensity',
            message: `Significant drop of ${dropPercent.toFixed(1)}% detected on ${data[i].date} compared to your recent average.`
          });
        }
      }
    }

    // Also check for consistency drops (e.g. days between workouts)
    if (data.length >= 4) {
      const dates = data.map(d => new Date(d.date).getTime());
      const gaps = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push((dates[i] - dates[i - 1]) / (24 * 60 * 60 * 1000));
      }

      const currentGap = gaps[gaps.length - 1];
      const prevGaps = gaps.slice(0, gaps.length - 1);
      const avgGap = prevGaps.reduce((a, b) => a + b, 0) / prevGaps.length;

      if (avgGap > 0 && currentGap > avgGap * 1.5 && currentGap > 7) {
        drops.push({
          drop: ((currentGap - avgGap) / avgGap) * 100,
          category: 'Consistency',
          message: `Your training frequency has dropped. It's been ${currentGap.toFixed(0)} days since your last session (usually ${avgGap.toFixed(1)} days).`
        });
      }
    }

    return drops;
  }

  /**
   * Group session exercise data by muscle group
   */
  public groupByMuscleGroup(
    sessions: Record<string, EnhancedWorkoutSession>,
    exerciseDatabase: Record<string, any>
  ): Record<string, { volume: number; sets: number }> {
    const muscleGroups: Record<string, { volume: number; sets: number }> = {};

    Object.values(sessions).forEach(session => {
      if (!session.exerciseData) return;

      Object.entries(session.exerciseData).forEach(([exerciseId, data]) => {
        const exercise = exerciseDatabase[exerciseId];
        if (!exercise) return;

        // Use bodyPart as the primary grouping for "Muscle Group"
        const groups = exercise.bodyPart || [];

        groups.forEach((group: string) => {
          if (!muscleGroups[group]) {
            muscleGroups[group] = { volume: 0, sets: 0 };
          }

          const sessionVolume = data.sets.reduce((sum: number, set: any) => sum + (set.weight || 0) * (set.reps || 0), 0);
          muscleGroups[group].volume += sessionVolume;
          muscleGroups[group].sets += data.sets.length;
        });
      });
    });

    return muscleGroups;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}
