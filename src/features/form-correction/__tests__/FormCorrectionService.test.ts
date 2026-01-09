import { FormCorrectionService } from "../services/FormCorrectionService";
import { describe, expect, vi, beforeEach, afterEach, it } from 'vitest';

// Mock HTMLVideoElement methods to prevent "Not implemented" warnings
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: vi.fn().mockResolvedValue(undefined)
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  value: vi.fn()
});

Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
  writable: true
});

// Mock document.body methods with proper parent-child relationship
let mockVideoElement: HTMLElement | null = null;

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn((element) => {
    mockVideoElement = element;
    // Mock parent relationship
    Object.defineProperty(element, 'parentNode', {
      value: document.body,
      writable: true
    });
    return element;
  })
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn((element) => {
    if (element === mockVideoElement) {
      mockVideoElement = null;
    }
  })
});

// Mock requestAnimationFrame for test control
vi.stubGlobal('requestAnimationFrame', vi.fn());
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock CameraService
vi.mock('../services/CameraService', () => ({
  CameraService: class {
    isCameraAvailable = vi.fn(() => Promise.resolve(true));
    startVideoStream = vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    }));
    stopVideoStream = vi.fn(() => Promise.resolve());
  }
}));

// Mock PoseDetectionService
vi.mock('../services/PoseDetectionService', () => ({
  PoseDetectionService: class {
    initialize = vi.fn(() => Promise.resolve());
    detectPoses = vi.fn(() => Promise.resolve([
      {
        keypoints: [
          { x: 100, y: 200, score: 0.9, name: 'nose' },
          { x: 120, y: 300, score: 0.8, name: 'left_shoulder' },
          { x: 80, y: 300, score: 0.85, name: 'right_shoulder' }
        ],
        score: 0.85
      }
    ]));
    isReady = vi.fn(() => true);
    dispose = vi.fn();
  }
}));

// Mock FormAnalysisService
vi.mock('../services/FormAnalysisService', () => ({
  FormAnalysisService: {
    getInstance: vi.fn(() => ({
      analyzeForm: vi.fn(() => ({
        isValid: true,
        issues: [],
        score: 85,
        feedback: 'Good form!',
        timestamp: Date.now()
      })),
      getFormTrends: vi.fn(() => ({ averageScore: 85, issueFrequency: {} })),
      clearHistory: vi.fn(),
      getRepCount: vi.fn(() => 0)
    }))
  }
}));

// Mock AudioCoachingService
vi.mock('../services/AudioCoachingService', () => ({
  AudioCoachingService: {
    getInstance: vi.fn(() => ({
      provideFeedback: vi.fn(),
      getConfig: vi.fn(() => ({ enabled: true, volume: 0.8, speechRate: 1.2 })),
      updateConfig: vi.fn(),
      getAvailableVoices: vi.fn(() => []),
      testVoice: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn()
    }))
  }
}));

describe('FormCorrectionService', () => {
  let formCorrectionService: FormCorrectionService;

  beforeEach(() => {
    FormCorrectionService.resetInstance();
    formCorrectionService = FormCorrectionService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await formCorrectionService.dispose();
  });

  it('should initialize successfully with camera and pose detection', async () => {
    await formCorrectionService.initialize();
    
    const state = formCorrectionService.getState();
    expect(state.isActive).toBe(true);
    expect(state.hasCameraPermission).toBe(true);
    expect(state.isDetecting).toBe(false);
  });

  it('should start form correction successfully', async () => {
    await formCorrectionService.initialize();
    await formCorrectionService.startFormCorrection();
    
    const state = formCorrectionService.getState();
    expect(state.isActive).toBe(true);
    expect(state.isDetecting).toBe(true);
  });

  it('should stop form correction and cleanup', async () => {
    await formCorrectionService.initialize();
    await formCorrectionService.startFormCorrection();
    
    await formCorrectionService.stopFormCorrection();
    
    const state = formCorrectionService.getState();
    expect(state.isDetecting).toBe(false);
    expect(state.feedback).toBeNull();
  });

  it('should get current poses', async () => {
    await formCorrectionService.initialize();
    await formCorrectionService.startFormCorrection();
    
    const poses = formCorrectionService.getCurrentPoses();
    expect(Array.isArray(poses)).toBe(true);
  });

  it('should track performance metrics', async () => {
    await formCorrectionService.initialize();
    await formCorrectionService.startFormCorrection();
    
    const metrics = formCorrectionService.getPerformanceMetrics();
    expect(metrics).toHaveProperty('lastProcessingTime');
    expect(metrics).toHaveProperty('averageProcessingTime');
    expect(metrics).toHaveProperty('frameCount');
  });

  it('should cleanup resources on dispose', async () => {
    await formCorrectionService.initialize();
    await formCorrectionService.startFormCorrection();
    
    await formCorrectionService.dispose();
    
    const state = formCorrectionService.getState();
    expect(state.isActive).toBe(false);
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});
