import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { DiscomfortEvent } from '../../features/injury-aware/types';
import {
  recordDiscomfort,
  selectDiscomfortEvents,
  selectLastDiscomfortEvent,
  selectActiveSessionInjuryStatus,
  selectIsMonitoringDiscomfort,
  startDiscomfortMonitoring
} from '../../features/injury-aware/store/injuryAwareSlice';

interface DiscomfortReportingComponentProps {
  className?: string;
  currentExercise?: string;
}

const DiscomfortReportingComponent: React.FC<DiscomfortReportingComponentProps> = ({
  className = '',
  currentExercise = ''
}) => {
  const dispatch = useDispatch();
  const discomfortEvents = useSelector(selectDiscomfortEvents);
  const lastDiscomfortEvent = useSelector(selectLastDiscomfortEvent);
  const sessionStatus = useSelector(selectActiveSessionInjuryStatus);
  const isMonitoring = useSelector(selectIsMonitoringDiscomfort);
  
  const [isReporting, setIsReporting] = useState(false);
  const [discomfortData, setDiscomfortData] = useState({
    location: '',
    severity: 3 as 1 | 2 | 3 | 4 | 5,
    description: ''
  });

  useEffect(() => {
    if (!isMonitoring) {
      dispatch(startDiscomfortMonitoring() as any);
    }
  }, [dispatch, isMonitoring]);

  const handleReportDiscomfort = async () => {
    if (!discomfortData.location || !discomfortData.description) {
      return;
    }

    try {
      await dispatch(recordDiscomfort({
        ...discomfortData,
        exercise: currentExercise,
        triggers: currentExercise ? [currentExercise] : []
      }) as any);
      
      // Reset form
      setDiscomfortData({
        location: '',
        severity: 3,
        description: ''
      });
      setIsReporting(false);
    } catch (error) {
      console.error('Failed to report discomfort:', error);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-100 text-green-800';
    if (severity <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity === 1) return 'Very Mild';
    if (severity === 2) return 'Mild';
    if (severity === 3) return 'Moderate';
    if (severity === 4) return 'Severe';
    return 'Very Severe';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'caution': return 'bg-yellow-100 text-yellow-800';
      case 'stop': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe': return 'Safe to Continue';
      case 'caution': return 'Caution Advised';
      case 'stop': return 'Stop Exercise';
      default: return 'Unknown Status';
    }
  };

  const commonLocations = [
    'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle',
    'Lower Back', 'Upper Back', 'Neck', 'Left Shoulder', 'Right Shoulder',
    'Left Hip', 'Right Hip', 'Left Wrist', 'Right Wrist', 'Left Elbow', 'Right Elbow'
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discomfort Reporting</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Report discomfort during workouts for real-time adaptations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sessionStatus)}`}>
            {getStatusLabel(sessionStatus)}
          </span>
          {currentExercise && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {currentExercise}
            </span>
          )}
        </div>
      </div>

      {/* Current Session Status */}
      {sessionStatus !== 'unknown' && (
        <Card variant="outlined" className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Current Session Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sessionStatus === 'safe' && 'No significant discomfort detected. Continue with normal workout intensity.'}
                {sessionStatus === 'caution' && 'Mild discomfort detected. Consider reducing intensity or modifying exercises.'}
                {sessionStatus === 'stop' && 'Severe discomfort detected. Stop current exercise and rest.'}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full ${
              sessionStatus === 'safe' ? 'bg-green-500' :
              sessionStatus === 'caution' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </Card>
      )}

      {/* Quick Report Button */}
      {!isReporting ? (
        <div className="text-center py-6">
          <Button
            variant="primary"
            onClick={() => setIsReporting(true)}
            className="w-full max-w-md"
          >
            Report Discomfort
          </Button>
          {lastDiscomfortEvent && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last report: {new Date(lastDiscomfortEvent.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : (
        /* Discomfort Reporting Form */
        <Card variant="outlined" className="mb-6 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Report New Discomfort
          </h3>
          
          <div className="space-y-4">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location of Discomfort
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {commonLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => setDiscomfortData({ ...discomfortData, location })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      discomfortData.location === location
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
              {discomfortData.location && (
                <input
                  type="text"
                  placeholder="Or specify custom location..."
                  value={discomfortData.location}
                  onChange={(e) => setDiscomfortData({ ...discomfortData, location: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Severity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Level: {getSeverityLabel(discomfortData.severity)}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setDiscomfortData({ ...discomfortData, severity: severity as 1 | 2 | 3 | 4 | 5 })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      discomfortData.severity === severity
                        ? getSeverityColor(severity)
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={discomfortData.description}
                onChange={(e) => setDiscomfortData({ ...discomfortData, description: e.target.value })}
                placeholder="Describe the discomfort..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsReporting(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReportDiscomfort}
                disabled={!discomfortData.location}
                className="flex-1"
              >
                Report Discomfort
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Discomfort Events */}
      {discomfortEvents.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Recent Discomfort Events
          </h3>
          <div className="space-y-2">
            {discomfortEvents.slice(-5).reverse().map((event) => (
              <Card key={event.id} variant="outlined" className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {event.location}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {getSeverityLabel(event.severity)}
                      </span>
                      {event.exercise && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {event.exercise}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Monitoring Status */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Discomfort monitoring {isMonitoring ? 'active' : 'inactive'}
            </span>
          </div>
          {!isMonitoring && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch(startDiscomfortMonitoring() as any)}
            >
              Start Monitoring
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DiscomfortReportingComponent;