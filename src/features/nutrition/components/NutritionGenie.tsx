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

  // Removed automatic AI meal suggestions based on feedback
  /*
  useEffect(() => {
    if (activeTab === 'overview' && user && mealSuggestions.length === 0) {
      const fetchSuggestions = async () => {
        const suggestions = await getMealSuggestions(user);
        setMealSuggestions(suggestions);
      };
      fetchSuggestions();
    }
  }, [activeTab, user, mealSuggestions.length]);
  */

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
              className={`w-full max-w-md border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-white ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !analyzing && fileInputRef.current?.click()}
           >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
                 {analyzing ? <Loader2 className="animate-spin" size={32} /> : <Camera size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {analyzing ? 'Analyzing Ingredients...' : 'Take a photo of your food'}
              </h3>
              <p className="text-sm text-gray-500 text-center px-4">
                Snap your fridge or pantry. We'll suggest meals.
              </p>
           </div>
           <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
           <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-900">Suggested Meals from Scan</h2>
             <button onClick={() => setRecipes([])} className="text-sm text-gray-500 flex items-center gap-1 hover:text-orange-500">
               <RefreshCw size={14} /> Scan Again
             </button>
           </div>
           {recipes.map(recipe => (
             <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{recipe.name}</h3>
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"><Flame size={12} /> {recipe.calories} kcal</span>
                   </div>
                   <div className="flex gap-4 text-xs text-gray-500">
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
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-sm text-gray-500">Calorie Goal</p>
              <p className="text-2xl font-bold text-gray-800">{user?.tdee} <span className="text-sm font-normal text-gray-400">kcal</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-gray-800">1,200 <span className="text-sm font-normal text-gray-400">/ {user?.tdee} kcal</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <p className="text-sm text-gray-500">Macros (P/C/F)</p>
              <p className="text-lg font-bold text-gray-800">80g / 150g / 40g</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-brand-700 transition-colors">
              <PlusCircle size={20} /> Add Food
            </button>
            <button className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-700 transition-colors">
              <ChefHat size={20} /> Create Meal Plan
            </button>
          </div>

          {/* Desktop Extra: Weekly Analysis placeholder */}
          <div className="hidden lg:block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><BarChart size={20} className="text-orange-500" /> Weekly Nutrition</h3>
                <span className="text-xs text-gray-400">Last 7 Days</span>
            </div>
            <div className="h-40 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 text-sm">
               Chart visualization available in Pro
            </div>
          </div>
        </div>

        {/* Right Column - Meal Ideas Placeholder or Alternative Content */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full max-h-[600px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
               <Sparkles size={32} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Need Inspiration?
            </h3>
            <p className="text-sm text-gray-500 mb-6 px-4">
              Scan ingredients or use the Meal Planner to get personalized AI suggestions.
            </p>
            <button
                onClick={() => setActiveTab('scan')}
                className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:bg-purple-700 transition-colors"
            >
                Scan Ingredients
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 md:bg-white animate-fade-in pb-20 md:pb-0">
      <div className="bg-orange-500 text-white p-6 md:p-8 rounded-b-3xl md:rounded-none shadow-lg shrink-0 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><ChefHat size={120} /></div>
         <div className="relative z-10">
           <h1 className="text-2xl md:text-3xl font-bold mb-1">GymGenie Kitchen</h1>
           <p className="text-orange-100 text-sm">Analyze, track, and plan your nutrition.</p>
         </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-center space-x-2 bg-gray-100 p-1 rounded-xl max-w-sm mx-auto">
          <button onClick={() => setActiveTab('overview')} className={`w-full font-bold text-sm py-2.5 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Overview</button>
          <button onClick={() => setActiveTab('scan')} className={`w-full font-bold text-sm py-2.5 rounded-lg transition-all ${activeTab === 'scan' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Scan Food</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'overview' ? renderOverviewTab() : renderScanTab()}
      </div>
    </div>
  );
};

export default NutritionGenie;