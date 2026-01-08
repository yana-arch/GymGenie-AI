import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { InjuryValidationService } from '../services/InjuryValidationService';
import { InjuryFilterService } from '../services/InjuryFilterService';
import { DiscomfortMonitoringService } from '../services/DiscomfortMonitoringService';
import type { InjuryHistory, AIRecommendation } from '../types';

describe('Injury System Performance Tests', () => {
  let injuryValidationService: InjuryValidationService;
  let injuryFilterService: InjuryFilterService;
  let discomfortMonitoringService: DiscomfortMonitoringService;

  beforeAll(() => {
    injuryValidationService = new InjuryValidationService();
    injuryFilterService = new InjuryFilterService();
    discomfortMonitoringService = new DiscomfortMonitoringService();
  });

  afterAll(() => {
    // Clean up localStorage
    localStorage.clear();
  });

  describe('Injury Validation Performance', () => {
    it('should validate injury history within 2 seconds', async () => {
      // Create complex injury history for testing
      const complexInjuryHistory: InjuryHistory = {
        injuries: [
          {
            id: 'injury_1',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2024-01-01',
            status: 'recovering',
            restrictions: ['no_deep_squats', 'no_high_impact', 'no_jumping']
          },
          {
            id: 'injury_2',
            type: 'shoulder',
            location: 'right',
            severity: 'mild',
            date: '2024-01-15',
            status: 'recovered',
            restrictions: ['no_overhead_press']
          },
          {
            id: 'injury_3',
            type: 'back',
            location: 'lower',
            severity: 'severe',
            date: '2024-02-01',
            status: 'chronic',
            restrictions: ['no_heavy_lifting', 'no_deadlifts', 'no_squats']
          }
        ]
      };

      const startTime = performance.now();
      const result = await injuryValidationService.validateInjuryConstraints(complexInjuryHistory);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // 2 second requirement
      expect(result.isValid).toBe(true);
      expect(result.constraints).toBeDefined();
      expect(result.processingTime).toBeLessThan(2000);
    });

    it('should handle concurrent validation requests within 2 seconds', async () => {
      const injuryHistory: InjuryHistory = {
        injuries: [
          {
            id: 'injury_1',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2024-01-01',
            status: 'recovering',
            restrictions: ['no_deep_squats', 'no_high_impact']
          }
        ]
      };

      // Run 10 concurrent validations
      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, () => 
        injuryValidationService.validateInjuryConstraints(injuryHistory)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // All should complete within 2 seconds
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.processingTime).toBeLessThan(2000);
      });
    });

    it('should benefit from cache optimization on repeated validations', async () => {
      const injuryHistory: InjuryHistory = {
        injuries: [
          {
            id: 'injury_1',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2024-01-01',
            status: 'recovering',
            restrictions: ['no_deep_squats', 'no_high_impact']
          }
        ]
      };

      // First validation (cache miss)
      const startTime1 = performance.now();
      await injuryValidationService.validateInjuryConstraints(injuryHistory);
      const endTime1 = performance.now();
      const firstTime = endTime1 - startTime1;

      // Second validation (cache hit)
      const startTime2 = performance.now();
      await injuryValidationService.validateInjuryConstraints(injuryHistory);
      const endTime2 = performance.now();
      const secondTime = endTime2 - startTime2;

      // Cached validation should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5); // At least 50% faster
      expect(secondTime).toBeLessThan(500); // Should be very fast when cached
    });
  });

  describe('Recommendation Filtering Performance', () => {
    const largeRecommendationsList: AIRecommendation[] = Array.from({ length: 100 }, (_, i) => ({
      id: `exercise_${i}`,
      exercise: i % 10 === 0 ? 'jumping_jacks' : i % 10 === 1 ? 'deep_squats' : `Exercise ${i}`,
      variation: i % 2 === 0 ? 'standard' : 'modified',
      intensity: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'moderate' : 'low',
      restTime: 60 + (i % 5) * 30,
      equipment: i % 3 === 0 ? ['dumbbells'] : i % 2 === 0 ? ['barbell'] : ['bodyweight'],
      targetMuscles: i % 2 === 0 ? ['chest', 'triceps'] : ['legs', 'glutes']
    }));

    it('should filter 100 recommendations within 2 seconds', async () => {
      const constraints = {
        constraints: ['no_high_impact', 'no_deep_squats', 'no_heavy_lifting'],
        safetyLevel: 'conservative' as const,
        blockedMovements: ['jumping', 'deep_squats', 'deadlifts'],
        recommendedAlternatives: ['seated_exercises', 'upper_body_workout']
      };

      const startTime = performance.now();
      const result = await injuryFilterService.filterRecommendations(largeRecommendationsList, constraints);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // 2 second requirement
      expect(result.filtered).toBeDefined();
      expect(result.blocked).toBeDefined();
      expect(result.filtered.length + result.blocked.length).toBe(100);
    });

    it('should handle complex constraint filtering efficiently', async () => {
      const complexConstraints = {
        constraints: [
          'no_high_impact',
          'no_deep_squats',
          'no_overhead_press',
          'no_heavy_lifting',
          'no_jumping',
          'no_running',
          'no_deadlifts',
          'no_pull_ups',
          'no_lunges'
        ],
        safetyLevel: 'restricted' as const,
        blockedMovements: ['jumping', 'deep_squats', 'overhead_press', 'deadlifts', 'pull_ups', 'lunges'],
        recommendedAlternatives: ['seated_exercises', 'upper_body_workout', 'light_cardio']
      };

      const startTime = performance.now();
      const result = await injuryFilterService.filterRecommendations(
        largeRecommendationsList,
        complexConstraints
      );
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000);
      expect(result.blocked.length).toBeGreaterThan(0); // Should block some exercises
    });

    it('should handle rapid consecutive filtering requests', async () => {
      const constraints = {
        constraints: ['no_high_impact', 'no_deep_squats'],
        safetyLevel: 'conservative' as const,
        blockedMovements: ['jumping', 'deep_squats'],
        recommendedAlternatives: ['seated_exercises', 'upper_body_workout']
      };

      // Run 20 rapid filtering requests
      const startTime = performance.now();
      const promises = Array.from({ length: 20 }, () => 
        injuryFilterService.filterRecommendations(largeRecommendationsList, constraints)
      );
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // All should complete within 2 seconds
      expect(results).toHaveLength(20);
    });
  });

  describe('Discomfort Monitoring Performance', () => {
    it('should record discomfort events within 500ms', async () => {
      const discomfortData = {
        location: 'left_knee',
        severity: 3 as const,
        description: 'Moderate discomfort during squats',
        exercise: 'squats',
        triggers: ['deep_squat_position']
      };

      const startTime = performance.now();
      const result = await discomfortMonitoringService.recordDiscomfort(discomfortData);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(500); // 500ms requirement
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.location).toBe('left_knee');
      expect(result.severity).toBe(3);
    });

    it('should analyze discomfort patterns within 500ms', async () => {
      // Clear previous history to ensure exact frequency
      await discomfortMonitoringService.clearDiscomfortHistory();
      
      // First, record some discomfort events
      await discomfortMonitoringService.recordDiscomfort({
        location: 'left_knee',
        severity: 3,
        description: 'Discomfort during squats',
        exercise: 'squats'
      });

      await discomfortMonitoringService.recordDiscomfort({
        location: 'left_knee',
        severity: 4,
        description: 'Severe discomfort during lunges',
        exercise: 'lunges'
      });

      const startTime = performance.now();
      const pattern = await discomfortMonitoringService.analyzeDiscomfortPatterns('left_knee');
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(500); // 500ms requirement
      expect(pattern.location).toBe('left_knee');
      expect(pattern.frequency).toBe(2);
      expect(pattern.averageSeverity).toBeGreaterThan(0);
    });

    it('should handle severe discomfort with immediate response within 500ms', async () => {
      const severeDiscomfortData = {
        location: 'right_ankle',
        severity: 5 as const,
        description: 'Severe pain during running',
        exercise: 'running',
        triggers: ['high_impact']
      };

      const startTime = performance.now();
      const result = await discomfortMonitoringService.recordDiscomfort(severeDiscomfortData);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(500); // 500ms requirement
      expect(result.requiresImmediateResponse).toBe(true);
      expect(result.severity).toBe(5);
    });
  });

  describe('End-to-End Integration Performance', () => {
    it('should complete full injury-aware workflow within 2 seconds', async () => {
      const injuryHistory: InjuryHistory = {
        injuries: [
          {
            id: 'injury_1',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2024-01-01',
            status: 'recovering',
            restrictions: ['no_deep_squats', 'no_high_impact', 'no_jumping']
          }
        ]
      };

      const recommendations: AIRecommendation[] = [
        { id: '1', exercise: 'squats', variation: 'deep', intensity: 'high' },
        { id: '2', exercise: 'jumping_jacks', variation: 'standard', intensity: 'moderate' },
        { id: '3', exercise: 'lunges', variation: 'deep', intensity: 'moderate' },
        { id: '4', exercise: 'leg_press', variation: 'standard', intensity: 'low' },
        { id: '5', exercise: 'calf_raises', variation: 'bodyweight', intensity: 'low' }
      ];

      const startTime = performance.now();

      // Step 1: Validate injury history
      const validationResult = await injuryValidationService.validateInjuryConstraints(injuryHistory);

      // Step 2: Filter recommendations
      const filterResult = await injuryFilterService.filterRecommendations(
        recommendations,
        validationResult.constraints
      );

      // Step 3: Record discomfort for blocked exercise
      await discomfortMonitoringService.recordDiscomfort({
        location: 'left_knee',
        severity: 4,
        description: 'Pain during squats',
        exercise: 'squats'
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Complete workflow within 2 seconds
      expect(validationResult.isValid).toBe(true);
      expect(filterResult.blocked.length).toBeGreaterThan(0);
      expect(filterResult.filtered.length).toBeGreaterThan(0);
    });

    it('should maintain performance under load', async () => {
      const injuryHistory: InjuryHistory = {
        injuries: [
          {
            id: 'injury_1',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2024-01-01',
            status: 'recovering',
            restrictions: ['no_deep_squats', 'no_high_impact']
          }
        ]
      };

      const recommendations: AIRecommendation[] = Array.from({ length: 50 }, (_, i) => ({
        id: `exercise_${i}`,
        exercise: `Exercise ${i}`,
        variation: 'standard',
        intensity: 'moderate'
      }));

      // Simulate 10 users performing simultaneous operations
      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, async () => {
        // Each user validates injury history and filters recommendations
        const validation = await injuryValidationService.validateInjuryConstraints(injuryHistory);
        return await injuryFilterService.filterRecommendations(
          recommendations,
          validation.constraints
        );
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // All concurrent operations within 2 seconds
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.filtered).toBeDefined();
        expect(result.blocked).toBeDefined();
      });
    });
  });

  describe('Memory and Resource Performance', () => {
    it('should maintain reasonable memory usage during large operations', async () => {
      const largeInjuryHistory: InjuryHistory = {
        injuries: Array.from({ length: 100 }, (_, i) => ({
          id: `injury_${i}`,
          type: ['knee', 'shoulder', 'back', 'ankle'][i % 4] as any,
          location: ['left', 'right', 'center'][i % 3] as any,
          severity: ['mild', 'moderate', 'severe'][i % 3] as any,
          date: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
          status: ['recovering', 'recovered', 'chronic'][i % 3] as any,
          restrictions: ['no_high_impact', 'no_deep_squats', 'no_heavy_lifting']
        }))
      };

      const largeRecommendations: AIRecommendation[] = Array.from({ length: 200 }, (_, i) => ({
        id: `exercise_${i}`,
        exercise: `Exercise ${i}`,
        variation: 'standard',
        intensity: 'moderate'
      }));

      // Monitor memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const startTime = performance.now();
      const validation = await injuryValidationService.validateInjuryConstraints(largeInjuryHistory);
      const filtering = await injuryFilterService.filterRecommendations(
        largeRecommendations,
        validation.constraints
      );
      const endTime = performance.now();

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(endTime - startTime).toBeLessThan(2000);
      expect(validation.isValid).toBe(true);
      expect(filtering.filtered.length + filtering.blocked.length).toBe(200);
      
      // Memory increase should be reasonable (less than 10MB for this test)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });
});