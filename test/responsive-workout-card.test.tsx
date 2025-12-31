import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponsiveWorkoutCard, { ResponsiveWorkoutCardList, Exercise } from '../components/ResponsiveWorkoutCard';

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

describe('ResponsiveWorkoutCard', () => {
  const mockExercise: Exercise = {
    id: 'exercise-1',
    name: 'Push-ups',
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    notes: 'Keep your core tight',
    isCompleted: false,
  };

  const mockHandlers = {
    onToggle: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onSwap: vi.fn(),
    onViewDetails: vi.fn(),
  };

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

  describe('Mobile Layout', () => {
    it('should render exercise information correctly', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('3 Sets')).toBeInTheDocument();
      expect(screen.getByText('10-12 Reps')).toBeInTheDocument();
      expect(screen.getByText('60s Rest')).toBeInTheDocument();
      expect(screen.getByText('Keep your core tight')).toBeInTheDocument();
    });

    it('should show uncompleted state by default', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      // Should show empty circle for uncompleted exercise - get the first button (checkbox)
      const buttons = screen.getAllByRole('button');
      const checkbox = buttons[0]; // First button is the checkbox
      expect(checkbox).toBeInTheDocument();
      expect(screen.queryByTestId('check-circle')).not.toBeInTheDocument();
    });

    it('should show completed state when exercise is completed', () => {
      const completedExercise = { ...mockExercise, isCompleted: true };
      
      render(
        <ResponsiveWorkoutCard
          exercise={completedExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      // Exercise name should have line-through styling
      const exerciseName = screen.getByText('Push-ups');
      expect(exerciseName).toHaveClass('line-through');
    });

    it('should call onToggle when exercise is clicked', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      const exerciseName = screen.getByText('Push-ups');
      fireEvent.click(exerciseName);

      expect(mockHandlers.onToggle).toHaveBeenCalledWith('exercise-1');
    });

    it('should call onSwap when swap button is clicked', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      const swapButton = screen.getByTitle('Swap for alternative');
      fireEvent.click(swapButton);

      expect(mockHandlers.onSwap).toHaveBeenCalledWith('exercise-1', 'Push-ups');
    });

    it('should call onViewDetails when info button is clicked', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      const infoButton = screen.getByTitle('View instructions');
      fireEvent.click(infoButton);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('Push-ups');
    });

    it('should show reorder controls when in reordering mode', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={1}
          totalExercises={3}
          isReordering={true}
          {...mockHandlers}
        />
      );

      // Should show up and down arrows
      const upButton = screen.getByRole('button', { name: /up/i });
      const downButton = screen.getByRole('button', { name: /down/i });
      
      expect(upButton).toBeInTheDocument();
      expect(downButton).toBeInTheDocument();
    });

    it('should disable up button for first exercise in reorder mode', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          isReordering={true}
          {...mockHandlers}
        />
      );

      const upButton = screen.getByRole('button', { name: /up/i });
      expect(upButton).toBeDisabled();
    });

    it('should disable down button for last exercise in reorder mode', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={2}
          totalExercises={3}
          isReordering={true}
          {...mockHandlers}
        />
      );

      const downButton = screen.getByRole('button', { name: /down/i });
      expect(downButton).toBeDisabled();
    });

    it('should show loading state when swapping', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          isSwapping={true}
          {...mockHandlers}
        />
      );

      // Should show loading spinner - look for the Loader2 component
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when in read-only mode', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          isReadOnly={true}
          {...mockHandlers}
        />
      );

      const swapButton = screen.getByTitle('Cannot modify logged workout');
      expect(swapButton).toBeDisabled();
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      mockBreakpoint.isMobile.mockReturnValue(false);
      mockBreakpoint.isTablet.mockReturnValue(true);
      mockBreakpoint.getCurrentBreakpoint.mockReturnValue('tablet');
    });

    it('should render in tablet layout', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('3 Sets')).toBeInTheDocument();
    });

    it('should have compact styling for tablet', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      // Tablet layout should have different padding - look for the main card container
      const cardContainer = document.querySelector('[data-component="workout-card"] > div');
      expect(cardContainer).toHaveClass('p-5'); // Tablet specific padding
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockBreakpoint.isMobile.mockReturnValue(false);
      mockBreakpoint.isTablet.mockReturnValue(false);
      mockBreakpoint.isDesktop.mockReturnValue(true);
      mockBreakpoint.getCurrentBreakpoint.mockReturnValue('desktop');
    });

    it('should render in desktop layout', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('3 Sets')).toBeInTheDocument();
    });

    it('should have enhanced styling for desktop', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      // Desktop layout should have more padding - look for the main card container
      const cardContainer = document.querySelector('[data-component="workout-card"] > div');
      expect(cardContainer).toHaveClass('p-6'); // Desktop specific padding
    });
  });

  describe('Touch Targets', () => {
    it('should have proper touch targets on mobile', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      // Look for the main card container with touch-target class
      const cardContainer = document.querySelector('[data-component="workout-card"] > div');
      expect(cardContainer).toHaveClass('touch-target');
    });

    it('should have touch-friendly buttons', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      const swapButton = screen.getByTitle('Swap for alternative');
      const infoButton = screen.getByTitle('View instructions');
      
      expect(swapButton).toHaveClass('touch-target');
      expect(infoButton).toHaveClass('touch-target');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          {...mockHandlers}
        />
      );

      expect(screen.getByTitle('Swap for alternative')).toBeInTheDocument();
      expect(screen.getByTitle('View instructions')).toBeInTheDocument();
    });

    it('should show appropriate title when read-only', () => {
      render(
        <ResponsiveWorkoutCard
          exercise={mockExercise}
          index={0}
          totalExercises={3}
          isReadOnly={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByTitle('Cannot modify logged workout')).toBeInTheDocument();
    });
  });
});

