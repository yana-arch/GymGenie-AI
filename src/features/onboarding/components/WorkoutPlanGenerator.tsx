import React, { memo, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';
import { WorkoutPlan } from '@/types';
import { generateWorkoutPlanWithAI } from '../../workout/services/WorkoutGenerator'; // New import for AI function

const WorkoutPlanGenerator = memo(() => {
  const { user, setLoading, setPlan, setStep } = useApp();
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = useCallback(async () => {
    if (!user) {
      setError("User profile not found. Please complete onboarding.");
      return;
    }

    setIsGenerating(true);
    setLoading(true); // Activate global loader
    setError(null);
    setGeneratedPlan(null);

    try {
      const generated = await generateWorkoutPlanWithAI(user); // Call the actual AI function
      setGeneratedPlan(generated);
    } catch (err: any) {
      console.error("Error generating plan:", err);
      setError(err.message || "Failed to generate workout plan. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoading(false); // Deactivate global loader
    }
  }, [user, setLoading]);

  const handleAcceptPlan = useCallback(() => {
    if (generatedPlan) {
      setPlan(generatedPlan);
      setStep('dashboard'); // Move to dashboard after accepting plan
    }
  }, [generatedPlan, setPlan, setStep]);

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={32} />
        <p className="text-lg">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto w-full flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Your AI Workout Plan</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Based on your profile, AI will craft a personalized multi-week plan.</p>

      {/* Display User Inputs */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 w-full">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Your Profile Summary:</h3>
        <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
          <li><strong>Name:</strong> {user.name}</li>
          <li><strong>Age:</strong> {user.age}</li>
          <li><strong>Goal:</strong> {user.goal}</li>
          <li><strong>Equipment:</strong> {user.equipment?.length ? user.equipment.join(', ') : 'None specified'}</li>
          {user.injuries && <li><strong>Injuries:</strong> {user.injuries}</li>}
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 w-full text-center">
          {error}
        </div>
      )}

      {/* Generate Plan Button */}
      {!generatedPlan && (
        <button
          onClick={handleGeneratePlan}
          className="w-full bg-brand-600 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-3"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Generating Plan...
            </>
          ) : (
            'Generate My Plan'
          )}
        </button>
      )}

      {/* Generated Plan Preview */}
      {generatedPlan && (
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-sm w-full animate-fade-in">
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-3">Plan Generated Successfully!</h3>
          <p className="text-gray-800 dark:text-gray-200"><strong>Title:</strong> {generatedPlan.title}</p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">{generatedPlan.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Total Weeks: {generatedPlan.totalDurationWeeks}</p>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleAcceptPlan}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-colors"
            >
              Accept Plan & Continue
            </button>
            <button
              onClick={() => setGeneratedPlan(null)} // Allow re-generation
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-xl font-semibold text-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Re-generate
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

WorkoutPlanGenerator.displayName = 'WorkoutPlanGenerator';

export default WorkoutPlanGenerator;
