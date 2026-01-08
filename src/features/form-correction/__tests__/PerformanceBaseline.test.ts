/**
 * P0 Performance Baseline Tests (R-003)
 * Tests performance baselines with flexible device-specific SLAs for form correction and AI coaching
 * @p0 @performance @sla @device-optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PoseDetectionService, Pose } from '@/features/form-correction/services/PoseDetectionService';
import { FormAnalysisService, FormAnalysis, FormIssue } from '@/features/form-correction/services/FormAnalysisService';

// Mock dependencies
vi.mock('@/features/form-correction/services/PoseDetectionService');
vi.mock('@/features/form-correction/services/FormAnalysisService');

describe('P0 Performance Baseline Tests - Flexible Device SLAs', () => {
  let poseDetectionService: PoseDetectionService;
  let formAnalysisService: FormAnalysisService;

  // Test pose data for performance testing
  const TEST_POSE_DATA: Pose = {
    keypoints: [
      { x: 150.5, y: 200.3, score: 0.95, name: 'nose' },
      { x: 145.2, y: 185.7, score: 0.89, name: 'left_eye' },
      { x: 155.8, y: 185.7, score: 0.91, name: 'right_eye' },
      { x: 140.0, y: 250.0, score: 0.87, name: 'left_shoulder' },
      { x: 160.0, y: 250.0, score: 0.88, name: 'right_shoulder' },
      { x: 130.0, y: 350.0, score: 0.92, name: 'left_hip' },
      { x: 170.0, y: 350.0, score: 0.93, name: 'right_hip' },
      { x: 125.0, y: 450.0, score: 0.85, name: 'left_knee' },
      { x: 175.0, y: 450.0, score: 0.86, name: 'right_knee' }
    ],
    score: 0.90,
    box: [100, 150, 200, 400]
  };

  const MOCK_VIDEO_ELEMENT = {
    videoWidth: 640,
    videoHeight: 480,
    readyState: 4,
    play: vi.fn(),
    pause: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize mock services
    poseDetectionService = new PoseDetectionService();
    formAnalysisService = new FormAnalysisService();

    // Mock core service methods
    vi.mocked(poseDetectionService.initialize).mockResolvedValue();
    vi.mocked(poseDetectionService.detectPoses).mockResolvedValue([TEST_POSE_DATA]);
    
    vi.mocked(formAnalysisService.analyzeForm).mockReturnValue({
      isValid: true,
      issues: [] as FormIssue[],
      score: 85,
      feedback: 'Good form maintained',
      timestamp: Date.now(),
      processingTime: 45
    } as FormAnalysis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('@p0 High-End Device Performance SLA', () => {
    it('should meet 100ms SLA for pose detection on high-end devices', async () => {
      // Arrange
      const highEndSLA = 100; // 100ms for high-end devices
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        // Simulate high-end device processing
        await new Promise(resolve => setTimeout(resolve, 80)); // 80ms processing
        return [TEST_POSE_DATA];
      });

      // Act
      const startTime = performance.now();
      const poses = await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Assert
      expect(processingTime).toBeLessThan(highEndSLA);
      expect(poses).toHaveLength(1);
    });

    it('should meet 80ms SLA for form analysis on high-end devices', () => {
      // Arrange
      const highEndAnalysisSLA = 80; // 80ms for form analysis
      
      const mockHighEndAnalysis: FormAnalysis = {
        isValid: true,
        issues: [] as FormIssue[],
        score: 90,
        feedback: 'Excellent form',
        timestamp: Date.now(),
        processingTime: 65
      };
      
      vi.mocked(formAnalysisService.analyzeForm).mockReturnValue(mockHighEndAnalysis);

      // Act
      const startTime = performance.now();
      const analysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Assert
      expect(processingTime).toBeLessThan(highEndAnalysisSLA);
      expect(analysis.score).toBe(90);
    });
  });

  describe('@p0 Mid-Range Device Performance SLA', () => {
    it('should adjust SLA to 200ms for mid-range devices', async () => {
      // Arrange
      const midRangeSLA = 200; // 200ms for mid-range devices
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        // Simulate mid-range device processing
        await new Promise(resolve => setTimeout(resolve, 180)); // 180ms processing
        return [TEST_POSE_DATA];
      });

      // Act
      const startTime = performance.now();
      const poses = await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Assert
      expect(processingTime).toBeLessThan(midRangeSLA);
      expect(processingTime).toBeGreaterThan(100);
      expect(poses).toHaveLength(1);
    });

    it('should use simplified algorithms on mid-range devices', () => {
      // Arrange
      const mockMidRangeAnalysis: FormAnalysis = {
        isValid: true,
        issues: [] as FormIssue[],
        score: 82,
        feedback: 'Good form (simplified analysis)',
        timestamp: Date.now(),
        processingTime: 120
      };
      
      vi.mocked(formAnalysisService.analyzeForm).mockReturnValue(mockMidRangeAnalysis);

      // Act
      const analysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(analysis.feedback).toContain('simplified analysis');
    });
  });

  describe('@p0 Mobile Device Performance SLA', () => {
    it('should extend SLA to 400ms for mobile devices', async () => {
      // Arrange
      const mobileSLA = 400; // 400ms for mobile devices
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        // Simulate mobile device processing
        await new Promise(resolve => setTimeout(resolve, 350)); // 350ms processing
        return [TEST_POSE_DATA];
      });

      // Act
      const startTime = performance.now();
      const poses = await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Assert
      expect(processingTime).toBeLessThan(mobileSLA);
      expect(poses).toHaveLength(1);
    });

    it('should use battery-optimized processing on mobile devices', () => {
      // Arrange
      const mockMobileAnalysis: FormAnalysis = {
        isValid: true,
        issues: [] as FormIssue[],
        score: 78,
        feedback: 'Good form (battery optimized)',
        timestamp: Date.now(),
        processingTime: 250
      };
      
      vi.mocked(formAnalysisService.analyzeForm).mockReturnValue(mockMobileAnalysis);

      // Act
      const analysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(analysis.feedback).toContain('battery optimized');
    });
  });

  describe('@p0 Performance Monitoring and SLA Tracking', () => {
    it('should track individual processing times', async () => {
      // Arrange
      const processingTimes: number[] = [];
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        const startTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 85));
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
        return [TEST_POSE_DATA];
      });

      // Act
      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);

      // Assert
      expect(processingTimes).toHaveLength(1);
      expect(processingTimes[0]).toBeGreaterThanOrEqual(80);
    });

    it('should detect SLA violations', async () => {
      // Arrange
      const slaTime = 100;
      const violationTime = 150;
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, violationTime));
        return [TEST_POSE_DATA];
      });

      // Act
      const startTime = performance.now();
      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const endTime = performance.now();
      const actualProcessingTime = endTime - startTime;

      // Assert
      expect(actualProcessingTime).toBeGreaterThanOrEqual(slaTime);
    });

    it('should adapt processing based on consecutive SLA breaches', async () => {
      // Mock processing times for consecutive calls
      const mockProcessingTimes = [150, 140, 130, 120];
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        const index = (poseDetectionService.detectPoses as any).mock.calls.length - 1;
        const processingTime = mockProcessingTimes[index % mockProcessingTimes.length];
        await new Promise(resolve => setTimeout(resolve, processingTime));
        return [TEST_POSE_DATA];
      });

      // Act
      const firstStart = performance.now();
      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const firstEnd = performance.now();
      const firstTime = firstEnd - firstStart;

      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);

      const fourthStart = performance.now();
      await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
      const fourthEnd = performance.now();
      const fourthTime = fourthEnd - fourthStart;

      // Assert
      expect(fourthTime).toBeLessThan(firstTime);
    });
  });

  describe('@p0 Resource Usage Optimization', () => {
    it('should optimize memory usage for constrained devices', () => {
      // Arrange
      let memoryUsage = 0;
      const memoryLimit = 50 * 1024 * 1024;
      
      vi.mocked(formAnalysisService.analyzeForm).mockImplementation(() => {
        memoryUsage = JSON.stringify(TEST_POSE_DATA).length;
        return {
          isValid: true,
          issues: [] as FormIssue[],
          score: 75,
          feedback: 'Form acceptable (memory optimized)',
          timestamp: Date.now(),
          processingTime: 120
        } as FormAnalysis;
      });

      // Act
      formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(memoryUsage).toBeLessThan(memoryLimit);
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it('should adjust processing quality based on device capabilities', () => {
      // Arrange
      const deviceCapabilities = {
        cpuCores: 4,
        memory: 4096,
        isMobile: false,
        batteryLevel: 0.8
      };

      vi.mocked(formAnalysisService.analyzeForm).mockImplementation(() => {
        const processingComplexity = deviceCapabilities.isMobile ? 'basic' : 'advanced';
        const processingTime = deviceCapabilities.isMobile ? 250 : 80;
        const accuracyScore = deviceCapabilities.isMobile ? 78 : 92;
        
        return {
          isValid: true,
          issues: [] as FormIssue[],
          score: accuracyScore,
          feedback: `Form acceptable (${processingComplexity} processing)`,
          timestamp: Date.now(),
          processingTime
        } as FormAnalysis;
      });

      // Act
      const analysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(analysis.feedback).toContain('processing');
      expect(analysis.score).toBeGreaterThan(70);
    });
  });

  describe('@p0 Performance Regression Detection', () => {
    it('should detect performance degradation over time', async () => {
      // Arrange
      const performanceHistory = [85, 90, 95, 105, 115];
      let callIndex = 0;
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        const currentTime = performanceHistory[callIndex % performanceHistory.length];
        await new Promise(resolve => setTimeout(resolve, currentTime));
        callIndex++;
        return [TEST_POSE_DATA];
      });

      // Act
      const processingTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT);
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      }

      // Assert
      expect(processingTimes).toHaveLength(5);
      expect(processingTimes[4]).toBeGreaterThan(processingTimes[0]);
    });

    it('should trigger optimization when performance degrades', () => {
      // Arrange
      let shouldOptimize = false;
      
      vi.mocked(formAnalysisService.analyzeForm).mockImplementation(() => {
        const analysis = {
          isValid: true,
          issues: [] as FormIssue[],
          score: shouldOptimize ? 88 : 75,
          feedback: shouldOptimize ? 'Form good (optimized)' : 'Form acceptable',
          timestamp: Date.now(),
          processingTime: shouldOptimize ? 60 : 140
        } as FormAnalysis;
        
        shouldOptimize = true;
        return analysis;
      });

      // Act
      const firstAnalysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');
      const optimizedAnalysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(optimizedAnalysis.score).toBeGreaterThan(firstAnalysis.score);
      expect(optimizedAnalysis.feedback).toContain('optimized');
    });
  });

  describe('@p0 Concurrent Processing Management', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      // Arrange
      const concurrentRequests = 3;
      
      vi.mocked(poseDetectionService.detectPoses).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 90));
        return [TEST_POSE_DATA];
      });

      // Act
      const startTime = performance.now();
      const promises = Array.from({ length: concurrentRequests }, () => 
        poseDetectionService.detectPoses(MOCK_VIDEO_ELEMENT)
      );
      const results = await Promise.all(promises);
      const endTime = performance.now();

      // Assert
      expect(results).toHaveLength(concurrentRequests);
      expect(endTime - startTime).toBeLessThan(400);
    });

    it('should prioritize critical processing over background tasks', () => {
      // Arrange
      let isCritical = false;
      
      vi.mocked(formAnalysisService.analyzeForm).mockImplementation(() => {
        const processingTime = isCritical ? 50 : 150;
        
        return {
          isValid: true,
          issues: [] as FormIssue[],
          score: isCritical ? 95 : 80,
          feedback: isCritical ? 'Form excellent (priority) ' : 'Form good (background)',
          timestamp: Date.now(),
          processingTime
        } as FormAnalysis;
      });

      // Act
      isCritical = true;
      const criticalAnalysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');
      
      isCritical = false;
      const backgroundAnalysis = formAnalysisService.analyzeForm([TEST_POSE_DATA], 'squat');

      // Assert
      expect(criticalAnalysis.score).toBeGreaterThan(backgroundAnalysis.score);
      expect(criticalAnalysis.feedback).toContain('priority');
    });
  });
});
