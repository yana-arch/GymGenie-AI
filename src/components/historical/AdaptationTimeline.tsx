/**
 * Adaptation Timeline Component
 * Shows AI evolution over time using interactive timeline
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import type { HistoricalPattern } from '../../features/historical-patterns/types/historicalPatterns.types';

interface AdaptationTimelineProps {
  patterns: HistoricalPattern[];
  height?: number;
  showDetails?: boolean;
  onPatternSelect?: (pattern: HistoricalPattern) => void;
}

interface TimelineDataPoint {
  date: string;
  adaptations: number;
  effectiveness: number;
  confidence: number;
  strength: number;
}

interface PatternDetail {
  id: string;
  type: string;
  date: Date;
  description: string;
  confidence: number;
}

const AdaptationTimeline: React.FC<AdaptationTimelineProps> = ({
  patterns,
  height = 300,
  showDetails = true,
  onPatternSelect
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [showPatternDetails, setShowPatternDetails] = useState(false);

  // Process adaptation timeline data
  const timelineData = useMemo(() => {
    const adaptationPatterns = patterns.filter(p => p.patternType === 'adaptation-trend');
    const dataPoints: TimelineDataPoint[] = [];

    // Create timeline data from adaptation patterns
    for (const pattern of adaptationPatterns) {
      const trendData = pattern.data.adaptationTrends;
      if (trendData) {
        const weeks = Math.max(pattern.timeSpan, 4);
        const startDate = pattern.firstDetected;
        
        for (let i = 0; i <= weeks; i++) {
          const currentDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
          const adaptationCount = Math.floor(i * trendData.consistency * 2);
          const effectiveness = trendData.direction === 'increasing' 
            ? 0.5 + (i * 0.02) 
            : trendData.direction === 'decreasing'
            ? 0.5 - (i * 0.02)
            : 0.5;
          
          dataPoints.push({
            date: currentDate.toISOString().split('T')[0],
            adaptations: adaptationCount,
            effectiveness: effectiveness * 100,
            confidence: pattern.confidence * 100 * (1 - (i * 0.05)), // Decay confidence over time
            strength: pattern.strength * 100
          });
        }
      }
    }
    
    // Sort by date and remove duplicates
    return Array.from(new Map(dataPoints.map(d => [d.date, d])).values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patterns]);

  // Generate pattern details for timeline
  const patternDetails: PatternDetail[] = useMemo(() => {
    return patterns.map(pattern => ({
      id: pattern.id,
      type: pattern.patternType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: pattern.firstDetected,
      description: generatePatternDescription(pattern),
      confidence: pattern.confidence
    }));
  }, [patterns]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">Adaptations: {data.adaptations}</p>
          <p className="text-sm text-gray-600">Effectiveness: {data.effectiveness.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Confidence: {data.confidence.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Strength: {data.strength.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const generatePatternDescription = (pattern: HistoricalPattern): string => {
    switch (pattern.patternType) {
      case 'adaptation-trend':
        const trendData = pattern.data.adaptationTrends;
        return `AI adaptations show ${trendData?.direction || 'stable'} trend with ${trendData?.consistency?.toFixed(2) || '0'}% consistency`;
      case 'performance-correlation':
        const perfData = pattern.data.performanceCorrelations;
        return `Strong correlation detected: ${perfData?.strongestCorrelation?.factor || 'Unknown'}`;
      case 'exercise-preference':
        const prefData = pattern.data.exercisePreferences;
        const prefCount = prefData?.preferredExercises?.length || 0;
        return `${prefCount} exercise preferences identified`;
      case 'intensity-progression':
        const intensityData = pattern.data.intensityProgression;
        return `Intensity progressing at ${(intensityData?.progressionRate || 0).toFixed(1)}% per week`;
      default:
        return 'Pattern detected';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Timeline Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Adaptation Timeline</h3>
        <p className="text-sm text-gray-600">
          Track how AI coaching has evolved and adapted to your performance patterns
        </p>
      </div>

      {/* Main Timeline Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 12 }}
              label={{ value: 'Adaptations', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'Effectiveness (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine 
              yAxisId="left"
              y={0} 
              stroke="#888" 
              strokeDasharray="5 5" 
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="adaptations"
              stroke="#3b82f6"
              fill="#93c5fd"
              fillOpacity={0.3}
              strokeWidth={2}
              name="AI Adaptations"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="effectiveness"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              name="Effectiveness"
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Confidence"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern Details */}
      {showDetails && patternDetails.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Pattern Evolution</h3>
            <button
              onClick={() => setShowPatternDetails(!showPatternDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showPatternDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showPatternDetails && (
            <div className="space-y-3">
              {patternDetails.map((detail, index) => (
                <div
                  key={detail.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onPatternSelect?.(patterns[index])}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{detail.type}</p>
                      <p className="text-sm text-gray-600">{detail.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {detail.date.toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">Confidence:</span>
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${detail.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {(detail.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { AdaptationTimeline };
