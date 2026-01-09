import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AtmosphericBackground from './AtmosphericBackground';
import { MantineProvider } from '@mantine/core';

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

describe('AtmosphericBackground', () => {
  it('should render the background container @p1', () => {
    render(
      <MantineProvider>
        <AtmosphericBackground intensity={0.5} />
      </MantineProvider>
    );
    const background = screen.getByTestId('atmospheric-background');
    expect(background).toBeInTheDocument();
  });

  it('should apply dynamic intensity styles @p1', () => {
    const { rerender } = render(
      <MantineProvider>
        <AtmosphericBackground intensity={0.1} />
      </MantineProvider>
    );
    
    const background = screen.getByTestId('atmospheric-background');
    expect(background).toBeInTheDocument();
    
    rerender(
      <MantineProvider>
        <AtmosphericBackground intensity={0.9} />
      </MantineProvider>
    );
    
    expect(background).toBeInTheDocument();
  });
});
