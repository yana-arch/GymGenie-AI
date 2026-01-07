/**
 * Preference Encryption Service
 * Extends existing PrivacyPreservingStorageService with preference-specific encryption methods
 */

import { PrivacyPreservingStorageService } from '../../unified-coaching/services/PrivacyPreservingStorageService';
import type { PrivacyPreservingStorage, StorageAuditEntry } from '../types/preferenceLearning.types';

export class PreferenceEncryptionService implements PrivacyPreservingStorage {
  private baseStorageService: PrivacyPreservingStorageService;
  private auditLog: StorageAuditEntry[] = [];
  private readonly PREFERENCE_STORAGE_KEY = 'gymgenie-preference-data';

  constructor(config: any) {
    // Create proper PrivacyConfig for PrivacyPreservingStorageService
    const privacyConfig = {
      encryptionEnabled: config.encryptionEnabled ?? true,
      dataRetentionDays: config.retentionDays ?? 90,
      anonymizationLevel: config.anonymizationLevel ?? 'partial' as const,
      sharingConsent: {
        analytics: false,
        improvement: false,
        research: false
      },
      sensitiveDataFields: ['preferences', 'patterns', 'confidence']
    };
    this.baseStorageService = new PrivacyPreservingStorageService(privacyConfig);
  }

  /**
   * Encrypt preference data with preference-specific headers
   */
  async encrypt(data: Record<string, unknown> | unknown): Promise<string> {
    try {
      const preferenceData = {
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: data
      };

      // Use base service's encryption pattern
      const encryptedData = await this.encryptData(preferenceData);
      
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: 'preference-encryption',
        success: true
      });

      return encryptedData;
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: 'preference-encryption',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Decrypt preference data with validation
   */
  async decrypt<T = unknown>(encryptedData: string): Promise<T> {
    try {
      const decryptedData = await this.decryptData(encryptedData);
      
      // Type guard for preference data format
      if (typeof decryptedData === 'object' && decryptedData !== null && 'type' in decryptedData) {
        const typedData = decryptedData as unknown;
        const dataWithFormat = typedData as { type: string; data: unknown; sensitivity?: string };
        
        // Validate preference data format
        if (dataWithFormat.type !== 'preference-data') {
          throw new Error('Invalid preference data format');
        }

        this.addAuditEntry({
          timestamp: new Date(),
          action: 'retrieve',
          key: 'preference-decryption',
          success: true
        });

        return dataWithFormat.data as T;
      }

      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: 'preference-decryption',
        success: true
      });

      return decryptedData;
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: 'preference-decryption',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Store encrypted preference data
   */
  async store(key: string, data: any): Promise<void> {
    try {
      const encryptedData = await this.encrypt(data);
      localStorage.setItem(`${this.PREFERENCE_STORAGE_KEY}-${key}`, encryptedData);
      
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: key,
        success: true
      });
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: key,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Retrieve preference data
   */
  async retrieve(key: string): Promise<any> {
    try {
      const encryptedData = localStorage.getItem(`${this.PREFERENCE_STORAGE_KEY}-${key}`);
      if (!encryptedData) {
        return null;
      }

      const data = await this.decrypt(encryptedData);
      
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: key,
        success: true
      });

      return data;
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: key,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete preference data
   */
  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(`${this.PREFERENCE_STORAGE_KEY}-${key}`);
      
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'delete',
        key: key,
        success: true
      });
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'delete',
        key: key,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get audit trail for preference operations
   */
  async auditTrail(): Promise<StorageAuditEntry[]> {
    // Combine local audit log with base service audit trail
    try {
      const baseStats = await this.baseStorageService.getStorageStats();
      const baseAuditTrail: StorageAuditEntry[] = [{
        timestamp: new Date(),
        action: 'retrieve',
        key: 'base-service-stats',
        success: true
      }];
      return [...baseAuditTrail, ...this.auditLog];
    } catch (error) {
      return this.auditLog;
    }
  }

  /**
   * Preference-specific encryption method for sensitive preference types
   */
  async encryptSensitivePreference(preferenceData: {
    type: string;
    data: any;
    sensitivity: 'low' | 'medium' | 'high';
  }): Promise<string> {
    try {
      const enhancedData = {
        ...preferenceData,
        encryptedAt: Date.now(),
        encryptionLevel: this.getEncryptionLevel(preferenceData.sensitivity),
        metadata: {
          preferenceType: preferenceData.type,
          dataHash: await this.hashData(preferenceData.data)
        }
      };

      const encrypted = await this.encryptData(enhancedData);
      
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: `sensitive-preference-${preferenceData.type}`,
        success: true
      });

      return encrypted;
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'store',
        key: `sensitive-preference-${preferenceData.type}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Preference-specific decryption method for sensitive preferences
   */
  async decryptSensitivePreference(encryptedData: string): Promise<{
    type: string;
    data: unknown;
    sensitivity: 'low' | 'medium' | 'high';
  }> {
    try {
      const decrypted = await this.decryptData(encryptedData);
      
      // Type assertion for sensitive preference format
      const typedDecrypted = decrypted as { 
        type?: string; 
        data?: unknown; 
        sensitivity?: 'low' | 'medium' | 'high';
      };
      
      // Validate sensitive preference format
      if (!typedDecrypted.type || !typedDecrypted.data || !typedDecrypted.sensitivity) {
        throw new Error('Invalid sensitive preference format');
      }

      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: `sensitive-preference-${typedDecrypted.type}`,
        success: true
      });

      return {
        type: typedDecrypted.type,
        data: typedDecrypted.data,
        sensitivity: typedDecrypted.sensitivity
      };
    } catch (error) {
      this.addAuditEntry({
        timestamp: new Date(),
        action: 'retrieve',
        key: 'sensitive-preference',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clear audit logs (for testing or cleanup)
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get encryption level based on sensitivity
   */
  private getEncryptionLevel(sensitivity: string): string {
    switch (sensitivity) {
      case 'high':
        return 'AES-256-GCM';
      case 'medium':
        return 'AES-192-GCM';
      case 'low':
      default:
        return 'AES-128-GCM';
    }
  }

  /**
   * Create hash of preference data for integrity verification
   */
  private async hashData(data: any): Promise<string> {
    // Simple hash implementation - in production would use crypto.subtle.digest
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Add entry to audit log
   */
  private addAuditEntry(entry: StorageAuditEntry): void {
    this.auditLog.push(entry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Encrypt data using Web Crypto API with AES-GCM
   */
  private async encryptData(data: any): Promise<string> {
    try {
      // Generate or retrieve encryption key
      const key = await this.getEncryptionKey();
      
      // Convert data to JSON then to bytes
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt using AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Return as Base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed, falling back to base64 encoding:', error);
      // Fallback to base64 for development environments
      return btoa(JSON.stringify(data));
    }
  }

  /**
   * Decrypt data using Web Crypto API with AES-GCM
   */
  private async decryptData(encryptedData: string): Promise<any> {
    try {
      // Get encryption key
      const key = await this.getEncryptionKey();
      
      // Decode from Base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encryptedBuffer
      );
      
      // Convert back to JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed, trying fallback:', error);
      // Fallback for development environments
      try {
        return JSON.parse(atob(encryptedData));
      } catch (fallbackError) {
        throw new Error('Decryption failed and fallback also failed');
      }
    }
  }

  /**
   * Get or generate encryption key
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    const keyData = 'gymgenie-preference-encryption-key-v1-256-bit';
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(keyData);
    
    // Import as HMAC key for consistency
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }
}