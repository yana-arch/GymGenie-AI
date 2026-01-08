import { PrivacyShieldService } from '@/features/privacy/services/PrivacyShieldService';
import { EncryptionService } from '@/features/privacy/services/EncryptionService';

/**
 * LocalDataService
 * Enforces local-only data isolation patterns
 * Acts as a gatekeeper for any data operations that must remain on-device
 */
export class LocalDataService {
  private privacyShield: PrivacyShieldService;

  constructor() {
    const encryptionService = EncryptionService.getInstance();
    this.privacyShield = new PrivacyShieldService(encryptionService);
  }

  /**
   * Securely saves data to a local-only destination
   */
  async saveSecureLocal(key: string, data: any): Promise<void> {
    // Ensure data is handled as sensitive if it contains PII
    if (this.privacyShield.isSensitive(data)) {
      console.log(`[LocalDataService] Protecting sensitive data for key: ${key}`);
      const encrypted = await this.privacyShield.encryptForStorage(data);
      localStorage.setItem(`secure_${key}`, encrypted);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * Retrieves data from a local-only destination
   */
  async getSecureLocal(key: string): Promise<any> {
    const secureData = localStorage.getItem(`secure_${key}`);
    if (secureData) {
      return this.privacyShield.decryptFromStorage(secureData);
    }

    const regularData = localStorage.getItem(key);
    return regularData ? JSON.parse(regularData) : null;
  }

  /**
   * Ensures zero-trust transmission by sanitizing data before any potential external call
   */
  async safeExternalCall<T>(apiCall: (data: any) => Promise<T>, data: any): Promise<T> {
    return this.privacyShield.safeTransmit(apiCall, data);
  }
}

export const localDataService = new LocalDataService();
