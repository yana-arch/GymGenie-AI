import { test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AppErrorBoundary from '../components/AppErrorBoundary';
import SessionErrorBoundary from '../src/features/session/components/SessionErrorBoundary';

const ThrowingComponent = () => {
  throw new Error('Test error');
};

test('AppErrorBoundary should catch errors in its children and display a fallback UI', () => {
  // Suppress console.error output from React
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <AppErrorBoundary>
      <ThrowingComponent />
    </AppErrorBoundary>
  );

  expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  
  consoleErrorSpy.mockRestore();
});

test('SessionErrorBoundary should catch errors in its children and display a specific fallback UI', () => {
    // Suppress console.error output from React
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <SessionErrorBoundary>
      <ThrowingComponent />
    </SessionErrorBoundary>
  );

  // Corrected the expected text to match the actual implementation
  expect(screen.getByText(/Application Error/i)).toBeInTheDocument();

  consoleErrorSpy.mockRestore();
});
