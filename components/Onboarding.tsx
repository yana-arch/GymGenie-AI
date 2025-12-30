import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Gender, FitnessGoal, UserProfile } from '../types';
import { ArrowRight, User, Info, Target, Ruler } from 'lucide-react';

const Onboarding = () => {
  const { setUser, setStep } = useApp();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    heightCm: 170,
    weightKg: 70,
    gender: Gender.Male,
    goal: FitnessGoal.MuscleGain,
    injuries: ''
  });

  const calculateMetrics = (weight: number, height: number, age: number, gender: Gender) => {
    // BMI
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    // TDEE (Mifflin-St Jeor) - Base BMR
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === Gender.Male ? 5 : -161;
    
    // Assuming sedentary/light active baseline for simplicity, multipy by 1.2
    const tdee = Math.round(bmr * 1.2); 
    return { bmi, tdee };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.heightCm || !formData.weightKg) return;

    const { bmi, tdee } = calculateMetrics(
      formData.weightKg, 
      formData.heightCm, 
      formData.age, 
      formData.gender as Gender
    );

    const fullProfile: UserProfile = {
      ...(formData as UserProfile),
      bmi,
      tdee
    };

    setUser(fullProfile);
    setStep('scanning');
  };

  return (
    <div className="min-h-full flex flex-col md:grid md:grid-cols-12 bg-white animate-fade-in">
      
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <div className="md:col-span-5 bg-brand-50/50 p-6 md:p-10 border-r border-gray-100 flex flex-col justify-between">
        <div>
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 text-brand-600 shadow-sm mx-auto md:mx-0">
            <User size={32} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Setup Profile</h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Let's tailor the AI to your body mechanics and fitness aspirations. 
              Accurate data ensures a safe and effective plan.
            </p>
          </div>
        </div>

        {/* Desktop Tips */}
        <div className="hidden md:block space-y-4 mt-12">
           <div className="flex gap-3 items-start p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Target className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800">Goal Specific</p>
                <p className="text-xs text-gray-500">Workouts adapt based on whether you want to cut, bulk, or maintain.</p>
              </div>
           </div>
           <div className="flex gap-3 items-start p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <Ruler className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800">Calorie Check</p>
                <p className="text-xs text-gray-500">We'll calculate your BMI and TDEE instantly.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="md:col-span-7 p-6 md:p-10 md:overflow-y-auto">
        <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto md:mx-0">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm text-gray-900 placeholder-gray-400"
              placeholder="Your Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900"
                value={formData.age}
                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 appearance-none"
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                >
                  {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900"
                value={formData.heightCm}
                onChange={e => setFormData({...formData, heightCm: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900"
                value={formData.weightKg}
                onChange={e => setFormData({...formData, weightKg: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.values(FitnessGoal).map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setFormData({...formData, goal})}
                  className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                    formData.goal === goal 
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md transform scale-[1.02]' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Injuries / Notes</label>
            <textarea
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 min-h-[100px]"
              rows={2}
              placeholder="e.g. Lower back pain, left knee..."
              value={formData.injuries}
              onChange={e => setFormData({...formData, injuries: e.target.value})}
            />
          </div>

          {/* Desktop Button (Inline) / Mobile Button (Sticky) */}
          <div className="pt-4 md:pt-6">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all md:text-lg"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Sticky Footer Spacer (Hidden on Desktop) */}
      <div className="md:hidden p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 mt-auto sticky bottom-0 z-10">
         {/* Button is actually inside the form now, we hide this spacer or move button here for mobile. 
             To follow the prompt "Action buttons inside the flow... on PC", 
             we can keep the button in the form and use CSS to make it sticky on mobile if desired.
             
             However, typically if it's in the form flow, on mobile it might scroll off screen.
             To keep the "Sticky Footer" on mobile but "Flow" on desktop:
         */}
         <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all"
        >
          Continue <ArrowRight size={20} />
        </button>
      </div>
       
       <style>{`
         @media (min-width: 768px) {
           /* Hide the mobile sticky footer */
           .md\\:hidden { display: none !important; }
           /* Show the form button */
           form button[type="submit"] { display: flex !important; }
         }
         @media (max-width: 767px) {
           /* Hide the form button to avoid duplicate */
           form button[type="submit"] { display: none !important; }
         }
       `}</style>
    </div>
  );
};

export default Onboarding;