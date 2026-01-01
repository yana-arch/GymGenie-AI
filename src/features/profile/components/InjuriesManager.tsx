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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" />
                Injuries & Constraints
            </h3>
            <button 
                onClick={() => setIsEditing(true)}
                className="text-sm font-bold text-brand-600 flex items-center gap-1 hover:text-brand-700 transition-colors"
            >
                <Plus size={16} /> Update
            </button>
        </div>
        
        {injuryList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {injuryList.map((injury, index) => (
                    <span key={index} className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-sm font-medium border border-red-100">
                        {injury}
                    </span>
                ))}
            </div>
        ) : (
            <p className="text-gray-400 text-sm italic">No injuries recorded. Great!</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-md p-5 ring-2 ring-red-50">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Edit Constraints</h3>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
                List any injuries or physical limitations (comma separated):
            </label>
            <textarea 
                value={injuriesText}
                onChange={(e) => setInjuriesText(e.target.value)}
                placeholder="e.g. Lower back pain, Left knee injury"
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all h-32 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
                The AI will try to avoid exercises that aggravate these conditions.
            </p>
        </div>
    </div>
  );
};

export default React.memo(InjuriesManager);