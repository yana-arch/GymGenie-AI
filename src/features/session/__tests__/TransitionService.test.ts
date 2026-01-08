import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransitionService } from '../services/TransitionService';
import { FormAnalysisService } from '@/features/form-correction/services/FormAnalysisService';
import { store } from '@/store';
import { setIsActive } from '../store/liveSessionSlice';

// Mock the store for testing state updates
vi.mock('@/store', () => ({
  store: {
    dispatch: vi.fn(),
    getState: vi.fn(() => ({
      liveSession: {
        isActive: true,
      }
    })),
  },
}));

describe('TransitionService', () => {
  let service: TransitionService;

  beforeEach(() => {
    vi.useFakeTimers();
    FormAnalysisService.resetInstance();
    TransitionService['instance'] = undefined as any; // Reset singleton
    service = TransitionService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should be a singleton', () => {
    const instance1 = TransitionService.getInstance();
    const instance2 = TransitionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should start rest period with correct duration @p0', () => {
    service.startRest(60, 'Squats');
    
    // Check if store was dispatched with transition state
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'liveSession/setTransitionStatus',
      payload: 'resting'
    }));
    
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'liveSession/setNextExercise',
      payload: 'Squats'
    }));
  });

  it('should auto-advance after rest period @p0', () => {
    service.startRest(30, 'Squats');
    
    // Fast-forward time
    vi.advanceTimersByTime(30000);
    
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'liveSession/setTransitionStatus',
      payload: 'active'
    }));
  });

  it('should allow skipping rest @p1', () => {
    service.startRest(60, 'Squats');
    service.skipRest();
    
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'liveSession/setTransitionStatus',
      payload: 'active'
    }));
  });

  it('should allow extending rest @p1', () => {
    service.startRest(30, 'Squats');
    service.extendRest(30);
    
    vi.advanceTimersByTime(30000);
    
    // Should still be resting because we extended it
    const calls = (store.dispatch as any).mock.calls;
    const activeCalls = calls.filter((call: any) => call[0].payload === 'active');
    expect(activeCalls.length).toBe(0);
    
    vi.advanceTimersByTime(30000);
    expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'liveSession/setTransitionStatus',
      payload: 'active'
    }));
  });
});
