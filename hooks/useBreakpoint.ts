import { useState, useEffect, useMemo } from 'react';

export const BREAKPOINT_CONFIG = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export type Breakpoint = keyof typeof BREAKPOINT_CONFIG;

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export const useBreakpoint = () => {
  const { width } = useWindowSize();

  const currentBreakpoint = useMemo((): Breakpoint => {
    if (width < BREAKPOINT_CONFIG.sm) return 'sm';
    if (width < BREAKPOINT_CONFIG.md) return 'md';
    if (width < BREAKPOINT_CONFIG.lg) return 'lg';
    return 'xl';
  }, [width]);

  const isMobile = () => width < BREAKPOINT_CONFIG.md;
  const isTablet = () => width >= BREAKPOINT_CONFIG.md && width < BREAKPOINT_CONFIG.lg;
  const isDesktop = () => width >= BREAKPOINT_CONFIG.lg;
  const isLargeDesktop = () => width >= BREAKPOINT_CONFIG.xl;

  return {
    width,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    getCurrentBreakpoint: () => currentBreakpoint,
  };
};

export const useIsDesktop = () => {
    const { width } = useWindowSize();
    return width >= BREAKPOINT_CONFIG.lg;
};

export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};
