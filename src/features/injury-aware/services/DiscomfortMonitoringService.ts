import type {
  DiscomfortEvent,
  DiscomfortResponse
} from '../types';

export interface DiscomfortPattern {
  location: string;
  frequency: number;
  averageSeverity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurrence: number;
  triggeringExercises: string[];
}

// Export DiscomfortResponseAction for external use
export interface DiscomfortResponseAction {
  action: 'stop_exercise' | 'reduce_intensity' | 'suggest_alternative' | 'continue_monitoring';
  reason: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
}

export class DiscomfortMonitoringService {
  private readonly STORAGE_KEY = 'discomfort-history';
  private responseCallback?: (action: DiscomfortResponseAction) => void;
  
  // Performance optimization: cache for discomfort patterns
  private patternCache = new Map<string, DiscomfortPattern>();
  private readonly CACHE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

  // Pre-defined alternatives for common problematic exercises
  private readonly EXERCISE_ALTERNATIVES = {
    jumping: ['seated_cardio', 'upper_body_workout', 'swimming'],
    deep_squats: ['partial_squats', 'leg_press', 'wall_sits'],
    overhead_press: ['lateral_raises', 'front_raises', 'pushups'],
    running: ['cycling', 'elliptical', 'swimming'],
    deadlifts: ['rack_pulls', 'romanian_deadlifts', 'kettlebell_swings']
  } as const;

  /**
   * Record a discomfort event with real-time processing
   */
  async recordDiscomfort(discomfortData: Omit<DiscomfortEvent, 'id' | 'timestamp'>): Promise<DiscomfortEvent & { requiresImmediateResponse?: boolean }> {
    const startTime = Date.now();
    
    const discomfortEvent: DiscomfortEvent = {
      id: this.generateDiscomfortId(),
      timestamp: Date.now(),
      ...discomfortData
    };

    // Store locally
    await this.storeDiscomfortEvent(discomfortEvent);

    // Analyze for immediate response requirements
    if (discomfortEvent.severity >= 4) {
      const responseAction = this.generateImmediateResponse(discomfortEvent);
      if (this.responseCallback) {
        this.responseCallback(responseAction);
      }
      return { ...discomfortEvent, requiresImmediateResponse: true };
    }

    // Check if this continues a pattern (requires analysis)
    await this.analyzeAndUpdatePatterns(discomfortEvent);

    const processingTime = Date.now() - startTime;
    
    // Enforce 500ms performance requirement
    if (processingTime > 500) {
      console.warn(`Discomfort processing time ${processingTime}ms exceeds 500ms requirement`);
    }

    return discomfortEvent;
  }

  /**
   * Set callback for immediate discomfort responses
   */
  setResponseCallback(callback: (action: DiscomfortResponseAction) => void): void {
    this.responseCallback = callback;
  }

