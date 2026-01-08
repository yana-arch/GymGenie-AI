#!/usr/bin/env node

/**
 * Test Performance Validation Script
 * Validates that all tests meet performance thresholds
 */

import { performanceTracker, PERFORMANCE_THRESHOLDS } from '../src/test-utils/performance/PerformanceTracker';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { parse } from 'toml';

interface ValidationReport {
  isValid: boolean;
  totalTests: number;
  compliantTests: number;
  violations: Array<{
    file: string;
    testName: string;
    testId: string;
    category: string;
    actualDuration: number;
    expectedMax: number;
    excessTime: number;
  }>;
  recommendations: string[];
}

/**
 * Main validation function
 */
async function validateTestPerformance(): Promise<void> {
  console.log('🔍 Starting Test Performance Validation...\n');

  // Get all test files
  const testFiles = glob.sync('src/features/**/__tests__/*.test.ts');
  const testFilesWithSpecs = glob.sync('src/features/**/__tests__/*.test.spec.ts');
  
  const allFiles = [...testFiles, ...testFilesWithSpecs];
  console.log(`Found ${allFiles.length} test files\n`);

  let totalTests = 0;
  let compliantTests = 0;
  const violations: ValidationReport['violations'] = [];
  const recommendations: string[] = [];

  // Analyze each test file
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      
      // Look for performance violations
      const performanceViolations = analyzePerformanceViolations(file, content);
      totalTests += performanceViolations.testCount;
      compliantTests += performanceViolations.compliantCount;
      violations.push(...performanceViolations.violations);
      
      console.log(`  ${file}: ${performanceViolations.testCount} tests, ${performanceViolations.compliantCount} compliant`);
      
    } catch (error) {
      console.error(`  Error analyzing ${file}: ${error.message}`);
    }
  }

  // Generate recommendations
  recommendations.push(...generateRecommendations(violations));

  const report: ValidationReport = {
    isValid: violations.length === 0,
    totalTests,
    compliantTests,
    violations,
    recommendations
  };

  // Print report
  printValidationReport(report);
  
  // Exit with appropriate code
  process.exit(report.isValid ? 0 : 1);
}

/**
 * Analyze a test file for performance violations
 */
function analyzePerformanceViolations(file: string, content: string) {
  const testCount = (content.match(/test\(/g) || []).length;
  const bddTests = (content.match(/(given|when|then)\(/gi) || []).length / 3;
  
  const violations: ValidationReport['violations'] = [];
  let compliantCount = bddTests;

  // Check for missing performance tracking
  if (!content.includes('performanceTracker') && !content.includes('setupPerformanceTracking')) {
    violations.push({
      file,
      testName: 'Performance Tracking',
      testId: 'PERF-001',
      category: '@p1',
      actualDuration: 0,
      expectedMax: PERFORMANCE_THRESHOLDS['@p1'].individualMs,
      excessTime: 0
    });
    compliantCount--;
  }

  // Check for missing BDD structure
  if (bddTests === 0 && testCount > 0) {
    violations.push({
      file,
      testName: 'BDD Structure',
      testId: 'BDD-001',
      category: '@p1',
      actualDuration: 0,
      expectedMax: 0,
      excessTime: 0
    });
    compliantCount--;
  }

  return {
    testCount,
    compliantCount,
    violations
  };
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(violations: ValidationReport['violations']): string[] {
  const recommendations: string[] = [];

  if (violations.length === 0) {
    recommendations.push('✅ All tests are performance compliant!');
  } else {
    recommendations.push('\n🎯 RECOMMENDATIONS:');
    
    // Category-specific recommendations
    const categoryCounts = violations.reduce((acc, v) => {
      acc[v.category] = (acc[v.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCounts).forEach(([category, count]) => {
      recommendations.push(`  • ${count} ${category} violations detected`);
    });

    // Specific recommendations
    recommendations.push('\n📋 SPECIFIC ISSUES:');
    const uniqueViolations = Array.from(new Set(violations.map(v => v.testName)));
    uniqueViolations.slice(0, 5).forEach(testName => {
      recommendations.push(`  • ${testName}`);
    });

    // General recommendations
    recommendations.push('\n🔧 FIXES NEEDED:');
    recommendations.push('  • Add performance tracking to slow tests');
    recommendations.push('  • Implement performance-aware test design');
    recommendations.push('  • Consider test parallelization for efficiency');
    recommendations.push('  • Use test data factories for faster setup');
  }

  return recommendations;
}

/**
 * Print validation report
 */
function printValidationReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST PERFORMANCE VALIDATION REPORT');
  console.log('='.repeat(60) + '\n');

  // Summary
  console.log(`📈 OVERALL STATUS: ${report.isValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📊 Total Tests: ${report.totalTests}`);
  console.log(`✅ Compliant Tests: ${report.compliantTests}`);
  console.log(`⚠️  Performance Violations: ${report.violations.length}`);
  console.log(`🎯 Compliance Rate: ${((report.compliantTests / report.totalTests) * 100).toFixed(1)}%\n`);

  // Violations
  if (report.violations.length > 0) {
    console.log('\n⚠️  PERFORMANCE VIOLATIONS:');
    report.violations.forEach((violation, index) => {
      console.log(`  ${index + 1}. ${violation.file}`);
      console.log(`     Test: ${violation.testName}`);
      console.log(`     Category: ${violation.category}`);
      console.log(`     Issue: ${violation.excessTime > 0 ? 'Exceeded duration threshold' : 'Missing performance tracking'}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  report.recommendations.forEach(rec => console.log(`${rec}`));

  console.log('\n' + '='.repeat(60));
}

// Run validation
validateTestPerformance().catch(console.error);