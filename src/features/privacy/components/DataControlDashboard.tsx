import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleDataCategory } from '../store/privacySlice';
import { PrivacyAuditService } from '../services/PrivacyAuditService';
import { Shield, Activity, MapPin, Database, Heart, AlertTriangle, Check, X, Info } from 'lucide-react';
import { DataCategories } from '../types/privacy.types';
import Card from '@/components/ui/Card';

/**
 * DataControlDashboard Component
 * Provides granular controls for data categories used in AI recommendations.
 * Compliant with FR18, AC1, AC2, AC5
 */
const DataControlDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.privacy);
  const { dataCategories } = settings;

  const handleToggle = (category: keyof DataCategories) => {
    dispatch(toggleDataCategory(category));
    PrivacyAuditService.logSettingChange(`data_category_${category}`, !dataCategories[category]);
  };

  const categories = [
    {
      id: 'injuryHistory' as keyof DataCategories,
      label: 'Injury History',
      description: 'Used to adapt exercises for safety and avoid aggravating past injuries.',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      sensitive: true
    },
    {
      id: 'biologicalData' as keyof DataCategories,
      label: 'Biological Data',
      description: 'Heart rate and other biometric data for effort adjustment.',
      icon: <Heart className="w-5 h-5 text-red-500" />,
      sensitive: true
    },
    {
      id: 'locationData' as keyof DataCategories,
      label: 'Location Data',
      description: 'Used for suggesting nearby gym equipment and running routes.',
      icon: <MapPin className="w-5 h-5 text-blue-500" />,
      sensitive: false
    },
    {
      id: 'workoutPatterns' as keyof DataCategories,
      label: 'Workout Patterns',
      description: 'Analysis of your consistency and favorite exercise types.',
      icon: <Activity className="w-5 h-5 text-green-500" />,
      sensitive: false
    },
    {
      id: 'usageAnalytics' as keyof DataCategories,
      label: 'Usage Analytics',
      description: 'How you interact with the app to improve the AI experience.',
      icon: <Database className="w-5 h-5 text-purple-500" />,
      sensitive: false
    }
  ];

  const protectedCount = Object.values(dataCategories).filter(v => !v).length;
  const sharedCount = Object.values(dataCategories).filter(v => v).length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30">
              <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Data Control Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Granular privacy preferences for AI recommendations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
              {sharedCount} Shared
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {protectedCount} Protected
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                dataCategories[cat.id] 
                  ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm' 
                  : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${
                  dataCategories[cat.id] 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 opacity-60'
                }`}>
                  {cat.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.label}</h3>
                    {cat.sensitive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                        Sensitive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm">
                    {cat.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(cat.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  dataCategories[cat.id] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dataCategories[cat.id] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex gap-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Privacy Transparency Mode</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              When a category is protected, our Privacy Shield automatically redacts it from AI prompts. 
              The AI will acknowledge that it cannot see this data and will prioritize generic safety defaults.
            </p>
          </div>
        </div>
      </Card>
      
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest font-bold">
        <Shield className="w-3 h-3" />
        Zero-Trust Data Protection Active
      </div>
    </div>
  );
};

export default DataControlDashboard;
