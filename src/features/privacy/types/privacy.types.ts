import { z } from 'zod';

export const DataCategoriesSchema = z.object({
  injuryHistory: z.boolean(),
  biologicalData: z.boolean(),
  locationData: z.boolean(),
  workoutPatterns: z.boolean(),
  usageAnalytics: z.boolean(),
});

export type DataCategories = z.infer<typeof DataCategoriesSchema>;

export interface PrivacySettings {
  localProcessingOnly: boolean;
  encryptionEnabled: boolean;
  anonymizeMetadata: boolean;
  consentGiven: boolean;
  dataCategories: DataCategories;
}

export interface PrivacyAuditEntry {
  id: string;
  timestamp: number;
  operation: 'encrypt' | 'decrypt' | 'access' | 'transmission' | 'consent_change' | 'setting_change' | 'ai_inference';
  resource: string;
  status: 'success' | 'failure';
  details?: string;
  dataCategories?: DataCategories;
}

export interface EncryptionResult {
  ciphertext: string;
  iv: string;
}
