import React, { memo, useCallback, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ReduxProvider } from './store/ReduxProvider';
import SessionErrorBoundary from './src/features/session/components/SessionErrorBoundary';
import { Loader2 } from 'lucide-react';
import ResponsiveNavigation from './components/ResponsiveNavigation';

const Onboarding = React.lazy(() => import('./src/features/onboarding/components/Onboarding'));
const EquipmentScanner = React.lazy(() => import('./src/features/profile/components/EquipmentScanner'));
const WorkoutDashboard = React.lazy(() => import('./src/features/workout/components/WorkoutDashboard'));
const ProgressDashboard = React.lazy(() => import('./src/features/workout/components/ProgressDashboard'));
const ProfileDashboard = React.lazy(() => import('./src/features/profile/components/ProfileDashboard'));
const NutritionGenie = React.lazy(() => import('./src/features/nutrition/components/NutritionGenie'));
const LiveWorkoutSession = React.lazy(() => import('./src/features/session/components/LiveWorkoutSession'));

const AppContent = memo(() => {
  const { step, isLoading, activeView, setActiveView, setStep } = useApp();

  if (step === 'session') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-brand-600" size={32} /></div>}>
        <LiveWorkoutSession />
      </Suspense>
    );
  }

  return (
    <div className="h-screen bg-gray-100 font-sans text-gray-900">
      <ResponsiveNavigation>
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

        {/* Page content */}
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-600" size={32} /></div>}>
          {step === 'onboarding' && <Onboarding />}
          {step === 'scanning' && <EquipmentScanner />}
          {step === 'dashboard' && activeView === 'workout' && <WorkoutDashboard />}
          {step === 'dashboard' && activeView === 'progress' && <ProgressDashboard />}
          {step === 'dashboard' && activeView === 'profile' && <ProfileDashboard />}
          {step === 'dashboard' && activeView === 'kitchen' && <NutritionGenie />}
        </Suspense>
      </ResponsiveNavigation>
    </div>
  );
});

const App = memo(() => {
  return (
    <SessionErrorBoundary>
      <ReduxProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ReduxProvider>
    </SessionErrorBoundary>
  );
});

App.displayName = 'App';

export default App;