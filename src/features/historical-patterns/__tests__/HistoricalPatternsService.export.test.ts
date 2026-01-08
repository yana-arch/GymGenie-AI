/**
 * Test file for HistoricalPatternsService - Data Export/Import
 * Following red-green-refactor cycle - these tests will initially fail
 * Converted to Given-When-Then structure with standardized test IDs
 */

import { describe, expect, beforeEach, vi } from 'vitest';
import { HistoricalPatternsService } from '../index';
import type { 
  IHistoricalPatternsService,
  WorkoutHistoryEntry,
  HistoricalPattern,
  PatternAnalysis,
  HistoricalPatternConfig
} from '../types/historicalPatterns.types';
import { HistoricalPatternError } from '../types/historicalPatterns.types';
import { given, when, then, and, createHistoricalTest } from '../../../test-utils';
import { createMockWorkoutHistory } from './testHelpers';

// Mock dependencies
const mockPrivacyService = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  store: vi.fn(),
  retrieve: vi.fn(),
  delete: vi.fn(),
  auditTrail: vi.fn()
};

const mockTensorFlowService = {
  predictPattern: vi.fn(),
  loadModel: vi.fn(),
  isModelLoaded: vi.fn(),
  getModelMetadata: vi.fn()
};

const mockDataAggregationService = {
  aggregateByTimePeriod: vi.fn(),
  calculatePerformanceTrends: vi.fn(),
  extractAdaptationHistory: vi.fn()
};

describe('HistoricalPatternsService - Export/Import Tests', () => {
  let service: IHistoricalPatternsService;
  let config: HistoricalPatternConfig;
  let userId: string;
  let workoutHistory: WorkoutHistoryEntry[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    config = {
      minWorkoutsForAnalysis: 5,
      confidenceThreshold: 0.7,
      minTimeSpanWeeks: 2,
      maxContradictions: 3,
      learningRate: 0.1,
      analysisWindow: 12,
      patternValidationThreshold: 0.8,
      privacyLevel: 'standard'
    };

    service = new HistoricalPatternsService({
      privacyService: mockPrivacyService,
      tensorFlowService: mockTensorFlowService,
      dataAggregationService: mockDataAggregationService,
      config
    });

    userId = 'test-user-123';
    workoutHistory = createMockWorkoutHistory(10);
  });

  describe('Pattern Import/Export - BDD Scenarios', () => {
    // SCENARIO 7: Successful Pattern Export
    describe('[TC-HISTORICAL-UNIT-007] Pattern Export', () => {
      given('a user with existing historical patterns', () => {
        const mockPatterns: HistoricalPattern[] = [
          {
            id: 'pattern-1',
            userId,
            patternType: 'adaptation-trend',
            confidence: 0.8,
            strength: 0.7,
            firstDetected: new Date('2024-01-01'),
            lastConfirmed: new Date('2024-01-15'),
            confirmations: 5,
            contradictions: 0,
            timeSpan: 4,
            data: { adaptationTrends: { direction: 'increasing', rate: 0.05, consistency: 0.8 } }
          }
        ];

        beforeEach(() => {
          mockPrivacyService.auditTrail.mockResolvedValue([]);
          mockPrivacyService.retrieve.mockResolvedValue('encrypted-data');
          mockPrivacyService.decrypt.mockResolvedValue(mockPatterns);
          mockPrivacyService.encrypt.mockResolvedValue('export-encrypted-data');
        });

        when('exporting patterns', async () => {
          then('should export encrypted patterns', async () => {
            const result = await service.exportPatterns(userId);

            expect(result).toBe('export-encrypted-data');
            expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(mockPatterns);
          });
        });
      });
    });

    // SCENARIO 8: Successful Pattern Import
    describe('[TC-HISTORICAL-UNIT-008] Pattern Import', () => {
      given('valid encrypted pattern data', () => {
        const encryptedData = 'import-encrypted-data';
        const mockPatterns: HistoricalPattern[] = [
          {
            id: 'pattern-1',
            userId,
            patternType: 'adaptation-trend',
            confidence: 0.8,
            strength: 0.7,
            firstDetected: new Date('2024-01-01'),
            lastConfirmed: new Date('2024-01-15'),
            confirmations: 5,
            contradictions: 0,
            timeSpan: 4,
            data: { adaptationTrends: { direction: 'increasing', rate: 0.05, consistency: 0.8 } }
          }
        ];

        beforeEach(() => {
          mockPrivacyService.decrypt.mockResolvedValue(mockPatterns);
          mockPrivacyService.encrypt.mockResolvedValue('stored-encrypted-data');
        });

        when('importing patterns', async () => {
          then('should import encrypted patterns', async () => {
            await service.importPatterns(userId, encryptedData);

            expect(mockPrivacyService.decrypt).toHaveBeenCalledWith(encryptedData);
            expect(mockPrivacyService.store).toHaveBeenCalledWith(
              `gymgenie_historical_patterns-${userId}`,
              'stored-encrypted-data'
            );
          });
        });
      });
    });

    // SCENARIO 9: Invalid Pattern Import Data
    describe('[TC-HISTORICAL-UNIT-009] Invalid Pattern Import Validation', () => {
      given('invalid encrypted pattern data', () => {
        const encryptedData = 'invalid-encrypted-data';
        
        beforeEach(() => {
          mockPrivacyService.decrypt.mockResolvedValue({ invalid: 'data' }); // Not an array
        });

        when('importing patterns with invalid structure', async () => {
          then('should validate imported patterns', async () => {
            await expect(service.importPatterns(userId, encryptedData)).rejects.toThrow(
              HistoricalPatternError
            );
          });
        });
      });
    });
  });
});