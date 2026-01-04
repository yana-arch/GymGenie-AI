import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';

/**
 * Performance monitoring hooks for tracking render performance
 * and identifying optimization opportunities
 */

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
  slowRenders: number; // Renders > 16ms
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Global performance tracking
const renderMetrics = new Map<string, RenderMetrics>();
const performanceObserver = typeof window !== 'undefined' && 'PerformanceObserver' in window;

/**
 * Hook to monitor component render performance
 */
export const useRenderPerformance = (componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);
  const slowRenders = useRef<number>(0);

  const trackRender = useCallback(() => {
    if (!enabled) return;
    const startTime = performance.now();
    
    const endRender = () => {
      const renderTime = performance.now() - startTime;
      renderCount.current += 1;
      totalRenderTime.current += renderTime;
      
      if (renderTime > 16) {
        slowRenders.current += 1;
      }
      
      const metrics: RenderMetrics = {
        componentName,
        renderCount: renderCount.current,
        averageRenderTime: totalRenderTime.current / renderCount.current,
        lastRenderTime: renderTime,
        totalRenderTime: totalRenderTime.current,
        slowRenders: slowRenders.current,
      };
      
      renderMetrics.set(componentName, metrics);
      
      if (renderTime > 16 && process.env.NODE_ENV === 'development') {
        console.warn(`[Performance] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };

    // Calling synchronously for deterministic testing and immediate feedback in dev.
    endRender();
  }, [componentName, enabled]);


  return {
    getRenderMetrics: () => renderMetrics.get(componentName),
    getAllMetrics: () => Array.from(renderMetrics.values()),
    trackRender,
  };
};

/**
 * Hook to monitor memory usage
 */
export const useMemoryMonitor = (intervalMs: number = 5000) => {
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getMemoryInfo = useCallback((): MemoryMetrics | null => {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in (window.performance as any))) {
      return null;
    }

    const memory = (window.performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }, []);

  useEffect(() => {
    const updateMemoryMetrics = () => {
      const metrics = getMemoryInfo();
      if (metrics) {
        setMemoryMetrics(metrics);
        
        // Warn about high memory usage
        const usagePercentage = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
        if (usagePercentage > 80 && process.env.NODE_ENV === 'development') {
          console.warn(`[Performance] High memory usage detected: ${usagePercentage.toFixed(1)}%`);
        }
      }
    };

    updateMemoryMetrics(); // Initial measurement
    intervalRef.current = setInterval(updateMemoryMetrics, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMs, getMemoryInfo]);

  return memoryMetrics;
};

/**
 * Hook to monitor component mount/unmount cycles
 */
export const useMountTracker = (componentName: string) => {
  const mountTime = useRef<number>(0);
  const [isTracking] = useState(process.env.NODE_ENV === 'development');

  useEffect(() => {
    if (!isTracking) return;
    
    mountTime.current = performance.now();
    console.log(`[Mount] ${componentName} mounted at ${mountTime.current.toFixed(2)}ms`);

    return () => {
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTime.current;
      console.log(`[Mount] ${componentName} unmounted after ${lifespan.toFixed(2)}ms`);
    };
  }, [componentName, isTracking]);
};

/**
 * Hook to track expensive operations
 */
export const useOperationTracker = () => {
  const trackOperation = useCallback(<T>(
    operationName: string,
    operation: () => T,
    warnThreshold: number = 100
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > warnThreshold && process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Slow operation "${operationName}": ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  const trackAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>,
    warnThreshold: number = 100
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > warnThreshold && process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Slow async operation "${operationName}": ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  return { trackOperation, trackAsyncOperation };
};

/**
 * Hook to monitor frame rate
 */
export const useFrameRateMonitor = () => {
  const [frameRate, setFrameRate] = useState<number>(60);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(performance.now());
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const measureFrameRate = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) { // Update every second
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setFrameRate(fps);
        
        if (fps < 30 && process.env.NODE_ENV === 'development') {
          console.warn(`[Performance] Low frame rate detected: ${fps} FPS`);
        }
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationFrame.current = requestAnimationFrame(measureFrameRate);
    };

    animationFrame.current = requestAnimationFrame(measureFrameRate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return frameRate;
};

/**
 * Hook to detect and warn about unnecessary re-renders
 */
export const useRenderOptimization = <T extends Record<string, any>>(
  props: T,
  componentName: string
) => {
  const previousProps = useRef<T>(props);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current++;
    
    if (process.env.NODE_ENV === 'development') {
      const changedProps: string[] = [];
      
      for (const [key, value] of Object.entries(props)) {
        if (previousProps.current[key] !== value) {
          changedProps.push(key);
        }
      }
      
      if (changedProps.length === 0 && renderCount.current > 1) {
        console.warn(
          `[Performance] Unnecessary re-render in ${componentName} (render #${renderCount.current}). ` +
          'Consider using React.memo, useMemo, or useCallback.'
        );
      } else if (changedProps.length > 0) {
        console.log(`[Performance] ${componentName} re-rendered due to props: ${changedProps.join(', ')}`);
      }
    }
    
    previousProps.current = props;
  });

  return renderCount.current;
};

