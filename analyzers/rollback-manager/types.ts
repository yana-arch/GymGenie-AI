/**
 * Checkpoint representing a backup of files
 */
export interface Checkpoint {
  id: string;
  label: string;
  timestamp: Date;
  files: Map<string, string>; // file path -> content
  canRestore: boolean;
  metadata?: CheckpointMetadata;
}

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  planId?: string;
  actionsCount?: number;
  filesCount?: number;
  totalSize?: number;
  description?: string;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  filesRestored: string[];
  filesSkipped: string[];
  errors: RollbackError[];
  duration: number;
}

/**
 * Rollback error
 */
export interface RollbackError {
  file: string;
  error: string;
}

/**
 * Checkpoint creation options
 */
export interface CheckpointOptions {
  label?: string;
  files?: string[];
  metadata?: CheckpointMetadata;
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  /**
   * Dry run - preview what would be restored
   */
  dryRun?: boolean;

  /**
   * Force restore even if files have been modified
   */
  force?: boolean;

  /**
   * Specific files to restore (if not specified, restore all)
   */
  files?: string[];

  /**
   * Verbose output
   */
  verbose?: boolean;
}
