import React from 'react';
import { Button } from '@/components/ui';
import { Check, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearAdaptation } from '../store/liveSessionSlice';

interface AdaptationProposalProps {
  adaptation: {
    newExercise?: string;
    newReps?: number;
    newSets?: number;
    restTime?: number;
    notes?: string;
  } | null;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

const AdaptationProposal: React.FC<AdaptationProposalProps> = ({
  adaptation,
  onAccept,
  onReject,
  isLoading = false
}) => {
  const dispatch = useAppDispatch();

  if (!adaptation && !isLoading) return null;

  const handleReject = () => {
    dispatch(clearAdaptation());
    onReject();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-x-4 bottom-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl z-50 max-w-sm mx-auto">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Analyzing your request...</p>
        </div>
      </div>
    );
  }

  if (!adaptation) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl z-50 max-w-sm mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Recommendation</h3>
          <button
            onClick={handleReject}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-3">
          {adaptation.newExercise && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Exercise:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{adaptation.newExercise}</span>
            </div>
          )}
          
          {adaptation.newReps && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Reps:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{adaptation.newReps}</span>
            </div>
          )}
          
          {adaptation.newSets && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sets:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{adaptation.newSets}</span>
            </div>
          )}
          
          {adaptation.restTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rest Time:</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{adaptation.restTime}s</span>
            </div>
          )}
          
          {adaptation.notes && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{adaptation.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleReject}
            className="flex-1"
          >
            <X size={16} />
            Reject
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onAccept}
            className="flex-1"
          >
            <Check size={16} />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdaptationProposal;