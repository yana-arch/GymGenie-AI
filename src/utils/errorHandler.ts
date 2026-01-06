import { useToast, toast } from '@/components/ui/Toast';

// Error types for better categorization
export interface ApiError {
  status?: number;
  message: string;
  code?: string;
  type: 'network' | 'api' | 'validation' | 'permission' | 'camera' | 'ai' | 'unknown';
}

export class ServiceError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly type: ApiError['type'];

  constructor(error: Partial<ApiError>) {
    super(error.message);
    this.status = error.status;
    this.code = error.code;
    this.type = error.type || 'unknown';
  }
}

export const useErrorHandler = () => {
  const { showToast } = useToast();

  const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context}:`, error);

    // Handle different error types
    if (error instanceof ServiceError) {
      switch (error.type) {
        case 'network':
          showToast(toast.network(error.message));
          break;
        case 'api':
          showToast(toast.api(error.message));
          break;
        case 'validation':
          showToast(toast.validation(context || 'input', error.message));
          break;
        case 'permission':
          showToast(toast.permission(context || 'access', error.message));
          break;
        case 'camera':
          showToast(toast.camera(error.message));
          break;
        case 'ai':
          showToast(toast.ai(error.message));
          break;
        default:
          showToast(toast.error('Error', error.message));
      }
    } else if (error instanceof Error) {
      // Handle fetch/network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        showToast(toast.network());
      } else if (error.message.includes('permission')) {
        showToast(toast.permission('required', error.message));
      } else {
        showToast(toast.error('Error', error.message));
      }
    } else {
      // Unknown error type
      showToast(toast.error('Unexpected Error', 'An unknown error occurred. Please try again.'));
    }
  };

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  return {
    handleError,
    handleAsyncError,
    createError: (error: Partial<ApiError>) => new ServiceError(error)
  };
};

// Utility functions for common error scenarios
export const createApiError = (status: number, message: string): ServiceError => {
  return new ServiceError({
    status,
    message,
    type: status >= 400 && status < 500 ? 'validation' : 'api'
  });
};

export const createNetworkError = (message?: string): ServiceError => {
  return new ServiceError({
    message: message || 'Network connection failed',
    type: 'network'
  });
};

export const createCameraError = (message?: string): ServiceError => {
  return new ServiceError({
    message: message || 'Camera access denied or unavailable',
    type: 'camera'
  });
};

export const createPermissionError = (permission: string, message?: string): ServiceError => {
  return new ServiceError({
    message: message || `Permission required for ${permission}`,
    type: 'permission'
  });
};