import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../../../test/test-utils';
import TrajectoryChart from '../TrajectoryChart';

// Mock matchMedia for Mantine
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

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Line: () => <div>Line</div>,
  Area: () => <div>Area</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>Grid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
}));

describe('TrajectoryChart', () => {
  const mockData = [
    { date: '2026-01-01', volume: 1000, intensity: 60, movingAvg: 950 },
    { date: '2026-01-02', volume: 1100, intensity: 65, movingAvg: 1000 },
  ];

  it('renders the chart with title and trajectory @p2', () => {
    render(
      <TrajectoryChart 
        data={mockData} 
        title="Test Trajectory" 
        trajectory="upward" 
        changePercentage={10} 
      />
    );
    
    expect(screen.getByText('Test Trajectory')).toBeDefined();
    expect(screen.getByText('+10.0%')).toBeDefined();
    expect(screen.getByTestId('composed-chart')).toBeDefined();
  });

  it('renders correctly without trajectory info @p2', () => {
    render(<TrajectoryChart data={mockData} title="Minimal Chart" />);
    expect(screen.getByText('Minimal Chart')).toBeDefined();
    expect(screen.queryByText('%')).toBeNull();
  });
});
