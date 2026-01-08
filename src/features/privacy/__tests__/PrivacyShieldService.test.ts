import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyShieldService } from '../services/PrivacyShieldService';
import { EncryptionService } from '../services/EncryptionService';

// Mock IndexedDB and Web Crypto
const mockCrypto = {
  subtle: {
    generateKey: vi.fn().mockResolvedValue({}),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
  getRandomValues: vi.fn().mockReturnValue(new Uint8Array(12)),
};

vi.stubGlobal('crypto', mockCrypto);

// Mock IndexedDB
const mockIDBRequest: any = {
  onsuccess: null,
  onerror: null,
  result: {
    createObjectStore: vi.fn(),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue({ onsuccess: null }),
        put: vi.fn().mockReturnValue({ onsuccess: null }),
      }),
    }),
  },
};

vi.stubGlobal('indexedDB', {
  open: vi.fn().mockReturnValue(mockIDBRequest),
});

describe('PrivacyShieldService', () => {
  let privacyShieldService: PrivacyShieldService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    EncryptionService.instance = null;
    encryptionService = EncryptionService.getInstance();
    privacyShieldService = new PrivacyShieldService(encryptionService);
  });

  it('should identify sensitive data based on PII patterns', () => {
    const sensitiveData = {
      userId: '123',
      email: 'test@example.com',
      heartRate: 80,
      injuryHistory: 'Back pain'
    };

    const regularData = {
      exerciseType: 'Squats',
      duration: 300,
      calories: 150
    };

    expect(privacyShieldService.isSensitive(sensitiveData)).toBe(true);
    expect(privacyShieldService.isSensitive(regularData)).toBe(false);
  });

  it('should sanitize data before sending to external services', () => {
    const data = {
      userId: '123',
      email: 'test@example.com',
      exerciseType: 'Squats',
      location: { lat: 45.0, lng: -73.0 }
    };

    const sanitized = privacyShieldService.sanitizeForExternalUse(data);
    
    expect(sanitized.userId).toBe('[REDACTED]');
    expect(sanitized.email).toBe('[REDACTED]');
    expect(sanitized.exerciseType).toBe('Squats');
    expect(sanitized.location).toBeUndefined(); // Assuming location is also sensitive
  });

  it('should block external transmission of non-anonymized data', async () => {
    const sensitiveData = { pii: 'sensitive' };
    
    await expect(privacyShieldService.protectAndTransmit('https://api.external.com', sensitiveData))
      .rejects.toThrow('Privacy Violation: Cannot transmit non-anonymized sensitive data');
  });

  it('should allow transmission of anonymized data with consent', async () => {
    const nonSensitiveData = { stats: 'anonymized' };
    
    // Mocking fetch or a transmit function
    const mockTransmit = vi.fn().mockResolvedValue({ success: true });
    
    const result = await privacyShieldService.safeTransmit(mockTransmit, nonSensitiveData) as { success: boolean };
    expect(result.success).toBe(true);
    expect(mockTransmit).toHaveBeenCalledWith(nonSensitiveData);
  });

  it('should sanitize based on granular data categories', () => {
    const data = {
      injuryHistory: 'ACL Tear',
      workoutPatterns: 'Morning runner',
      biologicalData: { heartRate: 75 }
    };

    const categories = {
      injuryHistory: false, // Blocked
      biologicalData: false, // Blocked
      locationData: false,
      workoutPatterns: true, // Allowed
      usageAnalytics: true,
    };

    // We'll need to update the service to accept categories
    // @ts-ignore
    const sanitized = privacyShieldService.sanitizeForExternalUse(data, categories);

    expect(sanitized.injuryHistory).toBe('[REDACTED]');
    expect(sanitized.biologicalData).toBeUndefined();
    expect(sanitized.workoutPatterns).toBe('Morning runner');
  });
});
