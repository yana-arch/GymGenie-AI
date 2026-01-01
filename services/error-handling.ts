import { ValidationError, SerializationError } from '@/types/enhanced';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better handling
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  SERIALIZATION = 'serialization',
  API_RESPONSE = 'api_response',
  NETWORK = 'network',
  STORAGE = 'storage',
  BUSINESS_LOGIC = 'business_logic',
  USER_INPUT = 'user_input'
}

/**
 * Enhanced error interface with additional context
 */
export interface EnhancedError {
  readonly id: string;
  readonly timestamp: number;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly message: string;
  readonly originalError: Error;
  readonly context: Record<string, unknown>;
  readonly userMessage: string;
  readonly recoveryActions: string[];
  readonly shouldReport: boolean;
}

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  readonly name: string;
  readonly description: string;
  readonly execute: () => Promise<boolean>;
  readonly fallback?: RecoveryStrategy;
}

/**
 * Comprehensive error handler for validation and API failures
 */
export class ValidationErrorHandler {
  private static errorLog: EnhancedError[] = [];
  private static maxLogSize = 100;

  /**
   * Handle validation errors with context and recovery options
   */
  static handleValidationError(
    error: ValidationError,
    context: Record<string, unknown> = {},
    recoveryStrategies: RecoveryStrategy[] = []
  ): EnhancedError {
    const enhancedError: EnhancedError = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      severity: this.determineSeverity(error, context),
      category: ErrorCategory.VALIDATION,
      message: error.message,
      originalError: error,
      context: {
        field: error.field,
        value: error.value,
        constraint: error.constraint,
        ...context
      },
      userMessage: this.generateUserMessage(error),
      recoveryActions: this.generateRecoveryActions(error, recoveryStrategies),
      shouldReport: this.shouldReportError(error, context)
    };

