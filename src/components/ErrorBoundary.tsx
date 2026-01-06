import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // In production, you might want to send this to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorService(error, errorInfo);
      console.error('Production Error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
            </div>
            
            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            
            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred while using the application.'}
            </p>

            {/* Debug Info in Development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300">
                  Debug Information
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-mono overflow-auto max-h-40">
                  <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Error:</div>
                  <div className="mb-3">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <>
                      <div className="text-red-600 dark:text-red-400 font-semibold mb-2">Stack Trace:</div>
                      <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </div>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCw size={20} className="mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={this.handleGoHome}
                className="w-full"
              >
                <Home size={20} className="mr-2" />
                Go Home
              </Button>
            </div>

            {/* Support Information */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If this problem continues, please contact support or refresh the page.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Error ID: {Date.now()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  // This would typically use the toast system to show errors
  const { showToast } = useToast();
  
  return {
    handleError: (error: Error, context?: string) => {
      console.error('Application Error:', error, context);
      
      showToast({
        type: 'error',
        title: 'Application Error',
        message: context ? `${context}: ${error.message}` : error.message,
        persistent: false,
        duration: 5000
      });
    }
  };
};