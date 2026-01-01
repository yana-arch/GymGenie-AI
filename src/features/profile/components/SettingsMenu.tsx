import React from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Timer } from 'lucide-react';
// Assuming we'll have typed hooks for redux state in the future, for now using direct dispatch/select logic via userSlice
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, toggleNotifications, setDefaultRestTime } from '@/src/features/user/store/userSlice';

const SettingsMenu: React.FC = () => {
  const dispatch = useDispatch();
  // Using explicit any for now as RootState might not be fully exposed yet
  const preferences = useSelector((state: any) => state.user.preferences);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-gray-500" />
        <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
      </div>

      <div className="space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    {preferences.theme === 'dark' ? <Moon size={18} /> : 
                     preferences.theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />}
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">App Theme</p>
                    <p className="text-xs text-gray-500 capitalize">{preferences.theme} Mode</p>
                </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
                {['light', 'system', 'dark'].map((theme) => (
                    <button
                        key={theme}
                        onClick={() => dispatch(setTheme(theme as any))}
                        className={`p-1.5 rounded-md transition-all ${
                            preferences.theme === theme ? 'bg-white shadow-sm text-brand-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={theme}
                    >
                        {theme === 'light' ? <Sun size={14} /> : 
                         theme === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                    </button>
                ))}
            </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${preferences.notifications ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Bell size={18} />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Notifications</p>
                    <p className="text-xs text-gray-500">Workout reminders</p>
                </div>
            </div>
            <button 
                onClick={() => dispatch(toggleNotifications())}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                    preferences.notifications ? 'bg-brand-500' : 'bg-gray-200'
                }`}
            >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    preferences.notifications ? 'left-6' : 'left-1'
                }`} />
            </button>
        </div>

        {/* Default Rest Timer */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Timer size={18} />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">Default Rest</p>
                    <p className="text-xs text-gray-500">Timer duration</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => dispatch(setDefaultRestTime(preferences.defaultRestTime - 15))}
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                >-</button>
                 <span className="font-bold text-sm min-w-[3ch] text-center">{preferences.defaultRestTime}s</span>
                 <button 
                    onClick={() => dispatch(setDefaultRestTime(preferences.defaultRestTime + 15))}
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                >+</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsMenu);