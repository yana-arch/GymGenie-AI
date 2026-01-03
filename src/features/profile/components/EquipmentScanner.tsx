import React, { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { identifyEquipment } from '@/src/features/profile/services/EquipmentIdentifier';
import { generateWorkoutPlan } from '@/src/features/workout/services/WorkoutGenerator';
import { Camera, Dumbbell, Loader2, Plus, Trash2, Zap, UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

const EquipmentScanner = () => {
  const { user, setEquipment, setPlan, setStep, setLoading, isLoading } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setAnalyzing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const items = await identifyEquipment(base64String);
          setScannedItems(prev => Array.from(new Set([...prev, ...items])));
        } catch (err) {
          console.error(err);
          setError('Failed to analyze image. Please try again.');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
      setError('Failed to process image file.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setEquipment(scannedItems);
    try {
      const plan = await generateWorkoutPlan(user, scannedItems);
      setPlan(plan);
      setStep('dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to generate workout plan. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (customItem.trim()) {
      setScannedItems(prev => [...prev, customItem.trim()]);
      setCustomItem('');
    }
  };

  const removeItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-full flex flex-col md:grid md:grid-cols-12 bg-white dark:bg-gray-800 animate-fade-in">
      
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <div className="md:col-span-5 bg-purple-50/50 dark:bg-gray-900 p-6 md:p-10 border-r border-gray-100 dark:border-gray-700 flex flex-col justify-between">
        <div>
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 shadow-sm mx-auto md:mx-0">
             <Dumbbell size={32} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Equipment Check</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
              Show us what you're working with. Scan your gym, a specific machine, or your home setup.
            </p>
          </div>
        </div>

         {/* Desktop Tips */}
         <div className="hidden md:block space-y-4 mt-12">
           <div className="flex gap-3 items-start p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <ImageIcon className="text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">Clear Photos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ensure good lighting for better AI recognition.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-7 p-6 md:p-10 flex flex-col md:overflow-y-auto">
        
        {/* Desktop Drag & Drop Zone */}
        <div 
            className={`hidden md:flex flex-col items-center justify-center border-3 border-dashed rounded-2xl p-10 mb-8 transition-all cursor-pointer bg-gray-50 dark:bg-gray-900/50 ${isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                {analyzing ? <Loader2 className="animate-spin text-purple-600 dark:text-purple-400" size={32}/> : <UploadCloud className="text-purple-600 dark:text-purple-400" size={32}/>}
            </div>
            <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">Click or Drag & Drop Image</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Supports JPG, PNG</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Manual Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Add manually (e.g. Bench Press)"
            className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-900/40 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button 
            onClick={addItem}
            className="bg-gray-900 dark:bg-gray-700 text-white px-5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-md flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 mb-8">
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wider">Scanned Gear</h3>
          <div className="flex flex-wrap gap-2">
            {scannedItems.length === 0 && (
              <div className="w-full text-center py-8 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 italic text-sm">
                Empty list. Scan your gym or add items manually.
              </div>
            )}
            {scannedItems.map((item, idx) => (
              <span key={idx} className="animate-pop-in inline-flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
                {item}
                <button onClick={() => removeItem(idx)} className="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Hidden Input */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          className="hidden" 
        />

        {/* Desktop Actions (Flow) */}
        <div className="hidden md:flex gap-4 mt-auto">
             <button
                onClick={handleGenerate}
                disabled={analyzing || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 text-lg"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap size={20} /> Generate Workout Plan</>
                )}
              </button>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="md:hidden p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 mt-auto sticky bottom-0 z-10 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing || isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 font-bold py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all shadow-sm"
          >
            {analyzing ? <Loader2 className="animate-spin" /> : <Camera size={20} />}
            Scan
          </button>

          <button
            onClick={handleGenerate}
            disabled={analyzing || isLoading}
            className="flex-[2] flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
          >
             <Zap size={20} /> Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentScanner;
