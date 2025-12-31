import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import EquipmentScanner from './components/EquipmentScanner';
import WorkoutDashboard from './components/WorkoutDashboard';
import SessionErrorBoundary from './components/SessionErrorBoundary';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { step, isLoading } = useApp();

  return (
    <div className="md:min-h-screen md:bg-gray-100 md:flex md:items-center md:justify-center md:p-4 lg:p-8 font-sans text-gray-900 transition-all">
      {/* 
        App Shell:
        - Mobile: 100dvh (Dynamic Viewport Height).
        - Desktop: Fixed height (85vh) or max-height (900px) card centered on screen.
      */}
      <div className="w-full h-[100dvh] md:h-[85vh] md:max-h-[900px] md:max-w-5xl bg-white md:rounded-[2rem] md:shadow-2xl md:border md:border-white/50 overflow-hidden relative flex flex-col transition-all duration-300">
        
        {/* Global Overlay Loader */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center">
              <Loader2 size={48} className="animate-spin text-brand-600 mb-4" />
              <p className="font-bold text-lg text-gray-800">GymGenie AI</p>
              <p className="text-sm text-gray-500 mt-1">Crafting your plan...</p>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative w-full bg-white">
          {step === 'onboarding' && <Onboarding />}
          {step === 'scanning' && <EquipmentScanner />}
          {step === 'dashboard' && <WorkoutDashboard />}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <SessionErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SessionErrorBoundary>
  );
};

export default App;