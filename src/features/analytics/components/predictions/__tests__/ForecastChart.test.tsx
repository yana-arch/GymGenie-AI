import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ForecastChart from '../ForecastChart';
import { MantineProvider } from '@mantine/core';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock recharts ResponsiveContainer to render children
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <MantineProvider>
      {ui}
    </MantineProvider>
  );
};

describe('ForecastChart', () => {
  const historicalData = [
    { date: '2026-01-01', value: 100 },
    { date: '2026-01-05', value: 110 },
  ];
  const predictionData = [
    { date: '2026-01-10', value: 120, confidenceIntervalUpper: 125, confidenceIntervalLower: 115 },
  ];

  it('renders correctly with historical and prediction data @p1', () => {
    renderWithProvider(
      <ForecastChart 
        historicalData={historicalData}
        predictionData={predictionData}
        title="Test Forecast"
        confidence="High"
      />
    );

    expect(screen.getByText('Test Forecast')).toBeDefined();
    expect(screen.getByText('High Confidence')).toBeDefined();
  });
});
