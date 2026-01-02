import React from 'react';
import { X, ExternalLink, AlertTriangle, Target } from 'lucide-react';
import { Exercise } from '../../../types/schemas';

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
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
            {exercise.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-0">
          {/* Media Section */}
          <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
            {exercise.media.gif ? (
              <img
                src={exercise.media.gif}
                alt={exercise.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Target size={48} className="mb-2 opacity-50" />
                <span className="text-sm">No demonstration available</span>
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full uppercase tracking-wider">
                {exercise.bodyPart.join(', ')}
              </span>
              <span className="px-3 py-1 bg-brand-600/90 backdrop-blur-md text-white text-xs font-medium rounded-full uppercase tracking-wider">
                {exercise.equipment.join(', ')}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Muscles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Target size={16} className="text-brand-600" />
                  Target Muscles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscle.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-3 py-1 bg-brand-50 text-brand-700 text-sm font-semibold rounded-lg border border-brand-100"
                    >
                      {muscle}
                    </span>
                  ))}
                  {exercise.secondaryMuscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-lg border border-gray-100"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Difficulty
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                    exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exercise.difficulty || 'beginner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Instructions
              </h3>
              <div className="space-y-3">
                {exercise.instructions.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Augmented Badge */}
            {exercise.sourceMeta?.ai_augmented && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg text-xs">
                <ExternalLink size={14} />
                <span>Instructions optimized by AI for clarity.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          {onAddToWorkout && (
            <button
              onClick={onAddToWorkout}
              className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm active:scale-95 transform duration-100"
            >
              Add to Workout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;
