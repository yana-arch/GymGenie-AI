import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import liveSessionSlice, { addMilestone } from '../liveSessionSlice';
import { Milestone } from '../../services/MilestoneService';

describe('LiveSessionSlice Milestone Integration', () => {
  it('should store multi-type milestones @p1', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    const milestone: Milestone = {
      type: 'PROGRESS',
      value: 50,
      label: '50% Complete',
      timestamp: Date.now(),
      id: 'test-id',
      priority: 'low'
    };

    // Dispatch milestone
    store.dispatch(addMilestone(milestone));

    const state = store.getState().liveSession;
    expect(state.milestoneHistory).toContainEqual(milestone);
  });
});
