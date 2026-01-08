/**
 * Benchmark Validation Utility for GymGenie-AI Tests
 * Validates test performance against predefined thresholds
 */

import { performanceTracker, PERFORMANCE_THRESHOLDS, TestPerformanceMetrics } from './PerformanceTracker';

export interface BenchmarkValidation {
  isValid: boolean;
  violations: {
    category: string;
    testName: string;
    testId: string;
    actualDuration: number;
    expectedMax: number;
    excessTime: number;
  }[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    slowTests: number;
  };
  recommendations: string[];
}

export class BenchmarkValidator {
  /**
   * Validate performance metrics against thresholds
   */
  static validatePerformance(metrics: TestPerformanceMetrics[]): BenchmarkValidation {
    const violations: BenchmarkValidation['violations'] = [];
    let passedTests = 0;
    let slowTests = 0;

    metrics.forEach(metric => {
      const threshold = PERFORMANCE_THRESHOLDS[metric.category];
      
      if (!threshold) {
        // Unknown category, use default P1 threshold
        const defaultThreshold = PERFORMANCE_THRESHOLDS['@p1'];
        if (metric.duration > defaultThreshold.individualMs) {
          violations.push({
            category: metric.category,
            testName: metric.testName,
            testId: metric.testId,
            actualDuration: metric.duration,
            expectedMax: defaultThreshold.individualMs,
            excessTime: metric.duration - defaultThreshold.individualMs
          });
          slowTests++;
        } else {
          passedTests++;
        }
        return;
      }

      if (metric.duration > threshold.individualMs) {
        violations.push({
          category: metric.category,
          testName: metric.testName,
          testId: metric.testId,
          actualDuration: metric.duration,
          expectedMax: threshold.individualMs,
          excessTime: metric.duration - threshold.individualMs
        });
        slowTests++;
      } else {
        passedTests++;
      }
    });

    const isValid = violations.length === 0;
    
    return {
      isValid,
      violations,
      summary: {
        totalTests: metrics.length,
        passedTests,
        failedTests: metrics.length - passedTests,
        slowTests
      },
      recommendations: this.generateRecommendations(violations, metrics)
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private static generateRecommendations(
    violations: BenchmarkValidation['violations'],
    metrics: TestPerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
      recommendations.push(`🔧 Found ${violations.length} performance violations that need attention:`);
      
      // Category-specific recommendations
      const categoryViolations = violations.reduce((acc, violation) => {
        if (!acc[violation.category]) acc[violation.category] = [];
        acc[violation.category].push(violation);
        return acc;
      }, {} as Record<string, typeof violations>);

      Object.entries(categoryViolations).forEach(([category, categoryViols]) => {
        recommendations.push(`\n📋 ${category.toUpperCase()} Issues (${categoryViols.length}):`);
        categoryViols.forEach(violation => {
          const excessSeconds = (violation.excessTime / 1000).toFixed(2);
          recommendations.push(
            `  ⚠️  ${violation.testId}: ${excessSeconds}s over threshold`
          );
        });
      });
    }

    // General optimization recommendations
    const avgTestDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0) / metrics.length;
    const slowTestsCount = violations.length;
    
    if (slowTestsCount > 0) {
      recommendations.push('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
      
      if (avgTestDuration > 10000) { // 10 seconds average
        recommendations.push('  • Consider test parallelization');
      }
      
      if (slowTestsCount > metrics.length * 0.3) { // 30% slow tests
        recommendations.push('  • Review test isolation and cleanup');
        recommendations.push('  • Optimize mock data generation');
      }
      
      if (violations.some(v => v.excessTime > 30000)) { // 30 seconds over
        recommendations.push('  • Consider breaking down complex tests');
        recommendations.push('  • Review test data size and complexity');
      }
    }

    return recommendations;
  }

  /**
   * Quick performance check for single test
   */
  static validateSingleTest(
    testName: string,
    testId: string,
    category: string,
    duration: number
  ): BenchmarkValidation {
    const metric: TestPerformanceMetrics = {
      testName,
      testId,
      startTime: 0,
      endTime: duration,
      duration,
      category,
      passedThreshold: duration <= (PERFORMANCE_THRESHOLDS[category]?.individualMs || 15000)
    };

    return this.validatePerformance([metric]);
  }

  /**
   * Generate performance compliance report
   */
  static generateComplianceReport(validation: BenchmarkValidation): string {
    let report = '\n📊 BENCHMARK VALIDATION REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    // Overall status
    const status = validation.isValid ? '✅ PASS' : '❌ FAIL';
    report += `🎯 OVERALL STATUS: ${status}\n`;
    report += `  Tests: ${validation.summary.totalTests}\n`;
    report += `  Passed: ${validation.summary.passedTests}\n`;
    report += `  Failed: ${validation.summary.failedTests}\n`;
    report += `  Slow: ${validation.summary.slowTests}\n\n`;

    // Violations details
    if (validation.violations.length > 0) {
      report += '⚠️  PERFORMANCE VIOLATIONS:\n';
      validation.violations.forEach(violation => {
        const actual = (violation.actualDuration / 1000).toFixed(2);
        const expected = (violation.expectedMax / 1000).toFixed(2);
        const excess = (violation.excessTime / 1000).toFixed(2);
        
        report += `  ${violation.testId}: ${actual}s (max: ${expected}s, +${excess}s)\n`;
      });
      report += '\n';
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      report += '💡 RECOMMENDATIONS:\n';
      validation.recommendations.forEach(rec => {
        report += `${rec}\n`;
      });
    }

    return report;
  }

  /**
   * Check if performance is within acceptable range
   */
  static isPerformanceAcceptable(validation: BenchmarkValidation): boolean {
    return validation.isValid && validation.summary.slowTests === 0;
  }

  /**
   * Get performance score (0-100)
   */
  static calculatePerformanceScore(validation: BenchmarkValidation): number {
    const { totalTests, passedTests, slowTests } = validation.summary;
    
    // Base score from passing tests
    const baseScore = (passedTests / totalTests) * 80; // 80% weight for functionality
    
    // Performance penalty for slow tests
    const slowTestPenalty = (slowTests / totalTests) * 20; // 20% penalty for performance
    
    const finalScore = Math.max(0, baseScore - slowTestPenalty);
    
    return Math.round(finalScore);
  }
}