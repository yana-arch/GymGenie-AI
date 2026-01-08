import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearAuditLog } from '../store/privacySlice';
import { PrivacyAuditEntry } from '../types/privacy.types';
import { 
  Shield, 
  Brain, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  Settings, 
  Trash2, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Info
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui';

/**
 * PrivacyAuditLog Component
 * Provides a transparent view of all privacy-related events and AI data usage history.
 * Compliant with AC 4, 5, 6, 7
 */
const PrivacyAuditLog: React.FC = () => {
  const dispatch = useAppDispatch();
  const { auditLog } = useAppSelector((state) => state.privacy);
  const [filter, setFilter] = useState<'all' | 'ai_inference' | 'security' | 'settings'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredLog = useMemo(() => {
    if (filter === 'all') return auditLog;
    if (filter === 'ai_inference') return auditLog.filter(entry => entry.operation === 'ai_inference');
    if (filter === 'security') return auditLog.filter(entry => ['encrypt', 'decrypt', 'transmission'].includes(entry.operation));
    if (filter === 'settings') return auditLog.filter(entry => ['consent_change', 'setting_change'].includes(entry.operation));
    return auditLog;
  }, [auditLog, filter]);

  const handleClear = () => {
    dispatch(clearAuditLog());
    setShowClearConfirm(false);
  };

  const getEventIcon = (operation: PrivacyAuditEntry['operation']) => {
    switch (operation) {
      case 'ai_inference': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'encrypt': return <Lock className="w-4 h-4 text-green-500" />;
      case 'decrypt': return <Unlock className="w-4 h-4 text-amber-500" />;
      case 'transmission': return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'setting_change': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'consent_change': return <Shield className="w-4 h-4 text-brand-500" />;
      case 'access': return <Search className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventLabel = (operation: PrivacyAuditEntry['operation']) => {
    switch (operation) {
      case 'ai_inference': return 'AI Inference';
      case 'encrypt': return 'Data Encrypted';
      case 'decrypt': return 'Data Decrypted';
      case 'transmission': return 'Anonymized Transmission';
      case 'setting_change': return 'Setting Modified';
      case 'consent_change': return 'Consent Updated';
      case 'access': return 'Data Accessed';
      default: return operation;
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(ts));
  };

  const CATEGORY_LABELS: Record<string, string> = {
    injuryHistory: 'Injury History',
    biologicalData: 'Biological Metrics',
    locationData: 'Location & GPS',
    workoutPatterns: 'Training Patterns',
    usageAnalytics: 'Usage Habits'
  };

  const formatDataCategories = (categories: PrivacyAuditEntry['dataCategories']) => {
    if (!categories) return null;
    const shared = Object.entries(categories)
      .filter(([_, v]) => v)
      .map(([k]) => CATEGORY_LABELS[k] || k);
    
    const protected_cats = Object.entries(categories)
      .filter(([_, v]) => !v)
      .map(([k]) => CATEGORY_LABELS[k] || k);

    return (
      <div className="mt-2 space-y-2">
        {shared.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tight mr-1">Shared:</span>
            {shared.map(cat => (
              <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30">
                {cat}
              </span>
            ))}
          </div>
        )}
        {protected_cats.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight mr-1">Protected:</span>
            {protected_cats.map(cat => (
              <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-md font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Privacy Audit History</h2>
        </div>
        <div className="flex items-center gap-2">
          {showClearConfirm ? (
            <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 px-2 uppercase tracking-tight">Confirm Clear?</span>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 px-4 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 border-none rounded-md" 
                  onClick={handleClear}
                >
                  Clear All
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="h-7 px-4 text-[10px] font-bold border-none bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md" 
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear Audit History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {(['all', 'ai_inference', 'security', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === t 
                ? 'bg-brand-600 text-white border-brand-500 shadow-sm' 
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-brand-200'
            }`}
          >
            {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 pl-6 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredLog.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No privacy events recorded yet.</p>
          </div>
        ) : (
          filteredLog.map((entry) => (
            <div key={entry.id} className="relative">
              {/* Timeline Dot */}
              <div className={`absolute -left-[31px] mt-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 flex items-center justify-center ${
                entry.status === 'success' ? 'border-green-500' : 'border-red-500'
              }`}>
                {entry.status === 'success' ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>

              <div 
                className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                  expandedId === entry.id 
                    ? 'bg-white dark:bg-gray-800 border-brand-200 dark:border-brand-900/50 shadow-md' 
                    : 'bg-gray-50/30 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                      expandedId === entry.id ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {getEventIcon(entry.operation)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {getEventLabel(entry.operation)}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                        {entry.resource}
                      </p>
                    </div>
                  </div>
                  {expandedId === entry.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />}
                </div>

                {expandedId === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                      {entry.details && (
                        <div className="flex gap-2">
                          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                            {entry.details}
                          </p>
                        </div>
                      )}
                      
                      {entry.dataCategories && formatDataCategories(entry.dataCategories)}

                      <div className="flex items-center justify-between pt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          entry.status === 'success' 
                            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                            : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        }`}>
                          {entry.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {entry.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrivacyAuditLog;
