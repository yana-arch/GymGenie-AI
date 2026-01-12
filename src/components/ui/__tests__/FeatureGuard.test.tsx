import React from 'react';
import { render, screen } from '../../../../test/test-utils';
import FeatureGuard from '../FeatureGuard';
import { describe, it, expect } from 'vitest';

describe('FeatureGuard', () => {
  const Child = () => <div data-testid="child">Enabled Content</div>;
  const Fallback = () => <div data-testid="fallback">Fallback Content</div>;

  it('renders children when feature is enabled and service is healthy', () => {
    const preloadedState = {
      featureFlags: {
        enableAI: true,
        serviceStatus: 'available' as const,
      } as any
    };

    render(
      <FeatureGuard feature="enableAI">
        <Child />
      </FeatureGuard>,
      { preloadedState }
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('renders fallback when feature is disabled', () => {
    const preloadedState = {
      featureFlags: {
        enableAI: false,
        serviceStatus: 'available' as const,
      } as any
    };

    render(
      <FeatureGuard feature="enableAI" fallback={<Fallback />}>
        <Child />
      </FeatureGuard>,
      { preloadedState }
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders fallback for AI feature when service is degraded', () => {
    const preloadedState = {
      featureFlags: {
        enableAI: true,
        serviceStatus: 'degraded' as const,
      } as any
    };

    render(
      <FeatureGuard feature="enableAI" fallback={<Fallback />}>
        <Child />
      </FeatureGuard>,
      { preloadedState }
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders fallback for AI feature when service is offline', () => {
    const preloadedState = {
      featureFlags: {
        enableAI: true,
        serviceStatus: 'offline' as const,
      } as any
    };

    render(
      <FeatureGuard feature="enableAI" fallback={<Fallback />}>
        <Child />
      </FeatureGuard>,
      { preloadedState }
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders children for non-AI feature even if service is degraded', () => {
    const preloadedState = {
      featureFlags: {
        debugMode: true,
        serviceStatus: 'degraded' as const,
      } as any
    };

    render(
      <FeatureGuard feature="debugMode" fallback={<Fallback />}>
        <Child />
      </FeatureGuard>,
      { preloadedState }
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });
});
