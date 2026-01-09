import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InjuryValidationService } from '../services/InjuryValidationService';
import { InjuryHistory } from '../types';

describe('Injury Safety Record - ATDD failing tests @atdd', () => {
  let service: InjuryValidationService;

  beforeEach(() => {
    service = new InjuryValidationService();
    localStorage.clear();
  });

  /**
   * Story 9.1: Injury History Safety Validation
   * Requirement: system maintains a permanent safety record of injury considerations
   */
  it('should maintain a history of all reported injuries even if they are currently "recovered" @p0', async () => {
    const injuryHistory: InjuryHistory = {
      injuries: [
        {
          id: 'knee-2023',
          type: 'knee',
          location: 'left',
          severity: 'moderate',
          status: 'recovered',
          date: '2023-01-01',
          restrictions: ['deep_squats']
        }
      ]
    };

    await service.storeInjuryHistory(injuryHistory);

    // Failing expectation: We want to retrieve not just active constraints, 
    // but the full "Permanent Safety Record"
    
    const record = await service.getPermanentSafetyRecord();
    
    expect(record).toBeDefined();
    expect(record.length).toBe(1);
    expect(record[0].id).toBe('knee-2023');
  });

  /**
   * Story 9.1: Injury History Safety Validation
   * Requirement: all recommendations are automatically filtered to avoid contraindicated exercises
   */
  it('should flag recommendations that conflict with "recovered" but significant history @p1', async () => {
    const injuryHistory: InjuryHistory = {
      injuries: [
        {
          id: 'back-2024',
          type: 'back',
          location: 'lower',
          severity: 'severe',
          status: 'recovered', // Recovered but significant history
          date: '2024-01-01',
          restrictions: ['no_heavy_lifting'] // Use normalized constraint for matching
        }
      ]
    };
    await service.storeInjuryHistory(injuryHistory);

    const recommendations = [
      { id: 'rec-1', exercise: 'heavy_deadlifts', intensity: 'high' }
    ];

    // Even if status is recovered, if it's in the permanent record, 
    // it should at least trigger a warning or conservative check.
    
    const result = await service.filterAgainstHistory(recommendations);
    
    expect(result.warnings).toContainEqual(expect.objectContaining({
      exercise: 'heavy_deadlifts',
      reason: expect.stringContaining('Previous back injury')
    }));
  });
});
