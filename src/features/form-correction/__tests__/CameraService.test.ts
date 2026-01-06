import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraService } from '../services/CameraService';

// Mock MediaStream interface
const createMockMediaStream = () => {
  const mockStop = vi.fn();
  return {
    active: true,
    id: 'test-stream',
    onaddtrack: null,
    onremovetrack: null,
    getAudioTracks: () => [],
    getVideoTracks: () => [{ stop: mockStop }],
    getTracks: () => [{ stop: mockStop }],
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    getTracksById: vi.fn(() => []),
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  } as unknown as MediaStream;
};

// Mock TensorFlow.js and Pose Detection
vi.mock('@tensorflow/tfjs', () => ({
  ready: vi.fn(() => Promise.resolve()),
  setBackend: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tensorflow-models/pose-detection', () => ({
  createDetector: vi.fn(() => Promise.resolve({
    estimatePoses: vi.fn(() => Promise.resolve([]))
  })),
  SupportedModels: {
    MoveNet: 'MoveNet'
  }
}));

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{}]
    }))
  }
});

describe('CameraService', () => {
  let cameraService: CameraService;

  beforeEach(() => {
    cameraService = new CameraService();
    vi.clearAllMocks();
  });

  describe('Device Compatibility', () => {
    it('should check if camera access is available', async () => {
      const isAvailable = await cameraService.isCameraAvailable();
      expect(isAvailable).toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ 
        video: { facingMode: 'user' } 
      });
    });

    it('should handle camera access denial gracefully', async () => {
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const isAvailable = await cameraService.isCameraAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should detect mobile device capabilities', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });

      const isMobile = cameraService.isMobileDevice();
      expect(isMobile).toBe(true);
    });

    it('should detect desktop device capabilities', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const isMobile = cameraService.isMobileDevice();
      expect(isMobile).toBe(false);
    });
  });

  describe('Stream Management', () => {
    it('should start video stream with appropriate constraints', async () => {
      const mockStream = { getTracks: () => [{}] };
      (navigator.mediaDevices.getUserMedia as any).mockResolvedValue(mockStream);

      const stream = await cameraService.startVideoStream();
      
      expect(stream).toBe(mockStream);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
    });

    it('should stop video stream properly', async () => {
      const mockStream = createMockMediaStream();
      const mockTrack = mockStream.getTracks()[0];
      
      await cameraService.stopVideoStream(mockStream);
      
      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should use optimized settings for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });

      const constraints = cameraService.getOptimalVideoConstraints();
      
      expect(constraints.video).toBeTruthy();
      if (typeof constraints.video === 'object') {
        expect(constraints.video.width).toEqual({ ideal: 480 });
        expect(constraints.video.height).toEqual({ ideal: 360 });
      }
    });

    it('should use standard settings for desktop devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const constraints = cameraService.getOptimalVideoConstraints();
      
      expect(constraints.video).toBeTruthy();
      if (typeof constraints.video === 'object') {
        expect(constraints.video.width).toEqual({ ideal: 640 });
        expect(constraints.video.height).toEqual({ ideal: 480 });
      }
    });
  });
});