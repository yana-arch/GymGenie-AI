import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveView } from '@/types';
import { Dumbbell, Utensils, TrendingUp, User, Plus, Home } from 'lucide-react'; // Added Home icon

const DashboardBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const getButtonClass = (view: ActiveView) =>
    `flex flex-col items-center p-2 rounded-md transition-colors ${
      activeView === view 
        ? 'text-brand-500 dark:text-brand-400' 
        : 'text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-100'
    }`;

  return (
    <footer className="bg-gray-900 dark:bg-gray-900 border-t border-gray-800 dark:border-gray-800 text-white dark:text-gray-100 pb-safe pt-2 px-2 shadow-lg z-50">
      <nav className="flex justify-around">
        <button
          onClick={() => setActiveView('home')}
          className={getButtonClass('home')}
        >
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button
          onClick={() => setActiveView('workout')}
          className={getButtonClass('workout')}
        >
          <Dumbbell size={24} />
          <span className="text-[10px] mt-1 font-medium">Workout</span>
        </button>
        <button
          onClick={() => setActiveView('createWorkoutDay')} // New button
          className={getButtonClass('createWorkoutDay')}
        >
          <Plus size={24} />
          <span className="text-[10px] mt-1 font-medium">Add Exercise</span>
        </button>
        <button
          onClick={() => setActiveView('kitchen')}
          className={getButtonClass('kitchen')}
        >
          <Utensils size={24} />
          <span className="text-[10px] mt-1 font-medium">Kitchen</span>
        </button>
        <button
          onClick={() => setActiveView('progress')}
          className={getButtonClass('progress')}
        >
          <TrendingUp size={24} />
          <span className="text-[10px] mt-1 font-medium">Progress</span>
        </button>
        <button
          onClick={() => setActiveView('profile')}
          className={getButtonClass('profile')}
        >
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">Profile</span>
        </button>
      </nav>
    </footer>
  );
};

export default DashboardBottomNav;
