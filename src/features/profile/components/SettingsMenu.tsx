import React from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Timer, Key, Server, Lock } from 'lucide-react';
// Assuming we'll have typed hooks for redux state in the future, for now using direct dispatch/select logic via userSlice
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, toggleNotifications, setDefaultRestTime, updateAiConfig } from '@/src/features/user/store/userSlice';
import { AiProviderConfig } from '@/types';

const SettingsMenu: React.FC = () => {
  const dispatch = useDispatch();
  // Using explicit any for now as RootState might not be fully exposed yet
  const preferences = useSelector((state: any) => state.user.preferences);
  const aiConfig = useSelector((state: any) => state.user.aiConfig) as AiProviderConfig;

  const handleAiConfigChange = (field: keyof AiProviderConfig, value: any) => {
    dispatch(updateAiConfig({ [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} className="text-gray-500" />
        <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
      </div>

      <div className="space-y-6">
        {/* API Configuration */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Server size={18} className="text-brand-600" />
            <h4 className="font-bold text-gray-800">API Configuration</h4>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">AI Provider</label>
            <select
              value={aiConfig?.provider || 'google'}
              onChange={(e) => handleAiConfigChange('provider', e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="google">Google Gemini</option>
            </select>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <Key size={12} /> Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={aiConfig?.apiKey || ''}
                onChange={(e) => handleAiConfigChange('apiKey', e.target.value)}
                placeholder="Paste your API key here"
                className="w-full p-2.5 pl-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
              />
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400">
              Key is stored locally and never shared. Leave empty to use default.
            </p>
          </div>

          {/* Custom URL Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustomUrl"
                checked={aiConfig?.useCustomUrl || false}
                onChange={(e) => handleAiConfigChange('useCustomUrl', e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
              />
              <label htmlFor="useCustomUrl" className="text-sm text-gray-700 cursor-pointer select-none">
                Use custom base URL (Proxy)
              </label>
            </div>
          </div>

          {/* Custom URL Input */}
          {aiConfig?.useCustomUrl && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                value={aiConfig?.customUrl || ''}
                onChange={(e) => handleAiConfigChange('customUrl', e.target.value)}
                placeholder="https://your-proxy-url.com"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
              />
            </div>
          )}

          {/* Model Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Model</label>
            <div className="space-y-2">
              <input
                type="text"
                list="model-suggestions"
                value={aiConfig?.model || ''}
                onChange={(e) => handleAiConfigChange('model', e.target.value)}
                placeholder="Enter model name (e.g. gemini-1.5-flash)"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
              />
              <datalist id="model-suggestions">
                <option value="gemini-2.0-flash" />
                <option value="gemini-2.0-pro-exp-02-05" />
                <option value="gemini-1.5-pro" />
                <option value="gemini-1.5-flash" />
                <option value="gemini-1.5-flash-8b" />
              </datalist>
              <p className="text-[10px] text-gray-400">
                You can select a suggested model or type your own custom model name.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 my-4"></div>

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