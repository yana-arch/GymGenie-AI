import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useResponsiveComponent } from '../hooks/useLayoutManager';
import { LayoutPatterns } from '../utils/layoutManager';
import { 
  Menu, 
  X, 
  Dumbbell, 
  Utensils, 
  History, 
  Calendar, 
  Settings, 
  User,
  Home,
  Activity,
  Trophy,
  ChevronRight
} from 'lucide-react';

// Navigation item interface
export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  badge?: string | number;
  isActive?: boolean;
  disabled?: boolean;
}

// Navigation props
interface ResponsiveNavigationProps {
  items: NavItem[];
  currentTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  showLabels?: boolean;
}

// Mobile Hamburger Menu Component
const MobileHamburgerMenu: React.FC<{
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}> = ({ items, isOpen, onToggle, onClose }) => {
  // Close menu when clicking outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
          onClose();
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={onToggle}
        className="hamburger-button flex flex-col items-center justify-center bg-brand-700/50 hover:bg-brand-700 p-2 rounded-xl transition-all border border-brand-500/30 touch-target"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
        <span className="text-[10px] uppercase font-bold mt-1">Menu</span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <div className="mobile-menu relative bg-white w-80 max-w-[85vw] h-full shadow-2xl animate-slide-in-left flex flex-col">
            {/* Header */}
            <div className="bg-brand-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">GymGenie AI</h2>
                <p className="text-brand-200 text-sm">Navigation Menu</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-brand-700 transition-colors touch-target"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-2 px-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        item.onClick();
                        onClose();
                      }}
                      disabled={item.disabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all touch-target ${
                        item.isActive
                          ? 'bg-brand-50 text-brand-600 border border-brand-200'
                          : item.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <item.icon 
                        size={24} 
                        className={item.isActive ? 'text-brand-600' : item.disabled ? 'text-gray-400' : 'text-gray-500'} 
                      />
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4">
              <div className="text-center text-xs text-gray-500">
                <p>GymGenie AI v1.0</p>
                <p className="mt-1">Your AI Fitness Coach</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Desktop Sidebar Navigation Component
const DesktopSidebar: React.FC<{
  items: NavItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}> = ({ items, isCollapsed = false, onToggleCollapse }) => {
  return (
    <aside 
      className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      data-component="desktop-sidebar"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-bold text-gray-900">GymGenie AI</h2>
            <p className="text-xs text-gray-500">Your AI Fitness Coach</p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group ${
                  item.isActive
                    ? 'bg-brand-50 text-brand-600 border border-brand-200'
                    : item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon 
                  size={20} 
                  className={`flex-shrink-0 ${
                    item.isActive ? 'text-brand-600' : item.disabled ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-700'
                  }`} 
                />
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-center text-xs text-gray-500">
            <p>Version 1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

// Bottom Navigation Bar for Mobile
const BottomNavigation: React.FC<{
  items: NavItem[];
  showLabels?: boolean;
}> = ({ items, showLabels = true }) => {
  return (
    <nav 
      className="bg-white border-t border-gray-200 p-2 pb-6 sticky bottom-0 z-40 flex justify-around items-center shadow-lg-up"
      data-component="bottom-navigation"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          disabled={item.disabled}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full touch-target relative ${
            item.isActive
              ? 'text-brand-600 bg-brand-50'
              : item.disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <item.icon 
            size={24} 
            className={item.isActive ? 'fill-current' : ''} 
          />
          {showLabels && (
            <span className="text-[10px] font-bold">{item.label}</span>
          )}
          {item.badge && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Main Responsive Navigation Component
const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  currentTab,
  onTabChange,
  className = '',
  showLabels = true
}) => {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Register responsive component
  const { ref } = useResponsiveComponent(
    'responsive-navigation',
    LayoutPatterns.sidebarLayout(),
    { priority: 1 }
  );

  // Update active states based on currentTab
  const enhancedItems = items.map(item => ({
    ...item,
    isActive: currentTab ? item.id === currentTab : item.isActive,
    onClick: () => {
      item.onClick();
      if (onTabChange) {
        onTabChange(item.id);
      }
    }
  }));

  // Close mobile menu on breakpoint change
  useEffect(() => {
    if (!isMobile() && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close mobile menu on Escape
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      
      // Toggle sidebar on Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b' && (isDesktop() || isLargeDesktop())) {
        event.preventDefault();
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isSidebarCollapsed, isDesktop, isLargeDesktop]);

  return (
    <div ref={ref} className={`responsive-navigation ${className}`}>
      {/* Mobile Navigation */}
      {isMobile() && (
        <>
          {/* Mobile Hamburger Menu (for header) */}
          <MobileHamburgerMenu
            items={enhancedItems}
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Bottom Navigation Bar */}
          <BottomNavigation
            items={enhancedItems.slice(0, 4)} // Limit to 4 items for bottom nav
            showLabels={showLabels}
          />
        </>
      )}

      {/* Tablet Navigation */}
      {isTablet() && (
        <BottomNavigation
          items={enhancedItems}
          showLabels={showLabels}
        />
      )}

      {/* Desktop Navigation */}
      {(isDesktop() || isLargeDesktop()) && (
        <DesktopSidebar
          items={enhancedItems}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
    </div>
  );
};

// Hook for creating navigation items
export const useNavigationItems = (
  activeTab: string,
  handlers: {
    onWorkoutClick: () => void;
    onNutritionClick: () => void;
    onHistoryClick: () => void;
    onCalendarClick: () => void;
    onSettingsClick?: () => void;
    onProfileClick?: () => void;
  }
): NavItem[] => {
  return [
    {
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      onClick: handlers.onWorkoutClick,
      isActive: activeTab === 'workout'
    },
    {
      id: 'nutrition',
      label: 'Kitchen',
      icon: Utensils,
      onClick: handlers.onNutritionClick,
      isActive: activeTab === 'nutrition'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      onClick: handlers.onHistoryClick,
      isActive: activeTab === 'history'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      onClick: handlers.onCalendarClick,
      isActive: activeTab === 'calendar'
    },
    ...(handlers.onSettingsClick ? [{
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: handlers.onSettingsClick,
      isActive: activeTab === 'settings'
    }] : []),
    ...(handlers.onProfileClick ? [{
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: handlers.onProfileClick,
      isActive: activeTab === 'profile'
    }] : [])
  ];
};

export default ResponsiveNavigation;