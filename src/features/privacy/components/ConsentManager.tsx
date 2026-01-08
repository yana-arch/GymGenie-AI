import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateSettings, addAuditEntry } from '../store/privacySlice';
import { Shield, Info, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

/**
 * ConsentManager Component
 * Manages user consent for optional metadata synchronization
 * Compliant with AC 8 (Explicit consent management)
 */
export const ConsentManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state) => state.privacy);

  const handleConsentChange = (consent: boolean) => {
    dispatch(updateSettings({ consentGiven: consent }));
    
    dispatch(addAuditEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      operation: 'consent_change',
      resource: 'metadata_sync',
      status: 'success',
      details: `User ${consent ? 'granted' : 'revoked'} consent for metadata synchronization`,
    }));
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
          <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Privacy Control Center
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage how your data is processed and shared.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Local-Only Processing
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Core logic runs entirely on your device
            </span>
          </div>
          <div className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">
            Always On
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Metadata Synchronization
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mr-2">
              Sync anonymous usage patterns to improve AI (no PII)
            </span>
          </div>
          <button
            onClick={() => handleConsentChange(!settings.consentGiven)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              settings.consentGiven ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                settings.consentGiven ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 p-2 rounded bg-blue-50 dark:bg-blue-900/20 flex gap-2">
        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 dark:text-blue-300">
          Your health data (heart rate, injuries, PII) is never shared. Encryption is always active for sensitive records.
        </p>
      </div>
    </div>
  );
};

export default ConsentManager;
