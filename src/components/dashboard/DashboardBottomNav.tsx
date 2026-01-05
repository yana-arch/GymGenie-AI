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
    <footer className="bg-gray-900 dark:bg-gray-900 border-t border-gray-800 dark:border-gray-800 text-white dark:text-gray-100 pb-safe shadow-lg z-50">
      <nav className="flex justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;

          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key as ActiveView)}
              className={`relative flex flex-col items-center justify-center min-h-[60px] px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-brand-400 bg-brand-50/10'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-300 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-brand-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default DashboardBottomNav;
