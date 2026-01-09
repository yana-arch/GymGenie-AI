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
  private sessionKey: CryptoKey | null = null;

  /**
   * Get or create the session encryption key
   */
  private async getSessionKey(): Promise<CryptoKey> {
    if (!this.sessionKey) {
      this.sessionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    }
    return this.sessionKey;
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encryptData(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      const key = await this.getSessionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
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

      const key = await this.getSessionKey();

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
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
   * Generate a unique session key (replaces existing)
   */
  async generateSessionKey(): Promise<CryptoKey> {
    this.sessionKey = null;
    return await this.getSessionKey();
  }

  /**
   * Encrypt a buffer (for in-memory encryption)
   */
  async encryptBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const key = await this.getSessionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
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

  /**
   * Clear session key (cleanup)
   */
  clearSessionKeys(): void {
    this.sessionKey = null;
  }

  /**
   * Get current key count
   */
  getKeyCount(): number {
    return this.sessionKey ? 1 : 0;
  }
}