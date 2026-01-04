import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Download, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { clearUserData } from '@/features/user/store/userSlice';
import { clearWorkoutData } from '@/features/workout/store/workoutSlice';

const DataManagementSection: React.FC = () => {
  const { resetApp } = useApp();
  const dispatch = useDispatch();
  const userData = useSelector((state: any) => state.user);
  const workoutData = useSelector((state: any) => state.workout);

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExport = () => {
    const data = {
        user: userData,
        workout: workoutData,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymgenie-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    dispatch(clearUserData());
    dispatch(clearWorkoutData());
    await resetApp();
    // No need to redirect manually, resetApp usually handles state reset which might trigger auth/onboarding flow
    setShowConfirmReset(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Data Management</h3>
      </div>

      <div className="space-y-3">
        {/* Export Data */}
        <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors border border-gray-100 dark:border-gray-700"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 shadow-sm">
                    <Download size={18} />
                </div>
                <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Export Data</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Download JSON backup</p>
                </div>
            </div>
        </button>

        {/* Reset App */}
        {!showConfirmReset ? (
             <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors border border-red-100 dark:border-red-900 group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-red-500 dark:text-red-400 shadow-sm group-hover:text-red-600 dark:group-hover:text-red-300">
                        <Trash2 size={18} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-red-600 dark:text-red-400 text-sm">Reset Application</p>
                        <p className="text-xs text-red-400 dark:text-red-500">Clear all data & start over</p>
                    </div>
                </div>
            </button>
        ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 animate-fade-in">
                <p className="font-bold text-red-700 dark:text-red-300 mb-1">Are you sure?</p>
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">This action cannot be undone. All your progress and settings will be lost.</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowConfirmReset(false)}
                        className="flex-1 py-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex-1 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 shadow-sm"
                    >
                        Yes, Reset
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DataManagementSection);
