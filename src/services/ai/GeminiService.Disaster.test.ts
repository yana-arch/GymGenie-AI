import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from './GeminiService';
import { healthService } from '../HealthService';
import { Network } from '@capacitor/network';

// We need to mock the internal AI client since we can't easily mock the constructor's return
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: vi.fn(),
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: { ARRAY: 'ARRAY', STRING: 'STRING', OBJECT: 'OBJECT', INTEGER: 'INTEGER' },
    Schema: {},
  };
});

describe('GeminiService Disaster Simulation', () => {
  let service: GeminiService;
  let mockGenerateContent: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // @ts-ignore - reset singleton
    GeminiService.instance = undefined;
    
    // Reset HealthService before service creation
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: true, connectionType: 'wifi' });
    healthService.setServiceStatus('available', null);
    await healthService.initialize();

    service = GeminiService.getInstance();
    // @ts-ignore
    mockGenerateContent = service.ai.models.generateContent;
  });

  it('should open circuit after 3 failures @smoke', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    // Failure 1
    await service.identifyEquipment('test');
    expect(healthService.getStatus().status).toBe('available');

    // Failure 2
    await service.identifyEquipment('test');
    expect(healthService.getStatus().status).toBe('available');

    // Failure 3 - Should open circuit
    await service.identifyEquipment('test');
    expect(healthService.getStatus().status).toBe('degraded');
    expect(healthService.getStatus().reason).toBe('api');

    // Subsequent call should be blocked immediately
    const result = await service.identifyEquipment('test');
    expect(result).toEqual([]);
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('should block calls when offline @smoke', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: false, connectionType: 'none' });
    await healthService.initialize();
    
    expect(healthService.isOnline()).toBe(false);
    
    const result = await service.identifyEquipment('test');
    expect(result).toEqual([]);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should recover after timeout and success @smoke', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('API Error'));

    // Force open circuit
    for (let i = 0; i < 3; i++) await service.identifyEquipment('test');
    expect(healthService.getStatus().status).toBe('degraded');

    // Wait for timeout (30s)
    vi.advanceTimersByTime(31000);
    
    // Circuit should be HALF_OPEN, allowing one call
    mockGenerateContent.mockResolvedValue({ text: '["Dumbbells"]' });
    const result = await service.identifyEquipment('test');
    
    expect(result).toEqual(['Dumbbells']);
    expect(healthService.getStatus().status).toBe('available');
    
    vi.useRealTimers();
  });
});
