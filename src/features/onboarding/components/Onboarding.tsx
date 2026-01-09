import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Gender, FitnessGoal, UserProfile, AiProviderConfig } from '@/types';
import { ArrowRight, ArrowLeft, User, Target, Ruler, Check, Key, Globe } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateAiConfig } from '@/features/user/store/userSlice';

const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep > step ? 'bg-brand-600 text-white' :
              currentStep === step ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            {currentStep > step ? <Check size={16} /> : step}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 w-12 transition-all duration-300 ${currentStep > step ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};


const Onboarding = () => {
  const { setUser, setStep: setAppStep } = useApp();
  const dispatch = useDispatch();
  const aiConfig = useSelector((state: any) => state.user.aiConfig) as AiProviderConfig;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Includes AI config step and plan generation step

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

  const handleAiConfigChange = (field: keyof AiProviderConfig, value: any) => {
    dispatch(updateAiConfig({ [field]: value }));
  };

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
    <div className="min-h-full flex flex-col md:grid md:grid-cols-12 bg-white dark:bg-gray-800 animate-fade-in">
      <div className="md:col-span-5 bg-brand-50/50 dark:bg-gray-900 p-6 md:p-10 border-r border-gray-100 dark:border-gray-700 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {currentStep === 1
                ? 'About You'
                : currentStep === 2
                ? 'Your Fitness Goal'
                : currentStep === 3
                ? 'AI Configuration'
                : 'Generate Your Plan'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
              {currentStep === 1
                ? "Let's get some basic information to personalize your experience."
                : currentStep === 2
                ? "Tell us what you want to achieve. This helps the AI build the perfect plan for you."
                : currentStep === 3
                ? "Configure your AI settings to generate personalized workout plans."
                : "Ready to get started? Let AI craft a personalized workout plan for you."}
            </p>
          </div>
        </div>
        <div className="hidden md:block space-y-4 mt-12">
           <div className={`flex gap-3 items-start p-4 rounded-xl transition-all duration-300 ${currentStep === 1 ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700' : 'bg-transparent'}`}>
              <Ruler className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Your Metrics</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your age, height, and weight help us calculate your metabolic rate.</p>
              </div>
           </div>
           <div className={`flex gap-3 items-start p-4 rounded-xl transition-all duration-300 ${currentStep === 2 ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700' : 'bg-transparent'}`}>
              <Target className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Your Goal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Workouts adapt based on whether you want to cut, bulk, or maintain.</p>
              </div>
           </div>
           <div className={`flex gap-3 items-start p-4 rounded-xl transition-all duration-300 ${currentStep === 3 ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700' : 'bg-transparent'}`}>
              <Key className="text-brand-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">AI Setup</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure your AI settings for personalized workout plans.</p>
              </div>
           </div>
        </div>
      </div>

      <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-center items-center">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg w-full">
          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input type="text" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Your Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Age</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100 appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Height (cm)</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100" value={formData.heightCm} onChange={e => setFormData({...formData, heightCm: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
                  <input type="number" required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: Number(e.target.value)})} />
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Goal</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(FitnessGoal).map(goal => (
                    <button key={goal} type="button" onClick={() => setFormData({...formData, goal})} className={`p-3 rounded-xl text-xs font-semibold border transition-all ${formData.goal === goal ? 'bg-brand-500 text-white border-brand-500 shadow-md transform scale-[1.02]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Injuries / Notes (Optional)</label>
                <textarea className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100 min-h-[100px]" rows={2} placeholder="e.g. Lower back pain, left knee..." value={formData.injuries} onChange={e => setFormData({...formData, injuries: e.target.value})} />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI Provider</label>
                <select
                  value={aiConfig?.provider || 'google'}
                  onChange={(e) => handleAiConfigChange('provider', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="google">Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Key size={14} /> Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={aiConfig?.apiKey || ''}
                    onChange={(e) => handleAiConfigChange('apiKey', e.target.value)}
                    placeholder="Paste your API key here (optional)"
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm font-mono text-gray-900 dark:text-gray-100"
                  />
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">Google AI Studio</a>
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomUrl"
                      checked={aiConfig?.useCustomUrl || false}
                      onChange={(e) => handleAiConfigChange('useCustomUrl', e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded border-gray-300 dark:border-gray-600 focus:ring-brand-500"
                    />
                    <label htmlFor="useCustomUrl" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      Use custom base URL (Proxy)
                    </label>
                  </div>
                </div>
                {aiConfig?.useCustomUrl && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={aiConfig?.customUrl || ''}
                      onChange={(e) => handleAiConfigChange('customUrl', e.target.value)}
                      placeholder="https://your-proxy-url.com"
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm font-mono text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI Model</label>
                <input
                  type="text"
                  list="model-suggestions"
                  value={aiConfig?.model || ''}
                  onChange={(e) => handleAiConfigChange('model', e.target.value)}
                  placeholder="Enter model name (e.g. gemini-1.5-flash)"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm font-mono text-gray-900 dark:text-gray-100"
                />
                <datalist id="model-suggestions">
                  <option value="gemini-2.0-flash" />
                  <option value="gemini-2.0-pro-exp-02-05" />
                  <option value="gemini-1.5-pro" />
                  <option value="gemini-1.5-flash" />
                  <option value="gemini-1.5-flash-8b" />
                </datalist>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to use default model
                </p>
              </div>
            </>
          )}

          <div className="pt-6 flex items-center gap-4">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all">
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
