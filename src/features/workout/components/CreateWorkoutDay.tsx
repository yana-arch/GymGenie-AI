import React, { memo, useState, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react'; // Added Loader2 icon
import ExerciseFinder from './ExerciseFinder';
import { Exercise, WorkoutExercise, UserProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { generateSetsForExercises } from '../services/WorkoutGenerator'; // New import

const CreateWorkoutDay = memo(() => {
  const { user } = useApp();
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [aiGeneratedExercises, setAiGeneratedExercises] = useState<WorkoutExercise[]>([]);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    if (!selectedExercises.some(ex => ex.id === exercise.id)) {
      setSelectedExercises(prev => [...prev, exercise]);
      setAiGeneratedExercises([]); // Clear AI suggestions when new exercise is added
    }
    setIsFinderOpen(false);
  }, [selectedExercises]);

  const handleRemoveExercise = useCallback((exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setAiGeneratedExercises([]); // Clear AI suggestions
  }, []);

  const handleAISuggestSets = useCallback(async () => {
    if (!user || selectedExercises.length === 0) return;

    setIsGenerating(true);
    try {
      const generated = await generateSetsForExercises(user, selectedExercises);
      setAiGeneratedExercises(generated);
    } catch (error) {
      console.error("Failed to generate sets with AI:", error);
      alert("Failed to generate sets. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [user, selectedExercises]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Custom Workout Day</h2>

      {/* Button to Add Exercises */}
      <button
        onClick={() => setIsFinderOpen(true)}
        className="w-full bg-brand-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 mb-6"
      >
        <Plus size={20} />
        Add Exercise
      </button>

      {/* Selected Exercises List / AI Generated List */}
      {selectedExercises.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-center">
          <p>Start by adding exercises to your custom workout day.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {(aiGeneratedExercises.length > 0 ? aiGeneratedExercises : selectedExercises).map((exercise, index) => (
            <div key={exercise.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{exercise.name}</h3>
                {selectedExercises.includes(exercise as Exercise) && ( // Only show remove button for manually added exercises
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              {aiGeneratedExercises.length > 0 && (
                <div className="text-sm text-gray-700">
                  <p>Sets: {exercise.sets}</p>
                  <p>Reps: {exercise.reps}</p>
                  <p>Rest: {exercise.restSeconds}s</p>
                  {exercise.notes && <p className="text-xs text-gray-500 mt-1">Notes: {exercise.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Suggest Sets Button */}
      {selectedExercises.length > 0 && (
        <button
          onClick={handleAISuggestSets}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold shadow-md hover:bg-blue-600 transition-colors mt-6 flex items-center justify-center gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Generating Suggestions...
            </>
          ) : (
            'AI Suggest Sets for Day'
          )}
        </button>
      )}

      {/* ExerciseFinder Modal */}
      <ExerciseFinder
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
        onSelectExercise={handleSelectExercise}
        userEquipment={user?.equipment || []}
      />
    </div>
  );
});

CreateWorkoutDay.displayName = 'CreateWorkoutDay';

export default CreateWorkoutDay;