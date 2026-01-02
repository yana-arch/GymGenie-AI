# Rollback Manager

Manages checkpoints and rollback functionality for safe cleanup operations.

## Overview

The Rollback Manager provides checkpoint creation and restoration capabilities to safely rollback changes if cleanup operations fail or cause issues.

## Features

- **Checkpoint Creation**: Create backups of files before modifications
- **Rollback**: Restore files from checkpoints
- **Checkpoint Management**: List, delete, and manage checkpoints
- **Partial Rollback**: Restore specific files from a checkpoint
- **Dry Run**: Preview what would be restored
- **Automatic Cleanup**: Delete old checkpoints

## Usage

```typescript
import { RollbackManager } from "./analyzers/rollback-manager";

// Create manager
const manager = new RollbackManager();
await manager.initialize();

// Create checkpoint
const checkpoint = await manager.createCheckpoint(
  ["src/file1.ts", "src/file2.ts"],
  {
    label: "Before cleanup",
    metadata: {
      planId: "plan-123",
      description: "Backup before removing dead code",
    },
  }
);

console.log(`Checkpoint created: ${checkpoint.id}`);

// ... perform cleanup operations ...

// If something goes wrong, rollback
const result = await manager.rollback(checkpoint.id, {
  force: false,
  verbose: true,
});

console.log(`Restored ${result.filesRestored.length} files`);
```

## Checkpoint Creation

Create a checkpoint to backup files:

```typescript
const checkpoint = await manager.createCheckpoint(
  ["src/file1.ts", "src/file2.ts", "src/file3.ts"],
  {
    label: "Before refactoring",
    metadata: {
      planId: "plan-456",
      actionsCount: 10,
      description: "Backup before duplicate code refactoring",
    },
  }
);
```

## Rollback

Restore files from a checkpoint:

```typescript
// Full rollback
const result = await manager.rollback(checkpointId);

// Partial rollback (specific files only)
const result = await manager.rollback(checkpointId, {
  files: ["src/file1.ts"],
});

// Force rollback (even if files have been modified)
const result = await manager.rollback(checkpointId, {
  force: true,
});

// Dry run (preview what would be restored)
const result = await manager.rollback(checkpointId, {
  dryRun: true,
});
```

## Checkpoint Management

List and manage checkpoints:

```typescript
// List all checkpoints
const checkpoints = manager.listCheckpoints();
for (const cp of checkpoints) {
  console.log(`${cp.id}: ${cp.label} (${cp.timestamp})`);
  console.log(`  Files: ${cp.metadata?.filesCount}`);
  console.log(`  Size: ${cp.metadata?.totalSize} bytes`);
}

// Get specific checkpoint
const checkpoint = manager.getCheckpoint(checkpointId);

// Delete checkpoint
await manager.deleteCheckpoint(checkpointId);

// Delete old checkpoints (older than 7 days)
const deleted = await manager.deleteOldCheckpoints(7);
console.log(`Deleted ${deleted} old checkpoints`);

// Delete all checkpoints
await manager.deleteAllCheckpoints();
```

## Rollback Options

### RollbackOptions

- `dryRun`: Preview what would be restored (default: false)
- `force`: Force restore even if files have been modified (default: false)
- `files`: Specific files to restore (if not specified, restore all)
- `verbose`: Verbose output (default: false)

## Rollback Result

The rollback operation returns a detailed result:

```typescript
{
  success: true,
  checkpointId: "checkpoint-id",
  filesRestored: ["src/file1.ts", "src/file2.ts"],
  filesSkipped: ["src/file3.ts"],
  errors: [],
  duration: 150 // milliseconds
}
```

## Checkpoint Storage

Checkpoints are stored in `.cleanup-checkpoints/` directory by default. Each checkpoint is saved as a JSON file containing:

- Checkpoint metadata (id, label, timestamp)
- File contents (path -> content mapping)
- Additional metadata (plan ID, file count, size)

## Safety Features

1. **Modification Detection**: By default, files that have been modified since the checkpoint won't be restored (unless `force: true`)
2. **Partial Rollback**: Restore only specific files if needed
3. **Dry Run**: Preview changes before applying them
4. **Error Handling**: Continues restoring other files even if some fail

## Example Workflow

```typescript
// 1. Initialize manager
const manager = new RollbackManager();
await manager.initialize();

// 2. Create checkpoint before cleanup
const checkpoint = await manager.createCheckpoint(filesToModify, {
  label: "Before cleanup",
});

// 3. Perform cleanup operations
try {
  await performCleanup();

  // 4. Run tests
  const testsPass = await runTests();

  if (!testsPass) {
    // 5. Rollback if tests fail
    console.log("Tests failed, rolling back...");
    await manager.rollback(checkpoint.id, { force: true });
  } else {
    // 6. Delete checkpoint if everything is okay
    await manager.deleteCheckpoint(checkpoint.id);
  }
} catch (error) {
  // 7. Rollback on error
  console.error("Cleanup failed, rolling back...");
  await manager.rollback(checkpoint.id, { force: true });
}
```

## Requirements Validation

This implementation validates:

- **Requirement 10.1**: Creates backup before making changes
- **Requirement 10.1**: Implements rollback mechanism

## Testing

See `__tests__/RollbackManager.test.ts` for unit tests.
