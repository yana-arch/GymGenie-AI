import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivacyShieldService } from '../services/PrivacyShieldService';
import { EncryptionService } from '../services/EncryptionService';
import { PrivacyAuditService } from '../services/PrivacyAuditService';
import { geminiService } from '@/services/ai/GeminiService';
import { store } from '@/store';

// Mock the store
vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

// Mock EncryptionService
vi.mock('../services/EncryptionService', () => ({
  EncryptionService: {
    getInstance: vi.fn().mockReturnValue({
      encrypt: vi.fn().mockResolvedValue('encrypted'),
      decrypt: vi.fn().mockResolvedValue({ sensitive: 'data' }),
    }),
  },
}));

describe('Privacy Transparency & Auditing (Story 3.3)', () => {
  let privacyShield: PrivacyShieldService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    privacyShield = new PrivacyShieldService(EncryptionService.getInstance());
  });

  describe('PrivacyAuditService', () => {
    it('should dispatch addAuditEntry when logging', async () => {
      await PrivacyAuditService.log('setting_change', 'test_setting', 'success', 'Details');
      expect(store.dispatch).toHaveBeenCalled();
      const action = (store.dispatch as any).mock.calls[0][0];
      expect(action.type).toBe('privacy/addAuditEntry');
      expect(action.payload.operation).toBe('setting_change');
      expect(action.payload.resource).toBe('test_setting');
    });

    it('should support logAiInference with data categories', async () => {
      const categories = {
        injuryHistory: false,
        biologicalData: true,
        locationData: true,
        workoutPatterns: true,
        usageAnalytics: true
      };
      
      await PrivacyAuditService.logAiInference('gemini-pro', categories, 'success', 'Test call');
      
      const action = (store.dispatch as any).mock.calls[0][0];
      expect(action.payload.operation).toBe('ai_inference');
      expect(action.payload.dataCategories).toEqual(categories);
    });
  });

  describe('PrivacyShieldService Logging', () => {
    it('should log an audit entry when sanitization occurs', async () => {
      const data = { userId: 'PII' };
      privacyShield.sanitizeForExternalUse(data);
      
      // Should log 'access' for sanitization
      await vi.waitFor(() => {
        expect(store.dispatch).toHaveBeenCalled();
      });
      
      const auditAction = (store.dispatch as any).mock.calls.find(
        (call: any) => call[0].payload.operation === 'access'
      )[0];
      expect(auditAction.payload.resource).toBe('Data Sanitization');
    });

    it('should log a transmission event in safeTransmit', async () => {
      const data = { userId: 'PII' };
      const transmitFn = vi.fn().mockResolvedValue({ success: true });
      
      await privacyShield.safeTransmit(transmitFn, data);
      
      await vi.waitFor(() => {
        const calls = (store.dispatch as any).mock.calls;
        const transmissionCall = calls.find((call: any) => 
          call[0] && call[0].payload && call[0].payload.operation === 'transmission'
        );
        expect(transmissionCall).toBeDefined();
        expect(transmissionCall[0].payload.resource).toBe('Safe External Transmission');
      }, { timeout: 2000 });
    });

    it('should log encryption and decryption events', async () => {
      await privacyShield.encryptForStorage({ data: 'test' });
      
      await vi.waitFor(() => {
        expect(store.dispatch).toHaveBeenCalled();
      });
      
      const encryptAction = (store.dispatch as any).mock.calls.find(
        (call: any) => call[0].payload.operation === 'encrypt'
      )[0];
      expect(encryptAction.payload.resource).toBe('Local Storage');

      await privacyShield.decryptFromStorage('encrypted-blob');
      
      await vi.waitFor(() => {
        const calls = (store.dispatch as any).mock.calls;
        expect(calls.length).toBeGreaterThan(1);
      });

      const decryptAction = (store.dispatch as any).mock.calls.find(
        (call: any) => call[0].payload.operation === 'decrypt'
      )[0];
      expect(decryptAction.payload.resource).toBe('Local Storage');
    });
  });

  describe('GeminiService Transparency', () => {
    it('should log ai_inference after successful AI call', async () => {
      // Mock AI response
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify([{ 
          name: 'Test Recipe', 
          calories: 200, 
          protein: 20, 
          carbs: 30, 
          fats: 5, 
          ingredients: ['test'], 
          instructions: ['test'],
          cookingTimeMinutes: 20 
        }])
      });
      
      // @ts-ignore - access private member for testing
      geminiService.ai = {
        models: {
          generateContent: mockGenerateContent
        }
      } as any;

      const user = { goal: 'gain muscle', tdee: 2500 } as any;
      const categories = { injuryHistory: true, biologicalData: true, locationData: true, workoutPatterns: true, usageAnalytics: true };
      
      await geminiService.generateRecipes('img-base64', user, categories);
      
      // Check if logAiInference was called via store dispatch
      let aiInferenceCall: any;
      await vi.waitFor(() => {
        aiInferenceCall = (store.dispatch as any).mock.calls.find(
          (call: any) => call[0].payload.operation === 'ai_inference'
        );
        expect(aiInferenceCall).toBeDefined();
      });
      
      expect(aiInferenceCall[0].payload.dataCategories).toEqual(categories);
    });
  });
});
