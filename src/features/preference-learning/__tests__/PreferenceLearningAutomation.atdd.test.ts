import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import liveSessionReducer, { setIsActive } from '../../session/store/liveSessionSlice';
import preferenceLearningReducer from '../../../store/preferenceLearningSlice';
import { preferenceLearningMiddleware } from '../../../store/middleware/preferenceLearningMiddleware';

const mockUpdatePreferences = vi.fn().mockResolvedValue(undefined);

// Mock the module
vi.mock('../services/PreferenceLearningIntegrationService', () => {
  return {
    PreferenceLearningIntegrationService: {
      getInstance: vi.fn().mockImplementation(() => {
        return {
          updatePreferencesFromSession: mockUpdatePreferences
        };
      })
    }
  };
});

describe('Preference Learning Automation - ATDD failing tests @atdd', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        liveSession: liveSessionReducer,
        preferenceLearning: preferenceLearningReducer,
        formCorrection: (state = {}) => state,
        safetyOverride: (state = {}) => state,
        injuryAware: (state = {}) => state,
      },
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware().concat(preferenceLearningMiddleware)
    });
  });

  /**
   * Story 2.1: AI Preference Learning Foundation
   * Requirement: preference learning happens automatically without explicit user input
   */
  it('should automatically trigger preference learning when a session is deactivated @p0', async () => {
    // GIVEN: A session is active
    store.dispatch(setIsActive(true));
    expect(store.getState().liveSession.isActive).toBe(true);

    // WHEN: The session is deactivated (e.g. user leaves the workout screen)
    store.dispatch(setIsActive(false));

    // THEN: Preference learning is triggered automatically
    // This is expected to FAIL because there is currently no logic 
    // linking setIsActive(false) to preference learning automation.
    
    // Note: In a real implementation, this would likely be handled by a middleware 
    // or by converting setIsActive to an async thunk that calls the service.
    expect(mockUpdatePreferences).toHaveBeenCalled();
  });
});
