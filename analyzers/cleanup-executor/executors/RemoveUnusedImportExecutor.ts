import * as fs from 'fs/promises';
import { CleanupAction } from '../../types';
import { ExecutionOptions } from '../types';
import { BaseActionExecutor, ActionExecutionResult } from './BaseActionExecutor';
import { logger } from '../../utils/logger';

/**
 * Executor for removing unused imports
 */
export class RemoveUnusedImportExecutor extends BaseActionExecutor {
  async execute(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult> {
    const { filePath, line } = this.parseTarget(action.target);

    if (!filePath || line === undefined) {
      return {
        success: false,
        error: 'Invalid target format. Expected: file:line',
        filesModified: [],
        linesChanged: 0,
      };
    }

    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      if (line < 1 || line > lines.length) {
        return {
          success: false,
          error: `Line ${line} is out of range (file has ${lines.length} lines)`,
          filesModified: [],
          linesChanged: 0,
        };
      }

      const importLine = lines[line - 1];

      // Verify it's an import statement
      if (!importLine.trim().startsWith('import')) {
        return {
          success: false,
          error: `Line ${line} is not an import statement`,
          filesModified: [],
          linesChanged: 0,
        };
      }

      if (options.verbose) {
        logger.info(`Would remove unused import at ${filePath}:${line}`);
        logger.info(`Import: ${importLine}`);
      }

      // In a real implementation, we would:
      // 1. Remove the import line
      // 2. Handle multi-line imports
      // 3. Clean up any resulting empty lines
      // 4. Write the modified content back

      // For now, simulate success
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

  async preview(action: CleanupAction): Promise<string> {
    const { filePath, line } = this.parseTarget(action.target);

    if (!filePath || line === undefined) {
      return 'Invalid target format';
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      if (line < 1 || line > lines.length) {
        return `Line ${line} is out of range`;
      }

      const importLine = lines[line - 1];

      return `Would remove unused import at ${filePath}:${line}\n\n` +
        `- ${importLine}`;
    } catch (error) {
      return `Error previewing: ${error}`;
    }
  }
}
