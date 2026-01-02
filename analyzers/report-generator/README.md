# Report Generator

Generates comprehensive reports from analysis and execution results in multiple formats (JSON, HTML, Markdown).

## Overview

The Report Generator aggregates analysis reports from various analyzers and execution results to create comprehensive, formatted reports with visualizations and recommendations.

## Features

- **Multiple Output Formats**: JSON, HTML, Markdown
- **Interactive HTML Dashboard**: Visual charts and metrics
- **Comprehensive Summary**: Aggregated statistics and metrics
- **Recommendations**: Actionable suggestions based on analysis
- **Execution Results**: Include cleanup execution details
- **Customizable**: Flexible options for report generation

## Usage

```typescript
import { ReportGenerator } from "./analyzers/report-generator";
import { ComprehensiveAnalysisReport } from "./analyzers/cleanup-plan/types";

// Create generator
const generator = new ReportGenerator();

// Generate HTML report
const htmlReport = await generator.generateReport(
  analysisReport,
  executionResult,
  {
    format: "html",
    outputPath: "reports/cleanup-report.html",
    projectName: "GymGenie AI",
    title: "Code Cleanup Analysis Report",
    includeDetails: true,
    includeVisualizations: true,
  }
);

console.log("HTML report generated");
```

## Report Formats

### JSON Format

Machine-readable format containing all data:

```typescript
const jsonReport = await generator.generateReport(
  analysisReport,
  executionResult,
  {
    format: "json",
    outputPath: "reports/cleanup-report.json",
  }
);
```

### Markdown Format

Human-readable format for documentation:

```typescript
const markdownReport = await generator.generateReport(
  analysisReport,
  executionResult,
  {
    format: "markdown",
    outputPath: "reports/cleanup-report.md",
    includeDetails: true,
  }
);
```

### HTML Format

Interactive dashboard with visualizations:

```typescript
const htmlReport = await generator.generateReport(
  analysisReport,
  executionResult,
  {
    format: "html",
    outputPath: "reports/cleanup-report.html",
    includeVisualizations: true,
  }
);
```

## Report Options

### ReportOptions

- `format`: Output format ('json' | 'html' | 'markdown')
- `outputPath`: File path to save report (optional)
- `includeDetails`: Include detailed analysis (default: false)
- `includeVisualizations`: Include charts (HTML only, default: false)
- `projectName`: Project name for report header
- `title`: Custom report title

## Report Contents

### Summary Section

- Total issues found
- Issues by type (dead code, duplicates, orphaned files, etc.)
- Files analyzed and affected
- Estimated impact (lines removed, bundle size reduction)
- Time estimate for cleanup

### Issues by Type

Breakdown of issues:

- Dead Code (unused exports, functions, variables, types)
- Duplicate Code (code blocks, similarity scores)
- Orphaned Files (unreferenced files)
- Unused Imports
- Type Issues

### Recommendations

Actionable suggestions based on analysis:

- Priority actions to take
- High-impact improvements
- Safety considerations

### Execution Results (if available)

- Actions executed, succeeded, failed
- Duration
- Test results
- Checkpoint information

## Example Reports

### Markdown Report Example

```markdown
# Code Cleanup Analysis Report

**Project:** GymGenie AI
**Generated:** 2025-01-02T10:30:00.000Z
**Report ID:** 550e8400-e29b-41d4-a716-446655440000

## Summary

- **Total Issues Found:** 45
- **Files Affected:** 23
- **Estimated Lines Removed:** 320
- **Estimated Bundle Size Reduction:** 16000 bytes
- **Estimated Time:** 90 minutes

## Issues by Type

| Issue Type     | Count |
| -------------- | ----- |
| Dead Code      | 18    |
| Duplicate Code | 12    |
| Orphaned Files | 8     |
| Unused Imports | 7     |

## Recommendations

- Remove 18 unused exports to reduce bundle size
- Refactor 5 high-impact duplicate code blocks to improve maintainability
- Delete 8 orphaned files that are safe to remove
```

### HTML Report Features

The HTML report includes:

- Responsive design
- Summary cards with key metrics
- Interactive tables
- Color-coded status badges
- Professional styling
- Print-friendly layout

## Complete Workflow Example

```typescript
import { CleanupPlanGenerator } from "./analyzers/cleanup-plan";
import { CleanupExecutor } from "./analyzers/cleanup-executor";
import { ReportGenerator } from "./analyzers/report-generator";

// 1. Generate cleanup plan
const planGenerator = new CleanupPlanGenerator();
const plan = await planGenerator.generatePlan(analysisReport);

// 2. Execute cleanup
const executor = new CleanupExecutor();
const executionResult = await executor.execute(plan, {
  createBackup: true,
  runTests: true,
});

// 3. Generate reports in multiple formats
const reportGenerator = new ReportGenerator();

// HTML report for viewing
await reportGenerator.generateReport(analysisReport, executionResult, {
  format: "html",
  outputPath: "reports/cleanup-report.html",
  projectName: "GymGenie AI",
  includeVisualizations: true,
});

// JSON report for processing
await reportGenerator.generateReport(analysisReport, executionResult, {
  format: "json",
  outputPath: "reports/cleanup-report.json",
});

// Markdown report for documentation
await reportGenerator.generateReport(analysisReport, executionResult, {
  format: "markdown",
  outputPath: "reports/cleanup-report.md",
  includeDetails: true,
});
```

## Requirements Validation

This implementation validates:

- **Requirement 1.5**: Generates report of detected dead code with file locations
- **Requirement 10.4**: Generates detailed change report after cleanup
- **Requirement 11.5**: Generates quality dashboard with visual metrics

## Testing

See `__tests__/ReportGenerator.test.ts` for unit tests.
