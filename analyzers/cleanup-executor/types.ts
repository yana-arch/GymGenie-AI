import { CleanupAction } from '../types';

/**
 * Execution result for a single action
 */
export interface ActionExecutionResult {
  action: CleanupAction;
  success: boolean;
  error?: string;
  filesModified: string[];
  linesChanged: number;
  duration: number;
}

/**
 * Overall cleanup execution result
 */
export interface CleanupExecutionResult {
  planId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  skippedActions: number;
  results: ActionExecutionResult[];
  checkpointId?: string;
  testsRun: boolean;
  testsPassed: boolean;
  testOutput?: string;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /**
   * Dry run mode - preview changes without applying them
   */
  dryRun?: boolean;

  /**
   * Create backup before execution
   */
  createBackup?: boolean;

  /**
   * Run tests after execution
   */
  runTests?: boolean;

  /**
   * Test command to run
   */
  testCommand?: string;

  /**
   * Stop on first error
   */
  stopOnError?: boolean;

  /**
   * Skip actions that require review
   */
  skipReviewRequired?: boolean;

  /**
   * Verbose output
   */
  verbose?: boolean;
}

/**
 * File modification information
 */
export interface FileModification {
  path: string;
  originalContent: string;
  newContent: string;
  action: CleanupAction;
}

/**
 * Dry run result
 */
export interface DryRunResult {
  planId: string;
  modifications: FileModification[];
  estimatedChanges: {
    filesAffected: number;
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
  };
  warnings: string[];
}
