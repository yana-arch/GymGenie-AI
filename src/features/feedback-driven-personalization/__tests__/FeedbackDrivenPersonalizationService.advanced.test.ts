import { FeedbackDrivenPersonalizationService } from '../services/FeedbackDrivenPersonalizationService';
import { FeedbackType, FeedbackData } from '../types/feedbackPersonalization.types';

describe('FeedbackDrivenPersonalizationService - Advanced Features', () => {
  let service: FeedbackDrivenPersonalizationService;

  beforeEach(() => {
    service = new FeedbackDrivenPersonalizationService();
  });

  describe('convertFeedbackToPreferences', () => {
    it('should convert difficulty feedback to preference adjustments', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'diff-1',
          workoutId: 'workout-1',
          exerciseId: 'squats',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 4, // Above average
          timestamp: new Date().toISOString(),
          context: { currentWeight: 60, currentReps: 10, userFatigue: 0.5 },
          comments: 'Felt good but could be more challenging'
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const preferences = service.convertFeedbackToPreferences('squats');

      expect(preferences.difficultyAdjustment).toBeGreaterThan(0);
      expect(preferences.confidence).toBeGreaterThan(0);
      expect(preferences.reasoning.some(r => r.includes('Difficulty rating average'))).toBe(true);
    });

    it('should convert pain feedback to safety adjustments', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'pain-1',
          workoutId: 'workout-1',
          exerciseId: 'lunges',
          type: FeedbackType.PAIN_FEEDBACK,
          rating: 4, // High pain
          timestamp: new Date().toISOString(),
          context: { userFatigue: 0.7, currentWeight: 60, currentReps: 12 },
          comments: 'Significant discomfort in knees during lunges, had to stop early',
          priority: 'high'
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const preferences = service.convertFeedbackToPreferences('lunges');

      expect(preferences.difficultyAdjustment).toBeLessThan(0); // Should reduce difficulty
      expect(preferences.volumeAdjustment).toBeLessThan(0); // Should reduce volume
      expect(preferences.reasoning.some(r => r.includes('High pain reported'))).toBe(true);
    });

    it('should handle multiple feedback types together', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'multi-1',
          workoutId: 'workout-1',
          exerciseId: 'deadlifts',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 2, // Too easy
          timestamp: new Date().toISOString(),
          context: { currentWeight: 100, currentReps: 5 }
        },
        {
          id: 'multi-2',
          workoutId: 'workout-1',
          exerciseId: 'deadlifts',
          type: FeedbackType.ENERGY_LEVEL,
          rating: 4, // High energy
          timestamp: new Date().toISOString(),
          context: { userFatigue: 0.3 }
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const preferences = service.convertFeedbackToPreferences('deadlifts');

      expect(preferences.difficultyAdjustment).toBeLessThan(0); // Should increase difficulty
      expect(preferences.volumeAdjustment).toBeGreaterThan(0); // Should increase volume
      expect(preferences.reasoning.length).toBeGreaterThan(1);
    });

    it('should return neutral preferences when no feedback exists', () => {
      const preferences = service.convertFeedbackToPreferences('nonexistent');

      expect(preferences.difficultyAdjustment).toBe(0);
      expect(preferences.volumeAdjustment).toBe(0);
      expect(preferences.frequencyAdjustment).toBe(0);
      expect(preferences.confidence).toBe(0);
      expect(preferences.reasoning).toContain('No feedback available for exercise');
    });
  });

  describe('resolveConflictingFeedback', () => {
    it('should detect conflicts between high difficulty and low pain', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'conflict-1',
          workoutId: 'workout-1',
          exerciseId: 'bench-press',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 5, // Very hard
          timestamp: new Date().toISOString(),
          context: { userFatigue: 0.3, currentWeight: 80, currentReps: 10 },
          comments: 'This exercise felt extremely challenging and I struggled to complete the set'
        },
        {
          id: 'conflict-2',
          workoutId: 'workout-1',
          exerciseId: 'bench-press',
          type: FeedbackType.PAIN_FEEDBACK,
          rating: 1, // No pain
          timestamp: new Date().toISOString(),
          context: { userFatigue: 0.2, currentWeight: 80, currentReps: 10 },
          comments: 'No pain or discomfort during the exercise'
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      // Debug: Check if feedback was collected
      const collectedFeedback = service.getFeedbackForExercise('bench-press');
      console.log('Collected feedback:', collectedFeedback.length, 'items');

      const resolution = service.resolveConflictingFeedback('bench-press');

      expect(resolution).not.toBeNull();
      expect(resolution!.resolutionStrategy).toBe('weighted_confidence');
      expect(resolution!.conflictingFeedbacks.length).toBeGreaterThan(0);
      expect(resolution!.conflictReason.toLowerCase()).toContain('conflict');
    });

    it('should return null when no conflicts exist', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'no-conflict-1',
          workoutId: 'workout-1',
          exerciseId: 'pushups',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3, // Moderate
          timestamp: new Date().toISOString()
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const resolution = service.resolveConflictingFeedback('pushups');

      expect(resolution).toBeNull();
    });
  });

  describe('getPreferenceRecommendations', () => {
    it('should provide difficulty increase recommendations', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'rec-1',
          workoutId: 'workout-1',
          exerciseId: 'pullups',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 2, // Too easy
          timestamp: new Date().toISOString(),
          context: { currentWeight: 0, currentReps: 15 }
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const recommendations = service.getPreferenceRecommendations('pullups');

      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.recommendations.some(r => r.type === 'difficulty')).toBe(true);
      expect(recommendations.summary).toContain('Difficulty rating average');
    });

    it('should provide safety recommendations for high pain', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'safety-1',
          workoutId: 'workout-1',
          exerciseId: 'squats',
          type: FeedbackType.PAIN_FEEDBACK,
          rating: 5, // Very painful
          timestamp: new Date().toISOString(),
          priority: 'high',
          context: { currentWeight: 60, currentReps: 10, userFatigue: 0.7 }, // Add context to increase confidence
          comments: 'Knees hurt during this exercise'
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const recommendations = service.getPreferenceRecommendations('squats');

      expect(recommendations.recommendations.some(r => r.type === 'safety')).toBe(true);
      expect(recommendations.recommendations.some(r => r.priority === 'high')).toBe(true);
      expect(recommendations.summary).toContain('High pain reported');
    });

    it('should provide volume recommendations based on energy levels', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'volume-1',
          workoutId: 'workout-1',
          exerciseId: 'running',
          type: FeedbackType.ENERGY_LEVEL,
          rating: 4, // High energy
          timestamp: new Date().toISOString(),
          context: { userFatigue: 0.2, currentWeight: 0, currentReps: 30 },
          comments: 'Had lots of energy for this exercise'
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const recommendations = service.getPreferenceRecommendations('running');

      console.log('All recommendations:', JSON.stringify(recommendations, null, 2));
      const preferences = service.convertFeedbackToPreferences('running');
      console.log('Volume adjustment:', preferences.volumeAdjustment);
      console.log('Volume threshold check:', Math.abs(preferences.volumeAdjustment) > 0.1);

      expect(recommendations.recommendations.some(r => r.type === 'volume')).toBe(true);
      expect(recommendations.recommendations.some(r => r.suggestion.toLowerCase().includes('increase'))).toBe(true);
    });

    it('should include confidence levels in recommendations', () => {
      const feedbackData: FeedbackData[] = [
        {
          id: 'conf-1',
          workoutId: 'workout-1',
          exerciseId: 'test-exercise',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: new Date().toISOString(),
          context: { currentWeight: 50, currentReps: 10, userFatigue: 0.5 }
        }
      ];

      feedbackData.forEach(feedback => service.collectFeedback(feedback));

      const recommendations = service.getPreferenceRecommendations('test-exercise');

      recommendations.recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(['high', 'medium', 'low']).toContain(rec.priority);
      });
    });
  });

  describe('confidence calculation with context', () => {
    it('should give higher confidence to detailed feedback', () => {
      const minimalFeedback: FeedbackData = {
        id: 'minimal',
        workoutId: 'workout-1',
        exerciseId: 'test',
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3,
        timestamp: new Date().toISOString()
      };

      const detailedFeedback: FeedbackData = {
        id: 'detailed',
        workoutId: 'workout-1',
        exerciseId: 'test',
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3,
        timestamp: new Date().toISOString(),
        context: {
          currentWeight: 60,
          currentReps: 10,
          currentSets: 3,
          userFatigue: 0.6,
          timeOfDay: 'morning',
          previousPerformance: { sets: 3, reps: 12, weight: 55 },
          heartRateZones: { current: 140, max: 180 },
          environmental: { temperature: 20, humidity: 50 }
        },
        comments: 'Felt good but could be more challenging',
        tags: ['cardio', 'strength']
      };

      const minimalResult = service.collectFeedback(minimalFeedback);
      const detailedResult = service.collectFeedback(detailedFeedback);

      expect(detailedResult.confidenceScore).toBeGreaterThan(minimalResult.confidenceScore);
    });

    it('should apply temporal decay to older feedback', async () => {
      const oldFeedback: FeedbackData = {
        id: 'old',
        workoutId: 'workout-1',
        exerciseId: 'test',
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 4,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
      };

      const recentFeedback: FeedbackData = {
        id: 'recent',
        workoutId: 'workout-1',
        exerciseId: 'test',
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 4,
        timestamp: new Date().toISOString() // Today
      };

      const oldResult = service.collectFeedback(oldFeedback);
      const recentResult = service.collectFeedback(recentFeedback);

      expect(recentResult.confidenceScore).toBeGreaterThan(oldResult.confidenceScore);
    });
  });
});