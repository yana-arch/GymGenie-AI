/**
 * Encryption Service for Form Correction Data
 * Implements AES-256 encryption for sensitive workout data
 */

export interface EncryptionResult {
  data: string;
  algorithm: string;
  keyId: string;
  timestamp: number;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-256-GCM';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private sessionKeys: Map<string, CryptoKey> = new Map();

  /**
   * Encrypt data using AES-256-GCM
   */
  async encryptData(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      const key = await this.generateSessionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: EncryptionService.ALGORITHM,
          iv: iv
        },
        key,
        dataBuffer
      );

      const result = new Uint8Array(iv.length + encryptedData.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt AES-256-GCM encrypted data
   */
  async decryptData(encryptedData: string): Promise<any> {
    try {
      const encryptedBuffer = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = encryptedBuffer.slice(0, 12);
      const data = encryptedBuffer.slice(12);

      const key = await this.getOrCreateKey();

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: EncryptionService.ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Get the encryption algorithm being used
   */
  async getEncryptionAlgorithm(): Promise<string> {
    return EncryptionService.ALGORITHM;
  }

  /**
   * Generate a unique session key
   */
  async generateSessionKey(): Promise<CryptoKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    const keyId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionKeys.set(keyId, key);

    return key;
  }

  /**
   * Encrypt a buffer (for in-memory encryption)
   */
  async encryptBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const key = await this.getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: EncryptionService.ALGORITHM,
        iv: iv
      },
      key,
      buffer
    );

    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    return result.buffer;
  }

  private async getOrCreateKey(): Promise<CryptoKey> {
    if (this.sessionKeys.size === 0) {
      await this.generateSessionKey();
    }
    
    const firstKey = this.sessionKeys.values().next().value;
    if (!firstKey) {
      return await this.generateSessionKey();
    }
    
    return firstKey;
  }

  /**
   * Clear all session keys (cleanup)
   */
  clearSessionKeys(): void {
    this.sessionKeys.clear();
  }

  /**
   * Get current key count
   */
  getKeyCount(): number {
    return this.sessionKeys.size;
  }
}