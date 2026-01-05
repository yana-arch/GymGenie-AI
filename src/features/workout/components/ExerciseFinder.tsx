import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Dumbbell, X, ChevronRight, LayoutGrid, List } from 'lucide-react';

import { exerciseCatalogService } from '../services/ExerciseCatalogService';
import { Exercise, BodyPartEnum, EquipmentEnum, DifficultyEnum, MechanicsEnum } from '../../../types/schemas';
import ExerciseDetailModal from './ExerciseDetailModal';
import { toTitleCase } from '@/utils/stringUtils';

interface ExerciseFinderProps {
  onSelectExercise: (exercise: Exercise) => void;
  onClose?: () => void;
  isOpen: boolean;
  userEquipment?: string[];
}

const ExerciseFinder: React.FC<ExerciseFinderProps> = ({ onSelectExercise, onClose, isOpen, userEquipment = [] }) => {
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  // Filters
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedMechanics, setSelectedMechanics] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery?: string) => {
    const queryToUse = searchQuery ?? '';
    setIsLoading(true);
    try {
      const results = await exerciseCatalogService.search(queryToUse, {
        bodyPart: selectedBodyPart ? [selectedBodyPart] : undefined,
        equipment: selectedEquipment ? [selectedEquipment] : undefined,
        difficulty: selectedDifficulty ? [selectedDifficulty] : undefined,
        mechanics: selectedMechanics ? [selectedMechanics] : undefined,
      });
      setExercises(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBodyPart, selectedEquipment, selectedDifficulty, selectedMechanics]);

  useEffect(() => {
    if (isOpen) {
      performSearch(query);
    }
  }, [isOpen, selectedBodyPart, selectedEquipment, selectedDifficulty, selectedMechanics, query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  const handleExerciseClick = async (exerciseId: string) => {
    const fullExercise = await exerciseCatalogService.getById(exerciseId);
    if (fullExercise) {
      setSelectedExercise(fullExercise);
      setIsDetailOpen(true);
    }
  };

  const handleAddToWorkout = () => {
    if (selectedExercise) {
      onSelectExercise(selectedExercise);
      setIsDetailOpen(false);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-900 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700 shadow-sm z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Dumbbell className="text-brand-600" />
            Exercise Library
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search exercises..."
            value={query}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all"
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              showFilters || selectedBodyPart || selectedEquipment
                ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
            <select
              value={selectedBodyPart}
              onChange={(e) => setSelectedBodyPart(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-brand-300 dark:text-gray-200"
            >
              <option value="">All Body Parts</option>
              {BodyPartEnum.options.map(part => (
                <option key={part} value={part}>{toTitleCase(part)}</option>
              ))}
            </select>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-brand-300 dark:text-gray-200"
            >
              <option value="">All Equipment</option>
              {EquipmentEnum.options.map(equip => (
                <option key={equip} value={equip}>{toTitleCase(equip)}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-brand-300 dark:text-gray-200"
            >
              <option value="">All Difficulties</option>
              {DifficultyEnum.options.map(diff => (
                <option key={diff} value={diff}>{toTitleCase(diff)}</option>
              ))}
            </select>
            <select
              value={selectedMechanics}
              onChange={(e) => setSelectedMechanics(e.target.value)}
              className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-brand-300 dark:text-gray-200"
            >
              <option value="">All Mechanics</option>
              {MechanicsEnum.options.map(mech => (
                <option key={mech} value={mech}>{toTitleCase(mech)}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end mt-2">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-l-lg ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-400'}`}>
            <List size={18} />
          </button>
          <button onClick={() => setViewMode('card')} className={`p-2 rounded-r-lg ${viewMode === 'card' ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-400'}`}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && exercises.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading library...</div>
        ) : exercises.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">No exercises found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="h-full">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="px-4 py-2">
                <button
                  onClick={() => handleExerciseClick(exercise.id)}
                  className="w-full text-left bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-sm transition-all flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-700 dark:group-hover:text-brand-400">
                      {toTitleCase(exercise.name)}
                    </h4>
                    <div className="flex gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                        {toTitleCase(exercise.bodyPart.join(', '))}
                      </span>
                      <span className="capitalize bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-600 truncate max-w-[120px]">
                        {toTitleCase(exercise.equipment.join(', '))}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative" onClick={() => handleExerciseClick(exercise.id)}>
                <div className="w-full aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 p-2">
                  <img src={exercise.media?.gif} alt={exercise.name} className="w-full h-full object-contain" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-bold text-white text-lg">{toTitleCase(exercise.name)}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToWorkout={handleAddToWorkout}
      />
    </div>
  );
};

export default ExerciseFinder;
