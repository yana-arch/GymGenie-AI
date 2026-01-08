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

interface CorrelationData {
  factor: string;
  correlation: number;
  significance: number;
  strength: number;
  direction: 'positive' | 'negative' | 'neutral';
}

interface PerformanceCorrelationViewProps {
  patterns: any[];
  height?: number;
  interactive?: boolean;
  onCorrelationSelect?: (correlation: CorrelationData) => void;
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
          
          if (correlation.correlation > 0.1) {
            direction = 'positive';
          } else if (correlation.correlation < -0.1) {
            direction = 'negative';
          }

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
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'trends' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trends
            </button>
          </div>
        </div>

        {/* Correlation Chart */}
        {viewMode === 'correlation' && (
          <div style={{ height: height - 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="factor"
                  type="category"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  dataKey="correlation"
                  domain={[-100, 100]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  label={{ value: 'Correlation (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip content={<CorrelationTooltip />} />
                <Legend />
                <Scatter
                  name="Correlations"
                  data={correlationData}
                  fill="#3b82f6"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={
                          payload.direction === 'positive' ? '#10b981' : 
                          payload.direction === 'negative' ? '#ef4444' : '#6b7280'
                        }
                        onClick={() => handleCorrelationClick(payload)}
                        style={{ cursor: interactive ? 'pointer' : 'default' }}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Distribution Chart */}
        {viewMode === 'distribution' && (
          <div style={{ height: height - 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => (
                    <text fill="#374151" fontSize={12}>
                      {`${entry.range}: ${entry.count} (${(entry.percent * 100).toFixed(0)}%)`}
                    </text>
                  )}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trends View */}
        {viewMode === 'trends' && (
          <div className="space-y-4">
            {correlationData.slice(0, 10).map((correlation, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  selectedCorrelation === correlation.factor
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                } ${interactive ? 'cursor-pointer hover:border-gray-300' : ''}`}
                onClick={() => handleCorrelationClick(correlation)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{correlation.factor}</h4>
                    <p className="text-sm text-gray-600">
                      Strength: {correlation.strength.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      correlation.direction === 'positive' ? 'text-green-600' : 
                      correlation.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {correlation.direction === 'positive' ? '+' : ''}{correlation.correlation.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Significance: {correlation.significance.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Correlation Details */}
        {selectedCorrelation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected: {selectedCorrelation}</h4>
            <p className="text-sm text-blue-700">
              This factor shows a {
                correlationData.find(c => c.factor === selectedCorrelation)?.direction
              } correlation with your performance patterns.
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{correlationData.length}</p>
            <p className="text-sm text-gray-600">Total Correlations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {correlationData.filter(c => c.direction === 'positive').length}
            </p>
            <p className="text-sm text-gray-600">Positive</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {correlationData.filter(c => c.direction === 'negative').length}
            </p>
            <p className="text-sm text-gray-600">Negative</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {correlationData.filter(c => c.strength >= 70).length}
            </p>
            <p className="text-sm text-gray-600">Strong (&gt;70%)</p>
          </div>
        </div>
      </div>
    </div>
  );
});