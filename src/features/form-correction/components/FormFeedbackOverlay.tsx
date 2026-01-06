import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Pose, PoseKeypoint } from '../services/PoseDetectionService';
import { FormAnalysis } from '../services/FormAnalysisService';

interface FormFeedbackOverlayProps {
  videoWidth?: number;
  videoHeight?: number;
  currentPoses: Pose[];
  formAnalysis: FormAnalysis | null;
  isVisible: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface KeypointConnection {
  from: string;
  to: string;
  color: string;
}

const KEYPOINT_CONNECTIONS: KeypointConnection[] = [
  // Upper body
  { from: 'left_eye', to: 'right_eye', color: '#10b981' },
  { from: 'left_eye', to: 'nose', color: '#10b981' },
  { from: 'right_eye', to: 'nose', color: '#10b981' },
  { from: 'left_shoulder', to: 'right_shoulder', color: '#3b82f6' },
  { from: 'left_shoulder', to: 'nose', color: '#3b82f6' },
  { from: 'right_shoulder', to: 'nose', color: '#3b82f6' },
  
  // Arms
  { from: 'left_shoulder', to: 'left_elbow', color: '#8b5cf6' },
  { from: 'left_elbow', to: 'left_wrist', color: '#8b5cf6' },
  { from: 'right_shoulder', to: 'right_elbow', color: '#8b5cf6' },
  { from: 'right_elbow', to: 'right_wrist', color: '#8b5cf6' },
  
  // Torso
  { from: 'left_shoulder', to: 'left_hip', color: '#3b82f6' },
  { from: 'right_shoulder', to: 'right_hip', color: '#3b82f6' },
  { from: 'left_hip', to: 'right_hip', color: '#3b82f6' },
  
  // Legs
  { from: 'left_hip', to: 'left_knee', color: '#f59e0b' },
  { from: 'left_knee', to: 'left_ankle', color: '#f59e0b' },
  { from: 'right_hip', to: 'right_knee', color: '#f59e0b' },
  { from: 'right_knee', to: 'right_ankle', color: '#f59e0b' },
];

const BODY_PART_COLORS = {
  head: '#ef4444',
  torso: '#3b82f6',
  arms: '#8b5cf6',
  legs: '#f59e0b'
};

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
};

