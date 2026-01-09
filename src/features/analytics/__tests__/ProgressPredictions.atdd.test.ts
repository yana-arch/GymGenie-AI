import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictionService } from '../services/PredictionService';

describe('Progress Predictions - ATDD failing tests @atdd', () => {
  let service: PredictionService;

  beforeEach(() => {
    service = PredictionService.getInstance();
  });

  /**
   * Story 5.5: Progress Predictions
   * Requirement: predictions include confidence levels and factors that could influence outcomes
   */
  it('should provide confidence scores and influence factors for each prediction @p0', async () => {
    const data = [
      { date: '2026-01-01', value: 100 },
      { date: '2026-01-08', value: 105 },
      { date: '2026-01-15', value: 110 },
    ];

    const result = service.predictFuturePerformance(data, 4, 'linear');

    // Failing expectation: Currently result.confidence is just a string 'High'/'Low'
    // We want a numeric score and influence factors (e.g. 'consistency', 'volume', 'sleep')
    
    expect(result.confidenceScore).toBeDefined();
    expect(typeof result.confidenceScore).toBe('number');
    
    expect(result.influenceFactors).toBeDefined();
    expect(result.influenceFactors.length).toBeGreaterThan(0);
  });

  /**
   * Story 5.5: Progress Predictions
   * Requirement: realistic projections based on their current trajectory
   */
  it('should detect non-linear trajectories for more realistic projections @p1', async () => {
    // Exponential growth data (doubling every week)
    const data = [
      { date: '2026-01-01', value: 10 },
      { date: '2026-01-08', value: 20 },
      { date: '2026-01-15', value: 40 },
    ];

    // Requesting automatic model detection (new feature 'auto')
    // and predicting 7 days into the future (next week)
    const result = service.predictFuturePerformance(data, 7, 'auto');

    // Linear would predict 60 (40 + 20)
    // Exponential would predict ~80 (40 * 2)
    expect(result.points[6].value).toBeGreaterThan(60);
    expect(result.modelUsed).toBe('exponential');
  });
});
