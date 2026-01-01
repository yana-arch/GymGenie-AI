import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { WorkoutHistoryEntry } from '@/types';

interface TrainingVolumeChartProps {
  history: WorkoutHistoryEntry[];
}

interface ChartData {
  date: string;
  volume: number;
  exercises: number;
  label: string;
}

const TrainingVolumeChart: React.FC<TrainingVolumeChartProps> = ({ history }) => {
  const chartData = useMemo(() => {
    // Sort history by date ascending
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    // Group by date to handle multiple workouts per day
    // though usually 1 per day, this is safer
    const volumeByDate = sortedHistory.reduce((acc, entry) => {
      const date = new Date(entry.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      // Since we don't have exact weight/reps data in history entry (it's summarized)
      // We'll use 'exercisesCompleted' as a proxy for volume for now
      // ideally we'd calculate volume = sets * reps * weight
      const volumeProxy = entry.exercisesCompleted; 

      if (!acc[date]) {
        acc[date] = {
          date,
          volume: 0,
          exercises: 0,
          label: date
        };
      }
      
      acc[date].volume += volumeProxy;
      acc[date].exercises += entry.exercisesCompleted;
      
      return acc;
    }, {} as Record<string, ChartData>);

    return Object.values(volumeByDate);
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 p-6">
        <p className="text-gray-400 font-medium">No workout data available</p>
        <p className="text-sm text-gray-400 mt-1">Complete workouts to see your progress</p>
      </div>
    );
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
          <p className="text-xs text-brand-600 font-medium">
            Exercises: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            dy={10}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#2563eb" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorVolume)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(TrainingVolumeChart);