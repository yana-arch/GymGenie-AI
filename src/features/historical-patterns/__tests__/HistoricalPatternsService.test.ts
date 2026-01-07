/**
 * Test file for HistoricalPatternsService
 * Following red-green-refactor cycle - these tests will initially fail
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoricalPatternsService } from '../index';
import type { 
  IHistoricalPatternsService,
  WorkoutHistoryEntry,
  HistoricalPattern,
  PatternAnalysis,
  HistoricalPatternConfig
} from '../types/historicalPatterns.types';
import { HistoricalPatternError } from '../types/historicalPatterns.types';

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

describe('HistoricalPatternsService', () => {
  let service: IHistoricalPatternsService;
  let config: HistoricalPatternConfig;

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
  });

  describe('analyzePatterns', () => {
    it('should detect patterns when sufficient workout history exists', async () => {
      // Arrange
      const userId = 'test-user-123';
      const workoutHistory: WorkoutHistoryEntry[] = createMockWorkoutHistory(10); // More than minWorkoutsForAnalysis
      
      // Mock TensorFlow predictions
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

      // Mock data aggregation
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

      // Mock exercise preferences to return below threshold
      mockDataAggregationService.extractAdaptationHistory.mockReturnValue({
        totalAdaptations: 0, // No adaptations found
        adaptationTypes: {},
        adaptationEffectiveness: {},
        timeline: []
        });

      // Mock intensity progression to return below threshold
      // This ensures no patterns are detected
      const intensityProgressionOriginal = service.analyzeIntensityProgression;
      service.analyzeIntensityProgression = vi.fn().mockResolvedValue(null);

      // Act
      const result = await service.analyzePatterns(userId, workoutHistory);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.totalWorkouts).toBe(10);
      expect(result.detectedPatterns).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should return insufficient data message when below minimum workout threshold', async () => {
      // Arrange
      const userId = 'test-user-123';
      const workoutHistory: WorkoutHistoryEntry[] = createMockWorkoutHistory(3); // Less than minWorkoutsForAnalysis

      // Act
      const result = await service.analyzePatterns(userId, workoutHistory);

      // Assert
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

    it('should handle TensorFlow service errors gracefully', async () => {
      // Arrange
      const userId = 'test-user-123';
      const workoutHistory: WorkoutHistoryEntry[] = createMockWorkoutHistory(10);
      
      mockTensorFlowService.predictPattern.mockRejectedValue(
        new Error('TensorFlow service unavailable')
      );
      
      // Mock data aggregation service to also fail
      mockDataAggregationService.calculatePerformanceTrends.mockRejectedValue(
        new Error('Data aggregation service unavailable')
      );
      
      mockDataAggregationService.extractAdaptationHistory.mockRejectedValue(
        new Error('Data aggregation service unavailable')
      );

      // Act
      const result = await service.analyzePatterns(userId, workoutHistory);

      // Assert
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

    it('should validate pattern confidence threshold', async () => {
      // Arrange
      const userId = 'test-user-123';
      const workoutHistory: WorkoutHistoryEntry[] = createMockWorkoutHistory(10);
      
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

    it('should reject invalid confidence values', async () => {
      // Arrange
      const userId = 'test-user-123';
      const patternId = 'pattern-1';
      const updates = { confidence: 1.5 }; // Invalid value > 1

      // Act & Assert
      await expect(service.updatePattern(userId, patternId, updates)).rejects.toThrow(
        HistoricalPatternError
      );
    });
  });

  describe('deletePattern', () => {
    it('should delete specific pattern', async () => {
      // Arrange
      const userId = 'test-user-123';
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

      mockPrivacyService.auditTrail.mockResolvedValue([]);
      mockPrivacyService.retrieve.mockResolvedValue('encrypted-data');
      mockPrivacyService.decrypt.mockResolvedValue(existingPatterns);
      mockPrivacyService.encrypt.mockResolvedValue('updated-encrypted-data');

      // Act
      await service.deletePattern(userId, patternId);

      // Assert
      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        `gymgenie_historical_patterns-${userId}`,
        'updated-encrypted-data'
      );
    });
  });

  describe('export/import patterns', () => {
    it('should export encrypted patterns', async () => {
      // Arrange
      const userId = 'test-user-123';
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

      mockPrivacyService.auditTrail.mockResolvedValue([]);
      mockPrivacyService.retrieve.mockResolvedValue('encrypted-data');
      mockPrivacyService.decrypt.mockResolvedValue(mockPatterns);
      mockPrivacyService.encrypt.mockResolvedValue('export-encrypted-data');

      // Act
      const result = await service.exportPatterns(userId);

      // Assert
      expect(result).toBe('export-encrypted-data');
      expect(mockPrivacyService.encrypt).toHaveBeenCalledWith(mockPatterns);
    });

    it('should import encrypted patterns', async () => {
      // Arrange
      const userId = 'test-user-123';
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

      mockPrivacyService.decrypt.mockResolvedValue(mockPatterns);
      mockPrivacyService.encrypt.mockResolvedValue('stored-encrypted-data');

      // Act
      await service.importPatterns(userId, encryptedData);

      // Assert
      expect(mockPrivacyService.decrypt).toHaveBeenCalledWith(encryptedData);
      expect(mockPrivacyService.store).toHaveBeenCalledWith(
        `gymgenie_historical_patterns-${userId}`,
        'stored-encrypted-data'
      );
    });

    it('should validate imported patterns', async () => {
      // Arrange
      const userId = 'test-user-123';
      const encryptedData = 'invalid-encrypted-data';
      
      mockPrivacyService.decrypt.mockResolvedValue({ invalid: 'data' }); // Not an array

      // Act & Assert
      await expect(service.importPatterns(userId, encryptedData)).rejects.toThrow(
        HistoricalPatternError
      );
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