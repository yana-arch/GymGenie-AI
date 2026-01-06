/**
 * Shared test utilities for form-correction feature tests
 * Centralizes common mocking patterns to reduce duplication
 */

// Mock pose data used across multiple tests
export const mockPose = {
  keypoints: [
    { x: 100, y: 200, score: 0.9, name: 'nose' },
    { x: 150, y: 250, score: 0.8, name: 'left_eye' },
    { x: 120, y: 300, score: 0.7, name: 'left_shoulder' },
    { x: 80, y: 300, score: 0.85, name: 'right_shoulder' },
    { x: 110, y: 350, score: 0.8, name: 'left_hip' },
    { x: 90, y: 350, score: 0.7, name: 'right_hip' },
    { x: 115, y: 450, score: 0.6, name: 'left_knee' },
    { x: 85, y: 450, score: 0.5, name: 'right_knee' }
  ],
  score: 0.85
} as const;

// Mock form analysis data
export const goodFormAnalysis = {
  isValid: true,
  issues: [],
  score: 95,
  feedback: 'Great form! Keep it up!',
  timestamp: Date.now()
} as const;

export const badFormAnalysis = {
  isValid: false,
  issues: [
    {
      type: 'range_of_motion' as const,
      severity: 'high' as const,
      bodyPart: 'Knee',
      description: 'Hip-knee angle is incorrect',
      recommendation: 'Go deeper in your squat'
    }
  ],
  score: 60,
  feedback: 'High priority: Go deeper in your squat',
  timestamp: Date.now()
} as const;

// Mock speech synthesis setup
export let mockSpeechSynthesis = {
  getVoices: vi.fn(() => [
    { name: 'Alex', lang: 'en-US', local: true },
    { name: 'Samantha', lang: 'en-US', local: true },
    { name: 'Google US English', lang: 'en-US', local: false }
  ]),
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  speaking: false,
  _onvoiceschangedHandler: null,
  set onvoiceschanged(handler: any) {
    this._onvoiceschangedHandler = handler;
  },
  get onvoiceschanged() {
    return this._onvoiceschangedHandler;
  }
} as any;

// Mock canvas context with proper tracking
export const createMockCanvasContext = () => {
  const context = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    ellipse: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0
  } as any;

  // Track color assignments for testing
  context.strokeStyle = '';
  context.fillStyle = '';
  
  return context;
};

// Mock media devices setup
export const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
    active: true,
    id: 'mock-stream'
  }),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'videoinput', deviceId: 'camera1', label: 'Mock Camera' }
  ])
};

// Mock video element setup
export const setupMockVideoElement = () => {
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
};

// Mock TensorFlow.js setup
export const mockTensorFlow = () => {
  vi.mock('@tensorflow/tfjs', () => ({
    ready: vi.fn(() => Promise.resolve()),
    setBackend: vi.fn(() => Promise.resolve()),
    env: vi.fn(() => ({
      get: vi.fn(() => 'webgl')
    }))
  }));
};

// Mock pose detection setup
export const mockPoseDetection = () => {
  vi.mock('@tensorflow-models/pose-detection', () => ({
    createDetector: vi.fn(() => Promise.resolve({
      estimatePoses: vi.fn(() => Promise.resolve([mockPose]))
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
};

// Utility function to setup common test environment
export const setupTestEnvironment = () => {
  mockTensorFlow();
  mockPoseDetection();
  setupMockVideoElement();
  
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: mockSpeechSynthesis
  });
  
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true
  });
};