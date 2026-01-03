import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { ShieldAlert, Plus, X, Save } from 'lucide-react';
import { updateProfile } from '@/src/features/user/store/userSlice';
import { useDispatch } from 'react-redux';

interface InjuriesManagerProps {
  profile: UserProfile;
}

const InjuriesManager: React.FC<InjuriesManagerProps> = ({ profile }) => {
  const { setUser } = useApp();
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [injuriesText, setInjuriesText] = useState(profile.injuries || '');

  useEffect(() => {
    setInjuriesText(profile.injuries || '');
  }, [profile]);

  const handleSave = () => {
    const updatedProfile = {
        ...profile,
        injuries: injuriesText
    };

    dispatch(updateProfile(updatedProfile));
    setUser(updatedProfile);
    setIsEditing(false);
  };

  if (!isEditing) {
    const injuryList = profile.injuries
        ? profile.injuries.split(',').map(i => i.trim()).filter(Boolean)
        : [];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" />
                Injuries & Constraints
            </h3>
            <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
                <Plus size={16} /> Update
            </button>
        </div>
        
        {injuryList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {injuryList.map((injury, index) => (
                    <span key={index} className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-sm font-medium border border-red-100 dark:border-red-800">
                        {injury}
                    </span>
                ))}
            </div>
        ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm italic">No injuries recorded. Great!</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-700 shadow-md p-5 ring-2 ring-red-50 dark:ring-red-900/20">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Constraints</h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
                >
                    <Save size={16} /> Save
                </button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                List any injuries or physical limitations (comma separated):
            </label>
            <textarea
                value={injuriesText}
                onChange={(e) => setInjuriesText(e.target.value)}
                placeholder="e.g. Lower back pain, Left knee injury"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/40 outline-none transition-all h-32 resize-none text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                The AI will try to avoid exercises that aggravate these conditions.
            </p>
        </div>
    </div>
  );
};

export default React.memo(InjuriesManager);
