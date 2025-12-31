import { useState, useEffect, useCallback } from 'react';

// Breakpoint type definitions matching our Tailwind configuration
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';

// Breakpoint configuration matching our CSS custom properties
export const BREAKPOINT_CONFIG = {
  mobile: { minWidth: 320, maxWidth: 767 },
  tablet: { minWidth: 768, maxWidth: 1023 },
  desktop: { minWidth: 1024, maxWidth: 1439 },
  'large-desktop': { minWidth: 1440, maxWidth: Infinity },
} as const;

// Interface for breakpoint manager functionality
export interface BreakpointManager {
  getCurrentBreakpoint(): Breakpoint;
  onBreakpointChange(callback: (breakpoint: Breakpoint) => void): () => void;
  isBreakpoint(breakpoint: Breakpoint): boolean;
  getBreakpointRange(): { min: number; max: number };
  isMobile(): boolean;
  isTablet(): boolean;
  isDesktop(): boolean;
  isLargeDesktop(): boolean;
  isTouchDevice(): boolean;
}

// Utility function to determine current breakpoint based on window width
export function getCurrentBreakpoint(width: number = window.innerWidth): Breakpoint {
  if (width >= BREAKPOINT_CONFIG['large-desktop'].minWidth) {
    return 'large-desktop';
  }
  if (width >= BREAKPOINT_CONFIG.desktop.minWidth) {
    return 'desktop';
  }
  if (width >= BREAKPOINT_CONFIG.tablet.minWidth) {
    return 'tablet';
  }
  return 'mobile';
}

// Utility function to detect touch device capability
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

// Custom hook for breakpoint management
export function useBreakpoint(): BreakpointManager {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(() => {
    // Handle SSR case
    if (typeof window === 'undefined') return 'mobile';
    return getCurrentBreakpoint();
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 320;
    return window.innerWidth;
  });

  // Handle window resize with debouncing for performance
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newBreakpoint = getCurrentBreakpoint(newWidth);
        
        setWindowWidth(newWidth);
        if (newBreakpoint !== currentBreakpoint) {
          setCurrentBreakpoint(newBreakpoint);
        }
      }, 100); // 100ms debounce for performance
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [currentBreakpoint]);

  // Breakpoint manager implementation
  const breakpointManager: BreakpointManager = {
    getCurrentBreakpoint: useCallback(() => currentBreakpoint, [currentBreakpoint]),

    onBreakpointChange: useCallback((callback: (breakpoint: Breakpoint) => void) => {
      let previousBreakpoint = currentBreakpoint;
      
      const handleResize = () => {
        const newBreakpoint = getCurrentBreakpoint();
        if (newBreakpoint !== previousBreakpoint) {
          previousBreakpoint = newBreakpoint;
          callback(newBreakpoint);
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }, [currentBreakpoint]),

    isBreakpoint: useCallback((breakpoint: Breakpoint) => {
      return currentBreakpoint === breakpoint;
    }, [currentBreakpoint]),

    getBreakpointRange: useCallback(() => {
      const config = BREAKPOINT_CONFIG[currentBreakpoint];
      return {
        min: config.minWidth,
        max: config.maxWidth === Infinity ? Number.MAX_SAFE_INTEGER : config.maxWidth,
      };
    }, [currentBreakpoint]),

    isMobile: useCallback(() => currentBreakpoint === 'mobile', [currentBreakpoint]),
    isTablet: useCallback(() => currentBreakpoint === 'tablet', [currentBreakpoint]),
    isDesktop: useCallback(() => currentBreakpoint === 'desktop', [currentBreakpoint]),
    isLargeDesktop: useCallback(() => currentBreakpoint === 'large-desktop', [currentBreakpoint]),
    isTouchDevice: useCallback(() => isTouchDevice(), []),
  };

  return breakpointManager;
}

// Hook for specific breakpoint queries (more performant for single checks)
export function useBreakpointQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return breakpoint === 'mobile';
    return getCurrentBreakpoint() === breakpoint;
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentBp = getCurrentBreakpoint();
        setMatches(currentBp === breakpoint);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return matches;
}

// Hook for media query-like functionality
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Utility hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  'large-desktop'?: T;
}): T | undefined {
  const { getCurrentBreakpoint } = useBreakpoint();
  const currentBp = getCurrentBreakpoint();

  // Return the value for current breakpoint, with fallback logic
  return (
    values[currentBp] ||
    values.desktop ||
    values.tablet ||
    values.mobile
  );
}