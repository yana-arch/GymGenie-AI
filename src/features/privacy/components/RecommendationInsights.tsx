import React from 'react';
import { useAppSelector } from '@/store';
import { Shield, ShieldCheck, ShieldAlert, Info, Clock, ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';

/**
 * RecommendationInsights Component
 * Explains which data categories were used or protected for the last AI recommendation.
 * Compliant with FR21, AC4
 */
const RecommendationInsights: React.FC = () => {
  const { lastSanitizationInsights, lastSanitizationTimestamp } = useAppSelector((state) => state.privacy);

  if (!lastSanitizationInsights) {
    return (
      <Card className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-dashed border-gray-200 dark:border-gray-800">
        <div className="flex flex-col items-center text-center py-4">
          <Info className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent AI recommendations to analyze.
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            Privacy Shield is standby
          </p>
        </div>
      </Card>
    );
  }

  const { categoriesShared, categoriesProtected } = lastSanitizationInsights;
  const timeString = lastSanitizationTimestamp 
    ? new Date(lastSanitizationTimestamp).toLocaleTimeString() 
    : 'Unknown';

  return (
    <Card className="p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Shield className="w-24 h-24" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Recommendation Insights</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Last analyzed: {timeString}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Data Categories Shared
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoriesShared.length > 0 ? (
              categoriesShared.map((cat) => (
                <span key={cat} className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-[10px] font-medium text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800/50">
                  {cat.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None - Maximum privacy active</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Data Categories Protected
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoriesProtected.length > 0 ? (
              categoriesProtected.map((cat) => (
                <span key={cat} className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
                  {cat.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None - All relevant context provided</span>
            )}
            <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-[10px] font-medium text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
              Personal Identifiable Information (PII)
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-3">
            <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 h-fit mt-0.5">
              <Info className="w-3 h-3 text-blue-500" />
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              Your <span className="text-blue-600 dark:text-blue-400 font-medium">PII is always protected</span> by our Zero-Trust architecture. 
              The AI only receives sanitized tokens for other categories based on your 
              <span className="text-brand-600 dark:text-brand-400 font-medium"> Data Control Dashboard</span> settings.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecommendationInsights;
