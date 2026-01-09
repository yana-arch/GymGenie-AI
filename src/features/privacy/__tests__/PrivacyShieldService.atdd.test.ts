import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyShieldService } from '../services/PrivacyShieldService';
import { EncryptionService } from '../services/EncryptionService';

// Mock PrivacyAuditService to avoid store dependency issues in this test
vi.mock('../services/PrivacyAuditService', () => ({
  PrivacyAuditService: {
    log: vi.fn(),
    logSettingChange: vi.fn()
  }
}));

describe('PrivacyShieldService - ATDD failing tests @atdd', () => {
  let privacyShieldService: PrivacyShieldService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    EncryptionService.instance = null;
    encryptionService = EncryptionService.getInstance();
    privacyShieldService = new PrivacyShieldService(encryptionService);
  });

  /**
   * Story 3.3: Transparency and Auditing
   * Requirement: audit exactly what data influences my AI recommendations
   */
  it('should maintain an audit trail of data access by AI service @p0', async () => {
    const { PrivacyAuditService } = await import('../services/PrivacyAuditService');
    
    // Simulate AI accessing data
    await privacyShieldService.logDataAccess('GeminiService', ['heartRate', 'lastInjury'], 'Generate workout adaptation');

    expect(PrivacyAuditService.log).toHaveBeenCalledWith(
      'access',
      'GeminiService',
      'success',
      expect.stringContaining('heartRate, lastInjury')
    );
  });

  /**
   * Story 3.1: Local Processing Isolation
   * Requirement: verify zero network egress during AI inference
   */
  it('should block all network traffic during sensitive local AI processing @p0', async () => {
    // Start sensitive processing
    await privacyShieldService.enableNetworkIsolation();

    // Attempt a network call (should fail or be blocked)
    const fetchPromise = fetch('https://api.external.com/log', { method: 'POST', body: 'PII' });
    
    await expect(fetchPromise).rejects.toThrow('Privacy Violation');

    await privacyShieldService.disableNetworkIsolation();
  });
});
