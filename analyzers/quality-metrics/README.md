# Quality Metrics Calculator

Calculates code quality metrics including coverage, complexity, maintainability, and overall code health.

## Overview

The Quality Metrics Calculator analyzes your codebase to provide comprehensive quality metrics and enables before/after comparisons to measure improvements from cleanup operations.

## Features

- **Code Coverage**: Lines, statements, functions, branches coverage
- **Complexity Analysis**: Cyclomatic complexity, high-complexity function detection
- **Maintainability Index**: Overall maintainability score and technical debt estimation
- **Code Health Score**: Weighted overall health score with letter grade
- **Before/After Comparison**: Track improvements from cleanup operations
- **Customizable**: Flexible options for metric calculation

## Usage

```typescript
import { QualityMetricsCalculator } from "./analyzers/quality-metrics";

// Create calculator
const calculator = new QualityMetricsCalculator();

// Calculate metrics
const metrics = await calculator.calculateMetrics({
  includeCoverage: true,
  includeComplexity: true,
  includeMaintainability: true,
  complexityThreshold: 10,
  files: ["**/*.ts", "**/*.tsx"],
  exclude: ["**/node_modules/**", "**/*.test.*"],
});

console.log(
  `Code Health Score: ${metrics.codeHealth.score} (${metrics.codeHealth.grade})`
);
console.log(`Coverage: ${metrics.coverage.overall}%`);
console.log(
  `Average Complexity: ${metrics.complexity.averageCyclomaticComplexity}`
);
console.log(
  `Maintainability Index: ${metrics.maintainability.maintainabilityIndex}`
);
```

## Metrics Calculated

### Coverage Metrics

- Lines coverage
- Statements coverage
- Functions coverage
- Branches coverage
- Overall coverage percentage

### Complexity Metrics

- Average cyclomatic complexity
- Maximum cyclomatic complexity
- High-complexity functions list
- Complexity distribution (low/medium/high/very high)

### Maintainability Metrics

- Maintainability index (0-100)
- Average lines per file
- Average functions per file
- Files with issues count
- Technical debt estimation

### Code Health Score

Weighted score combining:

- Coverage (30%)
- Complexity (30%)
- Maintainability (40%)

Letter grades: A (90+), B (80-89), C (70-79), D (60-69), F (<60)

## Before/After Comparison

Compare metrics before and after cleanup:

```typescript
// Calculate metrics before cleanup
const beforeMetrics = await calculator.calculateMetrics();

// ... perform cleanup operations ...

// Calculate metrics after cleanup
const afterMetrics = await calculator.calculateMetrics();

// Compare
const comparison = calculator.compareMetrics(beforeMetrics, afterMetrics);

console.log(comparison.improvements.summary);
console.log(`Coverage improved: ${comparison.improvements.coverage.improved}`);
console.log(
  `Complexity reduced: ${comparison.improvements.complexity.improved}`
);
console.log(
  `Code health improved by: ${comparison.improvements.codeHealth.change} points`
);
```

## Metrics Options

### MetricsOptions

- `includeCoverage`: Include coverage analysis (default: true)
- `includeComplexity`: Include complexity analysis (default: true)
- `includeMaintainability`: Include maintainability analysis (default: true)
- `complexityThreshold`: Threshold for flagging high-complexity functions (default: 10)
- `files`: File patterns to analyze (default: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'])
- `exclude`: Patterns to exclude (default: ['**/node_modules/**', '**/dist/**', '**/*.test.*'])

## Complexity Thresholds

- **Low** (1-5): Simple, easy to maintain
- **Medium** (6-10): Acceptable complexity
- **High** (11-20): Consider refactoring
- **Very High** (21+): Critical, needs immediate attention

## Example Output

```typescript
{
  timestamp: Date,
  coverage: {
    lines: { total: 1000, covered: 750, percentage: 75 },
    statements: { total: 1200, covered: 900, percentage: 75 },
    functions: { total: 150, covered: 120, percentage: 80 },
    branches: { total: 200, covered: 140, percentage: 70 },
    overall: 75
  },
  complexity: {
    averageCyclomaticComplexity: 5.2,
    maxCyclomaticComplexity: 18,
    highComplexityFunctions: [
      {
        file: 'src/utils/complex.ts',
        name: 'processData',
        line: 42,
        complexity: 18,
        recommendation: 'High: Refactor to reduce complexity'
      }
    ],
    totalFunctions: 150,
    complexityDistribution: {
      low: 120,
      medium: 25,
      high: 4,
      veryHigh: 1
    }
  },
  maintainability: {
    maintainabilityIndex: 78,
    averageLinesPerFile: 150,
    averageFunctionsPerFile: 8.5,
    filesWithIssues: 3,
    totalFiles: 50,
    technicalDebt: {
      estimatedHours: 6,
      severity: 'low',
      issues: []
    }
  },
  codeHealth: {
    score: 76,
    grade: 'C',
    factors: {
      coverage: 75,
      complexity: 74,
      maintainability: 78,
      duplication: 85
    }
  }
}
```

## Complete Workflow

```typescript
import { QualityMetricsCalculator } from "./analyzers/quality-metrics";
import { CleanupPlanGenerator } from "./analyzers/cleanup-plan";
import { CleanupExecutor } from "./analyzers/cleanup-executor";

// 1. Calculate metrics before cleanup
const calculator = new QualityMetricsCalculator();
const beforeMetrics = await calculator.calculateMetrics();

console.log(
  `Before - Code Health: ${beforeMetrics.codeHealth.score} (${beforeMetrics.codeHealth.grade})`
);

// 2. Generate and execute cleanup plan
const planGenerator = new CleanupPlanGenerator();
const plan = await planGenerator.generatePlan(analysisReport);

const executor = new CleanupExecutor();
await executor.execute(plan, {
  createBackup: true,
  runTests: true,
});

// 3. Calculate metrics after cleanup
const afterMetrics = await calculator.calculateMetrics();

console.log(
  `After - Code Health: ${afterMetrics.codeHealth.score} (${afterMetrics.codeHealth.grade})`
);

// 4. Compare and report improvements
const comparison = calculator.compareMetrics(beforeMetrics, afterMetrics);

console.log("\n=== Improvements ===");
console.log(comparison.improvements.summary);
console.log(
  `\nCoverage: ${beforeMetrics.coverage.overall}% → ${afterMetrics.coverage.overall}%`
);
console.log(
  `Complexity: ${beforeMetrics.complexity.averageCyclomaticComplexity} → ${afterMetrics.complexity.averageCyclomaticComplexity}`
);
console.log(
  `Maintainability: ${beforeMetrics.maintainability.maintainabilityIndex} → ${afterMetrics.maintainability.maintainabilityIndex}`
);
console.log(
  `Code Health: ${beforeMetrics.codeHealth.grade} → ${afterMetrics.codeHealth.grade}`
);
```

## Requirements Validation

This implementation validates:

- **Requirement 11.1**: Calculates code coverage percentage
- **Requirement 11.2**: Identifies high-complexity functions
- **Requirement 11.3**: Includes maintainability index for each module
- **Requirement 11.4**: Compares before/after cleanup statistics

## Testing

See `__tests__/QualityMetricsCalculator.test.ts` for unit tests and property-based tests.
