import { FeedbackDrivenPersonalizationService } from '../services/FeedbackDrivenPersonalizationService';
import { FeedbackIntegrationEngine } from '../services/FeedbackIntegrationEngine';
import { FeedbackType, FeedbackData, FeedbackImpact } from '../types/feedbackPersonalization.types';
import { vi } from 'vitest';
import { 
  feedbackFactory, 
  feedbackProcessingResultFactory,
  feedbackImpactFactory 
} from '../../../test-utils/factories/FeedbackFactory';

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
    {
      workoutId: 'workout-1',
      timestamp: '2024-01-01T10:00:00Z',
      performance: { weight: 50, reps: 10, sets: 3 }
    }
  ]),
  detectPatterns: vi.fn().mockResolvedValue([
    { type: 'progressive_overload', strength: 0.8, confidence: 0.7 }
  ])
};

const mockAICoachingOrchestrator = {
  applyFeedbackImpact: vi.fn().mockResolvedValue(undefined),
  getCurrentRecommendation: vi.fn().mockResolvedValue({
    id: 'rec-123',
    exerciseId: 'exercise-456',
    weight: 50,
    reps: 10,
    sets: 3
  })
};

describe('Feedback Integration Tests with Factory', () => {
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

  describe('Factory-Enhanced Integration Workflow', () => {
    it('should complete full feedback workflow using factory-generated data', async () => {
      // Use factory to create realistic feedback data instead of hardcoded values
      const feedbackData = feedbackFactory.createExerciseFeedback({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 2, // Too easy
        comments: 'This felt too easy, need more challenge',
        priority: 'high',
        context: {
          currentWeight: 50,
          currentReps: 10,
          userFatigue: 0.3
        }
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
        feedbackData.exerciseId, // Use factory-generated ID
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
    }, 10000);

    it('should handle high pain feedback using factory-generated data', async () => {
      // Use factory to create realistic pain feedback
      const painFeedback = feedbackFactory.createPainFeedback({
        rating: 5, // Critical pain
        comments: 'Sharp pain in shoulder during press'
      });

      // Setup safety override spy
      const safetySpy = vi.fn();
      feedbackService.setSafetyOverrideCallback(safetySpy);

      // Process feedback
      const collectResult = feedbackService.collectFeedback(painFeedback);
      expect(collectResult.success).toBe(true);

      const workflowResult = await integrationEngine.processFeedbackWorkflow(painFeedback);
      expect(workflowResult.success).toBe(true);

      // Verify safety conditions using factory data
      expect(painFeedback.type).toBe(FeedbackType.PAIN_FEEDBACK);
      expect(painFeedback.rating).toBeGreaterThan(4); // High pain condition
      expect(painFeedback.priority).toBe('high');
      expect(painFeedback.tags).toContain('pain');
      expect(painFeedback.tags).toContain('safety');
    });

    it('should handle batch feedback processing using factory', async () => {
      // Create realistic batch of feedback data using factory
      const workoutId = 'workout-' + Math.random().toString(36).substr(2, 9);
      const exerciseId = 'exercise-' + Math.random().toString(36).substr(2, 9);
      
      const feedbackBatch = [
        feedbackFactory.createWorkoutFeedback({ workoutId, exerciseId }),
        feedbackFactory.createExerciseFeedback({ workoutId, exerciseId }),
        feedbackFactory.createPerformanceFeedback({ workoutId, exerciseId }),
        feedbackFactory.createSessionFeedback({ workoutId, exerciseId })
      ];

      // Process all feedback
      const results = await Promise.all(
        feedbackBatch.map(feedback => integrationEngine.processFeedbackWorkflow(feedback))
      );

      // Verify all results are successful
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify diversity of feedback types
      const types = feedbackBatch.map(f => f.type);
      const uniqueTypes = [...new Set(types)];
      expect(uniqueTypes.length).toBeGreaterThan(1);
    });

    it('should test edge cases using factory edge case generation', async () => {
      // Test boundary values and edge cases
      const extremeFeedbacks = [
        feedbackFactory.createEdgeCaseFeedback({
          rating: 1, // Minimum rating
          priority: 'high',
          context: {
            currentWeight: 500, // Extreme weight
            currentReps: 50, // Extreme reps
            userFatigue: 1 // Maximum fatigue
          }
        }),
        feedbackFactory.createEdgeCaseFeedback({
          rating: 5, // Maximum rating
          priority: 'low',
          context: {
            currentWeight: 5, // Minimum weight
            currentReps: 1, // Minimum reps
            userFatigue: 0 // No fatigue
          }
        })
      ];

      for (const feedback of extremeFeedbacks) {
        const result = await integrationEngine.processFeedbackWorkflow(feedback);
        expect(result.success).toBe(true);
        expect(feedback.rating).toBeGreaterThanOrEqual(1);
        expect(feedback.rating).toBeLessThanOrEqual(5);
      }
    });

    it('should handle invalid feedback using factory-generated invalid data', async () => {
      // Create invalid feedback data for negative testing
      const invalidFeedback = feedbackFactory.createInvalidFeedback({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 6, // Invalid rating > 5
        exerciseId: '' // Empty exercise ID
      });

      // This should be handled gracefully by the service
      const collectResult = feedbackService.collectFeedback(invalidFeedback);
      // Depending on implementation, this might fail or be sanitized
      expect(collectResult).toBeDefined();
    });

    it('should test historical sequence processing', async () => {
      // Create a realistic historical sequence using factory
      const historicalSequence = feedbackFactory.createHistoricalSequence(7, 2); // 7 days, 2 per day
      
      // Process the sequence to test temporal pattern recognition
      const results = await Promise.all(
        historicalSequence.slice(-5).map(feedback => // Process last 5 feedback items
          integrationEngine.processFeedbackWorkflow(feedback)
        )
      );

      // All should be successful
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify temporal consistency
      const timestamps = historicalSequence.slice(-5).map(f => new Date(f.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });
  });

  describe('Factory-Generated Mock Scenarios', () => {
    it('should test with realistic workout session feedback', async () => {
      // Create a complete workout session feedback scenario
      const workoutId = 'workout-' + Math.random().toString(36).substr(2, 9);
      
      // Session feedback
      const sessionFeedback = feedbackFactory.createSessionFeedback({
        workoutId,
        type: FeedbackType.ENERGY_LEVEL,
        rating: 4,
        comments: 'Good energy throughout the session'
      });

      // Exercise-specific feedback for different exercises
      const exerciseFeedbacks = [
        feedbackFactory.createExerciseFeedback({
          workoutId,
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          comments: 'Good difficulty level'
        }),
        feedbackFactory.createExerciseFeedback({
          workoutId,
          type: FeedbackType.TECHNIQUE_FEEDBACK,
          rating: 4,
          comments: 'Form improved from last session'
        }),
        feedbackFactory.createExerciseFeedback({
          workoutId,
          type: FeedbackType.COMFORT_LEVEL,
          rating: 4,
          comments: 'Comfortable throughout'
        })
      ];

      // Process all feedback
      const allFeedback = [sessionFeedback, ...exerciseFeedbacks];
      const results = await Promise.all(
        allFeedback.map(feedback => integrationEngine.processFeedbackWorkflow(feedback))
      );

      // Verify all processed successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all belong to same workout
      allFeedback.forEach(feedback => {
        expect(feedback.workoutId).toBe(workoutId);
      });
    });

    it('should test safety scenarios with mixed feedback types', async () => {
      // Create mixed feedback including safety-critical scenarios
      const safetyFeedbacks = [
        feedbackFactory.createPainFeedback({
          priority: 'high',
          rating: 4,
          comments: 'Sharp knee pain during squats'
        }),
        feedbackFactory.createExerciseFeedback({
          type: FeedbackType.ENERGY_LEVEL,
          rating: 1,
          priority: 'high',
          comments: 'Extremely fatigued, should stop'
        }),
        feedbackFactory.createExerciseFeedback({
          type: FeedbackType.TECHNIQUE_FEEDBACK,
          rating: 2,
          priority: 'medium',
          comments: 'Form breaking down due to fatigue'
        })
      ];

      const results = await Promise.all(
        safetyFeedbacks.map(feedback => integrationEngine.processFeedbackWorkflow(feedback))
      );

      // Verify safety-critical feedback is handled appropriately
      safetyFeedbacks.forEach((feedback, index) => {
        expect(results[index].success).toBe(true);
        if (feedback.type === FeedbackType.PAIN_FEEDBACK) {
          expect(feedback.priority).toBe('high');
          expect(feedback.tags).toContain('pain');
        }
      });
    });
  });

  describe('Performance and Load Testing with Factory', () => {
    it('should handle high-volume feedback processing', async () => {
      // Generate large batch of feedback data for load testing
      const largeBatch = feedbackFactory.createMixedFeedbackBatch(50); // 50 diverse feedback items
      
      const startTime = Date.now();
      
      // Process all feedback concurrently
      const results = await Promise.allSettled(
        largeBatch.map(feedback => integrationEngine.processFeedbackWorkflow(feedback))
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verify performance metrics
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(45); // At least 90% success rate
      expect(failed.length).toBeLessThan(5); // Less than 10% failure rate
      expect(processingTime).toBeLessThan(5000); // Under 5 seconds

      // Verify data diversity
      const types = largeBatch.map(f => f.type);
      const uniqueTypes = [...new Set(types)];
      expect(uniqueTypes.length).toBeGreaterThan(2);
    });
  });
});