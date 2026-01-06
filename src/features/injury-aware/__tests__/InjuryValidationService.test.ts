import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InjuryValidationService } from '../services/InjuryValidationService';
import type { InjuryHistory, AIRecommendation } from '../types';

describe('InjuryValidationService', () => {
  let service: InjuryValidationService;

  beforeEach(() => {
    service = new InjuryValidationService();
  });

  describe('Injury History Validation', () => {
    it('should validate injury history and return constraints', async () => {
      // This test should fail initially since we haven't implemented the service
      const injuryHistory = {
        injuries: [
          {
            id: 'knee-left-2023',
            type: 'knee',
            location: 'left',
            severity: 'moderate',
            date: '2023-06-15',
            status: 'recovering',
            restrictions: ['deep_squats', 'jumping', 'high_impact']
          }
        ]
      };

      const result = await service.validateInjuryConstraints(injuryHistory);
      
      expect(result).toBeDefined();
      expect(result.constraints.constraints).toContain('no_high_impact');
      expect(result.constraints.safetyLevel).toBe('conservative');
    });

    it('should reject invalid injury data', async () => {
      const invalidInjuryHistory = {
        injuries: [
          {
            // Missing required fields
            type: 'knee'
          }
        ]
      };

      await expect(service.validateInjuryConstraints(invalidInjuryHistory))
        .rejects.toThrow('Invalid injury data');
    });

    it('should handle empty injury history', async () => {
      const emptyHistory = { injuries: [] };
      
      const result = await service.validateInjuryConstraints(emptyHistory);
      
      expect(result.constraints.constraints).toEqual([]);
      expect(result.constraints.safetyLevel).toBe('normal');
    });
  });

  describe('AI Recommendation Filtering', () => {
    it('should filter AI recommendations against injury constraints', async () => {
      const constraints = ['no_deep_squats', 'no_high_impact'];
      const recommendations = [
        {
          id: '1',
          exercise: 'squats',
          variation: 'deep',
          intensity: 'high' as const
        },
        {
          id: '2', 
          exercise: 'pushups',
          variation: 'standard',
          intensity: 'moderate' as const
        }
      ];

      const result = await service.filterRecommendations(recommendations, constraints);
      
      expect(result.filtered.length).toBe(1);
      expect(result.filtered[0].exercise).toBe('pushups');
      expect(result.blocked.length).toBe(1);
      expect(result.blocked[0].reason).toContain('injury');
    });
  });

  describe('Local Storage Compliance', () => {
    it('should store injury data locally only', async () => {
      const injuryHistory = {
        injuries: [
          {
            id: 'shoulder-right-2023',
            type: 'shoulder',
            location: 'right',
            severity: 'mild',
            date: '2023-08-20',
            status: 'recovered',
            restrictions: ['overhead_press']
          }
        ]
      };

      // Mock localStorage to verify local-only storage
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      await service.storeInjuryHistory(injuryHistory);
      
      expect(localStorageSpy).toHaveBeenCalledWith(
        'injury-history',
        expect.any(String)
      );
      
      localStorageSpy.mockRestore();
    });

    it('should never transmit data externally', async () => {
      // Mock fetch to ensure no external calls are made
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      await service.validateInjuryConstraints({ injuries: [] });
      
      expect(fetchSpy).not.toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete validation within 2 seconds with realistic injuries', async () => {
      const startTime = Date.now();
      
      // Create realistic varied injury scenarios
      const realisticInjuries = [
        {
          id: 'knee-left-2023',
          type: 'knee' as const,
          location: 'left' as const,
          severity: 'moderate' as const,
          date: '2023-06-15',
          status: 'recovering' as const,
          restrictions: ['deep_squats', 'jumping', 'high_impact']
        },
        {
          id: 'shoulder-right-2023',
          type: 'shoulder' as const,
          location: 'right' as const,
          severity: 'severe' as const,
          date: '2023-08-20',
          status: 'chronic' as const,
          restrictions: ['overhead_press', 'pull_ups', 'lateral_raises']
        },
        {
          id: 'back-lower-2023',
          type: 'back' as const,
          location: 'lower' as const,
          severity: 'mild' as const,
          date: '2023-09-10',
          status: 'recovered' as const,
          restrictions: ['heavy_lifting']
        },
        {
          id: 'ankle-left-2023',
          type: 'ankle' as const,
          location: 'left' as const,
          severity: 'moderate' as const,
          date: '2023-11-05',
          status: 'recovering' as const,
          restrictions: ['jumping', 'running', 'box_jumps']
        }
      ];
      
      // Scale up to stress test with varied injury patterns
      const largeInjurySet = Array(25).fill(null).flatMap((_, index) => 
        realisticInjuries.map(injury => ({
          ...injury,
          id: `${injury.id}-${index}`
        }))
      );
      
      await service.validateInjuryConstraints({
        injuries: largeInjurySet
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(2000);
    });
  });
});