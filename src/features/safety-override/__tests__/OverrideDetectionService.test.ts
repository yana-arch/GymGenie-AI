import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverrideDetectionService } from '../services/OverrideDetectionService';
import type { AIRecommendation, OverrideEvent } from '../services/OverrideDetectionService';

describe('OverrideDetectionService', () => {
  let service: OverrideDetectionService;
  let mockRecommendation: AIRecommendation;

  beforeEach(() => {
    service = new OverrideDetectionService();
    mockRecommendation = {
      id: 'test-rec-1',
      type: 'exercise_modification',
      exerciseName: 'Squats',
      originalReps: 12,
      suggestedReps: 10,
      originalSets: 3,
      suggestedSets: 3,
      reasoning: 'Reduce reps to maintain form while tired',
      timestamp: Date.now(),
      context: {
        energyLevel: 'tired',
        timeRemaining: 15,
        equipmentAvailable: ['bodyweight']
      }
    };
  });

  afterEach(() => {
    service.destroy();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = service.getState();
      expect(state.isMonitoring).toBe(false);
      expect(state.overrideHistory).toEqual([]);
      expect(state.currentRecommendations).toEqual([]);
    });
  });

  describe('monitoring functionality', () => {
    it('should start monitoring for overrides', () => {
      service.startMonitoring();
      const state = service.getState();
      expect(state.isMonitoring).toBe(true);
    });

    it('should stop monitoring for overrides', () => {
      service.startMonitoring();
      service.stopMonitoring();
      const state = service.getState();
      expect(state.isMonitoring).toBe(false);
    });

    it('should not detect overrides when not monitoring', async () => {
      const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
      expect(overrideEvent).toBeNull();
    });
  });

  describe('override detection', () => {
    beforeEach(() => {
      service.startMonitoring();
    });

    it('should detect override when user disagrees with recommendation', async () => {
      const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
      
      expect(overrideEvent).not.toBeNull();
      expect(overrideEvent!.recommendationId).toBe(mockRecommendation.id);
      expect(overrideEvent!.userAction).toBe('disagree');
      expect(overrideEvent!.timestamp).toBeDefined();
      expect(overrideEvent!.context).toEqual(mockRecommendation.context);
    });

    it('should detect override when user taps override button', async () => {
      const overrideEvent = await service.detectOverride(mockRecommendation, 'override_tap');
      
      expect(overrideEvent).not.toBeNull();
      expect(overrideEvent!.userAction).toBe('override_tap');
      expect(overrideEvent!.interactionMethod).toBe('one_tap');
    });

    it('should return null for non-override actions', async () => {
      const overrideEvent = await service.detectOverride(mockRecommendation, 'view_details');
      expect(overrideEvent).toBeNull();
    });

    it('should store override event in history', async () => {
      await service.detectOverride(mockRecommendation, 'disagree');
      const state = service.getState();
      expect(state.overrideHistory).toHaveLength(1);
      expect(state.overrideHistory[0].recommendationId).toBe(mockRecommendation.id);
    });
  });

  describe('recommendation management', () => {
    it('should add current recommendations', () => {
      service.addRecommendation(mockRecommendation);
      const state = service.getState();
      expect(state.currentRecommendations).toContain(mockRecommendation);
    });

    it('should remove recommendations', () => {
      service.addRecommendation(mockRecommendation);
      service.removeRecommendation(mockRecommendation.id);
      const state = service.getState();
      expect(state.currentRecommendations).not.toContain(mockRecommendation);
    });

    it('should clear all recommendations', () => {
      service.addRecommendation(mockRecommendation);
      service.clearRecommendations();
      const state = service.getState();
      expect(state.currentRecommendations).toEqual([]);
    });
  });

  describe('performance requirements', () => {
    it('should detect overrides within 2 seconds', async () => {
      service.startMonitoring();
      const startTime = Date.now();
      
      await service.detectOverride(mockRecommendation, 'disagree');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(2000); // 2 second requirement
    });
  });

  describe('privacy compliance', () => {
    it('should not include PII in override events', async () => {
      service.startMonitoring();
      const overrideEvent = await service.detectOverride(mockRecommendation, 'disagree');
      
      expect(overrideEvent).not.toBeNull();
      expect(overrideEvent!.userId).toBeUndefined();
      expect(overrideEvent!.personalInfo).toBeUndefined();
    });

    it('should store only context data locally', async () => {
      service.startMonitoring();
      await service.detectOverride(mockRecommendation, 'disagree');
      
      const state = service.getState();
      const overrideEvent = state.overrideHistory[0];
      
      // Should only contain workout context, not personal data
      expect(overrideEvent.context).toBeDefined();
      expect(Object.keys(overrideEvent)).not.toContain('personalInfo');
    });
  });
});