/**
 * Unified Coaching Component Tests
 * Comprehensive test coverage for unified coaching interface
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UnifiedCoachingComponent } from '../UnifiedCoachingComponent';
import unifiedCoachingSlice from '../../../store/unifiedCoachingSlice';
import { CoachingPriority } from '../../../features/unified-coaching/types/unifiedCoaching.types';

// Mock the orchestrator
vi.mock('@/features/unified-coaching', () => ({
  aiCoachingOrchestrator: {
    processIntegratedCoaching: vi.fn()
  }
}));

const mockStore = configureStore({
  reducer: {
    unifiedCoaching: unifiedCoachingSlice
  }
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      {component}
    </Provider>
  );
};

describe('UnifiedCoachingComponent', () => {
  const mockLiveSession = {
    isActive: true,
    currentAdaptation: { action: 'increase_intensity', reason: 'Performance good' },
    confidence: 0.8
  };

  const mockFormCorrection = {
    isActive: true,
    currentCorrection: { action: 'adjust_posture', reason: 'Poor form detected' },
    confidence: 0.9
  };

  const mockSafetyOverride = {
    isActive: false,
    overrideAction: null
  };

  const mockInjuryAware = {
    isActive: true,
    currentRecommendation: { action: 'reduce_weight', reason: 'Knee discomfort' },
    confidence: 0.85
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render inactive state when no session data', () => {
    renderWithProvider(
      <UnifiedCoachingComponent />
    );

    expect(screen.getByText('AI Coaching is inactive')).toBeInTheDocument();
  });

  it('should start coaching session when data provided', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.9,
        recommendation: {
          action: 'adjust_posture',
          message: 'Correct your squat form'
        },
        reasoning: 'Poor form detected',
        timestamp: Date.now()
      },
      contributingSystems: [
        {
          system: 'form-correction',
          priority: CoachingPriority.FORM,
          response: {
            type: 'form-correction',
            confidence: 0.9,
            recommendation: { action: 'adjust_posture' },
            reasoning: 'Form issue',
            timestamp: Date.now()
          },
          wasConflicted: false
        }
      ],
      conflictResolution: null,
      metadata: {
        processingTime: 150,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Current Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Correct your squat form')).toBeInTheDocument();
      expect(screen.getByText('Confidence: 90.0%')).toBeInTheDocument();
      expect(screen.getByText('Systems considered: 1')).toBeInTheDocument();
    });
  });

  it('should display priority level correctly', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.SAFETY,
      response: {
        type: 'safety-intervention',
        confidence: 1.0,
        recommendation: {
          action: 'stop',
          message: 'Stop exercise for safety'
        },
        reasoning: 'Heart rate too high',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 100,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.SAFETY,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={{ ...mockSafetyOverride, isActive: true }}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Safety Priority')).toBeInTheDocument();
    });
  });

  it('should display performance metrics', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'adaptation',
        confidence: 0.7,
        recommendation: { action: 'continue' },
        reasoning: 'Performance adequate',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 200,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.ADAPTATION,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Avg Time')).toBeInTheDocument();
      expect(screen.getByText('Total Decisions')).toBeInTheDocument();
      expect(screen.getByText('Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Session Time')).toBeInTheDocument();
    });
  });

  it('should handle emergency stop', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.8,
        recommendation: { action: 'adjust' },
        reasoning: 'Form issue',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 150,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Stop')).toBeInTheDocument();
    });

    // Click emergency stop
    fireEvent.click(screen.getByText('Emergency Stop'));

    // Check if emergency stop decision is set
    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.unifiedCoaching.currentDecision.response.type).toBe('emergency-stop');
      expect(state.unifiedCoaching.currentDecision.priority).toBe(CoachingPriority.SAFETY);
    });
  });

  it('should display error state', async () => {
    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockRejectedValue(
      new Error('AI processing failed')
    );

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: AI processing failed')).toBeInTheDocument();
    });
  });

  it('should toggle history display', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'adaptation',
        confidence: 0.8,
        recommendation: { action: 'continue' },
        reasoning: 'Good performance',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 100,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.ADAPTATION,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Show History')).toBeInTheDocument();
    });

    // Click to show history
    fireEvent.click(screen.getByText('Show History'));

    await waitFor(() => {
      expect(screen.getByText('Hide History')).toBeInTheDocument();
    });
  });

  it('should show no recommendations state', async () => {
    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue({
      system: 'unified-coaching',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'no-input',
        confidence: 1.0,
        recommendation: { action: 'continue', message: 'No active AI systems providing input' },
        reasoning: 'No AI systems currently active or providing recommendations',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 50,
        systemsConsidered: 0,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.ADAPTATION,
        timestamp: Date.now()
      }
    });

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No active coaching recommendations')).toBeInTheDocument();
    });
  });

  it('should be accessible (WCAG Level AA)', async () => {
    const mockDecision = {
      system: 'unified-coaching',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.9,
        recommendation: { action: 'adjust', message: 'Adjust form' },
        reasoning: 'Form issue',
        timestamp: Date.now()
      },
      contributingSystems: [],
      conflictResolution: null,
      metadata: {
        processingTime: 150,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    const { aiCoachingOrchestrator } = require('@/features/unified-coaching');
    aiCoachingOrchestrator.processIntegratedCoaching.mockResolvedValue(mockDecision);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      // Check for ARIA labels
      expect(screen.getByLabelText('Emergency stop coaching')).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /current coaching decision/i })).toBeInTheDocument();
      
      // Check for semantic HTML
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});