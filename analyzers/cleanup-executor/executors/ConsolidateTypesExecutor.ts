import { CleanupAction } from '../../types';
import { ExecutionOptions } from '../types';
import { BaseActionExecutor, ActionExecutionResult } from './BaseActionExecutor';
import { logger } from '../../utils/logger';

/**
 * Executor for consolidating duplicate types
 * Note: This requires manual intervention and cannot be fully automated
 */
export class ConsolidateTypesExecutor extends BaseActionExecutor {
  async execute(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult> {
    // Type consolidation requires manual intervention
    // This executor provides guidance but cannot automatically consolidate

    if (options.verbose) {
      logger.info(`Type consolidation requires manual review: ${action.target}`);
      logger.info(`Description: ${action.description}`);
    }

    return {
      success: false,
      error: 'Type consolidation requires manual intervention. ' +
        'Please review the duplicate types and consolidate them manually.',
      filesModified: [],
      linesChanged: 0,
    };
  }

  async preview(action: CleanupAction): Promise<string> {
    return `Type consolidation requires manual intervention.\n\n` +
      `Action: ${action.description}\n` +
      `Target: ${action.target}\n` +
      `Estimated Impact: ${action.estimatedImpact} lines\n\n` +
      `Steps:\n` +
      `1. Review the duplicate type definitions\n` +
      `2. Choose a canonical location for the type\n` +
      `3. Move the type to a centralized types file\n` +
      `4. Update all imports to reference the new location\n` +
      `5. Remove the duplicate definitions\n` +
      `6. Run TypeScript compiler to verify no errors`;
  }

  canExecute(action: CleanupAction): boolean {
    // Type consolidation always requires manual intervention
    return false;
  }
}
