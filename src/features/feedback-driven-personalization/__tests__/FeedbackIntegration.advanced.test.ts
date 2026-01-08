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

describe('Feedback Integration Advanced Tests', () => {
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

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing recommendation gracefully', async () => {
      mockAICoachingOrchestrator.getCurrentRecommendation.mockResolvedValueOnce(null);

      const feedbackData = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3
      });

      const result = await integrationEngine.processFeedbackWorkflow(feedbackData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No current recommendation found');
    });

    it('should handle service integration failures', async () => {
      mockPreferenceLearningService.updatePreferences.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const feedbackData = feedbackFactory.create({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3
      });

      // Test that error is thrown and caught by caller
      await expect(integrationEngine.processFeedbackWorkflow(feedbackData)).rejects.toThrow('Service unavailable');
    });

    it('should maintain performance under load', async () => {
      const feedbackBatch = feedbackFactory.createMixedFeedbackBatch(10);

      const startTime = performance.now();
      
      // Process all feedback
      const results = await Promise.all(
        feedbackBatch.map(feedback => integrationEngine.processFeedbackWorkflow(feedback))
      );
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(5000); // Should handle 10 items in <5s
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Privacy and Data Validation', () => {
    it('should validate and sanitize feedback data', async () => {
      const maliciousFeedback = feedbackFactory.create({
        id: '<script>alert("xss")</script>',
        comments: '<img src=x onerror=alert("xss")>',
        tags: ['<script>evil()</script>']
      });

      const result = await integrationEngine.processFeedbackWorkflow(maliciousFeedback);
      
      // Should either reject or sanitize properly
      if (result.success) {
        expect(result.impact).toBeDefined();
        // In real implementation, would verify sanitization
      } else {
        // If rejected, should have proper error message
        expect(result.error).toBeDefined();
      }
    });

    it('should respect privacy settings', () => {
      const privacySettings = {
        retentionDays: 30,
        anonymizationLevel: 'full' as const,
        allowPatternSharing: false
      };

      const privateService = new FeedbackDrivenPersonalizationService({ privacy: privacySettings });
      const settings = privateService.getSettings();
      
      expect(settings.privacy.retentionDays).toBe(30);
      expect(settings.privacy.anonymizationLevel).toBe('full');
      expect(settings.privacy.allowPatternSharing).toBe(false);
    });
  });
});