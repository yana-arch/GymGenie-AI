import { CleanupExecutor } from './CleanupExecutor';
import { CleanupPlan } from '../cleanup-plan/types';
import { CleanupAction } from '../types';

/**
 * Example: Execute a cleanup plan with various options
 */
async function executeCleanupExample() {
  // Create sample cleanup plan
  const samplePlan: CleanupPlan = {
    id: 'plan-123',
    createdAt: new Date(),
    analysisReport: {
      deadCode: undefined,
      duplicates: undefined,
      orphanedFiles: undefined,
    },
    actions: [
      {
        id: 'action-1',
        type: 'remove-unused-import',
        target: 'src/components/Button.tsx:5',
        description: "Remove unused import 'useState' from src/components/Button.tsx",
        autoExecutable: true,
        requiresReview: false,
        estimatedImpact: 1,
        dependencies: [],
      },
      {
        id: 'action-2',
        type: 'remove-dead-code',
        target: 'src/utils/helpers.ts:42',
        description: "Remove unused function export 'formatDate' from src/utils/helpers.ts",
        autoExecutable: true,
        requiresReview: false,
        estimatedImpact: 10,
        dependencies: [],
      },
      {
        id: 'action-3',
        type: 'delete-orphaned-file',
        target: 'src/legacy/OldComponent.tsx',
        description: 'Delete orphaned component file: src/legacy/OldComponent.tsx',
        autoExecutable: true,
        requiresReview: false,
        estimatedImpact: 25,
        dependencies: [],
      },
      {
        id: 'action-4',
        type: 'refactor-duplicate',
        target: 'dup-1',
        description: 'Refactor duplicate code: Extract common card rendering logic',
        autoExecutable: false,
        requiresReview: true,
        estimatedImpact: 45,
        dependencies: [],
      },
    ],
    estimatedImpact: {
      filesAffected: 4,
      linesRemoved: 81,
      bundleSizeReduction: 4050,
      estimatedTimeMinutes: 8,
    },
    safetyLevel: 'review-needed',
  };

  const executor = new CleanupExecutor();

  // Example 1: Dry run to preview changes
  console.log('=== Example 1: Dry Run ===');
  const dryRunResult = await executor.execute(samplePlan, {
    dryRun: true,
    verbose: true,
  });

  console.log(`Dry run complete`);
  console.log(`Total actions: ${dryRunResult.totalActions}`);
  console.log(`Skipped (dry run): ${dryRunResult.skippedActions}`);
  console.log('');

  // Example 2: Execute with backup but skip review-required actions
  console.log('=== Example 2: Safe Execution with Backup ===');
  const safeResult = await executor.execute(samplePlan, {
    dryRun: false,
    createBackup: true,
    skipReviewRequired: true,
    stopOnError: false,
    verbose: true,
  });

  console.log(`Execution complete`);
  console.log(`Successful: ${safeResult.successfulActions}`);
  console.log(`Failed: ${safeResult.failedActions}`);
  console.log(`Skipped: ${safeResult.skippedActions}`);
  console.log(`Duration: ${safeResult.duration}ms`);
  console.log(`Backup: ${executor.getBackupDir()}`);
  console.log(`Checkpoint: ${executor.getCheckpointId()}`);
  console.log('');

  // Example 3: Execute with test verification
  console.log('=== Example 3: Execution with Test Verification ===');
  const testResult = await executor.execute(samplePlan, {
    dryRun: false,
    createBackup: true,
    runTests: true,
    testCommand: 'npm test',
    stopOnError: true,
    skipReviewRequired: true,
    verbose: true,
  });

  console.log(`Execution complete`);
  console.log(`Successful: ${testResult.successfulActions}`);
  console.log(`Failed: ${testResult.failedActions}`);
  console.log(`Tests run: ${testResult.testsRun}`);
  console.log(`Tests passed: ${testResult.testsPassed}`);

  if (testResult.testsRun && !testResult.testsPassed) {
    console.error('Tests failed! Consider rolling back.');
    console.error('Test output:');
    console.error(testResult.testOutput);
  }
  console.log('');

  // Example 4: Execute all actions including review-required
  console.log('=== Example 4: Full Execution (including review-required) ===');
  const fullResult = await executor.execute(samplePlan, {
    dryRun: false,
    createBackup: true,
    skipReviewRequired: false,
    stopOnError: false,
    verbose: true,
  });

  console.log(`Execution complete`);
  console.log(`Successful: ${fullResult.successfulActions}`);
  console.log(`Failed: ${fullResult.failedActions}`);
  console.log(`Skipped: ${fullResult.skippedActions}`);
  console.log('');

  // Example 5: Analyze execution results
  console.log('=== Example 5: Detailed Results Analysis ===');
  for (const result of fullResult.results) {
    console.log(`\nAction: ${result.action.description}`);
    console.log(`  Type: ${result.action.type}`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Files modified: ${result.filesModified.join(', ')}`);
    console.log(`  Lines changed: ${result.linesChanged}`);
    console.log(`  Duration: ${result.duration}ms`);
    
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }
  }
}

// Run example
if (require.main === module) {
  executeCleanupExample().catch(console.error);
}

export { executeCleanupExample };
