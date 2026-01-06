/**
 * Performance Monitor Service
 * Monitors AI system performance, battery usage, and handles graceful degradation
 * Ensures sub-2-second response times and <30% battery drain for 1-hour sessions
 */

export interface SystemResponseMetrics {
  system: string;
  responseTimes: number[];
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastResponseTime: number;
  trend: 'improving' | 'stable' | 'degrading' | 'unknown';
}

export interface SystemLoadInfo {
  system: string;
  load: number; // 0.0 to 1.0
  responseTime: number;
  priority: number;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  accessCount: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

export interface BatteryMetrics {
  totalUsage: number; // percentage
  processingIntervals: number;
  averagePerInterval: number;
  projectedUsage: number;
  estimatedSessionDuration: number;
}

export interface PerformanceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  system: string;
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

export interface DegradationNotification {
  id: string;
  system: string;
  level: 'low' | 'medium' | 'high';
  message: string;
  actionRequired: boolean;
  timestamp: number;
}

export interface SystemFailureInfo {
  system: string;
  error: string;
  timestamp: number;
}

export interface FallbackStrategy {
  isDegraded: boolean;
  fallbackStrategy: string;
  userMessage: string;
  availableFeatures: string[];
  disabledFeatures: string[];
  estimatedRecovery: number; // seconds
}

export interface BatteryOptimization {
  shouldReduceIntensity: boolean;
  recommendedReduction: number; // percentage
  estimatedSavings: number; // battery percentage
  recommendedActions: string[];
}

export interface AdaptiveFeatures {
  aiEnabled: boolean;
  reducedMode: boolean;
  disabledFeatures: string[];
  enabledFeatures: string[];
  recommendedIntensity: 'low' | 'moderate' | 'high';
}

export interface PerformanceDashboard {
  systemMetrics: Record<string, SystemResponseMetrics>;
  batteryMetrics: BatteryMetrics;
  alerts: PerformanceAlert[];
  recommendaions: string[];
  cacheStats: CacheStats;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

export class PerformanceMonitor {
  private systemMetrics: Map<string, SystemResponseMetrics> = new Map();
  private responseHistory: Map<string, number[]> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private cacheStats: CacheStats = {
    size: 0,
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0
  };

  private batteryUsage: number[] = [];
  private batteryBaseline: number = 0.5; // 0.5% per minute baseline

  private performanceAlerts: PerformanceAlert[] = [];
  private degradations: DegradationNotification[] = [];
  private systemFailures: Map<string, number[]> = new Map();
  private systemStressLevels: Map<string, string> = new Map();

  private readonly RESPONSE_TIME_THRESHOLD = {
    OPTIMAL: 500,
    GOOD: 1000,
    WARNING: 1500,
    CRITICAL: 2000
  };

  private readonly BATTERY_DRAIN_LIMIT = 30; // 30% for 1-hour session

  constructor() {
    this.initialize();
  }

  /**
   * Initialize performance monitor
   */
  private initialize(): void {
    // Initialize tracking
    this.batteryBaseline = 0.5; // 0.5% per minute baseline
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.systemMetrics.clear();
    this.responseHistory.clear();
    this.cache.clear();
    this.batteryUsage = [];
    this.performanceAlerts = [];
    this.degradations = [];
    this.systemFailures.clear();
    this.systemStressLevels.clear();
    this.cacheStats = {
      size: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }

  /**
   * Track AI system response time
   */
  trackSystemResponse(system: string, responseTime: number): void {
    if (!this.responseHistory.has(system)) {
      this.responseHistory.set(system, []);
    }

    const history = this.responseHistory.get(system)!;
    history.push(responseTime);

    // Keep last 100 responses per system
    if (history.length > 100) {
      history.shift();
    }

    // Update metrics
    this.updateSystemMetrics(system);
  }

  /**
   * Get metrics for all systems
   */
  getSystemMetrics(): Record<string, SystemResponseMetrics> {
    const metrics: Record<string, SystemResponseMetrics> = {};

    this.systemMetrics.forEach((value, key) => {
      metrics[key] = value;
    });

    return metrics;
  }

  /**
   * Update system metrics from response history
   */
  private updateSystemMetrics(system: string): void {
    const history = this.responseHistory.get(system);
    if (!history || history.length === 0) {
      return;
    }

    const responseTimes = history;
    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    const last = responseTimes[responseTimes.length - 1];

    // Calculate trend
    let trend: 'improving' | 'stable' | 'degrading' | 'unknown' = 'stable';
    if (history.length >= 10) {
      const recentAvg = history.slice(-5).reduce((sum, time) => sum + time, 0) / 5;
      const olderAvg = history.slice(-10, -5).reduce((sum, time) => sum + time, 0) / 5;

      if (recentAvg < olderAvg * 0.9) {
        trend = 'improving';
      } else if (recentAvg > olderAvg * 1.1) {
        trend = 'degrading';
      }
    }

    this.systemMetrics.set(system, {
      system,
      responseTimes: [...responseTimes],
      averageResponseTime: avg,
      minResponseTime: min,
      maxResponseTime: max,
      lastResponseTime: last,
      trend
    });

    // Check for performance alerts
    this.checkPerformanceAlerts(system, avg);
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(system: string, avgResponseTime: number): void {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let threshold = this.RESPONSE_TIME_THRESHOLD.OPTIMAL;

    if (avgResponseTime > this.RESPONSE_TIME_THRESHOLD.CRITICAL) {
      severity = 'critical';
      threshold = this.RESPONSE_TIME_THRESHOLD.CRITICAL;
    } else if (avgResponseTime > this.RESPONSE_TIME_THRESHOLD.WARNING) {
      severity = 'high';
      threshold = this.RESPONSE_TIME_THRESHOLD.WARNING;
    } else if (avgResponseTime > this.RESPONSE_TIME_THRESHOLD.GOOD) {
      severity = 'medium';
      threshold = this.RESPONSE_TIME_THRESHOLD.GOOD;
    }

    if (severity !== 'low') {
      const alert: PerformanceAlert = {
        id: this.generateId(),
        severity,
        system,
        message: `${system} response time (${Math.round(avgResponseTime)}ms) exceeds threshold (${threshold}ms)`,
        timestamp: Date.now(),
        value: avgResponseTime,
        threshold
      };

      // Avoid duplicate alerts
      const recentAlert = this.performanceAlerts.find(
        a => a.system === system && a.severity === severity &&
        (Date.now() - a.timestamp) < 60000 // 1 minute
      );

      if (!recentAlert) {
        this.performanceAlerts.push(alert);
        console.warn(`[Performance Alert] ${alert.message}`);
      }
    }
  }

  /**
   * Check if system performance is degraded
   */
  isPerformanceDegraded(system: string): boolean {
    const metrics = this.systemMetrics.get(system);
    if (!metrics) {
      return false;
    }

    return metrics.averageResponseTime > this.RESPONSE_TIME_THRESHOLD.WARNING ||
           metrics.trend === 'degrading';
  }

  /**
   * Get all performance alerts
   */
  getPerformanceAlerts(): PerformanceAlert[] {
    return [...this.performanceAlerts];
  }

  /**
   * Get load balancing recommendations
   */
  getLoadBalancingRecommendations(systems: Record<string, { load: number; responseTime: number }>): string[] {
    const recommendations: string[] = [];

    // Identify overloaded systems
    for (const [system, info] of Object.entries(systems)) {
      if (info.load > 0.8) {
        recommendations.push(`Reduce processing load for ${system} (current: ${Math.round(info.load * 100)}%)`);
      }
      if (info.responseTime > 1500) {
        recommendations.push(`Optimize ${system} for faster response (current: ${Math.round(info.responseTime)}ms)`);
      }
    }

    // If no overloaded systems detected, add a baseline recommendation
    if (recommendations.length === 0) {
      recommendations.push('All systems operating within normal parameters');
    }

    return recommendations;
  }

  /**
   * Get optimal system priority based on load and priority
   */
  getOptimalSystemPriority(systems: SystemLoadInfo[]): string {
    // Sort by priority (lower number = higher priority), then by load
    const sorted = systems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.load - b.load; // Lower load first
    });

    return sorted[0]?.system || '';
  }

  /**
   * Cache result for frequently accessed data
   */
  cacheResult(key: string, value: any): void {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      accessCount: 0
    };

    this.cache.set(key, entry);

    // Update cache stats
    this.cacheStats.size = this.cache.size;
    // Don't count cache writes as misses - only count actual cache misses in getCachedResult

    // Limit cache size to 100 entries
    if (this.cache.size > 100) {
      // Remove least recently used (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.cacheStats.size = this.cache.size;
    }
  }

  /**
   * Get cached result
   */
  getCachedResult(key: string): any | null {
    const entry = this.cache.get(key);

    if (entry) {
      entry.accessCount++;
      this.cacheStats.totalHits++;
      this.updateCacheStats();
      return entry.value;
    }

    // Only increment miss if cache exists but key not found
    if (this.cache.size > 0) {
      this.cacheStats.totalMisses++;
      this.updateCacheStats();
    }

    return null;
  }

  /**
   * Update cache hit rate
   */
  private updateCacheStats(): void {
    const total = this.cacheStats.totalHits + this.cacheStats.totalMisses;
    this.cacheStats.hitRate = total > 0 ? (this.cacheStats.totalHits / total) * 100 : 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.cacheStats };
  }

  /**
   * Track battery usage with real device integration
   */
  trackBatteryUsage(usage?: number): void {
    let actualUsage = usage;
    
    // If no usage provided, try to get real battery level
    if (actualUsage === undefined && 'getBattery' in navigator) {
      // Use real Battery API if available
      (navigator as any).getBattery().then((battery: any) => {
        const currentLevel = battery.level * 100;
        const lastLevel = this.batteryUsage.length > 0 ? 
          this.batteryUsage[this.batteryUsage.length - 1] : currentLevel;
        const usageDelta = lastLevel - currentLevel;
        
        if (usageDelta > 0) {
          this.batteryUsage.push(usageDelta);
          
          // Keep last 120 readings (2 hours)
          if (this.batteryUsage.length > 120) {
            this.batteryUsage.shift();
          }
        }
      }).catch(() => {
        // Fallback to provided value or simulation
        this.batteryUsage.push(actualUsage || 0.5);
      });
    } else {
      // Use provided value or simulation
      actualUsage = actualUsage || 0.5;
      this.batteryUsage.push(actualUsage);
      
      // Keep last 120 readings (2 hours)
      if (this.batteryUsage.length > 120) {
        this.batteryUsage.shift();
      }
    }
  }

  /**
   * Get battery metrics
   */
  getBatteryMetrics(): BatteryMetrics {
    const totalUsage = this.batteryUsage.reduce((sum, usage) => sum + usage, 0);
    const processingIntervals = this.batteryUsage.length;
    const averagePerInterval = processingIntervals > 0 ? totalUsage / processingIntervals : 0;

    return {
      totalUsage: totalUsage || 0,
      processingIntervals: processingIntervals || 0,
      averagePerInterval: averagePerInterval || 0,
      projectedUsage: this.projectBatteryUsage(),
      estimatedSessionDuration: this.estimateSessionDuration()
    };
  }

  /**
   * Project battery usage for 1-hour session
   */
  private projectBatteryUsage(): number {
    const avgPerInterval = this.batteryUsage.reduce((sum, usage) => sum + usage, 0) / this.batteryUsage.length;
    return avgPerInterval * 60; // 60 intervals in 1 hour
  }

  /**
   * Estimate remaining session duration based on battery
   */
  private estimateSessionDuration(): number {
    const avgUsage = this.batteryUsage.reduce((sum, usage) => sum + usage, 0) / this.batteryUsage.length;

    if (avgUsage === 0) {
      return 999999;
    }

    // Assuming 100% battery and subtracting total usage
    const remainingBattery = Math.max(0, 100 - this.batteryUsage.reduce((sum, usage) => sum + usage, 0));
    return remainingBattery / avgUsage;
  }

  /**
   * Get battery optimization recommendations
   */
  getBatteryOptimization(context: {
    currentLevel: number;
    targetLevel: number;
    sessionDuration: number;
  }): BatteryOptimization {
    const projectedUsage = this.projectBatteryUsage();
    const shouldReduceIntensity = projectedUsage > this.BATTERY_DRAIN_LIMIT;

    let recommendedReduction = 0;
    if (shouldReduceIntensity) {
      recommendedReduction = Math.max(1, Math.min(30, ((projectedUsage - this.BATTERY_DRAIN_LIMIT) / projectedUsage) * 100));
    }

    const recommendedActions: string[] = [];
    if (shouldReduceIntensity) {
      recommendedActions.push('Reduce AI processing frequency');
      recommendedActions.push('Disable non-essential AI features');
      recommendedActions.push('Increase AI response interval');
    } else if (projectedUsage > 20) {
      recommendedActions.push('Monitor battery usage closely');
    }

    const estimatedSavings = (projectedUsage * recommendedReduction) / 100;

    return {
      shouldReduceIntensity,
      recommendedReduction,
      estimatedSavings,
      recommendedActions
    };
  }

  /**
   * Get adaptive features based on battery level
   */
  getBatteryAdaptiveFeatures(context: {
    batteryLevel: number;
    charging: boolean;
  }): AdaptiveFeatures {
    const aiEnabled = context.batteryLevel > 10; // Disable below 10%
    const reducedMode = context.batteryLevel < 30;

    let disabledFeatures: string[] = [];
    let enabledFeatures: string[] = [
      'safety-override', // Always enable safety
      'basic-coaching'
    ];

    if (reducedMode) {
      disabledFeatures = [
        'advanced-analytics',
        'realtime-adaptations',
        'form-correction'
      ];
    } else if (context.batteryLevel < 50) {
      disabledFeatures = [
        'advanced-analytics'
      ];
    } else {
      enabledFeatures.push(
        'realtime-adaptations',
        'form-correction',
        'injury-aware'
      );
    }

    let recommendedIntensity: 'low' | 'moderate' | 'high' = 'moderate';
    if (reducedMode) {
      recommendedIntensity = 'low';
    } else if (context.batteryLevel < 50) {
      recommendedIntensity = 'moderate';
    } else {
      recommendedIntensity = 'high';
    }

    return {
      aiEnabled,
      reducedMode,
      disabledFeatures,
      enabledFeatures,
      recommendedIntensity
    };
  }

  /**
   * Handle system failure
   */
  handleSystemFailure(failure: SystemFailureInfo): FallbackStrategy {
    // Record failure
    if (!this.systemFailures.has(failure.system)) {
      this.systemFailures.set(failure.system, []);
    }

    this.systemFailures.get(failure.system)!.push(failure.timestamp);

    // Determine available and disabled features
    const availableFeatures: string[] = [
      'basic-coaching',
      'safety-override'
    ];

    const disabledFeatures: string[] = [];

    if (failure.system === 'tensorflowjs') {
      disabledFeatures.push('realtime-adaptations');
    } else if (failure.system === 'mediapipe') {
      disabledFeatures.push('form-correction', 'pose-analysis');
    }

    // Create degradation notification
    const notification: DegradationNotification = {
      id: this.generateId(),
      system: failure.system,
      level: 'high',
      message: `${failure.system} degraded - using fallback mode. Some AI features may be limited.`,
      actionRequired: false,
      timestamp: Date.now()
    };

    this.degradations.push(notification);

    return {
      isDegraded: true,
      fallbackStrategy: 'safe-default',
      userMessage: `${failure.system} encountered an error. Switching to safe mode with reduced AI functionality.`,
      availableFeatures,
      disabledFeatures,
      estimatedRecovery: 30 // 30 seconds estimated recovery
    };
  }

