import React from 'react';
import { useAppSelector } from '@/store';
import { Shield, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';

/**
 * PrivacyStatus Component
 * Displays the current privacy and local processing status to the user
 * Compliant with AC 6 (Privacy status indicator)
 */
export const PrivacyStatus: React.FC = () => {
  const { settings, isLocalProcessingActive, lastSanitizationTimestamp } = useAppSelector((state) => state.privacy);
  
  const [showSanitizationPulse, setShowSanitizationPulse] = React.useState(false);

  React.useEffect(() => {
    if (lastSanitizationTimestamp) {
      const diff = Date.now() - lastSanitizationTimestamp;
      if (diff < 5000) {
        setShowSanitizationPulse(true);
        const timer = setTimeout(() => setShowSanitizationPulse(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastSanitizationTimestamp]);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 border transition-all duration-500 ${
      showSanitizationPulse 
        ? 'border-green-400 dark:border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
        : 'border-brand-100 dark:border-brand-800'
    }`}>
      {isLocalProcessingActive ? (
        <ShieldCheck className={`w-4 h-4 transition-colors duration-300 ${showSanitizationPulse ? 'text-green-400' : 'text-green-500'}`} />
      ) : (
        <ShieldAlert className="w-4 h-4 text-amber-500" />
      )}
      
      <div className="flex flex-col">
        <span className="text-xs font-medium text-brand-900 dark:text-brand-50 leading-none">
          {showSanitizationPulse ? 'Privacy Shield Active' : (isLocalProcessingActive ? 'Local Processing' : 'Cloud Integration')}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <Lock className="w-2.5 h-2.5 text-brand-400 dark:text-brand-500" />
          <span className="text-[10px] text-brand-500 dark:text-brand-400">
            {showSanitizationPulse ? 'Data Anonymized' : 'AES-256 Encrypted'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PrivacyStatus;
