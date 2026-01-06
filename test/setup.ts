import '@testing-library/jest-dom';
import { vi } from 'vitest';

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