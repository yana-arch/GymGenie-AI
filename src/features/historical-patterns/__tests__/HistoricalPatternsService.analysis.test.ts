/**
 * Test file for HistoricalPatternsService - Pattern Analysis
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

describe('HistoricalPatternsService - Pattern Analysis Tests', () => {
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

  describe('Pattern Analysis - BDD Scenarios', () => {
    // SCENARIO 1: Successful Pattern Analysis with Sufficient Data
    describe('[TC-HISTORICAL-UNIT-001] Successful Pattern Analysis', () => {
      given('a user with sufficient workout history for pattern analysis', () => {
        beforeEach(() => {
          // Setup TensorFlow predictions
          mockTensorFlowService.predictPattern.mockResolvedValue({
            predictedPattern: 'adaptation-trend',
            confidence: 0.8,
            features: {
              exerciseSelection: 0.7,
              intensityLevel: 0.6,
              timingPreference: 0.8,
              recoveryNeed: 0.5
            },
            reasoning: 'Strong adaptation trend detected'
          });

          // Setup data aggregation
          mockDataAggregationService.aggregateByTimePeriod.mockResolvedValue([
            {
              period: 'Week 1',
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-01-07'),
              workoutCount: 3,
              totalDuration: 180,
              averagePerformance: 7.5,
              adaptationFrequency: 0.8,
              performanceImprovement: 0.1
            }
          ]);

          mockDataAggregationService.calculatePerformanceTrends.mockResolvedValue([
            {
              metric: 'overall_performance',
              direction: 'improving',
              rate: 0.05,
              confidence: 0.8
            }
          ]);

          mockDataAggregationService.extractAdaptationHistory.mockResolvedValue({
            totalAdaptations: 15,
            adaptationTypes: { 'intensity': 8, 'exercise': 7 },
            adaptationEffectiveness: { 'intensity': 0.7, 'exercise': 0.8 },
            timeline: []
          });
        });

        and('the TensorFlow service is available and returns predictions', () => {
          // Already setup in beforeEach above
        });

        when('analyzing patterns with valid workout history', async () => {
          then('should detect patterns successfully', async () => {
            const result = await service.analyzePatterns(userId, workoutHistory);

            expect(result).toBeDefined();
            expect(result.userId).toBe(userId);
            expect(result.totalWorkouts).toBe(10);
            expect(result.detectedPatterns).toBeDefined();
            expect(result.insights).toBeDefined();
            expect(result.recommendations).toBeDefined();
          });
        });
      });
    });

    // SCENARIO 2: Insufficient Data for Analysis
    describe('[TC-HISTORICAL-UNIT-002] Insufficient Data Handling', () => {
      given('a user with insufficient workout history', () => {
        beforeEach(() => {
          workoutHistory = createMockWorkoutHistory(3); // Less than minWorkoutsForAnalysis
        });

        when('attempting to analyze patterns', async () => {
          then('should return insufficient data message', async () => {
            const result = await service.analyzePatterns(userId, workoutHistory);

            expect(result).toBeDefined();
            expect(result.totalWorkouts).toBe(3);
            expect(result.detectedPatterns).toHaveLength(0);
            expect(result.insights).toContainEqual(
              expect.objectContaining({
                type: 'data-insufficiency',
                insight: expect.stringContaining('Insufficient workout history'),
                confidence: 1.0,
                actionable: false
              })
            );
          });
        });
      });
    });

    // SCENARIO 3: Service Error Handling
    describe('[TC-HISTORICAL-UNIT-003] Service Error Handling', () => {
      given('pattern analysis services are unavailable', () => {
        beforeEach(() => {
          // Mock TensorFlow service to fail
          mockTensorFlowService.predictPattern.mockRejectedValue(
            new Error('TensorFlow service unavailable')
          );
          
          // Mock data aggregation services to also fail
          mockDataAggregationService.calculatePerformanceTrends.mockRejectedValue(
            new Error('Data aggregation service unavailable')
          );
          
          mockDataAggregationService.extractAdaptationHistory.mockRejectedValue(
            new Error('Data aggregation service unavailable')
          );
        });

        when('analyzing patterns with service failures', async () => {
          then('should handle service errors gracefully', async () => {
            const result = await service.analyzePatterns(userId, workoutHistory);

            expect(result).toBeDefined();
            expect(result.insights).toContainEqual(
              expect.objectContaining({
                type: 'analysis-error',
                insight: expect.stringContaining('Pattern analysis encountered technical difficulties'),
                confidence: 0,
                actionable: false
              })
            );
          });
        });
      });
    });

    // SCENARIO 4: Low Confidence Pattern Detection
    describe('[TC-HISTORICAL-UNIT-004] Low Confidence Pattern Validation', () => {
      given('patterns detected with low confidence values', () => {
        beforeEach(() => {
          // Mock low confidence prediction
          mockTensorFlowService.predictPattern.mockResolvedValue({
            predictedPattern: 'adaptation-rate',
            confidence: 0.5, // Below threshold
            features: { exerciseSelection: 0.3, intensityLevel: 0.4, timingPreference: 0.3, recoveryNeed: 0.4 },
            reasoning: 'Weak pattern detected'
          });
          
          // Mock data aggregation service to return weak trends
          mockDataAggregationService.calculatePerformanceTrends.mockResolvedValue([
            {
              metric: 'overall_performance',
              direction: 'improving',
              rate: 0.01, // Very weak trend
              confidence: 0.6 // Below threshold
            }
          ]);

          mockDataAggregationService.extractAdaptationHistory.mockResolvedValue({
            totalAdaptations: 0, // No adaptations found
            adaptationTypes: {},
            adaptationEffectiveness: {},
            timeline: []
          });
        });

        when('analyzing patterns below confidence threshold', async () => {
          then('should validate pattern confidence threshold', async () => {
            const result = await service.analyzePatterns(userId, workoutHistory);

            expect(result).toBeDefined();
            // Patterns below threshold should not be included in detected patterns
            expect(result.detectedPatterns?.every(p => p.confidence >= config.confidenceThreshold)).toBe(true);
          });
        });
      });
    });
  });
});