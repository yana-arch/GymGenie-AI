import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveView } from '@/types';
import { Button } from '@/components/ui';

const DashboardHeader: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const navItems = [
    { key: 'home', label: 'Home' },
    { key: 'workout', label: 'Workout' },
    { key: 'createWorkoutDay', label: 'Add Exercise' },
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'progress', label: 'Progress' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <header className="bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 px-4 py-3 shadow-md border-b border-gray-700 dark:border-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-white dark:text-gray-100">GymGenie</h1>
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as ActiveView)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                activeView === item.key
                  ? 'text-brand-400 bg-brand-50/10'
                  : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-100 hover:bg-gray-700/50'
              }`}
            >
              {item.label}
              {activeView === item.key && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-brand-400 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
        {/* Mobile menu button - could be expanded later */}
        <button className="md:hidden p-2 text-gray-300 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
