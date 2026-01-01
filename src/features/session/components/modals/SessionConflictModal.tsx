import React, { useState, useEffect } from 'react';
import { SessionConflict, ConflictResolutionOption } from '@/src/features/session/services/SessionConflictDetector';
import { UserPromptConfig } from '@/src/features/session/services/SessionConflictResolver';

interface SessionConflictModalProps {
  isOpen: boolean;
  conflict: SessionConflict | null;
  promptConfig: UserPromptConfig | null;
  onResolve: (resolutionId: string) => void;
  onCancel: () => void;
}

export const SessionConflictModal: React.FC<SessionConflictModalProps> = ({
  isOpen,
  conflict,
  promptConfig,
  onResolve,
  onCancel
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (isOpen && promptConfig) {
      // Set default option
      if (promptConfig.defaultOption) {
        setSelectedOption(promptConfig.defaultOption);
      }

      // Set up timeout countdown
      if (promptConfig.timeout) {
        setTimeRemaining(Math.floor(promptConfig.timeout / 1000));
        
        const interval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              // Auto-resolve with default option
              if (promptConfig.defaultOption) {
                onResolve(promptConfig.defaultOption);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [isOpen, promptConfig, onResolve]);

  if (!isOpen || !conflict || !promptConfig) {
    return null;
  }

  const handleResolve = () => {
    if (selectedOption) {
      onResolve(selectedOption);
    }
  };

  const getConflictIcon = (conflictType: string) => {
    switch (conflictType) {
      case 'MULTIPLE_ACTIVE':
        return '⚠️';
      case 'DUPLICATE_SESSION':
        return '🔄';
      case 'STATE_CONFLICT':
        return '❌';
      default:
        return '❓';
    }
  };

  const getOptionIcon = (action: string) => {
    switch (action) {
      case 'CONTINUE_EXISTING':
        return '▶️';
      case 'ABANDON_EXISTING':
        return '🗑️';
      case 'FORCE_NEW':
        return '🆕';
      case 'ABANDON_NEW':
        return '❌';
      default:
        return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getConflictIcon(conflict.type)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {promptConfig.title}
              </h2>
              {timeRemaining > 0 && (
                <p className="text-sm text-gray-500">
                  Auto-resolving in {timeRemaining}s
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {promptConfig.message}
            </p>
          </div>

          {/* Session Details (if showDetails is true) */}
          {promptConfig.showDetails && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Session Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Session:</span> {conflict.existingSession.weekId}-{conflict.existingSession.dayId}
                </div>
                <div>
                  <span className="font-medium">State:</span> {conflict.existingSession.state}
                </div>
                <div>
                  <span className="font-medium">Started:</span> {new Date(conflict.existingSession.startTime).toLocaleString()}
                </div>
                {conflict.existingSession.completedTime && (
                  <div>
                    <span className="font-medium">Completed:</span> {new Date(conflict.existingSession.completedTime).toLocaleString()}
                  </div>
                )}
                <div>
                  <span className="font-medium">Exercises:</span> {Object.keys(conflict.existingSession.exerciseTimestamps).length} completed
                </div>
              </div>
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Choose an action:</h3>
            {promptConfig.options.map((option) => (
              <label
                key={option.id}
                className={`
                  flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedOption === option.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{getOptionIcon(option.action)}</span>
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                    {promptConfig.defaultOption === option.id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedOption}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${selectedOption
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {timeRemaining > 0 ? `Resolve (${timeRemaining}s)` : 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionConflictModal;
