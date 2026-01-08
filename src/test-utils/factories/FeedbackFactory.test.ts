import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FeedbackFactory,
  FeedbackProcessingResultFactory,
  FeedbackPatternFactory,
  FeedbackImpactFactory,
  FeedbackValidationResultFactory,
  feedbackFactory,
  feedbackProcessingResultFactory,
  feedbackPatternFactory,
  feedbackImpactFactory,
  feedbackValidationResultFactory
} from './FeedbackFactory';
import { FeedbackType } from '@/features/feedback-driven-personalization/types/feedbackPersonalization.types';

describe('FeedbackFactory', () => {
  describe('Basic Factory Functionality', () => {
    it('should create valid feedback data with all required fields', () => {
      const feedback = feedbackFactory.create();
      
      expect(feedback).toBeDefined();
      expect(typeof feedback.id).toBe('string');
      expect(typeof feedback.workoutId).toBe('string');
      expect(typeof feedback.exerciseId).toBe('string');
      expect(Object.values(FeedbackType)).toContain(feedback.type);
      expect(feedback.rating).toBeGreaterThanOrEqual(1);
      expect(feedback.rating).toBeLessThanOrEqual(5);
      expect(typeof feedback.timestamp).toBe('string');
      expect(Date.parse(feedback.timestamp)).not.toBeNaN();
    });

    it('should support override pattern', () => {
      const customFeedback = feedbackFactory.create({
        id: 'custom-id',
        rating: 5,
        type: FeedbackType.ENERGY_LEVEL
      });

      expect(customFeedback.id).toBe('custom-id');
      expect(customFeedback.rating).toBe(5);
      expect(customFeedback.type).toBe(FeedbackType.ENERGY_LEVEL);
    });

    it('should create multiple feedback instances', () => {
      const feedbacks = feedbackFactory.createMany(5);
      
      expect(feedbacks).toHaveLength(5);
      feedbacks.forEach((feedback, index) => {
        expect(feedback).toBeDefined();
        expect(feedbacks.indexOf(feedback)).toBe(index); // Ensure no duplicates
      });
    });
  });

  describe('Workout Feedback', () => {
    it('should create workout-specific feedback', () => {
      const workoutFeedback = feedbackFactory.createWorkoutFeedback();
      
      expect(workoutFeedback.type).toBe(FeedbackType.DIFFICULTY_RATING);
      expect(workoutFeedback.context?.timeOfDay).toBeDefined();
      expect(workoutFeedback.context?.environmental).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(workoutFeedback.priority);
    });

    it('should support workout feedback overrides', () => {
      const workoutFeedback = feedbackFactory.createWorkoutFeedback({
        rating: 2,
        comments: 'Too challenging workout'
      });

      expect(workoutFeedback.rating).toBe(2);
      expect(workoutFeedback.comments).toBe('Too challenging workout');
    });
  });

  describe('Exercise Feedback', () => {
    it('should create exercise-specific feedback with performance context', () => {
      const exerciseFeedback = feedbackFactory.createExerciseFeedback();
      
      expect(exerciseFeedback.context?.currentWeight).toBeGreaterThan(0);
      expect(exerciseFeedback.context?.currentReps).toBeGreaterThan(0);
      expect(exerciseFeedback.context?.currentSets).toBeGreaterThan(0);
      expect(exerciseFeedback.context?.previousPerformance).toBeDefined();
    });
  });

  describe('Session Feedback', () => {
    it('should create session-specific feedback', () => {
      const sessionFeedback = feedbackFactory.createSessionFeedback();
      
      expect(sessionFeedback.type).toBe(FeedbackType.ENERGY_LEVEL);
      expect(sessionFeedback.rating).toBeGreaterThanOrEqual(2);
      expect(sessionFeedback.rating).toBeLessThanOrEqual(5);
      expect(sessionFeedback.priority).toBe('low');
    });
  });

  describe('Performance Feedback', () => {
    it('should create performance-focused feedback', () => {
      const perfFeedback = feedbackFactory.createPerformanceFeedback();
      
      expect(perfFeedback.type).toBe(FeedbackType.TECHNIQUE_FEEDBACK);
      expect(perfFeedback.rating).toBeGreaterThanOrEqual(3);
      expect(perfFeedback.rating).toBeLessThanOrEqual(5);
      expect(perfFeedback.tags).toContain('technique');
      expect(perfFeedback.tags).toContain('form');
      expect(perfFeedback.tags).toContain('progress');
    });
  });

  describe('Pain Feedback', () => {
    it('should create safety-focused pain feedback', () => {
      const painFeedback = feedbackFactory.createPainFeedback();
      
      expect(painFeedback.type).toBe(FeedbackType.PAIN_FEEDBACK);
      expect(painFeedback.rating).toBeLessThanOrEqual(3);
      expect(painFeedback.priority).toBe('high');
      expect(painFeedback.tags).toContain('pain');
      expect(painFeedback.tags).toContain('safety');
      expect(painFeedback.tags).toContain('injury_risk');
    });
  });

  describe('Invalid Feedback for Testing', () => {
    it('should create invalid feedback scenarios', () => {
      const invalidFeedback = feedbackFactory.createInvalidFeedback();
      
      // Should have at least one invalid property
      const hasInvalidId = !invalidFeedback.id;
      const hasInvalidWorkoutId = !invalidFeedback.workoutId;
      const hasInvalidExerciseId = !invalidFeedback.exerciseId;
      const hasInvalidRating = invalidFeedback.rating < 1 || invalidFeedback.rating > 5;
      const hasInvalidTimestamp = invalidFeedback.timestamp === 'invalid-date-format';
      
      expect(
        hasInvalidId || hasInvalidWorkoutId || hasInvalidExerciseId || 
        hasInvalidRating || hasInvalidTimestamp
      ).toBe(true);
    });
  });

  describe('Edge Case Feedback', () => {
    it('should create boundary value scenarios', () => {
      const edgeFeedback = feedbackFactory.createEdgeCaseFeedback();
      
      expect([1, 5]).toContain(edgeFeedback.rating);
      expect(['high', 'low']).toContain(edgeFeedback.priority);
      
      if (edgeFeedback.context?.currentWeight) {
        expect([5, 500]).toContain(edgeFeedback.context.currentWeight);
      }
      
      if (edgeFeedback.context?.currentReps) {
        expect([1, 50]).toContain(edgeFeedback.context.currentReps);
      }
    });
  });

  describe('Mixed Feedback Batch', () => {
    it('should create diverse feedback types', () => {
      const batch = feedbackFactory.createMixedFeedbackBatch(10);
      
      expect(batch).toHaveLength(10);
      
      const types = batch.map(f => f.type);
      const uniqueTypes = [...new Set(types)];
      
      // Should have multiple different feedback types
      expect(uniqueTypes.length).toBeGreaterThan(1);
    });
  });

  describe('Priority-based Creation', () => {
    it('should create feedback with specific priorities', () => {
      const highPriority = feedbackFactory.createWithPriority('high');
      const mediumPriority = feedbackFactory.createWithPriority('medium');
      const lowPriority = feedbackFactory.createWithPriority('low');
      
      expect(highPriority.priority).toBe('high');
      expect(mediumPriority.priority).toBe('medium');
      expect(lowPriority.priority).toBe('low');
      
      // High priority should have lower ratings (indicating issues)
      expect(highPriority.rating).toBeLessThanOrEqual(3);
      
      // Low priority should have higher ratings (indicating good performance)
      expect(lowPriority.rating).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Historical Sequences', () => {
    it('should create progressive historical feedback', () => {
      const sequence = feedbackFactory.createHistoricalSequence(7, 1); // 7 days, 1 per day
      
      expect(sequence).toHaveLength(7);
      
      // Should be sorted by timestamp
      const timestamps = sequence.map(f => new Date(f.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
      
      // Should show progressive patterns
      expect(sequence[0].context?.currentWeight).toBeDefined();
      expect(sequence[6].context?.currentWeight).toBeDefined();
      expect(sequence[6].context!.currentWeight!).toBeGreaterThanOrEqual(sequence[0].context!.currentWeight!);
    });
  });
});

describe('FeedbackProcessingResultFactory', () => {
  it('should create processing results with all required fields', () => {
    const result = feedbackProcessingResultFactory.create();
    
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.feedbackId).toBe('string');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(1);
    expect(typeof result.processingTimestamp).toBe('string');
    expect(result.metadata).toBeDefined();
  });

  it('should create successful results', () => {
    const successResult = feedbackProcessingResultFactory.createSuccessful();
    
    expect(successResult.success).toBe(true);
    expect(successResult.confidenceScore).toBeGreaterThanOrEqual(0.7);
    expect(successResult.error).toBeUndefined();
  });

  it('should create failed results', () => {
    const failedResult = feedbackProcessingResultFactory.createFailed();
    
    expect(failedResult.success).toBe(false);
    expect(failedResult.confidenceScore).toBeLessThanOrEqual(0.3);
    expect(failedResult.error).toBeDefined();
  });
});

describe('FeedbackPatternFactory', () => {
  it('should create feedback patterns with all required fields', () => {
    const pattern = feedbackPatternFactory.create();
    
    expect(typeof pattern.id).toBe('string');
    expect(typeof pattern.exerciseId).toBe('string');
    expect(Object.values(FeedbackType)).toContain(pattern.feedbackType);
    expect(typeof pattern.dataPoints).toBe('number');
    expect(typeof pattern.lastUpdated).toBe('string');
    expect(pattern.pattern).toBeDefined();
  });

  it('should create improving patterns', () => {
    const improvingPattern = feedbackPatternFactory.createImprovingPattern();
    
    expect(improvingPattern.pattern.trend).toBe('increasing');
    expect(improvingPattern.pattern.averageRating).toBeGreaterThanOrEqual(3.5);
    expect(improvingPattern.pattern.confidenceInterval[1]).toBeGreaterThanOrEqual(3.0);
  });

  it('should create declining patterns', () => {
    const decliningPattern = feedbackPatternFactory.createDecliningPattern();
    
    expect(decliningPattern.pattern.trend).toBe('decreasing');
    expect(decliningPattern.pattern.averageRating).toBeLessThanOrEqual(2.5);
    expect(decliningPattern.pattern.confidenceInterval[0]).toBeLessThanOrEqual(3.0);
  });
});

describe('FeedbackImpactFactory', () => {
  it('should create feedback impacts with all required fields', () => {
    const impact = feedbackImpactFactory.create();
    
    expect(typeof impact.recommendationId).toBe('string');
    expect(impact.originalWeight).toBeGreaterThan(0);
    expect(impact.adjustedWeight).toBeGreaterThan(0);
    expect(impact.originalReps).toBeGreaterThan(0);
    expect(impact.adjustedReps).toBeGreaterThan(0);
    expect(impact.confidence).toBeGreaterThanOrEqual(0);
    expect(impact.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(impact.reasoning)).toBe(true);
    expect(Array.isArray(impact.feedbackSources)).toBe(true);
  });

    it('should create weight increase impacts', () => {
      const weightIncrease = feedbackImpactFactory.createWeightIncrease({
        originalWeight: 100
      });
      
      expect(weightIncrease.originalWeight).toBe(100);
      expect(weightIncrease.adjustedWeight).toBeGreaterThan(weightIncrease.originalWeight);
      expect(weightIncrease.confidence).toBeGreaterThanOrEqual(0.7);
      expect(weightIncrease.reasoning).toContain('User reported exercise felt too easy');
    });

    it('should create weight decrease impacts', () => {
      const weightDecrease = feedbackImpactFactory.createWeightDecrease({
        originalWeight: 100
      });
      
      expect(weightDecrease.originalWeight).toBe(100);
      expect(weightDecrease.adjustedWeight).toBeLessThan(weightDecrease.originalWeight);
      expect(weightDecrease.confidence).toBeGreaterThanOrEqual(0.6);
      expect(weightDecrease.reasoning).toContain('User reported difficulty');
    });
});

describe('FeedbackValidationResultFactory', () => {
  it('should create validation results with all required fields', () => {
    const result = feedbackValidationResultFactory.create();
    
    expect(typeof result.isValid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should create valid results', () => {
    const validResult = feedbackValidationResultFactory.createValid();
    
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
  });

  it('should create invalid results', () => {
    const invalidResult = feedbackValidationResultFactory.createInvalid();
    
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});

describe('Integration Tests', () => {
  it('should work with existing test infrastructure', () => {
    const feedback = feedbackFactory.create();
    const result = feedbackProcessingResultFactory.createSuccessful({ feedbackId: feedback.id });
    const pattern = feedbackPatternFactory.create({ exerciseId: feedback.exerciseId });
    
    // Verify all work together
    expect(result.feedbackId).toBe(feedback.id);
    expect(pattern.exerciseId).toBe(feedback.exerciseId);
  });

  it('should support complex test scenarios', () => {
    // Create a realistic workout scenario
    const workoutFeedback = feedbackFactory.createWorkoutFeedback();
    const exercises = feedbackFactory.createMany(3, {
      workoutId: workoutFeedback.workoutId
    });
    const impacts = exercises.map(exercise => 
      feedbackImpactFactory.createWeightIncrease()
    );
    const validationResult = feedbackValidationResultFactory.createValid();
    
    expect(exercises).toHaveLength(3);
    expect(impacts).toHaveLength(3);
    expect(validationResult.isValid).toBe(true);
    
    // Verify consistency
    exercises.forEach((exercise, index) => {
      expect(exercise.workoutId).toBe(workoutFeedback.workoutId);
      expect(impacts[index]).toBeDefined();
    });
  });
});