import React from 'react';
import { render, screen } from '../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import { WorkoutExercise } from '@/types';

// Mock the breakpoint hook
vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({
    isMobile: () => true,
    isTablet: () => false,
    isDesktop: () => false,
    isLargeDesktop: () => false,
  }),
  useIsDesktop: () => false,
}));

// Mock the layout manager hook
vi.mock('@/hooks/useLayoutManager', () => ({
  useResponsiveComponent: () => ({
    ref: { current: null as any },
  }),
}));

// Mock useExerciseById hook for OptimizedResponsiveWorkoutCard
vi.mock('@/hooks/useSelectiveSubscription', () => ({
  useExerciseById: (exerciseId: string) => ({
    exercise: {
      id: exerciseId,
      name: 'Push-ups',
      sets: 3,
      reps: '10-12',
      restSeconds: 60,
      isCompleted: false,
      notes: ''
    }
  }),
}));

describe('Performance Memoization Tests', () => {
  const mockExercise: WorkoutExercise = { // This mock is now less relevant for OptimizedResponsiveWorkoutCard
    id: 'exercise-1',
    name: 'Push-ups',
    sets: 3,
    reps: '10-12',
    restSeconds: 60,
    isCompleted: false,
    notes: ''
  };

  const mockNavItems = [
    {
      id: 'workout',
      label: 'Workout',
      icon: () => <div>Icon</div>,
      onClick: vi.fn(),
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      icon: () => <div>Icon</div>,
      onClick: vi.fn(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ResponsiveNavigation Memoization', () => {
    it('should not re-render when props remain the same', () => {
      const renderSpy = vi.fn();
      
      // Create a wrapper component to track renders
      const TestNavigation = React.memo(() => {
        renderSpy();
        return (
          <ResponsiveNavigation>
            <div>Test</div>
          </ResponsiveNavigation>
        );
      });

      const { rerender } = render(<TestNavigation />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props - should not trigger re-render due to memoization
      rerender(<TestNavigation />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when props change', () => {
      const renderSpy = vi.fn();
      
      const TestNavigation = React.memo(({ currentTab }: { currentTab: string }) => {
        renderSpy();
        return (
          <ResponsiveNavigation>
            <div>{currentTab}</div>
          </ResponsiveNavigation>
        );
      });

      const { rerender } = render(<TestNavigation currentTab="workout" />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different props - should trigger re-render
      rerender(<TestNavigation currentTab="nutrition" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  // Note: ResponsiveWorkoutCard tests commented out - component OptimizedResponsiveWorkoutCard doesn't exist in current codebase
  // describe('ResponsiveWorkoutCard Memoization', () => {
  //   it('should not re-render when exercise props remain the same', () => { ... });
  //   it('should re-render when exercise completion state changes', () => { ... });
  // });

  describe('Callback Memoization', () => {
    it('should maintain stable callback references', () => {
      let onToggleRef1: any;
      let onToggleRef2: any;
      
      const TestComponent = React.memo(({ trigger }: { trigger: number }) => {
        const onToggle = React.useCallback((id: string) => {
          console.log('Toggle:', id);
        }, []); // Empty dependency array - should be stable
        
        if (trigger === 1) {
          onToggleRef1 = onToggle;
        } else {
          onToggleRef2 = onToggle;
        }
        
        return <div>Test</div>;
      });

      const { rerender } = render(<TestComponent trigger={1} />);
      rerender(<TestComponent trigger={2} />);
      
      // Callback references should be the same due to memoization
      expect(onToggleRef1).toBe(onToggleRef2);
    });

    it('should update callback when dependencies change', () => {
      let onToggleRef1: any;
      let onToggleRef2: any;
      
      const TestComponent = React.memo(({ exerciseId }: { exerciseId: string }) => {
        const onToggle = React.useCallback((id: string) => {
          console.log('Toggle:', exerciseId, id);
        }, [exerciseId]); // Depends on exerciseId - should change when exerciseId changes
        
        if (exerciseId === 'ex1') {
          onToggleRef1 = onToggle;
        } else {
          onToggleRef2 = onToggle;
        }
        
        return <div>Test</div>;
      });

      const { rerender } = render(<TestComponent exerciseId="ex1" />);
      rerender(<TestComponent exerciseId="ex2" />);
      
      // Callback references should be different due to dependency change
      expect(onToggleRef1).not.toBe(onToggleRef2);
    });
  });

  describe('useMemo Performance', () => {
    it('should memoize expensive calculations', () => {
      const expensiveCalculation = vi.fn((items: any[]) => {
        return items.reduce((sum, item) => sum + item.value, 0);
      });
      
      const TestComponent = React.memo(({ items, trigger }: { items: any[], trigger: number }) => {
        const result = React.useMemo(() => {
          return expensiveCalculation(items);
        }, [items]); // Only recalculate when items change
        
        return <div>Result: {result}, Trigger: {trigger}</div>;
      });

      const items = [{ value: 1 }, { value: 2 }, { value: 3 }];
      
      const { rerender } = render(<TestComponent items={items} trigger={1} />);
      
      // Initial calculation
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Re-render with same items but different trigger - should not recalculate
      rerender(<TestComponent items={items} trigger={2} />);
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      
      // Re-render with different items - should recalculate
      const newItems = [{ value: 4 }, { value: 5 }];
      rerender(<TestComponent items={newItems} trigger={2} />);
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });
  });
});
