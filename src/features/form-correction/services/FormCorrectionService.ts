import { CameraService } from './CameraService';
import { PoseDetectionService, Pose, PoseKeypoint } from './PoseDetectionService';
import { FormAnalysisService, FormAnalysis } from './FormAnalysisService';
import { AudioCoachingService } from './AudioCoachingService';
import { sessionGuidanceService } from '@/features/session/services/SessionGuidanceService';

// Import for AC7 integration with Story 1.1
declare global {
  interface Window {
    __REDUX_STORE__: any;
  }
}

export interface FormCorrectionState {
  isActive: boolean;
  hasCameraPermission: boolean;
  isDetecting: boolean;
  currentPoses: Pose[];
  feedback: string | null;
  performance: {
    lastProcessingTime: number;
    averageProcessingTime: number;
    frameCount: number;
  };
}

export class FormCorrectionService {
  private cameraService: CameraService;
  private poseDetectionService: PoseDetectionService;
  private formAnalysisService: FormAnalysisService;
  private audioCoachingService: AudioCoachingService;
  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private processingFrame = false;
  private state: FormCorrectionState;
  private currentExercise: string = 'squat';
  private onMilestoneReached?: (milestone: any) => void;
  private onStatusUpdate?: (status: any) => void;
  private onAdaptationRequired?: (params: any) => void;

  constructor() {
    this.cameraService = new CameraService();
    this.poseDetectionService = new PoseDetectionService();
    this.formAnalysisService = FormAnalysisService.getInstance();
    this.audioCoachingService = AudioCoachingService.getInstance();
    
    this.state = {
      isActive: false,
      hasCameraPermission: false,
      isDetecting: false,
      currentPoses: [],
      feedback: null,
      performance: {
        lastProcessingTime: 0,
        averageProcessingTime: 0,
        frameCount: 0
      }
    };
  }

  /**
   * Register listeners to avoid direct Redux store access
   */
  registerListeners(callbacks: {
    onMilestone?: (milestone: any) => void;
    onStatusUpdate?: (status: any) => void;
    onAdaptationRequired?: (params: any) => void;
  }) {
    this.onMilestoneReached = callbacks.onMilestone;
    this.onStatusUpdate = callbacks.onStatusUpdate;
    this.onAdaptationRequired = callbacks.onAdaptationRequired;
  }

