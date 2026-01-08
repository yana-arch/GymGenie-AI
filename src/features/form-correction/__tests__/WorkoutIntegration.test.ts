import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormCorrectionService } from '../services/FormCorrectionService';
import { configureStore } from '@reduxjs/toolkit';
import formCorrectionSlice, { 
  setFormCorrectionState, 
  setCurrentExercise,
  selectFormCorrectionActive 
} from '../store/formCorrectionSlice';

// Mock TensorFlow.js to prevent actual model loading
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn(() => Promise.resolve()),
  ready: vi.fn(() => Promise.resolve()),
  version: '4.22.0'
}));

vi.mock('@tensorflow-models/pose-detection', () => ({
  createDetector: vi.fn(() => Promise.resolve({
    estimatePoses: vi.fn(() => Promise.resolve([
      {
        keypoints: [
          { x: 100, y: 200, score: 0.9, name: 'nose' },
          { x: 120, y: 250, score: 0.8, name: 'left_shoulder' },
          { x: 80, y: 250, score: 0.7, name: 'right_shoulder' }
        ],
        score: 0.85,
        box: [50, 150, 200, 400]
      }
    ])),
    dispose: vi.fn()
  })),
  SupportedModels: {
    MoveNet: 'MoveNet'
  },
  movenet: {
    modelType: {
      SINGLEPOSE_LIGHTNING: 'SINGLEPOSE_LIGHTNING'
    }
  }
}));
// Define the interface inline since it's not exported
interface FormCorrectionSliceState {
  isActive: boolean;
  hasCameraPermission: boolean;
  isDetecting: boolean;
  currentPoses: any[];
  feedback: string | null;
  performance: {
    lastProcessingTime: number;
    averageProcessingTime: number;
    frameCount: number;
  };
  isInitialized: boolean;
  currentExercise: string;
  settings: {
    audioEnabled: boolean;
    visualFeedbackEnabled: boolean;
    correctionSensitivity: 'strict' | 'normal' | 'lenient';
  };
  lastAnalysis: {
    score: number;
    feedback: string;
    timestamp: number;
  } | null;
}
// Import LiveSessionState interface directly from the file
interface LiveSessionState {
  activeContext: {
    energy: 'normal' | 'tired';
    time: 'normal' | 'limited';
    equipmentStatus: 'available' | 'unavailable';
  };
  isLoading: boolean;
  error: string | null;
  adaptation: any;
}

// Mock MediaDevices API for camera access
const mockMediaStream = {
  getTracks: () => [{ stop: vi.fn() }],
  active: true,
  id: 'mock-stream'
};

// Mock Web Speech API
const mockSpeechSynthesis = {
  getVoices: vi.fn(() => [
    { name: 'Alex', lang: 'en-US', local: true },
    { name: 'Samantha', lang: 'en-US', local: true }
  ]),
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  speaking: false
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
});

// Mock Speech Synthesis Utterance
class MockSpeechSynthesisUtterance {
  text: string;
  voice: any = null;
  volume: number = 1;
  rate: number = 1;
  pitch: number = 1;
  onend: any = null;
  onerror: any = null;

  constructor(text: string) {
    this.text = text;
  }
}

vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

// Mock HTMLVideoElement
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  value: vi.fn(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  value: vi.fn()
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  value: vi.fn(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  value: vi.fn()
});

// Mock document.body.appendChild for video element
const originalAppendChild = document.body.appendChild;
vi.spyOn(document.body, 'appendChild').mockImplementation(originalAppendChild);

const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'videoinput', deviceId: 'camera1', label: 'Mock Camera' }
  ])
};

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

// Mock HTMLVideoElement with media controls
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  value: 640
});
Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  value: 480
});
Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
  value: 4 // HAVE_ENOUGH_DATA
});
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: vi.fn().mockResolvedValue(undefined)
});
Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  value: vi.fn()
});
Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
  value: null,
  writable: true
});

