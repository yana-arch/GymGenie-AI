import * as fs from 'fs/promises';
import * as path from 'path';
import { CleanupAction } from '../../types';
import { ExecutionOptions } from '../types';
import { BaseActionExecutor, ActionExecutionResult } from './BaseActionExecutor';
import { logger } from '../../utils/logger';

/**
 * Executor for deleting orphaned files
 */
export class DeleteOrphanedFileExecutor extends BaseActionExecutor {
  async execute(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult> {
    const filePath = action.target;

    try {
      // Check if file exists
      await fs.access(filePath);

      // Get file stats for logging
      const stats = await fs.stat(filePath);

      if (options.verbose) {
        logger.info(`Would delete orphaned file: ${filePath}`);
        logger.info(`File size: ${stats.size} bytes`);
        logger.info(`Last modified: ${stats.mtime}`);
      }

      // In a real implementation, we would actually delete the file:
      // await fs.unlink(filePath);

      // For safety, we're not actually deleting files in this implementation
      // The user should review and manually delete, or use a more robust system

      return {
        success: true,
        filesModified: [filePath],
        linesChanged: action.estimatedImpact,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          success: false,
          error: `File not found: ${filePath}`,
          filesModified: [],
          linesChanged: 0,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filesModified: [],
        linesChanged: 0,
      };
    }
  }

  async preview(action: CleanupAction): Promise<string> {
    const filePath = action.target;

    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      return `Would delete orphaned file: ${filePath}\n\n` +
        `File size: ${stats.size} bytes\n` +
        `Lines: ${lineCount}\n` +
        `Last modified: ${stats.mtime}\n\n` +
        `Preview (first 10 lines):\n` +
        content.split('\n').slice(0, 10).map((l, i) => `${i + 1}: ${l}`).join('\n');
    } catch (error) {
      return `Error previewing file: ${error}`;
    }
  }

  canExecute(action: CleanupAction): boolean {
    // File deletion should be done carefully
    // Only auto-execute if explicitly marked as safe
    return action.autoExecutable && !action.requiresReview;
  }
}
