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
  private cache: Map<string, any> = new Map();

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
      performance: (h.durationMinutes || 0) * (h.exercisesCompleted || 0),
      type: 'performance'
    })).sort((a, b) => a.timestamp - b.timestamp);

    const eventData = adaptations.map(a => ({
      timestamp: a.timestamp,
      date: new Date(a.timestamp).toISOString().split('T')[0],
      performance: this.findNearestPerformance(a.timestamp, performanceData),
      type: 'event',
      recommendationType: this.mapToType(a),
      action: a.action,
      userResponse: a.userResponse
    }));

    return {
      performanceTrend: performanceData,
      events: eventData
    };
  }

  private findNearestPerformance(timestamp: number, performanceData: any[]): number {
    if (performanceData.length === 0) return 0;
    
    // Find the closest performance data point
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
    
    const safetyTriggers = ['fatigue', 'injury', 'discomfort', 'safety'];
    if (event.triggers.some(t => safetyTriggers.includes(t.toLowerCase()))) return 'Safety';
    
    const adaptationTriggers = ['time', 'equipment', 'limited'];
    if (event.triggers.some(t => adaptationTriggers.includes(t.toLowerCase()))) return 'Adaptation';
    
    return 'Performance';
  }

  private calculateSafetyPerformanceGains(adaptations: AdaptationEvent[], history: WorkoutHistoryEntry[]): number {
    let gains = 0;
    const intensityReductions = adaptations.filter(a => 
      a.action === 'reduce_intensity' || a.action === 'reduce_volume'
    );

    intensityReductions.forEach(adaptation => {
      const windowStart = adaptation.timestamp;
      const windowEnd = adaptation.timestamp + (72 * 60 * 60 * 1000); // 72 hours

      const preWorkout = history
        .filter(h => new Date(h.completedAt).getTime() < windowStart)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

      const postWorkouts = history
        .filter(h => {
          const time = new Date(h.completedAt).getTime();
          return time > windowStart && time <= windowEnd;
        });

      if (preWorkout && postWorkouts.length > 0) {
        // Compare performance (using duration and exercisesCompleted as proxy for volume)
        const prePerformance = (preWorkout.durationMinutes || 0) * (preWorkout.exercisesCompleted || 0);
        const maxPostPerformance = Math.max(...postWorkouts.map(h => 
          (h.durationMinutes || 0) * (h.exercisesCompleted || 0)
        ));

        if (maxPostPerformance > prePerformance) {
          gains++;
        }
      }
    });

    return gains;
  }

  private calculateGeneralPerformanceGains(adaptations: AdaptationEvent[], history: WorkoutHistoryEntry[]): number {
    // Simple implementation for now: count sessions with RPE improvement or volume increase after adaptation
    let gains = 0;
    adaptations.forEach(adaptation => {
        const windowStart = adaptation.timestamp;
        const windowEnd = adaptation.timestamp + (72 * 60 * 60 * 1000);
        
        const postWorkouts = history.filter(h => {
            const time = new Date(h.completedAt).getTime();
            return time > windowStart && time <= windowEnd;
        });

        if (postWorkouts.length > 0) {
            // If user completed more exercises than usual or had good RPE
            if (postWorkouts.some(h => (h.rpe || 0) >= 7 || (h.exercisesCompleted || 0) >= 5)) {
                gains++;
            }
        }
    });
    return gains;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
