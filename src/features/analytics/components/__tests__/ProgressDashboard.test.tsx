import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../../test/test-utils';
import ProgressDashboard from '../ProgressDashboard';

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

// Mock Recharts since it doesn't work well in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div>Line</div>,
  Bar: () => <div>Bar</div>,
  Area: () => <div>Area</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
}));

describe('ProgressDashboard', () => {
  const preloadedState = {
    workout: {
      history: [
        {
          id: '1',
          completedAt: new Date().toISOString(),
          planTitle: 'Test Plan',
          weekNumber: 1,
          dayName: 'Monday',
          dayTitle: 'Test Day',
          exercisesCompleted: 5,
          totalExercises: 5,
          durationMinutes: 60,
          syncStatus: 'synced' as const
        }
      ]
    },
    session: {
      sessions: {
        '1-1': {
          id: 's1',
          weekId: '1',
          dayId: '1',
          startTime: Date.now(),
          exerciseData: {
            'bench-press': {
              exerciseId: 'bench-press',
              sets: [{ weight: 60, reps: 10 }]
            }
          }
        }
      },
      currentSession: null as any
    },
    achievement: {
      earnedAchievements: [] as any[],
      recentAchievementIds: [] as string[]
    }
  };

  it('renders the dashboard title @smoke', () => {
    render(<ProgressDashboard />, { preloadedState: preloadedState as any });
    expect(screen.getByText(/Fitness Analytics/i)).toBeDefined();
  });

  it('displays summary cards with data @p0', () => {
    render(<ProgressDashboard />, { preloadedState: preloadedState as any });
    expect(screen.getByText('Total Workouts')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined(); // Workouts count
    expect(screen.getAllByText('60m').length).toBeGreaterThanOrEqual(1); // Total time and Avg duration
  });

  it('renders all charts @p1', () => {
    render(<ProgressDashboard />, { preloadedState: preloadedState as any });
    expect(screen.getByTestId('line-chart')).toBeDefined();
    expect(screen.getByTestId('bar-chart')).toBeDefined();
    expect(screen.getByTestId('area-chart')).toBeDefined();
  });

  it('renders empty state when no history exists @p2', () => {
    const emptyState = {
      workout: { history: [] as any[] },
      session: { sessions: {} },
      achievement: {
        earnedAchievements: [] as any[],
        recentAchievementIds: [] as string[]
      }
    };
    render(<ProgressDashboard />, { preloadedState: emptyState as any });
    expect(screen.getByText(/No Progress Data Yet/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Start a Workout/i })).toBeDefined();
  });
});
