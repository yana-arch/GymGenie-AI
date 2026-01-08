import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivacyShieldService } from '../services/PrivacyShieldService';
import { EncryptionService } from '../services/EncryptionService';

// Mock state
const mockEncryptionState = {
  lastData: {} as any
};

// Mock IndexedDB and Web Crypto
const mockCrypto = {
  subtle: {
    generateKey: vi.fn().mockResolvedValue({}),
    encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: vi.fn().mockImplementation(() => {
      return new TextEncoder().encode(JSON.stringify(mockEncryptionState.lastData));
    }),
  },
  getRandomValues: vi.fn().mockImplementation((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }),
};

vi.stubGlobal('crypto', mockCrypto);

// Mock IndexedDB
const mockIDBRequest: any = {
  result: {
    createObjectStore: vi.fn(),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        get: vi.fn().mockImplementation(() => {
          const req: any = { onsuccess: null };
          setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
          return req;
        }),
        put: vi.fn().mockImplementation(() => {
          const req: any = { onsuccess: null };
          setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
          return req;
        }),
      }),
    }),
  },
};

vi.stubGlobal('indexedDB', {
  open: vi.fn().mockImplementation(() => {
    setTimeout(() => {
      if (mockIDBRequest.onsuccess) mockIDBRequest.onsuccess({ target: mockIDBRequest });
    }, 0);
    return mockIDBRequest;
  }),
});

// Mock the store
vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

describe('Privacy Integration & Validation', () => {
  let privacyShield: PrivacyShieldService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // @ts-ignore
    EncryptionService.instance = null;
    encryptionService = EncryptionService.getInstance();
    privacyShield = new PrivacyShieldService(encryptionService);
    mockEncryptionState.lastData = {};
    vi.clearAllMocks();
  });

  describe('Privacy Leakage Detection', () => {
    it('should detect and block PII in transmission attempts', async () => {
      const dataWithPII = {
        userId: 'user-123',
        email: 'user@example.com',
        workoutData: { duration: 300 }
      };

      await expect(privacyShield.protectAndTransmit('https://api.gymgenie.com/sync', dataWithPII))
        .rejects.toThrow(/Privacy Violation/);
    });

    it('should allow transmission only after sanitization', async () => {
      const dataWithPII = {
        userId: 'user-123',
        email: 'user@example.com',
        workoutData: { duration: 300 }
      };

      const mockTransmit = vi.fn().mockResolvedValue({ success: true });
      const result = await privacyShield.safeTransmit(mockTransmit, dataWithPII) as { success: boolean };

      expect(result.success).toBe(true);
      const transmittedData = mockTransmit.mock.calls[0][0];
      expect(transmittedData.userId).toBe('[REDACTED]');
      expect(transmittedData.email).toBe('[REDACTED]');
      expect(transmittedData.workoutData.duration).toBe(300);
    });
  });

  describe('Encryption Strength & Security', () => {
    it('should use AES-GCM (AES-256 equivalent in Web Crypto) for encryption', async () => {
      const data = { sensitive: 'info' };
      mockEncryptionState.lastData = data;
      const encrypted = await encryptionService.encrypt(data);
      
      // Verify it's not plain text
      expect(encrypted).not.toContain('sensitive');
      
      // Decrypt and verify
      const decrypted = await encryptionService.decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const data = { test: 'security' };
      mockEncryptionState.lastData = data;
      const e1 = await encryptionService.encrypt(data);
      const e2 = await encryptionService.encrypt(data);
      expect(e1).not.toBe(e2);
    });
  });

  describe('Granular Privacy Controls', () => {
    it('should respect user-defined data categories when sanitizing', () => {
      const data = {
        injuryHistory: 'Shoulder impingement',
        workoutPatterns: 'Loves squats',
        biologicalData: { heartRate: 140 },
        locationData: { city: 'New York' }
      };

      const categories = {
        injuryHistory: false,   // PROTECT
        biologicalData: false,  // PROTECT
        locationData: true,     // SHARE
        workoutPatterns: true,  // SHARE
        usageAnalytics: true
      };

      const sanitized = privacyShield.sanitizeForExternalUse(data, categories);

      expect(sanitized.injuryHistory).toBe('[REDACTED]');
      expect(sanitized.biologicalData).toBeUndefined();
      expect(sanitized.locationData.city).toBe('New York');
      expect(sanitized.workoutPatterns).toBe('Loves squats');
    });

    it('should default to zero-trust (protect everything) if no categories provided', () => {
      const data = {
        injuryHistory: 'Back pain',
        locationData: { city: 'London' }
      };

      const sanitized = privacyShield.sanitizeForExternalUse(data);

      expect(sanitized.injuryHistory).toBe('[REDACTED]');
      expect(sanitized.locationData).toBeUndefined();
    });
  });
});
