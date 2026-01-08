import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionGuidanceService } from '../services/SessionGuidanceService';
import { aiCoachingOrchestrator } from '@/features/unified-coaching/AICoachingOrchestrator';

// Mock the orchestrator
vi.mock('@/features/unified-coaching/AICoachingOrchestrator', () => ({
  aiCoachingOrchestrator: {
    processIntegratedCoaching: vi.fn()
  }
}));

describe('SessionGuidanceService', () => {
  let service: SessionGuidanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SessionGuidanceService();
  });

  it('should initialize with default state @p1', () => {
    expect(service).toBeDefined();
    expect(service.isLoopRunning()).toBe(false);
  });

  it('should start and stop the guidance loop @p1', () => {
    service.startGuidanceLoop();
    expect(service.isLoopRunning()).toBe(true);
    
    service.stopGuidanceLoop();
    expect(service.isLoopRunning()).toBe(false);
  });

  it('should query AICoachingOrchestrator when loop is running @p1', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: 'ADAPTATION',
      response: {
        type: 'adaptation',
        confidence: 0.8,
        recommendation: { action: 'continue', message: 'Keep it up!' },
        reasoning: 'Good pace',
        timestamp: Date.now()
      }
    };

    (aiCoachingOrchestrator.processIntegratedCoaching as any).mockResolvedValue(mockDecision);

    // Manually trigger one tick for testing
    const decision = await service.processGuidanceTick({
      liveSession: {} as any,
      formCorrection: {} as any,
      safetyOverride: {} as any,
      injuryAware: {} as any
    });

    expect(aiCoachingOrchestrator.processIntegratedCoaching).toHaveBeenCalled();
    expect(decision).toEqual(mockDecision);
  });

  it('should detect milestones based on progress @p1', () => {
    const milestones = service.checkMilestones(0.25);
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('PROGRESS');
    expect(milestones[0].value).toBe(25);
    
    const noNewMilestones = service.checkMilestones(0.26);
    expect(noNewMilestones).toHaveLength(0);
    
    const nextMilestone = service.checkMilestones(0.51);
    expect(nextMilestone).toHaveLength(1);
    expect(nextMilestone[0].value).toBe(50);
  });
});
