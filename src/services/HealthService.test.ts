import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './HealthService';
import { Network } from '@capacitor/network';

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(),
    addListener: vi.fn(),
  },
}));

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    HealthService['instance'] = undefined;
  });

  it('should detect offline status @smoke', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: false, connectionType: 'none' });
    const healthService = HealthService.getInstance();
    await healthService.initialize();
    
    expect(healthService.isOnline()).toBe(false);
  });

  it('should detect online status @smoke', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: true, connectionType: 'wifi' });
    const healthService = HealthService.getInstance();
    await healthService.initialize();
    
    expect(healthService.isOnline()).toBe(true);
  });
});
