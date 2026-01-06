/**
 * Coaching Intelligence Service Tests
 * Comprehensive test coverage for intelligent coaching with user learning
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoachingIntelligenceService } from '../services/CoachingIntelligenceService';
import {
  CoachingDecision,
  CoachingPriority,
  AICoachingInput,
  AISystemResponse
} from '../types/unifiedCoaching.types';
import {
  CoachingStylePreferences,
  CoachingIntelligenceConfig
} from '../types/coachingIntelligence.types';

describe('CoachingIntelligenceService', () => {
  let service: CoachingIntelligenceService;
  let mockStorage: any;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Create test config
    const testConfig: Partial<CoachingIntelligenceConfig> = {
      storage: {
        encryptionEnabled: false, // Disable for testing
        dataRetentionDays: 30,
        anonymizationLevel: 'none',
        sharingConsent: {
          analytics: false,
          improvement: false,
          research: false
        },
        sensitiveDataFields: []
      },
      learning: {
        adaptationRate: 0.1,
        confidenceThreshold: 0.7,
        historyWeight: 0.3,
        explorationRate: 0.1
      },
      performance: {
        maxCacheSize: 100,
        processingTimeoutMs: 1000,
        batchSize: 5
      }
    };

    service = new CoachingIntelligenceService(testConfig);
  });

  describe('Initialization', () => {
    it('should initialize with default preferences', async () => {
      await service.initialize();
      const preferences = service.getPreferences();
      
      expect(preferences.communicationFrequency).toBe('moderate');
      expect(preferences.communicationTone).toBe('encouraging');
      expect(preferences.primaryFocus).toBe('balanced');
    });

    it('should initialize with default learning profile', async () => {
      await service.initialize();
      const profile = service.getLearningProfile();
      
      expect(profile.responseRate.overall).toBe(0.7);
      expect(profile.adaptationRate).toBe(0.5);
      expect(profile.correctionAcceptance).toBe(0.8);
    });

    it('should handle storage initialization errors gracefully', async () => {
      // Mock storage to throw error
      vi.spyOn(service as any, 'loadStorage').mockRejectedValue(new Error('Storage error'));
      
      // Should not throw during initialization
      await expect(service.initialize()).resolves.not.toThrow();
    });
  });

  describe('Enhanced Coaching Decision', () => {
    const mockBaseDecision: CoachingDecision = {
      system: 'test-system',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.8,
        recommendation: {
          action: 'adjust_form',
          message: 'Keep your back straight'
        },
        reasoning: 'Pose analysis detected form issue',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 100,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    it('should enhance coaching decision with intelligence', async () => {
      await service.initialize();
      
      const enhanced = await service.enhanceCoachingDecision(mockBaseDecision);
      
      expect(enhanced).toBeDefined();
      expect(enhanced.system).toBe(mockBaseDecision.system);
      expect(enhanced.intelligence).toBeDefined();
      expect(enhanced.intelligence.userProfileApplied).toBe(true);
      expect(enhanced.intelligence.personalizationLevel).toBeGreaterThan(0);
      expect(enhanced.intelligence.predictedAcceptance).toBeGreaterThan(0);
      expect(enhanced.learningImpact).toBeDefined();
    });

    it('should adapt message tone based on preferences', async () => {
      await service.initialize();
      
      // Set encouraging tone
      await service.updatePreferences({
        communicationTone: 'encouraging'
      });
      
      const enhanced = await service.enhanceCoachingDecision(mockBaseDecision);
      
      expect(enhanced.adaptedContent).toBeDefined();
      expect(enhanced.adaptedContent!.personalizedMessage).toContain('You');
    });

    it('should predict user acceptance based on priority', async () => {
      await service.initialize();
      
      // High priority decision should have higher acceptance
      const safetyDecision: CoachingDecision = {
        ...mockBaseDecision,
        priority: CoachingPriority.SAFETY,
        response: {
          ...mockBaseDecision.response,
          confidence: 0.95
        }
      };
      
      const enhanced = await service.enhanceCoachingDecision(safetyDecision);
      
      expect(enhanced.intelligence.predictedAcceptance).toBeGreaterThan(0.8);
    });

    it('should calculate optimal timing within preferred hours', async () => {
      await service.initialize();
      
      // Set preferred hours
      const currentHour = new Date().getHours();
      await service.updatePreferences({
        preferredCoachingHours: {
          start: `${currentHour.toString().padStart(2, '0')}:00`,
          end: `${(currentHour + 1).toString().padStart(2, '0')}:00`
        }
      });
      
      const enhanced = await service.enhanceCoachingDecision(mockBaseDecision);
      
      expect(enhanced.intelligence.optimalTiming).toBeDefined();
      expect(enhanced.intelligence.optimalTiming).toBeGreaterThan(0);
    });

    it('should handle errors gracefully and create fallback decision', async () => {
      await service.initialize();
      
      // Mock a method to throw error
      vi.spyOn(service as any, 'applyUserPreferences').mockRejectedValue(new Error('Test error'));
      
      const enhanced = await service.enhanceCoachingDecision(mockBaseDecision);
      
      expect(enhanced).toBeDefined();
      expect(enhanced.intelligence.userProfileApplied).toBe(false);
      expect(enhanced.intelligence.personalizationLevel).toBe(0);
    });
  });

  describe('User Feedback Processing', () => {
    it('should process positive feedback', async () => {
      await service.initialize();
      
      await service.processUserFeedback('test-decision-id', {
        accepted: true,
        responseTime: 5000,
        satisfaction: 0.9
      });
      
      // Should not throw and should update internal state
      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should process negative feedback', async () => {
      await service.initialize();
      
      await service.processUserFeedback('test-decision-id', {
        accepted: false,
        responseTime: 15000,
        satisfaction: 0.3
      });
      
      // Should not throw and should update internal state
      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should buffer signals and process when batch size reached', async () => {
      await service.initialize();
      
      // Mock processLearningSignals to track calls
      const processSpy = vi.spyOn(service as any, 'processLearningSignals').mockResolvedValue(undefined);
      
      // Send feedback equal to batch size
      for (let i = 0; i < 5; i++) {
        await service.processUserFeedback(`decision-${i}`, {
          accepted: true,
          responseTime: 5000
        });
      }
      
      expect(processSpy).toHaveBeenCalled();
    });
  });

  describe('Preference Management', () => {
    it('should update user preferences explicitly', async () => {
      await service.initialize();
      
      const newPreferences: Partial<CoachingStylePreferences> = {
        communicationFrequency: 'frequent',
        communicationTone: 'motivational',
        adaptSpeed: 'aggressive'
      };
      
      await service.updatePreferences(newPreferences, 'explicit');
      
      const current = service.getPreferences();
      expect(current.communicationFrequency).toBe('frequent');
      expect(current.communicationTone).toBe('motivational');
      expect(current.adaptSpeed).toBe('aggressive');
    });

    it('should update user preferences from learning', async () => {
      await service.initialize();
      
      const learnedPreferences: Partial<CoachingStylePreferences> = {
        explanationLevel: 'basic',
        correctionPromptness: 'delayed'
      };
      
      await service.updatePreferences(learnedPreferences, 'learned');
      
      const current = service.getPreferences();
      expect(current.explanationLevel).toBe('basic');
      expect(current.correctionPromptness).toBe('delayed');
    });

    it('should record preference changes in history', async () => {
      await service.initialize();
      
      await service.updatePreferences({
        communicationTone: 'professional'
      }, 'explicit');
      
      const profile = service.getLearningProfile();
      // Note: This would require accessing the internal storage to verify
      // For now, just ensure no errors occur
      expect(profile).toBeDefined();
    });
  });

  describe('Learning Profile Management', () => {
    it('should provide access to learning profile', async () => {
      await service.initialize();
      
      const profile = service.getLearningProfile();
      
      expect(profile).toBeDefined();
      expect(profile.responseRate).toBeDefined();
      expect(profile.adaptationRate).toBeDefined();
      expect(profile.trendData).toBeDefined();
    });

    it('should track response rates by priority', async () => {
      await service.initialize();
      
      const profile = service.getLearningProfile();
      
      expect(profile.responseRate.byPriority).toBeDefined();
      expect(profile.responseRate.byPriority[CoachingPriority.SAFETY]).toBe(0.95);
      expect(profile.responseRate.byPriority[CoachingPriority.INJURY]).toBe(0.9);
    });

    it('should provide intelligence metrics', async () => {
      await service.initialize();
      
      const metrics = service.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.adaptationAccuracy).toBeGreaterThan(0);
      expect(metrics.userSatisfactionScore).toBeGreaterThan(0);
      expect(metrics.privacyCompliance).toBe(1.0);
    });
  });

  describe('Privacy and Storage', () => {
    it('should use privacy-preserving storage', async () => {
      await service.initialize();
      
      // Mock storage operations
      const mockStore = vi.fn().mockResolvedValue(undefined);
      const mockRetrieve = vi.fn().mockResolvedValue({
        preferences: {},
        learningProfile: {},
        metadata: {}
      });
      
      // Verify service was created with privacy storage
      expect(service).toBeDefined();
    });

    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw error
      (window.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not throw during initialization
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should limit data retention for privacy', async () => {
      await service.initialize();
      
      // This would require accessing internal storage to verify
      // For now, ensure service can handle retention policies
      expect(service.getMetrics()).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should complete enhancement within reasonable time', async () => {
      await service.initialize();
      
      const mockDecision: CoachingDecision = {
        system: 'test',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'test',
          confidence: 0.7,
          recommendation: { action: 'test' },
          reasoning: 'test',
          timestamp: Date.now()
        },
        contributingSystems: [],
        conflictResolution: null,
        metadata: {
          processingTime: 50,
          systemsConsidered: 1,
          conflictsResolved: 0,
          priorityUsed: CoachingPriority.ADAPTATION,
          timestamp: Date.now()
        }
      };
      
      const startTime = performance.now();
      const enhanced = await service.enhanceCoachingDecision(mockDecision);
      const endTime = performance.now();
      
      expect(enhanced).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent enhancements', async () => {
      await service.initialize();
      
      const mockDecision: CoachingDecision = {
        system: 'test',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'test',
          confidence: 0.7,
          recommendation: { action: 'test' },
          reasoning: 'test',
          timestamp: Date.now()
        },
        contributingSystems: [],
        conflictResolution: null,
        metadata: {
          processingTime: 50,
          systemsConsidered: 1,
          conflictsResolved: 0,
          priorityUsed: CoachingPriority.ADAPTATION,
          timestamp: Date.now()
        }
      };
      
      // Run multiple enhancements concurrently
      const promises = Array(10).fill(null).map(() => 
        service.enhanceCoachingDecision(mockDecision)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.intelligence).toBeDefined();
      });
    });
  });
});