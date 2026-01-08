import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncouragementService } from '../services/EncouragementService';
import { AudioCoachingService } from '@/features/form-correction/services/AudioCoachingService';
import { ContextCaptureService } from '../services/ContextCaptureService';
import { coachingIntelligenceService } from '@/features/unified-coaching/services/CoachingIntelligenceService';

vi.mock('@/features/form-correction/services/AudioCoachingService', () => ({
  AudioCoachingService: {
    getInstance: vi.fn()
  }
}));

vi.mock('../services/ContextCaptureService', () => ({
  ContextCaptureService: {
    getInstance: vi.fn()
  }
}));

vi.mock('@/features/unified-coaching/services/CoachingIntelligenceService', () => ({
  coachingIntelligenceService: {
    getPreferences: vi.fn().mockReturnValue({
      communicationFrequency: 'moderate',
      communicationTone: 'encouraging'
    })
  }
}));

describe('EncouragementService', () => {
  let service: EncouragementService;
  let mockAudio: any;
  let mockContextCapture: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAudio = {
      speak: vi.fn(),
    };
    vi.mocked(AudioCoachingService.getInstance).mockReturnValue(mockAudio);

    mockContextCapture = {
      getContextSnapshot: vi.fn()
    };
    vi.mocked(ContextCaptureService.getInstance).mockReturnValue(mockContextCapture);

    service = EncouragementService.getInstance();
    service.resetSetProgress();
    // @ts-ignore - access private for testing
    service.lastEncouragementTime = 0;
  });

  it('should trigger encouragement at 50% set progress @p1', () => {
    service.checkSetProgress(5, 10);
    expect(mockAudio.speak).toHaveBeenCalledWith(
      expect.stringContaining('Halfway'),
      expect.anything()
    );
  });

  it('should trigger encouragement at 90% set progress @p1', () => {
    service.checkSetProgress(9, 10);
    expect(mockAudio.speak).toHaveBeenCalledWith(
      expect.stringContaining('Almost done'),
      expect.anything()
    );
  });

  it('should not repeat same progress milestone in same set @p1', () => {
    service.checkSetProgress(5, 10);
    service.checkSetProgress(5, 10);
    expect(mockAudio.speak).toHaveBeenCalledTimes(1);
  });

  it('should trigger fatigue encouragement when fatigue detected @p1', () => {
    mockContextCapture.getContextSnapshot.mockReturnValue({
      formQualityHistory: [],
      sessionState: { timeRemaining: 3600, exercisesRemaining: 5 },
      activeTriggers: [],
      recentFatigue: true
    } as any);

    service.checkFatigue();
    expect(mockAudio.speak).toHaveBeenCalled();
  });

  it('should respect cooldown between encouragements @p1', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    service.triggerEncouragement('First');
    expect(mockAudio.speak).toHaveBeenCalledWith('First', expect.anything());

    vi.setSystemTime(now + 10000); // 10s later
    service.triggerEncouragement('Second');
    expect(mockAudio.speak).not.toHaveBeenCalledWith('Second', expect.anything());

    vi.setSystemTime(now + 31000); // 31s later
    service.triggerEncouragement('Third');
    expect(mockAudio.speak).toHaveBeenCalledWith('Third', expect.anything());

    vi.useRealTimers();
  });
});
