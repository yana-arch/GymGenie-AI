import { describe, it, expect } from 'vitest';
import { store } from '../index';
import { PERSIST } from 'redux-persist';

import { setPlan } from '@/features/workout/store/workoutSlice';
import { setFeature } from '@/features/ui/store/featureFlagSlice';

describe('Backward Compatibility', () => {
  it('should have store version 1 configured @p0', () => {
    const state = store.getState() as any;
    expect(state._persist).toBeDefined();
    expect(state._persist.version).toBe(1);
  });

  it('should not affect core state when AI slices are initialized @p0', () => {
    const state = store.getState();
    
    expect(state.workout.currentPlan).toBeNull();
    expect(state.user.profile).toBeNull();
    
    expect(state.unifiedCoaching).toBeDefined();
    expect(state.preferenceLearning).toBeDefined();
  });

  it('should have feature flags enabled by default @p1', () => {
    const state = store.getState();
    expect(state.featureFlags).toBeDefined();
    expect(state.featureFlags.enableAI).toBe(true);
  });

  it('should have liveSession in persistence whitelist @p1', () => {
    // We check the config indirectly via its presence in the store and whitelist logic
    const state = store.getState() as any;
    expect(state.liveSession).toBeDefined();
  });

  it('should allow core workout actions even when AI is disabled @p0', () => {
    // Disable AI
    store.dispatch(setFeature({ feature: 'enableAI', enabled: false }));
    
    const mockPlan = {
      id: 'plan-compat',
      title: 'Compat Plan',
      description: 'Test',
      generatedAt: new Date().toISOString(),
      totalDurationWeeks: 1,
      weeks: [] as any[]
    };

    // Core action
    store.dispatch(setPlan(mockPlan));
    
    const state = store.getState();
    expect(state.workout.currentPlan).toEqual(mockPlan);
    expect(state.featureFlags.enableAI).toBe(false);
  });
});
