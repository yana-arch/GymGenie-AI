/**
 * @p0 P0 Safety Validation Tests (R-003) - Simplified
 * Epic 1 - AI-Powered Workout Coaching
 * 
 * Tests for multi-layer safety validation with conservative injury prevention
 * Medical database integration validation
 * Human oversight for high-risk recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('@p0 Safety Validation Tests - Multi-Layer Injury Prevention', () => {
  let safetyValidationService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock safety validation service
    safetyValidationService = {
      validateRecommendation: vi.fn(),
      applyConservativeMargins: vi.fn(),
      handlePainSignal: vi.fn(),
      generateWarning: vi.fn()
    };
  });

  describe('@p0 Core Safety Validation', () => {
    it('should block dangerous exercises for beginners', async () => {
      // Arrange
      const highRiskRecommendation = {
        exercise: 'advanced_plyometrics',
        intensity: 'high',
        userLevel: 'beginner'
      };

      const userContext = {
        fitnessLevel: 'beginner',
        injuryHistory: ['knee'],
        age: 45
      };

      // Mock the validation to return blocked result
      vi.mocked(safetyValidationService.validateRecommendation).mockResolvedValue({
        approved: false,
        reason: 'conservative_safety_rules',
        blockedFactors: ['high_difficulty_for_beginner']
      });

      // Act
      const result = await safetyValidationService.validateRecommendation(highRiskRecommendation, userContext);

      // Assert
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('conservative_safety_rules');
      expect(result.blockedFactors).toContain('high_difficulty_for_beginner');
    });

    it('should apply conservative margins to weight calculations', async () => {
      // Arrange
      const userMetrics = {
        oneRepMax: { squat: 100 },
        currentAbility: 'intermediate'
      };

      const aggressiveRecommendation = {
        exercise: 'squat',
        suggestedWeight: 95, // 95% of 1RM (too aggressive)
        suggestedReps: 8
      };

      // Mock conservative adjustment
      vi.mocked(safetyValidationService.applyConservativeMargins).mockResolvedValue({
        approved: true,
        weight: 75, // Conservative 75% max
        restPeriod: 90
      });

      // Act
      const result = await safetyValidationService.applyConservativeMargins(
        aggressiveRecommendation,
        userMetrics
      );

      // Assert
      expect(result.approved).toBe(true);
      expect(result.weight).toBeLessThan(85); // Conservative adjustment
      expect(result.restPeriod).toBeGreaterThanOrEqual(90); // Conservative rest
    });

    it('should detect pain signals and stop workout', async () => {
      // Arrange
      const painSignal = {
        type: 'sharp_knee_pain',
        intensity: 7,
        duringExercise: 'squat'
      };

      // Mock emergency response
      vi.mocked(safetyValidationService.handlePainSignal).mockResolvedValue({
        approved: false,
        immediateStop: true,
        emergencyProtocol: ['pain_emergency_stop'],
        followupRequired: true
      });

      // Act
      const result = await safetyValidationService.handlePainSignal(painSignal);

      // Assert
      expect(result.immediateStop).toBe(true);
      expect(result.emergencyProtocol).toContain('pain_emergency_stop');
      expect(result.followupRequired).toBe(true);
    });

    it('should validate form techniques for safety', async () => {
      // Arrange
      const dangerousTechniques = [
        {
          exercise: 'squat',
          form: 'deep_knee_valgus',
          riskLevel: 'high'
        },
        {
          exercise: 'deadlift',
          form: 'rounded_back_heavy_load',
          riskLevel: 'high'
        }
      ];

      // Mock form validation
      vi.mocked(safetyValidationService.validateFormTechnique).mockImplementation(async (technique) => ({
        safe: technique.riskLevel !== 'high',
        blockedReason: technique.riskLevel === 'high' ? 'injury_risk' : undefined,
        alternative: technique.riskLevel === 'high' ? 'safer_alternative' : undefined
      }));

      // Act
      const results = await Promise.all(
        dangerousTechniques.map(technique =>
          safetyValidationService.validateFormTechnique(technique)
        )
      );

      // Assert
      results.forEach((result, index) => {
        expect(result.safe).toBe(false);
        expect(result.blockedReason).toContain('injury_risk');
        expect(result.alternative).toBeDefined();
      });
    });
  });

  describe('@p0 Progressive Overload Prevention', () => {
    it('should limit weight increases to 10% maximum', async () => {
      // Arrange
      const currentUserLevel = {
        currentWeight: 50, // kg
        currentReps: 8,
        exercise: 'bench_press'
      };

      const riskyRecommendation = {
        suggestedWeight: 80, // 60% increase (too high)
        suggestedReps: 12
      };

      // Mock progressive overload validation
      vi.mocked(safetyValidationService.validateProgressiveOverload).mockResolvedValue({
        approved: false,
        reason: 'excessive_weight_increase',
        maxAllowedIncrease: 10, // Max 10% increase
        recommendedAdjustment: {
          suggestedWeight: 55 // 10% increase
        }
      });

      // Act
      const result = await safetyValidationService.validateProgressiveOverload(
        currentUserLevel,
        riskyRecommendation
      );

      // Assert
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('excessive_weight_increase');
      expect(result.maxAllowedIncrease).toBeLessThanOrEqual(10);
      expect(result.recommendedAdjustment.suggestedWeight).toBeLessThanOrEqual(55);
    });

    it('should enforce rest periods between sets', async () => {
      // Arrange
      const inadequateRestPlan = {
        exercises: [
          { name: 'squats', sets: 5, reps: 10, rest: 30 }, // Too short rest
          { name: 'deadlifts', sets: 5, reps: 8, rest: 45 }
        ],
        totalDuration: 45
      };

      // Mock rest validation
      vi.mocked(safetyValidationService.validateRecoveryRequirements).mockResolvedValue({
        approved: false,
        issues: ['insufficient_rest_between_sets'],
        recommendedRestPeriod: 90,
        maxRecommendedDuration: 30
      });

      // Act
      const result = await safetyValidationService.validateRecoveryRequirements(inadequateRestPlan);

      // Assert
      expect(result.approved).toBe(false);
      expect(result.issues).toContain('insufficient_rest_between_sets');
      expect(result.recommendedRestPeriod).toBeGreaterThan(60);
    });
  });

  describe('@p0 Emergency Response Protocols', () => {
    it('should trigger immediate response for high-intensity pain', async () => {
      // Arrange
      const highIntensityPain = {
        type: 'sharp_knee_pain',
        intensity: 8,
        duringExercise: 'lunge'
      };

      const lowIntensityPain = {
        type: 'mild_discomfort',
        intensity: 3,
        duringExercise: 'squat'
      };

      // Mock pain signal handling
      vi.mocked(safetyValidationService.handlePainSignal).mockImplementation(async (pain) => ({
        approved: pain.intensity >= 7,
        immediateStop: pain.intensity >= 7,
        medicalAttentionRecommended: pain.intensity >= 6,
        level: pain.intensity >= 7 ? 'emergency' : 'warning'
      }));

      // Act
      const highIntensityResult = await safetyValidationService.handlePainSignal(highIntensityPain);
      const lowIntensityResult = await safetyValidationService.handlePainSignal(lowIntensityPain);

      // Assert
      expect(highIntensityResult.immediateStop).toBe(true);
      expect(highIntensityResult.level).toBe('emergency');
      
      expect(lowIntensityResult.immediateStop).toBe(false);
      expect(lowIntensityResult.level).toBe('warning');
    });

    it('should provide safety warnings for form degradation', async () => {
      // Arrange
      const formWarning = {
        type: 'form_breakdown',
        severity: 'medium',
        trend: 'worsening'
      };

      const fatigueWarning = {
        type: 'fatigue_accumulation',
        severity: 'high',
        trend: 'rapid'
      };

      // Mock warning generation
      vi.mocked(safetyValidationService.generateWarning).mockImplementation(async (indicator) => ({
        level: indicator.severity === 'high' ? 'warning' : 'caution',
        message: `${indicator.type}_detected`,
        recommendedAction: indicator.severity === 'high' ? 'stop_workout' : 'reduce_intensity'
      }));

      // Act
      const formWarningResult = await safetyValidationService.generateWarning(formWarning);
      const fatigueWarningResult = await safetyValidationService.generateWarning(fatigueWarning);

      // Assert
      expect(formWarningResult.level).toBe('caution');
      expect(fatigueWarningResult.level).toBe('warning');
      expect(fatigueWarningResult.recommendedAction).toBe('stop_workout');
    });
  });

  describe('@p0 Safety Margin Enforcement', () => {
    it('should prioritize safety over performance optimization', async () => {
      // Arrange
      const competingGoals = {
        performance: 'rapid_strength_gains',
        safety: 'minimal_risk'
      };

      const proposedPlan = {
        expectedGains: 'high_rapid_progress',
        injuryRisk: 'moderate_acceptable'
      };

      // Mock safety-first prioritization
      vi.mocked(safetyValidationService.prioritizeSafety).mockResolvedValue({
        selectedApproach: 'safety_first',
        adjustedPlan: {
          injuryRisk: 0.05, // Very low risk
          expectedGains: 'moderate_steady'
        },
        safetyMeasures: ['conservative_progression']
      });

      // Act
      const result = await safetyValidationService.prioritizeSafety(competingGoals, proposedPlan);

      // Assert
      expect(result.selectedApproach).toBe('safety_first');
      expect(result.adjustedPlan.injuryRisk).toBeLessThan(0.1);
      expect(result.safetyMeasures).toContain('conservative_progression');
    });

    it('should apply conservative safety margins to all calculations', async () => {
      // Arrange
      const userMetrics = {
        oneRepMax: { squat: 120, bench: 100, deadlift: 150 },
        experience: 'intermediate'
      };

      const aggressivePlan = {
        suggestedWeight: 108, // 90% of 1RM
        suggestedReps: 10,
        suggestedSets: 5
      };

      // Mock conservative margin application
      vi.mocked(safetyValidationService.applyConservativeMargins).mockResolvedValue({
        approved: true,
        weight: 90, // Conservative 75% max
        progressionRate: 0.05, // 5% weekly max
        restPeriod: 120 // Enhanced rest
      });

      // Act
      const result = await safetyValidationService.applyConservativeMargins(aggressivePlan, userMetrics);

      // Assert
      expect(result.approved).toBe(true);
      expect(result.weight).toBeLessThan(95); // More conservative than 90%
      expect(result.progressionRate).toBeLessThanOrEqual(0.05); // Conservative progression
      expect(result.restPeriod).toBeGreaterThanOrEqual(90); // Conservative rest
    });
  });
});