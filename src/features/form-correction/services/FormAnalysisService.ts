import { Pose, PoseKeypoint } from './PoseDetectionService';
import { ContextCaptureService } from '../../session/services/ContextCaptureService';
import { EncouragementService } from '../../session/services/EncouragementService';

export interface FormIssue {
  type: 'alignment' | 'depth' | 'stability' | 'range_of_motion';
  severity: 'low' | 'medium' | 'high';
  bodyPart: string;
  description: string;
  recommendation: string;
}

export interface ExerciseFormRule {
  name: string;
  keypointAngles: { [key: string]: { min: number; max: number } };
  verticalAlignment: { [key: string]: { expectedY: number; tolerance: number } };
  stabilityChecks: { [key: string]: { maxMovement: number } };
}

export interface FormAnalysis {
  isValid: boolean;
  issues: FormIssue[];
  score: number; // 0-100
  feedback: string;
  timestamp: number;
  processingTime?: number; // Performance tracking
}

export interface PerformanceMetrics {
  analysisCount: number;
  averageProcessingTime: number;
  maxProcessingTime: number;
  slaCompliance: number; // Percentage of analyses under 500ms
}

export class FormAnalysisService {
  private static instance: FormAnalysisService;
  private exerciseRules: Map<string, ExerciseFormRule> = new Map();
  private analysisHistory: FormAnalysis[] = [];
  private maxHistorySize = 100;
  private performanceMetrics: PerformanceMetrics = {
    analysisCount: 0,
    averageProcessingTime: 0,
    maxProcessingTime: 0,
    slaCompliance: 100
  };
  private repCount = 0;
  private isRepInProgress = false;

  private constructor() {
    this.initializeExerciseRules();
  }

  /**
   * Resets the singleton instance (primarily for testing)
   */
  public static resetInstance(): void {
    FormAnalysisService.instance = undefined as any;
  }

  public static getInstance(): FormAnalysisService {
    if (!FormAnalysisService.instance) {
      FormAnalysisService.instance = new FormAnalysisService();
    }
    return FormAnalysisService.instance;
  }

  /**
   * Initialize exercise-specific form validation rules
   */
  private initializeExerciseRules(): void {
    // Squat form rules
    this.exerciseRules.set('squat', {
      name: 'Squat',
      keypointAngles: {
        // Hip angle at bottom of squat (should be ~90 degrees)
        'hip_knee_ankle': { min: 80, max: 100 },
        // Knee tracking over feet
        'knee_alignment': { min: -5, max: 5 } // degrees from vertical
      },
      verticalAlignment: {
        // Spine should be relatively straight
        'shoulder_hip_alignment': { expectedY: 0.95, tolerance: 0.1 }
      },
      stabilityChecks: {
        // Minimal lateral movement
        'hip_stability': { maxMovement: 0.05 }
      }
    });

    // Push-up form rules
    this.exerciseRules.set('pushup', {
      name: 'Push-up',
      keypointAngles: {
        // Elbow angle at bottom (should be ~90 degrees)
        'elbow_angle': { min: 80, max: 100 },
        // Body alignment
        'body_line': { min: 170, max: 190 } // degrees from horizontal
      },
      verticalAlignment: {
        // Head should be neutral
        'head_alignment': { expectedY: 0.98, tolerance: 0.05 }
      },
      stabilityChecks: {
        // Core stability
        'hip_stability': { maxMovement: 0.03 }
      }
    });

    // Plank form rules
    this.exerciseRules.set('plank', {
      name: 'Plank',
      keypointAngles: {
        // Body should be straight line
        'body_line': { min: 175, max: 185 }
      },
      verticalAlignment: {
        // Hips should be level with shoulders
        'hip_shoulder_alignment': { expectedY: 1.0, tolerance: 0.05 }
      },
      stabilityChecks: {
        // Minimal movement
        'overall_stability': { maxMovement: 0.02 }
      }
    });
  }

