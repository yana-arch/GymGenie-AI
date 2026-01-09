import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextCaptureService } from '../services/ContextCaptureService';
import { AdaptationTrigger } from '../../unified-coaching/types/unifiedCoaching.types';

describe('Contextual Modifications - ATDD failing tests @atdd', () => {
  let service: ContextCaptureService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = ContextCaptureService.getInstance();
    service.clearContext();
  });

  /**
   * Story 4.3: Contextual Modifications
   * Requirement: Suggestions prioritize user comfort in real-time
   */
  it('should trigger immediate adaptation when discomfort is reported @p0', () => {
    // GIVEN: A user is in an active workout
    
    // WHEN: They report discomfort
    const triggers = service.recordUserComfort('discomfort');

    // THEN: An immediate adaptation trigger is generated
    expect(triggers).toContain(AdaptationTrigger.DISCOMFORT);
  });

  /**
   * Story 4.3: Contextual Modifications
   * Requirement: suggestions maintain workout effectiveness while prioritizing user comfort
   */
  it('should generate a high-severity context when pain is reported @p0', async () => {
    // WHEN: Severe pain is reported
    service.recordUserComfort('pain');
    const context = service.getComfortContext();
    
    // THEN: Context severity is high
    expect(context.severity).toBe('high');
    expect(context.immediateAction).toBe('stop_exercise');
  });
});
