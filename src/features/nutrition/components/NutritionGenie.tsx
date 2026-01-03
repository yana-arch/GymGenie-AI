import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { generateRecipesFromImage, getMealSuggestions } from '@/src/features/nutrition/services/DietService';
import { Recipe } from '@/types';
import { Camera, ChefHat, Flame, Clock, Utensils, Loader2, UploadCloud, RefreshCw, BarChart, Sparkles, PlusCircle } from 'lucide-react';

const NutritionGenie = () => {
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scan'>('overview');
  const [mealSuggestions, setMealSuggestions] = useState<string[]>([]);

  const handleCreateMealPlan = async () => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const suggestions = await getMealSuggestions(user);
      setMealSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to get meal suggestions", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const processFile = (file: File) => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const result = await generateRecipesFromImage(base64String, user);
        setRecipes(result);
        setAnalyzing(false);
        setActiveTab('scan'); // Switch to scan results
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
      alert('Failed to analyze food. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
  };
  
  const renderScanTab = () => (
    <>
      {recipes.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center space-y-6">
           <div
              className={`w-full max-w-md border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-white dark:bg-gray-800 ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !analyzing && fileInputRef.current?.click()}
           >
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4 text-orange-500">
                 {analyzing ? <Loader2 className="animate-spin" size={32} /> : <Camera size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                {analyzing ? 'Analyzing Ingredients...' : 'Take a photo of your food'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                Snap your fridge or pantry. We'll suggest meals.
              </p>
           </div>
           <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
           <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Suggested Meals from Scan</h2>
             <button onClick={() => setRecipes([])} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-orange-500">
               <RefreshCw size={14} /> Scan Again
             </button>
           </div>
           {recipes.map(recipe => (
             <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{recipe.name}</h3>
                      <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"><Flame size={12} /> {recipe.calories} kcal</span>
                   </div>
                   <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span><strong>P:</strong> {recipe.protein}g</span>
                      <span><strong>C:</strong> {recipe.carbs}g</span>
                      <span><strong>F:</strong> {recipe.fats}g</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {recipe.cookingTimeMinutes}m</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </>
  );

  const renderOverviewTab = () => (
    <div className="max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Stats & Actions */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Calorie Goal</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{user?.tdee} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">kcal</span></p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">1,200 <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/ {user?.tdee} kcal</span></p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Macros (P/C/F)</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">80g / 150g / 40g</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('scan')}
              className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-brand-700 transition-colors"
            >
              <PlusCircle size={20} /> Add Food
            </button>
            <button
              onClick={handleCreateMealPlan}
              disabled={analyzing}
              className="w-full bg-gray-800 dark:bg-gray-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-70"
            >
              {analyzing ? <Loader2 className="animate-spin" size={20} /> : <ChefHat size={20} />}
              {analyzing ? 'Generating...' : 'Create Meal Plan'}
            </button>
          </div>

          {/* Desktop Extra: Weekly Analysis placeholder */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><BarChart size={20} className="text-orange-500" /> Weekly Nutrition</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">Last 7 Days</span>
            </div>
            <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 text-sm">
               Chart visualization available in Pro
            </div>
          </div>
        </div>

        {/* Right Column - Meal Ideas */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-full max-h-[600px] overflow-y-auto">
             <div className="flex items-center gap-2 mb-4">
               <Sparkles size={20} className="text-purple-500" />
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Meal Suggestions</h3>
             </div>
             
             {mealSuggestions.length > 0 ? (
               <div className="space-y-3">
                 {mealSuggestions.map((meal, idx) => (
                   <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                     <span className="mt-0.5 text-purple-500">•</span>
                     {meal}
                   </div>
                 ))}
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-4">
                    Scan ingredients or use the Meal Planner to get personalized AI suggestions.
                    </p>
                    <button
                        onClick={() => setActiveTab('scan')}
                        className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-purple-700 transition-colors"
                    >
                        Scan Ingredients
                    </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 md:bg-white md:dark:bg-gray-800 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Utensils className="text-brand-600 dark:text-brand-400" /> Kitchen
            </h2>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl max-w-sm mx-auto">
          <button onClick={() => setActiveTab('overview')} className={`w-full font-bold text-sm py-2.5 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-600 shadow dark:shadow-gray-900/20 text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Overview</button>
          <button onClick={() => setActiveTab('scan')} className={`w-full font-bold text-sm py-2.5 rounded-lg transition-all ${activeTab === 'scan' ? 'bg-white dark:bg-gray-600 shadow dark:shadow-gray-900/20 text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>Scan Food</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'overview' ? renderOverviewTab() : renderScanTab()}
      </div>
    </div>
  );
};

export default NutritionGenie;
