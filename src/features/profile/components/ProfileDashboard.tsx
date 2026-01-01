import React from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import ProfileHeader from './ProfileHeader';
import BiometricEditor from './BiometricEditor';
import InjuriesManager from './InjuriesManager';
import EquipmentList from './EquipmentList';
import SettingsMenu from './SettingsMenu';
import DataManagementSection from './DataManagementSection';

interface ProfileDashboardProps {
  onBack: () => void;
  onScanEquipment: () => void;
}

const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ onBack, onScanEquipment }) => {
  const { user } = useApp();
  const { isDesktop: isDesktopFn } = useBreakpoint();
  const isDesktop = isDesktopFn();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in absolute inset-0 z-20 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <UserCircle className="text-brand-600" /> My Profile
            </h2>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className={`p-4 ${isDesktop ? 'max-w-7xl mx-auto w-full grid grid-cols-12 gap-6' : 'space-y-6'}`}>
        
        {/* Left Column (Identity & Biometrics) */}
        <div className={`${isDesktop ? 'col-span-8 space-y-6' : 'space-y-6'}`}>
            <ProfileHeader profile={user} />
            
            <div className={`grid ${isDesktop ? 'grid-cols-2 gap-6' : 'grid-cols-1 gap-6'}`}>
                 <BiometricEditor profile={user} />
                 <InjuriesManager profile={user} />
            </div>

            <EquipmentList onScanMore={onScanEquipment} />
        </div>

        {/* Right Column (Settings & Data) */}
        <div className={`${isDesktop ? 'col-span-4 space-y-6' : 'space-y-6'}`}>
            <SettingsMenu />
            <DataManagementSection />
        </div>

      </div>
    </div>
  );
};

export default React.memo(ProfileDashboard);