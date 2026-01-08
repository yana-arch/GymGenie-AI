import { AdaptationEvent } from '@/features/preference-learning/types/preferenceLearning.types';
import { WorkoutHistoryEntry } from '@/types';

export interface RecommendationImpactSummary {
  totalRecommendations: number;
  acceptedRate: number;
  typeBreakdown: {
    type: string;
    count: number;
    successRate: number;
    performanceGains: number;
  }[];
}

export type RecommendationType = 'Safety' | 'Performance' | 'Adaptation' | 'Form Correction';

export class CorrelationService {
  private static instance: CorrelationService;

  private constructor() {}

  public static getInstance(): CorrelationService {
    if (!CorrelationService.instance) {
      CorrelationService.instance = new CorrelationService();
    }
    return CorrelationService.instance;
  }

  public getRecommendationImpactSummary(
    adaptations: AdaptationEvent[],
    history: WorkoutHistoryEntry[]
  ): RecommendationImpactSummary {
    const totalRecommendations = adaptations.length;
    const acceptedAdaptations = adaptations.filter(a => a.userResponse === 'accepted');
    const acceptedRate = totalRecommendations > 0 ? acceptedAdaptations.length / totalRecommendations : 0;

    const types: RecommendationType[] = ['Safety', 'Performance', 'Adaptation', 'Form Correction'];
    
    const typeBreakdown = types.map(type => {
      const typeAdaptations = adaptations.filter(a => this.mapToType(a) === type);
      const typeAccepted = typeAdaptations.filter(a => a.userResponse === 'accepted');
      const successRate = typeAdaptations.length > 0 ? typeAccepted.length / typeAdaptations.length : 0;
      
      let performanceGains = 0;
      if (type === 'Safety') {
        performanceGains = this.calculateSafetyPerformanceGains(typeAccepted, history);
      } else if (type === 'Performance' || type === 'Adaptation') {
        performanceGains = this.calculateGeneralPerformanceGains(typeAccepted, history);
      }

      return {
        type,
        count: typeAdaptations.length,
        successRate,
        performanceGains
      };
    });

    return {
      totalRecommendations,
      acceptedRate,
      typeBreakdown
    };
  }

  public getCorrelationData(
    adaptations: AdaptationEvent[],
    history: WorkoutHistoryEntry[]
  ) {
    const performanceData = history.map(h => ({
      timestamp: new Date(h.completedAt).getTime(),
      date: h.completedAt.split('T')[0],
      performance: this.calculatePerformanceScore(h),
      type: 'performance' as const
    })).sort((a, b) => a.timestamp - b.timestamp);

    const eventData = adaptations.map(a => ({
      timestamp: a.timestamp,
      date: new Date(a.timestamp).toISOString().split('T')[0],
      performance: this.findNearestPerformance(a.timestamp, performanceData),
      type: 'event' as const,
      recommendationType: this.mapToType(a),
      action: a.action,
      userResponse: a.userResponse
    }));

    return {
      performanceTrend: performanceData,
      events: eventData
    };
  }

  private calculatePerformanceScore(h: WorkoutHistoryEntry): number {
    // Better proxy for performance: exercises * (duration/10) * intensity_bonus
    const baseVolume = (h.exercisesCompleted || 0) * ((h.durationMinutes || 0) / 10);
    const rpeBonus = (h.rpe || 5) / 5; // Higher RPE = more effort for same volume
    return baseVolume * rpeBonus;
  }

  private findNearestPerformance(timestamp: number, performanceData: { timestamp: number, performance: number }[]): number {
    if (performanceData.length === 0) return 0;
    
    let closest = performanceData[0];
    let minDiff = Math.abs(timestamp - closest.timestamp);
    
    for (const p of performanceData) {
      const diff = Math.abs(timestamp - p.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    
    return closest.performance;
  }

  private mapToType(event: AdaptationEvent): RecommendationType {
    if (event.action === 'form_correction') return 'Form Correction';
    
    const safetyTriggers = ['fatigue', 'injury', 'discomfort', 'safety', 'pain'];
    if (event.triggers.some(t => safetyTriggers.includes(t.toLowerCase()))) return 'Safety';
    
    const adaptationTriggers = ['time', 'equipment', 'limited', 'busy'];
    if (event.triggers.some(t => adaptationTriggers.includes(t.toLowerCase()))) return 'Adaptation';
    
    return 'Performance';
  }

  private calculateSafetyPerformanceGains(adaptations: AdaptationEvent[], history: WorkoutHistoryEntry[]): number {
    let gains = 0;
    const windowMs = 72 * 60 * 60 * 1000; // 72 hours

    adaptations.forEach(adaptation => {
      const workoutTime = adaptation.timestamp;
      
      // Look for recovery trend: performance improvement in subsequent sessions vs pre-adaptation baseline
      const baseline = this.getBaselinePerformance(workoutTime, history);
      const postSessions = history.filter(h => {
        const time = new Date(h.completedAt).getTime();
        return time > workoutTime && time <= workoutTime + windowMs;
      });

      if (baseline > 0 && postSessions.length > 0) {
        const avgPostPerformance = postSessions.reduce((acc, h) => acc + this.calculatePerformanceScore(h), 0) / postSessions.length;
        // If they maintained or improved performance after a safety intervention (e.g. avoided injury crash)
        if (avgPostPerformance >= baseline * 0.95) {
          gains++;
        }
      }
    });

    return gains;
  }

  private calculateGeneralPerformanceGains(adaptations: AdaptationEvent[], history: WorkoutHistoryEntry[]): number {
    let gains = 0;
    const windowMs = 7 * 24 * 60 * 60 * 1000; // 1 week for performance impact

    adaptations.forEach(adaptation => {
      const workoutTime = adaptation.timestamp;
      const baseline = this.getBaselinePerformance(workoutTime, history);
      
      const postSessions = history.filter(h => {
        const time = new Date(h.completedAt).getTime();
        return time > workoutTime && time <= workoutTime + windowMs;
      });

      if (baseline > 0 && postSessions.length > 0) {
        const maxPost = Math.max(...postSessions.map(h => this.calculatePerformanceScore(h)));
        // Significant gain: 5% improvement over baseline
        if (maxPost > baseline * 1.05) {
          gains++;
        }
      }
    });
    return gains;
  }

  private getBaselinePerformance(timestamp: number, history: WorkoutHistoryEntry[]): number {
    const prevSessions = history
      .filter(h => new Date(h.completedAt).getTime() < timestamp)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 3);

    if (prevSessions.length === 0) return 0;
    return prevSessions.reduce((acc, h) => acc + this.calculatePerformanceScore(h), 0) / prevSessions.length;
  }

  public clearCache(): void {
    // No-op, cache removed as requested
  }
}

