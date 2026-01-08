/**
 * Performance Test Integration with Vitest
 * Integrates performance tracking and validation into the test framework
 */

import { performanceTracker } from '../performance/PerformanceTracker';
import { beforeAll, afterAll } from 'vitest';

/**
 * Performance-aware test wrapper functions
 */
export const createPerformanceTest = (
  testName: string,
  testId: string,
  category: string,
  testFn: () => Promise<void> | void
) => {
  return async () => {
    performanceTracker.startTest(testName, testId, category);
    
    try {
      await testFn();
    } finally {
      performanceTracker.endTest(testName, testId, category);
    }
  };
};

/**
 * Category-specific performance test creators
 */
export const wrapSmokeTest = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@smoke', testFn);

export const wrapP0Test = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@p0', testFn);

export const wrapP1Test = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@p1', testFn);

export const wrapP2Test = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@p2', testFn);

export const wrapP3Test = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@p3', testFn);

export const wrapMediumPriorityTest = (testName: string, testId: string, testFn: () => Promise<void> | void) =>
  createPerformanceTest(testName, testId, '@p2', testFn);

/**
 * Global performance setup for test suites
 */
export function setupPerformanceTracking() {
  // Reset performance tracking before each test run
  beforeAll(() => {
    performanceTracker.reset();
  });

  // Generate performance report after all tests
  afterAll(() => {
    const metrics = performanceTracker.getMetrics();
    
    if (metrics.length > 0) {
      const summary = performanceTracker.getPerformanceSummary();
      
      console.log('\n📊 PERFORMANCE SUMMARY:');
      console.log(`Total Tests: ${summary.totalTests}`);
      console.log(`Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
      
      // Category breakdown
      Object.entries(summary.categorySummaries).forEach(([category, result]) => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const duration = (result.totalDuration / 1000).toFixed(2);
        console.log(`${category.toUpperCase()}: ${status} (${duration}s)`);
      });
      
      // Check for slow tests
      if (summary.slowTests.length > 0) {
        console.log('\n⚠️  PERFORMANCE ISSUES:');
        summary.slowTests.forEach(test => {
          const testDuration = (test.duration / 1000).toFixed(2);
          console.log(`  - ${test.testId}: ${testDuration}s (exceeded threshold)`);
        });
      }
    }
  });
}

/**
 * Performance assertion helpers
 */
export const assertPerformanceWithinThreshold = (
  testName: string,
  testId: string,
  category: string,
  maxDurationMs: number
) => {
  const metrics = performanceTracker.getMetrics();
  const testMetric = metrics.find(m => m.testId === testId && m.testName === testName);
  
  if (!testMetric || testMetric.duration > maxDurationMs) {
    const actualSeconds = (testMetric?.duration || 0) / 1000;
    const maxSeconds = maxDurationMs / 1000;
    
    throw new Error(
      `Performance assertion failed: ${testName} took ${actualSeconds}s, expected < ${maxSeconds}s`
    );
  }
};