import React from 'react';
import { Button } from '@/components/ui';
import { Check, X } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { clearAdaptation, applyInjuryFiltering } from '../store/liveSessionSlice';
import { useApp } from '@/context/AppContext';
import { updateExerciseInPlan } from '@/features/workout/store/workoutSlice';

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
  exerciseId?: string;
}

const AdaptationProposal: React.FC<AdaptationProposalProps> = ({
  adaptation,
  onAccept,
  onReject,
  isLoading = false,
  exerciseId
}) => {
  const dispatch = useAppDispatch();
  const { currentPlan, currentSession } = useApp();

  if (!adaptation && !isLoading) return null;

  const handleReject = () => {
    dispatch(clearAdaptation());
    onReject();
  };

  const handleAccept = () => {
    if (!adaptation || !exerciseId) return;
    
    try {
      if (!currentSession || !currentPlan) return;
      
      const week = currentPlan.weeks.find(w => w.id === currentSession.weekId);
      const day = week?.days.find(d => d.id === currentSession.dayId);
      if (!day) return;
      
      const updates: any = {};
      if (adaptation.newReps && adaptation.newReps > 0) updates.reps = adaptation.newReps.toString();
      if (adaptation.newSets && adaptation.newSets > 0) updates.sets = adaptation.newSets;
      if (adaptation.restTime && adaptation.restTime > 0) updates.restSeconds = adaptation.restTime;
      
      if (Object.keys(updates).length > 0) {
        dispatch(updateExerciseInPlan({
          weekId: currentSession.weekId,
          dayId: currentSession.dayId,
          exerciseId,
          updates
        }));
      }
      
      dispatch(applyInjuryFiltering(adaptation));
      dispatch(clearAdaptation());
      onAccept();
      
    } catch (error) {
      console.error('Failed to apply adaptation:', error);
    }
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
            onClick={handleAccept}
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