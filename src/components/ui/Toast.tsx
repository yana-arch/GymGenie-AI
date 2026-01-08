import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
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
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const hideToast = useCallback((id: string) => {
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Basic deduplication: if a toast with exact same title and message exists, don't add it
    const id = crypto.randomUUID();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => {
      const isDuplicate = prev.some(t => t.title === toast.title && t.message === toast.message);
      if (isDuplicate) return prev;
      return [...prev, newToast];
    });
    
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      const timeout = setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
      timeoutsRef.current[id] = timeout;
    }
    
    return id;
  }, [hideToast]);

  const clearAllToasts = useCallback(() => {
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={() => hideToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info': return <Info className="text-blue-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-white dark:bg-gray-800 border-green-500/20 shadow-green-500/5';
      case 'error': return 'bg-white dark:bg-gray-800 border-red-500/20 shadow-red-500/5';
      case 'warning': return 'bg-white dark:bg-gray-800 border-yellow-500/20 shadow-yellow-500/5';
      case 'info': return 'bg-white dark:bg-gray-800 border-blue-500/20 shadow-blue-500/5';
      default: return 'bg-white dark:bg-gray-800 border-gray-500/20 shadow-gray-500/5';
    }
  };

  const getIndicatorStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden
        transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-95'}
        ${getBackgroundStyles()}
        border rounded-2xl shadow-2xl p-4 flex items-start gap-3 min-w-[280px]
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getIndicatorStyles()}`} />
      
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{toast.title}</h4>
        {toast.message && <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 leading-relaxed">{toast.message}</p>}
      </div>
      {!toast.persistent && (
        <button 
          onClick={handleClose} 
          className="flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

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
  network: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'Network Error',
    message: message || 'Please check your internet connection and try again.',
    persistent: true,
    duration: 8000
  }),
  api: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'System Error',
    message: message || 'An unexpected error occurred. Please try again.',
    persistent: false,
    duration: 6000
  }),
  validation: (field: string, message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Validation Needed',
    message: message || `Please verify your ${field} input.`,
    persistent: false,
    duration: 4000
  }),
  camera: (message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Camera Connection',
    message: message || 'Camera access is required for AI form detection.',
    persistent: false,
    duration: 6000
  }),
  ai: (message?: string) => ({
    type: 'error' as ToastType,
    title: 'AI Insight Error',
    message: message || 'AI processing is currently unavailable.',
    persistent: false,
    duration: 6000
  }),
  permission: (permission: string, message?: string) => ({
    type: 'warning' as ToastType,
    title: 'Access Denied',
    message: message || `Please enable ${permission} in your settings to use this feature.`,
    persistent: true,
    duration: 10000
  })
};
