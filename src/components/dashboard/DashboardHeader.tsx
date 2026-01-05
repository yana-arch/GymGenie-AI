import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveView } from '@/types';

const DashboardHeader: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const getButtonClass = (view: ActiveView) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      activeView === view 
        ? 'bg-gray-900 dark:bg-brand-600 text-white dark:text-white' 
        : 'text-gray-300 dark:text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white dark:hover:text-gray-100'
    }`;

  return (
    <header className="bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 p-4 shadow-md border-b border-gray-700 dark:border-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-white dark:text-gray-100">GymGenie</h1>
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveView('home')}
            className={getButtonClass('home')}
          >
            Home
          </button>
          <button
            onClick={() => setActiveView('workout')}
            className={getButtonClass('workout')}
          >
            Workout
          </button>
          <button
            onClick={() => setActiveView('createWorkoutDay')}
            className={getButtonClass('createWorkoutDay')}
          >
            Add Exercise
          </button>
          <button
            onClick={() => setActiveView('kitchen')}
            className={getButtonClass('kitchen')}
          >
            Kitchen
          </button>
          <button
            onClick={() => setActiveView('progress')}
            className={getButtonClass('progress')}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={getButtonClass('profile')}
          >
            Profile
          </button>
        </nav>
      </div>
    </header>
  );
};

export default DashboardHeader;
