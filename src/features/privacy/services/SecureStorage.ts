import storage from 'redux-persist/lib/storage';
import { EncryptionService } from './EncryptionService';

/**
 * SecureStorage
 * Custom storage engine for redux-persist that encrypts data at rest
 * Wraps the default storage (localStorage/Capacitor) with AES-256 encryption
 */
export class SecureStorage {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  async getItem(key: string): Promise<string | null> {
    const encryptedData = await storage.getItem(key);
    if (!encryptedData) return null;

    try {
      const decryptedData = await this.encryptionService.decrypt(encryptedData);
      return JSON.stringify(decryptedData);
    } catch (error) {
      console.error(`Failed to decrypt storage key: ${key}`, error);
      // Return null to avoid corrupted state, or handle recovery
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const dataToEncrypt = JSON.parse(value);
      const encryptedData = await this.encryptionService.encrypt(dataToEncrypt);
      return storage.setItem(key, encryptedData);
    } catch (error) {
      console.error(`Failed to encrypt storage key: ${key}`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    return storage.removeItem(key);
  }
}

export const secureStorage = new SecureStorage();
