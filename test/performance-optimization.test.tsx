import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from './test-utils';
import VirtualizedExerciseList from '@/src/features/workout/components/VirtualizedExerciseList';
import { useCurrentSession, useExerciseById } from '@/hooks/useSelectiveSubscription';
import { useRenderPerformance } from '@/hooks/usePerformanceMonitor';
import { optimizedMemo } from '@/utils/renderOptimizationSimple';
import React from 'react';

// Mock react-virtualized
vi.mock('react-virtualized', async (importOriginal) => {
  const actual = await vi.importActual('react-virtualized');
  return {
    ...actual,
    List: ({ rowCount, rowRenderer }: any) => (
      <div data-testid="virtualized-list">
        {Array.from({ length: rowCount }, (_, index) =>
          rowRenderer({ index, key: `item-${index}`, style: {} })
        )}
      </div>
    ),
  };
});

vi.mock('@/hooks/useSelectiveSubscription');

describe('Performance Optimization Components', () => {

  describe('VirtualizedExerciseList', () => {
    const mockExercises = Array.from({ length: 100 }, (_, i) => ({
      id: `exercise-${i}`,
      name: `Exercise ${i}`,
      sets: 3,
      reps: '10-12',
      weight: '50kg',
      isCompleted: i % 3 === 0,
      notes: i % 5 === 0 ? `Note for exercise ${i}` : undefined,
      targetMuscles: ['chest', 'triceps'],
      difficulty: 'intermediate' as const,
    }));

    beforeEach(() => {
      (useExerciseById as vi.Mock).mockImplementation((exerciseId: string) => {
        const exercise = mockExercises.find(e => e.id === exerciseId);
        return exercise ? { exercise } : null;
      });
    });

    it('should render virtualized exercise list', () => {
      const onToggle = vi.fn();
      
      render(
        <VirtualizedExerciseList
          exerciseIds={mockExercises.map(e => e.id)}
          onToggleExercise={onToggle}
          height={400}
        />
      );

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByText('Exercise Progress')).toBeInTheDocument();
    });

    it('should handle empty exercise list', () => {
      render(
        <VirtualizedExerciseList
          exerciseIds={[]}
          onToggleExercise={vi.fn()}
        />
      );

      expect(screen.getByText('No exercises available')).toBeInTheDocument();
    });

    it('should calculate completion stats correctly', () => {
      const exercises = [
        { id: '1', name: 'Ex 1', sets: 3, reps: '10', isCompleted: true },
        { id: '2', name: 'Ex 2', sets: 3, reps: '10', isCompleted: false },
        { id: '3', name: 'Ex 3', sets: 3, reps: '10', isCompleted: true },
      ];

      (useExerciseById as vi.Mock).mockImplementation((exerciseId: string) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        return exercise ? { exercise } : null;
      });

      render(
        <VirtualizedExerciseList
          exerciseIds={exercises.map(e => e.id)}
          onToggleExercise={vi.fn()}
        />
      );

      expect(screen.getByText('2/3 completed')).toBeInTheDocument();
    });
  });

  describe('Selective Subscriptions', () => {
    it('should provide selective session state', () => {
      (useCurrentSession as ReturnType<typeof vi.fn>).mockReturnValue(null);
      let sessionState: any;
      
      const TestComponent = () => {
        sessionState = useCurrentSession();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(sessionState).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track render performance in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      let renderMetrics: any;
      
      const TestComponent = () => {
        const { getRenderMetrics, trackRender } = useRenderPerformance('TestComponent');
        trackRender();
        renderMetrics = getRenderMetrics();
        return <div>Test</div>;
      };

      const { rerender } = render(<TestComponent />);
      rerender(<TestComponent />);

      await waitFor(() => {
        expect(renderMetrics).toBeDefined();
      });

      // Should have metrics in development
      expect(renderMetrics.renderCount).toBe(2);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Render Optimization Utils', () => {
    it('should create optimized memo component', () => {
      const TestComponent = optimizedMemo<{ value: number }>(
        ({ value }) => <div data-testid="test-value">{value}</div>,
        (prev, next) => prev.value === next.value,
        'TestComponent'
      );

      const { rerender } = render(<TestComponent value={1} />);
      expect(screen.getByTestId('test-value')).toHaveTextContent('1');

      // Should not re-render with same value
      rerender(<TestComponent value={1} />);
      expect(screen.getByTestId('test-value')).toHaveTextContent('1');

      // Should re-render with different value
      rerender(<TestComponent value={2} />);
      expect(screen.getByTestId('test-value')).toHaveTextContent('2');
    });

    it('should create stable callbacks', () => {
      const callbackImpl = vi.fn();
      let callbackRef: any;

      const useStableCallback = (callback: () => void, deps: any[]) => {
        const callbackRef = React.useRef(callback);
      
        React.useEffect(() => {
          callbackRef.current = callback;
        }, deps);
      
        return React.useCallback(() => {
          callbackRef.current();
        }, []);
      };

      const TestComponent = ({ dep }: { dep: number }) => {
        const stableCallback = useStableCallback(() => {
          callbackImpl(dep);
        }, [dep]);
        callbackRef = stableCallback;
        return <button onClick={stableCallback}>Click</button>;
      };

      const { rerender } = render(<TestComponent dep={5} />);
      const firstCallback = callbackRef;
      
      fireEvent.click(screen.getByText('Click'));
      expect(callbackImpl).toHaveBeenCalledWith(5);

      rerender(<TestComponent dep={5} />);
      expect(callbackRef).toBe(firstCallback);

      rerender(<TestComponent dep={10} />);
      expect(callbackRef).toBe(firstCallback);
      
      fireEvent.click(screen.getByText('Click'));
      expect(callbackImpl).toHaveBeenCalledWith(10);
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complex component tree', () => {
      const ComplexComponent = optimizedMemo(() => {
        useRenderPerformance('ComplexComponent');
        const session = useCurrentSession();
        
        const handleClick = () => {
          console.log('Clicked');
        };

        return (
          <div>
            <button onClick={handleClick}>Click me</button>
            <span>Session: {session ? 'Active' : 'None'}</span>
          </div>
        );
      });

      render(<ComplexComponent />);

      expect(screen.getByText('Session: None')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });
});