import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SafetyDefaultsService } from '../services/SafetyDefaultsService';
import type { AIRecommendation } from '../services/OverrideDetectionService';

describe('SafetyDefaultsService', () => {
  let service: SafetyDefaultsService;
  let mockRecommendation: AIRecommendation;

  beforeEach(() => {
    service = new SafetyDefaultsService();
    mockRecommendation = {
      id: 'test-rec-1',
      type: 'exercise_modification',
      exerciseName: 'Squats',
      originalReps: 15,
      suggestedReps: 18,
      originalSets: 4,
      suggestedSets: 5,
      reasoning: 'Increase intensity for better results',
      timestamp: Date.now(),
      context: {
        energyLevel: 'tired',
        timeRemaining: 15,
        equipmentAvailable: ['bodyweight']
      }
    };
  });

  afterEach(() => {
    service.destroy();
  });

  describe('initialization', () => {
    it('should initialize with moderate safety level', () => {
      const config = service.getConfig();
      expect(config.currentLevel).toBe('moderate');
      expect(config.enabled).toBe(true);
    });

    it('should initialize with configurable safety level', () => {
      const conservativeService = new SafetyDefaultsService({ currentLevel: 'conservative' });
      const config = conservativeService.getConfig();
      expect(config.currentLevel).toBe('conservative');
      conservativeService.destroy();
    });
  });

  describe('safety validation', () => {
    it('should reject unsafe rep increases', () => {
      const result = service.validateRecommendation(mockRecommendation, mockRecommendation.context);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.adjusted.suggestedReps).toBeLessThanOrEqual(mockRecommendation.originalReps!);
    });

    it('should accept safe rep decreases', () => {
      const safeRec = {
        ...mockRecommendation,
        suggestedReps: 12, // Less than original
        suggestedSets: 3
      };
      
      const result = service.validateRecommendation(safeRec, safeRec.context);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should reject unsafe set increases', () => {
      const result = service.validateRecommendation(mockRecommendation, mockRecommendation.context);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.name.includes('Intensity'))).toBe(true);
    });

    it('should enforce maximum reps cap', () => {
      const excessiveRec = {
        ...mockRecommendation,
        originalReps: 8,
        suggestedReps: 25, // High intensity
        suggestedSets: 3
      };
      
      const result = service.validateRecommendation(excessiveRec, excessiveRec.context);
      expect(result.isValid).toBe(false);
      expect(result.adjusted.suggestedReps).toBeLessThan(25);
    });

    it('should enforce minimum rest time', () => {
      const shortRestRec = {
        ...mockRecommendation,
        restTime: 30, // Under 60 second minimum
        suggestedReps: 10,
        suggestedSets: 3
      };
      
      const result = service.validateRecommendation(shortRestRec, shortRestRec.context);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.name.includes('Rest'))).toBe(true);
      expect(result.adjusted.restTime).toBeGreaterThanOrEqual(60);
    });

    it('should pass valid recommendations', () => {
      const validRec = {
        ...mockRecommendation,
        suggestedReps: 12, // Decrease
        suggestedSets: 3,  // Decrease  
        restTime: 90,      // Adequate rest
      };
      
      const result = service.validateRecommendation(validRec, validRec.context);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('safety level configuration', () => {
    it('should apply conservative defaults', () => {
      service.setSafetyLevel('conservative');
      const result = service.applySafetyDefaults(mockRecommendation, mockRecommendation.context);
      
      // Conservative level should be more restrictive
      expect(result.suggestedReps).toBeLessThanOrEqual(mockRecommendation.originalReps! * 0.9);
      expect(result.reasoning).toContain('Safety (Conservative)');
    });

    it('should apply moderate defaults', () => {
      service.setSafetyLevel('moderate');
      const result = service.applySafetyDefaults(mockRecommendation, mockRecommendation.context);
      
      // Moderate level allows slight increases but with safety rules
      expect(result.suggestedReps).toBeLessThanOrEqual(mockRecommendation.originalReps! * 1.15);
      expect(result.reasoning).toContain('Safety (Moderate)');
    });

    it('should apply progressive defaults', () => {
      service.setSafetyLevel('progressive');
      const result = service.applySafetyDefaults(mockRecommendation, mockRecommendation.context);
      
      // Progressive level allows more flexibility
      expect(result.suggestedReps).toBeLessThanOrEqual(mockRecommendation.originalReps! * 1.2);
      expect(result.reasoning).toContain('Safety (Progressive)');
    });
  });

  describe('context-aware safety', () => {
    it('should be more conservative when user is tired', () => {
      const tiredRec = {
        ...mockRecommendation,
        context: { ...mockRecommendation.context, energyLevel: 'tired' as const }
      };
      
      const result = service.applySafetyDefaults(tiredRec, tiredRec.context);
      expect(result.suggestedReps).toBeLessThan(tiredRec.originalReps!);
      expect(result.reasoning).toContain('fatigue');
    });

    it('should adjust for limited time', () => {
      const timeLimitedRec = {
        ...mockRecommendation,
        context: { ...mockRecommendation.context, timeRemaining: 200 } // 3.3 minutes
      };
      
      const result = service.applySafetyDefaults(timeLimitedRec, timeLimitedRec.context);
      if (timeLimitedRec.originalSets! > 2) {
        expect(result.suggestedSets).toBeLessThanOrEqual(Math.round(timeLimitedRec.originalSets! * 0.6));
      }
    });
  });

  describe('safety correction', () => {
    it('should correct unsafe recommendations', () => {
      const unsafeRec = {
        ...mockRecommendation,
        suggestedReps: 20, // Too high
        suggestedSets: 6,  // Too high
        restTime: 30       // Too low
      };
      
      const corrected = service.applySafetyDefaults(unsafeRec, unsafeRec.context);
      
      expect(corrected.suggestedReps).toBeLessThan(unsafeRec.suggestedReps);
      expect(corrected.suggestedSets).toBeLessThan(unsafeRec.suggestedSets);
      expect(corrected.restTime).toBeGreaterThan(unsafeRec.restTime);
    });

    it('should preserve safe recommendations', () => {
      const safeRec = {
        ...mockRecommendation,
        suggestedReps: 10, // Safe decrease
        suggestedSets: 3,  // Safe decrease
        restTime: 90       // Adequate rest
      };
      
      const corrected = service.applySafetyDefaults(safeRec, safeRec.context);
      
      // Should still apply safety level adjustments but keep it reasonable
      expect(corrected.suggestedReps).toBeGreaterThan(0);
      expect(corrected.suggestedSets).toBeGreaterThan(0);
    });
  });

  describe('performance requirements', () => {
    it('should validate safety within 2 seconds', async () => {
      const startTime = Date.now();
      
      service.validateRecommendation(mockRecommendation, mockRecommendation.context);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // 2 second requirement
    });

    it('should apply safety defaults within 2 seconds', async () => {
      const startTime = Date.now();
      
      service.applySafetyDefaults(mockRecommendation, mockRecommendation.context);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // 2 second requirement
    });
  });

  describe('privacy compliance', () => {
    it('should not include PII in safety validation', () => {
      const result = service.validateRecommendation(mockRecommendation, mockRecommendation.context);
      
      // Check that result structure doesn't contain user PII
      expect(Object.keys(result)).not.toContain('userId');
      expect(Object.keys(result)).not.toContain('personalInfo');
      expect(Object.keys(result.adjusted)).not.toContain('userId');
      expect(result.adjusted.exerciseName).toBeDefined(); // Exercise name is not PII
    });

    it('should process safety validation locally', () => {
      const originalConsole = console.log;
      const spy = vi.spyOn(console, 'log');
      
      service.applySafetyDefaults(mockRecommendation, mockRecommendation.context);
      
      // Should not make any external calls
      expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('http'));
      expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('api'));
      
      spy.mockRestore();
      console.log = originalConsole;
    });
  });

  describe('configuration management', () => {
    it('should update safety level', () => {
      service.setSafetyLevel('conservative');
      const config = service.getConfig();
      expect(config.currentLevel).toBe('conservative');
    });

    it('should toggle enabled state', () => {
      service.updateConfig({ enabled: false });
      const config = service.getConfig();
      expect(config.enabled).toBe(false);
    });

    it('should provide configuration snapshot', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('currentLevel');
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('customRules');
      expect(config).toHaveProperty('userOverrides');
    });

    it('should provide safety metrics', () => {
      const metrics = service.getSafetyMetrics();
      expect(metrics).toHaveProperty('totalRules');
      expect(metrics).toHaveProperty('activeRules');
      expect(metrics).toHaveProperty('overriddenRules');
      expect(metrics).toHaveProperty('currentLevel');
    });
  });

  describe('safety recommendations', () => {
    it('should provide context-aware safety recommendations', () => {
      const recommendations = service.getSafetyRecommendations(mockRecommendation.context);
      
      expect(recommendations).toHaveProperty('level');
      expect(recommendations).toHaveProperty('suggestions');
      expect(recommendations).toHaveProperty('reasoning');
      
      if (mockRecommendation.context.energyLevel === 'tired') {
        expect(recommendations.suggestions.some(s => s.includes('reducing'))).toBe(true);
      }
    });

    it('should provide available safety levels', () => {
      const levels = service.getAvailableSafetyLevels();
      expect(levels).toHaveLength(3);
      expect(levels[0].id).toBe('conservative');
      expect(levels[1].id).toBe('moderate');
      expect(levels[2].id).toBe('progressive');
    });
  });

  describe('rule management', () => {
    it('should add and remove custom rules', () => {
      const customRule = {
        id: 'test_rule',
        name: 'Test Rule',
        condition: vi.fn(),
        adjustment: vi.fn(),
        severity: 'low' as const
      };
      
      service.addCustomRule(customRule);
      expect(service.getConfig().customRules).toContain(customRule);
      
      service.removeCustomRule('test_rule');
      expect(service.getConfig().customRules).not.toContain(customRule);
    });

    it('should override specific rules', () => {
      service.overrideRule('max_intensity_cap', false);
      expect(service.isRuleOverridden('max_intensity_cap')).toBe(true);
      
      service.overrideRule('max_intensity_cap', true);
      expect(service.isRuleOverridden('max_intensity_cap')).toBe(false);
    });
  });

  describe('configuration persistence', () => {
    it('should reset to defaults', () => {
      service.setSafetyLevel('conservative');
      service.updateConfig({ enabled: false });
      
      service.resetToDefaults();
      
      const config = service.getConfig();
      expect(config.currentLevel).toBe('moderate');
      expect(config.enabled).toBe(true);
      expect(config.customRules).toHaveLength(0);
      expect(config.userOverrides).toEqual({});
    });
  });
});