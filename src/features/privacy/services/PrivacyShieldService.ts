import { EncryptionService } from './EncryptionService';

/**
 * PrivacyShieldService
 * Manages local-only data boundaries and enforces zero-trust patterns
 * Compliant with FR18, FR19, NFR17, NFR20
 */
export class PrivacyShieldService {
  private readonly SENSITIVE_KEYS = [
    'userId', 'email', 'name', 'phone', 'address', 
    'heartRate', 'injuryHistory', 'medicalConditions',
    'location', 'gps', 'identity', 'pii', 'health', 'fitness'
  ];

  constructor(
    private encryptionService: EncryptionService,
    private onSanitize?: () => void
  ) {}

  /**
   * Checks if a data object contains sensitive information
   */
  isSensitive(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    const keys = Object.keys(data);
    return keys.some(key => 
      this.SENSITIVE_KEYS.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      ) || (typeof data[key] === 'object' && this.isSensitive(data[key]))
    );
  }

  /**
   * Redacts sensitive information from an object
   */
  sanitizeForExternalUse(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (this.isSensitive(data) && this.onSanitize) {
      this.onSanitize();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForExternalUse(item));
    }

    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      const isSensitiveKey = this.SENSITIVE_KEYS.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      );

      if (isSensitiveKey) {
        if (typeof data[key] === 'string') {
          sanitized[key] = '[REDACTED]';
        } else if (typeof data[key] === 'number') {
          sanitized[key] = 0;
        } else {
          sanitized[key] = undefined;
        }
      } else if (typeof data[key] === 'object') {
        sanitized[key] = this.sanitizeForExternalUse(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  /**
   * Protects data and attempts to transmit it (fails if sensitive)
   */
  async protectAndTransmit(url: string, data: any): Promise<any> {
    if (this.isSensitive(data)) {
      throw new Error('Privacy Violation: Cannot transmit non-anonymized sensitive data');
    }
    
    // In a real app, this would use fetch or an API service
    console.log(`Transmitting anonymized data to ${url}`);
    return { success: true };
  }

  /**
   * Helper to safely execute a transmission function
   */
  async safeTransmit<T>(transmitFn: (data: any) => Promise<T>, data: any): Promise<T> {
    if (this.isSensitive(data)) {
      const sanitized = this.sanitizeForExternalUse(data);
      return transmitFn(sanitized);
    }
    return transmitFn(data);
  }

  /**
   * Encrypts sensitive data for local storage
   */
  async encryptForStorage(data: any): Promise<string> {
    return this.encryptionService.encrypt(data);
  }

  /**
   * Decrypts sensitive data from local storage
   */
  async decryptFromStorage(encryptedData: string): Promise<any> {
    return this.encryptionService.decrypt(encryptedData);
  }
}
