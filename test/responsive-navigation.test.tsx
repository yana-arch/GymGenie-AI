import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveNavigation, { useNavigationItems, NavItem } from '../components/ResponsiveNavigation';
import { Dumbbell, Utensils, History, Calendar } from 'lucide-react';

// Mock the breakpoint hook
const mockBreakpoint = {
  isMobile: vi.fn(() => true),
  isTablet: vi.fn(() => false),
  isDesktop: vi.fn(() => false),
  isLargeDesktop: vi.fn(() => false),
  getCurrentBreakpoint: vi.fn(() => 'mobile'),
};

vi.mock('../hooks/useBreakpoint', () => ({
  useBreakpoint: () => mockBreakpoint,
}));

// Mock the layout manager hook
vi.mock('../hooks/useLayoutManager', () => ({
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
  const mockHandlers = {
    onWorkoutClick: vi.fn(),
    onNutritionClick: vi.fn(),
    onHistoryClick: vi.fn(),
    onCalendarClick: vi.fn(),
  };

  const testItems: NavItem[] = [
    {
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      onClick: mockHandlers.onWorkoutClick,
      isActive: true,
    },
    {
      id: 'nutrition',
      label: 'Kitchen',
      icon: Utensils,
      onClick: mockHandlers.onNutritionClick,
      isActive: false,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      onClick: mockHandlers.onHistoryClick,
      isActive: false,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      onClick: mockHandlers.onCalendarClick,
      isActive: false,
    },
  ];

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
    it('should render hamburger menu button on mobile', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      expect(hamburgerButton).toBeInTheDocument();
      expect(hamburgerButton).toHaveTextContent('Menu');
    });

    it('should render bottom navigation on mobile', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const bottomNav = screen.getByRole('navigation');
      expect(bottomNav).toBeInTheDocument();
      
      // Should show first 4 items in bottom nav
      expect(screen.getByText('Workout')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should open mobile menu when hamburger is clicked', async () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(screen.getByText('GymGenie AI')).toBeInTheDocument();
        expect(screen.getByText('Navigation Menu')).toBeInTheDocument();
      });
    });

    it('should close mobile menu when close button is clicked', async () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Navigation Menu')).toBeInTheDocument();
      });
      
      // Close menu
      const closeButton = screen.getByLabelText('Close menu');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Navigation Menu')).not.toBeInTheDocument();
      });
    });

    it('should call item onClick when clicked in mobile menu', async () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      // Open menu
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Navigation Menu')).toBeInTheDocument();
      });
      
      // Click workout item
      const workoutButton = screen.getAllByText('Workout')[0]; // First one is in the mobile menu
      fireEvent.click(workoutButton);
      
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalledTimes(1);
    });

    it('should call item onClick when clicked in bottom navigation', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const workoutButtons = screen.getAllByText('Workout');
      const bottomNavWorkout = workoutButtons[workoutButtons.length - 1]; // Last one is in bottom nav
      fireEvent.click(bottomNavWorkout);
      
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tablet Navigation', () => {
    beforeEach(() => {
      mockBreakpoint.isMobile.mockReturnValue(false);
      mockBreakpoint.isTablet.mockReturnValue(true);
      mockBreakpoint.getCurrentBreakpoint.mockReturnValue('tablet');
    });

    it('should render bottom navigation on tablet', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const bottomNav = screen.getByRole('navigation');
      expect(bottomNav).toBeInTheDocument();
      
      // Should show all items in bottom nav on tablet
      expect(screen.getByText('Workout')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should not render hamburger menu on tablet', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.queryByLabelText('Toggle navigation menu');
      expect(hamburgerButton).not.toBeInTheDocument();
    });
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      mockBreakpoint.isMobile.mockReturnValue(false);
      mockBreakpoint.isTablet.mockReturnValue(false);
      mockBreakpoint.isDesktop.mockReturnValue(true);
      mockBreakpoint.getCurrentBreakpoint.mockReturnValue('desktop');
    });

    it('should render sidebar navigation on desktop', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      // Should render sidebar
      expect(screen.getByText('GymGenie AI')).toBeInTheDocument();
      expect(screen.getByText('Your AI Fitness Coach')).toBeInTheDocument();
      
      // Should show all navigation items
      expect(screen.getByText('Workout')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should not render bottom navigation on desktop', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      // Should not have bottom navigation styling
      const navigation = screen.getByRole('navigation');
      expect(navigation).not.toHaveClass('sticky', 'bottom-0');
    });

    it('should call item onClick when clicked in sidebar', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const workoutButton = screen.getByText('Workout');
      fireEvent.click(workoutButton);
      
      expect(mockHandlers.onWorkoutClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active States', () => {
    it('should highlight active navigation item', () => {
      render(<ResponsiveNavigation items={testItems} currentTab="workout" />);
      
      const workoutButtons = screen.getAllByText('Workout');
      // Check that at least one workout button has active styling
      const hasActiveButton = workoutButtons.some(button => 
        button.closest('button')?.classList.contains('text-brand-600') ||
        button.closest('button')?.classList.contains('bg-brand-50')
      );
      expect(hasActiveButton).toBe(true);
    });

    it('should call onTabChange when provided', () => {
      const onTabChange = vi.fn();
      render(
        <ResponsiveNavigation 
          items={testItems} 
          currentTab="workout" 
          onTabChange={onTabChange}
        />
      );
      
      const nutritionButtons = screen.getAllByText('Kitchen');
      fireEvent.click(nutritionButtons[0]);
      
      expect(onTabChange).toHaveBeenCalledWith('nutrition');
      expect(mockHandlers.onNutritionClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when menu is opened', async () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper touch targets', () => {
      render(<ResponsiveNavigation items={testItems} />);
      
      const hamburgerButton = screen.getByLabelText('Toggle navigation menu');
      expect(hamburgerButton).toHaveClass('touch-target');
    });
  });

  describe('Badge Support', () => {
    it('should display badges when provided', () => {
      const itemsWithBadge: NavItem[] = [
        {
          ...testItems[0],
          badge: '3',
        },
        ...testItems.slice(1),
      ];

      render(<ResponsiveNavigation items={itemsWithBadge} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    it('should disable navigation items when disabled prop is true', () => {
      const itemsWithDisabled: NavItem[] = [
        {
          ...testItems[0],
          disabled: true,
        },
        ...testItems.slice(1),
      ];

      render(<ResponsiveNavigation items={itemsWithDisabled} />);
      
      const workoutButtons = screen.getAllByText('Workout');
      const disabledButton = workoutButtons.find(button => 
        button.closest('button')?.disabled
      );
      expect(disabledButton).toBeTruthy();
    });
  });
});

describe('useNavigationItems', () => {
  const mockHandlers = {
    onWorkoutClick: vi.fn(),
    onNutritionClick: vi.fn(),
    onHistoryClick: vi.fn(),
    onCalendarClick: vi.fn(),
  };

  it('should create navigation items with correct properties', () => {
    const items = useNavigationItems('workout', mockHandlers);
    
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      onClick: mockHandlers.onWorkoutClick,
      isActive: true,
    });
    expect(items[1]).toEqual({
      id: 'nutrition',
      label: 'Kitchen',
      icon: Utensils,
      onClick: mockHandlers.onNutritionClick,
      isActive: false,
    });
  });

  it('should include optional items when handlers are provided', () => {
    const handlersWithOptional = {
      ...mockHandlers,
      onSettingsClick: vi.fn(),
      onProfileClick: vi.fn(),
    };

    const items = useNavigationItems('workout', handlersWithOptional);
    
    expect(items).toHaveLength(6);
    expect(items[4].id).toBe('settings');
    expect(items[5].id).toBe('profile');
  });
});