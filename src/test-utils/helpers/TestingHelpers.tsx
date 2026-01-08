import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { EnhancedUserProfile } from '../../types/enhanced';
import { vi } from 'vitest';

/**
 * Mock store configuration for testing
 */
export function createMockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      test: (state = {}) => state,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

/**
 * Test wrapper with Redux Provider
 */
interface AllTheProvidersProps {
  children: ReactNode;
  store?: any;
  user?: EnhancedUserProfile;
}

export function AllTheProviders({ children, store, user }: AllTheProvidersProps) {
  const mockStore = store || createMockStore({ user });
  
  return <Provider store={mockStore}>{children}</Provider>;
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: any = {}
) {
  const {
    preloadedState = {},
    store = createMockStore(preloadedState),
    user,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return <AllTheProviders store={store} user={user}>{children}</AllTheProviders>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Wait for a specified amount of time
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock console methods
 */
export function mockConsole() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // Mock console methods immediately
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();

  // Return cleanup function to restore originals
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  };
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = vi.fn();
  const mockReturnValue = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  mockIntersectionObserver.mockReturnValue(mockReturnValue);
  
  (window as any).IntersectionObserver = mockIntersectionObserver;

  return () => {
    delete (window as any).IntersectionObserver;
  };
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver() {
  const mockResizeObserver = vi.fn();
  const mockReturnValue = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  mockResizeObserver.mockReturnValue(mockReturnValue);
  
  (window as any).ResizeObserver = mockResizeObserver;

  return () => {
    delete (window as any).ResizeObserver;
  };
}

/**
 * Setup common mocks for component tests
 */
export function setupComponentMocks() {
  const cleanupConsole = mockConsole();
  const cleanupIntersection = mockIntersectionObserver();
  const cleanupResize = mockResizeObserver();

  return () => {
    cleanupConsole();
    cleanupIntersection();
    cleanupResize();
  };
}

/**
 * Mock localStorage
 */
export function createMockLocalStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    __store: store,
  };
}

/**
 * Setup localStorage mock
 */
export function mockLocalStorage() {
  const mockStorage = createMockLocalStorage();
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  vi.restoreAllMocks();
}

/**
 * Create a mock function
 */
export function createMockFn<T extends (...args: any[]) => any>(implementation?: T) {
  return vi.fn(implementation) as T;
}