import { describe, it, expect } from 'vitest';
import reducer, { toggleFeature, setFeature, resetFlags } from './featureFlagSlice';

describe('featureFlagSlice', () => {
  const initialState = {
    enableAI: false,
    enableCoaching: false,
    enablePersonalization: false,
    enableAnalytics: false,
    enableFormCorrection: false,
    enableInjuryAwareness: false,
    enableUnifiedCoaching: false,
    debugMode: true, // Assuming development environment for tests
  };

  it('should return the initial state @p1', () => {
    // @ts-ignore
    expect(reducer(undefined, { type: 'unknown' }).enableCoaching).toBe(false);
  });

  it('should handle toggleFeature @p0', () => {
    const state = reducer(initialState, toggleFeature('enableCoaching'));
    expect(state.enableCoaching).toBe(true);
    
    const state2 = reducer(state, toggleFeature('enableCoaching'));
    expect(state2.enableCoaching).toBe(false);
  });

  it('should handle setFeature @p0', () => {
    const state = reducer(initialState, setFeature({ feature: 'enableAnalytics', enabled: true }));
    expect(state.enableAnalytics).toBe(true);
  });

  it('should handle resetFlags @p2', () => {
    const state = reducer({ ...initialState, enableAI: true }, resetFlags());
    // Note: debugMode might differ based on process.env, so we check specific flags
    expect(state.enableAI).toBe(false);
  });
});
