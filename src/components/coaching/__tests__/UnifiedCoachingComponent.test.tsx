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
import { CoachingPriority, CoachingDecision, UnifiedCoachingState } from '../../../features/unified-coaching/types/unifiedCoaching.types';
import { aiCoachingOrchestrator } from '../../../features/unified-coaching';

// Mock the orchestrator
vi.mock('../../../features/unified-coaching', () => ({
  aiCoachingOrchestrator: {
    processIntegratedCoaching: vi.fn(),
    getMetrics: vi.fn(() => ({ sessionMetrics: [], activeSessions: 0 })),
    clearMetrics: vi.fn()
  }
}));

// Helper to create a fresh store for each test
const createTestStore = (preloadedState?: { unifiedCoaching: UnifiedCoachingState }) => {
  return configureStore({
    reducer: {
      unifiedCoaching: unifiedCoachingSlice
    },
    preloadedState
  });
};

const renderWithProvider = (component: React.ReactElement, preloadedState?: { unifiedCoaching: UnifiedCoachingState }) => {
  const store = createTestStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store
  };
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
    overrideAction: null as any
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

    expect(screen.getByText(/AI Coaching is inactive/i)).toBeInTheDocument();
  });

  it('should start coaching session when data provided', async () => {
    const mockDecision: Partial<CoachingDecision> = {
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

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Current Recommendation/i)).toBeInTheDocument();
      expect(screen.getByText(/Correct your squat form/i)).toBeInTheDocument();
      expect(screen.getByText(/Confidence: 90.0%/i)).toBeInTheDocument();
      expect(screen.getByText(/Systems considered: 1/i)).toBeInTheDocument();
    });
  });

  it('should display priority level correctly', async () => {
    const mockDecision: Partial<CoachingDecision> = {
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
      contributingSystems: [] as any[],
      conflictResolution: null,
      metadata: {
        processingTime: 100,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.SAFETY,
        timestamp: Date.now()
      }
    };

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={{ ...mockSafetyOverride, isActive: true }}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Safety Priority/i).length).toBeGreaterThan(0);
    });
  });

  it('should display performance metrics', async () => {
    const mockDecision: Partial<CoachingDecision> = {
      system: 'unified-coaching',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'adaptation',
        confidence: 0.7,
        recommendation: { action: 'continue', message: 'Continue' },
        reasoning: 'Performance adequate',
        timestamp: Date.now()
      },
      contributingSystems: [] as any[],
      conflictResolution: null,
      metadata: {
        processingTime: 200,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.ADAPTATION,
        timestamp: Date.now()
      }
    };

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/Avg Time/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Decisions/i)).toBeInTheDocument();
      expect(screen.getByText(/Conflicts/i)).toBeInTheDocument();
      expect(screen.getByText(/Session Time/i)).toBeInTheDocument();
    });
  });

  it('should handle emergency stop', async () => {
    const mockDecision: Partial<CoachingDecision> = {
      system: 'unified-coaching',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.8,
        recommendation: { action: 'adjust', message: 'Adjust' },
        reasoning: 'Form issue',
        timestamp: Date.now()
      },
      contributingSystems: [] as any[],
      conflictResolution: null,
      metadata: {
        processingTime: 150,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

    const { store } = renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Emergency Stop/i).length).toBeGreaterThan(0);
    });

    // Click emergency stop
    fireEvent.click(screen.getAllByText(/Emergency Stop/i)[0]);

    // Check if emergency stop decision is set
    await waitFor(() => {
      const state: any = store.getState();
      expect(state.unifiedCoaching.currentDecision.response.type).toBe('emergency-stop');
      expect(state.unifiedCoaching.currentDecision.priority).toBe(CoachingPriority.SAFETY);
    });
  });

  it('should display error state', async () => {
    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockRejectedValue(
      new Error('AI service unavailable')
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
      expect(screen.getByText(/AI coaching is temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  it('should toggle history display', async () => {
    const mockDecision: Partial<CoachingDecision> = {
      system: 'unified-coaching',
      priority: CoachingPriority.ADAPTATION,
      response: {
        type: 'adaptation',
        confidence: 0.8,
        recommendation: { action: 'continue', message: 'Continue' },
        reasoning: 'Good performance',
        timestamp: Date.now()
      },
      contributingSystems: [] as any[],
      conflictResolution: null,
      metadata: {
        processingTime: 100,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.ADAPTATION,
        timestamp: Date.now()
      }
    };

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

    renderWithProvider(
      <UnifiedCoachingComponent
        liveSession={mockLiveSession}
        formCorrection={mockFormCorrection}
        safetyOverride={mockSafetyOverride}
        injuryAware={mockInjuryAware}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Show History/i)).toBeInTheDocument();
    });

    // Click to show history
    fireEvent.click(screen.getByText(/Show History/i));

    await waitFor(() => {
      expect(screen.getByText(/Hide History/i)).toBeInTheDocument();
    });
  });

  it('should show no recommendations state', async () => {
    // Initial state with isActive: true but no decision
    const preloadedState = {
      unifiedCoaching: {
        currentDecision: null as any,
        coachingHistory: [] as any[],
        isActive: true,
        sessionStartTime: Date.now(),
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        conflictCount: 0,
        lastUpdated: null as any
      }
    };

    renderWithProvider(
      <UnifiedCoachingComponent />,
      preloadedState
    );

    await waitFor(() => {
      expect(screen.getByText(/No active coaching recommendations/i)).toBeInTheDocument();
    });
  });

  it('should be accessible (WCAG Level AA)', async () => {
    const mockDecision: Partial<CoachingDecision> = {
      system: 'unified-coaching',
      priority: CoachingPriority.FORM,
      response: {
        type: 'form-correction',
        confidence: 0.9,
        recommendation: { action: 'adjust', message: 'Adjust form' },
        reasoning: 'Form issue',
        timestamp: Date.now()
      },
      contributingSystems: [] as any[],
      conflictResolution: null,
      metadata: {
        processingTime: 150,
        systemsConsidered: 1,
        conflictsResolved: 0,
        priorityUsed: CoachingPriority.FORM,
        timestamp: Date.now()
      }
    };

    vi.mocked(aiCoachingOrchestrator.processIntegratedCoaching).mockResolvedValue(mockDecision as any);

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
      expect(screen.getByLabelText(/Emergency stop coaching/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Current coaching decision/i)).toBeInTheDocument();
    });
  });
});
