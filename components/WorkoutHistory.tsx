import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, CheckCircle2, TrendingUp, ArrowLeft, Cloud, CloudOff } from 'lucide-react';

interface WorkoutHistoryProps {
  onBack: () => void;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ onBack }) => {
  const { history } = useApp();

  return (
    <div className="flex flex-col h-full bg-gray-50 md:bg-white animate-fade-in absolute inset-0 z-20">
       {/* Header for History */}
       <div className="bg-white p-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <TrendingUp className="text-brand-600" /> Workout History
          </h2>
       </div>

       <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pb-20">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                 <Calendar size={40} className="opacity-40" />
               </div>
               <p className="text-lg font-medium text-gray-600">No completed workouts yet.</p>
               <p className="text-sm mt-1">Finish a day in your plan to log it here.</p>
            </div>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {new Date(entry.completedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      {entry.syncStatus === 'synced' ? (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-blue-100">
                           <Cloud size={10} /> Synced
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-gray-200">
                           <CloudOff size={10} /> Local
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{entry.dayTitle}</h3>
                    <p className="text-sm text-gray-500 mt-1">{entry.planTitle} • Week {entry.weekNumber}</p>
                 </div>
                 <div className="text-right pl-4">
                    <div className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full border text-sm ${
                        entry.exercisesCompleted === entry.totalExercises 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                       <CheckCircle2 size={16} />
                       {entry.exercisesCompleted}/{entry.totalExercises}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Exercises</p>
                 </div>
              </div>
            ))
          )}
       </div>
    </div>
  );
};
export default WorkoutHistory;