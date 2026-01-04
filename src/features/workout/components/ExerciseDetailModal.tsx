import React, { useState, useEffect } from 'react';
import { X, ExternalLink, AlertTriangle, Target, Sparkles, Loader2, List, Play } from 'lucide-react';
import { Exercise } from '../../../types/schemas';
import { getExerciseDetails } from '@/src/features/workout/services/WorkoutGenerator';
import { toTitleCase } from '../../../utils/stringUtils';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToWorkout?: () => void;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onAddToWorkout,
}) => {
  const [aiDetails, setAiDetails] = useState<{ 
    targetMuscles: string[]; 
    instructions: string[]; 
    commonMistakes: string[]; 
    proTips: string[]; 
  } | null>(null);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAiDetails(null); // Clear AI details when modal closes
    }
  }, [isOpen]);

  if (!isOpen || !exercise) return null;

  const handleFetchAiTip = async () => {
    if (!exercise.name) return;
    setIsGeneratingTip(true);
    try {
      const details = await getExerciseDetails(exercise.name);
      setAiDetails(details);
    } catch (error) {
      console.error("Failed to generate AI tip:", error);
      setAiDetails(null); // Clear details on error
    } finally {
      setIsGeneratingTip(false);
    }
  };

  // Render content based on whether AI details are available or loading
  const renderContent = () => {
    if (isGeneratingTip) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 size={24} className="animate-spin text-brand-500" />
          <p className="ml-2 text-gray-500 dark:text-gray-400">Consulting AI Coach...</p>
        </div>
      );
    }

    const effectiveTargetMuscles = aiDetails?.targetMuscles || exercise.primaryMuscle;
    const effectiveInstructions = aiDetails?.instructions || exercise.instructions;
    const effectiveCommonMistakes = aiDetails?.commonMistakes || exercise.contraindications;
    const effectiveProTips = aiDetails?.proTips || exercise.cues;

    return (
      <>
        {/* Target Muscles */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="fill-current opacity-20" />
            Target Muscles
          </h3>
          <div className="flex flex-wrap gap-2">
            {effectiveTargetMuscles.map((muscle) => (
              <span
                key={muscle}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-full border border-blue-100 dark:border-blue-800/50"
              >
                {toTitleCase(muscle)}
              </span>
            ))}
            {(!aiDetails && exercise.secondaryMuscles.length > 0) && 
              exercise.secondaryMuscles.slice(0, 2).map((muscle) => (
                <span
                  key={muscle}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold rounded-full border border-gray-100 dark:border-gray-600/50"
                >
                  {toTitleCase(muscle)}
                </span>
              ))
            }
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <List size={14} />
            How to Perform
          </h3>
          <div className="space-y-4">
            {effectiveInstructions.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {step.replace(/^Step:\d+\s*/i, "")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Avoid Mistakes (Contraindications) */}
        {(effectiveCommonMistakes && effectiveCommonMistakes.length > 0) && (
          <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-3xl border border-orange-100 dark:border-orange-800/30 space-y-3">
            <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} />
              Avoid Mistakes
            </h3>
            <ul className="space-y-2">
              {effectiveCommonMistakes.map((note, i) => (
                <li key={i} className="text-sm text-orange-800 dark:text-orange-300 flex items-start gap-2">
                  <span className="text-orange-400 dark:text-orange-500 mt-1.5">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pro Tips (Cues or AI Tip) */}
        {(effectiveProTips && effectiveProTips.length > 0) && (
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100/50 dark:border-blue-800/30 space-y-3">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} />
              Pro Tip
            </h3>
            <ul className="space-y-2">
              {effectiveProTips.map((tip, i) => (
                <li key={i} className="text-sm text-blue-800 dark:text-blue-300 italic leading-relaxed flex items-start gap-2">
                  <span className="text-blue-400 dark:text-blue-500 mt-1.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 truncate pr-4">
            {toTitleCase(exercise.name)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
          {renderContent()}

          {/* Button to fetch AI tips if not already fetched and not loading */}
          {!aiDetails && !isGeneratingTip && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleFetchAiTip}
                disabled={isGeneratingTip}
                className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 py-2 px-4 rounded-full border border-brand-100 dark:border-brand-800"
              >
                {isGeneratingTip ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {isGeneratingTip ? 'Consulting AI Coach...' : 'Get AI Coach Insights'}
              </button>
            </div>
          )}

          {/* Media Section */}
          <div className="w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden relative border border-gray-100 dark:border-gray-700">
            {exercise.media.gif ? (
              <img
                src={exercise.media.gif}
                alt={exercise.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="text-gray-400 dark:text-gray-500 h-full flex flex-col items-center justify-center">
                <Target size={48} className="mb-2 opacity-50" />
                <span className="text-sm">No demonstration available</span>
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                {exercise.bodyPart.join(", ")}
              </span>
              <span className="px-3 py-1 bg-brand-600/90 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                {exercise.equipment.join(", ")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
          <button
            onClick={() => {
              const query = encodeURIComponent(`${exercise.name} exercise tutorial`);
              window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
            }}
            className="w-full py-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-[0.99]"
          >
            <Play size={18} className="text-red-500 fill-current" />
            Watch Video Tutorial
          </button>
          
          <div className="flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 py-4 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors"
            >
                Close
            </button>
            {onAddToWorkout && (
                <button
                onClick={onAddToWorkout}
                className="flex-[2] py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors shadow-lg active:scale-95 transform duration-100"
                >
                Add to Workout
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
