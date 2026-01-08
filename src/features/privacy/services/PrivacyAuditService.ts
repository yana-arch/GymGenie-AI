import { addAuditEntry } from '../store/privacySlice';
import { DataCategories, PrivacyAuditEntry } from '../types/privacy.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * PrivacyAuditService
 * Tracks data access and transmission attempts for transparency and auditing
 * Compliant with AC 6 and AC 8
 */
export class PrivacyAuditService {
  private static store: any = null;

  /**
   * Logs a privacy-related operation
   */
  static async log(
    operation: PrivacyAuditEntry['operation'],
    resource: string,
    status: 'success' | 'failure' = 'success',
    details?: string,
    dataCategories?: DataCategories
  ): Promise<void> {
    const entry: PrivacyAuditEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      operation,
      resource,
      status,
      details,
      dataCategories,
    };

    // Use dynamic import to avoid circular dependency with store
    if (!this.store) {
      const { store } = await import('@/store');
      this.store = store;
    }
    
    if (this.store) {
      this.store.dispatch(addAuditEntry(entry));
    }
  }

  /**
   * Helper for logging AI inference calls
   */
  static async logAiInference(
    model: string,
    dataCategories: DataCategories,
    status: 'success' | 'failure' = 'success',
    details?: string
  ): Promise<void> {
    await this.log('ai_inference', model, status, details, dataCategories);
  }

  /**
   * Helper for logging encryption operations
   */
  static async logEncryption(resource: string, status: 'success' | 'failure' = 'success', details?: string): Promise<void> {
    await this.log('encrypt', resource, status, details);
  }

  /**
   * Helper for logging decryption operations
   */
  static async logDecryption(resource: string, status: 'success' | 'failure' = 'success', details?: string): Promise<void> {
    await this.log('decrypt', resource, status, details);
  }

  /**
   * Helper for logging data access
   */
  static async logAccess(resource: string, status: 'success' | 'failure' = 'success', details?: string): Promise<void> {
    await this.log('access', resource, status, details);
  }

  /**
   * Helper for logging data transmission attempts
   */
  static async logTransmission(resource: string, status: 'success' | 'failure' = 'success', details?: string): Promise<void> {
    await this.log('transmission', resource, status, details);
  }

  /**
   * Helper for logging privacy setting changes
   */
  static async logSettingChange(settingName: string, newValue: any): Promise<void> {
    await this.log('setting_change', settingName, 'success', `Changed to: ${JSON.stringify(newValue)}`);
  }
}
