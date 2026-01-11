import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import AISettings from './AISettings';
import { MantineProvider } from '@mantine/core';

// Mock toggleFeature action
const mockToggleFeature = vi.fn((feature) => ({ type: 'featureFlags/toggleFeature', payload: feature }));

// Mock setFeature action
const mockSetFeature = vi.fn((payload) => ({ type: 'featureFlags/setFeature', payload }));

const createMockStore = (flags: any) => {
  const featureFlagSlice = createSlice({
    name: 'featureFlags',
    initialState: flags,
    reducers: {
      toggleFeature: (state, action) => {
        mockToggleFeature(action.payload);
      },
      setFeature: (state, action) => {
        mockSetFeature(action.payload);
      }
    },
  });

  return configureStore({
    reducer: {
      featureFlags: featureFlagSlice.reducer,
    },
  });
};

describe('AISettings', () => {
  it('should render all feature toggles @p0', () => {
    const store = createMockStore({
      enableCoaching: false,
      enablePersonalization: false,
      enableAnalytics: false,
      enableFormCorrection: false,
      enableInjuryAwareness: false
    });

    render(
      <MantineProvider>
        <Provider store={store}>
          <AISettings />
        </Provider>
      </MantineProvider>
    );

    expect(screen.getByText('AI Features')).toBeDefined();
    expect(screen.getAllByText('AI Coaching')).toBeDefined();
    expect(screen.getAllByText('Personalization')).toBeDefined();
    expect(screen.getAllByText('Analytics')).toBeDefined();
    expect(screen.getByText('AI Form Guard')).toBeDefined();
    expect(screen.getByText('Injury Awareness')).toBeDefined();
  });

  it('should show onboarding banner when all AI is off @p1', () => {
    const store = createMockStore({
      enableCoaching: false,
      enablePersonalization: false,
      enableAnalytics: false,
      enableFormCorrection: false,
      enableInjuryAwareness: false
    });

    render(
      <MantineProvider>
        <Provider store={store}>
          <AISettings />
        </Provider>
      </MantineProvider>
    );

    expect(screen.getByText('Experience GymGenie AI')).toBeDefined();
    expect(screen.getByText('Enable All AI Features')).toBeDefined();
  });

  it('should dispatch setFeature for all flags when Enable All is clicked @p0', () => {
    const store = createMockStore({
      enableCoaching: false,
      enablePersonalization: false,
      enableAnalytics: false,
      enableFormCorrection: false,
      enableInjuryAwareness: false
    });

    render(
      <MantineProvider>
        <Provider store={store}>
          <AISettings />
        </Provider>
      </MantineProvider>
    );

    const enableAllBtn = screen.getByText('Enable All AI Features');
    fireEvent.click(enableAllBtn);

    expect(mockSetFeature).toHaveBeenCalledWith({ feature: 'enableCoaching', enabled: true });
    expect(mockSetFeature).toHaveBeenCalledWith({ feature: 'enablePersonalization', enabled: true });
  });

  it('should dispatch toggle action when a switch is clicked @p1', () => {
    const store = createMockStore({
      enableCoaching: false,
      enablePersonalization: false,
      enableAnalytics: false
    });

    render(
      <MantineProvider>
        <Provider store={store}>
          <AISettings />
        </Provider>
      </MantineProvider>
    );

    const coachingSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(coachingSwitch);

    expect(mockToggleFeature).toHaveBeenCalledWith('enableCoaching');
  });
});