    this.logError(enhancedError);
    return enhancedError;
  }

  /**
   * Handle serialization errors
   */
  static handleSerializationError(
    error: SerializationError,
    context: Record<string, unknown> = {}
  ): EnhancedError {
    const enhancedError: EnhancedError = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SERIALIZATION,
      message: error.message,
      originalError: error,
      context: {
        operation: error.operation,
        data: error.data,
        ...context
      },
      userMessage: this.generateSerializationUserMessage(error),
      recoveryActions: this.generateSerializationRecoveryActions(error),
      shouldReport: true
    };

    this.logError(enhancedError);
    return enhancedError;
  }

  /**
   * Handle API response validation errors
   */
  static handleApiResponseError(
    error: ValidationError,
    apiEndpoint: string,
    responseData: unknown,
    context: Record<string, unknown> = {}
  ): EnhancedError {
    const enhancedError: EnhancedError = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.API_RESPONSE,
      message: `API response validation failed for ${apiEndpoint}: ${error.message}`,
      originalError: error,
      context: {
        apiEndpoint,
        responseData,
        field: error.field,
        constraint: error.constraint,
        ...context
      },
      userMessage: this.generateApiErrorUserMessage(apiEndpoint),
      recoveryActions: this.generateApiRecoveryActions(apiEndpoint),
      shouldReport: true
    };

    this.logError(enhancedError);
    return enhancedError;
  }

  /**
   * Determine error severity based on context
   */
  private static determineSeverity(error: ValidationError, context: Record<string, unknown>): ErrorSeverity {
    // Critical data validation failures
    if (context.isCriticalData || error.field?.includes('id') || error.field?.includes('user')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity for core business logic
    if (error.field?.includes('workout') || error.field?.includes('session') || error.field?.includes('exercise')) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity for user preferences and settings
    if (error.field?.includes('preference') || error.field?.includes('setting')) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity for UI-related validations
    return ErrorSeverity.LOW;
  }

  /**
   * Generate user-friendly error messages
   */
  private static generateUserMessage(error: ValidationError): string {
    const fieldName = this.humanizeFieldName(error.field);
    
    if (error.constraint.includes('required')) {
      return `${fieldName} is required and cannot be empty.`;
    }
    
    if (error.constraint.includes('min')) {
      return `${fieldName} is too short or too small.`;
    }
    
    if (error.constraint.includes('max')) {
      return `${fieldName} is too long or too large.`;
    }
    
    if (error.constraint.includes('email')) {
      return `Please enter a valid email address.`;
    }
    
    if (error.constraint.includes('uuid')) {
      return `Invalid identifier format detected.`;
    }
    
    return `${fieldName} has an invalid value. Please check and try again.`;
  }

  /**
   * Generate serialization error user messages
   */
  private static generateSerializationUserMessage(error: SerializationError): string {
    if (error.operation === 'serialize') {
      return 'Failed to save data. Please check your input and try again.';
    } else {
      return 'Failed to load data. The data may be corrupted or in an old format.';
    }
  }

  /**
   * Generate API error user messages
   */
  private static generateApiErrorUserMessage(apiEndpoint: string): string {
    if (apiEndpoint.includes('workout')) {
      return 'There was an issue generating your workout. Please try again.';
    }
    
    if (apiEndpoint.includes('recipe')) {
      return 'Unable to generate recipes at the moment. Please try again later.';
    }
    
    if (apiEndpoint.includes('equipment')) {
      return 'Could not identify equipment in the image. Please try with a clearer photo.';
    }
    
    return 'Service temporarily unavailable. Please try again in a moment.';
  }

  /**
   * Generate recovery actions
   */
  private static generateRecoveryActions(error: ValidationError, strategies: RecoveryStrategy[]): string[] {
    const actions: string[] = [];
    
    // Add strategy-specific actions
    strategies.forEach(strategy => {
      actions.push(strategy.description);
    });
    
    // Add generic recovery actions based on error type
    if (error.constraint.includes('required')) {
      actions.push('Please fill in all required fields');
    }
    
    if (error.constraint.includes('format')) {
      actions.push('Check the format of your input');
    }
    
    if (error.constraint.includes('range')) {
      actions.push('Ensure values are within the acceptable range');
    }
    
    // Always provide a fallback action
    actions.push('Refresh the page and try again');
    
    return actions;
  }

  /**
   * Generate serialization recovery actions
   */
  private static generateSerializationRecoveryActions(error: SerializationError): string[] {
    if (error.operation === 'serialize') {
      return [
        'Check your input data for invalid characters',
        'Try saving with simplified data',
        'Contact support if the issue persists'
      ];
    } else {
      return [
        'Try clearing your browser data',
        'Restore from a backup if available',
        'Reset to default settings',
        'Contact support for data recovery'
      ];
    }
  }

  /**
   * Generate API recovery actions
   */
  private static generateApiRecoveryActions(apiEndpoint: string): string[] {
    const actions = [
      'Check your internet connection',
      'Try again in a few moments'
    ];
    
    if (apiEndpoint.includes('image')) {
      actions.push('Try with a different image');
      actions.push('Ensure the image is clear and well-lit');
    }
    
    if (apiEndpoint.includes('workout')) {
      actions.push('Try with different preferences');
      actions.push('Use manual workout creation as a fallback');
    }
    
    return actions;
  }

  /**
   * Convert technical field names to human-readable format
   */
  private static humanizeFieldName(field: string): string {
    if (!field) return 'Field';
    
    return field
      .split('.')
      .pop()
      ?.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim() || 'Field';
  }

  /**
   * Determine if error should be reported to monitoring service
   */
  private static shouldReportError(error: ValidationError, context: Record<string, unknown>): boolean {
    // Always report critical errors
    if (context.isCritical) return true;
    
    // Report errors in production
    if (process.env.NODE_ENV === 'production') return true;
    
    // Report validation errors for core business logic
    if (error.field?.includes('workout') || error.field?.includes('session')) return true;
    
    return false;
  }

  /**
   * Log error to internal storage
   */
  private static logError(error: EnhancedError): void {
    this.errorLog.unshift(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.category.toUpperCase()} ERROR [${error.severity}]`);
      console.error('Message:', error.message);
      console.error('Context:', error.context);
      console.error('Recovery Actions:', error.recoveryActions);
      console.error('Original Error:', error.originalError);
      console.groupEnd();
    }
  }

  /**
   * Get recent errors for debugging
   */
  static getRecentErrors(limit: number = 10): EnhancedError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Get errors by category
   */
  static getErrorsByCategory(category: ErrorCategory): EnhancedError[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  static getErrorsBySeverity(severity: ErrorSeverity): EnhancedError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Execute recovery strategy
   */
  static async executeRecoveryStrategy(strategy: RecoveryStrategy): Promise<boolean> {
    try {
      const success = await strategy.execute();
      if (!success && strategy.fallback) {
        return await this.executeRecoveryStrategy(strategy.fallback);
      }
      return success;
    } catch (error) {
      console.error(`Recovery strategy "${strategy.name}" failed:`, error);
      if (strategy.fallback) {
        return await this.executeRecoveryStrategy(strategy.fallback);
      }
      return false;
    }
  }
}

/**
 * Pre-defined recovery strategies for common scenarios
 */
export const CommonRecoveryStrategies = {
  /**
   * Retry with exponential backoff
   */
  retryWithBackoff: (operation: () => Promise<any>, maxRetries: number = 3): RecoveryStrategy => ({
    name: 'retry-with-backoff',
    description: `Retry operation up to ${maxRetries} times`,
    execute: async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await operation();
          return true;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
      return false;
    }
  }),

  /**
   * Use cached data as fallback
   */
  useCachedData: (getCachedData: () => any): RecoveryStrategy => ({
    name: 'use-cached-data',
    description: 'Use previously cached data',
    execute: async () => {
      const cachedData = getCachedData();
      return cachedData !== null && cachedData !== undefined;
    }
  }),

  /**
   * Reset to default values
   */
  resetToDefaults: (resetFunction: () => void): RecoveryStrategy => ({
    name: 'reset-to-defaults',
    description: 'Reset to default values',
    execute: async () => {
      try {
        resetFunction();
        return true;
      } catch {
        return false;
      }
    }
  }),

  /**
   * Prompt user for manual input
   */
  promptUserInput: (promptFunction: () => Promise<any>): RecoveryStrategy => ({
    name: 'prompt-user-input',
    description: 'Ask user to provide input manually',
    execute: async () => {
      try {
        const result = await promptFunction();
        return result !== null && result !== undefined;
      } catch {
        return false;
      }
    }
  })
};

/**
 * Error boundary helper for React components
 */
export class ErrorBoundaryHelper {
  /**
   * Create error info for React error boundaries
   */
  static createErrorInfo(error: Error, errorInfo: any): EnhancedError {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.BUSINESS_LOGIC,
      message: error.message,
      originalError: error,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      userMessage: 'Something went wrong. Please refresh the page and try again.',
      recoveryActions: [
        'Refresh the page',
        'Clear browser cache',
        'Try a different browser',
        'Contact support if the issue persists'
      ],
      shouldReport: true
    };
  }
}