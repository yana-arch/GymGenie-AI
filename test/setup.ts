import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';

// Polyfill crypto for jsdom
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

// Polyfill btoa/atob for Node environment
if (typeof btoa === 'undefined') {
  (global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
  (global as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Polyfill matchMedia for Mantine
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

const mockExerciseIndex: any[] = [];

// Mock the global fetch function
global.fetch = vi.fn().mockImplementation((url) => {
  const urlString = url.toString();

  if (urlString.endsWith('/data/exercises.index.json')) {
    return Promise.resolve(new Response(JSON.stringify(mockExerciseIndex), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }
  
  return Promise.reject(new Error(`Unhandled request: ${urlString}`));
});

// Mock Capacitor Network
vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn().mockResolvedValue({ connected: true, connectionType: 'wifi' }),
    addListener: vi.fn().mockImplementation((event, callback) => {
      return { remove: vi.fn() };
    }),
  },
}));
