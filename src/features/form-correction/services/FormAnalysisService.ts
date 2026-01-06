import { Pose, PoseKeypoint } from './PoseDetectionService';

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
}

export class FormAnalysisService {
  private exerciseRules: Map<string, ExerciseFormRule> = new Map();
  private analysisHistory: FormAnalysis[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.initializeExerciseRules();
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
   * Analyze form for a specific exercise
   */
  analyzeForm(poses: Pose[], exerciseType: string): FormAnalysis {
    if (poses.length === 0) {
      return this.createNoPoseAnalysis();
    }

    const pose = poses[0]; // Use first detected pose
    const rule = this.exerciseRules.get(exerciseType.toLowerCase());

    if (!rule) {
      return this.createUnsupportedExerciseAnalysis(exerciseType);
    }

    const issues: FormIssue[] = [];
    const startTime = Date.now();

    // Check keypoint angles
    this.checkKeypointAngles(pose, rule, issues);

    // Check vertical alignment
    this.checkVerticalAlignment(pose, rule, issues);

    // Check stability
    this.checkStability(pose, rule, issues);

    // Calculate overall score
    const score = this.calculateFormScore(issues);
    const isValid = score >= 80 && issues.filter(i => i.severity === 'high').length === 0;

    const analysis: FormAnalysis = {
      isValid,
      issues,
      score,
      feedback: this.generateFeedback(isValid, issues, exerciseType),
      timestamp: Date.now()
    };

    // Store in history for trend analysis
    this.addToHistory(analysis);

    return analysis;
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
   * Clear analysis history
   */
  clearHistory(): void {
    this.analysisHistory = [];
  }
}