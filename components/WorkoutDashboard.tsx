import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { modifyWorkoutDay } from '../services/geminiService';
import { CheckCircle2, Circle, Clock, Flame, RefreshCcw, Trophy, Activity, Dumbbell, Calendar, ChevronRight, ChevronLeft, Sparkles, X, Send, History as HistoryIcon, ClipboardList, Info } from 'lucide-react';
import WorkoutHistory from './WorkoutHistory';
import ExerciseDetailModal from './ExerciseDetailModal';
import RestTimer from './RestTimer';

const WorkoutDashboard = () => {
  const { currentPlan, toggleExercise, user, resetApp, updateDayInPlan, logWorkout, setLoading, isLoading } = useApp();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Navigation State
  const [showHistory, setShowHistory] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Exercise Detail Modal State
  const [detailExerciseName, setDetailExerciseName] = useState<string | null>(null);

  // Reset day selection when week changes if current day index is out of bounds (unlikely but safe)
  const activeWeek = useMemo(() => currentPlan?.weeks[selectedWeekIndex], [currentPlan, selectedWeekIndex]);
  const activeDay = useMemo(() => activeWeek?.days[selectedDayIndex], [activeWeek, selectedDayIndex]);

  if (!currentPlan || !user || !activeWeek || !activeDay) return null;

  // Calculate Progress
  const calculateProgress = () => {
    let completed = 0;
    let total = 0;
    currentPlan.weeks.forEach(w => {
      w.days.forEach(d => {
        d.exercises.forEach(e => {
          total++;
          if (e.isCompleted) completed++;
        });
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !activeWeek || !activeDay) return;

    setIsModifying(true);
    try {
      const updatedDay = await modifyWorkoutDay(activeDay, editPrompt, user);
      updateDayInPlan(activeWeek.id, updatedDay);
      setIsEditModalOpen(false);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to modify workout. Please try again.');
    } finally {
      setIsModifying(false);
    }
  };

  const handleFinishWorkout = () => {
    if (confirm("Finish and log this workout to history?")) {
        logWorkout(activeWeek.id, activeDay.id);
        setShowHistory(true); // Switch to history view to show confirmation implicitly
    }
  };

  const progress = calculateProgress();
  const isRestDay = activeDay.isRestDay;

  // Render History View
  if (showHistory) {
    return <WorkoutHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="min-h-full bg-gray-50 md:bg-white animate-fade-in flex flex-col h-full relative">
      
      {/* Rest Timer Overlay */}
      <RestTimer />

      {/* Exercise Detail Modal */}
      {detailExerciseName && (
        <ExerciseDetailModal 
          exerciseName={detailExerciseName} 
          onClose={() => setDetailExerciseName(null)} 
        />
      )}

      {/* Edit Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 animate-pop-in">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-lg">
                   <Sparkles size={20} /> AI Coach
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
             </div>
             <p className="text-gray-600 text-sm mb-4">
               How should I adjust <strong>{activeDay.title}</strong> for you?
             </p>
             <form onSubmit={handleEditSubmit}>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none mb-4 resize-none"
                  rows={4}
                  placeholder="e.g. 'My knees hurt, swap Squats for something easier' or 'I only have 30 mins today, make it shorter.'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isModifying || !editPrompt.trim()}
                  className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-all"
                >
                  {isModifying ? 'Adjusting Plan...' : <><Send size={18} /> Update Workout</>}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-brand-600 text-white p-6 md:p-8 rounded-b-3xl md:rounded-none shadow-lg relative overflow-hidden shrink-0 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calendar size={140} />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-start">
                  <div>
                    <p className="opacity-80 text-xs md:text-sm uppercase tracking-wider mb-1 font-semibold">4-Week Program</p>
                    <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-1">{currentPlan.title}</h1>
                  </div>
                  {/* History Button (Mobile/Desktop) */}
                  <button 
                    onClick={() => setShowHistory(true)}
                    className="flex flex-col items-center justify-center bg-brand-700/50 hover:bg-brand-700 p-2 rounded-xl transition-all border border-brand-500/30"
                    title="View History"
                  >
                     <HistoryIcon size={24} />
                     <span className="text-[10px] uppercase font-bold mt-1">History</span>
                  </button>
              </div>
              <p className="text-brand-100 text-xs md:text-sm max-w-xl leading-relaxed opacity-90 line-clamp-2 mt-2 md:mt-0">{currentPlan.description}</p>
            </div>
            
            {/* Desktop Progress */}
            <div className="hidden md:flex items-center gap-3 bg-brand-700/50 p-3 rounded-2xl backdrop-blur-sm border border-brand-500/30">
               <div className="text-right">
                  <p className="text-xs text-brand-200 uppercase">Total Progress</p>
                  <p className="text-xl font-bold">{progress}%</p>
               </div>
               <div className="w-12 h-12 rounded-full border-4 border-brand-400 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-white opacity-20"></div>
                  <Activity size={20} />
               </div>
            </div>
          </div>
          
          {/* Week Selector */}
          <div className="mt-6 flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
            {currentPlan.weeks.map((week, idx) => (
              <button
                key={week.id}
                onClick={() => { setSelectedWeekIndex(idx); setSelectedDayIndex(0); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  selectedWeekIndex === idx 
                    ? 'bg-white text-brand-600 shadow-md' 
                    : 'bg-brand-700/50 text-brand-100 hover:bg-brand-700'
                }`}
              >
                Week {week.weekNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Progress Bar (Placed below header on mobile) */}
      <div className="md:hidden px-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-500 h-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="font-bold text-xs text-gray-500">{progress}%</span>
          </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:block">
        <div className="md:grid md:grid-cols-12 md:gap-8 h-full">
          
          {/* Left Sidebar: Day Selection & Stats */}
          <div className="md:col-span-4 flex flex-col gap-4 mb-4 md:mb-0">
            
            {/* Day Selector (Horizontal Scroll on Mobile, Vertical List on Desktop) */}
            <div className="bg-white p-2 md:p-4 rounded-2xl border border-gray-100 shadow-sm">
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-2 hidden md:block">Schedule - Week {activeWeek.weekNumber}</h3>
               <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-hide">
                 {activeWeek.days.map((day, idx) => (
                   <button
                    key={day.id}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl transition-all border text-left min-w-[100px] md:min-w-0 ${
                      selectedDayIndex === idx 
                        ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-200' 
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                   >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        selectedDayIndex === idx ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selectedDayIndex === idx ? 'text-brand-900' : 'text-gray-700'}`}>{day.dayName}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[80px] md:max-w-none">{day.isRestDay ? 'Rest Day' : day.title}</p>
                      </div>
                   </button>
                 ))}
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 md:border-gray-200 flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Weekly Focus</span>
                <span className="text-sm md:text-lg font-bold text-gray-900">{activeWeek.focus}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 md:border-gray-200 flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Daily Target</span>
                 <span className="text-sm md:text-lg font-bold text-gray-900">{activeDay.title}</span>
              </div>
            </div>
             
             {/* Desktop Reset */}
            <div className="hidden md:block mt-auto pt-4">
              <button 
                onClick={() => { if(confirm("Start over?")) resetApp(); }}
                className="flex items-center gap-2 text-gray-400 text-sm font-medium hover:text-red-500 transition-colors"
              >
                <RefreshCcw size={16} /> Reset Profile
              </button>
            </div>
          </div>

          {/* Right Content: Exercises */}
          <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
             
            {isRestDay ? (
               <div className="flex-1 flex flex-col items-center justify-center p-8 bg-blue-50/50 rounded-3xl border border-blue-100 text-center animate-fade-in relative">
                  <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <Clock size={48} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">Rest & Recovery</h3>
                  <p className="text-blue-700 max-w-md">
                    Take today to recover. Light stretching, hydration, and good sleep are key to muscle growth.
                  </p>
                  
                  {/* Option to change rest day */}
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="mt-6 flex items-center gap-2 text-blue-600 bg-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-blue-50"
                  >
                     <Sparkles size={16} /> Want to workout anyway?
                  </button>
               </div>
            ) : (
              <div className="space-y-4 pb-20 md:pb-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col h-full">
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                       {activeDay.title} <span className="text-gray-300 font-normal">/</span> {activeDay.exercises.length} Exercises
                    </h3>
                    
                    {/* Magic Edit Button */}
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95"
                    >
                      <Sparkles size={16} /> <span className="hidden sm:inline">AI Edit</span>
                    </button>
                </div>

                <div className="space-y-4 flex-1">
                  {activeDay.exercises.map((exercise) => (
                    <div 
                      key={exercise.id}
                      className={`group bg-white p-4 md:p-6 rounded-2xl border transition-all duration-200 active:scale-[0.99] ${
                        exercise.isCompleted 
                          ? 'border-green-200 bg-green-50/50 shadow-none' 
                          : 'border-gray-100 md:border-gray-200 shadow-sm hover:shadow-md hover:border-brand-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                         {/* Toggle Checkbox */}
                        <div 
                          onClick={(e) => { e.stopPropagation(); toggleExercise(exercise.id); }}
                          className={`mt-1 transition-colors cursor-pointer ${exercise.isCompleted ? 'text-green-500' : 'text-gray-300 group-hover:text-brand-300'}`}
                        >
                          {exercise.isCompleted ? <CheckCircle2 size={28} className="fill-green-100" /> : <Circle size={28} />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <h3 
                                onClick={(e) => { e.stopPropagation(); toggleExercise(exercise.id); }}
                                className={`font-bold text-lg mb-2 cursor-pointer ${exercise.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                             >
                                {exercise.name}
                             </h3>
                             {/* Info Button - New Feature */}
                             <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailExerciseName(exercise.name);
                              }}
                              className="text-gray-400 hover:text-brand-500 p-1"
                             >
                               <Info size={20} />
                             </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 md:gap-3 text-sm text-gray-600 mb-3">
                            <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium border border-gray-200">{exercise.sets} Sets</span>
                            <span className="bg-gray-100 px-3 py-1 rounded-lg font-medium border border-gray-200">{exercise.reps} Reps</span>
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium border border-blue-100">
                              <Clock size={14} /> {exercise.restSeconds}s Rest
                            </span>
                          </div>
                          {exercise.notes && (
                            <p className="text-sm text-gray-500 italic border-l-2 border-brand-200 pl-3 py-1 bg-gray-50/50 rounded-r-lg">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Log Workout Button */}
                <div className="pt-4 shrink-0 pb-20 md:pb-4">
                   <button 
                    onClick={handleFinishWorkout}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all"
                   >
                     <ClipboardList size={20} /> Finish & Log Workout
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Reset Button */}
        <div className="md:hidden py-8 text-center pb-20">
           <button 
            onClick={() => { if(confirm("Start over?")) resetApp(); }}
            className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto hover:text-red-500"
          >
            <RefreshCcw size={16} /> Reset & Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDashboard;