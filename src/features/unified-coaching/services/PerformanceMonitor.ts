/**
 * Performance Monitor Service
 * Tracks AI system performance with device-aware metrics
 */

export interface DeviceProfile {
  cpuCores: number;
  memory: number;
  deviceType: 'high-end' | 'mid-range' | 'low-end';
}

export interface PerformanceMetrics {
  count: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  activeTrackers?: number;
}

export interface PerformanceSLA {
  maxResponseTime: number;
  deviceType: string;
  recommendations: string[];
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface DegradationReport {
  detected: boolean;
  factor: number;
  recommendation: string;
  baselineTime: number;
  currentTime: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private trackers: Map<string, PerformanceTracker> = new Map();
  private baselines: Map<string, number[]> = new Map();

  /**
   * Start tracking a performance operation
   */
  startTracking(operationName: string): PerformanceTracker {
    const tracker = new PerformanceTracker(operationName);
    this.trackers.set(operationName, tracker);
    return tracker;
  }

  /**
   * Calculate device-specific SLA
   */
  async calculateDeviceSLA(device: DeviceProfile): Promise<PerformanceSLA> {
    const baseResponseTime = 2000; // 2 seconds for high-end
    const cpuMultiplier = 8 / Math.max(device.cpuCores, 1);
    const memoryMultiplier = 8192 / Math.max(device.memory, 1024);
    
    const adjustedTime = baseResponseTime * cpuMultiplier * memoryMultiplier;
    const maxTime = Math.min(adjustedTime, 5000); // Cap at 5 seconds

    return {
      maxResponseTime: maxTime,
      deviceType: device.deviceType,
      recommendations: this.generateDeviceRecommendations(device)
    };
  }

  /**
   * Get metrics for all operations
   */
  getMetrics(): Record<string, PerformanceMetrics> {
    const result: Record<string, PerformanceMetrics> = {};
    
    this.metrics.forEach((value, key) => {
      result[key] = { ...value, activeTrackers: this.getActiveTrackerCount(key) };
    });
    
    return result;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    // Simulate memory metrics (in real implementation, use performance.memory)
    return {
      heapUsed: 25 * 1024 * 1024, // 25MB
      heapTotal: 50 * 1024 * 1024, // 50MB
      external: 5 * 1024 * 1024 // 5MB
    };
  }

  /**
   * Detect performance degradation
   */
  detectDegradation(operationName: string): DegradationReport {
    const baseline = this.getBaseline(operationName);
    const current = this.getAverageTime(operationName);
    
    if (!baseline || baseline === 0) {
      return {
        detected: false,
        factor: 1,
        recommendation: 'insufficient_data',
        baselineTime: 0,
        currentTime: current
      };
    }

    const factor = current / baseline;
    const detected = factor > 2.0; // 2x slower than baseline
    
    return {
      detected,
      factor,
      recommendation: detected ? 'investigate_performance_issue' : 'performance_normal',
      baselineTime: baseline,
      currentTime: current
    };
  }

  /**
   * Cleanup completed trackers and old metrics
   */
  cleanup(): void {
    // Clean up completed trackers
    this.trackers.forEach((tracker, key) => {
      if (!tracker.isActive()) {
        this.trackers.delete(key);
      }
    });
  }

  /**
   * Record baseline performance
   */
  recordBaseline(operationName: string, times: number[]): void {
    if (!this.baselines.has(operationName)) {
      this.baselines.set(operationName, []);
    }
    
    const existing = this.baselines.get(operationName)!;
    existing.push(...times);
    
    // Keep only last 10 measurements for baseline
    if (existing.length > 10) {
      this.baselines.set(operationName, existing.slice(-10));
    }
  }

  // Private helper methods

  private getAverageTime(operationName: string): number {
    const metrics = this.metrics.get(operationName);
    return metrics?.averageTime || 0;
  }

  private getBaseline(operationName: string): number {
    const times = this.baselines.get(operationName);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  private getActiveTrackerCount(operationName: string): number {
    let count = 0;
    this.trackers.forEach((tracker, key) => {
      if (key.startsWith(operationName) && tracker.isActive()) {
        count++;
      }
    });
    return count;
  }

  private generateDeviceRecommendations(device: DeviceProfile): string[] {
    const recommendations: string[] = [];
    
    if (device.cpuCores < 4) {
      recommendations.push('consider_reducing_concurrent_operations');
    }
    
    if (device.memory < 4096) {
      recommendations.push('optimize_memory_usage');
    }
    
    if (device.deviceType === 'low-end') {
      recommendations.push('use_simplified_ai_models');
    }
    
    return recommendations;
  }

  // Update metrics when tracker completes
  updateMetrics(operationName: string, duration: number): void {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        count: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }
    
    const metrics = this.metrics.get(operationName)!;
    metrics.count++;
    metrics.averageTime = (metrics.averageTime * (metrics.count - 1) + duration) / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.minTime = Math.min(metrics.minTime, duration);
  }
}

export class PerformanceTracker {
  private operationName: string;
  private startTime: number | null = null;
  private endTime: number | null = null;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
  }

  /**
   * End tracking and record metrics
   */
  end(): number {
    if (this.startTime === null) {
      throw new Error('Tracker not started');
    }
    
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    // This would be handled by the monitor in a real implementation
    return duration;
  }

  /**
   * Get tracking duration
   */
  getDuration(): number {
    if (this.startTime === null) {
      throw new Error('Tracker not started');
    }
    
    const endTime = this.endTime || performance.now();
    return endTime - this.startTime;
  }

  /**
   * Check if tracker is still active
   */
  isActive(): boolean {
    return this.endTime === null && this.startTime !== null;
  }

  /**
   * Get operation name
   */
  getOperationName(): string {
    return this.operationName;
  }
}