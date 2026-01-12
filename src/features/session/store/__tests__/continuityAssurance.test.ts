import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import liveSessionSlice, { 
  addSuggestion, 
  dismissSuggestion,
  clearSuggestions,
  Suggestion
} from '../liveSessionSlice';

// Mock the logSuggestionFeedback thunk
vi.mock('../../../preference-learning/store/preferenceLearningSlice', () => ({
  logSuggestionFeedback: vi.fn((payload) => ({ type: 'mock/logFeedback', payload }))
}));

describe('Workflow Continuity Assurance (Suggestions)', () => {
  it('should handle adding a suggestion @smoke', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    const suggestion: Suggestion = {
      id: '1',
      type: 'safety',
      message: 'Watch your form on that last rep',
      timestamp: Date.now()
    };

    store.dispatch(addSuggestion(suggestion));

    const state = store.getState().liveSession;
    expect(state.suggestions).toHaveLength(1);
    expect(state.suggestions[0]).toEqual(suggestion);
  });

  it('should handle dismissing a suggestion @p0', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    const suggestion: Suggestion = {
      id: '1',
      type: 'safety',
      message: 'Watch your form on that last rep',
      timestamp: Date.now()
    };

    store.dispatch(addSuggestion(suggestion));
    expect(store.getState().liveSession.suggestions).toHaveLength(1);

    store.dispatch(dismissSuggestion('1'));
    expect(store.getState().liveSession.suggestions).toHaveLength(0);
  });

  it('should prioritize suggestions: safety > performance > motivation @p1', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    const suggestions: Suggestion[] = [
      { id: '1', type: 'motivation', message: 'Keep going!', timestamp: Date.now() },
      { id: '2', type: 'safety', message: 'Back straight!', timestamp: Date.now() + 1 },
      { id: '3', type: 'performance', message: 'Go deeper!', timestamp: Date.now() + 2 }
    ];

    suggestions.forEach(s => store.dispatch(addSuggestion(s)));

    const state = store.getState().liveSession;
    
    expect(state.suggestions[0].type).toBe('safety');
    expect(state.suggestions[1].type).toBe('performance');
    expect(state.suggestions[2].type).toBe('motivation');
  });

  it('should limit suggestions to 3 items @p1', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    for (let i = 0; i < 5; i++) {
      store.dispatch(addSuggestion({ 
        id: `${i}`, 
        type: 'safety', 
        message: 'test', 
        timestamp: Date.now() 
      }));
    }

    const state = store.getState().liveSession;
    expect(state.suggestions).toHaveLength(3);
  });

  it('should clear all suggestions @p2', () => {
    const store = configureStore({
      reducer: {
        liveSession: liveSessionSlice
      }
    });

    store.dispatch(addSuggestion({ id: '1', type: 'safety', message: 'test', timestamp: Date.now() }));
    expect(store.getState().liveSession.suggestions).toHaveLength(1);

    store.dispatch(clearSuggestions());
    expect(store.getState().liveSession.suggestions).toHaveLength(0);
  });
});