export const FormFeedbackOverlay: React.FC<FormFeedbackOverlayProps> = ({
  videoWidth = 640,
  videoHeight = 480,
  currentPoses,
  formAnalysis,
  isVisible
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleFactor, setScaleFactor] = useState({ x: 1, y: 1 });

  // Calculate scale factor for responsive canvas
  useEffect(() => {
    const updateScaleFactor = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const scaleX = container.clientWidth / videoWidth;
        const scaleY = container.clientHeight / videoHeight;
        setScaleFactor({ x: scaleX, y: scaleY });
      }
    };

    updateScaleFactor();
    window.addEventListener('resize', updateScaleFactor);
    return () => window.removeEventListener('resize', updateScaleFactor);
  }, [videoWidth, videoHeight]);

  // Get color based on form score
  const getKeypointColor = useCallback((keypoint: PoseKeypoint): string => {
    if (!formAnalysis || formAnalysis.isValid) {
      return '#10b981'; // Green for good form
    }

    // Check if this keypoint is mentioned in form issues
    const relatedIssue = formAnalysis.issues.find(issue => 
      issue.bodyPart.toLowerCase().includes(keypoint.name?.toLowerCase() || '') ||
      keypoint.name?.toLowerCase().includes(issue.bodyPart.toLowerCase())
    );

    if (relatedIssue) {
      return SEVERITY_COLORS[relatedIssue.severity];
    }

    return '#10b981'; // Default green
  }, [formAnalysis]);

  // Draw skeleton connections
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D, pose: Pose) => {
    const keypointsByName = new Map<string, PoseKeypoint>();
    pose.keypoints.forEach(kp => {
      if (kp.name && kp.score && kp.score > 0.3) {
        keypointsByName.set(kp.name, kp);
      }
    });

    KEYPOINT_CONNECTIONS.forEach(connection => {
      const fromKp = keypointsByName.get(connection.from);
      const toKp = keypointsByName.get(connection.to);

      if (fromKp && toKp) {
        ctx.beginPath();
        ctx.moveTo(fromKp.x * scaleFactor.x, fromKp.y * scaleFactor.y);
        ctx.lineTo(toKp.x * scaleFactor.x, toKp.y * scaleFactor.y);
        
        // Determine line color based on form analysis
        let strokeColor = connection.color;
        if (formAnalysis && !formAnalysis.isValid) {
          // Check if this connection involves problematic body part
          const isProblematic = formAnalysis.issues.some(issue => 
            issue.bodyPart.toLowerCase().includes(connection.from) ||
            issue.bodyPart.toLowerCase().includes(connection.to)
          );
          
          if (isProblematic) {
            const severity = formAnalysis.issues.find(issue => 
              issue.bodyPart.toLowerCase().includes(connection.from) ||
              issue.bodyPart.toLowerCase().includes(connection.to)
            )?.severity || 'medium';
            
            strokeColor = SEVERITY_COLORS[severity];
          }
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }, [formAnalysis, scaleFactor]);

  // Draw keypoints
  const drawKeypoints = useCallback((ctx: CanvasRenderingContext2D, pose: Pose) => {
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        const x = keypoint.x * scaleFactor.x;
        const y = keypoint.y * scaleFactor.y;
        const color = getKeypointColor(keypoint);

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw inner circle
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });
  }, [getKeypointColor, scaleFactor]);

  // Draw form feedback highlights
  const drawFormHighlights = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!formAnalysis || formAnalysis.isValid) return;

    formAnalysis.issues.forEach(issue => {
      // Highlight affected body regions with colored overlays
      ctx.fillStyle = SEVERITY_COLORS[issue.severity] + '20'; // Add transparency
      
      // Simple highlighting around problematic areas
      if (issue.bodyPart.includes('Knee')) {
        // Highlight knee area
        const kneePoints = currentPoses[0]?.keypoints.filter(kp => 
          kp.name?.includes('knee') && kp.score && kp.score > 0.3
        );
        
        kneePoints?.forEach(kp => {
          ctx.beginPath();
          ctx.arc(kp.x * scaleFactor.x, kp.y * scaleFactor.y, 30, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      if (issue.bodyPart.includes('Spine') || issue.bodyPart.includes('Back')) {
        // Highlight spine area
        currentPoses.forEach(pose => {
          const hip = pose.keypoints.find(kp => kp.name?.includes('hip'));
          const shoulder = pose.keypoints.find(kp => kp.name?.includes('shoulder'));
          
          if (hip && shoulder && hip.score && shoulder.score && hip.score > 0.3 && shoulder.score > 0.3) {
            const centerX = (hip.x + shoulder.x) / 2 * scaleFactor.x;
            const centerY = (hip.y + shoulder.y) / 2 * scaleFactor.y;
            
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, 40, 60, 0, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    });
  }, [formAnalysis, currentPoses, scaleFactor]);

  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isVisible) return;

    // Draw poses and feedback
    currentPoses.forEach(pose => {
      drawConnections(ctx, pose);
      drawKeypoints(ctx, pose);
    });

    // Draw form feedback highlights
    drawFormHighlights(ctx);

    // Draw form score
    if (formAnalysis) {
      ctx.fillStyle = formAnalysis.isValid ? '#10b981' : '#ef4444';
      ctx.fillRect(10, 10, 150, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Form Score: ${formAnalysis.score}`, 20, 35);
      
      ctx.font = '14px sans-serif';
      ctx.fillText(formAnalysis.feedback, 20, 55);
    }
  }, [currentPoses, drawConnections, drawKeypoints, drawFormHighlights, formAnalysis, isVisible]);

  // Animation loop
  useEffect(() => {
    const animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [draw]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={videoWidth}
        height={videoHeight}
        className="w-full h-full"
        data-testid="form-feedback-canvas"
        style={{
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};