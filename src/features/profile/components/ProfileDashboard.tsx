import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, UserCircle, X } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import ProfileHeader from './ProfileHeader';
import BiometricEditor from './BiometricEditor';
import InjuriesManager from './InjuriesManager';
import EquipmentList from './EquipmentList';
import SettingsMenu from './SettingsMenu';
import DataManagementSection from './DataManagementSection';
import EquipmentScanner from './EquipmentScanner';

interface ProfileDashboardProps {}

const ProfileDashboard: React.FC<ProfileDashboardProps> = () => {
  const { user } = useApp();
  const { isDesktop: isDesktopFn } = useBreakpoint();
  const isDesktop = isDesktopFn();
  const [showScanner, setShowScanner] = useState(false);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
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

            <EquipmentList onScanMore={() => setShowScanner(true)} />
        </div>

        {/* Right Column (Settings & Data) */}
        <div className={`${isDesktop ? 'col-span-4 space-y-6' : 'space-y-6'}`}>
            <SettingsMenu />
            <DataManagementSection />
        </div>

      </div>

      {/* Equipment Scanner Overlay/Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex-1 overflow-hidden">
              <EquipmentScanner />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProfileDashboard);