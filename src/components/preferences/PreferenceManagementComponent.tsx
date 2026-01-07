/**
 * Preference Management Component
 * Main interface for managing AI learning preferences
 */

import React, { useState, useEffect } from 'react';
import type { PreferencePattern, PreferenceType } from '../../features/preference-learning/types/preferenceLearning.types';

interface PreferenceManagementComponentProps {
  userId: string;
  onPreferencesUpdated?: (preferences: PreferencePattern[]) => void;
  className?: string;
}

export const PreferenceManagementComponent: React.FC<PreferenceManagementComponentProps> = ({
  userId,
  onPreferencesUpdated,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<PreferencePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PreferenceType>('exercise-selection');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<PreferencePattern | null>(null);

  // Load preferences on component mount
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
          confirmations: 12,
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
        }
      ];
      
      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (preference: PreferencePattern) => {
    try {
      // This would call the preference service to toggle preference
      console.log('Toggle preference:', preference.id);
      
      // Update local state optimistically
      const updatedPreferences = preferences.map(p => 
        p.id === preference.id 
          ? { ...p, confirmations: p.confirmations + 1 }
          : p
      );
      setPreferences(updatedPreferences);
      
      if (onPreferencesUpdated) {
        onPreferencesUpdated(updatedPreferences);
      }
    } catch (error) {
      console.error('Failed to toggle preference:', error);
    }
  };

  const deletePreference = async (preferenceId: string) => {
    try {
      // This would call the preference service to delete preference
      console.log('Delete preference:', preferenceId);
      
      const updatedPreferences = preferences.filter(p => p.id !== preferenceId);
      setPreferences(updatedPreferences);
      
      if (onPreferencesUpdated) {
        onPreferencesUpdated(updatedPreferences);
      }
    } catch (error) {
      console.error('Failed to delete preference:', error);
    }
  };

  const getCategoryPreferences = () => {
    return preferences.filter(p => p.patternType === selectedCategory);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.7) return 'bg-blue-500';
    if (strength >= 0.5) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  const formatPreferenceType = (type: PreferenceType) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const selectedCategoryPreferences = getCategoryPreferences();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Preference Management
        </h2>
        <div className="text-sm text-gray-500">
          Total: {preferences.length} preferences
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {(['exercise-selection', 'intensity-level', 'workout-timing'] as PreferenceType[]).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedCategory === category
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {formatPreferenceType(category)}
          </button>
        ))}
      </div>

      {/* Preferences List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading preferences...</p>
          </div>
        ) : selectedCategoryPreferences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {formatPreferenceType(selectedCategory)} preferences detected yet.</p>
            <p className="text-sm mt-2">
              Complete more workouts to help AI learn your preferences.
            </p>
          </div>
        ) : (
          selectedCategoryPreferences.map(preference => (
            <div key={preference.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-medium ${getConfidenceColor(preference.confidence)}`}>
                      {Math.round(preference.confidence * 100)}% confidence
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStrengthColor(preference.strength)}`}></div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Confirmations: {preference.confirmations}</span>
                    <span>Contradictions: {preference.contradictions}</span>
                    <span>First detected: {preference.firstDetected.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedPreference(preference)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => togglePreference(preference)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => deletePreference(preference.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Preference Details Summary */}
              <div className="text-sm text-gray-700">
                {preference.patternType === 'exercise-selection' && (
                  <div>
                    <p className="font-medium mb-1">Exercise Preferences:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {preference.data.exercisePreferences?.map((pref: any) => (
                        <li key={pref.exerciseId} className="flex items-center justify-between">
                          <span className={`font-medium ${
                            pref.preference === 'preferred' ? 'text-green-600' : 
                            pref.preference === 'avoided' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {pref.exerciseId}
                            {pref.preference === 'preferred' && ' ✓'}
                            {pref.preference === 'avoided' && ' ✗'}
                          </span>
                          <span className="text-gray-500">
                            {Math.round(pref.confidence * 100)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {preference.patternType === 'intensity-level' && (
                  <div>
                    <p className="font-medium mb-1">Intensity Preference:</p>
                    <div className="flex items-center space-x-4">
                      {preference.data.intensityPreferences?.map((pref: any) => (
                        <div key="intensity" className="text-sm">
                          <span className="font-medium">{pref.preference}</span>
                          <span className="ml-2 text-gray-600">
                            {pref.intensityRange?.min.toFixed(2)} - {pref.intensityRange?.max.toFixed(2)}
                          </span>
                          <span className={`ml-2 ${getConfidenceColor(pref.confidence)}`}>
                            ({Math.round(pref.confidence * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preference Details Modal */}
      {selectedPreference && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Preference Details
              </h3>
              <button
                onClick={() => setSelectedPreference(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pattern Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 text-gray-600">
                      {formatPreferenceType(selectedPreference.patternType)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <span className={`ml-2 ${getConfidenceColor(selectedPreference.confidence)}`}>
                      {Math.round(selectedPreference.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Strength:</span>
                    <span className={`ml-2 ${getConfidenceColor(selectedPreference.strength)}`}>
                      {Math.round(selectedPreference.strength * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 ${
                      selectedPreference.contradictions >= 3 ? 'text-red-600' : 
                      selectedPreference.contradictions > 0 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {selectedPreference.contradictions >= 3 ? 'Invalidated' : 
                       selectedPreference.contradictions > 0 ? 'Needs Review' : 
                       'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Learning Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>First Detected:</span>
                    <span className="text-gray-600">
                      {selectedPreference.firstDetected.toLocaleDateString()} {selectedPreference.firstDetected.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Confirmed:</span>
                    <span className="text-gray-600">
                      {selectedPreference.lastConfirmed.toLocaleDateString()} {selectedPreference.lastConfirmed.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Confirmations:</span>
                    <span className="text-gray-600">{selectedPreference.confirmations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Contradictions:</span>
                    <span className="text-red-600">{selectedPreference.contradictions}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Preference Data</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedPreference.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedPreference(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  deletePreference(selectedPreference.id);
                  setSelectedPreference(null);
                }}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-white hover:bg-red-700"
              >
                Delete Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};