/**
 * Hook to measure component tree depth and complexity
 */
export const useComponentComplexity = (componentName: string) => {
  const [complexity, setComplexity] = useState<{
    depth: number;
    childCount: number;
    domNodes: number;
  } | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Measure DOM complexity after render
    const measureComplexity = () => {
      const elements = document.querySelectorAll(`[data-component="${componentName}"]`);
      if (elements.length === 0) return;

      const element = elements[0];
      const childCount = element.children.length;
      const domNodes = element.querySelectorAll('*').length;
      
      // Calculate depth
      let depth = 0;
      let current = element.firstElementChild;
      while (current) {
        depth++;
        current = current.firstElementChild;
      }

      const complexityMetrics = { depth, childCount, domNodes };
      setComplexity(complexityMetrics);

      // Warn about high complexity
      if (domNodes > 100 || depth > 10) {
        console.warn(
          `[Performance] High component complexity in ${componentName}:`,
          complexityMetrics
        );
      }
    };

    // Use setTimeout to measure after DOM updates
    const timeoutId = setTimeout(measureComplexity, 0);
    return () => clearTimeout(timeoutId);
  }, [componentName]);

  return complexity;
};

/**
 * Performance summary hook for debugging
 */
export const usePerformanceSummary = () => {
  const getPerformanceSummary = useCallback(() => {
    const metrics = Array.from(renderMetrics.values());
    const slowComponents = metrics.filter(m => m.averageRenderTime > 16);
    const totalRenders = metrics.reduce((sum, m) => sum + m.renderCount, 0);
    const totalSlowRenders = metrics.reduce((sum, m) => sum + m.slowRenders, 0);

    return {
      totalComponents: metrics.length,
      totalRenders,
      totalSlowRenders,
      slowComponents: slowComponents.map(c => ({
        name: c.componentName,
        averageTime: c.averageRenderTime,
        slowRenderPercentage: (c.slowRenders / c.renderCount) * 100,
      })),
      recommendations: generateRecommendations(metrics),
    };
  }, []);

  return { getPerformanceSummary };
};

// Helper function to generate performance recommendations
const generateRecommendations = (metrics: RenderMetrics[]): string[] => {
  const recommendations: string[] = [];
  
  const slowComponents = metrics.filter(m => m.averageRenderTime > 16);
  if (slowComponents.length > 0) {
    recommendations.push(
      `Consider optimizing ${slowComponents.length} slow components: ${slowComponents.map(c => c.componentName).join(', ')}`
    );
  }
  
  const frequentRenderers = metrics.filter(m => m.renderCount > 100);
  if (frequentRenderers.length > 0) {
    recommendations.push(
      `Consider memoization for frequently rendering components: ${frequentRenderers.map(c => c.componentName).join(', ')}`
    );
  }
  
  return recommendations;
};