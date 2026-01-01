import { 
  SessionError, 
  SessionState, 
  SessionErrorHandler as ISessionErrorHandler 
} from '@/types';

export class SessionErrorHandler implements ISessionErrorHandler {
  private errorLog: Array<{
    timestamp: number;
    error: SessionError;
    context: any;
    resolved: boolean;
  }> = [];

  /**
   * Handle state transition errors with recovery strategies
   */
  handleStateTransitionError(from: SessionState, to: SessionState, error: Error): void {
    console.error(`Session state transition error: ${from} -> ${to}`, error);
    
    const errorContext = {
      from,
      to,
      message: error.message,
      timestamp: Date.now()
    };

    // Log the error
    this.logError(SessionError.INVALID_STATE_TRANSITION, errorContext);

    // Determine recovery strategy based on error type
    if (error.message.includes('MULTIPLE_ACTIVE_SESSIONS')) {
      this.handleMultipleActiveSessionsError(errorContext);
    } else if (error.message.includes('INVALID_STATE_TRANSITION')) {
      this.handleInvalidTransitionError(from, to, errorContext);
    } else {
      this.handleGenericTransitionError(errorContext);
    }
  }

  /**
   * Handle storage operation errors
   */
  handleStorageError(operation: string, error: Error): void {
    console.error(`Session storage error during ${operation}:`, error);
    
    const errorContext = {
      operation,
      message: error.message,
      timestamp: Date.now()
    };

    this.logError(SessionError.STORAGE_FAILURE, errorContext);

    // Recovery strategies for storage errors
    if (operation === 'save') {
      this.handleStorageSaveError(errorContext);
    } else if (operation === 'load') {
      this.handleStorageLoadError(errorContext);
    }
  }

  /**
   * Handle data corruption scenarios
   */
  handleDataCorruption(sessionId: string, corruptedData: any): void {
    console.error(`Session data corruption detected for session ${sessionId}:`, corruptedData);
    
    const errorContext = {
      sessionId,
      corruptedData,
      timestamp: Date.now()
    };

    this.logError(SessionError.DATA_CORRUPTION, errorContext);
    
    // Attempt data recovery
    this.attemptDataRecovery(sessionId, corruptedData);
  }

  /**
   * Generic error recovery method
   */
  async recoverFromError(error: SessionError, context: any): Promise<void> {
    console.log(`Attempting recovery from error: ${error}`, context);

    try {
      switch (error) {
        case SessionError.INVALID_STATE_TRANSITION:
          await this.recoverFromInvalidTransition(context);
          break;
        case SessionError.MULTIPLE_ACTIVE_SESSIONS:
          await this.recoverFromMultipleSessions(context);
          break;
        case SessionError.STORAGE_FAILURE:
          await this.recoverFromStorageFailure(context);
          break;
        case SessionError.DATA_CORRUPTION:
          await this.recoverFromDataCorruption(context);
          break;
        case SessionError.STALE_SESSION:
          await this.recoverFromStaleSession(context);
          break;
        default:
          console.warn(`No recovery strategy for error: ${error}`);
      }

      // Mark error as resolved
      this.markErrorResolved(error, context);
    } catch (recoveryError) {
      console.error(`Recovery failed for error ${error}:`, recoveryError);
      this.showUserErrorMessage(error, context);
    }
  }

  /**
   * Handle multiple active sessions error
   */
  private handleMultipleActiveSessionsError(context: any): void {
    const message = 'You have another active workout session. Please complete or abandon it before starting a new one.';
    this.showUserPrompt(
      'Multiple Active Sessions',
      message,
      [
        {
          text: 'View Active Session',
          action: () => this.navigateToActiveSession(),
          primary: true
        },
        {
          text: 'Abandon Previous Session',
          action: () => this.abandonPreviousSession(),
          destructive: true
        }
      ]
    );
  }

