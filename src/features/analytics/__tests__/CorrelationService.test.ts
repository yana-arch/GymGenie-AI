import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CorrelationService } from '../services/CorrelationService';
import { AdaptationEvent } from '@/features/preference-learning/types/preferenceLearning.types';
import { WorkoutHistoryEntry } from '@/types';

describe('CorrelationService', () => {
  let service: CorrelationService;

  beforeEach(() => {
    service = CorrelationService.getInstance();
    service.clearCache();
  });

  it('should be a singleton', () => {
    const instance1 = CorrelationService.getInstance();
    const instance2 = CorrelationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should calculate impact summary correctly @p0', () => {
    const mockAdaptations: AdaptationEvent[] = [
      {
        id: '1',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        triggers: ['fatigue'],
        action: 'reduce_intensity',
        modifications: { newReps: 8 },
        userResponse: 'accepted'
      },
      {
        id: '2',
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        triggers: ['form'],
        action: 'form_correction',
        modifications: { cue: 'Keep back straight' },
        userResponse: 'accepted'
      }
    ];

    const mockHistory: WorkoutHistoryEntry[] = [
      {
        id: 'h1',
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago (after adaptation 1)
        planTitle: 'Test Plan',
        weekNumber: 1,
        dayName: 'Day 1',
        dayTitle: 'Title',
        exercisesCompleted: 5,
        totalExercises: 5,
        durationMinutes: 45,
        syncStatus: 'synced'
      }
    ];

    const summary = service.getRecommendationImpactSummary(mockAdaptations, mockHistory);
    
    expect(summary).toBeDefined();
    expect(summary.totalRecommendations).toBe(2);
    expect(summary.acceptedRate).toBeGreaterThan(0);
  });

  it('should identify "Safety-Enabled Performance Gain" when volume increases after intensity reduction @p1', () => {
    const adaptationTime = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const mockAdaptations: AdaptationEvent[] = [
      {
        id: 'safe-1',
        timestamp: adaptationTime,
        triggers: ['fatigue'],
        action: 'reduce_intensity',
        modifications: { newReps: 8 },
        userResponse: 'accepted'
      }
    ];

    const mockHistory: WorkoutHistoryEntry[] = [
      {
        id: 'pre-h',
        completedAt: new Date(adaptationTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
        planTitle: 'Test Plan',
        weekNumber: 1,
        dayName: 'Day 1',
        dayTitle: 'Title',
        exercisesCompleted: 3,
        totalExercises: 5,
        durationMinutes: 30,
        syncStatus: 'synced'
      },
      {
        id: 'post-h',
        completedAt: new Date(adaptationTime + 1 * 24 * 60 * 60 * 1000).toISOString(),
        planTitle: 'Test Plan',
        weekNumber: 1,
        dayName: 'Day 2',
        dayTitle: 'Title',
        exercisesCompleted: 5,
        totalExercises: 5,
        durationMinutes: 50,
        syncStatus: 'synced'
      }
    ];

    const summary = service.getRecommendationImpactSummary(mockAdaptations, mockHistory);
    const safetyGains = summary.typeBreakdown.find((t: any) => t.type === 'Safety')?.performanceGains || 0;
    expect(safetyGains).toBeGreaterThan(0);
  });

  it('should ignore non-accepted recommendations for performance gains @p2', () => {
    const adaptationTime = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const mockAdaptations: AdaptationEvent[] = [
      {
        id: 'ignored-1',
        timestamp: adaptationTime,
        triggers: ['fatigue'],
        action: 'reduce_intensity',
        modifications: { newReps: 8 },
        userResponse: 'ignored'
      }
    ];

    const mockHistory: WorkoutHistoryEntry[] = [
      {
        id: 'post-h',
        completedAt: new Date(adaptationTime + 1 * 24 * 60 * 60 * 1000).toISOString(),
        planTitle: 'Test Plan',
        weekNumber: 1,
        dayName: 'Day 2',
        dayTitle: 'Title',
        exercisesCompleted: 5,
        totalExercises: 5,
        durationMinutes: 50,
        syncStatus: 'synced'
      }
    ];

    const summary = service.getRecommendationImpactSummary(mockAdaptations, mockHistory);
    const safetyGains = summary.typeBreakdown.find((t: any) => t.type === 'Safety')?.performanceGains || 0;
    expect(safetyGains).toBe(0);
  });

  it('should handle empty history gracefully @p2', () => {
    const mockAdaptations: AdaptationEvent[] = [
      {
        id: '1',
        timestamp: Date.now(),
        triggers: ['fatigue'],
        action: 'reduce_intensity',
        modifications: {},
        userResponse: 'accepted'
      }
    ];

    const summary = service.getRecommendationImpactSummary(mockAdaptations, []);
    expect(summary.totalRecommendations).toBe(1);
    expect(summary.typeBreakdown.length).toBeGreaterThan(0);
  });
});
