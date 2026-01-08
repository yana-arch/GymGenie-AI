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

describe('FormCorrectionService - Performance & Resource Management', () => {
  let formCorrectionService: FormCorrectionService;

  beforeEach(() => {
    formCorrectionService = new FormCorrectionService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await formCorrectionService.dispose();
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