describe('ResponsiveWorkoutCardList', () => {
  const mockExercises: Exercise[] = [
    {
      id: 'exercise-1',
      name: 'Push-ups',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      isCompleted: false,
    },
    {
      id: 'exercise-2',
      name: 'Squats',
      sets: 3,
      reps: '15-20',
      restSeconds: 90,
      isCompleted: true,
    },
  ];

  const mockHandlers = {
    onToggle: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onSwap: vi.fn(),
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBreakpoint.isMobile.mockReturnValue(true);
    mockBreakpoint.isTablet.mockReturnValue(false);
    mockBreakpoint.isDesktop.mockReturnValue(false);
    mockBreakpoint.isLargeDesktop.mockReturnValue(false);
  });

  it('should render all exercises', () => {
    render(
      <ResponsiveWorkoutCardList
        exercises={mockExercises}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();
  });

  it('should use mobile layout classes by default', () => {
    render(
      <ResponsiveWorkoutCardList
        exercises={mockExercises}
        {...mockHandlers}
      />
    );

    const container = screen.getByText('Push-ups').closest('[data-component="workout-card-list"]');
    expect(container).toHaveClass('space-y-4', 'flex-1');
  });

  it('should use tablet grid layout on tablet', () => {
    mockBreakpoint.isMobile.mockReturnValue(false);
    mockBreakpoint.isTablet.mockReturnValue(true);
    mockBreakpoint.getCurrentBreakpoint.mockReturnValue('tablet');

    render(
      <ResponsiveWorkoutCardList
        exercises={mockExercises}
        {...mockHandlers}
      />
    );

    const container = screen.getByText('Push-ups').closest('[data-component="workout-card-list"]');
    expect(container).toHaveClass('grid', 'grid-cols-2', 'gap-6');
  });

  it('should pass props to individual cards', () => {
    render(
      <ResponsiveWorkoutCardList
        exercises={mockExercises}
        isReordering={true}
        {...mockHandlers}
      />
    );

    // Should show reorder controls
    expect(screen.getAllByRole('button', { name: /up/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /down/i })).toHaveLength(2);
  });

  it('should handle empty exercise list', () => {
    render(
      <ResponsiveWorkoutCardList
        exercises={[]}
        {...mockHandlers}
      />
    );

    const container = document.querySelector('[data-component="workout-card-list"]');
    expect(container).toBeInTheDocument();
    expect(container?.children).toHaveLength(0);
  });
});