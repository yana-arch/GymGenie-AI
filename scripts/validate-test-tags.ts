#!/usr/bin/env tsx

/**
 * Test Tag Compliance Validator
 * Validates that all tests have proper priority tags and follows guidelines
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface TestFile {
  path: string;
  content: string;
  tests: TestInfo[];
}

interface TestInfo {
  lineNumber: number;
  description: string;
  hasTag: boolean;
  tag: string | null;
  generator: string | null;
  isBDD: boolean;
}

interface ValidationReport {
  totalFiles: number;
  totalTests: number;
  taggedTests: number;
  untaggedTests: number;
  tagDistribution: Record<string, number>;
  violations: string[];
  recommendations: string[];
}

const PRIORITY_TAGS = ['@smoke', '@p0', '@p1', '@p2', '@p3'];
const VALID_GENERATORS = [
  'createSmokeTest',
  'createCriticalTest', 
  'createHighPriorityTest',
  'createMediumPriorityTest',
  'createLowPriorityTest',
  'createStorageTest',
  'createSessionTest',
  'createWorkoutTest',
  'createFeedbackTest',
  'createHistoricalTest',
  'createSafetyTest',
  'createFormTest',
  'createUnifiedTest',
  'createPreferenceTest',
  'createInjuryTest',
  'createComprehensiveTest'
];

async function findTestFiles(): Promise<string[]> {
  const pattern = '**/*.test.ts';
  return await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**']
  });
}

function parseTestFile(filePath: string, content: string): TestInfo[] {
  const tests: TestInfo[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Check for test patterns
    const testPatterns = [
      /then\s*\(\s*create\w+Test\s*\(\s*\d+\s*,\s*['"`]([^'"`]+)['"`]/,
      /it\s*\(\s*['"`]([^'"`]+)['"`]/,
      /test\s*\(\s*['"`]([^'"`]+)['"`]/
    ];
    
    for (const pattern of testPatterns) {
      const match = line.match(pattern);
      if (match) {
        const description = match[1];
        const hasTag = PRIORITY_TAGS.some(tag => description.includes(tag));
        const tag = PRIORITY_TAGS.find(tag => description.includes(tag)) || null;
        
        // Find which generator is used
        let generator: string | null = null;
        for (const gen of VALID_GENERATORS) {
          if (line.includes(gen)) {
            generator = gen;
            break;
          }
        }
        
        // Check if it's BDD structure
        const isBDD = content.includes('given(') || content.includes('when(') || content.includes('then(');
        
        tests.push({
          lineNumber,
          description,
          hasTag,
          tag,
          generator,
          isBDD
        });
      }
    }
  }
  
  return tests;
}

function validateTestFile(file: TestFile): string[] {
  const violations: string[] = [];
  
  for (const test of file.tests) {
    // Check for missing tags
    if (!test.hasTag) {
      violations.push(`${file.path}:${test.lineNumber} - Test "${test.description}" missing priority tag`);
    }
    
    // Check for proper generator usage
    if (test.tag && !test.generator) {
      violations.push(`${file.path}:${test.lineNumber} - Tagged test should use priority-specific generator`);
    }
    
    // Check generator consistency
    if (test.generator) {
      if (test.generator.includes('Smoke') && test.tag !== '@smoke') {
        violations.push(`${file.path}:${test.lineNumber} - Smoke generator used without @smoke tag`);
      }
      if (test.generator.includes('Critical') && test.tag !== '@p0') {
        violations.push(`${file.path}:${test.lineNumber} - Critical generator used without @p0 tag`);
      }
    }
  }
  
  return violations;
}

function generateReport(testFiles: TestFile[]): ValidationReport {
  const report: ValidationReport = {
    totalFiles: testFiles.length,
    totalTests: 0,
    taggedTests: 0,
    untaggedTests: 0,
    tagDistribution: {} as Record<string, number>,
    violations: [],
    recommendations: []
  };
  
  // Initialize tag distribution
  PRIORITY_TAGS.forEach(tag => {
    report.tagDistribution[tag] = 0;
  });
  
  for (const file of testFiles) {
    report.totalTests += file.tests.length;
    
    for (const test of file.tests) {
      if (test.hasTag) {
        report.taggedTests++;
        if (test.tag && report.tagDistribution[test.tag] !== undefined) {
          report.tagDistribution[test.tag]++;
        }
      } else {
        report.untaggedTests++;
      }
    }
    
    report.violations.push(...validateTestFile(file));
  }
  
  // Generate recommendations
  if (report.untaggedTests > 0) {
    report.recommendations.push(`${report.untaggedTests} tests need priority tags`);
  }
  
  const smokePercentage = (report.tagDistribution['@smoke'] / report.totalTests) * 100;
  if (smokePercentage > 20) {
    report.recommendations.push('Too many @smoke tests (should be < 20% of total)');
  }
  
  const p0Percentage = (report.tagDistribution['@p0'] / report.totalTests) * 100;
  if (p0Percentage > 25) {
    report.recommendations.push('Too many @p0 tests (should be < 25% of total)');
  }
  
  return report;
}

async function main() {
  try {
    console.log('🔍 Validating test tag compliance...\n');
    
    // Find all test files
    const testFilePaths = await findTestFiles();
    console.log(`Found ${testFilePaths.length} test files\n`);
    
    // Parse test files
    const testFiles: TestFile[] = [];
    
    for (const filePath of testFilePaths) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const tests = parseTestFile(filePath, content);
        testFiles.push({ path: filePath, content, tests });
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
      }
    }
    
    // Generate report
    const report = generateReport(testFiles);
    
    // Display results
    console.log('📊 VALIDATION REPORT');
    console.log('====================');
    console.log(`Total Files: ${report.totalFiles}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Tagged Tests: ${report.taggedTests} (${((report.taggedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`Untagged Tests: ${report.untaggedTests} (${((report.untaggedTests / report.totalTests) * 100).toFixed(1)}%)`);
    
    console.log('\n🏷️  TAG DISTRIBUTION');
    console.log('==================');
    for (const [tag, count] of Object.entries(report.tagDistribution)) {
      const percentage = ((count / report.totalTests) * 100).toFixed(1);
      console.log(`${tag}: ${count} tests (${percentage}%)`);
    }
    
    if (report.violations.length > 0) {
      console.log('\n❌ VIOLATIONS');
      console.log('============');
      report.violations.forEach(violation => {
        console.log(`  ${violation}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================');
      report.recommendations.forEach(rec => {
        console.log(`  ${rec}`);
      });
    }
    
    // Save detailed report
    const reportPath = 'test-tag-validation-report.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with error code if violations found
    if (report.violations.length > 0) {
      process.exit(1);
    } else {
      console.log('\n✅ All tests are properly tagged!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}