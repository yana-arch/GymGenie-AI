import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  selectFeedbackImpacts,
  selectFeedbackHistory
} from '../store/feedbackPersonalizationSlice';
import { FeedbackImpact, FeedbackData } from '../types/feedbackPersonalization.types';
import { useAppSelector } from '@/store';

interface FeedbackImpactVisualizerProps {
  exerciseId?: string;
  className?: string;
}

interface ImpactAnalysis {
  totalImpacts: number;
  averageConfidence: number;
  highConfidenceImpacts: number;
  weightChanges: Array<{ date: string; change: number; confidence: number }>;
  repsChanges: Array<{ date: string; change: number; confidence: number }>;
  reasoningPatterns: Record<string, number>;
}

export const FeedbackImpactVisualizer: React.FC<FeedbackImpactVisualizerProps> = ({
  exerciseId,
  className = ''
}) => {
  const feedbackImpacts = useAppSelector(selectFeedbackImpacts);
  const feedbackHistory = useAppSelector(selectFeedbackHistory);

  // Analyze impacts for visualization
  const impactAnalysis: ImpactAnalysis = useMemo(() => {
    const filteredImpacts = exerciseId
      ? feedbackImpacts.filter(impact => impact.recommendationId.includes(exerciseId))
      : feedbackImpacts;

    const totalImpacts = filteredImpacts.length;
    const averageConfidence = totalImpacts > 0 
      ? filteredImpacts.reduce((sum, impact) => sum + impact.confidence, 0) / totalImpacts
      : 0;
    
    const highConfidenceImpacts = filteredImpacts.filter(impact => impact.confidence >= 0.8).length;

    const weightChanges = filteredImpacts.map(impact => ({
      date: new Date().toISOString().split('T')[0],
      change: impact.adjustedWeight - impact.originalWeight,
      confidence: impact.confidence
    }));

    const repsChanges = filteredImpacts.map(impact => ({
      date: new Date().toISOString().split('T')[0],
      change: impact.adjustedReps - impact.originalReps,
      confidence: impact.confidence
    }));

    // Analyze reasoning patterns
    const reasoningPatterns: Record<string, number> = {};
    filteredImpacts.forEach(impact => {
      impact.reasoning.forEach(reason => {
        const key = reason.toLowerCase().split(' ')[0]; // Use first word as key
        reasoningPatterns[key] = (reasoningPatterns[key] || 0) + 1;
      });
    });

    return {
      totalImpacts,
      averageConfidence,
      highConfidenceImpacts,
      weightChanges,
      repsChanges,
      reasoningPatterns
    };
  }, [feedbackImpacts, exerciseId]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getChangeIndicator = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number): string => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  };

  if (impactAnalysis.totalImpacts === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No Impact Data Available</div>
          <p className="text-gray-400">Submit feedback to see how it influences recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback Impact Analysis</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Impacts</h3>
            <p className="text-2xl font-bold text-gray-900">{impactAnalysis.totalImpacts}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Confidence</h3>
            <p className={`text-2xl font-bold ${getConfidenceColor(impactAnalysis.averageConfidence).split(' ')[0]}`}>
              {(impactAnalysis.averageConfidence * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">High Confidence</h3>
            <p className="text-2xl font-bold text-green-600">{impactAnalysis.highConfidenceImpacts}</p>
          </div>
        </div>

        {/* Weight Changes */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Weight Adjustments</h3>
          <div className="space-y-2">
            {impactAnalysis.weightChanges.slice(-5).reverse().map((change, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{change.date}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getChangeIndicator(change.change)}`}>
                    {getChangeIcon(change.change)} {Math.abs(change.change).toFixed(1)}kg
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(change.confidence)}`}>
                    {Math.round(change.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reps Changes */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Reps Adjustments</h3>
          <div className="space-y-2">
            {impactAnalysis.repsChanges.slice(-5).reverse().map((change, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{change.date}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getChangeIndicator(change.change)}`}>
                    {getChangeIcon(change.change)} {change.change} reps
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(change.confidence)}`}>
                    {Math.round(change.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning Patterns */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Common Reasoning Patterns</h3>
          <div className="space-y-2">
            {Object.entries(impactAnalysis.reasoningPatterns).slice(0, 5).map(([pattern, count]) => (
              <div key={pattern} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700 capitalize">{pattern}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {count} times
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Impacts */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Impact Details</h3>
          <div className="space-y-3">
            {feedbackImpacts.slice(-3).reverse().map((impact, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">Recommendation {impact.recommendationId}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(impact.confidence)}`}>
                    {Math.round(impact.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Weight: <span className={getChangeIndicator(impact.adjustedWeight - impact.originalWeight)}>
                      {impact.originalWeight}kg → {impact.adjustedWeight}kg
                    </span>
                  </div>
                  <div>
                    Reps: <span className={getChangeIndicator(impact.adjustedReps - impact.originalReps)}>
                      {impact.originalReps} → {impact.adjustedReps}
                    </span>
                  </div>
                  {impact.reasoning.length > 0 && (
                    <div className="text-xs text-gray-500 italic mt-2">
                      {impact.reasoning.join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Sources: {impact.feedbackSources.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};