  /**
   * Handle invalid state transition error
   */
  private handleInvalidTransitionError(from: SessionState, to: SessionState, context: any): void {
    let message = '';
    let actions: Array<{text: string, action: () => void, primary?: boolean, destructive?: boolean}> = [];

    if (from === SessionState.LOGGED) {
      message = 'This workout has already been completed and logged. You cannot modify it.';
      actions = [
        {
          text: 'View Workout History',
          action: () => this.navigateToHistory(),
          primary: true
        },
        {
          text: 'Start New Workout',
          action: () => this.startNewWorkout()
        }
      ];
    } else if (to === SessionState.LOGGED && from !== SessionState.COMPLETED) {
      message = 'You must complete the workout before logging it.';
      actions = [
        {
          text: 'Continue Workout',
          action: () => this.continueWorkout(),
          primary: true
        }
      ];
    } else {
      message = `Cannot transition from ${from} to ${to} state.`;
      actions = [
        {
          text: 'OK',
          action: () => {},
          primary: true
        }
      ];
    }

    this.showUserPrompt('Invalid Action', message, actions);
  }

  /**
   * Handle generic transition errors
   */
  private handleGenericTransitionError(context: any): void {
    this.showUserErrorMessage(SessionError.INVALID_STATE_TRANSITION, context);
  }

  /**
   * Handle storage save errors
   */
  private handleStorageSaveError(context: any): void {
    const message = 'Failed to save your workout progress. Your data might be lost if you close the app.';
    this.showUserPrompt(
      'Save Error',
      message,
      [
        {
          text: 'Retry Save',
          action: () => this.retrySave(),
          primary: true
        },
        {
          text: 'Continue Anyway',
          action: () => {}
        }
      ]
    );
  }

  /**
   * Handle storage load errors
   */
  private handleStorageLoadError(context: any): void {
    const message = 'Failed to load your previous workout data. Starting fresh.';
    this.showUserNotification('Load Error', message, 'warning');
  }

  /**
   * Attempt to recover corrupted data
   */
  private attemptDataRecovery(sessionId: string, corruptedData: any): void {
    try {
      // Try to extract valid parts of the data
      const recoveredData = this.extractValidData(corruptedData);
      
      if (recoveredData) {
        console.log('Successfully recovered partial session data');
        this.showUserPrompt(
          'Data Recovery',
          'Some of your workout data was corrupted but we recovered what we could. Do you want to continue with the recovered data?',
          [
            {
              text: 'Use Recovered Data',
              action: () => this.useRecoveredData(recoveredData),
              primary: true
            },
            {
              text: 'Start Fresh',
              action: () => this.clearCorruptedSession(sessionId),
              destructive: true
            }
          ]
        );
      } else {
        this.handleUnrecoverableCorruption(sessionId);
      }
    } catch (error) {
      console.error('Data recovery failed:', error);
      this.handleUnrecoverableCorruption(sessionId);
    }
  }

  /**
   * Handle unrecoverable data corruption
   */
  private handleUnrecoverableCorruption(sessionId: string): void {
    this.showUserPrompt(
      'Data Corruption',
      'Your workout data is corrupted and cannot be recovered. We need to start fresh.',
      [
        {
          text: 'Start Fresh',
          action: () => this.clearCorruptedSession(sessionId),
          primary: true
        }
      ]
    );
  }

  /**
   * Recovery strategies for different error types
   */
  private async recoverFromInvalidTransition(context: any): Promise<void> {
    // Reset to a valid state
    console.log('Recovering from invalid transition by resetting state');
  }

  private async recoverFromMultipleSessions(context: any): Promise<void> {
    // Force user to choose which session to keep
    console.log('Recovering from multiple sessions by forcing user choice');
  }

  private async recoverFromStorageFailure(context: any): Promise<void> {
    // Retry storage operation with exponential backoff
    console.log('Recovering from storage failure with retry');
    await this.retryWithBackoff(() => this.retrySave(), 3);
  }

  private async recoverFromDataCorruption(context: any): Promise<void> {
    // Clear corrupted data and start fresh
    console.log('Recovering from data corruption by clearing data');
  }

  private async recoverFromStaleSession(context: any): Promise<void> {
    // Prompt user about stale session
    console.log('Recovering from stale session with user prompt');
  }

  /**
   * Utility methods for error handling
   */
  private logError(error: SessionError, context: any): void {
    this.errorLog.push({
      timestamp: Date.now(),
      error,
      context,
      resolved: false
    });
  }

