/**
 * Preference Dashboard Component
 * Shows transparency and control over learned preferences
 */

import React, { useState, useEffect } from 'react';
import type { 
  PreferencePattern, 
  PreferenceType, 
  ExercisePreference,
  PreferenceLearningConfig
} from '../../features/preference-learning/types/preferenceLearning.types';
import { PreferenceLearningService } from '../../features/preference-learning/PreferenceLearningService';
import { useAppDispatch, useAppSelector } from '../../store';
import type { PrivacyPreservingStorage, TensorFlowJSService } from '../../features/preference-learning/types/preferenceLearning.types';

interface PreferenceDashboardProps {
  userId: string;
  onExportPreferences?: () => void;
  onImportPreferences?: (data: string) => void;
  className?: string;
}

export const PreferenceDashboard: React.FC<PreferenceDashboardProps> = ({
  userId,
  onExportPreferences,
  onImportPreferences,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<PreferencePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [service, setService] = useState<PreferenceLearningService | null>(null);

  // Initialize service with real dependencies
  useEffect(() => {
    const initializeService = async () => {
      try {
        // Import real services
        const { PreferenceEncryptionService } = await import('../../features/preference-learning/services/PreferenceEncryptionService');
        const { RealTensorFlowJSService } = await import('../../features/preference-learning/services/RealTensorFlowJSService');
        
        // Create real encryption service
        const privacyService = new PreferenceEncryptionService({
          encryptionEnabled: true,
          retentionDays: 90,
          anonymizationLevel: 'partial',
          localOnly: true
        });
        
        // Create real TensorFlow.js service
        const tensorFlowService = new RealTensorFlowJSService();

        const config: PreferenceLearningConfig = {
          learningRate: 0.1,
          confidenceThreshold: 0.7,
          maxContradictions: 3,
          minSessions: 5,
          gradualAdaptationRate: 0.05,
          privacySettings: {
            localOnly: true,
            encryptionEnabled: true,
            retentionDays: 90
          }
        };

        const preferenceService = new PreferenceLearningService({
          privacyService,
          tensorFlowService,
          config
        });

        setService(preferenceService);
      } catch (error) {
        console.error('Failed to initialize preference service:', error);
        // Set error state for UI to display
        setService(null);
      }
    };

    initializeService();
  }, []);

  // Load preferences on component mount and when service is ready
  useEffect(() => {
    if (service) {
      loadPreferences();
    }
  }, [service, userId]);

  const loadPreferences = async () => {
    if (!service) return;
    
    setLoading(true);
    try {
      const learnedPreferences = await service.getLearnedPreferences(userId);
      setPreferences(learnedPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fallback to empty state
      setPreferences([]);
    } finally {
      setLoading(false);
    }
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
      grouped[pref.patternType].push(pref);
    });

    return grouped;
  };

  const getOverallStatistics = () => {
    if (preferences.length === 0) {
      return {
        totalPreferences: 0,
        averageConfidence: 0,
        averageStrength: 0,
        strongPreferences: 0,
        preferencesNeedingReview: 0
      };
    }

    const totalPreferences = preferences.length;
    const averageConfidence = preferences.reduce((sum, p) => sum + p.confidence, 0) / totalPreferences;
    const averageStrength = preferences.reduce((sum, p) => sum + p.strength, 0) / totalPreferences;
    const strongPreferences = preferences.filter(p => p.strength >= 0.7).length;
    const preferencesNeedingReview = preferences.filter(p => p.contradictions >= 2).length;

    return {
      totalPreferences,
      averageConfidence: Math.round(averageConfidence * 100),
      averageStrength: Math.round(averageStrength * 100),
      strongPreferences,
      preferencesNeedingReview
    };
  };

  const exportPreferences = async () => {
    if (!service) return;
    
    try {
      const exportedData = await service.exportPreferences(userId);
      
      // Create export data with transparency
      const exportObj = {
        exportDate: new Date().toISOString(),
        userId,
        encryptedData: exportedData,
        statistics: getOverallStatistics(),
        version: '1.0',
        privacyNote: 'This data is encrypted and stored locally on your device only.'
      };

      const dataStr = JSON.stringify(exportObj, null, 2);
      setImportData(dataStr);
      
      if (onExportPreferences) {
        onExportPreferences();
      }
    } catch (error) {
      console.error('Failed to export preferences:', error);
      alert('Failed to export preferences. Please try again.');
    }
  };

  const importPreferences = async () => {
    if (!service || !importData.trim()) return;
    
    try {
      const data = JSON.parse(importData);
      
      // Validate import data
      if (data.encryptedData) {
        await service.importPreferences(userId, data.encryptedData);
        
        if (onImportPreferences) {
          onImportPreferences(importData);
        }
        
        setShowImportDialog(false);
        setImportData('');
        
        // Reload preferences after import
        await loadPreferences();
      } else {
        alert('Invalid import data format. Please check file and try again.');
      }
    } catch (error) {
      console.error('Failed to import preferences:', error);
      alert('Failed to import preferences. Please check file format and try again.');
    }
  };

  const resetPreferences = async () => {
    if (!service) return;
    
    if (confirm('Are you sure you want to reset all learned preferences? This action cannot be undone.')) {
      try {
        await service.resetPreferences(userId);
        setPreferences([]);
      } catch (error) {
        console.error('Failed to reset preferences:', error);
        alert('Failed to reset preferences. Please try again.');
      }
    }
  };

  const stats = getOverallStatistics();
  const groupedPreferences = getPreferencesByType();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Preference Dashboard
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Import
          </button>
          <button
            onClick={exportPreferences}
            disabled={!service || loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export
          </button>
          <button
            onClick={resetPreferences}
            disabled={!service || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading preference data...</p>
        </div>
      )}

      {/* Service Not Ready State */}
      {!service && !loading && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ Service Initialization Failed</div>
          <p className="text-gray-600">Unable to connect to preference learning service.</p>
        </div>
      )}

      {/* Statistics Overview */}
      {!loading && service && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPreferences}</div>
            <div className="text-sm text-gray-600">Total Preferences</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.averageConfidence}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.averageStrength}%</div>
            <div className="text-sm text-gray-600">Avg Strength</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.strongPreferences}</div>
            <div className="text-sm text-gray-600">Strong Preferences</div>
          </div>
        </div>
      )}

      {/* Warning for Preferences Needing Review */}
      {!loading && service && stats.preferencesNeedingReview > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l3.486 0c.764 0 1.721.36 2.486.024L12.743 13.001c-.764.001-1.721-.36-2.486-.002L8.257 3.099c-.764 1.36-2.722 1.36-3.486 0zm0 3.486l-2.486 2.486-3.486 0L5.257 16.901c.764-.001 1.721.36 2.486.002L15.743 3.099c.764-1.36 1.721-.36 2.486-.002l-2.486-2.486c-.764-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 font-medium">
              {stats.preferencesNeedingReview} preference{stats.preferencesNeedingReview === 1 ? '' : 's'} need{stats.preferencesNeedingReview === 1 ? 's' : ''} review
            </span>
          </div>
          <div className="text-sm text-yellow-700 mt-2">
            These preferences have multiple contradictions and may need manual review or reset.
          </div>
        </div>
      )}

      {/* Preferences by Type */}
      {!loading && service && Object.entries(groupedPreferences)
        .filter(([_, prefs]) => prefs.length > 0)
        .map(([type, typePreferences]) => (
          <div key={type} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {type.replace('-', ' ')} Preferences ({typePreferences.length})
            </h3>
            
            <div className="space-y-3">
              {typePreferences.map(preference => (
                <div key={preference.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium ${
                        preference.confidence >= 0.8 ? 'text-green-600' : 
                        preference.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(preference.confidence * 100)}% confidence
                      </span>
                      <span className={`text-sm font-medium ${
                        preference.strength >= 0.7 ? 'text-green-600' : 
                        preference.strength >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(preference.strength * 100)}% strength
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>📅 {preference.firstDetected.toLocaleDateString()}</span>
                      <span>🔄 {preference.confirmations} confirmations</span>
                      <span>⚠️ {preference.contradictions} contradictions</span>
                    </div>
                  </div>

                  {/* Pattern-specific details */}
                  <div className="text-sm text-gray-700">
                    {preference.patternType === 'exercise-selection' && (
                      <div>
                        <p className="font-medium mb-2">Exercise Preferences:</p>
                        <div className="space-y-1">
                          {preference.data.exercisePreferences?.map((pref: ExercisePreference) => (
                            <div key={pref.exerciseId} className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className={`font-medium ${
                                pref.preference === 'preferred' ? 'text-green-600' : 
                                pref.preference === 'avoided' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {pref.exerciseId}
                                {pref.preference === 'preferred' && ' ✓'}
                                {pref.preference === 'avoided' && ' ✗'}
                              </span>
                              <span className="text-gray-500">
                                ({Math.round(pref.confidence * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {preference.patternType === 'intensity-level' && (
                      <div>
                        <p className="font-medium mb-2">Intensity Preference:</p>
                        <div className="space-y-1">
                          {preference.data.intensityPreferences?.map((pref, index) => (
                            <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className="font-medium text-gray-700">{pref.preference}</span>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">
                                  {pref.intensityRange?.min.toFixed(2)} - {pref.intensityRange?.max.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ({Math.round(pref.confidence * 100)}%)
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Preferences</h3>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste exported preference data:
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-32 border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Paste exported JSON data here..."
              />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Importing preferences will replace all current learned preferences. This action cannot be undone.
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={importPreferences}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};