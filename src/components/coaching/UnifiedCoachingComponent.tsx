/**
 * Unified Coaching Component
 * Displays integrated AI coaching decisions with priority visualization
 * WCAG Level AA compliant
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Activity, Shield, Heart, TrendingUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  selectCurrentDecision,
  selectCoachingSession,
  selectCoachingMetrics,
  startCoachingSession,
  endCoachingSession,
  setCoachingDecision,
  emergencyStop
} from '../../store/unifiedCoachingSlice';
import {
  CoachingDecision,
  CoachingPriority,
  UnifiedCoachingState
} from '../../features/unified-coaching/types/unifiedCoaching.types';
import { aiCoachingOrchestrator } from '../../features/unified-coaching';
import { CoachingPriorityDisplay } from './CoachingPriorityDisplay';
import { CoachingHistory } from './CoachingHistory';

interface UnifiedCoachingComponentProps {
  className?: string;
  liveSession?: any;
  formCorrection?: any;
  safetyOverride?: any;
  injuryAware?: any;
}

export const UnifiedCoachingComponent: React.FC<UnifiedCoachingComponentProps> = ({
  className = '',
  liveSession,
  formCorrection,
  safetyOverride,
  injuryAware
}) => {
  const dispatch = useAppDispatch();
  const currentDecision = useAppSelector(selectCurrentDecision);
  const session = useAppSelector(selectCoachingSession);
  const metrics = useAppSelector(selectCoachingMetrics);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Start coaching session when component mounts with data
  useEffect(() => {
    if (liveSession || formCorrection || safetyOverride || injuryAware) {
      dispatch(startCoachingSession());
    }
    
    return () => {
      dispatch(endCoachingSession());
    };
  }, [dispatch, liveSession, formCorrection, safetyOverride, injuryAware]);

  // Process coaching whenever input data changes
  useEffect(() => {
    const processCoaching = async () => {
      if (!liveSession || !formCorrection || !safetyOverride || !injuryAware) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const decision = await aiCoachingOrchestrator.processIntegratedCoaching({
          liveSession,
          formCorrection,
          safetyOverride,
          injuryAware
        });

        dispatch(setCoachingDecision(decision));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown coaching error';
        
        // Provide user-friendly error messages
        const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
        setError(userFriendlyMessage);
        console.error('Coaching processing error:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    processCoaching();
  }, [dispatch, liveSession, formCorrection, safetyOverride, injuryAware]);

  // Get priority icon and color
  const getPriorityInfo = (priority: CoachingPriority) => {
    switch (priority) {
      case CoachingPriority.SAFETY:
        return {
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          label: 'Safety Priority'
        };
      case CoachingPriority.INJURY:
        return {
          icon: Heart,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          label: 'Injury Prevention'
        };
      case CoachingPriority.FORM:
        return {
          icon: Activity,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          label: 'Form Correction'
        };
      case CoachingPriority.ADAPTATION:
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          label: 'Performance Adaptation'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          label: 'Unknown Priority'
        };
    }
  };

  const handleEmergencyStop = () => {
    dispatch(emergencyStop());
  };

  const getUserFriendlyErrorMessage = (errorMessage: string): string => {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'Network error': 'Connection issue - please check your internet connection',
      'Timeout exceeded': 'AI processing is taking longer than usual',
      'AI service unavailable': 'AI coaching is temporarily unavailable',
      'Invalid recommendation format': 'Coaching data format error',
      'TensorFlow.js loading error': 'AI models are loading, please wait',
      'MediaPipe pose error': 'Movement analysis is temporarily unavailable',
      'Default coaching decision': 'Basic coaching mode active'
    };

    // Find matching error or return generic message
    const matchedMessage = Object.keys(errorMap).find(key => 
      errorMessage.toLowerCase().includes(key.toLowerCase())
    );

    return matchedMessage ? errorMap[matchedMessage] : 
      'AI coaching experienced an issue - please try again';
  };



  if (!session.isActive) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-600">
          <AlertCircle className="h-5 w-5" />
          <span>AI Coaching is inactive</span>
        </div>
      </div>
    );
  }

  const priorityInfo = currentDecision ? getPriorityInfo(currentDecision.priority) : null;
  const PriorityIcon = priorityInfo?.icon || AlertCircle;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Coaching Display */}
      <div 
        className={`p-4 rounded-lg border-2 ${priorityInfo?.bgColor} ${priorityInfo?.borderColor}`}
        role="region"
        aria-label={`Current coaching decision: ${priorityInfo?.label || 'No active coaching'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <PriorityIcon 
              className={`h-6 w-6 ${priorityInfo?.color}`}
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-lg">
                {priorityInfo?.label || 'AI Coaching'}
              </h2>
              {currentDecision?.metadata && (
                <p className="text-sm text-gray-600">
                  Processing time: {currentDecision.metadata.processingTime.toFixed(0)}ms
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <div 
                className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"
                role="status"
                aria-label="Processing coaching decision"
              />
            )}
            
            <button
              onClick={handleEmergencyStop}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Emergency stop coaching"
            >
              Emergency Stop
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="p-3 bg-red-50 border border-red-200 rounded-md mb-3"
            role="alert"
          >
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Current Decision */}
        {currentDecision && (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-md border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                Current Recommendation
              </h3>
              <div className="text-gray-700">
                {typeof currentDecision.response.recommendation === 'object' && 
                 currentDecision.response.recommendation.message ? (
                  <p>{currentDecision.response.recommendation.message}</p>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(currentDecision.response.recommendation, null, 2)}
                  </pre>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Confidence: {(currentDecision.response.confidence * 100).toFixed(1)}%</span>
                <span>Systems considered: {currentDecision.metadata.systemsConsidered}</span>
              </div>
            </div>

            {/* Priority and Conflict Info */}
            <CoachingPriorityDisplay 
              decision={currentDecision}
              priorityInfo={priorityInfo}
            />
          </div>
        )}

        {/* No Decision State */}
        {!currentDecision && !isProcessing && !error && (
          <div className="text-center py-4 text-gray-600">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active coaching recommendations</p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="font-medium text-gray-700">Avg Time</div>
            <div className="text-gray-900">{metrics.averageProcessingTime.toFixed(0)}ms</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Total Decisions</div>
            <div className="text-gray-900">{metrics.decisionCount}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Conflicts</div>
            <div className="text-gray-900">{metrics.conflictCount}</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Session Time</div>
            <div className="text-gray-900">
              {session.sessionStartTime ? 
                Math.floor((Date.now() - session.sessionStartTime) / 1000 / 60) : 0
              }m
            </div>
          </div>
        </div>
      </div>

      {/* History Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Coaching History</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-blue-600 hover:text-blue-800 text-sm focus:outline-none focus:underline"
          aria-expanded={showHistory}
          aria-controls="coaching-history"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Coaching History */}
      {showHistory && (
        <div id="coaching-history">
          <CoachingHistory />
        </div>
      )}
    </div>
  );
};