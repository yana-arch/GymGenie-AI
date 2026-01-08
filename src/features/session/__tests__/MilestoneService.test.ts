import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MilestoneService } from '../services/MilestoneService';

describe('MilestoneService', () => {
  let service: MilestoneService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MilestoneService();
  });

  it('should detect progress milestones @p1', () => {
    // @ts-ignore - Testing detection logic
    const milestones = service.checkProgressMilestones(0.25);
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('PROGRESS');
    expect(milestones[0].value).toBe(25);
  });

  it('should detect streak milestones @p1', () => {
    // Simulate 3 perfect form exercises
    service.recordFormQuality(true);
    service.recordFormQuality(true);
    const milestones = service.recordFormQuality(true);
    
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('STREAK');
    expect(milestones[0].value).toBe(3);
  });

  it('should detect personal bests @p1', () => {
    const historicalData = [
      { exerciseId: 'squat', weight: 100, reps: 10 },
    ];
    
    const milestones = service.checkPersonalBest('squat', 105, 10, historicalData);
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('PERSONAL_BEST');
    expect(milestones[0].label).toContain('105');
  });

  it('should detect volume milestones @p1', () => {
    // 1000kg milestone
    service.addVolume(900);
    const milestones = service.addVolume(150); // Total 1050
    
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('VOLUME');
    expect(milestones[0].value).toBe(1000);
  });
});
