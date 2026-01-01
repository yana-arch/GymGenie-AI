import { test, expect, vi } from 'vitest';
import { CommonRecoveryStrategies } from '../services/error-handling';

test('retryWithBackoff should retry a failing operation multiple times', async () => {
  const failingOperation = vi.fn()
    .mockRejectedValueOnce(new Error('Network failure'))
    .mockRejectedValueOnce(new Error('Network failure'))
    .mockResolvedValueOnce('Success');

  const strategy = CommonRecoveryStrategies.retryWithBackoff(failingOperation, 3);
  const result = await strategy.execute();

  expect(result).toBe(true);
  expect(failingOperation).toHaveBeenCalledTimes(3);
});

test('retryWithBackoff should fail after max retries', async () => {
  const failingOperation = vi.fn(() => Promise.reject(new Error('Persistent failure')));

  const strategy = CommonRecoveryStrategies.retryWithBackoff(failingOperation, 3);
  
  await expect(strategy.execute()).rejects.toThrow('Persistent failure');
  expect(failingOperation).toHaveBeenCalledTimes(3);
});
