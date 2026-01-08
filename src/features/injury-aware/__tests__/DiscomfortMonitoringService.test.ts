import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscomfortMonitoringService } from '../services/DiscomfortMonitoringService';

describe('DiscomfortMonitoringService', () => {
  let service: DiscomfortMonitoringService;

  beforeEach(() => {
    service = new DiscomfortMonitoringService();
  });

  describe('Discomfort Detection', () => {
    it('should detect and record discomfort events', async () => {
      const discomfortData = {
        severity: 3 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Sharp pain during squat',
        exercise: 'squats'
      };

      const result = await service.recordDiscomfort(discomfortData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.severity).toBe(3);
      expect(result.location).toBe('left_knee');
      expect(result.timestamp).toBeDefined();
    });

    it('should detect high severity discomfort requiring immediate response', async () => {
      const severeDiscomfort = {
        severity: 5 as 1 | 2 | 3 | 4 | 5,
        location: 'lower_back',
        description: 'Severe sharp pain',
        exercise: 'deadlifts'
      };

      const result = await service.recordDiscomfort(severeDiscomfort);
      
      expect(result.severity).toBe(5);
      expect(result.requiresImmediateResponse).toBe(true);
    });

    it('should track discomfort patterns over time', async () => {
      // Clear previous data for clean test
      await service.clearDiscomfortHistory();
      
      // Record multiple discomfort events
      await service.recordDiscomfort({
        severity: 2 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Mild discomfort',
        exercise: 'squats'
      });

      await service.recordDiscomfort({
        severity: 3 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Increasing discomfort',
        exercise: 'lunges'
      });

      const patterns = await service.analyzeDiscomfortPatterns('left_knee');
      
      expect(patterns.frequency).toBe(2);
      expect(patterns.averageSeverity).toBe(2.5);
      expect(['increasing', 'stable']).toContain(patterns.trend);
    });
  });

  describe('Real-Time Monitoring', () => {
    it('should detect discomfort within 500ms requirement', async () => {
      const startTime = Date.now();
      
      await service.recordDiscomfort({
        severity: 2 as 1 | 2 | 3 | 4 | 5,
        location: 'shoulder',
        description: 'Mild discomfort',
        exercise: 'pushups'
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(500);
    });

    it('should trigger immediate response for severe discomfort', async () => {
      const responseCallback = vi.fn();
      service.setResponseCallback(responseCallback);

      await service.recordDiscomfort({
        severity: 4 as 1 | 2 | 3 | 4 | 5,
        location: 'right_shoulder',
        description: 'Intense pain',
        exercise: 'overhead_press'
      });

      expect(responseCallback).toHaveBeenCalledWith({
        action: 'stop_exercise',
        reason: 'high_severity_discomfort',
        recommendation: 'immediate_rest',
        severity: 'high'
      });
    });

    it('should provide discomfort history for AI learning', async () => {
      await service.recordDiscomfort({
        severity: 2 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Mild pain',
        exercise: 'squats'
      });

      const history = await service.getDiscomfortHistory();
      
      expect(history.length).toBeGreaterThan(0);
      const latestEvent = history[history.length - 1];
      expect(latestEvent.exercise).toBe('squats');
      expect(latestEvent.location).toBe('left_knee');
    });
  });

  describe('Local Processing Compliance', () => {
    it('should store discomfort data locally only', async () => {
      const discomfortEvent = {
        severity: 3 as 1 | 2 | 3 | 4 | 5,
        location: 'right_ankle',
        description: 'Twinge',
        exercise: 'running'
      };

      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      await service.recordDiscomfort(discomfortEvent);
      
      expect(localStorageSpy).toHaveBeenCalledWith(
        'discomfort-history',
        expect.any(String)
      );
      
      localStorageSpy.mockRestore();
    });

    it('should never transmit discomfort data externally', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      
      await service.recordDiscomfort({
        severity: 1 as 1 | 2 | 3 | 4 | 5,
        location: 'general',
        description: 'Fatigue',
        exercise: 'general'
      });
      
      expect(fetchSpy).not.toHaveBeenCalled();
      
      fetchSpy.mockRestore();
    });
  });

  describe('Discomfort Analysis', () => {
    it('should identify problematic exercises', async () => {
      // Record discomfort for specific exercise
      await service.recordDiscomfort({
        severity: 3 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Pain',
        exercise: 'deep_squats'
      });

      const problematicExercises = await service.identifyProblematicExercises();
      
      expect(problematicExercises.length).toBeGreaterThan(0);
    });

    it('should suggest exercise alternatives', async () => {
      await service.recordDiscomfort({
        severity: 3 as 1 | 2 | 3 | 4 | 5,
        location: 'left_knee',
        description: 'Knee pain',
        exercise: 'jumping'
      });

      const alternatives = await service.suggestAlternatives('jumping');
      
      expect(alternatives).toContain('seated_cardio');
      expect(alternatives).toContain('upper_body_workout');
    });
  });
});
