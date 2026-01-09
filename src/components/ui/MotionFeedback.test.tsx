import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MotionFeedback } from './MotionFeedback';
import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('MotionFeedback Component', () => {
  beforeAll(() => {
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
  });

  it('renders children when visible @p2', () => {
    render(
      <MantineProvider>
        <MotionFeedback visible={true}>
          <div data-testid="child">Test Child</div>
        </MotionFeedback>
      </MantineProvider>
    );
    
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('applies pulse animation when type is pulse @p2', () => {
    const { container } = render(
      <MantineProvider>
        <MotionFeedback visible={true} type="pulse">
          <div>Test Child</div>
        </MotionFeedback>
      </MantineProvider>
    );
    
    const pulseElement = container.querySelector('.animate-pulse');
    expect(pulseElement).toBeDefined();
  });

  it('applies glow effect when type is glow @p2', () => {
    const { container } = render(
      <MantineProvider>
        <MotionFeedback visible={true} type="glow">
          <div>Test Child</div>
        </MotionFeedback>
      </MantineProvider>
    );
    
    const glowElement = container.querySelector('.shadow-\\[0_0_20px_rgba\\(249\\,115\\,22\\,0\\.4\\)\\]');
    expect(glowElement).toBeDefined();
  });
});
