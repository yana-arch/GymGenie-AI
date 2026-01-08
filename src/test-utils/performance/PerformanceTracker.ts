/**
 * Performance Tracking System for GymGenie-AI Tests
 * Monitors test execution times and validates against performance thresholds
 */

export interface PerformanceThreshold {
  totalMs: number;
  individualMs: number;
  category: string;
}

export interface TestPerformanceMetrics {
  testName: string;
  testId: string;
  startTime: number;
  endTime: number;
  duration: number;
  category: string;
  passedThreshold: boolean;
}

export const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThreshold> = {
  '@smoke': { totalMs: 120000, individualMs: 5000, category: 'Critical Path' },    // 2 min total, 5s each
  '@p0': { totalMs: 300000, individualMs: 10000, category: 'Critical Functionality' },      // 5 min total, 10s each
  '@p1': { totalMs: 900000, individualMs: 15000, category: 'High Priority Features' },      // 15 min total, 15s each
  '@p2': { totalMs: 1800000, individualMs: 30000, category: 'Medium Priority Features' },    // 30 min total, 30s each
  '@p3': { totalMs: 3600000, individualMs: 60000, category: 'Low Priority Features' }     // 60 min total, 60s each
};

export class PerformanceTracker {
  private metrics: TestPerformanceMetrics[] = [];
  private categoryStartTimes: Map<string, number> = new Map();
  private currentTestStart: number = 0;

  /**
   * Start tracking a test execution
   */
  startTest(testName: string, testId: string, category: string): void {
    this.currentTestStart = performance.now();
    
    // Track category start time for total duration calculation
    if (!this.categoryStartTimes.has(category)) {
      this.categoryStartTimes.set(category, performance.now());
    }
  }

  /**
   * End tracking a test execution and record metrics
   */
  endTest(testName: string, testId: string, category: string): void {
    const endTime = performance.now();
    const duration = endTime - this.currentTestStart;

    const threshold = PERFORMANCE_THRESHOLDS[category];
    const passedThreshold = duration <= threshold.individualMs;

    const metric: TestPerformanceMetrics = {
      testName,
      testId,
      startTime: this.currentTestStart,
      endTime,
      duration,
      category,
      passedThreshold
    };

    this.metrics.push(metric);
    this.currentTestStart = 0;
  }

  /**
   * Get performance metrics for all completed tests
   */
  getMetrics(): TestPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for specific category
   */
  getCategoryMetrics(category: string): TestPerformanceMetrics[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Get category total duration
   */
  getCategoryDuration(category: string): number {
    const categoryStartTime = this.categoryStartTimes.get(category);
    if (!categoryStartTime) return 0;

    const categoryMetrics = this.getCategoryMetrics(category);
    if (categoryMetrics.length === 0) return 0;

    const lastTestEnd = Math.max(...categoryMetrics.map(m => m.endTime));
    return lastTestEnd - categoryStartTime;
  }

  /**
   * Validate category against performance thresholds
   */
  validateCategory(category: string): {
    passed: boolean;
    totalDuration: number;
    threshold: PerformanceThreshold;
    slowTests: TestPerformanceMetrics[];
  } {
    const totalDuration = this.getCategoryDuration(category);
    const threshold = PERFORMANCE_THRESHOLDS[category];
    const slowTests = this.getCategoryMetrics(category).filter(test => !test.passedThreshold);
    
    return {
      passed: totalDuration <= threshold.totalMs && slowTests.length === 0,
      totalDuration,
      threshold,
      slowTests
    };
  }

  /**
   * Get performance summary for all tests
   */
  getPerformanceSummary(): {
    totalTests: number;
    totalDuration: number;
    categorySummaries: Record<string, ReturnType<typeof this.validateCategory>>;
    slowTests: TestPerformanceMetrics[];
  } {
    const categorySummaries: Record<string, ReturnType<typeof this.validateCategory>> = {};
    
    Object.keys(PERFORMANCE_THRESHOLDS).forEach(category => {
      categorySummaries[category] = this.validateCategory(category);
    });

    const slowTests = this.metrics.filter(test => !test.passedThreshold);

    return {
      totalTests: this.metrics.length,
      totalDuration: this.metrics.reduce((sum, test) => sum + test.duration, 0),
      categorySummaries,
      slowTests
    };
  }

  /**
   * Reset all tracking metrics
   */
  reset(): void {
    this.metrics = [];
    this.categoryStartTimes.clear();
    this.currentTestStart = 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    
    let report = '\n📊 PERFORMANCE BENCHMARK REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    // Summary
    report += `📈 OVERALL SUMMARY:\n`;
    report += `  Total Tests: ${summary.totalTests}\n`;
    report += `  Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s\n`;
    report += `  Slow Tests: ${summary.slowTests.length}\n\n`;

    // Category breakdown
    report += `📋 CATEGORY BREAKDOWN:\n`;
    Object.entries(summary.categorySummaries).forEach(([category, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = (result.totalDuration / 1000).toFixed(2);
      const threshold = (result.threshold.totalMs / 1000).toFixed(2);
      
      report += `  ${category.toUpperCase()}: ${status}\n`;
      report += `    Duration: ${duration}s / ${threshold}s (${result.threshold.category})\n`;
      report += `    Slow Tests: ${result.slowTests.length}\n`;
      
      if (result.slowTests.length > 0) {
        report += `    Slow Test Details:\n`;
        result.slowTests.forEach((test: TestPerformanceMetrics) => {
          const testDuration = (test.duration / 1000).toFixed(2);
          report += `      - ${test.testId}: ${testDuration}s\n`;
        });
      }
      report += '\n';
    });

    // Slow tests details
    if (summary.slowTests.length > 0) {
      report += `⚠️  PERFORMANCE ISSUES DETECTED:\n`;
      report += `  ${summary.slowTests.length} tests exceeded duration thresholds\n`;
      report += `  Consider optimization or test refactoring\n\n`;
    }

    return report;
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();

// Performance thresholds are already exported with PERFORMANCE_THRESHOLDS