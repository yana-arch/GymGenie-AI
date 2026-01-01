import React, { useEffect, useRef, useCallback } from 'react';
import { useBreakpoint, Breakpoint } from './useBreakpoint';
import { ComponentLayoutConfig, LayoutConfig, layoutManager } from '@/utils/layoutManager';

// Hook for integrating Layout Manager with React components
export function useLayoutManager<T extends HTMLElement = HTMLElement>(
  componentName: string,
  config?: ComponentLayoutConfig
) {
  const elementRef = useRef<T>(null);
  const { currentBreakpoint } = useBreakpoint();

  // Register component configuration on mount
  useEffect(() => {
    if (config) {
      layoutManager.registerComponent(componentName, config);
    }

    return () => {
      // Cleanup on unmount
      layoutManager.unregisterComponent(componentName);
    };
  }, [componentName, config]);

  // Apply layout when breakpoint changes
  useEffect(() => {
    if (elementRef.current) {
      layoutManager.applyLayout(currentBreakpoint, componentName, elementRef.current);
    }
  }, [currentBreakpoint, componentName]);

  // Setup container queries when element is available
  useEffect(() => {
    if (elementRef.current) {
      layoutManager.setupContainerQueries(elementRef.current, componentName);
    }
  }, [componentName]);

  // Force layout update
  const updateLayout = useCallback(() => {
    if (elementRef.current) {
      layoutManager.applyLayout(currentBreakpoint, componentName, elementRef.current);
    }
  }, [currentBreakpoint, componentName]);

  // Get current layout config
  const getLayoutConfig = useCallback((breakpoint?: Breakpoint): LayoutConfig | null => {
    return layoutManager.getLayoutConfig(componentName, breakpoint);
  }, [componentName]);

  return {
    ref: elementRef,
    currentBreakpoint,
    updateLayout,
    getLayoutConfig,
    layoutManager
  };
}

// Hook for responsive component registration
export function useResponsiveComponent<T extends HTMLElement = HTMLElement>(
  componentName: string,
  layouts: ComponentLayoutConfig['layouts'],
  options?: {
    priority?: number;
    dependencies?: string[];
    autoApply?: boolean;
  }
) {
  const { autoApply = true, ...configOptions } = options || {};
  
  const config: ComponentLayoutConfig = {
    component: componentName,
    layouts,
    ...configOptions
  };

  const {
    ref,
    currentBreakpoint,
    updateLayout,
    getLayoutConfig
  } = useLayoutManager<T>(componentName, config);

  // Auto-apply layout if enabled
  useEffect(() => {
    if (autoApply && ref.current) {
      updateLayout();
    }
  }, [autoApply, updateLayout]);

  return {
    ref,
    currentBreakpoint,
    updateLayout,
    getLayoutConfig,
    isRegistered: true
  };
}

// Hook for layout event listening
export function useLayoutEvents(
  callback: (event: { component: string; breakpoint: Breakpoint; config: LayoutConfig }) => void,
  dependencies: string[] = []
) {
  useEffect(() => {
    const handleLayoutChange = (event: CustomEvent) => {
      const { component, breakpoint, config } = event.detail;
      
      // Filter by dependencies if specified
      if (dependencies.length === 0 || dependencies.includes(component)) {
        callback({ component, breakpoint, config });
      }
    };

    window.addEventListener('layoutChange', handleLayoutChange as EventListener);

    return () => {
      window.removeEventListener('layoutChange', handleLayoutChange as EventListener);
    };
  }, [callback, dependencies]);
}

// Hook for conditional rendering based on breakpoint
export function useBreakpointRender<T>(
  renderMap: Partial<Record<Breakpoint, T>>,
  fallback?: T
): T | undefined {
  const { currentBreakpoint } = useBreakpoint();

  return renderMap[currentBreakpoint] || fallback;
}

// Hook for responsive CSS classes
export function useResponsiveClasses(
  classMap: Partial<Record<Breakpoint, string>>,
  baseClasses: string = ''
): string {
  const { currentBreakpoint } = useBreakpoint();

  const responsiveClass = classMap[currentBreakpoint] || '';
  return `${baseClasses} ${responsiveClass}`.trim();
}

// Hook for responsive inline styles
export function useResponsiveStyles(
  styleMap: Partial<Record<Breakpoint, React.CSSProperties>>,
  baseStyles: React.CSSProperties = {}
): React.CSSProperties {
  const { currentBreakpoint } = useBreakpoint();

  const responsiveStyles = styleMap[currentBreakpoint] || {};
  return { ...baseStyles, ...responsiveStyles };
}

// Hook for layout debugging (development only)
export function useLayoutDebug(componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') {
  const { currentBreakpoint } = useBreakpoint();

  useEffect(() => {
    if (!enabled) return;

    const config = layoutManager.getLayoutConfig(componentName, currentBreakpoint);
    console.group(`Layout Debug: ${componentName}`);
    console.log('Current Breakpoint:', currentBreakpoint);
    console.log('Layout Config:', config);
    console.log('Window Size:', { width: window.innerWidth, height: window.innerHeight });
    console.groupEnd();
  }, [componentName, currentBreakpoint, enabled]);

  // Listen for layout changes
  useLayoutEvents((event) => {
    if (!enabled || event.component !== componentName) return;

    console.log(`Layout Changed: ${componentName}`, {
      breakpoint: event.breakpoint,
      config: event.config
    });
  }, [componentName]);
}
