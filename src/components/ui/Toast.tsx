import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-hide if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
    
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getTextStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundStyles()}
        border rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-0
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm ${getTextStyles()}`}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className={`text-xs mt-1 ${getTextStyles()} opacity-80`}>
            {toast.message}
          </p>
        )}
      </div>
      
      {!toast.persistent && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/5 
            dark:hover:bg-white/5 transition-colors
            ${getTextStyles()} opacity-60 hover:opacity-100
          `}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Convenience functions for common toast types
// Enhanced error handling for different error types
export const toast = {
  success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => ({
    type: 'success' as ToastType,
    title,
    message,
    ...options
  }),
  error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => ({
    type: 'error' as ToastType,
    title,
    message,
    ...options
  }),
  warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => ({
    type: 'warning' as ToastType,
    title,
    message,
    ...options
  }),
  info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => ({
    type: 'info' as ToastType,
    title,
    message,
    ...options
  }),

  // Specific error types for better UX
  network: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'Network Error',
    message: message || 'Please check your internet connection and try again.',
    persistent: true,
    duration: 8000
  }),

  api: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'API Error',
    message: message || 'Server request failed. Please try again.',
    persistent: false,
    duration: 6000
  }),

  validation: (field: string, message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Validation Error',
    message: message || `Please check your ${field} input.`,
    persistent: false,
    duration: 4000
  }),

  camera: (message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Camera Access',
    message: message || 'Camera access is needed for form detection features.',
    persistent: true,
    duration: 8000
  }),

  ai: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'AI Service Error',
    message: message || 'AI service unavailable. Please try again.',
    persistent: false,
    duration: 6000
  }),

  permission: (permission: string, message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Permission Required',
    message: message || `Please allow ${permission} to use this feature.`,
    persistent: true,
    duration: 10000
  })
};