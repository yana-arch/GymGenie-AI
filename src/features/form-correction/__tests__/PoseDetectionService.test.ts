import { FormCorrectionService } from "../services/FormCorrectionService";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoseDetectionService } from '../services/PoseDetectionService';

// Mock TensorFlow.js
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn(() => Promise.resolve()),
  setBackend: vi.fn(() => Promise.resolve()),
  env: vi.fn(() => ({
    get: vi.fn(() => 'webgl') // Mock WebGL backend
  }))
}));

// Mock Pose Detection
vi.mock('@tensorflow-models/pose-detection', () => ({
  createDetector: vi.fn(() => Promise.resolve({
    estimatePoses: vi.fn(() => Promise.resolve([
      {
        keypoints: [
          { x: 100, y: 200, score: 0.9, name: 'nose' },
          { x: 150, y: 250, score: 0.8, name: 'left_eye' },
          { x: 120, y: 300, score: 0.7, name: 'left_shoulder' },
          { x: 80, y: 300, score: 0.6, name: 'right_shoulder' }
        ],
        box: [50, 150, 200, 400] as [number, number, number, number],
        score: 0.85
      }
    ]))
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

// Mock HTMLVideoElement
global.HTMLVideoElement = class MockVideoElement {
  readyState = 4;
  videoWidth = 640;
  videoHeight = 480;
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  play = vi.fn();
  pause = vi.fn();
} as any;

describe('PoseDetectionService', () => {
  let poseDetectionService: PoseDetectionService;
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    FormCorrectionService.resetInstance();
    poseDetectionService = new PoseDetectionService();
    mockVideoElement = new HTMLVideoElement() as HTMLVideoElement;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize TensorFlow.js with WebGL backend', async () => {
      await poseDetectionService.initialize();
      
      const { setBackend, ready } = await import('@tensorflow/tfjs');
      expect(setBackend).toHaveBeenCalledWith('webgl');
      expect(ready).toHaveBeenCalled();
    });

    it('should create MoveNet detector for real-time pose detection', async () => {
      await poseDetectionService.initialize();
      
      const { createDetector, SupportedModels } = await import('@tensorflow-models/pose-detection');
      expect(createDetector).toHaveBeenCalledWith(SupportedModels.MoveNet, {
        modelType: 'SINGLEPOSE_LIGHTNING',
        enableSmoothing: true,
        minPoseScore: 0.25
      });
    });

    it('should handle initialization errors gracefully', async () => {
      const { setBackend } = await import('@tensorflow/tfjs');
      (setBackend as any).mockRejectedValueOnce(new Error('Backend not available'));

      await expect(poseDetectionService.initialize()).rejects.toThrow('Backend not available');
    });
  });

  describe('Pose Estimation', () => {
    beforeEach(async () => {
      await poseDetectionService.initialize();
    });

    it('should detect poses from video feed', async () => {
      const poses = await poseDetectionService.detectPoses(mockVideoElement);
      
      expect(poses).toHaveLength(1);
      expect(poses[0]).toHaveProperty('keypoints');
      expect(poses[0]).toHaveProperty('score');
      expect(poses[0].keypoints).toHaveLength(4);
      expect(poses[0].keypoints[0]).toMatchObject({
        x: 100,
        y: 200,
        score: 0.9,
        name: 'nose'
      });
    });

    it('should return empty array when no poses detected', async () => {
      const { createDetector } = await import('@tensorflow-models/pose-detection');
      const mockDetector = {
        estimatePoses: vi.fn(() => Promise.resolve([]))
      };
      (createDetector as any).mockResolvedValue(mockDetector);
      
      // Re-initialize to use the mock detector
      await poseDetectionService.initialize();
      
      const poses = await poseDetectionService.detectPoses(mockVideoElement);
      
      expect(poses).toEqual([]);
    });

    it('should handle video element errors gracefully', async () => {
      const invalidVideo = null as any;
      
      const poses = await poseDetectionService.detectPoses(invalidVideo);
      
      expect(poses).toEqual([]);
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await poseDetectionService.initialize();
    });

    it('should track processing time for performance monitoring', async () => {
      const startTime = Date.now();
      
      await poseDetectionService.detectPoses(mockVideoElement);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should validate video element before processing', async () => {
      const invalidVideo = { 
        readyState: 0,
        videoWidth: 0,
        videoHeight: 0
      } as HTMLVideoElement;
      
      const poses = await poseDetectionService.detectPoses(invalidVideo);
      
      expect(poses).toEqual([]);
    });
  });

  describe('Mobile Optimization', () => {
    it('should use mobile-optimized configuration for mobile devices', () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });

      const mobileService = new PoseDetectionService();
      const config = mobileService['getMobileOptimizedConfig']();
      
      expect(config.enableSmoothing).toBe(true);
    });

    it('should use standard configuration for desktop devices', () => {
      // Mock desktop device
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const desktopService = new PoseDetectionService();
      const config = desktopService['getStandardConfig']();
      
      expect(config.enableSmoothing).toBe(true);
    });
  });
});