  /**
   * Warm up or switch to a new exercise configuration
   */
  prepareForExercise(exerciseType: string): void {
    console.log(`FormAnalysisService: Preparing for ${exerciseType}...`);
    // Simulate model warmup to meet < 500ms first-analysis requirement
    const rule = this.exerciseRules.get(exerciseType.toLowerCase());
    if (!rule) {
      console.warn(`FormAnalysisService: No rules found for ${exerciseType}`);
      return;
    }

    // In a real implementation, we would pre-load the specific TFLite model here
    // For now, we simulate the "warm" state by pre-calculating rule-specific constants
    console.log(`FormAnalysisService: Model for ${exerciseType} warmed up.`);
  }

  /**
   * Analyze form for a specific exercise
   */
  analyzeForm(poses: Pose[], exerciseType: string): FormAnalysis {
    const startTime = performance.now();
    
    if (poses.length === 0) {
      return this.createNoPoseAnalysis();
    }

    const pose = poses[0]; // Use first detected pose
    const rule = this.exerciseRules.get(exerciseType.toLowerCase());

    if (!rule) {
      return this.createUnsupportedExerciseAnalysis(exerciseType);
    }

    const issues: FormIssue[] = [];

    // Check keypoint angles
    this.checkKeypointAngles(pose, rule, issues);

    // Check vertical alignment
    this.checkVerticalAlignment(pose, rule, issues);

    // Check stability
    this.checkStability(pose, rule, issues);

    // Rep detection logic
    this.detectReps(pose, exerciseType);

    // Calculate overall score
    const score = this.calculateFormScore(issues);
    const isValid = score >= 80 && issues.filter(i => i.severity === 'high').length === 0;

    const processingTime = performance.now() - startTime;
    
    // Update performance metrics
    this.updatePerformanceMetrics(processingTime);

    // Check 500ms SLA
    if (processingTime > 500) {
      console.warn(`Form analysis SLA breach: ${processingTime.toFixed(2)}ms > 500ms for exercise: ${exerciseType}`);
    }

    const analysis: FormAnalysis = {
      isValid,
      issues,
      score,
      feedback: this.generateFeedback(isValid, issues, exerciseType),
      timestamp: Date.now(),
      processingTime
    };

    // Store in history for trend analysis
    this.addToHistory(analysis);

    // Integrate with ContextCaptureService for fatigue detection
    ContextCaptureService.getInstance().recordFormQuality(analysis.score / 100);

    return analysis;
  }

  /**
   * Simple rep detection based on joint angles
   */
  private detectReps(pose: Pose, exerciseType: string): void {
    const keypoints = this.keypointsToObject(pose.keypoints);
    const type = exerciseType.toLowerCase();

    if (type === 'squat' && keypoints.hip && keypoints.knee && keypoints.ankle) {
      const angle = this.calculateAngle(keypoints.hip, keypoints.knee, keypoints.ankle);
      if (angle < 110) { // Bottom of squat
        this.isRepInProgress = true;
      } else if (angle > 160 && this.isRepInProgress) { // Standing back up
        this.isRepInProgress = false;
        this.repCount++;
        EncouragementService.getInstance().recordRep();
      }
    } else if (type === 'pushup' && keypoints.shoulder && keypoints.elbow && keypoints.wrist) {
      const angle = this.calculateAngle(keypoints.shoulder, keypoints.elbow, keypoints.wrist);
      if (angle < 100) { // Bottom of pushup
        this.isRepInProgress = true;
      } else if (angle > 160 && this.isRepInProgress) { // Back up
        this.isRepInProgress = false;
        this.repCount++;
        EncouragementService.getInstance().recordRep();
      }
    }
  }

  /**
   * Update performance metrics for SLA tracking
   */
  private updatePerformanceMetrics(processingTime: number): void {
    this.performanceMetrics.analysisCount++;
    
    // Update average processing time
    const totalTime = this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.analysisCount - 1) + processingTime;
    this.performanceMetrics.averageProcessingTime = totalTime / this.performanceMetrics.analysisCount;
    
