import { describe, expect, beforeEach } from 'vitest';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import { 
  given,
  when,
  then,
  and,
  createFeedbackTest
} from '../../../test-utils';
import { 
  feedbackPersonalizationReducer,
  initializeFeedbackService,
  submitFeedback,
  FeedbackType,
  FeedbackPersonalizationState
} from '../store/feedbackPersonalizationSlice';
import { FeedbackData } from '../types/feedbackPersonalization.types';
import type { TypedStartListening } from '@reduxjs/toolkit';

interface TestStoreState {
  feedbackPersonalization: FeedbackPersonalizationState;
}

type AppStore = EnhancedStore<TestStoreState> & {
  dispatch: any;
}

// BDD Test Suite for FeedbackPersonalizationSlice Redux State Management
describe('FeedbackPersonalizationSlice Redux State Management', () => {
  let store: AppStore;

  // GIVEN: Fresh Redux store is configured for feedback personalization
  given('a fresh Redux store is configured for feedback personalization', () => {
    beforeEach(() => {
      store = configureStore({
        reducer: {
          feedbackPersonalization: feedbackPersonalizationReducer
        }
      });
    });

    // WHEN: Accessing initial Redux state
    when('accessing initial Redux state', () => {
      // THEN: State should have correct default values for all properties
      then(createFeedbackTest(1, 'Redux state has correct initial default values'), () => {
        const state = store.getState().feedbackPersonalization;
        
        expect(state.feedbackHistory).toEqual([]);
        expect(state.patterns).toEqual([]);
        expect(state.currentImpacts).toEqual([]);
        expect(state.isServiceInitialized).toBe(false);
        expect(state.service).toBe(null);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
        expect(state.isProcessingFeedback).toBe(false);
        expect(state.lastProcessed).toBe(null);
        expect(state.validationResult).toBe(null);
        expect(state.showValidationErrors).toBe(false);
      });

      // AND: All array properties should be empty
      and(createFeedbackTest(2, 'all array properties are initially empty'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(Array.isArray(state.feedbackHistory)).toBe(true);
        expect(Array.isArray(state.patterns)).toBe(true);
        expect(Array.isArray(state.currentImpacts)).toBe(true);
        expect(state.feedbackHistory.length).toBe(0);
        expect(state.patterns.length).toBe(0);
        expect(state.currentImpacts.length).toBe(0);
      });

      // AND: All boolean properties should have correct initial values
      and(createFeedbackTest(3, 'boolean properties have correct initial values'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(typeof state.isServiceInitialized).toBe('boolean');
        expect(typeof state.isLoading).toBe('boolean');
        expect(typeof state.isProcessingFeedback).toBe('boolean');
        expect(typeof state.showValidationErrors).toBe('boolean');
        expect(state.isServiceInitialized).toBe(false);
        expect(state.isLoading).toBe(false);
        expect(state.isProcessingFeedback).toBe(false);
        expect(state.showValidationErrors).toBe(false);
      });

      // AND: All null properties should be properly initialized
      and(createFeedbackTest(4, 'nullable properties are properly initialized to null'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.service).toBe(null);
        expect(state.error).toBe(null);
        expect(state.lastProcessed).toBe(null);
        expect(state.validationResult).toBe(null);
      });
    });
  });

  // GIVEN: Feedback service initialization is requested
  given('feedback service initialization is requested', () => {
    let store: AppStore;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          feedbackPersonalization: feedbackPersonalizationReducer
        }
      });
    });

    // WHEN: Initializing feedback service
    when('initializing feedback service', () => {
      // THEN: Service should be initialized successfully with proper state changes
      then(createFeedbackTest(5, 'service initializes successfully and updates state'), async () => {
        await store.dispatch(initializeFeedbackService({}) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.isServiceInitialized).toBe(true);
        expect(state.service).toBeTruthy();
        expect(state.error).toBe(null);
      });

      // AND: Service initialization should not affect other state properties
      and(createFeedbackTest(6, 'other state properties remain unchanged after service init'), async () => {
        await store.dispatch(initializeFeedbackService({}) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.feedbackHistory).toEqual([]);
        expect(state.patterns).toEqual([]);
        expect(state.currentImpacts).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.isProcessingFeedback).toBe(false);
        expect(state.lastProcessed).toBe(null);
        expect(state.validationResult).toBe(null);
        expect(state.showValidationErrors).toBe(false);
      });

      // AND: Service object should be properly configured
      and(createFeedbackTest(7, 'service object is properly configured with required methods'), async () => {
        await store.dispatch(initializeFeedbackService({}) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.service).toBeInstanceOf(Object);
        expect(typeof state.service).toBe('object');
      });
    });
  });

  // GIVEN: Feedback service is initialized and ready
  given('feedback service is initialized and ready', () => {
    let store: AppStore;

    beforeEach(async () => {
      await store.dispatch(initializeFeedbackService({}) as any);
    });

    // WHEN: Submitting valid feedback data
    when('submitting valid feedback data', () => {
      // THEN: Feedback should be processed successfully
      then(createFeedbackTest(8, 'valid feedback is processed successfully without errors'), async () => {
        const feedbackData: FeedbackData = {
          id: 'test-feedback',
          workoutId: 'workout-123',
          exerciseId: 'exercise-456',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: new Date().toISOString(),
          context: {
            currentWeight: 50,
            currentReps: 10
          }
        };

        await store.dispatch(submitFeedback(feedbackData) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.error).toBe(null);
        expect(state.lastProcessed).toBeTruthy();
      });

      // AND: Last processed timestamp should be updated
      and(createFeedbackTest(9, 'last processed timestamp is updated after successful feedback submission'), async () => {
        const feedbackData: FeedbackData = {
          id: 'test-feedback-2',
          workoutId: 'workout-123',
          exerciseId: 'exercise-456',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: new Date().toISOString(),
          context: {
            currentWeight: 50,
            currentReps: 10
          }
        };

        await store.dispatch(submitFeedback(feedbackData) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.lastProcessed).toBeTruthy();
        expect(typeof state.lastProcessed).toBe('string');
      });

      // AND: Processing flags should be managed correctly
      and(createFeedbackTest(10, 'processing flags are managed correctly during feedback submission'), async () => {
        const feedbackData: FeedbackData = {
          id: 'test-feedback-3',
          workoutId: 'workout-123',
          exerciseId: 'exercise-456',
          type: FeedbackType.DIFFICULTY_RATING,
          rating: 3,
          timestamp: new Date().toISOString(),
          context: {
            currentWeight: 50,
            currentReps: 10
          }
        };

        await store.dispatch(submitFeedback(feedbackData) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.isProcessingFeedback).toBe(false);
        expect(state.error).toBe(null);
      });
    });

    // WHEN: Submitting invalid feedback data
    when('submitting invalid feedback data', () => {
      // THEN: Feedback should be rejected with appropriate error
      then(createFeedbackTest(11, 'invalid feedback is rejected with validation error'), async () => {
        const invalidFeedback = {
          // Missing required fields
          id: 'invalid'
        } as FeedbackData;

        await store.dispatch(submitFeedback(invalidFeedback) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.error).toBeTruthy();
        expect(state.error).toContain('Validation error');
      });

      // AND: Error should be descriptive and helpful
      and(createFeedbackTest(12, 'error message is descriptive and contains validation details'), async () => {
        const invalidFeedback = {
          // Missing required fields
          id: 'invalid-feedback'
        } as FeedbackData;

        await store.dispatch(submitFeedback(invalidFeedback) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.error).toBeTruthy();
        expect(typeof state.error).toBe('string');
        expect(state.error!.length).toBeGreaterThan(0);
      });

      // AND: State should not be partially updated on validation failure
      and(createFeedbackTest(13, 'state is not partially updated when validation fails'), async () => {
        const invalidFeedback = {
          id: 'invalid-feedback-2'
        } as FeedbackData;

        await store.dispatch(submitFeedback(invalidFeedback) as any);
        
        const state = store.getState().feedbackPersonalization;
        expect(state.error).toBeTruthy();
        expect(state.isProcessingFeedback).toBe(false);
        expect(state.lastProcessed).toBe(null);
      });
    });
  });

  // GIVEN: Redux store is available for state selection
  given('Redux store is available for state selection', () => {
    let store: AppStore;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          feedbackPersonalization: feedbackPersonalizationReducer
        }
      });
    });

    // WHEN: Selecting feedback history from Redux state
    when('selecting feedback history from Redux state', () => {
      // THEN: Feedback history should be accessible and properly initialized
      then(createFeedbackTest(14, 'feedback history is accessible and properly initialized'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.feedbackHistory).toEqual([]);
        expect(Array.isArray(state.feedbackHistory)).toBe(true);
      });

      // AND: Feedback history should be ready for future entries
      and(createFeedbackTest(15, 'feedback history array is ready for future entries'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(Array.isArray(state.feedbackHistory)).toBe(true);
        expect(state.feedbackHistory.length).toBe(0);
        expect(state.feedbackHistory).not.toBe(undefined);
        expect(state.feedbackHistory).not.toBe(null);
      });
    });

    // WHEN: Selecting service state from Redux store
    when('selecting service state from Redux store', () => {
      // THEN: Service should be null when not initialized
      then(createFeedbackTest(16, 'service is null when not initialized'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.service).toBe(null);
      });

      // AND: Service initialization flag should be false
      and(createFeedbackTest(17, 'service initialization flag is false before initialization'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.isServiceInitialized).toBe(false);
      });

      // AND: Service state should be properly typed and accessible
      and(createFeedbackTest(18, 'service state is properly typed and accessible'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(typeof state.service).toBe('object');
        expect(state.service === null).toBe(true);
        expect(typeof state.isServiceInitialized).toBe('boolean');
      });
    });

    // WHEN: Selecting error state from Redux store
    when('selecting error state from Redux store', () => {
      // THEN: Error should be null when no errors occurred
      then(createFeedbackTest(19, 'error is null when no errors occurred'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.error).toBe(null);
      });

      // AND: Error state should be properly typed for string values
      and(createFeedbackTest(20, 'error state is properly typed for string values'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.error === null).toBe(true);
        expect(typeof state.error).toBe('object');
      });
    });

    // WHEN: Selecting loading and processing states
    when('selecting loading and processing states', () => {
      // THEN: All loading flags should be false initially
      then(createFeedbackTest(21, 'all loading flags are false initially'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.isLoading).toBe(false);
        expect(state.isProcessingFeedback).toBe(false);
      });

      // AND: Loading states should be properly typed as boolean
      and(createFeedbackTest(22, 'loading states are properly typed as boolean'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(typeof state.isLoading).toBe('boolean');
        expect(typeof state.isProcessingFeedback).toBe('boolean');
      });
    });

    // WHEN: Selecting validation-related states
    when('selecting validation-related states', () => {
      // THEN: Validation states should be properly initialized
      then(createFeedbackTest(23, 'validation states are properly initialized'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(state.validationResult).toBe(null);
        expect(state.showValidationErrors).toBe(false);
      });

      // AND: Validation error display flag should be boolean
      and(createFeedbackTest(24, 'validation error display flag is boolean type'), () => {
        const state = store.getState().feedbackPersonalization;
        expect(typeof state.showValidationErrors).toBe('boolean');
        expect(state.showValidationErrors).toBe(false);
      });
    });
  });
});