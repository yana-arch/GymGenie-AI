import React from 'react';
import { Clock, AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';

interface StaleSessionModalProps {
  isOpen: boolean;
  sessionData: {
    lastActivity: number;
    activeSessionKey: string | null;
    sessionCount: number;
  };
  onContinue: () => void;
  onReset: () => void;
  onClose: () => void;
}

const StaleSessionModal: React.FC<StaleSessionModalProps> = ({
  isOpen,
  sessionData,
  onContinue,
  onReset,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const hasActiveSession = sessionData.activeSessionKey !== null;
  const timeAgo = formatTimeAgo(sessionData.lastActivity);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 animate-pop-in">
        {/* Icon */}
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} className="text-orange-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Old Workout Session Found
        </h2>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            We found workout data from <strong>{timeAgo}</strong>. 
            {hasActiveSession ? ' You had an active workout session that wasn\'t completed.' : ' You have some saved workout progress.'}
          </p>
          
          {/* Session Details */}
          <div className="bg-gray-50 rounded-2xl p-4 text-left">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-gray-700">Session Details</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Last Activity:</span>
                <span className="font-medium">{timeAgo}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${hasActiveSession ? 'text-orange-600' : 'text-gray-600'}`}>
                  {hasActiveSession ? 'Active Session' : 'No Active Session'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Saved Sessions:</span>
                <span className="font-medium">{sessionData.sessionCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {hasActiveSession && (
            <button
              onClick={onContinue}
              className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              Continue Previous Workout
            </button>
          )}
          
          <button
            onClick={onReset}
            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              hasActiveSession 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            <Trash2 size={20} />
            Start Fresh
          </button>

          {!hasActiveSession && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Keep Old Data
            </button>
          )}
        </div>

        {/* Warning Text */}
        <p className="text-xs text-gray-500 text-center mt-6">
          {hasActiveSession 
            ? 'If you start fresh, your previous workout progress will be lost.'
            : 'Starting fresh will clear all saved workout data.'
          }
        </p>
      </div>
    </div>
  );
};

export default StaleSessionModal;