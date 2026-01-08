/**
 * Test file for HistoricalPatternsService - BDD Structure
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

describe('HistoricalPatternsService - BDD Tests', () => {
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

  describe('Pattern Management - BDD Scenarios', () => {
    // SCENARIO 5: Invalid Pattern Update
    describe('[TC-HISTORICAL-UNIT-005] Invalid Pattern Update Validation', () => {
      given('a pattern with invalid confidence value', () => {
        const patternId = 'pattern-1';
        const updates = { confidence: 1.5 }; // Invalid value > 1

        when('attempting to update with invalid confidence', async () => {
          then('should reject invalid confidence values', async () => {
            await expect(service.updatePattern(userId, patternId, updates)).rejects.toThrow(
              HistoricalPatternError
            );
          });
        });
      });
    });

    // SCENARIO 6: Successful Pattern Deletion
    describe('[TC-HISTORICAL-UNIT-006] Pattern Deletion', () => {
      given('a user with existing historical patterns', () => {
        const patternId = 'pattern-1';
        const existingPatterns: HistoricalPattern[] = [
          {
            id: patternId,
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
          },
          {
            id: 'pattern-2',
            userId,
            patternType: 'exercise-preference',
            confidence: 0.7,
            strength: 0.6,
            firstDetected: new Date('2024-01-01'),
            lastConfirmed: new Date('2024-01-15'),
            confirmations: 3,
            contradictions: 0,
            timeSpan: 4,
            data: { exercisePreferences: { preferredExercises: [], avoidedExercises: [] } }
          }
        ];

        beforeEach(() => {
          mockPrivacyService.auditTrail.mockResolvedValue([]);
          mockPrivacyService.retrieve.mockResolvedValue('encrypted-data');
          mockPrivacyService.decrypt.mockResolvedValue(existingPatterns);
          mockPrivacyService.encrypt.mockResolvedValue('updated-encrypted-data');
        });

        and('a specific pattern is targeted for deletion', () => {
          // Pattern ID already defined above
        });

        when('deleting the pattern', async () => {
          then('should delete specific pattern', async () => {
            await service.deletePattern(userId, patternId);

            expect(mockPrivacyService.store).toHaveBeenCalledWith(
              `gymgenie_historical_patterns-${userId}`,
              'updated-encrypted-data'
            );
          });
        });
      });
    });
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

// Helper function to create mock workout history
function createMockWorkoutHistory(count: number): WorkoutHistoryEntry[] {
  const workouts: WorkoutHistoryEntry[] = [];
  const baseDate = new Date('2024-01-01');
  
  for (let i = 0; i < count; i++) {
    workouts.push({
      id: `workout-${i}`,
      userId: 'test-user-123',
      workoutId: `workout-plan-${i % 3}`,
      completedAt: new Date(baseDate.getTime() + (i * 2 * 24 * 60 * 60 * 1000)), // Every 2 days
      duration: 45 + (i * 5),
      exercises: [
        {
          exerciseId: 'exercise-1',
          exerciseName: 'Push-ups',
          exerciseType: 'strength',
          sets: [
            { reps: 15, weight: 0, difficulty: 6, restTime: 60 }
          ],
          performance: {
            effectiveness: 7 + i * 0.1,
            technique: 8,
            perceivedExertion: 6
          },
          adaptations: [
            {
              timestamp: new Date(),
              type: 'intensity',
              original: { difficulty: 5 },
              adapted: { difficulty: 6 },
              reason: 'Performance improvement',
              effectiveness: 0.8
            }
          ]
        }
      ],
      performance: {
        overallScore: 7 + i * 0.1,
        completionRate: 0.9 + (i * 0.01),
        difficulty: 6 + (i % 2),
        intensity: 0.7 + (i * 0.01),
        effort: 7,
        enjoyment: 8
      },
      aiRecommendations: [
        {
          type: 'intensity',
          recommendation: 'Increase weight gradually',
          confidence: 0.8,
          impact: 'medium',
          applied: true,
          effectiveness: 0.7
        }
      ],
      userFeedback: {
        overallRating: 4,
        difficultyRating: 3,
        enjoymentRating: 5,
        comments: 'Good workout',
        wouldRecommend: true
      }
    });
  }
  
  return workouts;
}