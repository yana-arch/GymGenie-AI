import { CleanupAction } from '../types';

/**
 * Base error class for analysis operations
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly file?: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AnalysisError';
    Object.setPrototypeOf(this, AnalysisError.prototype);
  }
}

/**
 * Error during cleanup operations
 */
export class CleanupError extends Error {
  constructor(
    message: string,
    public readonly action: CleanupAction,
    public readonly rollbackAvailable: boolean = true
  ) {
    super(message);
    this.name = 'CleanupError';
    Object.setPrototypeOf(this, CleanupError.prototype);
  }
}

/**
 * Configuration validation error
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * File system operation error
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly operation: 'read' | 'write' | 'delete' | 'move'
  ) {
    super(message);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Recovery result from error handling
 */
export interface RecoveryResult {
  success: boolean;
  message: string;
  partialResults?: unknown;
}

/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
  /**
   * Check if error can be recovered
   */
  canRecover(error: Error): boolean;

  /**
   * Attempt to recover from error
   */
  recover(error: Error): Promise<RecoveryResult>;
}

/**
 * Default error recovery strategy
 */
export class DefaultRecoveryStrategy implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    if (error instanceof AnalysisError) {
      return error.recoverable;
    }
    if (error instanceof CleanupError) {
      return error.rollbackAvailable;
    }
    return false;
  }

  async recover(error: Error): Promise<RecoveryResult> {
    if (error instanceof AnalysisError && error.recoverable) {
      return {
        success: true,
        message: `Recovered from analysis error in stage: ${error.stage}`,
        partialResults: null,
      };
    }

    if (error instanceof CleanupError && error.rollbackAvailable) {
      return {
        success: true,
        message: `Rollback available for action: ${error.action.id}`,
      };
    }

    return {
      success: false,
      message: `Unable to recover from error: ${error.message}`,
    };
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  constructor(private strategy: ErrorRecoveryStrategy = new DefaultRecoveryStrategy()) {}

  /**
   * Handle error with recovery attempt
   */
  async handle(error: Error): Promise<RecoveryResult> {
    if (this.strategy.canRecover(error)) {
      return await this.strategy.recover(error);
    }

    return {
      success: false,
      message: error.message,
    };
  }

  /**
   * Set recovery strategy
   */
  setStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategy = strategy;
  }
}
