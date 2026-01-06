import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OverrideHistory } from '../components/OverrideHistory';
import safetyOverrideReducer, { 
  addOverrideEvent,
  clearOverrideHistory,
  setLoading,
  setError 
} from '../store/safetyOverrideSlice';
import type { OverrideEvent } from '../services/OverrideDetectionService';

// Mock data for testing
const mockOverrideEvents: OverrideEvent[] = [
  {
    id: 'override_1',
    recommendationId: 'rec_1',
    userAction: 'disagree',
    interactionMethod: 'one_tap',
    timestamp: Date.now() - 3600000, // 1 hour ago
    context: {
      energyLevel: 'tired' as const,
      timeRemaining: 1200,
      equipmentAvailable: ['dumbbells']
    },
    processingTime: 245
  },
  {
    id: 'override_2',
    recommendationId: 'rec_2',
    userAction: 'override_tap',
    interactionMethod: 'one_tap',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    context: {
      energyLevel: 'normal',
      timeRemaining: 900,
      equipmentAvailable: ['barbell']
    },
    processingTime: 189
  },
  {
    id: 'override_3',
    recommendationId: 'rec_3',
    userAction: 'skip_exercise',
    interactionMethod: 'menu_selection',
    timestamp: Date.now() - 900000, // 15 minutes ago
    context: {
      energyLevel: 'tired',
      timeRemaining: 600,
      equipmentAvailable: ['bodyweight']
    },
    processingTime: 312
  }
];

// Test store setup
function createTestStore(initialOverrides: OverrideEvent[] = []) {
  return configureStore({
    reducer: {
      safetyOverride: safetyOverrideReducer
    },
    preloadedState: {
      safetyOverride: {
        isMonitoring: false,
        currentRecommendations: [],
        overrideHistory: initialOverrides,
        pendingOverrides: {},
        lastProcessingTime: 0,
        averageProcessingTime: 0,
        totalOverrides: initialOverrides.length,
        error: null,
        isLoading: false
      }
    }
  });
}

// Test wrapper component
function TestWrapper({ children, overrides = [] }: { children: React.ReactNode; overrides?: OverrideEvent[] }) {
  const store = createTestStore(overrides);
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}

