import React, { useEffect, useState } from 'react';
import { getExerciseDetails } from '@/src/features/workout/services/WorkoutGenerator';
import { ExerciseDetails } from '@/types';
import { X, Loader2, Target, ListOrdered, AlertTriangle, Lightbulb, Youtube } from 'lucide-react';

interface ExerciseDetailModalProps {
  exerciseName: string;
  onClose: () => void;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exerciseName, onClose }) => {
  const [details, setDetails] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        const data = await getExerciseDetails(exerciseName);
        if (mounted) {
          setDetails(data);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (mounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => { mounted = false; };
  }, [exerciseName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-pop-in flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 pr-4">{exerciseName}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 size={40} className="animate-spin text-brand-600" />
              <p className="text-gray-500 font-medium">Asking AI Coach...</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              
              {/* Muscles */}
              <div>
                <div className="flex items-center gap-2 text-brand-600 font-bold mb-3">
                  <Target size={20} /> <span className="uppercase text-sm tracking-wide">Target Muscles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {details.targetMuscles.map((m, i) => (
                    <span key={i} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center gap-2 text-gray-800 font-bold mb-3">
                  <ListOrdered size={20} className="text-gray-400" /> <span className="uppercase text-sm tracking-wide text-gray-500">How to perform</span>
                </div>
                <ol className="space-y-3">
                  {details.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-gray-700 text-sm leading-relaxed">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Common Mistakes */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                  <AlertTriangle size={18} /> <span className="uppercase text-xs tracking-wide">Avoid Mistakes</span>
                </div>
                <ul className="space-y-2">
                  {details.commonMistakes.map((mistake, i) => (
                    <li key={i} className="text-sm text-orange-800 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-400">
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Tips */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                 <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                  <Lightbulb size={18} /> <span className="uppercase text-xs tracking-wide">Pro Tip</span>
                </div>
                 <ul className="space-y-2">
                  {details.proTips.map((tip, i) => (
                    <li key={i} className="text-sm text-blue-800 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* External Link */}
              <a 
                href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(exerciseName)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                <Youtube size={20} className="text-red-600" /> Watch Video Tutorial
              </a>

            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Failed to load details. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailModal;