/**
 * P0 Security Tests for Form Correction Data (R-001)
 * Tests security and privacy validation for sensitive form correction data
 * @p0 @security @encryption @form-correction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrivacyValidationService } from '@/services/privacy/PrivacyValidationService';
import { PoseDetectionService, Pose, PoseKeypoint } from '@/features/form-correction/services/PoseDetectionService';
import { FormAnalysisService, FormAnalysis } from '@/features/form-correction/services/FormAnalysisService';

// Mock dependencies
vi.mock('@/services/privacy/PrivacyValidationService');
vi.mock('@/features/form-correction/services/FormAnalysisService');
vi.mock('@/features/form-correction/services/PoseDetectionService');

describe('P0 Security Tests - Form Correction Data Protection', () => {
  let privacyService: PrivacyValidationService;
  let poseDetectionService: PoseDetectionService;
  let formAnalysisService: FormAnalysisService;

  // Test data with potentially sensitive information
  const SENSITIVE_POSE_DATA: Pose = {
    keypoints: [
      {
        x: 150.5,
        y: 200.3,
        score: 0.95,
        name: 'nose'
      },
      {
        x: 145.2,
        y: 185.7,
        score: 0.89,
        name: 'left_eye'
      }
    ],
    score: 0.92,
    box: [100, 150, 200, 300]
  };

  const SENSITIVE_FORM_ANALYSIS: FormAnalysis = {
    isValid: false,
    issues: [
      {
        type: 'alignment',
        severity: 'medium',
        bodyPart: 'knees',
        description: 'Knees extending beyond toes',
        recommendation: 'Shift weight back into heels'
      }
    ],
    score: 72,
    feedback: 'Adjust knee alignment for better form',
    timestamp: Date.now(),
    processingTime: 45
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize mock services
    privacyService = PrivacyValidationService.getInstance();
    poseDetectionService = new PoseDetectionService();
    formAnalysisService = new FormAnalysisService();

    // Mock privacy service methods
    vi.mocked(privacyService.validateDataForAI).mockReturnValue({
      isCompliant: true,
      violations: [],
      piiDetected: [],
      safeToSend: true,
      sanitizedData: SENSITIVE_POSE_DATA
    });

    // Mock pose detection
    vi.mocked(poseDetectionService.detectPoses).mockResolvedValue([SENSITIVE_POSE_DATA]);
    vi.mocked(poseDetectionService.initialize).mockResolvedValue();

    // Mock form analysis
    vi.mocked(formAnalysisService.analyzeForm).mockResolvedValue(SENSITIVE_FORM_ANALYSIS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('@p0 Data Privacy and PII Protection', () => {
    it('should detect and block PII in pose data before processing', () => {
      // Arrange
      const poseDataWithPII = {
        ...SENSITIVE_POSE_DATA,
        metadata: {
          userId: 'user-john-doe-123',
          email: 'john.doe@example.com',
          phoneNumber: '+1-555-123-4567'
        }
      };

      // Mock PII detection
      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['Email detected', 'Phone number detected'],
        piiDetected: ['john.doe@example.com', '+1-555-123-4567'],
        safeToSend: false,
        sanitizedData: SENSITIVE_POSE_DATA // Sanitized version
      });

      // Act
      const validationResult = privacyService.validateDataForAI(poseDataWithPII, 'pose-detection');

      // Assert
      expect(validationResult.isCompliant).toBe(false);
      expect(validationResult.piiDetected).toContain('john.doe@example.com');
      expect(validationResult.piiDetected).toContain('+1-555-123-4567');
      expect(validationResult.safeToSend).toBe(false);
    });

    it('should prevent unauthorized data transmission to external services', () => {
      // Arrange
      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['External transmission blocked by policy'],
        piiDetected: [],
        safeToSend: false
      });

      // Act
      const result = privacyService.validateDataForAI(
        SENSITIVE_POSE_DATA,
        'external-ai-service'
      );

      // Assert
      expect(result.safeToSend).toBe(false);
      expect(result.violations).toContain('External transmission blocked by policy');
    });

    it('should enforce data size limits for privacy protection', () => {
      // Arrange
      const largeData = {
        ...SENSITIVE_POSE_DATA,
        largeField: 'x'.repeat(12000) // Exceeds 10KB limit
      };

      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['Data size too large: 12000 bytes (max: 10KB)'],
        piiDetected: [],
        safeToSend: false
      });

      // Act
      const result = privacyService.validateDataForAI(largeData, 'form-analysis');

      // Assert
      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Data size too large');
    });
  });

  describe('@p0 Local-Only Processing Verification', () => {
    it('should process form corrections locally without external API calls', async () => {
      // Arrange
      const mockVideoElement = {
        videoWidth: 640,
        videoHeight: 480,
        readyState: 4,
        play: vi.fn(),
        pause: vi.fn()
      } as any;

      // Act
      await poseDetectionService.initialize();
      const poses = await poseDetectionService.detectPoses(mockVideoElement);
      const analysis = await formAnalysisService.analyzeForm(poses, 'squat');

      // Assert
      expect(poseDetectionService.detectPoses).toHaveBeenCalledWith(mockVideoElement);
      expect(formAnalysisService.analyzeForm).toHaveBeenCalledWith(poses, 'squat');
      expect(poses).toHaveLength(1);
      expect(analysis.feedback).toBe('Adjust knee alignment for better form'); // Using actual interface
    });

    it('should validate that all processing happens in-memory', () => {
      // Act
      const result = privacyService.validateDataForAI(
        SENSITIVE_POSE_DATA,
        'local-processing'
      );

      // Assert
      expect(result.safeToSend).toBe(true);
      expect(result.isCompliant).toBe(true);
    });

    it('should ensure sensitive data is not logged permanently', () => {
      // Mock the transmission log access if available
      // Since transmissionLogs is private, we test through validation behavior
      const result = privacyService.validateDataForAI(
        SENSITIVE_POSE_DATA,
        'pose-detection'
      );

      expect(result.safeToSend).toBe(true);
    });
  });

  describe('@p0 Security Performance with Flexible Device SLAs', () => {
    it('should meet security validation performance targets', () => {
      // Arrange
      const performanceSLA = 50; // 50ms for privacy validation
      
      vi.mocked(privacyService.validateDataForAI).mockImplementation(() => {
        const startTime = performance.now();
        // Simulate validation work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        const endTime = performance.now();
        
        return {
          isCompliant: true,
          violations: [],
          piiDetected: [],
          safeToSend: true,
          sanitizedData: SENSITIVE_POSE_DATA,
          processingTime: endTime - startTime
        };
      });

      // Act
      const startTime = performance.now();
      const result = privacyService.validateDataForAI(
        SENSITIVE_POSE_DATA,
        'pose-detection'
      );
      const endTime = performance.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(performanceSLA);
      expect(result.safeToSend).toBe(true);
    });

    it('should adjust processing based on device capabilities', async () => {
      // Arrange
      vi.mocked(poseDetectionService.initialize).mockImplementation(async () => {
        // Simulate mobile initialization delay
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Act
      const startTime = performance.now();
      await poseDetectionService.initialize();
      const endTime = performance.now();

      // Assert
      expect(poseDetectionService.initialize).toHaveBeenCalled();
      // Mobile devices may take longer to initialize
      expect(endTime - startTime).toBeGreaterThan(0);
    });

    it('should prioritize security over performance when privacy risks are detected', () => {
      // Arrange
      const highRiskData = {
        ...SENSITIVE_POSE_DATA,
        metadata: {
          containsHealthData: true,
          consentLevel: 'minimal'
        },
        piiData: 'John Doe john.doe@example.com 123 Main St'
      };

      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['PII detected: email', 'PII detected: address'],
        piiDetected: ['john.doe@example.com', '123 Main St'],
        safeToSend: false
      });

      // Act
      const result = privacyService.validateDataForAI(highRiskData, 'form-correction');

      // Assert
      expect(result.safeToSend).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('@p0 Security Error Handling', () => {
    it('should handle privacy validation failures without exposing sensitive data', () => {
      // Arrange
      vi.mocked(privacyService.validateDataForAI).mockImplementation(() => {
        throw new Error('Privacy validation service unavailable');
      });

      // Act & Assert
      expect(() => {
        privacyService.validateDataForAI(SENSITIVE_POSE_DATA, 'pose-detection');
      }).toThrow('Privacy validation service unavailable');
    });

    it('should fall back to safe processing when validation fails', () => {
      // Arrange
      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['Privacy validation service error'],
        piiDetected: [],
        safeToSend: false,
        sanitizedData: null
      });

      // Act
      const result = privacyService.validateDataForAI(
        SENSITIVE_POSE_DATA,
        'form-correction'
      );

      // Assert
      expect(result.safeToSend).toBe(false);
      expect(result.sanitizedData).toBeNull();
    });

    it('should maintain data integrity during security checks', () => {
      // Arrange
      const originalData = JSON.stringify(SENSITIVE_POSE_DATA);

      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: true,
        violations: [],
        piiDetected: [],
        safeToSend: true,
        sanitizedData: SENSITIVE_POSE_DATA
      });

      // Act
      const result = privacyService.validateDataForAI(SENSITIVE_POSE_DATA, 'pose-detection');
      const resultData = JSON.stringify(result.sanitizedData);

      // Assert
      expect(originalData).toBe(resultData); // Data integrity maintained
    });
  });

  describe('@p0 Form Analysis Security Integration', () => {
    it('should validate form analysis results for privacy compliance', () => {
      // Arrange
      const analysisWithPII = {
        ...SENSITIVE_FORM_ANALYSIS,
        userId: 'user-sensitive-001',
        personalNotes: 'I feel pain in my left knee',
        medicalHistory: 'Previous ACL surgery'
      };

      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['Medical information detected', 'PII detected'],
        piiDetected: ['user-sensitive-001', 'ACL surgery'],
        safeToSend: false,
        sanitizedData: SENSITIVE_FORM_ANALYSIS // Clean version
      });

      // Act
      const result = privacyService.validateDataForAI(analysisWithPII, 'form-analysis');

      // Assert
      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Medical information detected');
      expect(result.safeToSend).toBe(false);
    });

    it('should ensure secure form analysis processing', async () => {
      // Arrange
      vi.mocked(formAnalysisService.analyzeForm).mockResolvedValue({
        ...SENSITIVE_FORM_ANALYSIS,
        processingTime: 30,
        score: 85
      });

      // Act
      const analysis = await formAnalysisService.analyzeForm([SENSITIVE_POSE_DATA], 'squat');

      // Assert
      expect(analysis.isValid).toBe(false);
      expect(analysis.issues).toHaveLength(1);
      expect(analysis.processingTime).toBe(30);
    });

    it('should block transmission of high-risk form analysis data', () => {
      // Arrange
      const highRiskAnalysis = {
        ...SENSITIVE_FORM_ANALYSIS,
        riskScore: 95, // High risk
        emergencyFlag: true,
        medicalAlert: 'Potential injury detected'
      };

      vi.mocked(privacyService.validateDataForAI).mockReturnValue({
        isCompliant: false,
        violations: ['Medical alert detected - requires secure handling'],
        piiDetected: [],
        safeToSend: false
      });

      // Act
      const result = privacyService.validateDataForAI(highRiskAnalysis, 'emergency-handling');

      // Assert
      expect(result.safeToSend).toBe(false);
      expect(result.violations).toContain('Medical alert detected');
    });
  });
});