/**
 * Preference Transparency View Component
 * Shows what preferences the AI has learned about the user
 */

import React, { useState, useEffect } from 'react';
import type { PreferencePattern, PreferenceType } from '../../features/preference-learning/types/preferenceLearning.types';

interface PreferenceTransparencyViewProps {
  userId: string;
  className?: string;
}

export const PreferenceTransparencyView: React.FC<PreferenceTransparencyViewProps> = ({
  userId,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<PreferencePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<PreferenceType>>(new Set());

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      // This would call the preference service
      // For now, using mock data
      const mockPreferences: PreferencePattern[] = [
        {
          id: 'pref-1',
          userId,
          patternType: 'exercise-selection',
          confidence: 0.85,
          strength: 0.78,
          firstDetected: new Date('2026-01-05'),
          lastConfirmed: new Date('2026-01-06'),
          confirmations: 15,
          contradictions: 1,
          data: {
            exercisePreferences: [
              { exerciseId: 'push-ups', preference: 'preferred', confidence: 0.9, contexts: ['main'] },
              { exerciseId: 'squats', preference: 'preferred', confidence: 0.8, contexts: ['main'] },
              { exerciseId: 'running', preference: 'avoided', confidence: 0.7, contexts: ['warmup'] }
            ]
          }
        },
        {
          id: 'pref-2',
          userId,
          patternType: 'intensity-level',
          confidence: 0.72,
          strength: 0.65,
          firstDetected: new Date('2026-01-04'),
          lastConfirmed: new Date('2026-01-06'),
          confirmations: 8,
          contradictions: 2,
          data: {
            intensityPreferences: [
              { intensityRange: { min: 0.6, max: 0.8 }, preference: 'comfortable', confidence: 0.72 }
            ]
          }
        },
        {
          id: 'pref-3',
          userId,
          patternType: 'workout-timing',
          confidence: 0.68,
          strength: 0.55,
          firstDetected: new Date('2026-01-10'),
          lastConfirmed: new Date('2026-01-06'),
          confirmations: 6,
          contradictions: 3,
          data: {
            timingPreferences: [
              { timeOfDay: 'morning', preference: 'optimal', confidence: 0.68, performanceImpact: 0.85 }
            ]
          }
        }
      ];
      
      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTypeExpansion = (type: PreferenceType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const getPreferencesByType = () => {
    const grouped: Record<PreferenceType, PreferencePattern[]> = {
      'exercise-selection': [],
      'intensity-level': [],
      'workout-timing': [],
      'recovery-duration': [],
      'exercise-order': [],
      'rest-periods': [],
      'motivation-style': [],
      'gradual-adaptation': [],
      'adaptation-rate': [],
      'error': []
    };

    preferences.forEach(pref => {
      if (grouped[pref.patternType]) {
        grouped[pref.patternType].push(pref);
      }
    });

    return grouped;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthIndicator = (strength: number) => {
    if (strength >= 0.7) return '🔥';
    if (strength >= 0.5) return '🔶';
    if (strength >= 0.3) return '🔸';
    return '🔹';
  };

  const formatPreferenceType = (type: PreferenceType) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getHealthStatus = (preference: PreferencePattern) => {
    const { confirmations, contradictions } = preference;
    if (contradictions >= 3) return { status: 'unhealthy', color: 'text-red-600', message: 'Invalidated - too many contradictions' };
    if (contradictions >= 2) return { status: 'concerning', color: 'text-yellow-600', message: 'Needs review - multiple contradictions' };
    if (contradictions >= 1) return { status: 'caution', color: 'text-orange-600', message: 'Be cautious - some contradictions' };
    if (confirmations < 3) return { status: 'developing', color: 'text-blue-600', message: 'Developing pattern' };
    return { status: 'healthy', color: 'text-green-600', message: 'Strong pattern' };
  };

  const groupedPreferences = getPreferencesByType();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Learning Transparency
        </h2>
        <div className="text-sm text-gray-500">
          Showing {preferences.length} learned preference patterns
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Analyzing your workout patterns...</p>
        </div>
      ) : preferences.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Preferences Learned Yet</h3>
          <p className="text-gray-600">
            Complete a few more workouts to help the AI learn your preferences.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl font-bold">🎯 {preferences.length}</div>
              <div className="text-blue-700 font-medium">Total Patterns</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-2xl font-bold">
                {Math.round(preferences.reduce((sum, p) => sum + p.confidence, 0) / preferences.length * 100)}%
              </div>
              <div className="text-green-700 font-medium">Avg Confidence</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-purple-600 text-2xl font-bold">
                {Math.round(preferences.reduce((sum, p) => sum + p.strength, 0) / preferences.length * 100)}%
              </div>
              <div className="text-purple-700 font-medium">Avg Strength</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-600 text-2xl font-bold">
                {preferences.filter(p => p.contradictions > 0).length}
              </div>
              <div className="text-yellow-700 font-medium">Patterns with Contradictions</div>
            </div>
          </div>

          {/* Preferences by Type */}
          {Object.entries(groupedPreferences).map(([type, typePreferences]) => (
            typePreferences.length > 0 && (
              <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleTypeExpansion(type)}
                  className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-gray-900">
                      {getStrengthIndicator(typePreferences.reduce((sum, p) => sum + p.strength, 0) / typePreferences.length)}
                    </span>
                    <span className="font-medium">
                      {formatPreferenceType(type)}
                    </span>
                    <span className="text-gray-500 text-sm">({typePreferences.length})</span>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedTypes.has(type) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7l5 5 5-5" />
                  </svg>
                </button>

                {expandedTypes.has(type) && (
                  <div className="border-t border-gray-200 p-4 space-y-4 max-h-96 overflow-y-auto">
                    {typePreferences.map(preference => {
                      const health = getHealthStatus(preference);
                      
                      return (
                        <div key={preference.id} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">
                                Pattern ID: {preference.id}
                              </h4>
                              <div className="flex items-center space-x-4 text-xs">
                                <span className={`font-medium ${health.color}`}>
                                  {health.status}
                                </span>
                                <span className="text-gray-500">|</span>
                                <span className={`font-medium ${getConfidenceColor(preference.confidence)}`}>
                                  {Math.round(preference.confidence * 100)}% confidence
                                </span>
                                <span className="text-gray-500">|</span>
                                <span className={`font-medium ${getConfidenceColor(preference.strength)}`}>
                                  {Math.round(preference.strength * 100)}% strength
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                                View Details
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 mb-2">
                            {health.message}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">First Detected:</span>
                              <span>{preference.firstDetected.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Last Confirmed:</span>
                              <span>{preference.lastConfirmed.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Confirmations:</span>
                              <span>{preference.confirmations}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Contradictions:</span>
                              <span className="text-red-600">{preference.contradictions}</span>
                            </div>
                          </div>

                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Pattern Data:</h5>
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(preference.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          ))}

          {/* Explanation Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              How AI Learns Your Preferences
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong className="font-medium">Exercise Selection:</strong> 
                <p className="mt-1">
                  The AI notices which exercises you consistently complete successfully versus those you struggle with or avoid. 
                  This helps build a personalized workout plan.
                </p>
              </div>
              <div>
                <strong className="font-medium">Intensity Level:</strong>
                <p className="mt-1">
                  Your perceived effort level during exercises is tracked to determine your optimal intensity zone. 
                  The AI learns to recommend intensities that challenge you without overwhelming you.
                </p>
              </div>
              <div>
                <strong className="font-medium">Workout Timing:</strong>
                <p className="mt-1">
                  The AI observes when you perform best and correlates this with time of day and workout context. 
                  This helps schedule future workouts at optimal times.
                </p>
              </div>
              <div>
                <strong className="font-medium">Pattern Confidence:</strong>
                <p className="mt-1">
                  Higher confidence means the AI has more data confirming the pattern. 
                  Contradictions (when behavior doesn't match the pattern) reduce confidence over time.
                </p>
              </div>
            </div>
          </div>

          {/* Data Privacy Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 01-8 8v1a1 1 0 00-1 1h-4a1 1 0 00-1-1v-4a1 1 0 00-1-1H3a1 1 0 00-1-1v4a1 1 0 001 1h4a1 1 0 001 1v1a1 1 0 001 1h1a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Privacy Protected</div>
                <div className="text-sm text-yellow-700 mt-1">
                  All preference learning occurs locally on your device. 
                  No personal data is transmitted to external servers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};