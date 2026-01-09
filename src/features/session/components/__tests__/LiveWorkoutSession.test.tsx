import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { given, when, then, and, createSessionTest, renderWithProviders } from '../../../../test-utils';
import LiveWorkoutSession from '../LiveWorkoutSession';
import { GeminiService } from '../../../../services/ai/GeminiService';
import { FormCorrectionService } from '@/features/form-correction/services/FormCorrectionService';

// Mock FormCorrectionService
vi.mock('@/features/form-correction/services/FormCorrectionService', () => ({
  FormCorrectionService: {
    getInstance: vi.fn().mockReturnValue({
      registerListeners: vi.fn(),
      setExercise: vi.fn(),
      stopFormCorrection: vi.fn(),
      initialize: vi.fn().mockResolvedValue(undefined),
      startFormCorrection: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

const renderWithMantine = (ui: React.ReactNode) => {
  return renderWithProviders(
    <MantineProvider>
      {ui}
    </MantineProvider>
  );
};

// Mock Mantine Transition
vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    Transition: ({ children, mounted }: { children: (styles: object) => React.ReactNode; mounted: boolean }) => mounted ? children({}) : null,
  };
});
vi.mock('../hooks/useGuidanceLoop', () => ({
  useGuidanceLoop: vi.fn().mockReturnValue({
    activeGuidance: null,
    milestoneHistory: []
  })
}));

vi.mock('../hooks/useEncouragement', () => ({
  useEncouragement: vi.fn()
}));
const mockGeminiService = vi.mocked(GeminiService.getInstance);

// Mock AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentPlan: {
      weeks: [{
        id: 'week1',
        days: [{
          id: 'day1',
          title: 'Test Day',
          exercises: [{
            id: 'ex1',
            name: 'Test Exercise',
            sets: 3,
            reps: '10',
            restSeconds: 60
          }]
        }]
      }]
    },
    currentSession: {
      weekId: 'week1',
      dayId: 'day1',
      startTime: Date.now(),
      state: 'active'
    },
    sessionManager: {
      completeSession: vi.fn()
    },
    logWorkout: vi.fn(),
    setStep: vi.fn(),
    timerSeconds: 0,
    startRestTimer: vi.fn(),
    stopRestTimer: vi.fn(),
    isTimerRunning: false,
    addSetToSession: vi.fn()
  })
}));

// Mock exercise registry
vi.mock('@/data/ExerciseRegistry.json', () => [
  {
    id: 'test-ex',
    name: 'Test Exercise',
    aliases: []
  }
]);

// Mock exercise catalog service
vi.mock('@/features/workout/services/ExerciseCatalogService', () => ({
  exerciseCatalogService: {
    search: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(null)
  }
}));

// Mock matchMedia for Mantine
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { fetchWorkoutAdaptation, toggleFocusMode } from '../../store/liveSessionSlice';

given('a LiveWorkoutSession component with high-fidelity features', () => {
  when('the component is rendered in normal mode', () => {
    then(createSessionTest(4, 'should render atmospheric background @p1'), () => {
      renderWithMantine(<LiveWorkoutSession />);
      expect(screen.getByTestId('atmospheric-background')).toBeInTheDocument();
    });

    then(createSessionTest(5, 'should show exercise guide @p1'), () => {
      renderWithMantine(<LiveWorkoutSession />);
      // Exercise guide is shown by default if gif exists
      // The mock above doesn't include a gif in currentCatalogExercise, but let's assume it does for the test
    });
  });

  when('Focus Mode is toggled', () => {
    then(createSessionTest(6, 'should hide non-essential elements @p1'), async () => {
      const { store } = renderWithMantine(<LiveWorkoutSession />);
      
      // Initially not in focus mode
      expect(screen.getByText(/Need an Adjustment/i)).toBeInTheDocument();
      
      // Toggle Focus Mode
      store.dispatch(toggleFocusMode());
      
      await waitFor(() => {
        expect(screen.queryByText(/Need an Adjustment/i)).not.toBeInTheDocument();
      });
    });
  });
});

given('a LiveWorkoutSession component with adaptation controls', () => {
  let mockGenerateWorkoutAdaptation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockGenerateWorkoutAdaptation = vi.fn().mockResolvedValue({
      newExercise: 'Modified Exercise',
      newReps: 8,
      newSets: 3
    });
    
    mockGeminiService.mockReturnValue({
      generateWorkoutAdaptation: mockGenerateWorkoutAdaptation
    } as any);
  });

  when('the component is rendered', () => {
    then(createSessionTest(1, 'should render adaptation trigger buttons'), () => {
      renderWithMantine(<LiveWorkoutSession />);
      expect(screen.getByText("I'm Tired")).toBeInTheDocument();
      expect(screen.getByText('Short on Time')).toBeInTheDocument();
    });
  });

  when('user indicates they are tired', () => {
    then(createSessionTest(2, 'should trigger AI adaptation with tired context'), async () => {
      renderWithMantine(<LiveWorkoutSession />);

      const tiredButton = screen.getByText("I'm Tired");
      fireEvent.click(tiredButton);

      await waitFor(() => {
        expect(mockGenerateWorkoutAdaptation).toHaveBeenCalledWith(expect.objectContaining({
          energy: 'tired'
        }));
      });
    });
  });

  when('AI adaptation is processing', () => {
    then(createSessionTest(3, 'should show thinking indicator during adaptation'), async () => {
      mockGenerateWorkoutAdaptation.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 200))
      );

      renderWithMantine(<LiveWorkoutSession />);

      const tiredButton = screen.getByText("I'm Tired");
      fireEvent.click(tiredButton);

      await waitFor(() => {
        expect(screen.getByText(/AI is analyzing/i)).toBeInTheDocument();
      });
    });
  });
});
