import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Gender, FitnessGoal, UserProfile } from '@/types';
import { ArrowRight, ArrowLeft, User, Target, Ruler, Check } from 'lucide-react';

const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep > step ? 'bg-brand-600 text-white' :
              currentStep === step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {currentStep > step ? <Check size={16} /> : step}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 w-12 transition-all duration-300 ${currentStep > step ? 'bg-brand-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};


const Onboarding = () => {
  const { setUser, setStep: setAppStep } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Now includes the plan generation step

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

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      handleNext();
      return;
    }

    // Final submission logic
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
    setAppStep('generatePlan'); // Transition to the new plan generation step
  };

  return (
    <div className="min-h-full flex flex-col md:grid md:grid-cols-12 bg-white animate-fade-in">
      <div className="md:col-span-5 bg-brand-50/50 p-6 md:p-10 border-r border-gray-100 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {currentStep === 1
                ? 'About You'
                : currentStep === 2
                ? 'Your Fitness Goal'
                : 'Generate Your Plan'} {/* New title for step 3 */}
            </h1>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              {currentStep === 1
                ? "Let's get some basic information to personalize your experience."
                : currentStep === 2
                ? "Tell us what you want to achieve. This helps the AI build the perfect plan for you."
                : "Ready to get started? Let AI craft a personalized workout plan for you."} {/* New description for step 3 */}
            </p>
          </div>
        </div>
        <div className="hidden md:block space-y-4 mt-12">
           <div className={`flex gap-3 items-start p-4 rounded-xl transition-all duration-300 ${currentStep === 1 ? 'bg-white shadow-sm border border-gray-100' : 'bg-transparent'}`}>
              <Ruler className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800">Your Metrics</p>
                <p className="text-xs text-gray-500">Your age, height, and weight help us calculate your metabolic rate.</p>
              </div>
           </div>
           <div className={`flex gap-3 items-start p-4 rounded-xl transition-all duration-300 ${currentStep === 2 ? 'bg-white shadow-sm border border-gray-100' : 'bg-transparent'}`}>
              <Target className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800">Your Goal</p>
                <p className="text-xs text-gray-500">Workouts adapt based on whether you want to cut, bulk, or maintain.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="md:col-span-7 p-6 md:p-10 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-grow space-y-6 max-w-lg mx-auto md:mx-0 w-full">
          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input type="text" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm text-gray-900 placeholder-gray-400" placeholder="Your Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: Number(e.target.value)})} />
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Goal</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(FitnessGoal).map(goal => (
                    <button key={goal} type="button" onClick={() => setFormData({...formData, goal})} className={`p-3 rounded-xl text-xs font-semibold border transition-all ${formData.goal === goal ? 'bg-brand-500 text-white border-brand-500 shadow-md transform scale-[1.02]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Injuries / Notes (Optional)</label>
                <textarea className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 min-h-[100px]" rows={2} placeholder="e.g. Lower back pain, left knee..." value={formData.injuries} onChange={e => setFormData({...formData, injuries: e.target.value})} />
              </div>
            </>
          )}

          <div className="pt-6 mt-auto flex items-center gap-4">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="flex items-center justify-center gap-2 text-gray-600 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                <ArrowLeft size={20} /> Back
              </button>
            )}
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all md:text-lg">
              {currentStep === totalSteps ? 'Finish' : 'Continue'} <ArrowRight size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
