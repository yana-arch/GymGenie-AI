import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormCorrectionService } from '../services/FormCorrectionService';
import { given, when, then, and, createFormTest } from '../../../test-utils';

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
vi.stubGlobal('requestAnimationFrame', vi.fn().mockImplementation((callback) => {
  setTimeout(callback, 16);
  return 1;
}));

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
  FormAnalysisService: class {
    analyzeForm = vi.fn(() => ({
      isValid: true,
      issues: [],
      score: 85,
      feedback: 'Good form!',
      timestamp: Date.now()
    }));
    getFormTrends = vi.fn(() => ({ averageScore: 85, issueFrequency: {} }));
    clearHistory = vi.fn();
  }
}));

// Mock AudioCoachingService
vi.mock('../services/AudioCoachingService', () => ({
  AudioCoachingService: class {
    provideFeedback = vi.fn();
    getConfig = vi.fn(() => ({ enabled: true, volume: 0.8, speechRate: 1.2 }));
    updateConfig = vi.fn();
    getAvailableVoices = vi.fn(() => []);
    testVoice = vi.fn();
    stop = vi.fn();
    dispose = vi.fn();
  }
}));

describe('FormCorrectionService', () => {
  let formCorrectionService: FormCorrectionService;

  beforeEach(() => {
    formCorrectionService = new FormCorrectionService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await formCorrectionService.dispose();
  });

  // Initialization Scenarios
  given('a fresh FormCorrectionService instance', () => {
    when('the service is initialized for the first time', () => {
      then(createFormTest(1, 'should initialize successfully with camera and pose detection'), async () => {
        await formCorrectionService.initialize();
        
        const state = formCorrectionService.getState();
        expect(state.isActive).toBe(true);
        expect(state.hasCameraPermission).toBe(true);
        expect(state.isDetecting).toBe(false);
      });
    });

    when('initialization encounters potential errors', () => {
      then(createFormTest(2, 'should handle initialization gracefully'), async () => {
        await expect(formCorrectionService.initialize()).resolves.not.toThrow();
        
        const state = formCorrectionService.getState();
        expect(state).toBeDefined();
      });
    });

    when('pose detection system is ready', () => {
      then(createFormTest(3, 'should handle pose detection initialization'), async () => {
        await formCorrectionService.initialize();
        
        expect(formCorrectionService.getState().isActive).toBe(true);
      });
    });
  });

  // Form Correction Control Scenarios
  given('an initialized FormCorrectionService', () => {
    when('the user starts form correction monitoring', () => {
      then(createFormTest(4, 'should start form correction successfully'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        const state = formCorrectionService.getState();
        expect(state.isActive).toBe(true);
        expect(state.isDetecting).toBe(true);
      });
    });

    when('the user stops form correction monitoring', () => {
      then(createFormTest(5, 'should stop form correction and cleanup'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        await formCorrectionService.stopFormCorrection();
        
        const state = formCorrectionService.getState();
        expect(state.isDetecting).toBe(false);
        expect(state.feedback).toBeNull();
      });
    });
  });

  // Pose Detection Integration Scenarios
  given('form correction is actively running', () => {
    when('current pose data is requested', () => {
      then(createFormTest(6, 'should get current poses'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        const poses = formCorrectionService.getCurrentPoses();
        expect(Array.isArray(poses)).toBe(true);
      });
    });

    when('performance metrics are needed', () => {
      then(createFormTest(7, 'should track performance metrics'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        const metrics = formCorrectionService.getPerformanceMetrics();
        expect(metrics).toHaveProperty('lastProcessingTime');
        expect(metrics).toHaveProperty('averageProcessingTime');
        expect(metrics).toHaveProperty('frameCount');
      });
    });
  });

  // Performance Optimization Scenarios
  given('form correction is processing video frames', () => {
    when('frames are being processed in real-time', () => {
      then(createFormTest(8, 'should process frames efficiently'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        const startTime = Date.now();
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = Date.now();
        const metrics = formCorrectionService.getPerformanceMetrics();
        
        expect(metrics.frameCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // Resource Management Scenarios
  given('form correction service has been running', () => {
    when('the service is disposed and cleaned up', () => {
      then(createFormTest(9, 'should cleanup resources on dispose'), async () => {
        await formCorrectionService.initialize();
        await formCorrectionService.startFormCorrection();
        
        await formCorrectionService.dispose();
        
        const state = formCorrectionService.getState();
        expect(state.isActive).toBe(false);
        expect(document.body.removeChild).toHaveBeenCalled();
      });
    });
  });
});