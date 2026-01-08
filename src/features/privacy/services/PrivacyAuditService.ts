import { store } from '@/store';
import { addAuditEntry } from '../store/privacySlice';
import { PrivacyAuditEntry } from '../types/privacy.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * PrivacyAuditService
 * Tracks data access and transmission attempts for transparency and auditing
 * Compliant with AC 6 and AC 8
 */
export class PrivacyAuditService {
  /**
   * Logs a privacy-related operation
   */
  static log(
    operation: PrivacyAuditEntry['operation'],
    resource: string,
    status: 'success' | 'failure' = 'success',
    details?: string
  ): void {
    const entry: PrivacyAuditEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      operation,
      resource,
      status,
      details,
    };

    store.dispatch(addAuditEntry(entry));
  }

  /**
   * Helper for logging encryption operations
   */
  static logEncryption(resource: string, status: 'success' | 'failure' = 'success'): void {
    this.log('encrypt', resource, status);
  }

  /**
   * Helper for logging decryption operations
   */
  static logDecryption(resource: string, status: 'success' | 'failure' = 'success'): void {
    this.log('decrypt', resource, status);
  }

  /**
   * Helper for logging data access
   */
  static logAccess(resource: string, status: 'success' | 'failure' = 'success'): void {
    this.log('access', resource, status);
  }

  /**
   * Helper for logging data transmission attempts
   */
  static logTransmission(resource: string, status: 'success' | 'failure' = 'success', details?: string): void {
    this.log('transmission', resource, status, details);
  }
}