describe('OverrideHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the override history interface', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Override History')).toBeInTheDocument();
      expect(screen.getByText('Total Overrides: 3')).toBeInTheDocument();
    });

    it('should display empty state when no overrides exist', () => {
      render(
        <TestWrapper>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('No overrides recorded yet')).toBeInTheDocument();
      expect(screen.getByText('As you interact with AI recommendations, your override history will appear here')).toBeInTheDocument();
    });

    it('should render override entries correctly', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      // Check that override events are displayed
      expect(screen.getByText('disagree')).toBeInTheDocument();
      expect(screen.getByText('override_tap')).toBeInTheDocument();
      expect(screen.getByText('skip_exercise')).toBeInTheDocument();
      
      // Check interaction methods
      expect(screen.getByText('One-tap override')).toBeInTheDocument();
      expect(screen.getByText('Menu selection')).toBeInTheDocument();
    });

    it('should display timestamps in readable format', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      // Should show relative timestamps
      expect(screen.getByText(/hour/)).toBeInTheDocument();
      expect(screen.getByText(/minutes? ago/)).toBeInTheDocument();
    });
  });

  describe('Trend Analysis', () => {
    it('should display override trends and insights', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Override Trends')).toBeInTheDocument();
      expect(screen.getByText('Most Common Action: disagree')).toBeInTheDocument();
      expect(screen.getByText('Average Processing Time: 249ms')).toBeInTheDocument();
    });

    it('should show energy level insights', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Energy Level Patterns')).toBeInTheDocument();
      expect(screen.getByText('When tired: 2 overrides')).toBeInTheDocument();
      expect(screen.getByText('When normal: 1 override')).toBeInTheDocument();
    });

    it('should display interaction method breakdown', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Interaction Methods')).toBeInTheDocument();
      expect(screen.getByText('One-tap: 2 overrides')).toBeInTheDocument();
      expect(screen.getByText('Menu selection: 1 override')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should provide filter options', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Filter by Action')).toBeInTheDocument();
      expect(screen.getByText('Filter by Method')).toBeInTheDocument();
      expect(screen.getByText('Filter by Energy Level')).toBeInTheDocument();
    });

    it('should provide search functionality', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search override history...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter overrides by action type', async () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const actionFilter = screen.getByDisplayValue('All Actions');
      fireEvent.change(actionFilter, { target: { value: 'disagree' } });

      await waitFor(() => {
        expect(screen.queryByText('override_tap')).not.toBeInTheDocument();
        expect(screen.queryByText('skip_exercise')).not.toBeInTheDocument();
        expect(screen.getByText('disagree')).toBeInTheDocument();
      });
    });

    it('should search override history', async () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search override history...');
      fireEvent.change(searchInput, { target: { value: 'tired' } });

      await waitFor(() => {
        // Should only show overrides where context includes 'tired' energy level
        expect(screen.getAllByText('tired').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Clear History', () => {
    it('should provide clear history functionality', () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      expect(screen.getByText('Clear History')).toBeInTheDocument();
    });

    it('should show confirmation dialog when clearing history', async () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const clearButton = screen.getByText('Clear History');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Clear Override History?')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone. All override history will be permanently deleted.')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Clear History')).toBeInTheDocument(); // Confirmation button
      });
    });

    it('should clear history when confirmed', async () => {
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const clearButton = screen.getByText('Clear History');
      fireEvent.click(clearButton);

      const confirmButton = screen.getAllByText('Clear History')[1]; // Second one is in dialog
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('No overrides recorded yet')).toBeInTheDocument();
        expect(screen.queryByText('disagree')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      const store = configureStore({
        reducer: {
          safetyOverride: safetyOverrideReducer
        },
        preloadedState: {
          safetyOverride: {
            isMonitoring: false,
            currentRecommendations: [],
            overrideHistory: mockOverrideEvents,
            pendingOverrides: {},
            lastProcessingTime: 0,
            averageProcessingTime: 0,
            totalOverrides: 3,
            error: null,
            isLoading: true
          }
        }
      });

      render(
        <Provider store={store}>
          <OverrideHistory />
        </Provider>
      );

      expect(screen.getByText('Loading override history...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const store = configureStore({
        reducer: {
          safetyOverride: safetyOverrideReducer
        },
        preloadedState: {
          safetyOverride: {
            isMonitoring: false,
            currentRecommendations: [],
            overrideHistory: mockOverrideEvents,
            pendingOverrides: {},
            lastProcessingTime: 0,
            averageProcessingTime: 0,
            totalOverrides: 3,
            error: 'Failed to load override history',
            isLoading: false
          }
        }
      });

      render(
        <Provider store={store}>
          <OverrideHistory />
        </Provider>
      );

      expect(screen.getByText('Error loading override history')).toBeInTheDocument();
      expect(screen.getByText('Failed to load override history')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Performance Requirements', () => {
    it('should render within performance requirements', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper overrides={mockOverrideEvents}>
          <OverrideHistory />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 100ms for good user experience
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large override history efficiently', () => {
      // Create 1000 mock override events
      const largeOverrideHistory = Array.from({ length: 1000 }, (_, index) => ({
        id: `override_${index}`,
        recommendationId: `rec_${index}`,
        userAction: ['disagree', 'override_tap', 'skip_exercise'][index % 3] as OverrideEvent['userAction'],
        interactionMethod: ['one_tap', 'menu_selection'][index % 2] as OverrideEvent['interactionMethod'],
        timestamp: Date.now() - (index * 60000), // 1 minute apart
        context: {
          energyLevel: ['normal', 'tired'][index % 2] as OverrideEvent['context']['energyLevel'],
          timeRemaining: 1200 - (index % 600),
          equipmentAvailable: [['dumbbells'], ['barbell'], ['bodyweight']][index % 3]
        },
        processingTime: 200 + (index % 200)
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper overrides={largeOverrideHistory}>
          <OverrideHistory />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render quickly even with large history
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByText('Total Overrides: 1000')).toBeInTheDocument();
    });
  });
});