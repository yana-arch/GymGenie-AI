import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormFeedbackOverlay } from '../components/FormFeedbackOverlay';
import { Pose } from '../services/PoseDetectionService';
import { FormAnalysis } from '../services/FormAnalysisService';

// Mock canvas context with proper value tracking
const mockCanvasContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  ellipse: vi.fn(),
  font: '',
  lineWidth: 0,
  // Fixed: Add proper mock tracking for fillStyle and strokeStyle
  _strokeStyle: '',
  _fillStyle: '',
  get strokeStyle() { return this._strokeStyle; },
  set strokeStyle(value) { 
    this._strokeStyle = value; 
    // Track calls for testing
    if (!this._strokeStyleCalls) this._strokeStyleCalls = [];
    this._strokeStyleCalls.push(value);
  },
  get fillStyle() { return this._fillStyle; },
  set fillStyle(value) { 
    this._fillStyle = value;
    // Track calls for testing
    if (!this._fillStyleCalls) this._fillStyleCalls = [];
    this._fillStyleCalls.push(value);
  },
  _strokeStyleCalls: [] as string[],
  _fillStyleCalls: [] as string[]
} as any;

// Mock HTMLCanvasElement methods that are missing in test environment
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockCanvasContext)
});

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  value: vi.fn(() => Promise.resolve())
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  value: vi.fn()
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb();
  return 1;
});

describe('FormFeedbackOverlay', () => {
  const mockPose: Pose = {
    keypoints: [
      { x: 100, y: 200, score: 0.9, name: 'nose' },
      { x: 120, y: 250, score: 0.8, name: 'left_shoulder' },
      { x: 80, y: 250, score: 0.7, name: 'right_shoulder' },
      { x: 110, y: 350, score: 0.8, name: 'left_hip' },
      { x: 90, y: 350, score: 0.7, name: 'right_hip' },
      { x: 115, y: 450, score: 0.6, name: 'left_knee' },
      { x: 85, y: 450, score: 0.5, name: 'right_knee' }
    ],
    score: 0.85
  };

  const goodFormAnalysis: FormAnalysis = {
    isValid: true,
    issues: [],
    score: 95,
    feedback: 'Great form! Keep it up!',
    timestamp: Date.now()
  };

  const badFormAnalysis: FormAnalysis = {
    isValid: false,
    issues: [
      {
        type: 'range_of_motion',
        severity: 'high',
        bodyPart: 'Knee',
        description: 'Hip-knee angle is incorrect',
        recommendation: 'Go deeper in your squat'
      }
    ],
    score: 60,
    feedback: 'High priority: Go deeper in your squat',
    timestamp: Date.now()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render canvas element with correct dimensions', () => {
      render(
        <FormFeedbackOverlay
          videoWidth={640}
          videoHeight={480}
          currentPoses={[]}
          formAnalysis={null}
          isVisible={true}
        />
      );

      const canvas = screen.getByTestId('form-feedback-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '640');
      expect(canvas).toHaveAttribute('height', '480');
    });

    it('should not render content when not visible', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[]}
          formAnalysis={null}
          isVisible={false}
        />
      );

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('Skeleton Drawing', () => {
    it('should draw connections between keypoints', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Should draw connections for visible keypoints
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should use correct colors for different body parts', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Should use different colors for different connections
      const strokeStyleValue = mockCanvasContext.strokeStyle;
      expect(typeof strokeStyleValue).toBe('string');
      expect(['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']).toContain(strokeStyleValue);
    });

    it('should highlight problematic connections in red when form is poor', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={badFormAnalysis}
          isVisible={true}
        />
      );

      // Fixed: Check fillStyle calls array for red highlight
      expect(mockCanvasContext._fillStyleCalls).toContain('#ef444420'); // Red with transparency
    });
  });

  describe('Keypoint Drawing', () => {
    it('should draw keypoints as circles', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Should draw keypoints
      expect(mockCanvasContext.arc).toHaveBeenCalled();
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should only draw keypoints with confidence above threshold', () => {
      const poseWithLowConfidence = {
        ...mockPose,
        keypoints: [
          ...mockPose.keypoints,
          { x: 50, y: 100, score: 0.2, name: 'low_confidence_point' }
        ]
      };

      render(
        <FormFeedbackOverlay
          currentPoses={[poseWithLowConfidence]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Should not draw low confidence keypoints
      const arcCalls = mockCanvasContext.arc.mock.calls;
      const lowConfidenceCall = arcCalls.find((call: any) => 
        call[0] === 50 && call[1] === 100 // Coordinates of low confidence point
      );
      expect(lowConfidenceCall).toBeUndefined();
    });

    it('should use green color for good form keypoints', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Fixed: Check fillStyle calls array for green color
      expect(mockCanvasContext._fillStyleCalls).toContain('#10b981'); // Green
    });
  });

  describe('Form Feedback Display', () => {
    it('should display form score when analysis is available', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(10, 10, 150, 60);
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Form Score: 95', 20, 35);
    });

    it('should display form feedback message', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
        'Great form! Keep it up!',
        20,
        55
      );
    });

    it('should use red background for poor form scores', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={badFormAnalysis}
          isVisible={true}
        />
      );

      // Fixed: Check fillStyle calls array for red background
      expect(mockCanvasContext._fillStyleCalls).toContain('#ef4444'); // Red
    });

    it('should use green background for good form scores', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Fixed: Use tracked fillStyle calls array
      const hasGreenColorFinal = mockCanvasContext._fillStyleCalls.some((color: string) => 
        color.includes('#10b981')
      );
      expect(hasGreenColorFinal).toBe(true); // Green for good form
    });
  });

  describe('Form Issue Highlighting', () => {
    it('should highlight problematic body regions', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={badFormAnalysis}
          isVisible={true}
        />
      );

      // Should draw highlights for problematic areas
      expect(mockCanvasContext.arc).toHaveBeenCalledWith(
        expect.any(Number), // x
        expect.any(Number), // y
        30, // radius
        0,
        2 * Math.PI
      );
    });

    it('should use transparency in highlights', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={badFormAnalysis}
          isVisible={true}
        />
      );

      // Fixed: Use tracked fillStyle calls array
      const transparentColor = mockCanvasContext._fillStyleCalls.find((color: string) => 
        color.includes('20') // transparency indicator
      );
      expect(transparentColor).toBeDefined();
    });
  });

  describe('Responsive Scaling', () => {
    it('should calculate scale factor for different container sizes', () => {
      // This test would require mocking offsetWidth/offsetHeight
      // For now, we test that the component doesn't crash with different dimensions
      render(
        <FormFeedbackOverlay
          videoWidth={320}
          videoHeight={240}
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      // Component should render without errors
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should use requestAnimationFrame for smooth rendering', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should clear canvas before each redraw', () => {
      render(
        <FormFeedbackOverlay
          currentPoses={[mockPose]}
          formAnalysis={goodFormAnalysis}
          isVisible={true}
        />
      );

      expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, expect.any(Number), expect.any(Number));
    });
  });
});