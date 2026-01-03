import React, { useEffect, useState } from "react";
import { Exercise } from "@/types";
import { exerciseCatalogService } from "../services/ExerciseCatalogService";
import { toTitleCase } from "../../../utils/stringUtils";

interface TodaysWorkoutProps {
  onStartWorkout: () => void;
}

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ onStartWorkout }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const allExercises = await exerciseCatalogService.getAllExercises();
        setExercises(allExercises);
      } catch (err) {
        setError("Failed to load exercises.");
        console.error(err);
      }
    };

    fetchExercises();
  }, []);

  const exerciseSets = Object.entries(
    exercises.reduce((acc, ex) => {
      const group = ex.primaryMuscle[0] || "General";
      if (!acc[group]) {
        acc[group] = { name: group, exercises: [] };
      }
      acc[group].exercises.push(ex);
      return acc;
    }, {} as Record<string, { name: string; exercises: Exercise[] }>)
  ).map(([, value]) => value);

  const nextSet = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % exerciseSets.length);
  };

  const prevSet = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? exerciseSets.length - 1 : prevIndex - 1
    );
  };

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (exerciseSets.length === 0) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading exercises...</div>;
  }

  const currentExerciseSet = exerciseSets[currentIndex];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Your Workout Sets</h2>
      <div className="relative">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{toTitleCase(currentExerciseSet.name)}</h3>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {currentExerciseSet.exercises.slice(0, 3).map((ex) => (
              <div key={ex.id} className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden p-2">
                <img src={ex.media?.gif} alt={ex.name} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
          <button onClick={onStartWorkout} className="mt-4 w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
            Start
          </button>
        </div>
        <button
          onClick={prevSet}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white dark:bg-gray-600 dark:text-gray-200 rounded-full p-2 shadow-md -ml-4"
        >
          {'<'}
        </button>
        <button
          onClick={nextSet}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white dark:bg-gray-600 dark:text-gray-200 rounded-full p-2 shadow-md -mr-4"
        >
          {'>'}
        </button>
      </div>
    </div>
  );
};

export default TodaysWorkout;
