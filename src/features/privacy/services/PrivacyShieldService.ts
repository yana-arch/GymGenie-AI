import { EncryptionService } from './EncryptionService';
import { PrivacyAuditService } from './PrivacyAuditService';
import { DataCategories } from '../types/privacy.types';

/**
 * PrivacyShieldService
 * Manages local-only data boundaries and enforces zero-trust patterns
 * Compliant with FR18, FR19, NFR17, NFR20
 */
export class PrivacyShieldService {
  private readonly CATEGORY_MAPPINGS: Record<keyof DataCategories, string[]> = {
    injuryHistory: ['injuryHistory', 'medicalConditions'],
    biologicalData: ['heartRate', 'biologicalData', 'health', 'age', 'gender', 'weight', 'height', 'tdee'],
    locationData: ['location', 'gps', 'address'],
    workoutPatterns: ['workoutPatterns', 'exerciseHistory'],
    usageAnalytics: ['usageAnalytics', 'analytics'],
  };

  private readonly PII_KEYS = ['userId', 'email', 'name', 'phone', 'identity', 'pii', 'age', 'gender', 'weight', 'height'];

  constructor(
    private encryptionService: EncryptionService,
    private onSanitize?: (categories?: DataCategories) => void
  ) {}

  /**
   * Checks if a data object contains sensitive information based on categories
   */
  isSensitive(data: any, categories?: DataCategories): boolean {
    if (!data || typeof data !== 'object') return false;

    const blockedKeys = this.getBlockedKeys(categories);
    const keys = Object.keys(data);

    return keys.some(key => 
      blockedKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey.toLowerCase())
      ) || (typeof data[key] === 'object' && this.isSensitive(data[key], categories))
    );
  }

  private getBlockedKeys(categories?: DataCategories): string[] {
    let blockedKeys = [...this.PII_KEYS];

    if (categories) {
      (Object.keys(this.CATEGORY_MAPPINGS) as Array<keyof DataCategories>).forEach(category => {
        if (!categories[category]) {
          blockedKeys = [...blockedKeys, ...this.CATEGORY_MAPPINGS[category]];
        }
      });
    } else {
      // Default to blocking everything if no categories provided (Zero Trust)
      Object.values(this.CATEGORY_MAPPINGS).forEach(keys => {
        blockedKeys = [...blockedKeys, ...keys];
      });
    }

    return blockedKeys;
  }

  /**
   * Redacts sensitive information from an object
   */
  sanitizeForExternalUse(data: any, categories?: DataCategories): any {
    if (!data || typeof data !== 'object') return data;

    if (this.isSensitive(data, categories)) {
      if (this.onSanitize) {
        this.onSanitize(categories);
      }
      PrivacyAuditService.logAccess('Data Sanitization', 'success', categories ? 'Selective categories applied' : 'Full zero-trust sanitization');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForExternalUse(item, categories));
    }

    const blockedKeys = this.getBlockedKeys(categories);
    const sanitized: any = {};

    for (const key of Object.keys(data)) {
      const isSensitiveKey = blockedKeys.some(sensitiveKey => 
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
        sanitized[key] = this.sanitizeForExternalUse(data[key], categories);
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  /**
   * Protects data and attempts to transmit it (fails if sensitive)
   */
  async protectAndTransmit(url: string, data: any, categories?: DataCategories): Promise<any> {
    if (this.isSensitive(data, categories)) {
      throw new Error('Privacy Violation: Cannot transmit non-anonymized sensitive data');
    }
    
    // In a real app, this would use fetch or an API service
    console.log(`Transmitting anonymized data to ${url}`);
    return { success: true };
  }

  /**
   * Helper to safely execute a transmission function
   */
  async safeTransmit<T>(transmitFn: (data: any) => Promise<T>, data: any, categories?: DataCategories): Promise<T> {
    if (this.isSensitive(data, categories)) {
      const sanitized = this.sanitizeForExternalUse(data, categories);
      await PrivacyAuditService.logTransmission('Safe External Transmission', 'success', 'Data sanitized before transmission');
      return transmitFn(sanitized);
    }
    await PrivacyAuditService.logTransmission('External Transmission', 'success', 'No sensitive data detected');
    return transmitFn(data);
  }

  /**
   * Encrypts sensitive data for local storage
   */
  async encryptForStorage(data: any): Promise<string> {
    PrivacyAuditService.logEncryption('Local Storage');
    return this.encryptionService.encrypt(data);
  }

  /**
   * Decrypts sensitive data from local storage
   */
  async decryptFromStorage(encryptedData: string): Promise<any> {
    PrivacyAuditService.logDecryption('Local Storage');
    return this.encryptionService.decrypt(encryptedData);
  }
}