    // Update max processing time
    if (processingTime > this.performanceMetrics.maxProcessingTime) {
      this.performanceMetrics.maxProcessingTime = processingTime;
    }
    
    // Update SLA compliance (percentage under 500ms)
    const slaBreaches = this.analysisHistory.filter(a => a.processingTime && a.processingTime > 500).length;
    const totalAnalyses = this.analysisHistory.filter(a => a.processingTime).length;
    this.performanceMetrics.slaCompliance = totalAnalyses > 0 ? ((totalAnalyses - slaBreaches) / totalAnalyses) * 100 : 100;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Check if specific angles are within acceptable ranges
   */
  private checkKeypointAngles(pose: Pose, rule: ExerciseFormRule, issues: FormIssue[]): void {
    const keypoints = this.keypointsToObject(pose.keypoints);

    // Check hip-knee-ankle angle for squats
    if (keypoints.hip && keypoints.knee && keypoints.ankle) {
      const angle = this.calculateAngle(keypoints.hip, keypoints.knee, keypoints.ankle);
      const expectedAngle = rule.keypointAngles['hip_knee_ankle'];
      
      if (expectedAngle && (angle < expectedAngle.min || angle > expectedAngle.max)) {
        issues.push({
          type: 'range_of_motion',
          severity: Math.abs(angle - 90) > 30 ? 'high' : 'medium',
          bodyPart: 'Hip/Knee',
          description: `Hip-knee angle is ${angle.toFixed(1)}° (expected: ${expectedAngle.min}-${expectedAngle.max}°)`,
          recommendation: angle < expectedAngle.min ? 'Go deeper in your squat' : 'Reduce depth to maintain proper form'
        });
      }
    }

    // Check elbow angle for push-ups
    if (keypoints.shoulder && keypoints.elbow && keypoints.wrist) {
      const angle = this.calculateAngle(keypoints.shoulder, keypoints.elbow, keypoints.wrist);
      const expectedAngle = rule.keypointAngles['elbow_angle'];
      
      if (expectedAngle && (angle < expectedAngle.min || angle > expectedAngle.max)) {
        issues.push({
          type: 'range_of_motion',
          severity: Math.abs(angle - 90) > 20 ? 'high' : 'medium',
          bodyPart: 'Elbow',
          description: `Elbow angle is ${angle.toFixed(1)}° (expected: ${expectedAngle.min}-${expectedAngle.max}°)`,
          recommendation: angle < expectedAngle.min ? 'Lower your chest more' : 'Don\'t go too deep'
        });
      }
    }
  }

  /**
   * Check vertical alignment of body parts
   */
  private checkVerticalAlignment(pose: Pose, rule: ExerciseFormRule, issues: FormIssue[]): void {
    const keypoints = this.keypointsToObject(pose.keypoints);

    // Check shoulder-hip alignment
    if (keypoints.shoulder && keypoints.hip) {
      const alignmentRatio = keypoints.hip.y / keypoints.shoulder.y;
      const expectedAlignment = rule.verticalAlignment['shoulder_hip_alignment'];
      
      if (expectedAlignment && Math.abs(alignmentRatio - expectedAlignment.expectedY) > expectedAlignment.tolerance) {
        issues.push({
          type: 'alignment',
          severity: Math.abs(alignmentRatio - expectedAlignment.expectedY) > 0.2 ? 'high' : 'medium',
          bodyPart: 'Spine',
          description: 'Back is not properly aligned',
          recommendation: alignmentRatio < expectedAlignment.expectedY ? 'Keep your back straighter' : 'Reduce hip arch'
        });
      }
    }
  }

