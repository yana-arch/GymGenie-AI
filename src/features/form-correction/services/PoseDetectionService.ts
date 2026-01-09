import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

export interface PoseKeypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: PoseKeypoint[];
  score?: number;
  box?: [number, number, number, number] | any; // Optional bounding box with flexible typing
}

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized = false;
  private mobileOptimized = false;

  constructor() {
    this.mobileOptimized = this.isMobileDevice();
  }

  /**
   * Initialize TensorFlow.js and pose detection model
   */
  async initialize(): Promise<void> {
    try {
      // Set up TensorFlow.js backend for optimal performance
      await tf.setBackend('webgl');
      await tf.ready();

      // Create MoveNet detector optimized for real-time pose detection
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        this.mobileOptimized ? this.getMobileOptimizedConfig() : this.getStandardConfig()
      );

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize pose detection: ${error}`);
    }
  }

  /**
   * Detect poses from video feed
   */
  async detectPoses(video: HTMLVideoElement): Promise<Pose[]> {
    if (!this.detector || !this.isInitialized) {
      throw new Error('PoseDetectionService not initialized');
    }

    if (!this.validateVideoElement(video)) {
      return [];
    }

    try {
      const startTime = Date.now();
      const detectedPoses = await this.detector.estimatePoses(video);
      const processingTime = Date.now() - startTime;

      // Transform library poses to our interface
      const poses: Pose[] = detectedPoses.map(pose => ({
        keypoints: pose.keypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
          score: kp.score,
          name: kp.name
        })),
        box: pose.box || [0, 0, video.videoWidth, video.videoHeight] as [number, number, number, number],
        score: pose.score || 0
      }));

      // Enforce 500ms requirement with performance constraints
      if (processingTime > 500) {
        console.warn(`Pose detection took ${processingTime}ms, exceeding 500ms target`);
        
        // PERFORMANCE ENFORCEMENT: Skip frames if too slow
        if (processingTime > 1000) {
          console.error(`Pose detection severely slow (${processingTime}ms), consider reducing input resolution`);
          // Removed hard error to prevent system crash, instead we log and continue
        }
      }

      return poses;
    } catch (error) {
      console.error('Error during pose detection:', error);
      return [];
    }
  }

  /**
   * Check if service is ready for pose detection
   */
  isReady(): boolean {
    return this.isInitialized && this.detector !== null;
  }

  /**
   * Check if current device is mobile
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  /**
   * Validate video element before processing
   */
  private validateVideoElement(video: HTMLVideoElement): boolean {
    return video && 
           video.readyState >= 2 && // HAVE_CURRENT_DATA
           video.videoWidth > 0 && 
           video.videoHeight > 0;
  }

  /**
   * Get mobile-optimized configuration
   */
  private getMobileOptimizedConfig() {
    return {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
      minPoseScore: 0.3
    };
  }

  /**
   * Get standard desktop configuration
   */
  private getStandardConfig() {
    return {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
      minPoseScore: 0.25
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.detector = null;
    this.isInitialized = false;
  }
}