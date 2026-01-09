import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveView } from '@/types';
import { Dumbbell, Utensils, TrendingUp, User, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui';

const DashboardBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useApp();

  const navItems = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'workout', icon: Dumbbell, label: 'Workout' },
    { key: 'createWorkoutDay', icon: Plus, label: 'Add Exercise' },
    { key: 'kitchen', icon: Utensils, label: 'Kitchen' },
    { key: 'progress', icon: TrendingUp, label: 'Progress' },
    { key: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white pb-safe shadow-2xl z-50 rounded-t-2xl overflow-hidden">
      <nav className="flex justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as ActiveView)}
              className={`relative flex flex-col items-center justify-center min-h-[64px] min-w-[64px] rounded-2xl transition-all duration-300 active:scale-90 ${
                isActive
                  ? ''
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
              style={isActive ? { 
                color: 'var(--mantine-primary-color-filled)',
                backgroundColor: 'var(--mantine-primary-color-light)'
              } : {}}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full blur-[2px]"
                  style={{ backgroundColor: 'var(--mantine-primary-color-filled)' }}
                ></div>
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default DashboardBottomNav;
