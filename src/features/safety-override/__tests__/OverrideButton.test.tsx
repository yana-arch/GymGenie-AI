import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OverrideButton } from '../components/OverrideButton';
import type { AIRecommendation } from '../services/OverrideDetectionService';

// Mock the OverrideDetectionService
vi.mock('../services/OverrideDetectionService', () => ({
  OverrideDetectionService: vi.fn().mockImplementation(() => ({
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    detectOverride: vi.fn(),
    getState: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('OverrideButton', () => {
  const mockRecommendation: AIRecommendation = {
    id: 'test-rec-1',
    type: 'exercise_modification',
    exerciseName: 'Squats',
    originalReps: 12,
    suggestedReps: 10,
    originalSets: 3,
    suggestedSets: 3,
    reasoning: 'Reduce reps to maintain form while tired',
    timestamp: Date.now(),
    context: {
      energyLevel: 'tired',
      timeRemaining: 15,
      equipmentAvailable: ['bodyweight']
    }
  };

  const defaultProps = {
    recommendation: mockRecommendation,
    onOverride: vi.fn(),
    disabled: false,
    variant: 'primary' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the override button with correct text', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Override AI recommendation');
    });

    it('should render with secondary variant when specified', () => {
      render(<OverrideButton {...defaultProps} variant="secondary" />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toHaveClass('bg-gray-100', 'hover:bg-gray-200');
    });

    it('should render with primary variant by default', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toHaveClass('bg-red-500', 'hover:bg-red-600');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<OverrideButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should show loading state when loading prop is true', () => {
      render(<OverrideButton {...defaultProps} loading={true} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-75');
      
      // Check for loading spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display recommendation info in tooltip', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        const tooltip = screen.getByText(/Reduce reps to maintain form while tired/);
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('interaction', () => {
    it('should call onOverride when button is clicked', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(defaultProps.onOverride).toHaveBeenCalledWith(mockRecommendation);
      });
    });

    it('should not call onOverride when button is disabled', async () => {
      render(<OverrideButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.click(button);
      
      expect(defaultProps.onOverride).not.toHaveBeenCalled();
    });

    it('should show visual feedback on click', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveClass('scale-95');
      });
      
      await waitFor(() => {
        expect(button).not.toHaveClass('scale-95');
      }, { timeout: 200 });
    });

    it('should handle keyboard interaction', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(defaultProps.onOverride).toHaveBeenCalledWith(mockRecommendation);
      });
    });

    it('should handle space key interaction', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(defaultProps.onOverride).toHaveBeenCalledWith(mockRecommendation);
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      expect(button).toHaveAttribute('aria-label', 'Override AI recommendation');
      // tooltip is only shown on hover, so no aria-describedby initially
    });

    it('should announce override action to screen readers', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('AI recommendation overridden');
      });
    });

    it('should have proper focus management', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('performance', () => {
    it('should render within performance requirements', () => {
      const startTime = performance.now();
      
      render(<OverrideButton {...defaultProps} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });

    it('should handle rapid clicks without errors', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      
      // Rapid click simulation - should only handle first click due to state protection
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }
      
      await waitFor(() => {
        expect(defaultProps.onOverride).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('visual feedback', () => {
    it('should show hover state', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.mouseEnter(button);
      
      expect(button).toHaveClass('hover:scale-105');
    });

    it('should show active state on click', () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.mouseDown(button);
      
      expect(button).toHaveClass('active:scale-95');
    });

it('should show visual confirmation after override', async () => {
      render(<OverrideButton {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /override/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        // Look for check mark icon (Check component) by SVG element
        const checkIcon = screen.getByText('Overridden');
        expect(checkIcon).toBeInTheDocument();
        
        // Check that the check icon is present by looking for the lucide-check class
        const svgIcon = document.querySelector('.lucide-check');
        expect(svgIcon).toBeInTheDocument();
      });
    });
  });
});