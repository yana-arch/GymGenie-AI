import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectOverrideHistory, 
  selectPerformanceMetrics,
  clearOverrideHistory,
  clearError,
  setLoading,
  setError,
  type SafetyOverrideState 
} from '../store/safetyOverrideSlice';
import type { OverrideEvent } from '../services/OverrideDetectionService';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Zap, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  BarChart3
} from 'lucide-react';

interface OverrideHistoryProps {
  className?: string;
}

export const OverrideHistory: React.FC<OverrideHistoryProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const overrideHistory = useSelector(selectOverrideHistory);
  const performanceMetrics = useSelector(selectPerformanceMetrics);
  const isLoading = useSelector((state: { safetyOverride: SafetyOverrideState }) => state.safetyOverride.isLoading);
  const error = useSelector((state: { safetyOverride: SafetyOverrideState }) => state.safetyOverride.error);

  // Local state for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [energyFilter, setEnergyFilter] = useState<string>('all');
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load data on mount
  useEffect(() => {
    dispatch(setLoading(true));
    try {
      // In a real implementation, this would load from storage
      // For now, the data is already in Redux state
      dispatch(setLoading(false));
    } catch (err) {
      dispatch(setError('Failed to load override history'));
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Filter and search logic
  const filteredHistory = useMemo(() => {
    return overrideHistory.filter(override => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        override.userAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.interactionMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
        override.context.energyLevel.toLowerCase().includes(searchQuery.toLowerCase());

      // Action filter
      const actionMatch = actionFilter === 'all' || override.userAction === actionFilter;

      // Method filter
      const methodMatch = methodFilter === 'all' || override.interactionMethod === methodFilter;

      // Energy level filter
      const energyMatch = energyFilter === 'all' || override.context.energyLevel === energyFilter;

      return searchMatch && actionMatch && methodMatch && energyMatch;
    });
  }, [overrideHistory, searchQuery, actionFilter, methodFilter, energyFilter]);

  // Analytics and trends
  const trends = useMemo(() => {
    if (overrideHistory.length === 0) return null;

    const actionCounts = overrideHistory.reduce((acc, override) => {
      acc[override.userAction] = (acc[override.userAction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const methodCounts = overrideHistory.reduce((acc, override) => {
      acc[override.interactionMethod] = (acc[override.interactionMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const energyCounts = overrideHistory.reduce((acc, override) => {
      acc[override.context.energyLevel] = (acc[override.context.energyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonAction = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      totalOverrides: overrideHistory.length,
      mostCommonAction,
      actionCounts,
      methodCounts,
      energyCounts,
      averageProcessingTime: Math.round(performanceMetrics.averageProcessingTime)
    };
  }, [overrideHistory, performanceMetrics]);

  // Format relative timestamp
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Get action icon
  const getActionIcon = (action: OverrideEvent['userAction']) => {
    switch (action) {
      case 'disagree':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'override_tap':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'skip_exercise':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get method label
  const getMethodLabel = (method: OverrideEvent['interactionMethod']) => {
    switch (method) {
      case 'one_tap':
        return 'One-tap override';
      case 'menu_selection':
        return 'Menu selection';
      default:
        return method;
    }
  };

  // Handle clear history
  const handleClearHistory = () => {
    dispatch(clearOverrideHistory());
    setShowClearDialog(false);
  };

  // Handle retry
  const handleRetry = () => {
    dispatch(clearError());
    dispatch(setLoading(true));
    setTimeout(() => dispatch(setLoading(false)), 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p className="text-gray-600">Loading override history...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-semibold mb-2">Error loading override history</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Override History</h2>
          <p className="text-gray-600 mt-1">
            Total Overrides: {overrideHistory.length}
          </p>
        </div>
        {overrideHistory.length > 0 && (
          <button
            onClick={() => setShowClearDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Empty State */}
      {overrideHistory.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No overrides recorded yet</h3>
          <p className="text-gray-600">As you interact with AI recommendations, your override history will appear here</p>
        </div>
      )}

      {overrideHistory.length > 0 && (
        <>
          {/* Trends and Insights */}
          {trends && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Override Trends</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Most Common Action</p>
                  <p className="text-lg font-semibold text-blue-900">{trends.mostCommonAction}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Average Processing Time</p>
                  <p className="text-lg font-semibold text-blue-900">{trends.averageProcessingTime}ms</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Total Overrides</p>
                  <p className="text-lg font-semibold text-blue-900">{trends.totalOverrides}</p>
                </div>
              </div>

              {/* Detailed breakdown */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Action breakdown */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Action Types</h4>
                  <div className="space-y-1">
                    {Object.entries(trends.actionCounts).map(([action, count]) => (
                      <div key={action} className="flex justify-between text-sm">
                        <span className="capitalize text-blue-700">{action.replace('_', ' ')}</span>
                        <span className="font-medium text-blue-900">{count} overrides</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method breakdown */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Interaction Methods</h4>
                  <div className="space-y-1">
                    {Object.entries(trends.methodCounts).map(([method, count]) => (
                      <div key={method} className="flex justify-between text-sm">
                        <span className="text-blue-700">{getMethodLabel(method as OverrideEvent['interactionMethod'])}</span>
                        <span className="font-medium text-blue-900">{count} overrides</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Energy level breakdown */}
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Energy Level Patterns</h4>
                  <div className="space-y-1">
                    {Object.entries(trends.energyCounts).map(([energy, count]) => (
                      <div key={energy} className="flex justify-between text-sm">
                        <span className="text-blue-700">When {energy}</span>
                        <span className="font-medium text-blue-900">{count} override{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search override history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Filter by Action</option>
                <option value="disagree">Disagree</option>
                <option value="override_tap">Override Tap</option>
                <option value="skip_exercise">Skip Exercise</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Filter by Method</option>
                <option value="one_tap">One-tap</option>
                <option value="menu_selection">Menu Selection</option>
              </select>

              <select
                value={energyFilter}
                onChange={(e) => setEnergyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Filter by Energy Level</option>
                <option value="normal">Normal</option>
                <option value="tired">Tired</option>
              </select>
            </div>
          </div>

          {/* Override List */}
          <div className="space-y-2">
            {filteredHistory.length === 0 && (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No overrides match your filters</p>
              </div>
            )}

            {filteredHistory.map((override) => (
              <div
                key={override.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getActionIcon(override.userAction)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize text-gray-900">
                          {override.userAction.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getMethodLabel(override.interactionMethod)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(override.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span>Energy: {override.context.energyLevel}</span>
                          <span>Time: {override.context.timeRemaining}s</span>
                          <span>Processing: {override.processingTime}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Clear History Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Override History?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All override history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};