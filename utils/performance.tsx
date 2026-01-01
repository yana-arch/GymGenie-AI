/**
 * Performance Monitoring Utilities
 * Track component renders, API calls, and user interactions
 */

import React from "react";

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ComponentRenderMetric {
  componentName: string;
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  lastRender: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private renderMetrics: Map<string, ComponentRenderMetric> = new Map();
  private maxMetrics = 1000;
  private enabled = process.env.NODE_ENV === "development";

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled || typeof performance === "undefined") return;
    performance.mark(`${name}-start`);
  }

  /**
   * Measure the duration since the mark was set
   */
  measure(name: string, metadata?: Record<string, any>): number | null {
    if (!this.enabled || typeof performance === "undefined") return null;

    try {
      const startMark = `${name}-start`;
      const endMark = `${name}-end`;

      performance.mark(endMark);
      performance.measure(name, startMark, endMark);

      const measure = performance.getEntriesByName(name, "measure")[0];
      const duration = measure?.duration ?? 0;

      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });

      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);

      return duration;
    } catch (error) {
      console.error("Performance measurement error:", error);
      return null;
    }
  }

  /**
   * Track a component render
   */
  trackRender(componentName: string, duration: number): void {
    if (!this.enabled) return;

    const existing = this.renderMetrics.get(componentName);

    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newTotalDuration = existing.totalDuration + duration;

      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: newRenderCount,
        totalDuration: newTotalDuration,
        averageDuration: newTotalDuration / newRenderCount,
        lastRender: Date.now(),
      });
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalDuration: duration,
        averageDuration: duration,
        lastRender: Date.now(),
      });
    }
  }

  /**
   * Track an API call
   */
  async trackApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return apiCall();
    }

    this.mark(`api-${name}`);
    const startTime = Date.now();

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;

      this.addMetric({
        name: `api-${name}`,
        duration,
        timestamp: startTime,
        metadata: { status: "success" },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.addMetric({
        name: `api-${name}`,
        duration,
        timestamp: startTime,
        metadata: { status: "error", error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Track user interaction
   */
  trackInteraction(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.addMetric({
      name: `interaction-${name}`,
      duration: 0,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get render metrics
   */
  getRenderMetrics(): ComponentRenderMetric[] {
    return Array.from(this.renderMetrics.values());
  }

  /**
   * Get slowest renders
   */
  getSlowestRenders(limit = 10): ComponentRenderMetric[] {
    return this.getRenderMetrics()
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }

  /**
   * Get most frequent renders
   */
  getMostFrequentRenders(limit = 10): ComponentRenderMetric[] {
    return this.getRenderMetrics()
      .sort((a, b) => b.renderCount - a.renderCount)
      .slice(0, limit);
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    totalComponents: number;
    averageApiDuration: number;
    slowestApi: PerformanceMetric | null;
  } {
    const apiMetrics = this.metrics.filter((m) => m.name.startsWith("api-"));
    const totalApiDuration = apiMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageApiDuration =
      apiMetrics.length > 0 ? totalApiDuration / apiMetrics.length : 0;

    const slowestApi =
      apiMetrics.length > 0
        ? apiMetrics.reduce((slowest, current) =>
            current.duration > slowest.duration ? current : slowest
          )
        : null;

    return {
      totalMetrics: this.metrics.length,
      totalComponents: this.renderMetrics.size,
      averageApiDuration,
      slowestApi,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.renderMetrics.clear();
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        renderMetrics: Array.from(this.renderMetrics.values()),
        summary: this.getSummary(),
        timestamp: Date.now(),
      },
      null,
      2
    );
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Private methods

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Enforce max metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor };

/**
 * React hook for tracking component render performance
 */
export function useRenderTracking(componentName: string): void {
  if (process.env.NODE_ENV !== "development") return;

  const startTime = performance.now();

  React.useEffect(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackRender(componentName, duration);
  });
}

/**
 * HOC for tracking component performance
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const name =
    componentName ?? Component.displayName ?? Component.name ?? "Unknown";

  return function PerformanceTrackedComponent(props: P) {
    useRenderTracking(name);
    return <Component {...props} />;
  };
}


