import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import liveSessionSlice, { updateEnergyContext, updateTimeContext } from '../liveSessionSlice';

// Simple test to verify Redux actions work
describe('LiveSessionSlice', () => {
  it('should update energy context', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    // Initial state should have normal energy
    expect(store.getState().liveSession.activeContext.energy).toBe('normal');

    // Dispatch energy update
    store.dispatch(updateEnergyContext('tired'));

    // State should be updated
    expect(store.getState().liveSession.activeContext.energy).toBe('tired');
  });

  it('should update time context', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    // Initial state should have normal time
    expect(store.getState().liveSession.activeContext.time).toBe('normal');

    // Dispatch time update
    store.dispatch(updateTimeContext('limited'));

    // State should be updated
    expect(store.getState().liveSession.activeContext.time).toBe('limited');
  });
});