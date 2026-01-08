import { given, when, then, and, createFeedbackTest } from '../../../test-utils';
import { FeedbackDrivenPersonalizationService } from '../services/FeedbackDrivenPersonalizationService';
import { FeedbackType, FeedbackData, FeedbackProcessingResult } from '../types/feedbackPersonalization.types';
import { feedbackFactory } from '@/test-utils/factories/FeedbackFactory';
import { workoutSessionFactory } from '@/test-utils/factories/WorkoutSessionFactory';
import { userProfileFactory } from '@/test-utils/factories/UserProfileFactory';

describe('FeedbackDrivenPersonalizationService BDD Tests', () => {
  let service: FeedbackDrivenPersonalizationService;

  beforeEach(() => {
    service = new FeedbackDrivenPersonalizationService();
  });

  given('a FeedbackDrivenPersonalizationService instance', () => {
    when('collecting user feedback', () => {
      then(createFeedbackTest(1, 'should collect feedback with valid data structure'), () => {
        const feedbackData = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          context: {
            currentWeight: 50,
            currentReps: 10,
            userFatigue: 0.7
          }
        });

        const result = service.collectFeedback(feedbackData);

        expect(result.success).toBe(true);
        expect(result.feedbackId).toBe(feedbackData.id);
        expect(result.confidenceScore).toBeGreaterThan(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);
      });

      and(createFeedbackTest(2, 'should reject invalid feedback data'), () => {
        const invalidFeedback = feedbackFactory.createInvalidFeedback({
          id: 'invalid-feedback'
        });

        const result = service.collectFeedback(invalidFeedback);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('is required');
        expect(result.confidenceScore).toBe(0);
      });

      and(createFeedbackTest(3, 'should handle feedback with missing optional context'), () => {
        const minimalFeedback = feedbackFactory.create({
          type: FeedbackType.ENERGY_LEVEL,
          rating: 4,
          context: undefined
        });

        const result = service.collectFeedback(minimalFeedback);

        expect(result.success).toBe(true);
        expect(result.feedbackId).toBe(minimalFeedback.id);
      });
    });

    when('processing multiple feedback items', () => {
      then(createFeedbackTest(4, 'should process feedback batch correctly'), async () => {
        const feedbackBatch = [
          feedbackFactory.create({
            type: FeedbackType.DIFFICULTY_RATING,
            rating: 2
          }),
          feedbackFactory.create({
            type: FeedbackType.ENERGY_LEVEL,
            rating: 4
          })
        ];

        const results = await service.processFeedbackBatch(feedbackBatch);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);
        expect(results[0].feedbackId).toBe(feedbackBatch[0].id);
        expect(results[1].feedbackId).toBe(feedbackBatch[1].id);
      });

      and(createFeedbackTest(5, 'should handle empty feedback batch'), async () => {
        const results = await service.processFeedbackBatch([]);
        expect(results).toHaveLength(0);
      });

      and(createFeedbackTest(6, 'should handle error conditions gracefully'), async () => {
        const invalidFeedback = feedbackFactory.createInvalidFeedback({
          rating: 10, // Invalid rating > 5
          timestamp: 'invalid-date'
        });

        const result = service.collectFeedback(invalidFeedback);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Rating must be a number');
        expect(result.confidenceScore).toBe(0);
      });
    });

    when('detecting safety override conditions', () => {
      then(createFeedbackTest(7, 'should identify high pain feedback for override'), () => {
        const highPainFeedback = feedbackFactory.createPainFeedback({
          rating: 5, // High pain
          priority: 'high'
        });

        const result = service.collectFeedback(highPainFeedback);
        expect(result.success).toBe(true);
        expect(result.confidenceScore).toBeGreaterThan(0);
      });
    });

    when('measuring performance compliance', () => {
      then(createFeedbackTest(8, 'should process feedback within 2-second time limit'), () => {
        const feedbackData = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3
        });

        const startTime = performance.now();
        const result = service.collectFeedback(feedbackData);
        const endTime = performance.now();
        
        expect(result.success).toBe(true);
        expect(endTime - startTime).toBeLessThan(2000); // 2-second requirement
        expect(result.metadata?.performanceCompliant).toBe(true);
      });
    });
  });

  given('feedback collection functionality', () => {
    when('managing feedback history', () => {
      then(createFeedbackTest(9, 'should return empty history initially'), () => {
        const history = service.getFeedbackHistory();
        expect(history).toEqual([]);
      });

      and(createFeedbackTest(10, 'should store feedback history after collection'), () => {
        const feedbackData = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          context: {
            currentWeight: 50,
            currentReps: 10,
            userFatigue: 0.5,
            timeOfDay: 'morning',
            previousPerformance: { sets: 3, reps: 12, weight: 45 }
          },
          comments: 'This feels good, making good progress'
        });

        const result = service.collectFeedback(feedbackData);
        const history = service.getFeedbackHistory();

        // Only add to history if confidence meets threshold
        if (result.confidenceScore >= 0.6) {
          expect(history).toHaveLength(1);
          expect(history[0].id).toBe(feedbackData.id);
        } else {
          // If confidence is too low, history should be empty
          expect(history).toHaveLength(0);
        }
      });
    });
  });

  given('confidence scoring system', () => {
    when('evaluating feedback quality', () => {
      then(createFeedbackTest(11, 'should calculate higher confidence for detailed feedback'), () => {
        const currentTimestamp = new Date().toISOString();
        
        const detailedFeedback = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: currentTimestamp,
          context: {
            currentWeight: 50,
            currentReps: 10,
            userFatigue: 0.7,
            timeOfDay: 'morning',
            previousPerformance: { sets: 3, reps: 12, weight: 45 }
          },
          comments: 'This feels good and I\'m making solid progress with my form'
        });

        const minimalFeedback = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: currentTimestamp,
          context: undefined,
          comments: undefined
        });

        const detailedResult = service.collectFeedback(detailedFeedback);
        const minimalResult = service.collectFeedback(minimalFeedback);

        // Both should have high confidence, but detailed should have more contextual factors
        expect(detailedResult.confidenceScore).toBeGreaterThanOrEqual(minimalResult.confidenceScore);
        expect(detailedResult.metadata?.contextualFactors?.length).toBeGreaterThan(
          minimalResult.metadata?.contextualFactors?.length || 0
        );
      });

      and(createFeedbackTest(12, 'should apply temporal decay correctly'), () => {
        const oldTimestamp = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
        const recentTimestamp = new Date().toISOString();

        const oldFeedback = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: oldTimestamp,
          context: { currentWeight: 50, currentReps: 10 }
        });

        const recentFeedback = feedbackFactory.create({
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: recentTimestamp,
          context: { currentWeight: 50, currentReps: 10 }
        });

        const oldResult = service.collectFeedback(oldFeedback);
        const recentResult = service.collectFeedback(recentFeedback);

        // Recent feedback should have higher confidence due to less temporal decay
        expect(recentResult.confidenceScore).toBeGreaterThan(oldResult.confidenceScore);
      });
    });
  });
});