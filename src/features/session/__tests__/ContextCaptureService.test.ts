import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextCaptureService } from '../services/ContextCaptureService';
import { AdaptationTrigger } from '../../unified-coaching/types/unifiedCoaching.types';

describe('ContextCaptureService', () => {
  let service: ContextCaptureService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ContextCaptureService.getInstance();
    service.clearContext();
  });

  it('should detect fatigue from form quality trends @p0', () => {
    // Trend of < 70% quality over 3 reps = Fatigue Trigger
    service.recordFormQuality(0.65);
    service.recordFormQuality(0.60);
    const triggers = service.recordFormQuality(0.55);

    expect(triggers).toContain(AdaptationTrigger.FATIGUE);
    expect(triggers).toContain(AdaptationTrigger.FORM_BREAKDOWN);
  });

  it('should detect time constraints when session time is low @p1', () => {
    // If < 5 mins and 3 exercises left = Time Constraint Trigger
    const triggers = service.updateSessionState({
      timeRemaining: 240, // 4 mins
      exercisesRemaining: 3
    });

    expect(triggers).toContain(AdaptationTrigger.TIME_CONSTRAINT);
  });

  it('should aggregate multiple signals @p1', () => {
    service.recordFormQuality(0.6);
    service.recordFormQuality(0.6);
    service.recordFormQuality(0.6);
    
    service.updateSessionState({
      timeRemaining: 200,
      exercisesRemaining: 4
    });

    const activeTriggers = service.getActiveTriggers();
    expect(activeTriggers).toContain(AdaptationTrigger.FATIGUE);
    expect(activeTriggers).toContain(AdaptationTrigger.TIME_CONSTRAINT);
  });
});
