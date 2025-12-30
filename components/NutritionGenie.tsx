import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateRecipesFromImage } from '../services/geminiService';
import { Recipe } from '../types';
import { Camera, ChefHat, Flame, Clock, Utensils, Loader2, UploadCloud, RefreshCw } from 'lucide-react';

const NutritionGenie = () => {
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="h-full flex flex-col bg-gray-50 md:bg-white animate-fade-in pb-20 md:pb-0">
      
      {/* Header */}
      <div className="bg-orange-500 text-white p-6 md:p-8 rounded-b-3xl md:rounded-none shadow-lg shrink-0 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <ChefHat size={120} />
         </div>
         <div className="relative z-10">
           <h1 className="text-2xl md:text-3xl font-bold mb-1">GymGenie Kitchen</h1>
           <p className="text-orange-100 text-sm">Scan your fridge. Get recipes that fit your {user?.tdee} calorie goal.</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {recipes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
             {/* Upload Area */}
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
                  Snap your fridge, pantry, or ingredients on the table. We'll suggest meals.
                </p>
             </div>
             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-gray-900">Suggested Meals</h2>
               <button 
                onClick={() => setRecipes([])} 
                className="text-sm text-gray-500 flex items-center gap-1 hover:text-orange-500"
               >
                 <RefreshCw size={14} /> Scan Again
               </button>
             </div>
             
             {recipes.map(recipe => (
               <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-5 border-b border-gray-50">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{recipe.name}</h3>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <Flame size={12} /> {recipe.calories} kcal
                        </span>
                     </div>
                     <div className="flex gap-4 text-xs text-gray-500">
                        <span><strong>P:</strong> {recipe.protein}g</span>
                        <span><strong>C:</strong> {recipe.carbs}g</span>
                        <span><strong>F:</strong> {recipe.fats}g</span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {recipe.cookingTimeMinutes}m</span>
                     </div>
                  </div>
                  <div className="p-5 bg-gray-50/50">
                     <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ingredients</p>
                        <div className="flex flex-wrap gap-2">
                           {recipe.ingredients.map((ing, i) => (
                             <span key={i} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                               {ing}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Instructions</p>
                        <ol className="space-y-2">
                           {recipe.instructions.map((step, i) => (
                             <li key={i} className="text-sm text-gray-700 flex gap-2">
                               <span className="font-bold text-orange-400">{i+1}.</span> {step}
                             </li>
                           ))}
                        </ol>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionGenie;