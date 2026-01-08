import { describe, it, expect } from 'vitest';
import reducer, { 
  setTransitionStatus, 
  setNextExercise, 
  updateRestRemaining 
} from '../liveSessionSlice';

describe('liveSessionSlice transition reducers', () => {
  it('should handle setTransitionStatus @p0', () => {
    const state = reducer(undefined, setTransitionStatus('resting'));
    expect(state.transitionStatus).toBe('resting');
  });

  it('should handle setNextExercise @p0', () => {
    const state = reducer(undefined, setNextExercise('Bench Press'));
    expect(state.nextExercise).toBe('Bench Press');
  });

  it('should handle updateRestRemaining @p0', () => {
    const state = reducer(undefined, updateRestRemaining(45));
    expect(state.restRemaining).toBe(45);
  });
});
