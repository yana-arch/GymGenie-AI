/**
 * Historical Patterns Chart Component
 * Visualizes historical adaptation trends and patterns using Recharts
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
  Brush,
  Area,
  AreaChart,
  ScatterChart,
  Scatter
} from 'recharts';
import type { HistoricalPattern, AdaptationTrendData } from '../../features/historical-patterns/types/historicalPatterns.types';
import ChartErrorBoundary from './ChartErrorBoundary';

interface HistoricalPatternsChartProps {
  patterns: HistoricalPattern[];
  timeRange?: { start: Date; end: Date };
  onTimeRangeChange?: (range: { start: Date; end: Date }) => void;
  height?: number;
  interactive?: boolean;
}

interface ChartDataPoint {
  date: string;
  value: number;
  confidence?: number;
  strength?: number;
  pattern?: string;
}

interface AdaptationDataPoint extends ChartDataPoint {
  adaptations?: number;
  performance?: number;
}

export const HistoricalPatternsChart: React.FC<HistoricalPatternsChartProps> = React.memo(({
  patterns,
  timeRange,
  onTimeRangeChange,
  height = 400,
  interactive = true
}) => {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);

  // Process patterns for visualization
  const chartData = useMemo(() => {
    const adaptationPatterns = patterns.filter(p => p.patternType === 'adaptation-trend');
    const performancePatterns = patterns.filter(p => p.patternType === 'performance-correlation');
    
    // Generate time series data for adaptation trends
    const adaptationData: AdaptationDataPoint[] = [];
    
    for (const pattern of adaptationPatterns) {
      const trendData = pattern.data.adaptationTrends;
      if (trendData) {
        // Create data points for the time span
        const weeks = pattern.timeSpan || 4;
        const startDate = pattern.firstDetected;
        
        for (let i = 0; i <= weeks; i++) {
          const currentDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
          const trendValue = trendData.direction === 'increasing' 
            ? 0.5 + (i * trendData.rate)
            : trendData.direction === 'decreasing'
            ? 0.5 - (i * trendData.rate)
            : 0.5;
            
          adaptationData.push({
            date: currentDate.toISOString().split('T')[0],
            value: trendValue * 100, // Convert to percentage
            confidence: pattern.confidence * 100,
            strength: pattern.strength * 100,
            pattern: pattern.patternType,
            adaptations: i === 0 ? 0 : Math.floor(i * trendData.consistency * 2),
            performance: trendValue * 10 // Scale 0-1 to 0-10
          });
        }
      }
    }
    
    return adaptationData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [patterns]);

  // Performance correlation data
  const performanceData = useMemo(() => {
    const perfPatterns = patterns.filter(p => p.patternType === 'performance-correlation');
    const correlations: any[] = [];
    
    for (const pattern of perfPatterns) {
      const correlationData = pattern.data.performanceCorrelations;
      if (correlationData) {
        for (const correlation of correlationData.correlations) {
          correlations.push({
            date: pattern.lastConfirmed.toISOString().split('T')[0],
            factor: correlation.factor,
            correlation: correlation.correlation * 100, // Convert to percentage
            significance: correlation.significance * 100,
            strength: Math.abs(correlation.correlation) * 100,
            pattern: pattern.patternType
          });
        }
      }
    }
    
    return correlations;
  }, [patterns]);

  // Exercise preference data
  const preferenceData = useMemo(() => {
    const prefPatterns = patterns.filter(p => p.patternType === 'exercise-preference');
    const preferences: any[] = [];
    
    for (const pattern of prefPatterns) {
      const prefData = pattern.data.exercisePreferences;
      if (prefData) {
        for (const pref of prefData.preferredExercises) {
          preferences.push({
            date: pattern.lastConfirmed.toISOString().split('T')[0],
            exercise: pref.exerciseName,
            confidence: pref.confidence * 100,
            pattern: pattern.patternType
          });
        }
      }
    }
    
    return preferences;
  }, [patterns]);

  // Intensity progression data
  const intensityData = useMemo(() => {
    const intensityPatterns = patterns.filter(p => p.patternType === 'intensity-progression');
    const progressions: any[] = [];
    
    for (const pattern of intensityPatterns) {
      const progData = pattern.data.intensityProgression;
      if (progData) {
        progressions.push({
          date: pattern.firstDetected.toISOString().split('T')[0],
          current: progData.currentLevel * 100,
          target: progData.targetLevel * 100,
          progressionRate: progData.progressionRate * 100,
          pattern: pattern.patternType
        });
      }
    }
    
    return progressions;
  }, [patterns]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">Value: {data.value?.toFixed(1)}%</p>
          {data.confidence && (
            <p className="text-sm text-gray-600">Confidence: {data.confidence.toFixed(1)}%</p>
          )}
          {data.strength && (
            <p className="text-sm text-gray-600">Strength: {data.strength.toFixed(1)}%</p>
          )}
          {data.pattern && (
            <p className="text-sm text-gray-600">Type: {data.pattern}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Handle brush selection for time range
  const handleBrushChange = (newDomain: any) => {
    if (newDomain && onTimeRangeChange) {
      const [startIndex, endIndex] = newDomain;
      if (startIndex !== null && endIndex !== null && chartData[startIndex] && chartData[endIndex]) {
        onTimeRangeChange({
          start: new Date(chartData[startIndex].date),
          end: new Date(chartData[endIndex].date)
        });
      }
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-lg">No historical pattern data available</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Adaptation Trend Chart */}
      <ChartErrorBoundary>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Adaptation Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tick={{ fontSize: 12 }}
                label={{ value: 'Adaptation Level (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {interactive && (
                <Brush 
                  dataKey="date" 
                  height={30} 
                  stroke="#888"
                  onChange={handleBrushChange}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="#93c5fd"
                fillOpacity={0.6}
                strokeWidth={2}
                name="Adaptation Level"
              />
              {interactive && (
                <Area
                  type="monotone"
                  dataKey="confidence"
                  stroke="#10b981"
                  fill="#86efac"
                  fillOpacity={0.3}
                  strokeWidth={1}
                  name="Confidence"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartErrorBoundary>

      {/* Performance Correlations */}
      {performanceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Correlations</h3>
          <ResponsiveContainer width="100%" height={height / 2}>
            <LineChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tick={{ fontSize: 12 }}
                label={{ value: 'Correlation Strength (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="correlation"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="Correlation"
              />
              <Line
                type="monotone"
                dataKey="significance"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Significance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Exercise Preferences */}
      {preferenceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Exercise Preferences</h3>
          <ResponsiveContainer width="100%" height={height / 2}>
            <ScatterChart data={preferenceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                dataKey="confidence" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Preference Confidence (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold">{data.exercise}</p>
                        <p className="text-sm text-gray-600">
                          Confidence: {data.confidence?.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                dataKey="confidence"
                fill="#10b981"
                strokeWidth={2}
                stroke="#059669"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Intensity Progression */}
      {intensityData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Intensity Progression</h3>
          <ResponsiveContainer width="100%" height={height / 2}>
            <LineChart data={intensityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                tick={{ fontSize: 12 }}
                label={{ value: 'Intensity Level (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#ef4444"
                strokeWidth={2}
                name="Current Level"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Target Level"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};