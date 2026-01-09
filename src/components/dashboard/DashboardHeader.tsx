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
    <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md text-gray-900 dark:text-white px-4 py-3 shadow-lg border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
          Gym<span style={{ color: 'var(--mantine-primary-color-filled)' }}>Genie</span>
        </h1>
        <nav className="hidden md:flex space-x-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as ActiveView)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 relative group ${
                activeView === item.key
                  ? 'text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              style={activeView === item.key ? { 
                backgroundColor: 'var(--mantine-primary-color-filled)',
                boxShadow: '0 10px 15px -3px var(--mantine-primary-color-light-hover)'
              } : {}}
            >
              {item.label}
              {activeView !== item.key && (
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-4"
                  style={{ backgroundColor: 'var(--mantine-primary-color-filled)' }}
                ></div>
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
