import { FeedbackIntegrationEngine, IPreferenceLearningService, IHistoricalPatternsService, IAICoachingOrchestrator } from '../services/FeedbackIntegrationEngine';
import { FeedbackData, FeedbackType, FeedbackImpact } from '../types/feedbackPersonalization.types';
import { vi } from 'vitest';
import { feedbackFactory } from '@/test-utils/factories/FeedbackFactory';
import { workoutSessionFactory } from '@/test-utils/factories/WorkoutSessionFactory';
import { userProfileFactory } from '@/test-utils/factories/UserProfileFactory';

// Mock for vitest
const mockPreferenceLearningService = {
  updatePreferences: vi.fn().mockResolvedValue(undefined),
  getCurrentPreferences: vi.fn().mockResolvedValue({ difficultyLevel: 0.5, volumeLevel: 0.3 })
} as any;

const mockHistoricalPatternsService = {
  getExerciseHistory: vi.fn().mockResolvedValue([]),
  detectPatterns: vi.fn().mockResolvedValue([])
} as any as IHistoricalPatternsService;

const mockAICoachingOrchestrator = {
  applyFeedbackImpact: vi.fn(),
  getCurrentRecommendation: vi.fn()
} as any as IAICoachingOrchestrator;

describe('FeedbackIntegrationEngine', () => {
  let engine: FeedbackIntegrationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FeedbackIntegrationEngine(
      mockPreferenceLearningService,
      mockHistoricalPatternsService,
      mockAICoachingOrchestrator
    );
  });

  describe('integrateFeedbackWithPreferences', () => {
    it('should integrate feedback with preference learning service', async () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 4,
        context: { currentWeight: 60, currentReps: 10 }
      });

      await engine.integrateFeedbackWithPreferences(feedback);

      expect(mockPreferenceLearningService.updatePreferences).toHaveBeenCalledWith(
        feedback.exerciseId, // exerciseId as userId
        expect.objectContaining({
          difficultyLevel: expect.any(Number),
          confidence: expect.any(Number)
        })
      );
    });

    it('should combine feedback with historical patterns', async () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3
      });

      await engine.integrateFeedbackWithPreferences(feedback);

      expect(mockHistoricalPatternsService.getExerciseHistory).toHaveBeenCalledWith(feedback.exerciseId);
      expect(mockPreferenceLearningService.updatePreferences).toHaveBeenCalled();
    });
  });

  describe('modifyRecommendations', () => {
    it('should modify AI coaching recommendations based on feedback', async () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 2 // Too easy
      });

      const impact: FeedbackImpact = {
        recommendationId: feedback.id + '-rec',
        originalWeight: 50,
        originalReps: 10,
        adjustedWeight: 55,
        adjustedReps: 12,
        confidence: 0.8,
        reasoning: ['User found exercise too easy'],
        feedbackSources: [feedback.id]
      };

      await engine.modifyRecommendations(feedback, impact);

      expect(mockAICoachingOrchestrator.applyFeedbackImpact).toHaveBeenCalledWith(impact);
    });

    it('should not modify recommendations with low confidence', async () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3,
        context: undefined // No context = low confidence
      });

      const impact: FeedbackImpact = {
        recommendationId: feedback.id + '-low-conf',
        originalWeight: 50,
        originalReps: 10,
        adjustedWeight: 55,
        adjustedReps: 12,
        confidence: 0.3, // Low confidence
        reasoning: [],
        feedbackSources: [feedback.id]
      };

      await engine.modifyRecommendations(feedback, impact);

      expect(mockAICoachingOrchestrator.applyFeedbackImpact).not.toHaveBeenCalled();
    });
  });

  describe('createFeedbackImpact', () => {
    it('should create impact with proper structure', () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 4,
        context: { currentWeight: 80, currentReps: 8 }
      });

      const currentRecommendation = {
        id: feedback.id + '-rec',
        exerciseId: feedback.exerciseId,
        weight: 80,
        reps: 8,
        sets: 3
      };

      const impact = engine.createFeedbackImpact(feedback, currentRecommendation);

      expect(impact).toMatchObject({
        recommendationId: currentRecommendation.id,
        originalWeight: 80,
        originalReps: 8,
        adjustedWeight: expect.any(Number),
        adjustedReps: expect.any(Number),
        confidence: expect.any(Number),
        reasoning: expect.any(Array),
        feedbackSources: [feedback.id]
      });
    });

    it('should handle pain feedback with safety overrides', () => {
      const painFeedback = feedbackFactory.createPainFeedback({
        rating: 5, // High pain
        priority: 'high'
      });

      const currentRecommendation = {
        id: painFeedback.id + '-rec',
        exerciseId: painFeedback.exerciseId,
        weight: 0,
        reps: 15,
        sets: 3
      };

      const impact = engine.createFeedbackImpact(painFeedback, currentRecommendation);

      // Check that reasoning contains safety-related content
      const reasoningText = impact.reasoning.join(' ');
      expect(reasoningText).toContain('safety');
      expect(impact.confidence).toBeGreaterThan(0.8); // Pain feedback should have high confidence
    });
  });

  describe('integration workflow', () => {
    it('should complete full integration workflow', async () => {
      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 2,
        context: { currentWeight: 0, currentReps: 12, userFatigue: 0.3 }
      });

      const currentRecommendation = {
        id: feedback.id + '-workflow',
        exerciseId: feedback.exerciseId,
        weight: 0,
        reps: 12,
        sets: 3
      };

      // Execute full workflow
      const impact = engine.createFeedbackImpact(feedback, currentRecommendation);
      await engine.integrateFeedbackWithPreferences(feedback);
      await engine.modifyRecommendations(feedback, impact);

      expect(impact.feedbackSources).toContain(feedback.id);
      expect(mockPreferenceLearningService.updatePreferences).toHaveBeenCalled();
      expect(mockHistoricalPatternsService.getExerciseHistory).toHaveBeenCalledWith(feedback.exerciseId);
      expect(mockAICoachingOrchestrator.applyFeedbackImpact).toHaveBeenCalledWith(impact);
    });
  });

  describe('error handling', () => {
    it('should handle integration service errors gracefully', async () => {
      mockPreferenceLearningService.updatePreferences.mockRejectedValue(new Error('Service unavailable'));

      const feedback = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3
      });

      await expect(engine.integrateFeedbackWithPreferences(feedback)).rejects.toThrow('Service unavailable');
    });

    it('should handle invalid feedback data', () => {
      const invalidFeedback = feedbackFactory.createInvalidFeedback();

      const currentRecommendation = {
        id: invalidFeedback.id + '-rec',
        exerciseId: 'test',
        weight: 50,
        reps: 10,
        sets: 3
      };

      expect(() => engine.createFeedbackImpact(invalidFeedback, currentRecommendation)).toThrow();
    });
  });
});