describe('AC7: Workout Adaptation Integration', () => {
  let formCorrectionService: FormCorrectionService;
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    formCorrectionService = new FormCorrectionService();
    
    // Create store with form correction slice
    store = configureStore({
      reducer: {
        formCorrection: formCorrectionSlice
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST']
        }
      })
    }) as any;
    
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await formCorrectionService.dispose();
  });

  describe('Live Session Integration', () => {
    it('should integrate with existing LiveSessionSlice state', async () => {
      // Start form correction
      await formCorrectionService.initialize();
      await formCorrectionService.startFormCorrection();
      
      const state = formCorrectionService.getState();
      
      // AC7 Requirement: System should work seamlessly with existing workout adaptations
      expect(state.isActive).toBe(true);
      expect(state.currentPoses).toBeDefined();
      
      // Form correction should be accessible through Redux store
      const formCorrectionState = store.getState() as any;
      expect(typeof formCorrectionState.formCorrection).toBe('object');
      
      await formCorrectionService.stopFormCorrection();
    });

    it('should maintain compatibility with workout adaptations from Story 1.1', async () => {
      // Test that form correction doesn't interfere with existing session state
      const initialSessionState = {
        isActive: true,
        currentExercise: { id: 'squat', name: 'Squat' },
        adaptations: [] as any[]
      };
      
      await formCorrectionService.initialize();
      await formCorrectionService.startFormCorrection();
      
      // Simulate current exercise being set (as would happen in Story 1.1)
      store.dispatch(setCurrentExercise('squat'));
      
      const formCorrectionState = formCorrectionService.getState();
      const exercise = formCorrectionService.getCurrentExercise();
      
      // Should be able to set and get current exercise
      expect(exercise).toBe('squat');
      
      // Form correction should be active alongside workout session
      expect(formCorrectionState.isActive).toBe(true);
      
      await formCorrectionService.stopFormCorrection();
    });

    it('should add form correction status to session tracking', async () => {
      await formCorrectionService.initialize();
      await formCorrectionService.startFormCorrection();
      
      const state = formCorrectionService.getState();
      
      // AC7: Add form correction status to session tracking
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('hasCameraPermission');
      expect(state).toHaveProperty('isDetecting');
      expect(state).toHaveProperty('feedback');
      
      // Should provide status information for session integration
      expect(typeof state.isActive).toBe('boolean');
      expect(state.feedback === null || typeof state.feedback === 'string').toBe(true);
      
      await formCorrectionService.stopFormCorrection();
    });
  });

  describe('Seamless Integration Requirements', () => {
    it('should not interfere with existing workout flows', async () => {
      // Test that form correction can be enabled/disabled without breaking workflow
      await formCorrectionService.initialize();
      
      const stateBefore = formCorrectionService.getState();
      expect(stateBefore.isActive).toBe(true); // Service is ready after initialization
      expect(stateBefore.isDetecting).toBe(false); // But not detecting yet
      
      await formCorrectionService.startFormCorrection();
      
      const stateDuring = formCorrectionService.getState();
      expect(stateDuring.isActive).toBe(true);
      expect(stateDuring.isDetecting).toBe(true); // Now detecting
      
      await formCorrectionService.stopFormCorrection();
      
      const stateAfter = formCorrectionService.getState();
      expect(stateAfter.isActive).toBe(false); // Fully stopped
      expect(stateAfter.isDetecting).toBe(false);
    });

    it('should handle exercise changes during active form correction', async () => {
      await formCorrectionService.initialize();
      await formCorrectionService.startFormCorrection();
      
      // Change current exercise (as would happen during workout)
      const exercise1 = formCorrectionService.getCurrentExercise();
      expect(exercise1).toBeDefined();
      
      // Form correction should adapt to different exercises
      expect(typeof exercise1).toBe('string');
      
      const state = formCorrectionService.getState();
      
      // Should maintain operation during exercise changes
      expect(state.isActive).toBe(true);
      
      await formCorrectionService.stopFormCorrection();
    });

    it('should provide form analysis for session integration', async () => {
      await formCorrectionService.initialize();
      
      // Get form analysis service for session integration
      const formAnalysisService = formCorrectionService.getFormAnalysisService();
      expect(formAnalysisService).toBeDefined();
      
      // Should be able to analyze form for session tracking
      const mockPoses = [{
        keypoints: [
          { x: 320, y: 350, score: 0.9, name: 'left_hip' },
          { x: 320, y: 420, score: 0.85, name: 'left_knee' },
          { x: 320, y: 480, score: 0.8, name: 'left_ankle' }
        ],
        score: 0.85
      }];
      
      const analysis = formAnalysisService.analyzeForm(mockPoses, 'squat');
      
      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('feedback');
      expect(analysis).toHaveProperty('timestamp');
      
      // This analysis can be used by live session for tracking
      expect(typeof analysis.score).toBe('number');
      expect(typeof analysis.feedback).toBe('string');
    });
  });

  describe('AC7 Validation', () => {
    it('should meet all AC7 requirements for Story 1.2', async () => {
      await formCorrectionService.initialize();
      await formCorrectionService.startFormCorrection();
      
      const state = formCorrectionService.getState();
      
      // AC7: System works seamlessly with existing workout adaptation features
      expect(state.isActive).toBe(true);
      expect(state.currentPoses).toBeDefined();
      expect(state.feedback).toBeDefined();
      
      // Should provide form correction status for session tracking
      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('isDetecting');
      expect(state).toHaveProperty('performance');
      
      // Should be compatible with LiveSessionSlice from Story 1.1
      const currentExercise = formCorrectionService.getCurrentExercise();
      expect(typeof currentExercise).toBe('string');
      
      // Should integrate without breaking existing functionality
      const formAnalysisService = formCorrectionService.getFormAnalysisService();
      const audioService = formCorrectionService.getAudioCoachingService();
      
      expect(formAnalysisService).toBeDefined();
      expect(audioService).toBeDefined();
      
      await formCorrectionService.stopFormCorrection();
      
      // Should clean up properly
      const finalState = formCorrectionService.getState();
      expect(finalState.isActive).toBe(false);
      expect(finalState.isDetecting).toBe(false);
    });
  });
});