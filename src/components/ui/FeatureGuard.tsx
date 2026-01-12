import React from 'react';
import { useAppSelector } from '@/store';
import { RootState } from '@/store';

interface FeatureGuardProps {
  feature: keyof RootState['featureFlags'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AI_FEATURES: (keyof RootState['featureFlags'])[] = [
  'enableAI',
  'enableCoaching',
  'enablePersonalization',
  'enableAnalytics',
  'enableFormCorrection',
  'enableInjuryAwareness',
  'enableUnifiedCoaching'
];

/**
 * FeatureGuard conditionally renders children based on the provided feature flag.
 * If the feature is enabled, children are rendered. Otherwise, the fallback (or null) is rendered.
 */
const FeatureGuard: React.FC<FeatureGuardProps> = ({ feature, children, fallback = null }) => {
  const isEnabled = useAppSelector((state) => state.featureFlags[feature]);
  const serviceStatus = useAppSelector((state) => state.featureFlags.serviceStatus);

  // If the feature is an AI feature and service is not available, hide it
  const isAiFeature = AI_FEATURES.includes(feature);
  
  if (!isEnabled || (isAiFeature && serviceStatus !== 'available')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default React.memo(FeatureGuard);
