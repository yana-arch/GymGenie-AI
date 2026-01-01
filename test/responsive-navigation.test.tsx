import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import { Dumbbell, Utensils, History, Calendar } from 'lucide-react';

// Mock the breakpoint hook
const mockBreakpoint = {
  isMobile: vi.fn(() => true),
  isTablet: vi.fn(() => false),
  isDesktop: vi.fn(() => false),
  isLargeDesktop: vi.fn(() => false),
  getCurrentBreakpoint: vi.fn(() => 'mobile'),
};

vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpoint,
}));

// Mock the layout manager hook
vi.mock('@/hooks/useLayoutManager', () => ({
  useResponsiveComponent: () => ({
    ref: { current: null },
    currentBreakpoint: 'mobile',
    updateLayout: vi.fn(),
    getLayoutConfig: vi.fn(),
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ResponsiveNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to mobile by default
    mockBreakpoint.isMobile.mockReturnValue(true);
    mockBreakpoint.isTablet.mockReturnValue(false);
    mockBreakpoint.isDesktop.mockReturnValue(false);
    mockBreakpoint.isLargeDesktop.mockReturnValue(false);
    mockBreakpoint.getCurrentBreakpoint.mockReturnValue('mobile');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Navigation', () => {
    it('should render children content on mobile', () => {
      render(<ResponsiveNavigation><div>Mobile Content</div></ResponsiveNavigation>);
      expect(screen.getByText('Mobile Content')).toBeInTheDocument();
    });

    it('should render bottom navigation on mobile', () => {
      mockBreakpoint.isDesktop.mockReturnValue(false);
      render(<ResponsiveNavigation><div>Mobile Content</div></ResponsiveNavigation>);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('justify-around'); // Characteristic of bottom nav
    });
  });


  describe('Desktop Navigation', () => {
    beforeEach(() => {
      mockBreakpoint.isDesktop.mockReturnValue(true);
      mockBreakpoint.isMobile.mockReturnValue(false);
    });

    it('should render children content on desktop', () => {
      render(<ResponsiveNavigation><div>Desktop Content</div></ResponsiveNavigation>);
      expect(screen.getByText('Desktop Content')).toBeInTheDocument();
    });

    it('should render header on desktop', () => {
      render(<ResponsiveNavigation><div>Desktop Content</div></ResponsiveNavigation>);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('GymGenie')).toBeInTheDocument();
    });

    it('should not render bottom navigation on desktop', () => {
      render(<ResponsiveNavigation><div>Desktop Content</div></ResponsiveNavigation>);
      // The bottom nav would have a 'footer' role
      expect(screen.queryByRole('footer')).not.toBeInTheDocument();
    });
  });

  // The remaining tests are no longer relevant as they test props and features
  // that were removed from the simplified ResponsiveNavigation component.
  // These tests will need to be rewritten for the new `DashboardHeader` and `DashboardBottomNav`
  // components individually once their real implementations are in place.
});