import React, { memo, useState, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import ExerciseFinder from './ExerciseFinder';
import { Exercise, WorkoutExercise, UserProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { generateSetsForExercises } from '../services/WorkoutGenerator';
import { Button, Card } from '@/components/ui';

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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col h-full pb-20 md:pb-0 bg-transparent text-gray-900 dark:text-gray-100 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Create Custom Workout Day</h2>

      {/* Button to Add Exercises */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => setIsFinderOpen(true)}
        className="w-full mb-6"
      >
        <Plus size={20} />
        Add Exercise
      </Button>

      {/* Selected Exercises List / AI Generated List */}
      {selectedExercises.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-center">
          <p>Start by adding exercises to your custom workout day.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {(aiGeneratedExercises.length > 0 ? aiGeneratedExercises : selectedExercises).map((exercise, index) => {
            const workoutEx = exercise as WorkoutExercise;
            return (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{exercise.name}</h3>
                  {selectedExercises.some(ex => ex.id === exercise.id) && ( // Only show remove button for manually added exercises
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>
                {aiGeneratedExercises.length > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p>Sets: {workoutEx.sets}</p>
                    <p>Reps: {workoutEx.reps}</p>
                    <p>Rest: {workoutEx.restSeconds}s</p>
                    {workoutEx.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notes: {workoutEx.notes}</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Suggest Sets Button */}
      {selectedExercises.length > 0 && (
        <Button
          variant="primary"
          size="lg"
          onClick={handleAISuggestSets}
          loading={isGenerating}
          className="w-full mt-6"
        >
          {isGenerating ? 'Generating Suggestions...' : 'AI Suggest Sets for Day'}
        </Button>
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
