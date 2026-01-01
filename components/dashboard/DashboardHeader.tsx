import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveView } from '@/types';

const DashboardHeader: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const getButtonClass = (view: ActiveView) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      activeView === view ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">GymGenie</h1>
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveView('workout')}
            className={getButtonClass('workout')}
          >
            Workout
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
