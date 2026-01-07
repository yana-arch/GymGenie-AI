/**
 * Preference Learning Service Core Functionality Tests
 * Simple, focused tests that work with the actual service interface
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceLearningService } from '../PreferenceLearningService';
import type {
  PreferencePattern,
  PreferenceType,
  ExerciseSession,
  PreferenceLearningInput
} from '../types/preferenceLearning.types';

// Simple mock implementations
const createMockServices = () => ({
  privacyService: {
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    retrieve: vi.fn(),
    store: vi.fn(),
    delete: vi.fn(),
    auditTrail: vi.fn()
  },
  tensorFlowService: {
    predictPattern: vi.fn()
  }
});

describe('PreferenceLearningService - Core Functionality', () => {
  let service: PreferenceLearningService;
  let mocks: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    mocks = createMockServices();
    
    // Set up default return values
    mocks.privacyService.encrypt.mockResolvedValue('encrypted-data');
    mocks.privacyService.decrypt.mockResolvedValue({
      type: 'preference-data',
      version: '1.0',
      timestamp: Date.now(),
      data: { preferences: [] }
    });
    mocks.privacyService.retrieve.mockResolvedValue(null);
    mocks.privacyService.store.mockResolvedValue(undefined);
    mocks.privacyService.delete.mockResolvedValue(undefined);
    mocks.privacyService.auditTrail.mockResolvedValue([]);
    mocks.tensorFlowService.predictPattern.mockResolvedValue(null);
    
    service = new PreferenceLearningService({
      privacyService: mocks.privacyService,
      tensorFlowService: mocks.tensorFlowService,
      config: {
        learningRate: 0.1,
        confidenceThreshold: 0.7,
        maxContradictions: 3,
        minSessions: 5,
        gradualAdaptationRate: 0.05,
        privacySettings: {
          localOnly: true,
          encryptionEnabled: true,
          retentionDays: 90
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectPreferences - Basic Functionality', () => {
    it('should return empty results for new user', async () => {
      const mockInput: PreferenceLearningInput = {
        session: {
          id: 'session-1',
          userId: 'new-user',
          exercises: [],
          startTime: new Date(),
          endTime: new Date(),
          totalDuration: 600,
          performance: {
            overallScore: 0.8,
            consistencyScore: 0.9,
            fatigueLevel: 0.3,
            motivationLevel: 0.8
          }
        },
        existingPatterns: [],
        userContext: {
          currentMood: 'focused',
          sessionPhase: 'main',
          recentPerformance: 0.8
        }
      };

      const result = await service.detectPreferences(mockInput);

      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.updatedPatterns).toHaveLength(0);
      expect(result.invalidatedPatterns).toHaveLength(0);
      expect(result.confidenceUpdates).toHaveLength(0);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].type).toBe('exercise-selection');
    });

    it('should handle errors in TensorFlow service', async () => {
      mocks.tensorFlowService.predictPattern.mockRejectedValue(new Error('TensorFlow service error'));

      const mockInput: PreferenceLearningInput = {
        session: {
          id: 'session-1',
          userId: 'new-user',
          exercises: [],
          startTime: new Date(),
          endTime: new Date(),
          totalDuration: 600,
          performance: {
            overallScore: 0.8,
            consistencyScore: 0.9,
            fatigueLevel: 0.3,
            motivationLevel: 0.8
          }
        },
        existingPatterns: [],
        userContext: {
          currentMood: 'focused',
          sessionPhase: 'main',
          recentPerformance: 0.8
        }
      };

      const result = await service.detectPreferences(mockInput);

      expect(result).toBeDefined();
      expect(result.detectedPatterns).toHaveLength(0);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].type).toBe('error');
    });
  });

  describe('getLearnedPreferences', () => {
    it('should return empty array for new user', async () => {
      const result = await service.getLearnedPreferences('new-user');

      expect(result).toEqual([]);
    });

    it('should return decrypted preferences when data exists', async () => {
      const mockPreferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.8,
        strength: 0.7,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {
          exercisePreferences: [
            { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: [] }
          ]
        }
      }];

      mocks.privacyService.retrieve.mockResolvedValue('encrypted-preferences');
      mocks.privacyService.decrypt.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: mockPreferences }
      });

      const result = await service.getLearnedPreferences('new-user');

      expect(result).toEqual(mockPreferences);
    });

    it('should handle decryption errors', async () => {
      mocks.privacyService.retrieve.mockResolvedValue('encrypted-data');
      mocks.privacyService.decrypt.mockRejectedValue(new Error('Decryption error'));

      await expect(
        service.getLearnedPreferences('new-user')
      ).rejects.toThrow('Failed to retrieve preferences');
    });

    it('should maintain audit trail', async () => {
      await service.getLearnedPreferences('new-user');

      expect(mocks.privacyService.auditTrail).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should validate updates before applying', async () => {
      const existingPreferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {}
      }];

      const invalidUpdates = { confidence: 1.5 }; // Invalid: > 1.0

      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: existingPreferences }
      });

      await expect(
        service.updatePreferences('new-user', invalidUpdates)
      ).rejects.toThrow('Invalid preference data');
    });

    it('should update existing patterns with valid data', async () => {
      const existingPreferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {}
      }];

      const validUpdates = { confidence: 0.8 }; // Valid within range

      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: existingPreferences }
      });
      mocks.privacyService.store.mockResolvedValue('updated-encrypted');

      await service.updatePreferences('new-user', validUpdates);

      expect(mocks.privacyService.store).toHaveBeenCalled();
      expect(mocks.privacyService.encrypt).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      const existingPreferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.6,
        strength: 0.5,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {}
      }];

      const validUpdates = { confidence: 0.8 };

      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: existingPreferences }
      });
      mocks.privacyService.store.mockRejectedValue(new Error('Storage error'));

      await expect(
        service.updatePreferences('new-user', validUpdates)
      ).rejects.toThrow('Failed to update preferences');
    });
  });

  describe('deletePreference', () => {
    it('should remove specific preference', async () => {
      const preferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.8,
        strength: 0.7,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {
          exercisePreferences: [
            { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: [] }
          ]
        }
      }];

      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences }
      });
      mocks.privacyService.store.mockResolvedValue('remaining-encrypted');

      await service.deletePreference('new-user', 'pref-1');

      expect(mocks.privacyService.store).toHaveBeenCalled();
    });

    it('should handle missing preference gracefully', async () => {
      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: [] }
      });

      await expect(
        service.deletePreference('new-user', 'non-existent')
      ).rejects.toThrow('Preference not found');
    });
  });

  describe('exportPreferences', () => {
    it('should export preferences', async () => {
      const preferences: PreferencePattern[] = [{
        id: 'pref-1',
        userId: 'new-user',
        patternType: 'exercise-selection' as PreferenceType,
        confidence: 0.8,
        strength: 0.7,
        firstDetected: new Date(),
        lastConfirmed: new Date(),
        confirmations: 3,
        contradictions: 0,
        data: {}
      }];

      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences }
      });
      mocks.privacyService.encrypt.mockResolvedValue('export-encrypted');

      const result = await service.exportPreferences('new-user');

      expect(result).toBe('export-encrypted');
      expect(mocks.privacyService.encrypt).toHaveBeenCalled();
    });

    it('should handle encryption errors', async () => {
      mocks.privacyService.encrypt.mockRejectedValue(new Error('Encryption error'));

      await expect(
        service.exportPreferences('new-user')
      ).rejects.toThrow('Failed to export preferences');
    });
  });

  describe('importPreferences', () => {
    it('should import and validate preferences', async () => {
      const importData = {
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        preferences: [{
          id: 'pref-1',
          userId: 'new-user',
          patternType: 'exercise-selection' as PreferenceType,
          confidence: 0.8,
          strength: 0.7,
          firstDetected: new Date(),
          lastConfirmed: new Date(),
          confirmations: 3,
          contradictions: 0,
          data: {}
        }]
      };

      mocks.privacyService.decrypt.mockResolvedValue(importData);
      mocks.privacyService.store.mockResolvedValue('stored-import');

      const result = await service.importPreferences('new-user', 'import-encrypted');

      expect(result).toBeUndefined();
      expect(mocks.privacyService.decrypt).toHaveBeenCalledWith('import-encrypted');
    });

    it('should reject invalid import data', async () => {
      mocks.privacyService.decrypt.mockRejectedValue(new Error('JSON parse error'));

      await expect(
        service.importPreferences('new-user', 'invalid-encrypted')
      ).rejects.toThrow('Invalid preference data');
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences', async () => {
      mocks.privacyService.retrieve.mockResolvedValue({
        type: 'preference-data',
        version: '1.0',
        timestamp: Date.now(),
        data: { preferences: [] }
      });
      mocks.privacyService.store.mockResolvedValue('reset-complete');

      await service.resetPreferences('new-user');

      expect(mocks.privacyService.delete).toHaveBeenCalledWith('preferences-new-user');
      expect(mocks.privacyService.store).toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      mocks.privacyService.store.mockRejectedValue(new Error('Reset error'));

      await expect(
        service.resetPreferences('new-user')
      ).rejects.toThrow('Failed to reset preferences');
    });
  });

  describe('Privacy and Security', () => {
    it('should maintain audit trail for all operations', async () => {
      await service.getLearnedPreferences('new-user');
      await service.updatePreferences('new-user', { confidence: 0.9 });

      expect(mocks.privacyService.auditTrail).toHaveBeenCalledTimes(2);
    });
  });
});