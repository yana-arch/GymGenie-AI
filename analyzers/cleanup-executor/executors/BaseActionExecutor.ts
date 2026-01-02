import { CleanupAction } from '../../types';
import { ExecutionOptions } from '../types';

/**
 * Base interface for action executors
 */
export interface ActionExecutor {
  /**
   * Execute a cleanup action
   */
  execute(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult>;

  /**
   * Preview what the action would do
   */
  preview(action: CleanupAction): Promise<string>;

  /**
   * Validate if the action can be executed
   */
  canExecute(action: CleanupAction): boolean;
}

/**
 * Result of executing an action
 */
export interface ActionExecutionResult {
  success: boolean;
  error?: string;
  filesModified: string[];
  linesChanged: number;
}

/**
 * Base class for action executors
 */
export abstract class BaseActionExecutor implements ActionExecutor {
  abstract execute(
    action: CleanupAction,
    options: ExecutionOptions
  ): Promise<ActionExecutionResult>;

  abstract preview(action: CleanupAction): Promise<string>;

  canExecute(action: CleanupAction): boolean {
    return action.autoExecutable;
  }

  /**
   * Parse target to extract file path and line number
   */
  protected parseTarget(target: string): {
    filePath: string;
    line?: number;
    column?: number;
  } {
    const parts = target.split(':');
    const filePath = parts[0];
    const line = parts[1] ? parseInt(parts[1], 10) : undefined;
    const column = parts[2] ? parseInt(parts[2], 10) : undefined;

    return { filePath, line, column };
  }
}
