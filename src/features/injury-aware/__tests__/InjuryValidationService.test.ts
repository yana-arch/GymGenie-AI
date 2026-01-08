import { given, when, then, and, createInjuryTest } from '../../../test-utils';
import { beforeEach, vi } from 'vitest';
import { InjuryValidationService } from '../services/InjuryValidationService';
import type { InjuryHistory, AIRecommendation } from '../types';

describe('InjuryValidationService BDD Tests', () => {
  let service: InjuryValidationService;

  beforeEach(() => {
    service = new InjuryValidationService();
  });

  given('an InjuryValidationService instance', () => {
    when('validating injury history', () => {
      then(createInjuryTest(1, 'should validate injury history and return constraints'), async () => {
        const injuryHistory: InjuryHistory = {
          injuries: [
            {
              id: 'knee-left-2023',
              type: 'knee' as const,
              location: 'left' as const,
              severity: 'moderate' as const,
              date: '2023-06-15',
              status: 'recovering' as const,
              restrictions: ['deep_squats', 'jumping', 'high_impact']
            }
          ]
        };

        const result = await service.validateInjuryConstraints(injuryHistory);
        
        expect(result).toBeDefined();
        expect(result.constraints.constraints).toContain('no_high_impact');
        expect(result.constraints.safetyLevel).toBe('conservative');
      });

      and(createInjuryTest(2, 'should reject invalid injury data'), async () => {
        const invalidInjuryHistory: any = {
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

      and(createInjuryTest(3, 'should handle empty injury history'), async () => {
        const emptyHistory: InjuryHistory = { injuries: [] };
        
        const result = await service.validateInjuryConstraints(emptyHistory);
        
        expect(result.constraints.constraints).toEqual([]);
        expect(result.constraints.safetyLevel).toBe('normal');
      });
    });

    when('filtering AI recommendations', () => {
      then(createInjuryTest(4, 'should filter AI recommendations against injury constraints'), async () => {
        const constraints = ['no_deep_squats', 'no_high_impact'];
        const recommendations: AIRecommendation[] = [
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
  });

  given('local storage compliance requirements', () => {
    when('storing injury data', () => {
      then(createInjuryTest(5, 'should store injury data locally only'), async () => {
        const injuryHistory: InjuryHistory = {
          injuries: [
            {
              id: 'shoulder-right-2023',
              type: 'shoulder' as const,
              location: 'right' as const,
              severity: 'mild' as const,
              date: '2023-08-20',
              status: 'recovered' as const,
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

      and(createInjuryTest(6, 'should never transmit data externally'), async () => {
        // Mock fetch to ensure no external calls are made
        const fetchSpy = vi.spyOn(global, 'fetch');
        
        await service.validateInjuryConstraints({ injuries: [] });
        
        expect(fetchSpy).not.toHaveBeenCalled();
        
        fetchSpy.mockRestore();
      });
    });
  });

  given('performance requirements', () => {
    when('validating complex injury scenarios', () => {
      then(createInjuryTest(7, 'should complete validation within 2 seconds with realistic injuries'), async () => {
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
});