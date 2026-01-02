# Cleanup Executor

Executes cleanup actions from cleanup plans with backup creation, rollback support, and test verification.

## Overview

The Cleanup Executor takes a cleanup plan and executes the actions, with support for:

- Dry run mode to preview changes
- Automatic backup creation before modifications
- Test verification after cleanup
- Rollback capability if tests fail
- Action-specific execution strategies

## Features

- **Dry Run Mode**: Preview changes without applying them
- **Backup Creation**: Automatic backup of modified files
- **Test Verification**: Run tests after cleanup to ensure nothing broke
- **Rollback Support**: Restore from backup if needed
- **Action-Specific Executors**: Different execution strategies for different action types
- **Error Handling**: Continue or stop on error
- **Verbose Logging**: Detailed execution logs

## Usage

```typescript
import { CleanupExecutor } from "./analyzers/cleanup-executor";
import { CleanupPlan } from "./analyzers/cleanup-plan/types";

// Create executor
const executor = new CleanupExecutor();

// Execute cleanup plan
const result = await executor.execute(plan, {
  dryRun: false,
  createBackup: true,
  runTests: true,
  testCommand: "npm test",
  stopOnError: false,
  skipReviewRequired: true,
  verbose: true,
});

console.log(`Executed ${result.successfulActions} actions successfully`);
console.log(
  `Failed: ${result.failedActions}, Skipped: ${result.skippedActions}`
);

if (result.testsRun) {
  console.log(`Tests ${result.testsPassed ? "passed" : "failed"}`);
}
```

## Execution Options

### ExecutionOptions

- `dryRun`: Preview changes without applying them (default: false)
- `createBackup`: Create backup before execution (default: false)
- `runTests`: Run tests after execution (default: false)
- `testCommand`: Test command to run (default: 'npm test')
- `stopOnError`: Stop on first error (default: false)
- `skipReviewRequired`: Skip actions that require review (default: false)
- `verbose`: Verbose output (default: false)

## Action Types

The executor handles these action types:

1. **remove-dead-code**: Remove unused exports, functions, variables
2. **remove-unused-import**: Remove unused import statements
3. **delete-orphaned-file**: Delete orphaned files
4. **refactor-duplicate**: Refactor duplicate code (requires manual review)
5. **consolidate-types**: Consolidate duplicate types (requires manual review)

## Dry Run Mode

Dry run mode allows you to preview what changes would be made without actually modifying files:

```typescript
const dryRunResult = await executor.execute(plan, {
  dryRun: true,
});

// Dry run returns a result with skippedActions = totalActions
console.log(`Would modify ${dryRunResult.modifications.length} files`);
```

## Backup and Rollback

The executor can create backups before making changes:

```typescript
const result = await executor.execute(plan, {
  createBackup: true,
});

// Backup is stored in .cleanup-backups/<timestamp>/
console.log(`Backup created at: ${executor.getBackupDir()}`);
console.log(`Checkpoint ID: ${executor.getCheckpointId()}`);
```

To rollback changes, use the RollbackManager with the checkpoint ID.

## Test Verification

Run tests after cleanup to ensure nothing broke:

```typescript
const result = await executor.execute(plan, {
  runTests: true,
  testCommand: "npm test",
});

if (result.testsRun && !result.testsPassed) {
  console.error("Tests failed after cleanup!");
  console.error(result.testOutput);
  // Rollback changes
}
```

## Execution Result

The executor returns a detailed result:

```typescript
{
  planId: "plan-id",
  startTime: Date,
  endTime: Date,
  duration: 5000, // milliseconds
  totalActions: 10,
  successfulActions: 8,
  failedActions: 1,
  skippedActions: 1,
  results: [
    {
      action: CleanupAction,
      success: true,
      filesModified: ["src/file.ts"],
      linesChanged: 5,
      duration: 100
    }
  ],
  checkpointId: "2025-01-02T10-30-00-000Z",
  testsRun: true,
  testsPassed: true,
  testOutput: "All tests passed"
}
```

## Error Handling

The executor provides flexible error handling:

```typescript
// Stop on first error
const result = await executor.execute(plan, {
  stopOnError: true,
});

// Continue on errors
const result = await executor.execute(plan, {
  stopOnError: false,
});

// Check individual action results
for (const actionResult of result.results) {
  if (!actionResult.success) {
    console.error(`Action failed: ${actionResult.error}`);
  }
}
```

## Requirements Validation

This implementation validates:

- **Requirement 10.1**: Creates backup before making changes
- **Requirement 10.2**: Runs tests to verify no functionality is broken
- **Requirement 10.4**: Generates detailed change report

## Example

```typescript
import { CleanupPlanGenerator } from "./analyzers/cleanup-plan";
import { CleanupExecutor } from "./analyzers/cleanup-executor";

// Generate plan
const generator = new CleanupPlanGenerator();
const plan = await generator.generatePlan(analysisReport);

// Execute with safety measures
const executor = new CleanupExecutor();
const result = await executor.execute(plan, {
  createBackup: true,
  runTests: true,
  stopOnError: true,
  skipReviewRequired: true,
  verbose: true,
});

if (result.testsPassed) {
  console.log("Cleanup successful!");
} else {
  console.error("Cleanup failed tests, rolling back...");
  // Use RollbackManager to restore
}
```

## Testing

See `__tests__/CleanupExecutor.test.ts` for unit tests.
