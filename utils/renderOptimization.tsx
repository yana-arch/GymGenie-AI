import React, { ComponentType, memo, useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Utilities for optimizing render performance in large component trees
 */

/**
 * Enhanced memo wrapper with custom comparison and debugging
 */
export function optimizedMemo<P extends object>(
  Component: ComponentType<P>,
  customCompare?: (prevProps: P, nextProps: P) => boolean,
  debugName?: string
) {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    // Use custom comparison if provided
    if (customCompare) {
      const isEqual = customCompare(prevProps, nextProps);
      
      if (process.env.NODE_ENV === 'development' && debugName) {
        if (!isEqual) {
          console.log(`[RenderOptimization] ${debugName} will re-render due to prop changes`);
        }
      }
      
      return isEqual;
    }
    
    // Default shallow comparison with debugging
    const keys = Object.keys(nextProps) as (keyof P)[];
    const prevKeys = Object.keys(prevProps) as (keyof P)[];
    
    if (keys.length !== prevKeys.length) {
      if (process.env.NODE_ENV === 'development' && debugName) {
        console.log(`[RenderOptimization] ${debugName} will re-render due to prop count change`);
      }
      return false;
    }
    
    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        if (process.env.NODE_ENV === 'development' && debugName) {
          console.log(`[RenderOptimization] ${debugName} will re-render due to prop "${String(key)}" change`);
        }
        return false;
      }
    }
    
    return true;
  });
  
  MemoizedComponent.displayName = `OptimizedMemo(${Component.displayName || Component.name || 'Component'})`;
  return MemoizedComponent;
}

/**
 * Stable callback hook that prevents unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef(deps);
  
  // Update callback if dependencies changed
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return depsRef.current.some((dep, index) => dep !== deps[index]);
  }, deps);
  
  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Debounced state hook to prevent excessive re-renders
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [debouncedValue, updateValue, value];
}

/**
 * Throttled callback hook to limit function execution frequency
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]) as T;
}

/**
 * Intersection observer hook for lazy rendering
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin]);
  
  return [elementRef, isIntersecting];
}

/**
 * Lazy component wrapper for conditional rendering
 */
export const LazyRender: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}> = ({ children, fallback = null, threshold = 0.1, rootMargin = '50px' }) => {
  const [elementRef, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin,
  });
  
  return (
    <div ref={elementRef}>
      {isIntersecting ? children : fallback}
    </div>
  );
};

/**
 * Batch state updates to minimize re-renders
 */
export function useBatchedUpdates<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const batchUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, 0);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, batchUpdate];
}

/**
 * Virtualization helper for large lists
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);
  
  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Component tree optimization analyzer
 */
export function analyzeComponentTree(element: React.ReactElement): {
  depth: number;
  componentCount: number;
  memoizedCount: number;
  recommendations: string[];
} {
  let depth = 0;
  let componentCount = 0;
  let memoizedCount = 0;
  const recommendations: string[] = [];
  
  const traverse = (node: React.ReactNode, currentDepth: number = 0): void => {
    if (!React.isValidElement(node)) return;
    
    depth = Math.max(depth, currentDepth);
    componentCount++;
    
    // Check if component is memoized
    if (node.type && (node.type as any).$$typeof === Symbol.for('react.memo')) {
      memoizedCount++;
    }
    
    // Traverse children
    React.Children.forEach((node.props as any).children, (child) => {
      traverse(child, currentDepth + 1);
    });
  };
  
  traverse(element);
  
  // Generate recommendations
  if (depth > 10) {
    recommendations.push('Consider flattening component hierarchy - depth > 10 levels');
  }
  
  if (componentCount > 50 && memoizedCount / componentCount < 0.3) {
    recommendations.push('Consider memoizing more components - less than 30% are memoized');
  }
  
  if (componentCount > 100) {
    recommendations.push('Consider code splitting or virtualization for large component trees');
  }
  
  return {
    depth,
    componentCount,
    memoizedCount,
    recommendations,
  };
}

/**
 * Performance-optimized context provider
 */
export function createOptimizedContext<T>(defaultValue: T) {
  const Context = React.createContext<T>(defaultValue);
  
  const Provider: React.FC<{ value: T; children: React.ReactNode }> = ({ value, children }) => {
    const memoizedValue = useMemo(() => value, [JSON.stringify(value)]);
    
    return (
      <Context.Provider value={memoizedValue}>
        {children}
      </Context.Provider>
    );
  };
  
  const useOptimizedContext = () => {
    const context = React.useContext(Context);
    if (context === undefined) {
      throw new Error('useOptimizedContext must be used within a Provider');
    }
    return context;
  };
  
  return { Provider, useContext: useOptimizedContext };
}

/**
 * Render bailout hook for expensive components
 */
export function useRenderBailout<T>(
  value: T,
  shouldUpdate: (prev: T, next: T) => boolean = (prev, next) => prev !== next
): T {
  const ref = useRef<T>(value);
  
  if (shouldUpdate(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}