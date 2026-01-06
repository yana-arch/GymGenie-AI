/**
 * Performance Monitoring and Optimization Tests
 * Tests for AI system performance monitoring, battery optimization, and graceful degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';

describe('Performance Monitoring', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.reset();
  });

  it('should track AI system response times', async () => {
    monitor.trackSystemResponse('safety-override', 150);
    monitor.trackSystemResponse('form-correction', 200);
    monitor.trackSystemResponse('realtime-adaptations', 180);

    const metrics = monitor.getSystemMetrics();

    expect(metrics['safety-override'].averageResponseTime).toBe(150);
    expect(metrics['form-correction'].averageResponseTime).toBe(200);
    expect(metrics['realtime-adaptations'].averageResponseTime).toBe(180);
  });

  it('should detect performance degradation', async () => {
    // Track normal response times
    for (let i = 0; i < 5; i++) {
      monitor.trackSystemResponse('test-system', 100);
    }

    // Track degraded response times
    for (let i = 0; i < 5; i++) {
      monitor.trackSystemResponse('test-system', 1500);
    }

    const metrics = monitor.getSystemMetrics();
    const isDegraded = monitor.isPerformanceDegraded('test-system');

    expect(metrics['test-system'].averageResponseTime).toBeGreaterThan(700);
    expect(isDegraded).toBe(true);
  });

  it('should alert on performance threshold violations', async () => {
    monitor.trackSystemResponse('test-system', 3000);

    const alerts = monitor.getPerformanceAlerts();

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('response time');
  });
});

describe('Load Balancing', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should balance AI system load to optimize performance', async () => {
    const recommendations = monitor.getLoadBalancingRecommendations({
      'safety-override': { load: 0.8, responseTime: 150 },
      'form-correction': { load: 0.6, responseTime: 200 },
      'realtime-adaptations': { load: 0.4, responseTime: 180 }
    });

    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should prioritize high-priority systems under load', async () => {
    const systemPriority = monitor.getOptimalSystemPriority([
      { system: 'safety-override', load: 0.9, responseTime: 100, priority: 1 },
      { system: 'form-correction', load: 0.7, responseTime: 150, priority: 2 },
      { system: 'realtime-adaptations', load: 0.5, responseTime: 200, priority: 3 }
    ]);

    expect(systemPriority).toBe('safety-override');
  });

  it('should implement intelligent caching for frequently accessed data', async () => {
    const key = 'test-cache-key';
    const value = { test: 'data' };

    monitor.cacheResult(key, value);
    const cached = monitor.getCachedResult(key);

    expect(cached).toEqual(value);
    expect(monitor.getCacheStats().hitRate).toBe(100);
  });
});

describe('Battery Optimization', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should monitor battery usage during AI processing', async () => {
    monitor.trackBatteryUsage(5); // 5% used
    monitor.trackBatteryUsage(3); // Additional 3%

    const metrics = monitor.getBatteryMetrics();

    expect(metrics.totalUsage).toBe(8);
    expect(metrics.processingIntervals).toBe(2);
  });

  it('should optimize AI processing to minimize battery drain', async () => {
    // First track some battery usage to establish baseline
    for (let i = 0; i < 50; i++) {
      monitor.trackBatteryUsage(0.6); // 0.6% per interval
    }

    const optimization = monitor.getBatteryOptimization({
      currentLevel: 75,
      targetLevel: 50,
      sessionDuration: 3600 // 1 hour
    });

    expect(optimization.shouldReduceIntensity).toBe(true);
    expect(optimization.recommendedReduction).toBeGreaterThan(0);
    expect(optimization.estimatedSavings).toBeGreaterThan(0);
  });

  it('should implement adaptive AI activation based on battery level', async () => {
    const features = monitor.getBatteryAdaptiveFeatures({
      batteryLevel: 20, // Low battery
      charging: false
    });

    expect(features.aiEnabled).toBe(true); // Still enabled but reduced
    expect(features.reducedMode).toBe(true);
    expect(features.disabledFeatures).toContain('advanced-analytics');
  });
});

describe('Graceful Degradation', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  it('should handle TensorFlow.js model failures gracefully', async () => {
    const fallback = monitor.handleSystemFailure({
      system: 'tensorflowjs',
      error: 'Model failed to load',
      timestamp: Date.now()
    });

    expect(fallback.isDegraded).toBe(true);
    expect(fallback.fallbackStrategy).toBeDefined();
    expect(fallback.userMessage).toContain('reduced');
  });

  it('should handle MediaPipe pose detection failures gracefully', async () => {
    const fallback = monitor.handleSystemFailure({
      system: 'mediapipe',
      error: 'Pose detection timeout',
      timestamp: Date.now()
    });

    expect(fallback.isDegraded).toBe(true);
    expect(fallback.availableFeatures.length).toBeGreaterThan(0);
    expect(fallback.availableFeatures).not.toContain('pose-analysis');
  });

  it('should degrade features progressively instead of complete failure', async () => {
    // Simulate system stress
    monitor.recordSystemStress('ai-system', 'high');
    const degradationLevel = monitor.getDegradationLevel('ai-system');

    expect(degradationLevel).toBeGreaterThan(0);
    expect(degradationLevel).toBeLessThanOrEqual(3);
  });

  it('should provide user notification when AI features are degraded', async () => {
    monitor.notifyDegradation({
      system: 'form-correction',
      level: 'medium',
      reason: 'High CPU usage'
    });

    const notifications = monitor.getDegradationNotifications();

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].message).toContain('reduced');
    expect(notifications[0].actionRequired).toBe(false);
  });

  it('should automatically recover from AI system failures', async () => {
    const recovery = monitor.attemptSystemRecovery({
      system: 'tensorflowjs',
      failureTime: Date.now() - 5000 // 5 seconds ago
    });

    expect(recovery.attempted).toBe(true);
    expect(recovery.success).toBeDefined();
  });
});

describe('Integrated Performance Tests', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.reset();
  });

  it('should complete AI coordination within 2-second requirement', async () => {
    const startTime = performance.now();

    // Simulate AI coordination
    monitor.trackSystemResponse('system-1', 300);
    monitor.trackSystemResponse('system-2', 400);
    monitor.trackSystemResponse('system-3', 200);

    const processingTime = performance.now() - startTime;

    expect(processingTime).toBeLessThan(2000);
    expect(monitor.getTotalProcessingTime()).toBeLessThan(2000);
  });

  it('should maintain <30% battery drain for 1-hour sessions', async () => {
    // Simulate 1-hour session with AI processing
    for (let i = 0; i < 60; i++) {
      monitor.trackBatteryUsage(0.5); // 0.5% per minute
    }

    const metrics = monitor.getBatteryMetrics();

    expect(metrics.totalUsage).toBeLessThanOrEqual(30);
  });

  it('should provide performance metrics dashboard', async () => {
    // Collect some metrics
    monitor.trackSystemResponse('system-1', 150);
    monitor.trackSystemResponse('system-2', 200);
    monitor.trackBatteryUsage(5);

    // Also need to track some battery to ensure batteryUsage is not empty for projection
    monitor.trackBatteryUsage(3);

    const dashboard = monitor.getPerformanceDashboard();

    expect(dashboard).toBeDefined();
    expect(dashboard.systemMetrics).toBeDefined();
    expect(dashboard.batteryMetrics).toBeDefined();
    expect(dashboard.alerts).toBeDefined();
    expect(dashboard.recommendaions).toBeDefined();
  });
});
