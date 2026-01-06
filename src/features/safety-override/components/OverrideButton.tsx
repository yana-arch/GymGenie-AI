import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import type { AIRecommendation } from '../services/OverrideDetectionService';

interface OverrideButtonProps {
  recommendation: AIRecommendation;
  onOverride: (recommendation: AIRecommendation) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface TooltipProps {
  recommendation: AIRecommendation;
  show: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ recommendation, show }) => {
  if (!show) return null;

  return (
    <div
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 w-64"
      role="tooltip"
    >
      <div className="font-semibold mb-1">Recommendation Details</div>
      <div className="text-xs space-y-1">
        <div><strong>Exercise:</strong> {recommendation.exerciseName}</div>
        {recommendation.originalReps && recommendation.suggestedReps && (
          <div><strong>Reps:</strong> {recommendation.originalReps} → {recommendation.suggestedReps}</div>
        )}
        {recommendation.originalSets && recommendation.suggestedSets && (
          <div><strong>Sets:</strong> {recommendation.originalSets} → {recommendation.suggestedSets}</div>
        )}
        <div><strong>Reason:</strong> {recommendation.reasoning}</div>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
    </div>
  );
};

// Error boundary wrapper
const ErrorBoundary: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => {
  return (
    <div className="error-boundary-wrapper">
      {children}
    </div>
  );
};

export const OverrideButton: React.FC<OverrideButtonProps> = ({
  recommendation,
  onOverride,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleClick = useCallback(async () => {
    if (disabled || loading || isPressed) return;

    setIsPressed(true);
    setAriaLiveMessage('Processing override...');
    
    try {
      await onOverride(recommendation);
      setShowConfirmation(true);
      setAriaLiveMessage('AI recommendation overridden successfully');
      
      // Clear confirmation after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setShowConfirmation(false);
        setAriaLiveMessage('');
      }, 2000);
    } catch (error) {
      setAriaLiveMessage('Failed to override recommendation');
      console.error('Override failed:', error);
      
      // Error recovery: reset state safely
      setShowConfirmation(false);
      setIsPressed(false);
    } finally {
      // Reset pressed state after animation
      setTimeout(() => setIsPressed(false), 150);
    }
  }, [disabled, loading, isPressed, onOverride, recommendation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const tooltipId = `tooltip-${recommendation.id}`;
  const statusId = `status-${recommendation.id}`;

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300';
      default:
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const isDisabled = disabled || loading;
  const buttonClasses = `
    relative font-medium rounded-lg border
    transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
    ${loading ? 'opacity-75' : ''}
    hover:scale-105 active:scale-95
    ${isPressed ? 'scale-95' : ''}
    ${showConfirmation ? 'bg-green-500 border-green-500 text-white' : ''}
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `;

  return (
    <ErrorBoundary fallback={<div className="text-red-500 text-sm">Override button unavailable</div>}>
      <div className="relative inline-block">
        <Tooltip
          recommendation={recommendation}
          show={showTooltip && !isDisabled}
        />
        
        <button
          className={buttonClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={isDisabled}
          aria-label="Override AI recommendation"
          aria-describedby={showTooltip && !isDisabled ? tooltipId : undefined}
          aria-busy={loading}
          type="button"
        >
          {loading ? (
            <Loader2 data-testid="loading-spinner" className="w-4 h-4 animate-spin" />
          ) : showConfirmation ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          
          <span className="ml-2">
            {loading ? 'Processing...' : showConfirmation ? 'Overridden' : 'Override'}
          </span>
        </button>

        {/* Screen reader announcements */}
        <div
          id={statusId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {ariaLiveMessage}
        </div>
      </div>
    </ErrorBoundary>
  );
};