  /**
   * Analyze form locally (no network transmission)
   */
  async analyzeFormLocal(videoStream: MediaStream): Promise<any> {
    try {
      // Simulate local processing
      const poses = await this.poseDetectionService.detectPoses(videoStream as any);
      const analysis = await this.formAnalysisService.analyzeForm(poses, this.currentExercise);
      
      return {
        poses,
        analysis,
        processedLocally: true,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Local form analysis failed: ${error}`);
    }
  }

  /**
   * Analyze form with privacy protection
   */
  async analyzeForm(request: any): Promise<any> {
    try {
      // Process form without network calls
      const result = await this.analyzeFormLocal(request.videoStream);
      
      // Ensure no data is transmitted
      return result;
    } catch (error) {
      throw new Error(`Form analysis failed: ${error}`);
    }
  }

  /**
   * Initialize the form correction system
   */
  async initialize(): Promise<void> {
    try {
      // Check camera availability first
      const hasCamera = await this.cameraService.isCameraAvailable();
      this.state.hasCameraPermission = hasCamera;

      if (!hasCamera) {
        throw new Error('Camera access not available');
      }

      // Initialize pose detection
      await this.poseDetectionService.initialize();

      // Create video element for processing
      await this.createVideoElement();

      this.state.isActive = true;
    } catch (error) {
      this.state.isActive = false;
      throw error;
    }
  }

  /**
   * Start real-time form correction
   */
  async startFormCorrection(): Promise<void> {
    if (!this.state.isActive) {
      throw new Error('Form correction not initialized');
    }

    if (!this.videoElement) {
      throw new Error('Video element not created');
    }

    try {
      // Start camera stream
      this.videoStream = await this.cameraService.startVideoStream();
      
      // Attach stream to video element
      this.videoElement.srcObject = this.videoStream;
      
      // Wait for video to be ready
      await this.videoElement.play();
      
      this.state.isDetecting = true;
      this.startPoseDetectionLoop();
    } catch (error) {
      this.state.isDetecting = false;
      throw error;
    }
  }

  /**
   * Stop form correction and cleanup resources
   */
  async stopFormCorrection(): Promise<void> {
    this.state.isDetecting = false;

    if (this.videoStream) {
      await this.cameraService.stopVideoStream(this.videoStream);
      this.videoStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.pause();
    }

    this.state.currentPoses = [];
    this.state.feedback = null;
    this.state.isActive = false; // Fixed: Ensure service is properly deactivated
  }

  /**
   * Get current form correction state
   */
  getState(): FormCorrectionState {
    return { ...this.state };
  }

  /**
   * Get current poses for visual feedback
   */
  getCurrentPoses(): Pose[] {
    return this.state.currentPoses;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.state.performance };
  }

  /**
   * Create hidden video element for processing
   */
  private async createVideoElement(): Promise<void> {
    const video = document.createElement('video');
    video.width = 640;
    video.height = 480;
    video.style.display = 'none'; // Hidden video element
    
    // Add to DOM for proper processing
    document.body.appendChild(video);
    
    this.videoElement = video;
  }

  /**
   * Main pose detection loop with performance optimization
   */
  private async startPoseDetectionLoop(): Promise<void> {
    if (!this.state.isDetecting || !this.videoElement) {
      return;
    }

    // Skip frame if already processing to maintain performance
    if (this.processingFrame) {
      requestAnimationFrame(() => this.startPoseDetectionLoop());
      return;
    }

    this.processingFrame = true;
    const startTime = Date.now();

    try {
      // Detect poses
      const poses = await this.poseDetectionService.detectPoses(this.videoElement);
      this.state.currentPoses = poses;

      // Analyze form if poses detected
      if (poses.length > 0) {
        const formAnalysis = this.formAnalysisService.analyzeForm(poses, this.currentExercise);
        this.state.feedback = formAnalysis.feedback;
        
        // Provide audio feedback for form issues
        this.audioCoachingService.provideFeedback(formAnalysis);
        
        // AC7 Integration: Sync with LiveSessionSlice for workout adaptations
        this.syncWithLiveSession(formAnalysis);
      } else {
        this.state.feedback = 'No pose detected';
      }

      // Update performance metrics and enforce 500ms requirement
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      // Warn if exceeding 500ms requirement
      if (processingTime > 500) {
        console.warn(`Processing time ${processingTime}ms exceeds 500ms requirement`);
        this.state.feedback = `Performance warning: ${processingTime}ms processing time`;
      }

    } catch (error) {
      console.error('Error in pose detection loop:', error);
      this.state.feedback = 'Error analyzing form';
    } finally {
      this.processingFrame = false;
    }

    // Continue loop if still detecting
    if (this.state.isDetecting) {
      requestAnimationFrame(() => this.startPoseDetectionLoop());
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.state.performance.lastProcessingTime = processingTime;
    this.state.performance.frameCount++;

    // Calculate rolling average (last 100 frames)
    const frameWindow = 100;
    const weight = 1 / frameWindow;
    this.state.performance.averageProcessingTime = 
      this.state.performance.averageProcessingTime * (1 - weight) + 
      processingTime * weight;

    // Log performance warnings
    if (processingTime > 500) {
      console.warn(`Frame processing exceeded 500ms: ${processingTime}ms`);
    }
  }

  /**
   * Set current exercise type
   */
  setExercise(exercise: string): void {
    this.currentExercise = exercise;
  }

  /**
   * Get current exercise type
   */
  getCurrentExercise(): string {
    return this.currentExercise;
  }

  /**
   * Get form analysis service for detailed insights
   */
  getFormAnalysisService(): FormAnalysisService {
    return this.formAnalysisService;
  }

  /**
   * Get audio coaching service
   */
  getAudioCoachingService(): AudioCoachingService {
    return this.audioCoachingService;
  }

  /**
   * AC7 Integration: Sync form analysis with LiveSessionSlice for workout adaptations
   */
  private syncWithLiveSession(formAnalysis: FormAnalysis): void {
    try {
      // Record form quality for milestones
      const milestones = sessionGuidanceService.recordFormQuality(formAnalysis.isValid);
      
      // Use registered listeners instead of direct Redux store access
      if (this.onMilestoneReached) {
        milestones.forEach(m => this.onMilestoneReached!(m));
      }

      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          formScore: formAnalysis.score,
          hasIssues: !formAnalysis.isValid,
          exerciseType: this.currentExercise,
          repCount: this.formAnalysisService.getRepCount(),
          timestamp: Date.now()
        });
      }
      
      // Trigger workout adaptation if form is consistently poor
      const shouldAdapt = this.shouldTriggerWorkoutAdaptation(formAnalysis);
      if (shouldAdapt && this.onAdaptationRequired) {
        this.onAdaptationRequired({
          reason: 'form_correction',
          formScore: formAnalysis.score,
          currentExercise: this.currentExercise
        });
      }

      // Legacy support for direct store access if listeners not registered
      if (!this.onStatusUpdate && !this.onMilestoneReached) {
        const store = window.__REDUX_STORE__ || (window as any).reduxStore;
        if (store && store.dispatch) {
          milestones.forEach(m => {
            store.dispatch({
              type: 'liveSession/addMilestone',
              payload: m
            });
          });

          store.dispatch({
            type: 'liveSession/setFormCorrectionStatus',
            payload: {
              formScore: formAnalysis.score,
              hasIssues: !formAnalysis.isValid,
              exerciseType: this.currentExercise,
              repCount: this.formAnalysisService.getRepCount(),
              timestamp: Date.now()
            }
          });
          
          if (shouldAdapt) {
            store.dispatch({
              type: 'liveSession/requestAdaptation',
              payload: {
                reason: 'form_correction',
                formScore: formAnalysis.score,
                currentExercise: this.currentExercise
              }
            });
          }
        }
      }
    } catch (error) {
      // Graceful degradation if sync fails
      console.warn('Failed to sync with LiveSession:', error);
    }
  }

  /**
   * Determine if workout adaptation should be triggered based on form quality
   */
  private shouldTriggerWorkoutAdaptation(formAnalysis: FormAnalysis): boolean {
    // Trigger adaptation for high severity issues or very poor form
    const hasHighSeverityIssues = formAnalysis.issues.some(issue => issue.severity === 'high');
    const isFormVeryPoor = formAnalysis.score < 60;
    
    return hasHighSeverityIssues || isFormVeryPoor;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    await this.stopFormCorrection();
    this.poseDetectionService.dispose();
    this.audioCoachingService.dispose();
    
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
    }
    
    this.state.isActive = false;
  }
}
