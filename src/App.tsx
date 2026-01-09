import React, { memo, useCallback, Suspense, ErrorInfo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ReduxProvider } from './store/ReduxProvider';
import SessionErrorBoundary from './features/session/components/SessionErrorBoundary';
import { GlobalErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import ResponsiveNavigation from './components/ResponsiveNavigation';
import ThemeProvider from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';
import { Transition } from '@mantine/core';

const Onboarding = React.lazy(() => import('./features/onboarding/components/Onboarding'));
const EquipmentScanner = React.lazy(() => import('./features/profile/components/EquipmentScanner'));
const WorkoutDashboard = React.lazy(() => import('./features/workout/components/WorkoutDashboard'));
const ProgressDashboard = React.lazy(() => import('./features/analytics/components/ProgressDashboard'));
const ProfileDashboard = React.lazy(() => import('./features/profile/components/ProfileDashboard'));
const NutritionGenie = React.lazy(() => import('./features/nutrition/components/NutritionGenie'));
const LiveWorkoutSession = React.lazy(() => import('./features/session/components/LiveWorkoutSession'));
const CreateWorkoutDay = React.lazy(() => import('./features/workout/components/CreateWorkoutDay'));
const WorkoutPlanGenerator = React.lazy(() => import('./features/onboarding/components/WorkoutPlanGenerator')); // New import
const HomeDashboard = React.lazy(() => import('./features/home/components/HomeDashboard'));
const AchievementManager = React.lazy(() => import('./features/analytics/components/AchievementManager'));
const AchievementCelebration = React.lazy(() => import('./features/analytics/components/AchievementCelebration'));

const AppContent = memo(() => {
  const { step, isLoading, activeView, setActiveView, setStep } = useApp();

  // Define new AppStep type for plan generation
  type OnboardingAppStep = 'onboarding' | 'scanning' | 'generatePlan' | 'dashboard' | 'session';
  const currentAppStep = step as OnboardingAppStep; // Cast to new type to include 'generatePlan'

  if (currentAppStep === 'session') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900"><Loader2 className="animate-spin text-brand-600" size={32} /></div>}>
        <AchievementManager />
        <AchievementCelebration />
        <LiveWorkoutSession />
      </Suspense>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 vibe-background font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <ResponsiveNavigation>
        {/* Global Overlay Loader */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 z-50 flex items-center justify-center backdrop-blur-xl animate-fade-in">
            <div className="bg-white/40 dark:bg-gray-800/40 p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 flex flex-col items-center backdrop-blur-md">
              <Loader2 size={48} className="animate-spin text-brand-600 mb-4" />
              <p className="font-bold text-lg text-gray-800 dark:text-gray-200">GymGenie AI</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crafting your vibe...</p>
            </div>
          </div>
        )}

        {/* Achievement System (Always available for critical PBs) */}
        <Suspense fallback={null}>
          <AchievementManager />
          <AchievementCelebration />
        </Suspense>

        {/* Page content */}
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-600" size={32} /></div>}>
          <Transition
            mounted={true}
            transition="fade"
            duration={400}
            timingFunction="ease"
            key={`${currentAppStep}-${activeView}`}
          >
            {(styles) => (
              <div style={styles} className="h-full">
                {currentAppStep === 'onboarding' && <Onboarding />}
                {currentAppStep === 'scanning' && <EquipmentScanner />}
                {currentAppStep === 'generatePlan' && <WorkoutPlanGenerator />} {/* New render condition */}
                {currentAppStep === 'dashboard' && activeView === 'home' && <HomeDashboard />}
                {currentAppStep === 'dashboard' && activeView === 'workout' && <WorkoutDashboard />}
                {currentAppStep === 'dashboard' && activeView === 'progress' && <ProgressDashboard />}
                {currentAppStep === 'dashboard' && activeView === 'profile' && <ProfileDashboard />}
                {currentAppStep === 'dashboard' && activeView === 'kitchen' && <NutritionGenie />}
                {currentAppStep === 'dashboard' && activeView === 'createWorkoutDay' && <CreateWorkoutDay />}
              </div>
            )}
          </Transition>
        </Suspense>
      </ResponsiveNavigation>
    </div>
  );
});


import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from '@/theme';
import { useMemo } from 'react';

import { useAppSelector } from '@/store';

const MantineThemeManager = memo(({ children }: { children: React.ReactNode }) => {
  const { themeColor } = useApp();
  const userTheme = useAppSelector((state) => state.user.preferences.theme);
  
  const dynamicTheme = useMemo(() => ({
    ...theme,
    primaryColor: themeColor,
  }), [themeColor]);

  // Read theme from document class (set by ThemeProvider)
  const [resolvedColorScheme, setResolvedColorScheme] = React.useState<'dark' | 'light'>('dark');
  
  React.useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setResolvedColorScheme(root.classList.contains('dark') ? 'dark' : 'light');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={resolvedColorScheme}>
      {children}
    </MantineProvider>
  );
});

const App = memo(() => {
  const handleGlobalError = (error: Error, errorInfo: ErrorInfo) => {
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorReporting(error, errorInfo);
      console.error('Production Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  };

  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      <ReduxProvider>
        <AppProvider>
          <MantineThemeManager>
            <ThemeProvider>
              <ToastProvider>
                <SessionErrorBoundary>
                  <AppContent />
                </SessionErrorBoundary>
              </ToastProvider>
            </ThemeProvider>
          </MantineThemeManager>
        </AppProvider>
      </ReduxProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
