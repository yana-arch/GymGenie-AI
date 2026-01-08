import { describe, it, expect, beforeEach } from 'vitest';
import formCorrectionReducer, {
  setFormCorrectionState,
  updateCurrentPoses,
  updateFeedback,
  setInitialized,
  setCurrentExercise,
  updateSettings,
  setLastAnalysis,
  resetFormCorrection,
  updatePerformanceMetrics,
  setDetecting,
} from '../store/formCorrectionSlice';

describe('FormCorrectionSlice', () => {
  let initialState: any;

  beforeEach(() => {
    initialState = {
      isActive: false,
      hasCameraPermission: false,
      isDetecting: false,
      currentPoses: [],
      feedback: null,
      performance: {
        lastProcessingTime: 0,
        averageProcessingTime: 0,
        frameCount: 0
      },
      isInitialized: false,
      currentExercise: '',
      settings: {
        audioEnabled: true,
        visualFeedbackEnabled: true,
        correctionSensitivity: 'normal'
      },
      lastAnalysis: null
    };
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const state = formCorrectionReducer(undefined, { type: 'any' });
      
      expect(state.isActive).toBe(false);
      expect(state.hasCameraPermission).toBe(false);
      expect(state.isDetecting).toBe(false);
      expect(state.currentPoses).toEqual([]);
      expect(state.feedback).toBe(null);
    });

    it('should have correct settings defaults', () => {
      const state = formCorrectionReducer(undefined, { type: 'any' });
      
      expect(state.settings.audioEnabled).toBe(true);
      expect(state.settings.visualFeedbackEnabled).toBe(true);
      expect(state.settings.correctionSensitivity).toBe('normal');
    });
  });

  describe('State Updates', () => {
    it('should update form correction state', () => {
      const newState = formCorrectionReducer(initialState, setFormCorrectionState({
        isActive: true,
        feedback: 'Test feedback'
      }));

      expect(newState.isActive).toBe(true);
      expect(newState.feedback).toBe('Test feedback');
    });

    it('should update current poses', () => {
      const mockPoses = [
        { keypoints: [] as any[], score: 0.8 },
        { keypoints: [] as any[], score: 0.7 }
      ];

      const newState = formCorrectionReducer(initialState, updateCurrentPoses(mockPoses));

      expect(newState.currentPoses).toEqual(mockPoses);
    });

    it('should update feedback', () => {
      const feedback = 'Form analysis complete';
      const newState = formCorrectionReducer(initialState, updateFeedback(feedback));

      expect(newState.feedback).toBe(feedback);
    });

    it('should update initialization state', () => {
      const newState = formCorrectionReducer(initialState, setInitialized(true));

      expect(newState.isInitialized).toBe(true);
    });

    it('should set current exercise', () => {
      const exercise = 'squat';
      const newState = formCorrectionReducer(initialState, setCurrentExercise(exercise));

      expect(newState.currentExercise).toBe(exercise);
    });

    it('should update settings', () => {
      const newSettings = {
        audioEnabled: false,
        correctionSensitivity: 'strict' as const
      };

      const newState = formCorrectionReducer(initialState, updateSettings(newSettings));

      expect(newState.settings.audioEnabled).toBe(false);
      expect(newState.settings.correctionSensitivity).toBe('strict');
      // Should preserve other settings
      expect(newState.settings.visualFeedbackEnabled).toBe(true);
    });

    it('should set last analysis', () => {
      const analysis = {
        score: 85,
        feedback: 'Good form',
        timestamp: Date.now()
      };

      const newState = formCorrectionReducer(initialState, setLastAnalysis(analysis));

      expect(newState.lastAnalysis).toEqual(analysis);
    });

    it('should reset form correction state', () => {
      // First modify some state
      const modifiedState = formCorrectionReducer(initialState, updateSettings({ audioEnabled: false }));
      
      // Reset while preserving settings
      const resetState = formCorrectionReducer(modifiedState, resetFormCorrection());

      expect(resetState.isActive).toBe(false);
      expect(resetState.isDetecting).toBe(false);
      expect(resetState.currentPoses).toEqual([]);
      // Settings should be preserved from the modified state
      expect(resetState.settings.audioEnabled).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should update performance metrics', () => {
      const performance = {
        lastProcessingTime: 150,
        averageProcessingTime: 120,
        frameCount: 30
      };

      const newState = formCorrectionReducer(initialState, updatePerformanceMetrics(performance));

      expect(newState.performance).toEqual(performance);
    });

    it('should track frame count correctly', () => {
      const newState = formCorrectionReducer(initialState, setDetecting(true));

      expect(newState.isDetecting).toBe(true);
    });

    it('should update multiple detection states', () => {
      let state = formCorrectionReducer(initialState, setDetecting(true));

      state = formCorrectionReducer(state, setDetecting(false));

      expect(state.isDetecting).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple state updates in sequence', () => {
      let state = formCorrectionReducer(initialState, setInitialized(true));
      state = formCorrectionReducer(state, setCurrentExercise('squat'));
      state = formCorrectionReducer(state, updateCurrentPoses([{ keypoints: [] as any[], score: 0.9 }]));
      state = formCorrectionReducer(state, updateFeedback('Good form detected'));

      expect(state.isInitialized).toBe(true);
      expect(state.currentExercise).toBe('squat');
      expect(state.currentPoses).toHaveLength(1);
      expect(state.feedback).toBe('Good form detected');
    });

    it('should handle settings update with partial data', () => {
      const state = formCorrectionReducer(initialState, updateSettings({
        audioEnabled: false,
        correctionSensitivity: 'strict'
      }));

      expect(state.settings.audioEnabled).toBe(false);
      expect(state.settings.correctionSensitivity).toBe('strict');
      expect(state.settings.visualFeedbackEnabled).toBe(true); // Should preserve unchanged
    });
  });

  describe('Async Action Handling', () => {
    it('should handle startFormCorrection pending state', () => {
      const state = formCorrectionReducer(initialState, {
        type: 'formCorrection/startFormCorrection/pending'
      });

      expect(state.isActive).toBe(false);
      expect(state.isDetecting).toBe(false);
      expect(state.feedback).toBe('Initializing form correction...');
    });

    it('should handle startFormCorrection fulfilled state', () => {
      const payload = {
        isActive: true,
        hasCameraPermission: true,
        currentPoses: [{ keypoints: [] as any[], score: 0.8 }],
        feedback: 'Tracking pose...',
        performance: { lastProcessingTime: 100, averageProcessingTime: 95, frameCount: 10 }
      };

      const state = formCorrectionReducer(initialState, {
        type: 'formCorrection/startFormCorrection/fulfilled',
        payload
      });

      expect(state.isActive).toBe(true);
      expect(state.isDetecting).toBe(true);
      expect(state.hasCameraPermission).toBe(true);
      expect(state.currentPoses).toEqual(payload.currentPoses);
      expect(state.feedback).toBe('Form correction active');
    });

    it('should handle stopFormCorrection fulfilled state', () => {
      const state = formCorrectionReducer(initialState, {
        type: 'formCorrection/stopFormCorrection/fulfilled',
        payload: { stopped: true }
      });

      expect(state.isActive).toBe(false);
      expect(state.isDetecting).toBe(false);
      expect(state.currentPoses).toEqual([]);
      expect(state.feedback).toBe(null);
    });
  });
});