  private markErrorResolved(error: SessionError, context: any): void {
    const errorEntry = this.errorLog.find(
      entry => entry.error === error && !entry.resolved
    );
    if (errorEntry) {
      errorEntry.resolved = true;
    }
  }

  private async retryWithBackoff(operation: () => Promise<void>, maxRetries: number): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await operation();
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  private extractValidData(corruptedData: any): any | null {
    try {
      // Basic validation and extraction logic
      if (corruptedData && typeof corruptedData === 'object') {
        const validData: any = {};
        
        // Extract valid session properties
        if (typeof corruptedData.id === 'string') validData.id = corruptedData.id;
        if (typeof corruptedData.weekId === 'string') validData.weekId = corruptedData.weekId;
        if (typeof corruptedData.dayId === 'string') validData.dayId = corruptedData.dayId;
        if (typeof corruptedData.startTime === 'number') validData.startTime = corruptedData.startTime;
        
        // Only return if we have essential data
        if (validData.id && validData.weekId && validData.dayId) {
          return validData;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * User interaction methods (to be implemented by UI layer)
   */
  private showUserPrompt(
    title: string, 
    message: string, 
    actions: Array<{text: string, action: () => void, primary?: boolean, destructive?: boolean}>
  ): void {
    // This would be implemented by the UI layer
    console.log(`User Prompt: ${title} - ${message}`, actions);
    
    // For now, just execute the first primary action or first action
    const primaryAction = actions.find(a => a.primary) || actions[0];
    if (primaryAction) {
      setTimeout(() => primaryAction.action(), 100);
    }
  }

  private showUserNotification(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    // This would be implemented by the UI layer
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
  }

  private showUserErrorMessage(error: SessionError, context: any): void {
    const messages = {
      [SessionError.INVALID_STATE_TRANSITION]: 'Invalid workout action. Please try again.',
      [SessionError.MULTIPLE_ACTIVE_SESSIONS]: 'You have multiple active sessions. Please resolve this conflict.',
      [SessionError.SESSION_NOT_FOUND]: 'Workout session not found. Please start a new workout.',
      [SessionError.STORAGE_FAILURE]: 'Failed to save workout data. Please check your device storage.',
      [SessionError.DATA_CORRUPTION]: 'Workout data is corrupted. Starting fresh.',
      [SessionError.STALE_SESSION]: 'Your workout session is too old. Please start a new one.'
    };

    const message = messages[error] || 'An unexpected error occurred.';
    this.showUserNotification('Error', message, 'error');
  }

  /**
   * Navigation methods (to be implemented by UI layer)
   */
  private navigateToActiveSession(): void {
    console.log('Navigate to active session');
    // Implementation would be provided by UI layer
  }

  private navigateToHistory(): void {
    console.log('Navigate to history');
    // Implementation would be provided by UI layer
  }

  private abandonPreviousSession(): void {
    console.log('Abandon previous session');
    // Implementation would be provided by UI layer
  }

  private startNewWorkout(): void {
    console.log('Start new workout');
    // Implementation would be provided by UI layer
  }

  private continueWorkout(): void {
    console.log('Continue workout');
    // Implementation would be provided by UI layer
  }

  private retrySave(): Promise<void> {
    console.log('Retry save operation');
    // Implementation would be provided by storage layer
    return Promise.resolve();
  }

  private useRecoveredData(data: any): void {
    console.log('Use recovered data:', data);
    // Implementation would be provided by session manager
  }

  private clearCorruptedSession(sessionId: string): void {
    console.log('Clear corrupted session:', sessionId);
    // Implementation would be provided by session manager
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats(): {
    totalErrors: number;
    resolvedErrors: number;
    unresolvedErrors: number;
    errorsByType: Record<SessionError, number>;
  } {
    const errorsByType = {} as Record<SessionError, number>;
    let resolvedCount = 0;

    this.errorLog.forEach(entry => {
      errorsByType[entry.error] = (errorsByType[entry.error] || 0) + 1;
      if (entry.resolved) resolvedCount++;
    });

    return {
      totalErrors: this.errorLog.length,
      resolvedErrors: resolvedCount,
      unresolvedErrors: this.errorLog.length - resolvedCount,
      errorsByType
    };
  }

  /**
   * Clear error log (for testing or maintenance)
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}