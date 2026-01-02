import { QualityMetricsCalculator } from './QualityMetricsCalculator';

/**
 * Example: Calculate and compare quality metrics
 */
async function qualityMetricsExample() {
  const calculator = new QualityMetricsCalculator();

  // Example 1: Calculate basic metrics
  console.log('=== Example 1: Calculate Quality Metrics ===');
  const metrics = await calculator.calculateMetrics({
    includeCoverage: true,
    includeComplexity: true,
    includeMaintainability: true,
    complexityThreshold: 10,
  });

  console.log(`\nCode Health Score: ${metrics.codeHealth.score} (Grade: ${metrics.codeHealth.grade})`);
  console.log(`\nCoverage:`);
  console.log(`  Overall: ${metrics.coverage.overall}%`);
  console.log(`  Lines: ${metrics.coverage.lines.percentage}%`);
  console.log(`  Functions: ${metrics.coverage.functions.percentage}%`);
  console.log(`  Branches: ${metrics.coverage.branches.percentage}%`);

  console.log(`\nComplexity:`);
  console.log(`  Average: ${metrics.complexity.averageCyclomaticComplexity}`);
  console.log(`  Maximum: ${metrics.complexity.maxCyclomaticComplexity}`);
  console.log(`  Total Functions: ${metrics.complexity.totalFunctions}`);
  console.log(`  High Complexity Functions: ${metrics.complexity.highComplexityFunctions.length}`);

  console.log(`\nMaintainability:`);
  console.log(`  Index: ${metrics.maintainability.maintainabilityIndex}/100`);
  console.log(`  Avg Lines/File: ${metrics.maintainability.averageLinesPerFile}`);
  console.log(`  Avg Functions/File: ${metrics.maintainability.averageFunctionsPerFile}`);
  console.log(`  Files with Issues: ${metrics.maintainability.filesWithIssues}`);
  console.log(`  Technical Debt: ${metrics.maintainability.technicalDebt.estimatedHours} hours (${metrics.maintainability.technicalDebt.severity})`);

  console.log(`\nComplexity Distribution:`);
  console.log(`  Low (1-5): ${metrics.complexity.complexityDistribution.low}`);
  console.log(`  Medium (6-10): ${metrics.complexity.complexityDistribution.medium}`);
  console.log(`  High (11-20): ${metrics.complexity.complexityDistribution.high}`);
  console.log(`  Very High (21+): ${metrics.complexity.complexityDistribution.veryHigh}`);

  // Example 2: High complexity functions
  if (metrics.complexity.highComplexityFunctions.length > 0) {
    console.log(`\n=== Example 2: High Complexity Functions ===`);
    for (const func of metrics.complexity.highComplexityFunctions.slice(0, 5)) {
      console.log(`\n${func.name} (${func.file}:${func.line})`);
      console.log(`  Complexity: ${func.complexity}`);
      console.log(`  Recommendation: ${func.recommendation}`);
    }
  }

  // Example 3: Simulate before/after comparison
  console.log(`\n=== Example 3: Before/After Comparison ===`);

  // Simulate "before" metrics
  const beforeMetrics = metrics;

  // Simulate "after" metrics (with improvements)
  const afterMetrics = {
    ...metrics,
    coverage: {
      ...metrics.coverage,
      overall: metrics.coverage.overall + 5,
      lines: {
        ...metrics.coverage.lines,
        percentage: metrics.coverage.lines.percentage + 5,
      },
    },
    complexity: {
      ...metrics.complexity,
      averageCyclomaticComplexity: metrics.complexity.averageCyclomaticComplexity - 1.5,
      highComplexityFunctions: metrics.complexity.highComplexityFunctions.slice(0, -2),
    },
    maintainability: {
      ...metrics.maintainability,
      maintainabilityIndex: metrics.maintainability.maintainabilityIndex + 8,
      filesWithIssues: Math.max(0, metrics.maintainability.filesWithIssues - 3),
    },
    codeHealth: {
      ...metrics.codeHealth,
      score: metrics.codeHealth.score + 6,
      grade: 'B' as const,
    },
  };

  const comparison = calculator.compareMetrics(beforeMetrics, afterMetrics);

  console.log(`\nImprovements Summary:`);
  console.log(comparison.improvements.summary);

  console.log(`\nDetailed Changes:`);
  console.log(`  Coverage: ${comparison.improvements.coverage.improved ? '✓' : '✗'} ${comparison.improvements.coverage.change > 0 ? '+' : ''}${comparison.improvements.coverage.change.toFixed(1)}%`);
  console.log(`  Complexity: ${comparison.improvements.complexity.improved ? '✓' : '✗'} ${comparison.improvements.complexity.change > 0 ? '-' : '+'}${Math.abs(comparison.improvements.complexity.change).toFixed(1)}`);
  console.log(`  Maintainability: ${comparison.improvements.maintainability.improved ? '✓' : '✗'} ${comparison.improvements.maintainability.change > 0 ? '+' : ''}${comparison.improvements.maintainability.change.toFixed(1)}`);
  console.log(`  Code Health: ${comparison.improvements.codeHealth.improved ? '✓' : '✗'} ${comparison.improvements.codeHealth.change > 0 ? '+' : ''}${comparison.improvements.codeHealth.change.toFixed(1)}`);

  console.log(`\nBefore → After:`);
  console.log(`  Coverage: ${beforeMetrics.coverage.overall}% → ${afterMetrics.coverage.overall}%`);
  console.log(`  Complexity: ${beforeMetrics.complexity.averageCyclomaticComplexity} → ${afterMetrics.complexity.averageCyclomaticComplexity}`);
  console.log(`  Maintainability: ${beforeMetrics.maintainability.maintainabilityIndex} → ${afterMetrics.maintainability.maintainabilityIndex}`);
  console.log(`  Code Health: ${beforeMetrics.codeHealth.score} (${beforeMetrics.codeHealth.grade}) → ${afterMetrics.codeHealth.score} (${afterMetrics.codeHealth.grade})`);

  // Example 4: Custom file patterns
  console.log(`\n=== Example 4: Custom File Patterns ===`);
  const customMetrics = await calculator.calculateMetrics({
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
    complexityThreshold: 15,
  });

  console.log(`Analyzed ${customMetrics.maintainability.totalFiles} files`);
  console.log(`Code Health: ${customMetrics.codeHealth.score} (${customMetrics.codeHealth.grade})`);

  // Example 5: Code health factors breakdown
  console.log(`\n=== Example 5: Code Health Factors ===`);
  console.log(`Overall Score: ${metrics.codeHealth.score}/100 (${metrics.codeHealth.grade})`);
  console.log(`\nFactor Breakdown:`);
  console.log(`  Coverage:       ${metrics.codeHealth.factors.coverage}/100 (30% weight)`);
  console.log(`  Complexity:     ${metrics.codeHealth.factors.complexity}/100 (30% weight)`);
  console.log(`  Maintainability: ${metrics.codeHealth.factors.maintainability}/100 (40% weight)`);
  console.log(`  Duplication:    ${metrics.codeHealth.factors.duplication}/100`);
}

// Run example
if (require.main === module) {
  qualityMetricsExample().catch(console.error);
}

export { qualityMetricsExample };
