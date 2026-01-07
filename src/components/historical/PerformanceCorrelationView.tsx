/**
 * Performance Correlation View Component
 * Shows pattern-performance relationships with interactive charts
 */

import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { HistoricalPattern } from '../../features/historical-patterns/types/historicalPatterns.types';

interface PerformanceCorrelationViewProps {
  patterns: HistoricalPattern[];
  height?: number;
  interactive?: boolean;
  onCorrelationSelect?: (correlation: any) => void;
}

interface CorrelationData {
  factor: string;
  correlation: number;
  significance: number;
  strength: number;
  direction: 'positive' | 'negative' | 'neutral';
}

interface PerformanceDistribution {
  range: string;
  count: number;
  color: string;
}

export const PerformanceCorrelationView: React.FC<PerformanceCorrelationViewProps> = React.memo(({
  patterns,
  height = 400,
  interactive = true,
  onCorrelationSelect
}) => {
  const [selectedCorrelation, setSelectedCorrelation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'correlation' | 'distribution' | 'trends'>('correlation');

  // Process correlation data
  const correlationData = useMemo(() => {
    const perfPatterns = patterns.filter(p => p.patternType === 'performance-correlation');
    const correlations: CorrelationData[] = [];

    for (const pattern of perfPatterns) {
      const correlationData = pattern.data.performanceCorrelations;
      if (correlationData) {
        for (const correlation of correlationData.correlations) {
          const strength = Math.abs(correlation.correlation);
          let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
          
          if (correlation.correlation > 0.1) direction = 'positive';
          else if (correlation.correlation < -0.1) direction = 'negative';

          correlations.push({
            factor: correlation.factor,
            correlation: correlation.correlation * 100, // Convert to percentage
            significance: correlation.significance * 100,
            strength: strength * 100,
            direction
          });
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [patterns]);

  // Performance distribution data
  const performanceDistribution = useMemo(() => {
    const allWorkouts = patterns.flatMap(p => 
      p.patternType === 'performance-correlation' ? [p] : []
    );

    if (allWorkouts.length === 0) return [];

    // Group by correlation strength
    const strong = correlationData.filter(c => c.strength >= 70).length;
    const moderate = correlationData.filter(c => c.strength >= 40 && c.strength < 70).length;
    const weak = correlationData.filter(c => c.strength < 40).length;

    return [
      { range: 'Strong (>70%)', count: strong, color: '#10b981' },
      { range: 'Moderate (40-70%)', count: moderate, color: '#f59e0b' },
      { range: 'Weak (<40%)', count: weak, color: '#ef4444' }
    ];
  }, [correlationData]);

  // Custom tooltip
  const CorrelationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="text-sm font-semibold text-gray-800 mb-1">{data.factor}</p>
          <p className="text-sm text-gray-600">
            Correlation: <span className={`font-medium ${
              data.direction === 'positive' ? 'text-green-600' : 
              data.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.direction === 'positive' ? '+' : ''}{data.correlation.toFixed(1)}%
            </span>
          </p>
          <p className="text-sm text-gray-600">Significance: {data.significance.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Strength: {data.strength.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">
            Direction: <span className={`font-medium ${
              data.direction === 'positive' ? 'text-green-600' : 
              data.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.direction}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleCorrelationClick = (data: CorrelationData) => {
    if (interactive) {
      setSelectedCorrelation(data.factor);
      onCorrelationSelect?.(data);
    }
  };

  if (correlationData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-lg">No performance correlation data available</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Performance Correlation Analysis</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('correlation')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'correlation' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Correlations
            </button>
            <button
              onClick={() => setViewMode('distribution')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'distribution' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Distribution
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Analysis of how different factors correlate with your workout performance
        </p>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {viewMode === 'correlation' && (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart data={correlationData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="factor" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                dataKey="correlation" 
                tick={{ fontSize: 12 }}
                label={{ value: 'Correlation (%)', angle: -90, position: 'insideLeft' }}
                domain={[-100, 100]}
              />
              <Tooltip content={<CorrelationTooltip />} />
              <Legend />
              <Scatter
                dataKey="correlation"
                fill="#3b82f6"
                strokeWidth={2}
                onClick={handleCorrelationClick}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isSelected = selectedCorrelation === payload.factor;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 8 : 6}
                      fill={payload.direction === 'positive' ? '#10b981' : 
                             payload.direction === 'negative' ? '#ef4444' : '#6b7280'}
                      stroke={isSelected ? '#1f2937' : '#fff'}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ cursor: interactive ? 'pointer' : 'default' }}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'distribution' && (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={height / 2}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ range, count, percent }) => (
                    <text fill="#374151" fontSize={12}>
                      {`${range}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  )}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={height / 2}>
              <BarChart data={performanceDistribution} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Number of Correlations', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Bar dataKey="count">
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Selected Correlation Details */}
        {selectedCorrelation && interactive && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Selected Correlation</h4>
            <p className="text-blue-800">
              <strong>Factor:</strong> {selectedCorrelation}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-blue-700">
                <strong>Direction:</strong>{' '}
                <span className={
                  correlationData.find(c => c.factor === selectedCorrelation)?.direction === 'positive' ? 'text-green-600' : 
                  correlationData.find(c => c.factor === selectedCorrelation)?.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
                }>
                  {correlationData.find(c => c.factor === selectedCorrelation)?.direction}
                </span>
              </p>
              <p className="text-sm text-blue-700">
                <strong>Strength:</strong> {
                  correlationData.find(c => c.factor === selectedCorrelation)?.strength.toFixed(1)
                }%
              </p>
              <p className="text-sm text-blue-700">
                <strong>Significance:</strong> {
                  correlationData.find(c => c.factor === selectedCorrelation)?.significance.toFixed(1)
                }%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};