  /**
   * Analyze discomfort patterns for specific location
   */
  async analyzeDiscomfortPatterns(location: string): Promise<DiscomfortPattern> {
    const cacheKey = `pattern_${location}`;
    
    // Check cache first
    const cached = this.patternCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastOccurrence) < this.CACHE_EXPIRY_MS) {
      return cached;
    }

    const history = await this.getDiscomfortHistory();
    const locationEvents = history.filter(event => event.location === location);
    
    if (locationEvents.length === 0) {
      return {
        location,
        frequency: 0,
        averageSeverity: 0,
        trend: 'stable',
        lastOccurrence: 0,
        triggeringExercises: []
      };
    }

    const frequency = locationEvents.length;
    const averageSeverity = locationEvents.reduce((sum, event) => sum + event.severity, 0) / frequency;
    const trend = this.calculateTrend(locationEvents);
    const lastOccurrence = Math.max(...locationEvents.map(event => event.timestamp));
    const triggeringExercises = [...new Set(locationEvents.map(event => event.exercise).filter(Boolean))];

    const pattern: DiscomfortPattern = {
      location,
      frequency,
      averageSeverity,
      trend,
      lastOccurrence,
      triggeringExercises
    };

    // Cache the result
    this.patternCache.set(cacheKey, pattern);

    return pattern;
  }

  /**
   * Get complete discomfort history
   */
  async getDiscomfortHistory(): Promise<DiscomfortEvent[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Failed to load discomfort history:', error);
      return [];
    }
  }

  /**
   * Identify problematic exercises based on discomfort patterns
   */
  async identifyProblematicExercises(): Promise<string[]> {
    const history = await this.getDiscomfortHistory();
    const exerciseDiscomfortCount = new Map<string, number>();

    history.forEach(event => {
      if (event.exercise) {
        const current = exerciseDiscomfortCount.get(event.exercise) || 0;
        exerciseDiscomfortCount.set(event.exercise, current + 1);
      }
    });

    // Return exercises with multiple discomfort reports
    return Array.from(exerciseDiscomfortCount.entries())
      .filter(([_, count]) => count >= 2)
      .map(([exercise, _]) => exercise);
  }

  /**
   * Suggest alternatives for problematic exercises
   */
  async suggestAlternatives(exercise: string): Promise<string[]> {
    const alternatives = this.EXERCISE_ALTERNATIVES[exercise as keyof typeof this.EXERCISE_ALTERNATIVES];
    return alternatives ? [...alternatives] : [];
  }

  /**
   * Store discomfort event locally
   */
  private async storeDiscomfortEvent(event: DiscomfortEvent): Promise<void> {
    try {
      const history = await this.getDiscomfortHistory();
      history.push(event);
      
      // Keep only last 1000 events to manage storage
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to store discomfort event:', error);
      throw new Error('Failed to store discomfort event');
    }
  }

  /**
   * Generate immediate response for severe discomfort
   */
  private generateImmediateResponse(event: DiscomfortEvent): DiscomfortResponseAction {
    if (event.severity >= 4) {
      return {
        action: 'stop_exercise',
        reason: 'high_severity_discomfort',
        recommendation: 'immediate_rest',
        severity: 'high'
      };
    }
    
    return {
      action: 'reduce_intensity',
      reason: 'moderate_discomfort',
      recommendation: 'reduce_weight_or_range',
      severity: 'medium'
    };
  }

  /**
   * Analyze and update patterns based on new discomfort event
   */
  private async analyzeAndUpdatePatterns(event: DiscomfortEvent): Promise<void> {
    const pattern = await this.analyzeDiscomfortPatterns(event.location);
    
    // Clear cache for this location to force fresh analysis
    this.patternCache.delete(`pattern_${event.location}`);
    
    // Log pattern changes for debugging
    if (pattern.frequency >= 3 || pattern.averageSeverity >= 3) {
      console.warn(`Discomfort pattern detected for ${event.location}:`, pattern);
    }
  }

  /**
   * Calculate trend based on recent discomfort events
   */
  private calculateTrend(events: DiscomfortEvent[]): 'increasing' | 'decreasing' | 'stable' {
    if (events.length < 2) {
      return 'stable';
    }

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    // Compare recent events to earlier events
    const recentCount = Math.min(3, events.length);
    const recentEvents = events.slice(-recentCount);
    const earlierEvents = events.slice(0, Math.min(3, events.length - recentCount));
    
    if (earlierEvents.length === 0) {
      return 'stable';
    }

    const recentAverage = recentEvents.reduce((sum, event) => sum + event.severity, 0) / recentEvents.length;
    const earlierAverage = earlierEvents.reduce((sum, event) => sum + event.severity, 0) / earlierEvents.length;
    
    if (recentAverage > earlierAverage + 0.5) {
      return 'increasing';
    } else if (recentAverage < earlierAverage - 0.5) {
      return 'decreasing';
    }
    
    return 'stable';
  }

  /**
   * Generate unique discomfort event ID
   */
  private generateDiscomfortId(): string {
    return `discomfort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear discomfort history (for testing or user preference)
   */
  async clearDiscomfortHistory(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.patternCache.clear();
    } catch (error) {
      console.error('Failed to clear discomfort history:', error);
    }
  }

  /**
   * Get discomfort statistics for a time period
   */
  async getDiscomfortStats(timePeriodMs: number = 7 * 24 * 60 * 60 * 1000): Promise<{
    totalEvents: number;
    averageSeverity: number;
    mostAffectedLocation: string;
    mostProblematicExercise: string;
  }> {
    const history = await this.getDiscomfortHistory();
    const cutoffTime = Date.now() - timePeriodMs;
    const recentEvents = history.filter(event => event.timestamp >= cutoffTime);
    
    if (recentEvents.length === 0) {
      return {
        totalEvents: 0,
        averageSeverity: 0,
        mostAffectedLocation: '',
        mostProblematicExercise: ''
      };
    }

    const totalEvents = recentEvents.length;
    const averageSeverity = recentEvents.reduce((sum, event) => sum + event.severity, 0) / totalEvents;
    
    const locationCounts = new Map<string, number>();
    const exerciseCounts = new Map<string, number>();
    
    recentEvents.forEach(event => {
      locationCounts.set(event.location, (locationCounts.get(event.location) || 0) + 1);
      if (event.exercise) {
        exerciseCounts.set(event.exercise, (exerciseCounts.get(event.exercise) || 0) + 1);
      }
    });
    
    const mostAffectedLocation = Array.from(locationCounts.entries())
      .reduce((max, [location, count]) => count > max.count ? { location, count } : max, { location: '', count: 0 }).location;
    
    const mostProblematicExercise = Array.from(exerciseCounts.entries())
      .reduce((max, [exercise, count]) => count > max.count ? { exercise, count } : max, { exercise: '', count: 0 }).exercise;

    return {
      totalEvents,
      averageSeverity,
      mostAffectedLocation,
      mostProblematicExercise
    };
  }
}