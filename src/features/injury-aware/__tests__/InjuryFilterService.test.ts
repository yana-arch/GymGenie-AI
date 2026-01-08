import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InjuryFilterService } from '../services/InjuryFilterService';
import type { AIRecommendation, InjuryConstraints } from '../types';

describe('InjuryFilterService', () => {
  let service: InjuryFilterService;

  beforeEach(() => {
    service = new InjuryFilterService();
  });

  describe('AI Recommendation Filtering', () => {
    it('should filter recommendations against injury constraints', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'deep_squats',
          variation: 'full_range',
          intensity: 'high'
        },
        {
          id: '2',
          exercise: 'pushups',
          variation: 'standard',
          intensity: 'moderate'
        },
        {
          id: '3',
          exercise: 'jumping_jacks',
          variation: 'standard',
          intensity: 'high'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: ['no_deep_squats', 'no_high_impact'],
        safetyLevel: 'conservative',
        blockedMovements: ['deep_squats', 'jumping'],
        recommendedAlternatives: ['partial_squats', 'seated_exercises']
      };

      const result = await service.filterRecommendations(recommendations, constraints);
      
      expect(result.filtered).toHaveLength(1);
      expect(result.filtered[0].exercise).toBe('pushups');
      expect(result.blocked).toHaveLength(2);
      expect(result.blocked[0].reason).toContain('injury');
    });

    it('should apply conservative safety defaults', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'overhead_press',
          variation: 'standard',
          intensity: 'high'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: [],
        safetyLevel: 'restricted',
        blockedMovements: [],
        recommendedAlternatives: []
      };

      const result = await service.filterRecommendations(recommendations, constraints);
      
      expect(result.filtered).toHaveLength(0);
      expect(result.blocked).toHaveLength(1);
      expect(result.blocked[0].severity).toBe('high');
    });

    it('should recommend alternatives for blocked exercises', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'deep_squats',
          variation: 'full_range',
          intensity: 'high'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: ['no_deep_squats'],
        safetyLevel: 'conservative',
        blockedMovements: ['deep_squats'],
        recommendedAlternatives: ['partial_squats', 'wall_sits']
      };

      const result = await service.filterRecommendations(recommendations, constraints);
      
      expect(result.suggestions).toContain('partial_squats');
      expect(result.suggestions).toContain('wall_sits');
    });
  });

  describe('Conservative Safety Application', () => {
    it('should reduce intensity for high-risk scenarios', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'squats',
          variation: 'standard',
          intensity: 'high'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: [],
        safetyLevel: 'conservative',
        blockedMovements: [],
        recommendedAlternatives: []
      };

      const result = await service.applyConservativeDefaults(recommendations, constraints);
      
      expect(result[0].intensity).toBe('moderate');
    });

    it('should increase rest times for injury-prone users', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'lunges',
          variation: 'standard',
          intensity: 'moderate'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: ['no_high_impact'],
        safetyLevel: 'restricted',
        blockedMovements: [],
        recommendedAlternatives: []
      };

      const result = await service.applyConservativeDefaults(recommendations, constraints);
      
      expect(result[0].restTime).toBeGreaterThan(60); // Increased rest time
    });
  });

  describe('Integration with Existing Systems', () => {
    it('should integrate with existing AI coaching systems', async () => {
      const mockAIService = {
        generateRecommendations: vi.fn().mockResolvedValue([
          {
            id: '1',
            exercise: 'deadlifts',
            variation: 'conventional',
            intensity: 'high'
          }
        ])
      };

      const constraints: InjuryConstraints = {
        constraints: ['no_heavy_lifting'],
        safetyLevel: 'restricted',
        blockedMovements: ['deadlifts'],
        recommendedAlternatives: ['rack_pulls']
      };

      const result = await service.filterAIRecommendations(mockAIService, constraints);
      
      expect(result.blocked).toHaveLength(1);
      expect(result.blocked[0].recommendation.exercise).toBe('deadlifts');
    });

    it('should maintain compatibility with form correction system', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'pushups',
          variation: 'standard',
          intensity: 'moderate'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: [],
        safetyLevel: 'normal',
        blockedMovements: [],
        recommendedAlternatives: []
      };

      const result = await service.filterRecommendations(recommendations, constraints);
      
      // Should not interfere with form correction safe exercises
      expect(result.filtered).toHaveLength(1);
      expect(result.filtered[0].exercise).toBe('pushups');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete filtering within 2-second requirement', async () => {
      const recommendations: AIRecommendation[] = Array(100).fill({
        exercise: 'test_exercise',
        variation: 'standard',
        intensity: 'moderate'
      }).map((rec, index) => ({ ...rec, id: index.toString() }));

      const constraints: InjuryConstraints = {
        constraints: ['no_test_exercise'],
        safetyLevel: 'conservative',
        blockedMovements: ['test_exercise'],
        recommendedAlternatives: []
      };

      const startTime = Date.now();
      await service.filterRecommendations(recommendations, constraints);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000);
    });
  });

  describe('Local Processing Compliance', () => {
    it('should perform all filtering locally', async () => {
      const recommendations: AIRecommendation[] = [
        {
          id: '1',
          exercise: 'test_exercise',
          variation: 'standard',
          intensity: 'moderate'
        }
      ];

      const constraints: InjuryConstraints = {
        constraints: [],
        safetyLevel: 'normal',
        blockedMovements: [],
        recommendedAlternatives: []
      };

      const fetchSpy = vi.spyOn(global, 'fetch');
      
      await service.filterRecommendations(recommendations, constraints);
      
      expect(fetchSpy).not.toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });
  });
});
