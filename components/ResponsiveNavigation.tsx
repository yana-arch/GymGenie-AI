import React from 'react';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardBottomNav from './dashboard/DashboardBottomNav';
import { useIsDesktop } from '../hooks/useBreakpoint';

interface ResponsiveNavigationProps {
  children: React.ReactNode;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({ children }) => {
  const isDesktop = useIsDesktop();

  return (
    <div className="flex flex-col h-screen">
      {isDesktop && <DashboardHeader />}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {!isDesktop && <DashboardBottomNav />}
    </div>
  );
};

export default ResponsiveNavigation;