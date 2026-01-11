import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import FeatureGuard from './FeatureGuard';

// Create a minimal store for this test to avoid the heavy renderWithProviders
const createMinimalStore = (flags: any) => {
  const featureFlagSlice = createSlice({
    name: 'featureFlags',
    initialState: flags,
    reducers: {},
  });

  return configureStore({
    reducer: {
      featureFlags: featureFlagSlice.reducer,
    },
  });
};

describe('FeatureGuard', () => {
  it('should render children when feature is enabled @p0', () => {
    const store = createMinimalStore({ enableCoaching: true });
    render(
      <Provider store={store}>
        <FeatureGuard feature="enableCoaching">
          <div data-testid="child">Enabled Content</div>
        </FeatureGuard>
      </Provider>
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByText('Enabled Content')).toBeDefined();
  });

  it('should NOT render children when feature is disabled @p0', () => {
    const store = createMinimalStore({ enableCoaching: false });
    render(
      <Provider store={store}>
        <FeatureGuard feature="enableCoaching">
          <div data-testid="child">Enabled Content</div>
        </FeatureGuard>
      </Provider>
    );

    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('should render fallback when feature is disabled and fallback provided @p1', () => {
    const store = createMinimalStore({ enableCoaching: false });
    render(
      <Provider store={store}>
        <FeatureGuard 
          feature="enableCoaching" 
          fallback={<div data-testid="fallback">Disabled Content</div>}
        >
          <div data-testid="child">Enabled Content</div>
        </FeatureGuard>
      </Provider>
    );

    expect(screen.queryByTestId('child')).toBeNull();
    expect(screen.getByTestId('fallback')).toBeDefined();
  });
});

