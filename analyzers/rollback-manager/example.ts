import { RollbackManager } from './RollbackManager';

/**
 * Example: Using RollbackManager for safe cleanup operations
 */
async function rollbackManagerExample() {
  // Create and initialize manager
  const manager = new RollbackManager();
  await manager.initialize();

  console.log('=== Example 1: Create Checkpoint ===');
  
  // Example files to backup
  const filesToBackup = [
    'src/components/Button.tsx',
    'src/utils/helpers.ts',
    'src/types/index.ts',
  ];

  // Create checkpoint
  const checkpoint = await manager.createCheckpoint(filesToBackup, {
    label: 'Before cleanup operations',
    metadata: {
      planId: 'plan-123',
      actionsCount: 5,
      description: 'Backup before removing dead code and unused imports',
    },
  });

  console.log(`Checkpoint created: ${checkpoint.id}`);
  console.log(`Label: ${checkpoint.label}`);
  console.log(`Files backed up: ${checkpoint.files.size}`);
  console.log(`Total size: ${checkpoint.metadata?.totalSize} bytes`);
  console.log('');

  // Example 2: List checkpoints
  console.log('=== Example 2: List Checkpoints ===');
  const checkpoints = manager.listCheckpoints();
  
  for (const cp of checkpoints) {
    console.log(`\nCheckpoint: ${cp.id}`);
    console.log(`  Label: ${cp.label}`);
    console.log(`  Created: ${cp.timestamp.toISOString()}`);
    console.log(`  Files: ${cp.metadata?.filesCount}`);
    console.log(`  Size: ${cp.metadata?.totalSize} bytes`);
    console.log(`  Can restore: ${cp.canRestore}`);
  }
  console.log('');

  // Example 3: Dry run rollback
  console.log('=== Example 3: Dry Run Rollback ===');
  const dryRunResult = await manager.rollback(checkpoint.id, {
    dryRun: true,
    verbose: true,
  });

  console.log(`Would restore ${dryRunResult.filesRestored.length} files`);
  console.log('Files that would be restored:');
  dryRunResult.filesRestored.forEach((file) => console.log(`  - ${file}`));
  console.log('');

  // Example 4: Partial rollback (specific files only)
  console.log('=== Example 4: Partial Rollback ===');
  const partialResult = await manager.rollback(checkpoint.id, {
    files: ['src/components/Button.tsx'],
    verbose: true,
  });

  console.log(`Restored: ${partialResult.filesRestored.length} files`);
  console.log(`Skipped: ${partialResult.filesSkipped.length} files`);
  console.log(`Errors: ${partialResult.errors.length}`);
  console.log(`Duration: ${partialResult.duration}ms`);
  console.log('');

  // Example 5: Full rollback with force
  console.log('=== Example 5: Full Rollback (Force) ===');
  const fullResult = await manager.rollback(checkpoint.id, {
    force: true,
    verbose: true,
  });

  console.log(`Success: ${fullResult.success}`);
  console.log(`Restored: ${fullResult.filesRestored.length} files`);
  console.log(`Skipped: ${fullResult.filesSkipped.length} files`);
  console.log(`Errors: ${fullResult.errors.length}`);

  if (fullResult.errors.length > 0) {
    console.log('\nErrors:');
    fullResult.errors.forEach((err) => {
      console.log(`  ${err.file}: ${err.error}`);
    });
  }
  console.log('');

  // Example 6: Cleanup old checkpoints
  console.log('=== Example 6: Cleanup Old Checkpoints ===');
  const deletedCount = await manager.deleteOldCheckpoints(7);
  console.log(`Deleted ${deletedCount} checkpoints older than 7 days`);
  console.log('');

  // Example 7: Complete workflow with error handling
  console.log('=== Example 7: Complete Workflow ===');
  
  try {
    // Create checkpoint
    const workflowCheckpoint = await manager.createCheckpoint(filesToBackup, {
      label: 'Workflow checkpoint',
    });
    console.log(`Created checkpoint: ${workflowCheckpoint.id}`);

    // Simulate cleanup operations
    console.log('Performing cleanup operations...');
    // ... cleanup code here ...

    // Simulate test run
    console.log('Running tests...');
    const testsPass = true; // Simulate test result

    if (!testsPass) {
      console.log('Tests failed! Rolling back...');
      const rollbackResult = await manager.rollback(workflowCheckpoint.id, {
        force: true,
      });
      console.log(`Rolled back ${rollbackResult.filesRestored.length} files`);
    } else {
      console.log('Tests passed! Cleanup successful.');
      console.log('Deleting checkpoint...');
      await manager.deleteCheckpoint(workflowCheckpoint.id);
    }
  } catch (error) {
    console.error('Error in workflow:', error);
  }
  console.log('');

  // Example 8: Get checkpoint details
  console.log('=== Example 8: Get Checkpoint Details ===');
  const cpDetails = manager.getCheckpoint(checkpoint.id);
  
  if (cpDetails) {
    console.log(`Checkpoint: ${cpDetails.id}`);
    console.log(`Label: ${cpDetails.label}`);
    console.log(`Timestamp: ${cpDetails.timestamp}`);
    console.log(`Files in checkpoint:`);
    
    for (const [filePath, content] of cpDetails.files.entries()) {
      console.log(`  ${filePath} (${content.length} bytes)`);
    }
  }
  console.log('');

  // Cleanup: Delete example checkpoint
  console.log('=== Cleanup ===');
  await manager.deleteCheckpoint(checkpoint.id);
  console.log('Example checkpoint deleted');
}

// Run example
if (require.main === module) {
  rollbackManagerExample().catch(console.error);
}

export { rollbackManagerExample };
