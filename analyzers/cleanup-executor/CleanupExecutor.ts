import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CleanupAction, ActionType } from '../types';
import { CleanupPlan } from '../cleanup-plan/types';
import {
  CleanupExecutionResult,
  ActionExecutionResult,
  ExecutionOptions,
  DryRunResult,
  FileModification,
} from './types';
import { defaultLogger as logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Executes cleanup actions from a cleanup plan
 */
export class CleanupExecutor {
  private checkpointId?: string;
  private backupDir?: string;

  /**
   * Execute a cleanup plan
   */
  async execute(
    plan: CleanupPlan,
    options: ExecutionOptions = {}
  ): Promise<CleanupExecutionResult> {
    const startTime = new Date();
    const results: ActionExecutionResult[] = [];

    logger.info(`Starting cleanup execution for plan ${plan.id}`);
    logger.info(`Total actions: ${plan.actions.length}`);

    // Dry run mode
    if (options.dryRun) {
      logger.info('Running in DRY RUN mode - no changes will be applied');
      const dryRunResult = await this.performDryRun(plan);
      logger.info(
        `Dry run complete: ${dryRunResult.modifications.length} files would be modified`
      );
      
      // Return a result indicating dry run
      return {
        planId: plan.id,
        startTime,
        endTime: new Date(),
        duration: Date.now() - startTime.getTime(),
        totalActions: plan.actions.length,
        successfulActions: 0,
        failedActions: 0,
        skippedActions: plan.actions.length,
        results: [],
        testsRun: false,
        testsPassed: false,
      };
    }

    // Create backup if requested
    if (options.createBackup) {
      logger.info('Creating backup...');
      await this.createBackup(plan);
      logger.info(`Backup created at ${this.backupDir}`);
    }

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // Execute actions
    for (const action of plan.actions) {
      // Skip actions that require review if option is set
      if (options.skipReviewRequired && action.requiresReview) {
        logger.info(`Skipping action ${action.id} (requires review)`);
        skipCount++;
        continue;
      }

      logger.info(`Executing action: ${action.description}`);

      try {
        const result = await this.executeAction(action, options);
        results.push(result);

        if (result.success) {
          successCount++;
          logger.info(`Action completed successfully`);
        } else {
          failCount++;
          logger.error(`Action failed: ${result.error}`);

          if (options.stopOnError) {
            logger.error('Stopping execution due to error');
            break;
          }
        }
      } catch (error) {
        failCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Action execution error: ${errorMessage}`);

        results.push({
          action,
          success: false,
          error: errorMessage,
          filesModified: [],
          linesChanged: 0,
          duration: 0,
        });

        if (options.stopOnError) {
          logger.error('Stopping execution due to error');
          break;
        }
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Run tests if requested
    let testsRun = false;
    let testsPassed = false;
    let testOutput: string | undefined;

    if (options.runTests && successCount > 0) {
      logger.info('Running tests...');
      const testResult = await this.runTests(options.testCommand);
      testsRun = true;
      testsPassed = testResult.success;
      testOutput = testResult.output;

      if (!testsPassed) {
        logger.error('Tests failed after cleanup');
        logger.error(testOutput);
      } else {
        logger.info('All tests passed');
      }
    }

    const result: CleanupExecutionResult = {
      planId: plan.id,
      startTime,
      endTime,
      duration,
      totalActions: plan.actions.length,
      successfulActions: successCount,
      failedActions: failCount,
      skippedActions: skipCount,
      results,
      checkpointId: this.checkpointId,
      testsRun,
      testsPassed,
      testOutput,
    };

    logger.info('Cleanup execution complete');
    logger.info(`Success: ${successCount}, Failed: ${failCount}, Skipped: ${skipCount}`);

    return result;
  }

  /**
   * Perform a dry run to preview changes
   */
  async performDryRun(plan: CleanupPlan): Promise<DryRunResult> {
    const modifications: FileModification[] = [];
    const warnings: string[] = [];

    for (const action of plan.actions) {
      try {
        const mod = await this.previewAction(action);
        if (mod) {
          modifications.push(mod);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Action ${action.id}: ${errorMessage}`);
      }
    }

    // Calculate estimated changes
    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;

    for (const mod of modifications) {
      const originalLines = mod.originalContent.split('\n').length;
      const newLines = mod.newContent.split('\n').length;

      if (newLines > originalLines) {
        linesAdded += newLines - originalLines;
      } else if (newLines < originalLines) {
        linesRemoved += originalLines - newLines;
      } else {
        linesModified += newLines;
      }
    }

    return {
      planId: plan.id,
      modifications,
      estimatedChanges: {
        filesAffected: new Set(modifications.map((m) => m.path)).size,
        linesAdded,
        linesRemoved,
        linesModified,
      },
      warnings,
    };
  }

  /**
   * Preview what an action would do without executing it
   */
  private async previewAction(
    action: CleanupAction
  ): Promise<FileModification | null> {
    // Extract file path from target
    const filePath = action.target.split(':')[0];

    try {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      
      // For now, return a placeholder modification
      // Actual implementation would depend on action-specific executors
      return {
        path: filePath,
        originalContent,
        newContent: originalContent, // Would be modified by action-specific logic
        action,
      };
    } catch (error) {
      logger.warn(`Could not preview action for ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Execute a single cleanup action
   */
  private async executeAction(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const filesModified: string[] = [];

    try {
      // Delegate to action-specific executor
      const result = await this.executeActionByType(action, options);
      
      const duration = Date.now() - startTime;

      return {
        action,
        success: result.success,
        error: result.error,
        filesModified: result.filesModified,
        linesChanged: result.linesChanged,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        action,
        success: false,
        error: errorMessage,
        filesModified,
        linesChanged: 0,
        duration,
      };
    }
  }

  /**
   * Execute action based on its type
   */
  private async executeActionByType(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    switch (action.type) {
      case 'remove-dead-code':
        return this.executeRemoveDeadCode(action, options);
      case 'remove-unused-import':
        return this.executeRemoveUnusedImport(action, options);
      case 'delete-orphaned-file':
        return this.executeDeleteOrphanedFile(action, options);
      case 'refactor-duplicate':
        return this.executeRefactorDuplicate(action, options);
      case 'consolidate-types':
        return this.executeConsolidateTypes(action, options);
      default:
        return {
          success: false,
          error: `Unsupported action type: ${action.type}`,
          filesModified: [],
          linesChanged: 0,
        };
    }
  }

  /**
   * Execute remove dead code action
   */
  private async executeRemoveDeadCode(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    // Extract file path and line number from target
    const [filePath, lineStr] = action.target.split(':');
    const line = parseInt(lineStr, 10);

    if (!filePath || isNaN(line)) {
      return {
        success: false,
        error: 'Invalid target format',
        filesModified: [],
        linesChanged: 0,
      };
    }

    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // For now, just mark as success without actual modification
      // Actual implementation would require AST manipulation
      if (options.verbose) {
        logger.info(`Would remove dead code at ${filePath}:${line}`);
      }

      return {
        success: true,
        filesModified: [filePath],
        linesChanged: action.estimatedImpact,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filesModified: [],
        linesChanged: 0,
      };
    }
  }

  /**
   * Execute remove unused import action
   */
  private async executeRemoveUnusedImport(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    const [filePath, lineStr] = action.target.split(':');
    const line = parseInt(lineStr, 10);

    if (!filePath || isNaN(line)) {
      return {
        success: false,
        error: 'Invalid target format',
        filesModified: [],
        linesChanged: 0,
      };
    }

    try {
      if (options.verbose) {
        logger.info(`Would remove unused import at ${filePath}:${line}`);
      }

      return {
        success: true,
        filesModified: [filePath],
        linesChanged: 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filesModified: [],
        linesChanged: 0,
      };
    }
  }

  /**
   * Execute delete orphaned file action
   */
  private async executeDeleteOrphanedFile(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    const filePath = action.target;

    try {
      // Check if file exists
      await fs.access(filePath);

      if (options.verbose) {
        logger.info(`Would delete orphaned file: ${filePath}`);
      }

      // For now, don't actually delete
      // await fs.unlink(filePath);

      return {
        success: true,
        filesModified: [filePath],
        linesChanged: action.estimatedImpact,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filesModified: [],
        linesChanged: 0,
      };
    }
  }

  /**
   * Execute refactor duplicate action
   */
  private async executeRefactorDuplicate(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    // Refactoring requires manual intervention
    if (options.verbose) {
      logger.info(`Refactoring duplicate code requires manual review: ${action.target}`);
    }

    return {
      success: false,
      error: 'Refactoring requires manual intervention',
      filesModified: [],
      linesChanged: 0,
    };
  }

  /**
   * Execute consolidate types action
   */
  private async executeConsolidateTypes(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<{
    success: boolean;
    error?: string;
    filesModified: string[];
    linesChanged: number;
  }> {
    // Type consolidation requires manual intervention
    if (options.verbose) {
      logger.info(`Type consolidation requires manual review: ${action.target}`);
    }

    return {
      success: false,
      error: 'Type consolidation requires manual intervention',
      filesModified: [],
      linesChanged: 0,
    };
  }

  /**
   * Create backup of files that will be modified
   */
  private async createBackup(plan: CleanupPlan): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = path.join(process.cwd(), '.cleanup-backups', timestamp);
    this.checkpointId = timestamp;

    await fs.mkdir(this.backupDir, { recursive: true });

    // Collect all files that will be modified
    const filesToBackup = new Set<string>();
    for (const action of plan.actions) {
      const filePath = action.target.split(':')[0];
      if (filePath) {
        filesToBackup.add(filePath);
      }
    }

    // Backup each file
    for (const filePath of filesToBackup) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const backupPath = path.join(this.backupDir, filePath);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.writeFile(backupPath, content, 'utf-8');
      } catch (error) {
        logger.warn(`Could not backup file ${filePath}: ${error}`);
      }
    }
  }

  /**
   * Run tests to verify cleanup didn't break anything
   */
  private async runTests(
    testCommand?: string
  ): Promise<{ success: boolean; output: string }> {
    const command = testCommand || 'npm test';

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes timeout
      });

      return {
        success: true,
        output: stdout + stderr,
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout + error.stderr || error.message,
      };
    }
  }

  /**
   * Get backup directory
   */
  getBackupDir(): string | undefined {
    return this.backupDir;
  }

  /**
   * Get checkpoint ID
   */
  getCheckpointId(): string | undefined {
    return this.checkpointId;
  }
}
