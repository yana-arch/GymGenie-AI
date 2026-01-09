import React, { useEffect, useState, useMemo } from "react";
import { Dumbbell, Sparkles, Play } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Exercise } from "@/types";
import { exerciseCatalogService } from "../services/ExerciseCatalogService";
import { toTitleCase } from "../../../utils/stringUtils";
import { Card } from "@/components/ui";

interface TodaysWorkoutProps {
  onStartWorkout: (weekId: string, dayId: string) => void;
}

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ onStartWorkout }) => {
  const { currentPlan, currentSession, getSessionState } = useApp();



  const [catalogExercises, setCatalogExercises] = useState<Record<string, Exercise>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load catalog exercises to match images and tips
  useEffect(() => {
    const loadCatalog = async () => {
      const all = await exerciseCatalogService.getAllExercises();
      const map: Record<string, Exercise> = {};
      all.forEach(ex => map[ex.name.toLowerCase()] = ex);
      setCatalogExercises(map);
    };
    loadCatalog();
  }, []);

  const todaysWorkoutData = useMemo(() => {
    if (!currentPlan) return null;
    
    // Find next pending or active day
    for (const week of currentPlan.weeks) {
      for (const day of week.days) {
        if (day.isRestDay) continue;
        const state = getSessionState(week.id, day.id);
        if (state !== 'logged') {
          return { day, weekId: week.id };
        }
      }
    }
    return null;
  }, [currentPlan, getSessionState]);

  if (!todaysWorkoutData) {
    return null; // Or show finished state
  }

  const { day: todaysWorkout, weekId } = todaysWorkoutData;

  const currentExercise = todaysWorkout.exercises[currentIndex];

  const nextSet = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % todaysWorkout.exercises.length);
  };

  const prevSet = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? todaysWorkout.exercises.length - 1 : prevIndex - 1
    );
  };

  const matchedCatalogExercise = useMemo(() => {
    if (!currentExercise) return null;
    return catalogExercises[currentExercise.name.toLowerCase()] || null;
  }, [currentExercise, catalogExercises]);

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
        <Dumbbell size={24} className="text-brand-500" />
        Your Workout Sets
      </h2>
      <div className="relative">
        <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1">
                Exercise {currentIndex + 1} of {todaysWorkout.exercises.length}
              </p>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{toTitleCase(currentExercise.name)}</h3>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Reference Image */}
            <div className="w-full md:w-48 h-48 bg-white dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
               {matchedCatalogExercise?.media?.gif ? (
                 <img 
                   src={matchedCatalogExercise.media.gif} 
                   alt={currentExercise.name} 
                   className="w-full h-full object-contain" 
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                    <Dumbbell size={48} className="opacity-20 mb-2" />
                    <span className="text-[10px] font-bold uppercase">No Image</span>
                 </div>
               )}
            </div>

            {/* Stats & Technique */}
            <div className="flex-1 space-y-4">
               <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold rounded-lg border border-brand-100 dark:border-brand-800">
                    {currentExercise.sets} Sets
                  </span>
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-lg border border-blue-100 dark:border-blue-800">
                    {currentExercise.reps} Reps
                  </span>
               </div>
               
               {matchedCatalogExercise && (
                 <div className="space-y-3">
                    {matchedCatalogExercise.cues?.length > 0 ? (
                      <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Sparkles size={10} /> Pro Tip
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">
                          {matchedCatalogExercise.cues[0]}
                        </p>
                      </div>
                    ) : matchedCatalogExercise.instructions?.length > 0 ? (
                      <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Quick Tip</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
                          {matchedCatalogExercise.instructions[0].replace(/^Step:\d+\s*/i, '')}
                        </p>
                      </div>
                    ) : null}
                 </div>
               )}
            </div>
          </div>
          <button 
            onClick={() => onStartWorkout(weekId, todaysWorkout.id)} 
            className="mt-4 w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" /> Start Workout
          </button>
        </div>
        <button
          onClick={prevSet}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-full p-2 shadow-md -ml-4 border border-gray-100 dark:border-gray-700"
        >
          {'<'}
        </button>
        <button
          onClick={nextSet}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-full p-2 shadow-md -mr-4 border border-gray-100 dark:border-gray-700"
        >
          {'>'}
        </button>
      </div>
    </Card>
  );
};

export default TodaysWorkout;