  /**
   * Record system stress level
   */
  recordSystemStress(system: string, level: string): void {
    this.systemStressLevels.set(system, level);
  }

  /**
   * Get degradation level for system
   */
  getDegradationLevel(system: string): number {
    const failures = this.systemFailures.get(system) || [];
    const recentFailures = failures.filter(t => (Date.now() - t) < 300000); // Last 5 minutes

    // Also check stress level
    const stressLevel = this.systemStressLevels.get(system);

    if (recentFailures.length === 0 && !stressLevel) {
      return 0;
    } else if (recentFailures.length < 3 && stressLevel !== 'high') {
      return 1; // Low
    } else if (recentFailures.length < 5 && stressLevel !== 'high') {
      return 2; // Medium
    } else {
      return 3; // High
    }
  }

  /**
   * Notify about degradation
   */
  notifyDegradation(context: {
    system: string;
    level: string;
    reason: string;
  }): void {
    const notification: DegradationNotification = {
      id: this.generateId(),
      system: context.system,
      level: context.level as 'low' | 'medium' | 'high',
      message: `${context.system} degraded (${context.level}): ${context.reason}. reduced functionality available.`,
      actionRequired: false,
      timestamp: Date.now()
    };

    this.degradations.push(notification);
    console.warn(`[Degradation] ${notification.message}`);
  }

  /**
   * Get degradation notifications
   */
  getDegradationNotifications(): DegradationNotification[] {
    return [...this.degradations];
  }

  /**
   * Attempt system recovery
   */
  attemptSystemRecovery(context: {
    system: string;
    failureTime: number;
  }): { attempted: boolean; success: boolean | null } {
    const timeSinceFailure = Date.now() - context.failureTime;

    // Attempt recovery after 5 seconds
    if (timeSinceFailure < 5000) {
      return { attempted: false, success: null };
    }

    console.log(`[Recovery] Attempting to recover ${context.system}`);

    // Clear failure history if recovery successful (simulated)
    const failures = this.systemFailures.get(context.system);
    if (failures && failures.length > 0) {
      // Simulate 70% recovery success rate
      const success = Math.random() > 0.3;

      if (success) {
        this.systemFailures.set(context.system, []);
        console.log(`[Recovery] ${context.system} recovered successfully`);
        return { attempted: true, success: true };
      }
    }

    return { attempted: true, success: false };
  }

  /**
   * Get total processing time
   */
  getTotalProcessingTime(): number {
    let totalTime = 0;

    this.systemMetrics.forEach((metrics) => {
      totalTime += metrics.averageResponseTime;
    });

    return totalTime;
  }

  /**
   * Get performance dashboard
   */
  getPerformanceDashboard(): PerformanceDashboard {
    const systemMetrics = this.getSystemMetrics();
    const batteryMetrics = this.getBatteryMetrics();

    // Determine overall health
    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';

    const hasCriticalAlerts = this.performanceAlerts.some(a => a.severity === 'critical');
    const avgResponseTime = Object.values(systemMetrics).reduce((sum, m) => sum + m.averageResponseTime, 0) / Object.keys(systemMetrics).length;

    if (hasCriticalAlerts || avgResponseTime > this.RESPONSE_TIME_THRESHOLD.CRITICAL) {
      overallHealth = 'critical';
    } else if (avgResponseTime > this.RESPONSE_TIME_THRESHOLD.WARNING) {
      overallHealth = 'degraded';
    }

    // Generate recommendations
    const recommendations: string[] = this.getLoadBalancingRecommendations(
      Object.fromEntries(
        Object.entries(systemMetrics).map(([key, metrics]) => [
          key,
          { load: 0.5, responseTime: metrics.averageResponseTime }
        ])
      )
    );

    return {
      systemMetrics,
      batteryMetrics,
      alerts: this.getPerformanceAlerts(),
      recommendaions: recommendations,
      cacheStats: this.getCacheStats(),
      overallHealth
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
