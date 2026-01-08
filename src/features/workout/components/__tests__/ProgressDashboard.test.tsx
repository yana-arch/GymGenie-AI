import { render, screen } from '@testing-library/react';
import { expect, vi, describe, it, beforeEach } from 'vitest';
import ProgressDashboard from '../ProgressDashboard';
import { useApp } from '@/context/AppContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { WorkoutHistoryEntry, SessionState, WorkoutExercise } from '@/types';
import React from 'react';

// Mock dependencies
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('@/hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(),
}));

// Mock Recharts to avoid rendering issues in test environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

describe('ProgressDashboard', () => {
  const mockGetSessionState = vi.fn(() => SessionState.INACTIVE);
  const mockCurrentPlan = {
    id: 'plan-1',
    weeks: [
      {
        id: 'week-1',
        weekNumber: 1,
        days: [
          { id: 'day-1', dayName: 'Monday', title: 'Upper Body', isRestDay: false, exercises: [] as WorkoutExercise[] },
          { id: 'day-2', dayName: 'Tuesday', title: 'Rest', isRestDay: true, exercises: [] as WorkoutExercise[] },
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useBreakpoint as any).mockReturnValue({
      isDesktop: () => true,
      isMobile: () => false,
      isTablet: () => false,
    });
  });

  const generateHistory = (count: number): WorkoutHistoryEntry[] => {
    const history: WorkoutHistoryEntry[] = [];
    for (let i = 0; i < count; i++) {
      history.push({
        id: `h-${i}`,
        completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        planTitle: 'Test Plan',
        weekNumber: 1,
        dayName: 'Monday',
        dayTitle: 'Upper Body',
        exercisesCompleted: 5,
        totalExercises: 5,
        durationMinutes: 45,
        syncStatus: 'synced',
      });
    }
    return history;
  };

  it('renders correctly with empty history', () => {
    (useApp as any).mockReturnValue({
      history: [],
      currentPlan: mockCurrentPlan,
      getSessionState: mockGetSessionState,
    });

    render(<ProgressDashboard />);
    expect(screen.getByText(/Start Your Journey!/i)).toBeInTheDocument();
  });

  it('renders correctly with small history', () => {
    const history = generateHistory(5);
    (useApp as any).mockReturnValue({
      history,
      currentPlan: mockCurrentPlan,
      getSessionState: mockGetSessionState,
    });

    render(<ProgressDashboard />);
    expect(screen.getByText(/Recent History/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // totalWorkouts
  });

  it('SC-2.2.1: handles large history without lagging/crashing', () => {
    const history = generateHistory(500); // Large history
    (useApp as any).mockReturnValue({
      history,
      currentPlan: mockCurrentPlan,
      getSessionState: mockGetSessionState,
    });

    const startTime = performance.now();
    render(<ProgressDashboard />);
    const endTime = performance.now();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(endTime - startTime).toBeLessThan(1000); // 1s is generous for 500 entries
  });
});
