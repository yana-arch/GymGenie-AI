/**
 * Historical Data Aggregation Service
 * Processes workout history data for pattern analysis
 */

import type {
  IHistoricalDataAggregationService,
  WorkoutHistoryEntry,
  AggregatedData,
  PerformanceTrend,
  AdaptationHistory
} from '../types/historicalPatterns.types';

export class HistoricalDataAggregationService implements IHistoricalDataAggregationService {
  /**
   * Aggregate workout data by time period
   */
  async aggregateByTimePeriod(
    workoutHistory: WorkoutHistoryEntry[],
    period: 'week' | 'month' | 'quarter'
  ): Promise<AggregatedData[]> {
    try {
      const groupedData = this.groupWorkoutsByPeriod(workoutHistory, period);
      const aggregatedData: AggregatedData[] = [];

      for (const [periodKey, workouts] of Object.entries(groupedData)) {
        const periodData = this.calculatePeriodAggregation(workouts, periodKey);
        aggregatedData.push(periodData);
      }

      return aggregatedData.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    } catch (error) {
      console.error('Error aggregating data by period:', error);
      throw new Error(`Data aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate performance trends from workout history
   */
  async calculatePerformanceTrends(workoutHistory: WorkoutHistoryEntry[]): Promise<PerformanceTrend[]> {
    try {
      const trends: PerformanceTrend[] = [];

      // Calculate overall performance trend
      const overallScores = workoutHistory.map(w => w.performance.overallScore);
      const overallTrend = this.calculateLinearTrend(overallScores);
      trends.push({
        metric: 'overall_performance',
        direction: this.getTrendDirection(overallTrend),
        rate: Math.abs(overallTrend),
        confidence: this.calculateTrendConfidence(overallScores, overallTrend)
      });

      // Calculate intensity trend
      const intensityScores = workoutHistory.map(w => w.performance.intensity);
      const intensityTrend = this.calculateLinearTrend(intensityScores);
      trends.push({
        metric: 'intensity_progression',
        direction: this.getTrendDirection(intensityTrend),
        rate: Math.abs(intensityTrend),
        confidence: this.calculateTrendConfidence(intensityScores, intensityTrend)
      });

      // Calculate completion rate trend
      const completionRates = workoutHistory.map(w => w.performance.completionRate);
      const completionTrend = this.calculateLinearTrend(completionRates);
      trends.push({
        metric: 'completion_consistency',
        direction: this.getTrendDirection(completionTrend),
        rate: Math.abs(completionTrend),
        confidence: this.calculateTrendConfidence(completionRates, completionTrend)
      });

      return trends;
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      throw new Error(`Performance trend calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract adaptation history from workout data
   */
  async extractAdaptationHistory(workoutHistory: WorkoutHistoryEntry[]): Promise<AdaptationHistory> {
    try {
      const adaptationTypes: Record<string, number> = {};
      const adaptationEffectiveness: Record<string, number[]> = {};
      const timeline: AdaptationHistory['timeline'] = [];

      let totalAdaptations = 0;

      for (const workout of workoutHistory) {
        for (const exercise of workout.exercises) {
          for (const adaptation of exercise.adaptations) {
            totalAdaptations++;
            
            // Count adaptation types
            adaptationTypes[adaptation.type] = (adaptationTypes[adaptation.type] || 0) + 1;
            
            // Track effectiveness by type
            if (!adaptationEffectiveness[adaptation.type]) {
              adaptationEffectiveness[adaptation.type] = [];
            }
            if (adaptation.effectiveness !== undefined) {
              adaptationEffectiveness[adaptation.type].push(adaptation.effectiveness);
            }
          }
        }

        // Calculate period adaptation summary
        const periodAdaptations = workout.exercises.flatMap(e => e.adaptations);
        if (periodAdaptations.length > 0) {
          const avgEffectiveness = periodAdaptations
            .filter(a => a.effectiveness !== undefined)
            .reduce((sum, a) => sum + (a.effectiveness || 0), 0) / 
            periodAdaptations.filter(a => a.effectiveness !== undefined).length;

          timeline.push({
            date: workout.completedAt,
            adaptations: periodAdaptations.length,
            averageEffectiveness: avgEffectiveness || 0,
            types: Array.from(new Set(periodAdaptations.map(a => a.type)))
          });
        }
      }

      // Calculate average effectiveness by type
      const avgEffectiveness: Record<string, number> = {};
      for (const [type, effectivenessValues] of Object.entries(adaptationEffectiveness)) {
        avgEffectiveness[type] = effectivenessValues.length > 0 
          ? effectivenessValues.reduce((sum, val) => sum + val, 0) / effectivenessValues.length
          : 0;
      }

      return {
        totalAdaptations,
        adaptationTypes,
        adaptationEffectiveness: avgEffectiveness,
        timeline
      };
    } catch (error) {
      console.error('Error extracting adaptation history:', error);
      throw new Error(`Adaptation history extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper methods
   */

  private groupWorkoutsByPeriod(
    workoutHistory: WorkoutHistoryEntry[],
    period: 'week' | 'month' | 'quarter'
  ): Record<string, WorkoutHistoryEntry[]> {
    const grouped: Record<string, WorkoutHistoryEntry[]> = {};

    for (const workout of workoutHistory) {
      const periodKey = this.getPeriodKey(workout.completedAt, period);
      if (!grouped[periodKey]) {
        grouped[periodKey] = [];
      }
      grouped[periodKey].push(workout);
    }

    return grouped;
  }

  private getPeriodKey(date: Date, period: 'week' | 'month' | 'quarter'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    switch (period) {
      case 'week':
        const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
        return `${year}-W${weekNumber}`;
      case 'month':
        return `${year}-M${month.toString().padStart(2, '0')}`;
      case 'quarter':
        const quarter = Math.floor((month - 1) / 3) + 1;
        return `${year}-Q${quarter}`;
      default:
        return `${year}-M${month}`;
    }
  }

  private calculatePeriodAggregation(workouts: WorkoutHistoryEntry[], periodKey: string): AggregatedData {
    const sortedWorkouts = workouts.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    const startDate = sortedWorkouts[0].completedAt;
    const endDate = sortedWorkouts[sortedWorkouts.length - 1].completedAt;

    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averagePerformance = workouts.reduce((sum, w) => sum + w.performance.overallScore, 0) / workouts.length;
    const adaptationFrequency = workouts.reduce((sum, w) => 
      sum + w.exercises.reduce((exerciseSum, e) => exerciseSum + e.adaptations.length, 0), 0
    ) / workouts.length;

    // Calculate performance improvement
    const performanceImprovement = workouts.length > 1 
      ? (workouts[workouts.length - 1].performance.overallScore - workouts[0].performance.overallScore) / workouts[0].performance.overallScore
      : 0;

    return {
      period: periodKey,
      startDate,
      endDate,
      workoutCount: workouts.length,
      totalDuration,
      averagePerformance,
      adaptationFrequency,
      performanceImprovement
    };
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices (0, 1, 2, ...)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (val * index), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    // Calculate slope (trend)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private getTrendDirection(trend: number): 'improving' | 'declining' | 'stable' {
    const threshold = 0.01; // Minimum change to consider as trend
    if (Math.abs(trend) < threshold) return 'stable';
    return trend > 0 ? 'improving' : 'declining';
  }

  private calculateTrendConfidence(values: number[], trend: number): number {
    if (values.length < 3) return 0.5;

    // Calculate correlation coefficient as confidence measure
    const n = values.length;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;
    const meanX = (n - 1) / 2; // Mean of indices

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const xDeviation = i - meanX;
      const yDeviation = values[i] - meanY;
      
      numerator += xDeviation * yDeviation;
      sumXSquared += xDeviation * xDeviation;
      sumYSquared += yDeviation * yDeviation;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    const correlation = denominator === 0 ? 0 : Math.abs(numerator / denominator);

    // Return correlation as confidence (0-1)
    return Math.min(1, Math.max(0, correlation));
  }
}