import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { useApp } from '@/context/AppContext';
import { Edit2, Save, X, Activity } from 'lucide-react';
import { updateProfile } from '@/features/user/store/userSlice';
import { useDispatch } from 'react-redux';

interface BiometricEditorProps {
  profile: UserProfile;
}

const BiometricEditor: React.FC<BiometricEditorProps> = ({ profile }) => {
  const { setUser } = useApp(); // Used to sync with context if needed, but we should dispatch to redux
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age
  });

  // Reset form when profile changes externally
  useEffect(() => {
    setFormData({
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        age: profile.age
    });
  }, [profile]);

  const calculateMetrics = (weight: number, height: number, age: number, gender: string) => {
    const heightM = height / 100;
    const bmi = +(weight / (heightM * heightM)).toFixed(1);
    
    // Mifflin-St Jeor Equation
    let tdee = 10 * weight + 6.25 * height - 5 * age;
    tdee += gender === 'Male' ? 5 : -161;
    // Assuming sedentary multiplier (1.2) as base, can be refined later
    tdee = Math.round(tdee * 1.2);
    
    return { bmi, tdee };
  };

  const handleSave = () => {
    const { bmi, tdee } = calculateMetrics(formData.weightKg, formData.heightCm, formData.age, profile.gender);
    
    const updatedProfile = {
        ...profile,
        ...formData,
        bmi,
        tdee
    };

    dispatch(updateProfile(updatedProfile));
    setUser(updatedProfile); // Sync Context
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Activity size={20} className="text-brand-600 dark:text-brand-400" />
                Biometrics
            </h3>
            <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
                <Edit2 size={16} /> Edit
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Weight</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.weightKg} kg</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Height</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.heightCm} cm</p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-500/10 p-3 rounded-xl border border-brand-100 dark:border-brand-500/20 backdrop-blur-sm">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase">BMI</p>
                <p className="text-lg font-bold text-brand-900 dark:text-brand-200 truncate" title={String(profile.bmi)}>
                    {Number(profile.bmi).toFixed(1)}
                </p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-500/10 p-3 rounded-xl border border-brand-100 dark:border-brand-500/20 backdrop-blur-sm">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium uppercase">TDEE (Est.)</p>
                <p className="text-lg font-bold text-brand-900 dark:text-brand-200">~{profile.tdee} kcal</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-brand-200 dark:border-brand-700 shadow-md p-5 ring-2 ring-brand-50 dark:ring-brand-900/20">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Update Stats</h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-700 transition-colors"
                >
                    <Save size={16} /> Save
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg)</label>
                <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/40 outline-none transition-all font-bold text-lg text-gray-900 dark:text-gray-100"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
                <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData(prev => ({ ...prev, heightCm: Number(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/40 outline-none transition-all font-bold text-lg text-gray-900 dark:text-gray-100"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: Number(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900/40 outline-none transition-all font-bold text-lg text-gray-900 dark:text-gray-100"
                />
            </div>
        </div>
    </div>
  );
};

export default React.memo(BiometricEditor);
