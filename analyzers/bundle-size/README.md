# Bundle Size Analyzer

Analyzes bundle size, identifies largest contributors, and provides optimization suggestions.

## Overview

The Bundle Size Analyzer examines your build output to identify optimization opportunities, suggest code splitting strategies, and verify tree shaking effectiveness.

## Features

- **Bundle Analysis**: Analyze build output and chunk sizes
- **Largest Contributors**: Identify modules/packages contributing most to bundle size
- **Optimization Suggestions**: Code splitting, dynamic imports, lazy loading
- **Tree Shaking Verification**: Check tree shaking effectiveness
- **Before/After Comparison**: Track bundle size improvements
- **Detailed Reports**: Comprehensive analysis with actionable recommendations

## Usage

```typescript
import { BundleSizeAnalyzer } from "./analyzers/bundle-size";

// Create analyzer
const analyzer = new BundleSizeAnalyzer();

// Analyze bundle
const report = await analyzer.analyze({
  buildCommand: "npm run build",
  outputDir: "dist",
  minSizeThreshold: 10000, // 10KB
  topContributorsCount: 10,
});

console.log(`Total Size: ${report.totalSize} bytes`);
console.log(`Gzipped: ${report.gzippedSize} bytes`);
console.log(`Chunks: ${report.chunks.length}`);
console.log(`Suggestions: ${report.suggestions.length}`);
```

## Analysis Options

### BundleSizeOptions

- `buildCommand`: Build command to run (default: 'npm run build')
- `outputDir`: Output directory to analyze (default: 'dist')
- `minSizeThreshold`: Minimum size threshold for reporting in bytes (default: 10000)
- `topContributorsCount`: Number of top contributors to report (default: 10)
- `includeSourceMaps`: Include source maps in analysis (default: false)

## Report Contents

### Bundle Chunks

Information about each chunk:

- Name and type (entry, vendor, async, shared)
- Size (raw and gzipped)
- Modules included
- Tree-shakeable status

### Largest Contributors

Top contributors to bundle size:

- Module/package name
- Size and percentage of total
- Type (module, package, asset)
- Optimization suggestion

### Optimization Suggestions

Actionable recommendations:

- **Code Splitting**: Split large chunks
- **Dynamic Imports**: Convert to lazy loading
- **Tree Shaking**: Improve dead code elimination
- **Lazy Loading**: Load on demand
- Priority level and estimated savings

### Tree Shaking Report

Effectiveness analysis:

- Is tree shaking working effectively
- Number of unused exports
- Potential savings
- Specific issues and suggestions

## Before/After Comparison

Compare bundle sizes to measure improvements:

```typescript
// Analyze before cleanup
const beforeReport = await analyzer.analyze();

// ... perform cleanup operations ...

// Analyze after cleanup
const afterReport = await analyzer.analyze();

// Compare
const comparison = analyzer.compareBundles(beforeReport, afterReport);

console.log(comparison.improvements.summary);
console.log(
  `Size reduction: ${comparison.improvements.totalSizeReduction} bytes`
);
console.log(
  `Percentage: ${comparison.improvements.percentageReduction.toFixed(1)}%`
);
```

## Example Report

```typescript
{
  timestamp: Date,
  totalSize: 2500000, // 2.5 MB
  gzippedSize: 750000, // 750 KB
  chunks: [
    {
      name: 'vendor.js',
      size: 1500000,
      gzippedSize: 450000,
      modules: [...],
      type: 'vendor'
    },
    {
      name: 'main.js',
      size: 800000,
      gzippedSize: 240000,
      modules: [...],
      type: 'entry'
    }
  ],
  largestContributors: [
    {
      name: 'vendor.js',
      size: 1500000,
      percentage: 60,
      type: 'package',
      suggestion: 'Critical: Consider code splitting or lazy loading'
    }
  ],
  suggestions: [
    {
      type: 'code-splitting',
      priority: 'high',
      description: 'Split 2 large chunks into smaller pieces',
      estimatedSavings: 450000,
      modules: ['vendor.js', 'main.js'],
      action: 'Use dynamic imports or route-based code splitting'
    }
  ],
  treeShakingEffectiveness: {
    isEffective: false,
    unusedExports: 15,
    potentialSavings: 200000,
    issues: [...]
  }
}
```

## Optimization Strategies

### Code Splitting

Split large bundles into smaller chunks:

```typescript
// Before
import { HeavyComponent } from "./HeavyComponent";

// After
const HeavyComponent = lazy(() => import("./HeavyComponent"));
```

### Dynamic Imports

Load modules on demand:

```typescript
// Before
import analytics from "analytics-library";

// After
const analytics = await import("analytics-library");
```

### Tree Shaking

Ensure modules are tree-shakeable:

```typescript
// Bad (not tree-shakeable)
module.exports = { func1, func2 };

// Good (tree-shakeable)
export { func1, func2 };
```

### Lazy Loading

Load vendor libraries on demand:

```typescript
// Load chart library only when needed
const loadCharts = async () => {
  const { Chart } = await import("chart.js");
  return Chart;
};
```

## Complete Workflow

```typescript
import { BundleSizeAnalyzer } from "./analyzers/bundle-size";
import { CleanupExecutor } from "./analyzers/cleanup-executor";

// 1. Analyze current bundle
const analyzer = new BundleSizeAnalyzer();
const beforeReport = await analyzer.analyze();

console.log(`Before: ${beforeReport.totalSize} bytes`);
console.log(`Suggestions: ${beforeReport.suggestions.length}`);

// 2. Review suggestions
for (const suggestion of beforeReport.suggestions) {
  console.log(
    `\n${suggestion.priority.toUpperCase()}: ${suggestion.description}`
  );
  console.log(`Estimated savings: ${suggestion.estimatedSavings} bytes`);
  console.log(`Action: ${suggestion.action}`);
}

// 3. Perform cleanup
const executor = new CleanupExecutor();
await executor.execute(cleanupPlan);

// 4. Analyze after cleanup
const afterReport = await analyzer.analyze();

// 5. Compare results
const comparison = analyzer.compareBundles(beforeReport, afterReport);

console.log(`\n=== Results ===`);
console.log(comparison.improvements.summary);
console.log(`Before: ${beforeReport.totalSize} bytes`);
console.log(`After: ${afterReport.totalSize} bytes`);
console.log(
  `Reduction: ${comparison.improvements.percentageReduction.toFixed(1)}%`
);
```

## Requirements Validation

This implementation validates:

- **Requirement 9.1**: Identifies largest contributors to bundle size
- **Requirement 9.2**: Suggests code splitting opportunities
- **Requirement 9.3**: Verifies tree shaking is working effectively
- **Requirement 9.4**: Suggests dynamic imports for large modules
- **Requirement 9.5**: Measures bundle size impact of each optimization

## Testing

See `__tests__/BundleSizeAnalyzer.test.ts` for unit tests.
