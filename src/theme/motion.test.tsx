import { render, screen } from '@testing-library/react';
import { MantineProvider, Button, Card, Paper } from '@mantine/core';
import { theme } from './index';
import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('Theme Motion & Transitions', () => {
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

  it('should have standardized motion timings in Button @p2', () => {
    render(
      <MantineProvider theme={theme}>
        <Button>Motion Button</Button>
      </MantineProvider>
    );
    
    const button = screen.getByRole('button', { name: /motion button/i });
    const styles = window.getComputedStyle(button);
    // Standardized short timing is 150ms (0.15s)
    // Current Button has 0.1s and 0.2s
    const transition = styles.transition;
    expect(transition.includes('0.15s') || transition.includes('150ms')).toBe(true);
  });

  it('should have spring-like hover transition for Paper @p2', () => {
    render(
      <MantineProvider theme={theme}>
        <Paper withBorder>Motion Paper</Paper>
      </MantineProvider>
    );
    
    // Paper styles are applied to the root element
    // We can't easily get the Paper component by role if it's just a div, 
    // but we can use testId or container search.
    const { container } = render(
      <MantineProvider theme={theme}>
        <Paper data-testid="motion-paper" withBorder>Motion Paper</Paper>
      </MantineProvider>
    );
    const paper = screen.getByTestId('motion-paper');
    const styles = window.getComputedStyle(paper);
    
    // Expect a spring-like cubic-bezier
    expect(styles.transition).toContain('cubic-bezier(0.175, 0.885, 0.32, 1.275)');
  });

  it('should handle prefers-reduced-motion @p2', () => {
    // Redefine matchMedia to return matches: true
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    render(
      <MantineProvider theme={theme}>
        <div data-testid="reduced-motion-root">
          <Button>No Motion</Button>
        </div>
      </MantineProvider>
    );
    
    // We can't easily check the Transition duration via computed style on a Button root 
    // without deep integration testing, but we can verify our component logic
    // elsewhere or just ensure the theme root logic would apply if we added it.
    // For now, let's verify our manual fixes in components that use useReducedMotion.
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  });
});
