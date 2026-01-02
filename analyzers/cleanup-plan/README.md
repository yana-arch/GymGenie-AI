# Cleanup Plan Generator

Generates comprehensive cleanup plans from analysis reports with action dependency resolution, impact estimation, and safety level calculation.

## Overview

The Cleanup Plan Generator takes analysis reports from various analyzers (dead code, duplicates, orphaned files, etc.) and generates an ordered list of cleanup actions with estimated impact and safety levels.

## Features

- **Action Generation**: Creates cleanup actions from multiple analysis reports
- **Dependency Resolution**: Orders actions based on dependencies using topological sort
- **Impact Estimation**: Calculates estimated files affected, lines removed, and bundle size reduction
- **Safety Level Calculation**: Determines overall safety level (safe, review-needed, risky)
- **Flexible Options**: Supports filtering by confidence, impact, and review requirements

## Usage

```typescript
import { CleanupPlanGenerator } from "./analyzers/cleanup-plan";
import { ComprehensiveAnalysisReport } from "./analyzers/cleanup-plan/types";

// Create generator
const generator = new CleanupPlanGenerator();

// Prepare analysis report
const analysisReport: ComprehensiveAnalysisReport = {
  deadCode: deadCodeReport,
  duplicates: duplicateReport,
  orphanedFiles: orphanedFilesReport,
  unusedImports: unusedImportsReport,
};

// Generate cleanup plan
const plan = await generator.generatePlan(analysisReport, {
  safeOnly: false,
  minConfidence: "medium",
  prioritizeHighImpact: true,
  includeReviewRequired: true,
});

console.log(`Generated plan with ${plan.actions.length} actions`);
console.log(`Safety level: ${plan.safetyLevel}`);
console.log(
  `Estimated impact: ${plan.estimatedImpact.linesRemoved} lines removed`
);
```

## Options

### CleanupPlanOptions

- `safeOnly`: Include only safe actions (default: false)
- `minConfidence`: Minimum confidence level for actions ('high' | 'medium' | 'low')
- `maxActions`: Maximum number of actions to include
- `prioritizeHighImpact`: Prioritize high-impact actions (default: false)
- `includeReviewRequired`: Include actions that require review (default: false)

## Action Types

The generator creates actions for:

1. **remove-dead-code**: Remove unused exports, functions, variables
2. **remove-unused-import**: Remove unused import statements
3. **refactor-duplicate**: Refactor duplicate code blocks
4. **delete-orphaned-file**: Delete orphaned files
5. **consolidate-types**: Consolidate duplicate type definitions
6. **integrate-service**: Integrate or remove unused services
7. **fix-flow-violation**: Fix code flow violations
8. **break-circular-dependency**: Break circular dependencies

## Safety Levels

- **safe**: All actions are auto-executable with low risk
- **review-needed**: Some actions require manual review (20-50%)
- **risky**: Many actions require review or are high-risk (>50%)

## Impact Estimation

The generator estimates:

- **filesAffected**: Number of unique files that will be modified
- **linesRemoved**: Total lines of code to be removed
- **bundleSizeReduction**: Estimated bundle size reduction in bytes
- **estimatedTimeMinutes**: Estimated time to execute all actions

## Dependency Resolution

Actions are ordered using topological sort to ensure:

1. Dependencies are executed before dependent actions
2. No circular dependencies in action execution
3. Safe execution order for all actions

## Example Output

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  createdAt: "2025-01-02T10:30:00.000Z",
  analysisReport: { /* ... */ },
  actions: [
    {
      id: "action-1",
      type: "remove-unused-import",
      target: "src/components/Button.tsx:5",
      description: "Remove unused import 'useState' from src/components/Button.tsx",
      autoExecutable: true,
      requiresReview: false,
      estimatedImpact: 1,
      dependencies: []
    },
    {
      id: "action-2",
      type: "remove-dead-code",
      target: "src/utils/helpers.ts:42",
      description: "Remove unused function export 'formatDate' from src/utils/helpers.ts",
      autoExecutable: true,
      requiresReview: false,
      estimatedImpact: 10,
      dependencies: []
    }
  ],
  estimatedImpact: {
    filesAffected: 2,
    linesRemoved: 11,
    bundleSizeReduction: 550,
    estimatedTimeMinutes: 4
  },
  safetyLevel: "safe"
}
```

## Requirements Validation

This implementation validates:

- **Requirement 10.1**: Creates backup before making changes (safety level calculation)
- **Requirement 10.2**: Runs tests to verify functionality (action review flags)
- **Requirement 10.3**: Provides dry-run mode (action generation without execution)

## Testing

See `__tests__/CleanupPlanGenerator.test.ts` for unit tests and property-based tests.