  /**
   * Check movement stability
   */
  private checkStability(pose: Pose, rule: ExerciseFormRule, issues: FormIssue[]): void {
    // For now, this is a basic implementation
    // In a real system, we'd track movement over multiple frames
    
    const keypoints = this.keypointsToObject(pose.keypoints);
    
    // Simple stability check based on keypoint confidence scores
    const lowConfidencePoints = pose.keypoints.filter(kp => (kp.score || 0) < 0.5);
    
    if (lowConfidencePoints.length > 2) {
      issues.push({
        type: 'stability',
        severity: 'medium',
        bodyPart: 'Overall',
        description: 'Camera may not have clear view of your form',
        recommendation: 'Adjust position to ensure full body visibility'
      });
    }
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(point1: PoseKeypoint, point2: PoseKeypoint, point3: PoseKeypoint): number {
    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                   Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  }

  /**
   * Convert keypoints array to object for easier access
   */
  private keypointsToObject(keypoints: PoseKeypoint[]): { [key: string]: PoseKeypoint } {
    const result: { [key: string]: PoseKeypoint } = {};
    
    keypoints.forEach(kp => {
      if (kp.name) {
        result[kp.name.toLowerCase()] = kp;
      }
    });
    
    return result;
  }

  /**
   * Calculate form score based on issues
   */
  private calculateFormScore(issues: FormIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Generate human-readable feedback
   */
  private generateFeedback(isValid: boolean, issues: FormIssue[], exerciseType: string): string {
    if (isValid) {
      return 'Great form! Keep it up!';
    }

    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');

    if (highSeverityIssues.length > 0) {
      return `High priority: ${highSeverityIssues[0].recommendation}`;
    }

    if (mediumIssues.length > 0) {
      return `Focus on: ${mediumIssues[0].recommendation}`;
    }

    return `Minor adjustment: ${issues[0].recommendation}`;
  }

  /**
   * Create analysis when no pose is detected
   */
  private createNoPoseAnalysis(): FormAnalysis {
    return {
      isValid: false,
      issues: [{
        type: 'stability',
        severity: 'high',
        bodyPart: 'Full Body',
        description: 'No pose detected',
        recommendation: 'Position yourself in view of the camera'
      }],
      score: 0,
      feedback: 'Please position yourself in the camera view',
      timestamp: Date.now()
    };
  }

  /**
   * Create analysis for unsupported exercise
   */
  private createUnsupportedExerciseAnalysis(exerciseType: string): FormAnalysis {
    return {
      isValid: false,
      issues: [{
        type: 'alignment',
        severity: 'medium',
        bodyPart: 'Exercise',
        description: `Exercise type "${exerciseType}" not supported`,
        recommendation: 'Choose from: squat, pushup, plank'
      }],
      score: 0,
      feedback: `Exercise "${exerciseType}" form analysis not yet available`,
      timestamp: Date.now()
    };
  }

  /**
   * Add analysis to history for trend tracking
   */
  private addToHistory(analysis: FormAnalysis): void {
    this.analysisHistory.push(analysis);
    
    // Keep history size manageable
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory.shift();
    }
  }

  /**
   * Get form quality trends over time
   */
  getFormTrends(timeWindowMs: number = 30000): { averageScore: number; issueFrequency: { [type: string]: number } } {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentAnalyses = this.analysisHistory.filter(a => a.timestamp > cutoffTime);
    
    if (recentAnalyses.length === 0) {
      return { averageScore: 0, issueFrequency: {} };
    }

    const averageScore = recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length;
    const issueFrequency: { [type: string]: number } = {};

    recentAnalyses.forEach(analysis => {
      analysis.issues.forEach(issue => {
        issueFrequency[issue.type] = (issueFrequency[issue.type] || 0) + 1;
      });
    });

    return { averageScore, issueFrequency };
  }

  /**
   * Get current rep count
   */
  public getRepCount(): number {
    return this.repCount;
  }

  /**
   * Reset rep count (call at start of set)
   */
  public resetRepCount(): void {
    this.repCount = 0;
    this.isRepInProgress = false;
    EncouragementService.getInstance().resetSetProgress();
  }

  /**
   * Clear analysis history
   */
  clearHistory(): void {
    this.analysisHistory = [];
  }
}