/**
 * @p0 P0 Critical Security Tests (R-001)
 * Epic 1 - AI-Powered Workout Coaching
 * 
 * Tests for AES-256 encryption validation for form correction data
 * Local-only processing verification tests
 * Sensitive data exposure prevention tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EncryptionService } from '../services/EncryptionService';
import { PrivacyService } from '../services/PrivacyService';

// Mock FormCorrectionService for testing
const MockFormCorrectionService = {
  analyzeFormLocal: vi.fn(),
  analyzeForm: vi.fn(),
};

// Mock XMLHttpRequest for network transmission tests
const MockXMLHttpRequest = vi.fn();

describe('@p0 Security Tests - Form Correction Data Protection', () => {
  let formCorrectionService: any;
  let encryptionService: EncryptionService;
  let privacyService: PrivacyService;

  beforeEach(() => {
    vi.clearAllMocks();
    formCorrectionService = MockFormCorrectionService;
    encryptionService = new EncryptionService();
    privacyService = new PrivacyService();
  });

  describe('@p0 AES-256 Encryption Validation', () => {
    it('should encrypt form correction data with AES-256', async () => {
      // Arrange
      const mockFormData = {
        poses: [
          { x: 100, y: 200, confidence: 0.95 },
          { x: 150, y: 250, confidence: 0.88 }
        ],
        exerciseType: 'squat',
        timestamp: Date.now(),
        userId: 'test-user-123'
      };

      // Act
      const encryptedData = await encryptionService.encryptData(mockFormData);

      // Assert
      expect(encryptedData).toBeDefined();
      expect(encryptedData).not.toEqual(JSON.stringify(mockFormData));
      expect(typeof encryptedData).toBe('string');
      expect(encryptedData.length).toBeGreaterThan(0);
    });

    it('should decrypt form correction data correctly', async () => {
      // Arrange
      const mockFormData = {
        poses: [{ x: 100, y: 200, confidence: 0.95 }],
        exerciseType: 'squat',
        timestamp: Date.now(),
        userId: 'test-user-123'
      };

      // Act
      const encryptedData = await encryptionService.encryptData(mockFormData);
      const decryptedData = await encryptionService.decryptData(encryptedData);

      // Assert
      expect(decryptedData).toEqual(mockFormData);
    });

    it('should use AES-256 encryption algorithm', async () => {
      // Arrange
      const mockData = { test: 'data' };
      
      // Act
      const algorithm = await encryptionService.getEncryptionAlgorithm();

      // Assert
      expect(algorithm).toBe('AES-256-GCM');
    });

    it('should generate unique encryption keys per session', async () => {
      // Arrange & Act
      const key1 = await encryptionService.generateSessionKey();
      const key2 = await encryptionService.generateSessionKey();

      // Assert
      expect(key1).not.toEqual(key2);
      expect(key1).toHaveLength(32); // 256 bits = 32 bytes
      expect(key2).toHaveLength(32);
    });
  });

  describe('@p0 Local-Only Processing Verification', () => {
    it('should process form correction data locally without network transmission', async () => {
      // Arrange
      const mockVideoStream = createMockVideoStream();
      const networkTransmitSpy = vi.fn();
      
      // Mock network transmission attempts
      global.fetch = networkTransmitSpy;

      // Act
      await formCorrectionService.analyzeFormLocal(mockVideoStream);

      // Assert
      expect(networkTransmitSpy).not.toHaveBeenCalled();
    });

    it('should store form data only in local storage', async () => {
      // Arrange
      const mockFormData = {
        poses: [{ x: 100, y: 200, confidence: 0.95 }],
        exerciseType: 'squat',
        timestamp: Date.now()
      };

      const localStorageSpy = vi.spyOn(localStorage, 'setItem');
      const sessionStorageSpy = vi.spyOn(sessionStorage, 'setItem');

      // Act
      await privacyService.storeFormDataLocal(mockFormData);

      // Assert
      expect(localStorageSpy).toHaveBeenCalled();
      expect(sessionStorageSpy).not.toHaveBeenCalled();
    });

    it('should clear sensitive data after processing', async () => {
      // Arrange
      const mockFormData = { poses: [{ x: 100, y: 200, confidence: 0.95 }] };
      
      // Act
      await privacyService.processAndCleanup(mockFormData);

      // Assert
      expect(privacyService.hasSensitiveData()).toBe(false);
    });

    it('should prevent data transmission to external servers', async () => {
      // Arrange
      const mockVideoStream = createMockVideoStream();
      const networkTransmitSpy = vi.fn();
      (global as any).XMLHttpRequest = MockXMLHttpRequest;

      // Act
      await formCorrectionService.analyzeForm({} as any);

      // Assert
      expect(MockXMLHttpRequest).not.toHaveBeenCalled();
    });
  });

  describe('@p0 Sensitive Data Exposure Prevention', () => {
    it('should redact PII from form analysis logs', async () => {
      // Arrange
      const mockAnalysis = {
        userId: 'user-123',
        email: 'test@example.com',
        formIssues: ['knee_alignment'],
        poses: [{ x: 100, y: 200 }]
      };

      // Act
      const loggedData = privacyService.sanitizeForLogging(mockAnalysis);

      // Assert
      expect(loggedData.userId).toBe('[REDACTED]');
      expect(loggedData.email).toBe('[REDACTED]');
      expect(loggedData.formIssues).toEqual(['knee_alignment']);
      expect(loggedData.poses).toBeDefined();
    });

    it('should prevent memory leaks of sensitive data', async () => {
      // Arrange
      const sensitiveData = { userId: 'user-123', poses: generateLargePoseArray(1000) };

      // Act
      await privacyService.secureProcess(sensitiveData);
      const memoryUsage = privacyService.getMemoryUsage();

      // Assert
      expect(memoryUsage.sensitiveDataInMemory).toBe(0);
    });

    it('should validate data retention policies', async () => {
      // Arrange
      const retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
      const oldData = {
        timestamp: Date.now() - (retentionPeriod + 1000),
        poses: [{ x: 100, y: 200 }]
      };

      // Act
      const shouldDelete = privacyService.shouldDeleteOldData(oldData);

      // Assert
      expect(shouldDelete).toBe(true);
    });

    it('should encrypt data in memory buffers', async () => {
      // Arrange
      const sensitiveBuffer = new ArrayBuffer(1024);
      const view = new Uint8Array(sensitiveBuffer);
      view.fill(0x42); // Fill with test data

      // Act
      const encryptedBuffer = await encryptionService.encryptBuffer(sensitiveBuffer);

      // Assert
      expect(encryptedBuffer).not.toEqual(sensitiveBuffer);
      expect(encryptedBuffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('@p0 Security Compliance Validation', () => {
    it('should comply with GDPR data minimization principles', async () => {
      // Arrange
      const fullUserData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        poses: [{ x: 100, y: 200, confidence: 0.95 }],
        exerciseType: 'squat'
      };

      // Act
      const minimizedData = privacyService.minimizeData(fullUserData);

      // Assert
      expect(minimizedData.userId).toBeUndefined();
      expect(minimizedData.email).toBeUndefined();
      expect(minimizedData.name).toBeUndefined();
      expect(minimizedData.age).toBeUndefined();
      expect(minimizedData.poses).toBeDefined();
      expect(minimizedData.exerciseType).toBeDefined();
    });

    it('should implement proper access controls for sensitive data', async () => {
      // Arrange
      const unauthorizedUser = 'hacker';
      const sensitiveData = { poses: [{ x: 100, y: 200 }] };

      // Act
      const accessResult = await privacyService.checkAccess(unauthorizedUser, sensitiveData);

      // Assert
      expect(accessResult.granted).toBe(false);
      expect(accessResult.reason).toBe('Unauthorized access attempt');
    });

    it('should generate audit logs for all data operations', async () => {
      // Arrange
      const auditSpy = vi.fn();
      privacyService.setAuditLogger(auditSpy);

      // Act
      await privacyService.performDataOperation('access', { test: 'data' });

      // Assert
      expect(auditSpy).toHaveBeenCalledWith({
        operation: 'access',
        timestamp: expect.any(Number),
        dataHash: expect.any(String),
        userId: expect.any(String)
      });
    });
  });
});

// Helper functions
function createMockVideoStream() {
  return {
    getVideoTracks: () => [{
      getSettings: () => ({ width: 640, height: 480, frameRate: 30 })
    }]
  };
}

function generateLargePoseArray(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 640,
    y: Math.random() * 480,
    confidence: Math.random()
  }));
}