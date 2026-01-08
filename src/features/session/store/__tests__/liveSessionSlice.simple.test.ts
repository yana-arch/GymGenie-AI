import { describe, it, expect } from 'vitest';
import liveSessionSlice, { updateEnergyContext, updateTimeContext } from '../liveSessionSlice';

describe('LiveSessionSlice', () => {
  it('should return the initial state', () => {
    const result = liveSessionSlice(undefined, { type: 'unknown' });
    expect(result.activeContext.energy).toBe('normal');
    expect(result.activeContext.time).toBe('normal');
    expect(result.activeContext.equipmentStatus).toBe('available');
  });

  it('should update energy context', () => {
    const initialState = {
      activeContext: {
        energy: 'normal' as const,
        time: 'normal' as const,
        equipmentStatus: 'available' as const,
      },
      isLoading: false,
      error: null as string | null,
      adaptation: null as any,
    };

    const result = liveSessionSlice(initialState as any, updateEnergyContext('tired'));
    expect(result.activeContext.energy).toBe('tired');
  });

  it('should update time context', () => {
    const initialState = {
      activeContext: {
        energy: 'normal' as const,
        time: 'normal' as const,
        equipmentStatus: 'available' as const,
      },
      isLoading: false,
      error: null as string | null,
      adaptation: null as any,
    };

    const result = liveSessionSlice(initialState as any, updateTimeContext('limited'));
    expect(result.activeContext.time).toBe('limited');
  });
});
