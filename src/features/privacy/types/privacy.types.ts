export interface PrivacySettings {
  localProcessingOnly: boolean;
  encryptionEnabled: boolean;
  anonymizeMetadata: boolean;
  consentGiven: boolean;
}

export interface PrivacyAuditEntry {
  id: string;
  timestamp: number;
  operation: 'encrypt' | 'decrypt' | 'access' | 'transmission' | 'consent_change';
  resource: string;
  status: 'success' | 'failure';
  details?: string;
}

export interface EncryptionResult {
  ciphertext: string;
  iv: string;
}
