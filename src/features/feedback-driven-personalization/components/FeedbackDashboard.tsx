import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FeedbackImpact,
  FeedbackData,
  FeedbackType
} from '../types/feedbackPersonalization.types';
import {
  selectFeedbackHistory,
  selectFeedbackImpacts,
  feedbackPersonalizationActions
} from '../store/feedbackPersonalizationSlice';
import { useAppDispatch, useAppSelector } from '@/store';

interface FeedbackDashboardProps {
  exerciseId?: string;
  className?: string;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: Record<FeedbackType, number>;
  confidenceScore: number;
  lastFeedbackDate: string | null;
}

interface ImpactVisualization {
  totalImpacts: number;
  averageConfidence: number;
  weightChanges: Array<{ exerciseId: string; change: number; date: string }>;
  repsChanges: Array<{ exerciseId: string; change: number; date: string }>;
}

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({
  exerciseId,
  className = ''
}) => {
  const dispatch = useAppDispatch();
  const feedbackHistory = useAppSelector(selectFeedbackHistory);
  const feedbackImpacts = useAppSelector(selectFeedbackImpacts);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'impacts' | 'patterns'>('overview');

  // Calculate feedback statistics
  const feedbackStats: FeedbackStats = useMemo(() => {
    const filteredFeedback = exerciseId 
      ? feedbackHistory.filter(f => f.exerciseId === exerciseId)
      : feedbackHistory;

    if (filteredFeedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        feedbackByType: {} as Record<FeedbackType, number>,
        confidenceScore: 0,
        lastFeedbackDate: null
      };
    }

    const totalFeedback = filteredFeedback.length;
    const averageRating = filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
    
    const feedbackByType = filteredFeedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<FeedbackType, number>);

    const confidenceScore = filteredFeedback.reduce((sum, f) => {
      const baseConfidence = 0.5;
      let additionalConfidence = 0;

      if (f.context) additionalConfidence += Object.keys(f.context).length * 0.05;
      if (f.comments) additionalConfidence += f.comments.length > 10 ? 0.1 : 0;
      if (f.tags && f.tags.length > 0) additionalConfidence += 0.1;
      if (f.priority === 'high') additionalConfidence += 0.2;

      return sum + Math.min(baseConfidence + additionalConfidence, 1.0);
    }, 0) / totalFeedback;

    const lastFeedbackDate = filteredFeedback.length > 0 
      ? new Date(Math.max(...filteredFeedback.map(f => new Date(f.timestamp).getTime()))).toISOString()
      : null;

    return {
      totalFeedback,
      averageRating,
      feedbackByType,
      confidenceScore,
      lastFeedbackDate
    };
  }, [feedbackHistory, exerciseId]);

  // Calculate impact statistics
  const impactStats: ImpactVisualization = useMemo(() => {
    const filteredImpacts = exerciseId
      ? feedbackImpacts.filter(i => i.recommendationId.includes(exerciseId))
      : feedbackImpacts;

    const totalImpacts = filteredImpacts.length;
    const averageConfidence = totalImpacts > 0 
      ? filteredImpacts.reduce((sum, i) => sum + i.confidence, 0) / totalImpacts
      : 0;

    const weightChanges = filteredImpacts.map(i => ({
      exerciseId: i.recommendationId,
      change: i.adjustedWeight - i.originalWeight,
      date: new Date().toISOString().split('T')[0]
    }));

    const repsChanges = filteredImpacts.map(i => ({
      exerciseId: i.recommendationId,
      change: i.adjustedReps - i.originalReps,
      date: new Date().toISOString().split('T')[0]
    }));

    return {
      totalImpacts,
      averageConfidence,
      weightChanges,
      repsChanges
    };
  }, [feedbackImpacts, exerciseId]);

  const getFeedbackTypeLabel = (type: FeedbackType): string => {
    const labels = {
      [FeedbackType.DIFFICULTY_RATING]: 'Difficulty',
      [FeedbackType.ENERGY_LEVEL]: 'Energy',
      [FeedbackType.COMFORT_LEVEL]: 'Comfort',
      [FeedbackType.PAIN_FEEDBACK]: 'Pain',
      [FeedbackType.TECHNIQUE_FEEDBACK]: 'Technique',
      [FeedbackType.MOTIVATION_LEVEL]: 'Motivation'
    };
    return labels[type] || type;
  };

  const getRatingColor = (rating: number): string => {
    if (rating <= 2) return 'text-red-600';
    if (rating <= 3) return 'text-yellow-600';
    if (rating <= 4) return 'text-blue-600';
    return 'text-green-600';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const clearFeedbackHistory = () => {
    dispatch(feedbackPersonalizationActions.clearHistory());
  };

  const exportFeedbackData = () => {
    const dataToExport = {
      feedbackHistory: feedbackStats.totalFeedback > 0 ? feedbackHistory : [],
      impacts: impactStats.totalImpacts > 0 ? feedbackImpacts : [],
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (feedbackStats.totalFeedback === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No Feedback Data Available</div>
          <p className="text-gray-400">Start collecting feedback to see your personalization insights here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback Dashboard</h2>
        
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          {(['overview', 'impacts', 'patterns'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Feedback</h3>
              <p className="text-2xl font-bold text-gray-900">{feedbackStats.totalFeedback}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Average Rating</h3>
              <p className={`text-2xl font-bold ${getRatingColor(feedbackStats.averageRating)}`}>
                {feedbackStats.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Confidence Score</h3>
              <p className={`text-2xl font-bold ${getConfidenceColor(feedbackStats.confidenceScore)}`}>
                {(feedbackStats.confidenceScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Feedback by Type */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback by Type</h3>
            <div className="space-y-2">
              {Object.entries(feedbackStats.feedbackByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{getFeedbackTypeLabel(type as FeedbackType)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(count / feedbackStats.totalFeedback) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {feedbackStats.lastFeedbackDate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
              <p className="text-gray-700">
                Last feedback: {new Date(feedbackStats.lastFeedbackDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'impacts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Impacts</h3>
              <p className="text-2xl font-bold text-gray-900">{impactStats.totalImpacts}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Average Confidence</h3>
              <p className={`text-2xl font-bold ${getConfidenceColor(impactStats.averageConfidence)}`}>
                {(impactStats.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Impact Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Impacts</h3>
            {impactStats.totalImpacts > 0 ? (
              <div className="space-y-3">
                {feedbackImpacts.slice(0, 5).map((impact, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">Recommendation {impact.recommendationId}</span>
                      <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(impact.confidence)}`}>
                        {Math.round(impact.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Weight: {impact.originalWeight} → {impact.adjustedWeight}</div>
                      <div>Reps: {impact.originalReps} → {impact.adjustedReps}</div>
                      {impact.reasoning.length > 0 && (
                        <div className="text-xs text-gray-500 italic">
                          {impact.reasoning.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No feedback impacts recorded yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Pattern Analysis</h3>
            <p className="text-blue-800">
              Feedback patterns and trends analysis will appear here as more data is collected.
              This helps identify long-term improvements and areas needing attention.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Insights</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Track consistency in feedback over time</li>
              <li>Identify which exercises need most adjustment</li>
              <li>Monitor confidence levels to ensure quality feedback</li>
              <li>Look for correlations between different feedback types</li>
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 pt-6 border-t flex gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        <button
          onClick={exportFeedbackData}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Export Data
        </button>
        <button
          onClick={clearFeedbackHistory}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-6 pt-6 border-t">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Detailed Feedback</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {feedbackHistory.slice(-10).reverse().map((feedback, index) => (
                <div key={feedback.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">{getFeedbackTypeLabel(feedback.type)}</span>
                    <span className="text-sm text-gray-500">{new Date(feedback.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Rating: <span className={getRatingColor(feedback.rating)}>{feedback.rating}/5</span>
                    {feedback.priority && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {feedback.priority}
                      </span>
                    )}
                  </div>
                  {feedback.comments && (
                    <div className="text-sm text-gray-600 italic">"{feedback.comments}"</div>
                  )}
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {feedback.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};