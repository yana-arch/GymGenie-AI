import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineRequestQueue } from '../services/OfflineRequestQueue';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

let offlineRequestQueue: OfflineRequestQueue;

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  offlineRequestQueue = new OfflineRequestQueue(true); // manual trigger
});

test('should queue a request when offline', async () => {
  offlineRequestQueue.isOnline = false;
  await offlineRequestQueue.queueRequest('/api/test', { method: 'POST' });
  
  const storedQueue = JSON.parse(localStorage.getItem('offlineQueue')!);
  expect(storedQueue).toHaveLength(1);
  expect(storedQueue[0].url).toBe('/api/test');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('should process the queue when coming online', async () => {
  // Queue a request while offline
  offlineRequestQueue.isOnline = false;
  await offlineRequestQueue.queueRequest('/api/test', { method: 'POST', body: 'test' });
  expect(global.fetch).not.toHaveBeenCalled();

  // Go online and trigger processing
  offlineRequestQueue.isOnline = true;
  (global.fetch as any).mockResolvedValueOnce({ ok: true });
  await offlineRequestQueue.processQueue();

  expect(global.fetch).toHaveBeenCalledWith('/api/test', { method: 'POST', body: 'test' });
  const storedQueue = JSON.parse(localStorage.getItem('offlineQueue')!);
  expect(storedQueue).toHaveLength(0);
});

test('should re-queue a request if it fails after coming online', async () => {
  offlineRequestQueue.isOnline = false;
  await offlineRequestQueue.queueRequest('/api/failure', { method: 'POST' });

  // Simulate failure when processing
  offlineRequestQueue.isOnline = true;
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
  await offlineRequestQueue.processQueue();
  
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const storedQueue = JSON.parse(localStorage.getItem('offlineQueue')!);
  expect(storedQueue).toHaveLength(1);
});
