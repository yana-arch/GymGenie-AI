/**
 * Integrated Safety Validator Tests
 * Tests for comprehensive safety validation across all AI systems
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegratedSafetyValidator } from '../IntegratedSafetyValidator';
import { CoachingPriority, AICoachingInput, CoachingDecision } from '../types/unifiedCoaching.types';

describe('IntegratedSafetyValidator', () => {
  let validator: IntegratedSafetyValidator;

  beforeEach(() => {
    validator = new IntegratedSafetyValidator();
    validator.clearValidationHistory();
  });

  describe('Comprehensive Safety Validation', () => {
    it('should validate safety-critical recommendations with highest priority', async () => {
      const safetyInput: AICoachingInput = {
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 0.95,
          recommendation: {
            action: 'stop',
            reason: 'form-breakdown-detected'
          },
          reasoning: 'Critical safety issue detected',
          timestamp: Date.now()
        }
      };

      const result = await validator.validateCoachingDecision(safetyInput);

      expect(result.isValid).toBe(true);
      expect(result.safetyScore).toBeGreaterThanOrEqual(0.9);
      expect(result.violations).toHaveLength(0);
      expect(result.adjustedInput.response.recommendation.action).toBe('stop');
    });

    it('should detect safety violations in adaptation recommendations', async () => {
      const adaptationInput: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.8,
          recommendation: {
            action: 'increase_weight',
            weight: 200,
            reps: 15,
            sets: 5,
            restTime: 30
          },
          reasoning: 'Performance improvement',
          timestamp: Date.now()
        }
      };

      const result = await validator.validateCoachingDecision(adaptationInput);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.severity === 'high')).toBe(true);
    });

    it('should apply safety adjustments when violations found', async () => {
      const input: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.8,
          recommendation: {
            action: 'increase_intensity',
            suggestedReps: 12,
            suggestedSets: 6,
            restTime: 45
          },
          reasoning: 'Increasing difficulty',
          timestamp: Date.now()
        }
      };

      const result = await validator.validateCoachingDecision(input);

      // Rest time should be increased (below minimum 60s)
      expect(result.adjustedInput.response.recommendation.restTime).toBeGreaterThanOrEqual(60);
      // Sets should be reduced (exceeds maximum 6)
      expect(result.adjustedInput.response.recommendation.suggestedSets).toBeLessThanOrEqual(6);
      expect(result.adjustedInput.response.reasoning.toLowerCase()).toContain('safety');
    });

    it('should prioritize safety over all other priorities', async () => {
      const inputs: AICoachingInput[] = [
        {
          system: 'realtime-adaptations',
          priority: CoachingPriority.ADAPTATION,
          response: {
            type: 'adaptation',
            confidence: 0.9,
            recommendation: { action: 'increase_intensity', suggestedReps: 10 },
            reasoning: 'Performance boost',
            timestamp: Date.now()
          }
        },
        {
          system: 'safety-override',
          priority: CoachingPriority.SAFETY,
          response: {
            type: 'safety-intervention',
            confidence: 0.95,
            recommendation: { action: 'stop', reason: 'injury-risk' },
            reasoning: 'Critical safety',
            timestamp: Date.now()
          }
        }
      ];

      const result = await validator.validateAgainstSafety(inputs);

      expect(result.isSafe).toBe(true);
      expect(result.primaryDecision.system).toBe('safety-override');
      expect(result.safetyOverrides).toBe(1);
    });
  });

  describe('Safety-First Coaching Decision Overrides', () => {
    it('should override low-priority decisions when safety is at risk', async () => {
      const adaptationInput: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.9,
          recommendation: { action: 'increase_weight', weight: 150 },
          reasoning: 'Performance',
          timestamp: Date.now()
        }
      };

      const safetyInput: AICoachingInput = {
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 0.95,
          recommendation: { action: 'pause', reason: 'fatigue' },
          reasoning: 'Safety intervention',
          timestamp: Date.now()
        }
      };

      const result = await validator.applySafetyOverride({
        primary: adaptationInput,
        safetyOverride: safetyInput
      });

      expect(result.response.recommendation.action).toBe('pause');
      expect(result.overrideReasoning).toContain('safety');
      expect(result.originalAction).toBe('increase_weight');
    });

    it('should maintain injury-aware decisions when safety not at risk', async () => {
      const input: AICoachingInput = {
        system: 'injury-aware',
        priority: CoachingPriority.INJURY,
        response: {
          type: 'injury-adaptation',
          confidence: 0.9,
          recommendation: {
            action: 'modify_exercise',
            modification: 'reduce_range_of_motion'
          },
          reasoning: 'Injury consideration',
          timestamp: Date.now()
        }
      };

      const result = await validator.validateCoachingDecision(input);

      expect(result.isValid).toBe(true);
      expect(result.adjustedInput.system).toBe('injury-aware');
      expect(result.adjustedInput.priority).toBe(CoachingPriority.INJURY);
    });

    it('should apply safety overrides with user notification', async () => {
      const primaryInput: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.85,
          recommendation: { action: 'continue', intensity: 'high' },
          reasoning: 'Continue workout',
          timestamp: Date.now()
        }
      };

      const safetyInput: AICoachingInput = {
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 0.95,
          recommendation: { action: 'pause', reason: 'high_heart_rate' },
          reasoning: 'Safety intervention',
          timestamp: Date.now()
        }
      };

      const result = await validator.applySafetyOverride({
        primary: primaryInput,
        safetyOverride: safetyInput
      });

      expect(result.userNotification).toBeDefined();
      expect(result.userNotification.message.toLowerCase()).toContain('safety');
      expect(result.userNotification.severity).toBe('high');
    });
  });

  describe('Safety Validation Reporting and User Transparency', () => {
    it('should generate comprehensive safety reports', async () => {
      const input: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.8,
          recommendation: { action: 'increase_intensity', suggestedReps: 15 },
          reasoning: 'Performance',
          timestamp: Date.now()
        }
      };

      await validator.validateCoachingDecision(input);
      const report = validator.getSafetyReport();

      expect(report).toBeDefined();
      expect(report.totalValidations).toBeGreaterThan(0);
      expect(report.safetyViolations).toBeDefined();
      expect(report.totalOverrides).toBeDefined();
    });

    it('should track validation history for transparency', async () => {
      const inputs: AICoachingInput[] = [
        {
          system: 'safety-override',
          priority: CoachingPriority.SAFETY,
          response: {
            type: 'safety-intervention',
            confidence: 0.95,
            recommendation: { action: 'stop' },
            reasoning: 'Safety',
            timestamp: Date.now()
          }
        },
        {
          system: 'injury-aware',
          priority: CoachingPriority.INJURY,
          response: {
            type: 'injury-adaptation',
            confidence: 0.9,
            recommendation: { action: 'modify' },
            reasoning: 'Injury',
            timestamp: Date.now()
          }
        }
      ];

      for (const input of inputs) {
        await validator.validateCoachingDecision(input);
      }

      const history = validator.getValidationHistory();

      expect(history).toHaveLength(2);
      expect(history[0].safetyScore).toBeDefined();
      expect(history[0].isValid).toBeDefined();
      expect(history[0].timestamp).toBeDefined();
    });

    it('should provide clear explanations for safety decisions', async () => {
      const input: AICoachingInput = {
        system: 'realtime-adaptations',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.85,
          recommendation: {
            action: 'increase_weight',
            weight: 200,
            reps: 20
          },
          reasoning: 'Performance',
          timestamp: Date.now()
        }
      };

      const result = await validator.validateCoachingDecision(input);

      expect(result.explanation).toBeDefined();
      expect(result.explanation).toContain('safety');
      expect(result.explanation.length).toBeGreaterThan(20);
    });

    it('should allow users to access safety audit logs', async () => {
      const input: AICoachingInput = {
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 0.95,
          recommendation: { action: 'pause' },
          reasoning: 'Safety',
          timestamp: Date.now()
        }
      };

      await validator.validateCoachingDecision(input);
      const auditLogs = validator.getAuditLogs();

      expect(auditLogs).toBeDefined();
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBeDefined();
      expect(auditLogs[0].timestamp).toBeDefined();
    });
  });

  describe('Multi-System Safety Integration', () => {
    it('should validate all AI systems together', async () => {
      const inputs: AICoachingInput[] = [
        {
          system: 'realtime-adaptations',
          priority: CoachingPriority.ADAPTATION,
          response: {
            type: 'adaptation',
            confidence: 0.8,
            recommendation: { action: 'increase_intensity' },
            reasoning: 'Performance',
            timestamp: Date.now()
          }
        },
        {
          system: 'form-correction',
          priority: CoachingPriority.FORM,
          response: {
            type: 'form-correction',
            confidence: 0.9,
            recommendation: { action: 'reduce_weight' },
            reasoning: 'Form issue',
            timestamp: Date.now()
          }
        },
        {
          system: 'injury-aware',
          priority: CoachingPriority.INJURY,
          response: {
            type: 'injury-adaptation',
            confidence: 0.95,
            recommendation: { action: 'modify_exercise' },
            reasoning: 'Injury',
            timestamp: Date.now()
          }
        }
      ];

      const result = await validator.validateAgainstSafety(inputs);

      expect(result.isSafe).toBe(true);
      expect(result.systemsValidated).toBe(3);
      expect(result.compositeSafetyScore).toBeDefined();
    });

    it('should detect conflicts between safety systems', async () => {
      const inputs: AICoachingInput[] = [
        {
          system: 'safety-override',
          priority: CoachingPriority.SAFETY,
          response: {
            type: 'safety-intervention',
            confidence: 0.9,
            recommendation: { action: 'stop', reason: 'fatigue' },
            reasoning: 'Safety',
            timestamp: Date.now()
          }
        },
        {
          system: 'form-correction',
          priority: CoachingPriority.FORM,
          response: {
            type: 'form-correction',
            confidence: 0.95,
            recommendation: { action: 'continue', reason: 'form_good' },
            reasoning: 'Form',
            timestamp: Date.now()
          }
        }
      ];

      const result = await validator.validateAgainstSafety(inputs);

      expect(result.conflictsDetected).toBeGreaterThan(0);
      expect(result.resolutionStrategy).toBeDefined();
      expect(result.primaryDecision.priority).toBe(CoachingPriority.SAFETY);
    });

    it('should handle graceful degradation when AI systems fail', async () => {
      const result = await validator.handleSystemFailure({
        system: 'realtime-adaptations',
        error: 'TensorFlow.js model failed to load'
      });

      expect(result).toBeDefined();
      expect(result.response.recommendation.action).toBe('pause');
      expect(result.response.recommendation.message).toContain('error');
      expect(result.metadata.error).toBeDefined();
    });
  });

  describe('Performance and Efficiency', () => {
    it('should validate decisions within performance requirements', async () => {
      const input: AICoachingInput = {
        system: 'safety-override',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'safety-intervention',
          confidence: 0.95,
          recommendation: { action: 'stop' },
          reasoning: 'Safety',
          timestamp: Date.now()
        }
      };

      const startTime = performance.now();
      await validator.validateCoachingDecision(input);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(500); // Safety validations should be fast
    });

    it('should maintain validation history within memory limits', async () => {
      const inputs: AICoachingInput[] = Array.from({ length: 100 }, (_, i) => ({
        system: 'test-system',
        priority: CoachingPriority.ADAPTATION,
        response: {
          type: 'adaptation',
          confidence: 0.8,
          recommendation: { action: 'test' },
          reasoning: 'Test',
          timestamp: Date.now()
        }
      }));

      for (const input of inputs) {
        await validator.validateCoachingDecision(input);
      }

      const history = validator.getValidationHistory();
      expect(history.length).toBeLessThanOrEqual(1000); // Should have reasonable limits
    });
  });
});
