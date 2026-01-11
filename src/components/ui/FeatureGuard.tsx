import React from 'react';
import { useAppSelector } from '@/store';
import { RootState } from '@/store';

interface FeatureGuardProps {
  feature: keyof RootState['featureFlags'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * FeatureGuard conditionally renders children based on the provided feature flag.
 * If the feature is enabled, children are rendered. Otherwise, the fallback (or null) is rendered.
 */
const FeatureGuard: React.FC<FeatureGuardProps> = ({ feature, children, fallback = null }) => {
  const isEnabled = useAppSelector((state) => state.featureFlags[feature]);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default React.memo(FeatureGuard);
