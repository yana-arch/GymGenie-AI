/**
 * InjuryAwareService BDD Tests - Minimal Working Version
 * 
 * Basic behavioral testing for injury detection and safety
 * following BDD principles with standardized test IDs
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TestCategory, TestType, TestPriority, TestIdGenerator } from '../../../test-utils';
import { InjuryValidationService } from '../services/InjuryValidationService';
import type { InjuryHistory } from '../types';

describe('InjuryAwareService BDD Tests', () => {
  let validationService: InjuryValidationService;

  beforeAll(() => {
    validationService = new InjuryValidationService();
  });

  afterAll(() => {
    localStorage.clear();
  });

  // GIVEN: a user with knee injury history
  describe('GIVEN a user with knee injury history', () => {
    const injuryHistory: InjuryHistory = {
      injuries: [
        {
          id: 'knee-left-2024',
          type: 'knee',
          location: 'left',
          severity: 'moderate',
          date: '2024-01-15',
          status: 'recovering',
          restrictions: ['no_deep_squats', 'no_high_impact', 'no_jumping']
        }
      ]
    };

    // WHEN: injury risk detection is performed
    describe('WHEN injury risk detection is performed', () => {
      let result: any;

      beforeAll(async () => {
        result = await validationService.validateInjuryConstraints(injuryHistory);
      });

      // THEN: should detect injury constraints and safety level
      it('[TC-INJURY-UNIT-001] THEN should detect injury constraints and safety level', () => {
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
        expect(result.constraints.safetyLevel).toBe('conservative');
        expect(result.processingTime).toBeLessThan(2000);
      });

      // AND: should identify blocked movements for knee safety
      it('[TC-INJURY-UNIT-002] AND should identify blocked movements for knee safety', () => {
        expect(result.constraints.blockedMovements).toContain('jumping');
        expect(result.constraints.recommendedAlternatives).toBeDefined();
      });
    });
  });

  // GIVEN: an empty injury history for new user
  describe('GIVEN an empty injury history for new user', () => {
    const emptyHistory: InjuryHistory = { injuries: [] };

    // WHEN: injury risk assessment is performed
    describe('WHEN injury risk assessment is performed', () => {
      let result: any;

      beforeAll(async () => {
        result = await validationService.validateInjuryConstraints(emptyHistory);
      });

      // THEN: should handle empty injury history gracefully
      it('[TC-INJURY-UNIT-014] THEN should handle empty injury history gracefully', () => {
        expect(result.isValid).toBe(true);
        expect(result.constraints.constraints).toEqual([]);
        expect(result.constraints.safetyLevel).toBe('normal');
      });
    });
  });

  // GIVEN: injury data processing requirements
  describe('GIVEN injury data processing requirements', () => {
    const injuryHistory: InjuryHistory = {
      injuries: [
        {
          id: 'shoulder-right-2024',
          type: 'shoulder',
          location: 'right',
          severity: 'mild',
          date: '2024-03-01',
          status: 'recovered',
          restrictions: ['overhead_press']
        }
      ]
    };

    // WHEN: injury data is processed
    describe('WHEN injury data is processed', () => {
      // THEN: should never transmit injury data externally
      it('[TC-INJURY-UNIT-020] THEN should never transmit injury data externally', async () => {
        // Mock fetch to ensure no external calls are made
        const fetchSpy = vi.spyOn(global, 'fetch');
        
        await validationService.validateInjuryConstraints(injuryHistory);

        expect(fetchSpy).not.toHaveBeenCalled();

        fetchSpy.mockRestore();
      });
    });
  });

  // GIVEN: multiple injury records with different severity levels
  describe('GIVEN multiple injury records with different severity levels', () => {
    const complexInjuryHistory: InjuryHistory = {
      injuries: [
        {
          id: 'knee-left-2024',
          type: 'knee',
          location: 'left',
          severity: 'moderate',
          date: '2024-01-15',
          status: 'recovering',
          restrictions: ['no_deep_squats', 'no_high_impact']
        },
        {
          id: 'shoulder-right-2024',
          type: 'shoulder',
          location: 'right',
          severity: 'severe',
          date: '2024-02-01',
          status: 'chronic',
          restrictions: ['no_overhead_press', 'no_pull_ups']
        }
      ]
    };

    // WHEN: comprehensive injury validation is performed
    describe('WHEN comprehensive injury validation is performed', () => {
      let result: any;
      let processingTime: number;

      beforeAll(async () => {
        const startTime = performance.now();
        result = await validationService.validateInjuryConstraints(complexInjuryHistory);
        const endTime = performance.now();
        processingTime = endTime - startTime;
      });

      // THEN: should validate multiple injuries within performance requirements
      it(TestIdGenerator.generateWithPriority(TestCategory.INJURY, TestType.UNIT, 3, 'THEN should validate multiple injuries within performance requirements', TestPriority.P1), () => {
        expect(processingTime).toBeLessThan(2000);
        expect(result.isValid).toBe(true);
        expect(result.constraints.safetyLevel).toBe('restricted');
      });

      // AND: should prioritize severe injuries in constraints
      it('[TC-INJURY-UNIT-004] AND should prioritize severe injuries in constraints', () => {
        expect(result.constraints.constraints).toContain('no_overhead_press');
        expect(result.constraints.blockedMovements).toContain('pull_ups');
      });
    });
  });
});