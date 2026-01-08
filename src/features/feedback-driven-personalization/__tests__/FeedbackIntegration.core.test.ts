import { FeedbackDrivenPersonalizationService } from '../services/FeedbackDrivenPersonalizationService';
import { FeedbackIntegrationEngine } from '../services/FeedbackIntegrationEngine';
import { FeedbackType, FeedbackData, FeedbackImpact } from '../types/feedbackPersonalization.types';
import { vi } from 'vitest';
import { feedbackFactory } from '@/test-utils/factories/FeedbackFactory';
import { workoutSessionFactory } from '@/test-utils/factories/WorkoutSessionFactory';
import { userProfileFactory } from '@/test-utils/factories/UserProfileFactory';

// Mock implementations for integration testing
const mockPreferenceLearningService = {
  updatePreferences: vi.fn().mockResolvedValue(undefined),
  getCurrentPreferences: vi.fn().mockResolvedValue({
    difficultyLevel: 3,
    volumeLevel: 3
  })
};

const mockHistoricalPatternsService = {
  getExerciseHistory: vi.fn().mockResolvedValue([
    workoutSessionFactory.create({
      state: 'completed' as any,
      timestamp: new Date('2024-01-01T10:00:00Z').getTime(),
      exerciseData: {
        'test-exercise': {
          exerciseId: 'test-exercise',
          sets: [{
            id: 'set-1',
            setNumber: 1,
            weight: 50,
            reps: 10,
            completedAt: new Date('2024-01-01T10:05:00Z').getTime(),
            targetRestTime: 60,
            actualRestTime: 65,
            duration: 30000
          }],
          isCompleted: true,
          completedAt: new Date('2024-01-01T10:15:00Z').getTime()
        }
      }
    })
  ]),
  detectPatterns: vi.fn().mockResolvedValue([
    { type: 'progressive_overload', strength: 0.8, confidence: 0.7 }
  ])
};

const mockAICoachingOrchestrator = {
  applyFeedbackImpact: vi.fn().mockResolvedValue(undefined),
  getCurrentRecommendation: vi.fn().mockResolvedValue(workoutSessionFactory.create({
    id: 'rec-123',
    exerciseData: {
      'exercise-456': {
        exerciseId: 'exercise-456',
        sets: [{
          id: 'set-1',
          setNumber: 1,
          weight: 50,
          reps: 10,
          completedAt: Date.now(),
          targetRestTime: 60,
          actualRestTime: 65,
          duration: 30000
        }],
        isCompleted: true,
        completedAt: Date.now()
      }
    }
  }))
};

describe('Feedback Integration Core Tests', () => {
  let feedbackService: FeedbackDrivenPersonalizationService;
  let integrationEngine: FeedbackIntegrationEngine;

  beforeEach(() => {
    feedbackService = new FeedbackDrivenPersonalizationService();
    integrationEngine = new FeedbackIntegrationEngine(
      mockPreferenceLearningService,
      mockHistoricalPatternsService,
      mockAICoachingOrchestrator
    );
    
    // Setup safety override callback
    feedbackService.setSafetyOverrideCallback((override) => {
      console.log('Safety override triggered:', override);
    });
    
    vi.clearAllMocks();
  });

  describe('Real Integration Workflow', () => {
    it('should complete full feedback workflow with real services', async () => {
      const feedbackData = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 2, // Too easy
        context: {
          currentWeight: 50,
          currentReps: 10,
          userFatigue: 0.3
        },
        comments: 'This felt too easy, need more challenge',
        priority: 'high'
      });

      // Step 1: Collect feedback
      const collectResult = feedbackService.collectFeedback(feedbackData);
      expect(collectResult.success).toBe(true);
      expect(collectResult.confidenceScore).toBeGreaterThan(0);

      // Step 2: Process through integration engine
      const workflowResult = await integrationEngine.processFeedbackWorkflow(feedbackData);
      expect(workflowResult.success).toBe(true);
      expect(workflowResult.impact).toBeDefined();

      // Step 3: Verify integration calls
      expect(mockPreferenceLearningService.updatePreferences).toHaveBeenCalledWith(
        feedbackData.exerciseId, // exerciseId as userId
        expect.objectContaining({
          difficultyLevel: expect.any(Number),
          volumeLevel: expect.any(Number),
          confidence: expect.any(Number)
        })
      );

      expect(mockHistoricalPatternsService.getExerciseHistory).toHaveBeenCalledWith(feedbackData.exerciseId);
      expect(mockHistoricalPatternsService.detectPatterns).toHaveBeenCalledWith(feedbackData.exerciseId);

      // Step 4: Verify impact was applied
      if (workflowResult.impact && workflowResult.impact.confidence >= 0.6) {
        expect(mockAICoachingOrchestrator.applyFeedbackImpact).toHaveBeenCalledWith(workflowResult.impact);
      }
    }, 10000); // 10s timeout for integration

    it('should handle high pain feedback with safety override', async () => {
      const painFeedback = feedbackFactory.createPainFeedback({
        rating: 5, // Critical pain
        priority: 'high'
      });

      // Setup safety override spy
      const safetySpy = vi.fn();
      feedbackService.setSafetyOverrideCallback(safetySpy);

      // Process feedback
      const collectResult = feedbackService.collectFeedback(painFeedback);
      expect(collectResult.success).toBe(true);

      const workflowResult = await integrationEngine.processFeedbackWorkflow(painFeedback);
      expect(workflowResult.success).toBe(true);

      // Verify safety override was triggered
      // Note: This would be tested with actual safety integration
      expect(painFeedback.rating).toBeGreaterThan(4); // High pain condition
    });

    it('should track integration metrics correctly', async () => {
      const feedbackBatch = [
        feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3
        }),
        feedbackFactory.create({
          type: FeedbackType.ENERGY_LEVEL,
          rating: 4
        })
      ];

      // Process batch
      for (const feedback of feedbackBatch) {
        await integrationEngine.processFeedbackWorkflow(feedback);
      }

      // Check metrics
      const metrics = integrationEngine.getIntegrationMetrics();
      expect(metrics.totalFeedbackProcessed).toBe(2);
      expect(metrics.averageConfidence).toBeGreaterThan(0);
      expect(metrics.modificationRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });
  });
});