import React from 'react';
import { useApp } from '@/context/AppContext';
import { X, Plus, Timer } from 'lucide-react';

const RestTimer = () => {
  const { timerSeconds, isTimerRunning, stopRestTimer, addTimerSeconds } = useApp();

  if (!isTimerRunning) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:absolute md:bottom-8 md:left-8 md:right-8 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-gray-700 backdrop-blur-md bg-opacity-95">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center relative overflow-hidden">
            {/* Simple progress ring animation could go here */}
            <Timer className="animate-pulse" size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Resting</p>
            <p className="text-2xl font-mono font-bold leading-none">{formatTime(timerSeconds)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => addTimerSeconds(30)}
            className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex flex-col items-center transition-colors"
          >
            <Plus size={16} />
            <span>30s</span>
          </button>
          
          <button 
            onClick={stopRestTimer}
            className="p-3 rounded-xl bg-red-900/50 hover:bg-red-900 text-red-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestTimer;