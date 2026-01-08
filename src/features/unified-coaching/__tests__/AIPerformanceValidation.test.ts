/**
 * @p0 P0 AI Performance Validation Tests (R-002)
 * Epic 1 - AI-Powered Workout Coaching
 * 
 * Tests for flexible device-specific AI adaptation response time validation
 * High-concurrency load testing scenarios
 * Request queuing and circuit breaker tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AIAdaptationService } from '../services/AIAdaptationService';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { CircuitBreaker } from '../services/CircuitBreaker';
import { RequestQueue } from '../services/RequestQueue';

describe('@p0 AI Performance Validation Tests', () => {
  let aiService: AIAdaptationService;
  let performanceMonitor: PerformanceMonitor;
  let circuitBreaker: CircuitBreaker;
  let requestQueue: RequestQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIAdaptationService();
    performanceMonitor = new PerformanceMonitor();
    circuitBreaker = new CircuitBreaker();
    requestQueue = new RequestQueue();
  });

  describe('@p0 Device-Specific Performance Validation', () => {
    it('should adapt response times based on device capabilities', async () => {
      // Arrange
      const highEndDevice = {
        cpuCores: 8,
        memory: 8192,
        gpu: true,
        deviceType: 'high-end'
      };

      const lowEndDevice = {
        cpuCores: 2,
        memory: 2048,
        gpu: false,
        deviceType: 'low-end'
      };

      // Act
      const highEndSLA = await performanceMonitor.calculateDeviceSLA(highEndDevice);
      const lowEndSLA = await performanceMonitor.calculateDeviceSLA(lowEndDevice);

      // Assert - Flexible SLA based on device capability
      expect(highEndSLA.maxResponseTime).toBeLessThan(lowEndSLA.maxResponseTime);
      expect(highEndSLA.maxResponseTime).toBeLessThanOrEqual(2000); // High-end still gets good performance
      expect(lowEndSLA.maxResponseTime).toBeLessThanOrEqual(5000); // Low-end gets reasonable extension
    });

    it('should measure actual AI adaptation response time', async () => {
      // Arrange
      const mockRequest = {
        userId: 'test-user',
        context: {
          energyLevel: 'normal',
          timeRemaining: 1800,
          equipmentAvailable: ['dumbbells', 'bench']
        },
        deviceProfile: {
          cpuCores: 4,
          memory: 4096,
          deviceType: 'mid-range'
        }
      };

      const performanceTracker = performanceMonitor.startTracking('ai_adaptation');

      // Act
      const startTime = performance.now();
      const result = await aiService.generateAdaptation(mockRequest);
      const endTime = performance.now();
      const actualResponseTime = endTime - startTime;

      performanceTracker.end();

      // Assert
      expect(result).toBeDefined();
      expect(actualResponseTime).toBeGreaterThan(0);
      expect(performanceTracker.getDuration()).toBeCloseTo(actualResponseTime, 0);
    });

    it('should report SLA breach when response time exceeds device threshold', async () => {
      // Arrange
      const deviceProfile = {
        cpuCores: 2,
        memory: 2048,
        deviceType: 'low-end'
      };

      const sla = await performanceMonitor.calculateDeviceSLA(deviceProfile);
      const mockRequest = { userId: 'test-user', context: {} };

      // Mock slow AI processing
      vi.spyOn(aiService, 'generateAdaptation').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, sla.maxResponseTime + 100));
        return { adaptation: 'test' };
      });

      // Act
      const result = await aiService.generateAdaptationWithSLA(mockRequest, deviceProfile);

      // Assert
      expect(result.slaBreach).toBe(true);
      expect(result.responseTime).toBeGreaterThan(sla.maxResponseTime);
      expect(result.adaptation).toBeDefined(); // Still returns adaptation even if SLA breached
    });
  });

  describe('@p0 High-Concurrency Load Testing', () => {
    it('should handle 10 concurrent adaptation requests', async () => {
      // Arrange
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i}`,
        context: { energyLevel: 'normal', timeRemaining: 1800 }
      }));

      // Act
      const startTime = performance.now();
      const results = await Promise.all(
        concurrentRequests.map(request => 
          aiService.generateAdaptation(request)
        )
      );
      const endTime = performance.now();

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.userId).toBe(`user-${index}`);
      });
      
      // Should complete within reasonable time even under load
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for 10 concurrent requests
    });

    it('should maintain performance under sustained load', async () => {
      // Arrange
      const sustainedRequests = Array.from({ length: 50 }, (_, i) => ({
        userId: `load-test-${i}`,
        context: { energyLevel: 'normal', timeRemaining: 1800 }
      }));

      const responseTimes: number[] = [];

      // Act - Process in batches to simulate sustained load
      for (let i = 0; i < sustainedRequests.length; i += 5) {
        const batch = sustainedRequests.slice(i, i + 5);
        const batchStart = performance.now();
        
        await Promise.all(
          batch.map(request => aiService.generateAdaptation(request))
        );
        
        const batchEnd = performance.now();
        responseTimes.push(batchEnd - batchStart);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Assert
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      expect(avgResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(maxResponseTime).toBeLessThan(8000); // Max under 8 seconds
    });

    it('should queue requests when system is overloaded', async () => {
      // Arrange
      requestQueue.setMaxSize(20);
      requestQueue.setMaxConcurrent(3);

      const overloadRequests = Array.from({ length: 25 }, (_, i) => ({
        id: `req-${i}`,
        request: { userId: `user-${i}`, context: {} }
      }));

      // Act
      const startTime = performance.now();
      const processingPromises = overloadRequests.map(({ id, request }) =>
        requestQueue.enqueue(id, () => aiService.generateAdaptation(request))
      );
      
      const results = await Promise.allSettled(processingPromises);
      const endTime = performance.now();

      // Assert
      expect(results).toHaveLength(25);
      
      // All should eventually complete (either fulfilled or rejected)
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      
      expect(fulfilled.length + rejected.length).toBe(25);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('@p0 Circuit Breaker Testing', () => {
    it('should open circuit when failure threshold is reached', async () => {
      // Arrange
      circuitBreaker.configure({
        failureThreshold: 3,
        resetTimeout: 5000,
        monitoringPeriod: 10000
      });

      // Mock AI service failures
      vi.spyOn(aiService, 'generateAdaptation')
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Service error'));

      // Act - Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(() => 
            aiService.generateAdaptation({ userId: 'test', context: {} })
          );
        } catch (error) {
          // Expected failures
        }
      }

      // Assert
      expect(circuitBreaker.getState()).toBe('open');
      
      // Subsequent calls should fail fast without hitting the service
      await expect(
        circuitBreaker.execute(() => aiService.generateAdaptation({ userId: 'test', context: {} }))
      ).rejects.toThrow('Circuit breaker is open');
    });

    it('should attempt to close circuit after reset timeout', async () => {
      // Arrange
      circuitBreaker.configure({
        failureThreshold: 2,
        resetTimeout: 1000,
        monitoringPeriod: 5000
      });

      // Trigger circuit to open
      vi.spyOn(aiService, 'generateAdaptation')
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ adaptation: 'success' });

      // Act - Trigger failures to open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(() => 
            aiService.generateAdaptation({ userId: 'test', context: {} })
          );
        } catch (error) {
          // Expected failures
        }
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try again - should attempt to close circuit
      const result = await circuitBreaker.execute(() => 
        aiService.generateAdaptation({ userId: 'test', context: {} })
      );

      // Assert
      expect(result.adaptation).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('@p0 Performance Monitoring Integration', () => {
    it('should track and report performance metrics', async () => {
      // Arrange
      const mockRequest = {
        userId: 'perf-test-user',
        context: { energyLevel: 'normal', timeRemaining: 1800 },
        deviceProfile: {
          cpuCores: 4,
          memory: 4096,
          deviceType: 'mid-range'
        }
      };

      // Act
      const tracker = performanceMonitor.startTracking('test_operation');
      await aiService.generateAdaptation(mockRequest);
      tracker.end();

      // Assert
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveProperty('test_operation');
      expect(metrics.test_operation.count).toBe(1);
      expect(metrics.test_operation.averageTime).toBeGreaterThan(0);
      expect(metrics.test_operation.maxTime).toBeGreaterThanOrEqual(metrics.test_operation.averageTime);
      expect(metrics.test_operation.minTime).toBeLessThanOrEqual(metrics.test_operation.averageTime);
    });

    it('should detect performance degradation', async () => {
      // Arrange
      const baselineRequest = {
        userId: 'baseline-user',
        context: { energyLevel: 'normal', timeRemaining: 1800 }
      };

      // Establish baseline
      for (let i = 0; i < 5; i++) {
        const tracker = performanceMonitor.startTracking('baseline');
        await aiService.generateAdaptation(baselineRequest);
        tracker.end();
      }

      // Mock degradation
      vi.spyOn(aiService, 'generateAdaptation').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Slow response
        return { adaptation: 'slow_response' };
      });

      // Act
      const degradedTracker = performanceMonitor.startTracking('degraded_test');
      await aiService.generateAdaptation(baselineRequest);
      degradedTracker.end();

      // Assert
      const degradation = performanceMonitor.detectDegradation('baseline');
      expect(degradation.detected).toBe(true);
      expect(degradation.factor).toBeGreaterThan(2.0); // At least 2x slower
      expect(degradation.recommendation).toContain('investigate');
    });
  });

  describe('@p0 Memory and Resource Management', () => {
    it('should monitor memory usage during AI processing', async () => {
      // Arrange
      const largeRequests = Array.from({ length: 20 }, (_, i) => ({
        userId: `memory-test-${i}`,
        context: {
          energyLevel: 'normal',
          timeRemaining: 1800,
          // Simulate large context data
          history: Array.from({ length: 100 }, (_, j) => ({
            exercise: `exercise-${j}`,
            performance: Math.random()
          }))
        }
      }));

      // Act
      const initialMemory = performanceMonitor.getMemoryUsage();
      
      await Promise.all(
        largeRequests.map(request => aiService.generateAdaptation(request))
      );
      
      const finalMemory = performanceMonitor.getMemoryUsage();

      // Assert
      expect(finalMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
      expect(finalMemory.heapTotal).toBeGreaterThanOrEqual(initialMemory.heapTotal);
      
      // Memory should not grow excessively
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });

    it('should cleanup resources after processing', async () => {
      // Arrange
      const request = {
        userId: 'cleanup-test',
        context: { energyLevel: 'normal', timeRemaining: 1800 }
      };

      // Act
      const tracker = performanceMonitor.startTracking('cleanup_test');
      await aiService.generateAdaptation(request);
      tracker.end();

      // Trigger cleanup
      performanceMonitor.cleanup();

      // Assert
      const metrics = performanceMonitor.getMetrics();
      // Should have cleaned up completed trackers
      expect(metrics.cleanup_test?.activeTrackers || 0).toBe(0);
    });
  });
});

// Helper types
interface DeviceProfile {
  cpuCores: number;
  memory: number;
  gpu: boolean;
  deviceType: 'high-end' | 'mid-range' | 'low-end';
}

interface AIRequest {
  userId: string;
  context: {
    energyLevel: 'normal' | 'tired';
    timeRemaining: number;
    equipmentAvailable?: string[];
  };
  deviceProfile?: DeviceProfile;
}

interface AIResponse {
  adaptation: any;
  responseTime: number;
  slaBreach: boolean;
}