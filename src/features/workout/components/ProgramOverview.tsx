import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Target } from 'lucide-react';
import { Card } from '@/components/ui';

const ProgramOverview: React.FC = () => {
  const { currentPlan, user } = useApp();

  const progress = useMemo(() => {
    if (!currentPlan) return 0;
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
  }, [currentPlan]);

  if (!currentPlan || !user) {
    return null;
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Program</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{currentPlan.title}</h2>
          <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold mt-1 flex items-center gap-1.5">
            <Target size={14} />
            {user.goal}
          </p>
        </div>
        <div className="relative w-28 h-28">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-brand-500"
              style={{ transition: 'stroke-dashoffset 0.35s' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-gray-100">
            {progress}%
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProgramOverview;
