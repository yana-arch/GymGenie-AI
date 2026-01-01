import React, { ComponentType, memo, useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Simplified utilities for optimizing render performance
 */

/**
 * Enhanced memo wrapper with custom comparison and debugging
 */
export const optimizedMemo = <P extends object>(
  Component: ComponentType<P>,
  customCompare?: (prevProps: P, nextProps: P) => boolean,
  debugName?: string
) => {
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
};

/**
 * Stable callback hook that prevents unnecessary re-renders
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
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
};

/**
 * Intersection observer hook for lazy rendering
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] => {
  const elementRef = useRef<HTMLElement>(null);
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
  }, [options]);
  
  return [elementRef, isIntersecting];
};