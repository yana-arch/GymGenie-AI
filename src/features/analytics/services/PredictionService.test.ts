import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictionService } from './PredictionService';

describe('PredictionService', () => {
  let service: PredictionService;

  beforeEach(() => {
    service = PredictionService.getInstance();
  });

  describe('predictFuturePerformance', () => {
    it('should predict upward trend correctly using linear model', () => {
      // Linear data: y = 2x + 10
      const data = [
        { date: '2026-01-01', value: 10 },
        { date: '2026-01-02', value: 12 },
        { date: '2026-01-03', value: 14 },
        { date: '2026-01-04', value: 16 },
        { date: '2026-01-05', value: 18 },
      ];

      const result = service.predictFuturePerformance(data, 5, 'linear');
      
      expect(result.points).toHaveLength(5);
      // Next point should be ~20
      expect(result.points[0].value).toBeCloseTo(20);
      expect(result.points[4].value).toBeCloseTo(28);
      expect(result.modelUsed).toBe('linear');
    });

    it('should calculate confidence intervals', () => {
      const data = [
        { date: '2026-01-01', value: 10 },
        { date: '2026-01-02', value: 11 },
        { date: '2026-01-03', value: 10 },
        { date: '2026-01-04', value: 12 },
        { date: '2026-01-05', value: 11 },
      ];

      const result = service.predictFuturePerformance(data, 5, 'linear');
      
      expect(result.points[0].confidenceIntervalUpper).toBeGreaterThan(result.points[0].value);
      expect(result.points[0].confidenceIntervalLower).toBeLessThan(result.points[0].value);
    });

    it('should return "High" confidence for consistent data with many points', () => {
      const data = Array.from({ length: 15 }, (_, i) => ({
        date: `2026-01-${i + 1}`,
        value: 10 + i * 2
      }));

      const result = service.predictFuturePerformance(data, 5, 'linear');
      expect(result.confidence).toBe('High');
    });
  });

  describe('estimateDateForTarget', () => {
    it('should estimate the date to reach a target value', () => {
      const data = [
        { date: '2026-01-01', value: 100 },
        { date: '2026-01-08', value: 105 },
        { date: '2026-01-15', value: 110 },
      ];

      // Trend is +5 per week
      // To reach 120, should take 2 more weeks -> 2026-01-29
      const result = service.estimateDateForTarget(data, 120);
      
      expect(result.targetValue).toBe(120);
      expect(result.estimatedDate).toBeDefined();
      const estimatedDate = new Date(result.estimatedDate);
      expect(estimatedDate.getTime()).toBeGreaterThan(new Date('2026-01-15').getTime());
    });
  });
});
