import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import LiveWorkoutSession from '@/features/session/components/LiveWorkoutSession';
import { useApp } from '../src/context/AppContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock context
vi.mock('../src/context/AppContext', async (importOriginal) => {
  const actual = await vi.importActual('../src/context/AppContext');
  return {
    ...actual,
    useApp: vi.fn(),
  };
});

// Mock child components
vi.mock('@/features/workout/components/RestTimer', () => ({
  default: () => <div data-testid="rest-timer">Rest Timer</div>,
}));

describe('LiveWorkoutSession', () => {
  const mockSessionManager = {
    completeSession: vi.fn(),
  };

  const mockLogWorkout = vi.fn();
  const mockSetStep = vi.fn();
  const mockStartRestTimer = vi.fn();

  const mockCurrentPlan = {
    weeks: [
      {
        id: 'week1',
        days: [
          {
            id: 'day1',
            title: 'Test Workout',
            exercises: [
              {
                id: 'ex1',
                name: 'Push Ups',
                sets: 3,
                reps: '10',
                restSeconds: 60,
              },
            ],
          },
        ],
      },
    ],
  };

  const mockCurrentSession = {
    id: 'session1',
    weekId: 'week1',
    dayId: 'day1',
    startTime: Date.now() - 600000, // 10 mins ago
    state: 'active',
    exerciseData: {},
    completedExercises: 0,
    totalExercises: 1,
    isReadOnly: false,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    timestamp: Date.now(),
    completedTime: null as number | null,
    loggedTime: null as number | null,
    exerciseTimestamps: {},
    estimatedDuration: 30,
    actualDuration: null as number | null,
    environment: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue({
      currentPlan: mockCurrentPlan,
      currentSession: mockCurrentSession,
      sessionManager: mockSessionManager,
      logWorkout: mockLogWorkout,
      setStep: mockSetStep,
      timerSeconds: 0,
      startRestTimer: mockStartRestTimer,
      stopRestTimer: vi.fn(),
    });
  });

  it('renders correctly with active session', () => {
    render(<LiveWorkoutSession />);
    expect(screen.getByText('Test Workout')).toBeInTheDocument();
    expect(screen.getByText('Push Ups')).toBeInTheDocument();
  });

  it('shows logging modal when finish button is clicked', async () => {
    render(<LiveWorkoutSession />);
    
    // Find and click finish button
    const finishButton = screen.getByText('Finish');
    fireEvent.click(finishButton);

    // Check if completeSession was called
    expect(mockSessionManager.completeSession).toHaveBeenCalled();

    // Check if modal appears
    await waitFor(() => {
      expect(screen.getByText('Workout Complete!')).toBeInTheDocument();
    });
    
    // Check if duration is displayed
    expect(screen.getByText('10 Minutes')).toBeInTheDocument();
  });

  it('submits log and navigates to dashboard', async () => {
    render(<LiveWorkoutSession />);
    
    // Open modal
    fireEvent.click(screen.getByText('Finish'));
    await waitFor(() => screen.getByText('Workout Complete!'));

    // Adjust RPE (optional, but good to test interaction)
    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '8' } });

    // Click Save & Finish
    const saveButton = screen.getByText('Save & Finish');
    fireEvent.click(saveButton);

    // Verify logWorkout called with correct params
    await waitFor(() => {
      expect(mockLogWorkout).toHaveBeenCalledWith('week1', 'day1', 8, expect.any(Object));
    });

    // Verify navigation
    expect(mockSetStep).toHaveBeenCalledWith('dashboard');
  });
});
