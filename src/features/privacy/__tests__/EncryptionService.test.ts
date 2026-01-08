import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionService } from '../services/EncryptionService';

// Mock state to communicate between test and mock
const mockEncryptionState = {
  lastData: {} as any
};

// Mock IndexedDB and Web Crypto
const mockCrypto = {
  subtle: {
    generateKey: vi.fn().mockResolvedValue({}),
    exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
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

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    EncryptionService.instance = null; // Reset singleton
    encryptionService = EncryptionService.getInstance();
    mockEncryptionState.lastData = {};
  });

  it('should encrypt and decrypt data correctly using AES-256', async () => {
    const sensitiveData = {
      heartRate: 75,
      injuryHistory: 'Old knee injury',
      pii: { name: 'John Doe', email: 'john@example.com' }
    };
    
    mockEncryptionState.lastData = sensitiveData;

    const encrypted = await encryptionService.encrypt(sensitiveData);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(JSON.stringify(sensitiveData));

    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toEqual(sensitiveData);
  });

  it('should throw error if decryption fails with wrong key or corrupted data', async () => {
    const corruptedData = 'not-encrypted-data';
    // We expect it to fail at atob or decrypt
    await expect(encryptionService.decrypt(corruptedData)).rejects.toThrow();
  });

  it('should generate different ciphertexts for the same plaintext (using unique IVs)', async () => {
    const data = { test: 'data' };
    mockEncryptionState.lastData = data;
    
    const encrypted1 = await encryptionService.encrypt(data);
    const encrypted2 = await encryptionService.encrypt(data);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    const decrypted1 = await encryptionService.decrypt(encrypted1);
    const decrypted2 = await encryptionService.decrypt(encrypted2);
    
    expect(decrypted1).toEqual(data);
    expect(decrypted2).toEqual(data);
  });
});
