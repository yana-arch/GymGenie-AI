/**
 * EncryptionService
 * Implements AES-256 encryption using Web Crypto API
 * Compliant with NFR15 (AES-256) and NFR17/20 (Data Privacy)
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly DB_NAME = 'GymGenieSecureStorage';
  private readonly STORE_NAME = 'Keys';
  private readonly KEY_ID = 'master_key';

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initializes the encryption key from IndexedDB (secure storage)
   */
  private async ensureKey(): Promise<CryptoKey> {
    if (this.masterKey) return this.masterKey;

    try {
      this.masterKey = await this.loadKeyFromIndexedDB();
      if (this.masterKey) return this.masterKey;
    } catch (e) {
      console.error('CRITICAL: Failed to load key from IndexedDB', e);
    }

    // Generate new AES-256 key
    this.masterKey = await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // must be extractable to be saved to IndexedDB
      ['encrypt', 'decrypt']
    );

    try {
      await this.saveKeyToIndexedDB(this.masterKey);
    } catch (e) {
      console.error('CRITICAL FAILURE: Could not save encryption key to device storage.', e);
      throw new Error('SECURE_STORAGE_UNAVAILABLE');
    }

    return this.masterKey;
  }

  private async loadKeyFromIndexedDB(): Promise<CryptoKey | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.STORE_NAME);
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const getRequest = store.get(this.KEY_ID);

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async saveKeyToIndexedDB(key: CryptoKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.STORE_NAME);
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const putRequest = store.put(key, this.KEY_ID);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Encrypts any JSON-serializable data
   * @param data Data to encrypt
   * @returns Base64 encoded string containing IV and Ciphertext
   */
  async encrypt(data: any): Promise<string> {
    try {
      const key = await this.ensureKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encodedData
      );

      // Combine IV and Ciphertext for storage
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts data encrypted with this service
   * @param encryptedData Base64 encoded combined IV and Ciphertext
   * @returns Decrypted data
   */
  async decrypt(encryptedData: string): Promise<any> {
    try {
      const key = await this.ensureKey();
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }
}
