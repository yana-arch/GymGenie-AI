import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdaptationPrompt } from '@/features/session/components/AdaptationPrompt';
import { ThinkingIndicator } from '@/features/session/components/ThinkingIndicator';

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

const mockAdaptation = {
  message: "Optimization suggested",
  modifications: {
    suggestedWeight: 40,
    suggestedReps: 8,
    suggestedSets: 3,
    suggestedRest: 90
  },
  reasoning: "general"
};

const renderWithMantine = (ui: React.ReactNode) => {
  return render(
    <MantineProvider>
      {ui}
    </MantineProvider>
  );
};

describe('AdaptationFeedback @smoke', () => {
  describe('ThinkingIndicator', () => {
    it('should render the thinking state with animation and accessibility attributes @p0', () => {
      renderWithMantine(<ThinkingIndicator visible={true} />);
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/AI is analyzing/i)).toBeInTheDocument();
    });
  });

  describe('AdaptationPrompt', () => {
    it('should render correct semantic icons and ARIA labels @p1', () => {
      const scenarios = [
        { reason: 'safety', label: 'Safety Alert' },
        { reason: 'performance', label: 'Performance Optimization' },
        { reason: 'form', label: 'Form Correction' },
        { reason: 'intensity', label: 'Intensity Adjustment' },
        { reason: 'time', label: 'Time Constraint' }
      ];

      scenarios.forEach(({ reason, label }) => {
        const adaptation = { 
          ...mockAdaptation, 
          reasoning: reason,
          message: `Reason: ${reason}` 
        };
        const { unmount } = renderWithMantine(
          <AdaptationPrompt 
            opened={true} 
            onClose={() => {}} 
            adaptation={adaptation as any} 
            onAccept={() => {}} 
            onManualOverride={() => {}} 
          />
        );
        
        // Find by aria-label
        const icon = document.querySelector(`svg[aria-label="${label}"]`);
        expect(icon).toBeTruthy();
        unmount();
      });
    });

    it('should display delta comparisons for weight and reps @p1', () => {
      renderWithMantine(
        <AdaptationPrompt 
          opened={true} 
          onClose={() => {}} 
          adaptation={mockAdaptation as any} 
          currentValues={{ weight: 45, reps: 10 }}
          onAccept={() => {}} 
          onManualOverride={() => {}} 
        />
      );

      expect(screen.getByText(/-5kg/)).toBeInTheDocument();
      expect(screen.getByText(/-2/)).toBeInTheDocument();
    });

    it('should trigger correct actions on button clicks @p1', () => {
      const onAccept = vi.fn();
      const onManualOverride = vi.fn();
      const onClose = vi.fn();

      renderWithMantine(
        <AdaptationPrompt 
          opened={true} 
          onClose={onClose} 
          adaptation={mockAdaptation as any} 
          onAccept={onAccept} 
          onManualOverride={onManualOverride} 
        />
      );

      fireEvent.click(screen.getByText(/Quick Accept/i));
      expect(onAccept).toHaveBeenCalled();

      fireEvent.click(screen.getByText(/Manual Override/i));
      expect(onManualOverride).toHaveBeenCalled();

      fireEvent.click(screen.getByText(/Ignore/i));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
