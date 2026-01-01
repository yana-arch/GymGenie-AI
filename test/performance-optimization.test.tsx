import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import sessionSlice from '@/src/features/session/store/sessionSlice';
import workoutSlice from '@/src/features/workout/store/workoutSlice';
import userSlice from '@/src/features/user/store/userSlice';
import uiSlice from '@/src/features/ui/store/uiSlice';
import VirtualizedExerciseList from '@/src/features/workout/components/VirtualizedExerciseList';
import { useCurrentSession } from '@/hooks/useSelectiveSubscription';
import { useRenderPerformance } from '@/hooks/usePerformanceMonitor';
import { optimizedMemo, useStableCallback } from '@/utils/renderOptimizationSimple';
import React from 'react';

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemSize, itemData }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => 
        children({ index, style: { height: itemSize } })
      )}
    </div>
  ),
}));

// Create test store
const createTestStore = () => configureStore({
  reducer: {
    session: sessionSlice,
    workout: workoutSlice,
    user: userSlice,
    ui: uiSlice,
  },
});

describe('Performance Optimization Components', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

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
      let sessionState: any;
      
      const TestComponent = () => {
        sessionState = useCurrentSession();
        return <div>Test</div>;
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      expect(sessionState).toBeNull(); // Initial state
    });
  });

  describe('Performance Monitoring', () => {
    it('should track render performance in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      let renderMetrics: any;
      
      const TestComponent = () => {
        const { getRenderMetrics } = useRenderPerformance('TestComponent');
        renderMetrics = getRenderMetrics();
        return <div>Test</div>;
      };

      render(<TestComponent />);
      
      // Should have metrics in development
      expect(renderMetrics).toBeDefined();
      
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
      let callbackRef: any;
      
      const TestComponent = ({ dep }: { dep: number }) => {
        const stableCallback = useStableCallback(() => dep * 2, [dep]);
        callbackRef = stableCallback;
        return <div>{stableCallback()}</div>;
      };

      const { rerender } = render(<TestComponent dep={5} />);
      const firstCallback = callbackRef;
      
      // Should return same callback reference for same deps
      rerender(<TestComponent dep={5} />);
      expect(callbackRef).toBe(firstCallback);
      
      // Should return new callback for different deps
      rerender(<TestComponent dep={10} />);
      expect(callbackRef).not.toBe(firstCallback);
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complex component tree', () => {
      const ComplexComponent = optimizedMemo(() => {
        useRenderPerformance('ComplexComponent');
        const session = useCurrentSession();
        
        const handleClick = useStableCallback(() => {
          console.log('Clicked');
        }, []);

        return (
          <div>
            <button onClick={handleClick}>Click me</button>
            <span>Session: {session ? 'Active' : 'None'}</span>
          </div>
        );
      });

      render(
        <Provider store={store}>
          <ComplexComponent />
        </Provider>
      );

      expect(screen.getByText('Session: None')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });
});