import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SessionError } from '../types';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isSessionError: boolean;
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isSessionError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a session-related error
    const isSessionError = error.message.includes('Session') || 
                          error.message.includes('INVALID_STATE_TRANSITION') ||
                          error.message.includes('MULTIPLE_ACTIVE_SESSIONS') ||
                          error.message.includes('STORAGE_FAILURE');

    return {
      hasError: true,
      error,
      isSessionError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SessionErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log session-specific errors
    if (this.state.isSessionError) {
      this.logSessionError(error, errorInfo);
    }
  }

  private logSessionError(error: Error, errorInfo: ErrorInfo): void {
    // Log to console with session context
    console.group('🏋️ Session Error Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // In a real app, you might want to send this to an error reporting service
    // like Sentry, LogRocket, etc.
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isSessionError: false
    });
  };

  private handleResetApp = (): void => {
    // Clear all session data and reload
    try {
      localStorage.removeItem('gymgenie_sessions');
      localStorage.removeItem('gymgenie_active_session');
      localStorage.removeItem('gymgenie_session_recovery');
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset app:', error);
      window.location.reload();
    }
  };

  private getErrorMessage(): string {
    if (!this.state.error) return 'An unexpected error occurred.';

    const message = this.state.error.message;

    // Provide user-friendly messages for common session errors
    if (message.includes('INVALID_STATE_TRANSITION')) {
      return 'There was an issue with your workout session state. This usually happens when trying to perform an invalid action.';
    }
    
    if (message.includes('MULTIPLE_ACTIVE_SESSIONS')) {
      return 'Multiple workout sessions were detected. Please complete or abandon your current session before starting a new one.';
    }
    
    if (message.includes('STORAGE_FAILURE')) {
      return 'Failed to save your workout data. Please check your device storage and try again.';
    }
    
    if (message.includes('DATA_CORRUPTION')) {
      return 'Your workout data appears to be corrupted. We recommend starting fresh to avoid further issues.';
    }

    if (this.state.isSessionError) {
      return 'There was an issue with your workout session. You can try to continue or start fresh.';
    }

    return 'An unexpected error occurred while managing your workout session.';
  }

  private getErrorTitle(): string {
    if (!this.state.error) return 'Error';

    const message = this.state.error.message;

    if (message.includes('INVALID_STATE_TRANSITION')) return 'Invalid Workout Action';
    if (message.includes('MULTIPLE_ACTIVE_SESSIONS')) return 'Multiple Sessions Detected';
    if (message.includes('STORAGE_FAILURE')) return 'Storage Error';
    if (message.includes('DATA_CORRUPTION')) return 'Data Corruption';
    if (this.state.isSessionError) return 'Session Error';

    return 'Application Error';
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {this.getErrorTitle()}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              {this.getErrorMessage()}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {this.state.isSessionError ? (
                <>
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={20} />
                    Try Again
                  </button>
                  <button
                    onClick={this.handleResetApp}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Home size={20} />
                    Reset & Start Fresh
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={20} />
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Reload Page
                  </button>
                </>
              )}
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Debug Information
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SessionErrorBoundary;