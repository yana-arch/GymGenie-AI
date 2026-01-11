import { Middleware } from '@reduxjs/toolkit';
import { setIsActive } from '@/features/session/store/liveSessionSlice';
import { PreferenceLearningIntegrationService } from '@/features/preference-learning/services/PreferenceLearningIntegrationService';

/**
 * Middleware to automatically trigger preference learning when a workout session ends.
 */
export const preferenceLearningMiddleware: Middleware = (store) => (next) => async (action) => {
  const result = next(action);

  if (setIsActive.match(action) && action.payload === false) {
    // Session just ended
    const state = store.getState() as any;
    
    // Check if AI features are enabled
    if (state.featureFlags && !state.featureFlags.enableAI) {
      console.log('ℹ️ AI features disabled, skipping preference learning');
      return result;
    }

    const liveSession = state.liveSession;
    const formCorrection = state.formCorrection;
    const safetyOverride = state.safetyOverride;
    const injuryAware = state.injuryAware;

    try {
      const integrationService = PreferenceLearningIntegrationService.getInstance();
      
      // Gather session data for learning
      await integrationService.updatePreferencesFromSession({
        liveSession,
        formCorrection,
        safetyOverride,
        injuryAware
      });
      
      console.log('✅ Automatic preference learning triggered successfully');
    } catch (error) {
      console.error('❌ Failed to trigger automatic preference learning:', error);
    }
  }

  return result;
};
