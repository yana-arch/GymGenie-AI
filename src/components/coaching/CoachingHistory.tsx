/**
 * Coaching History Component
 * Displays comprehensive coaching decision history with filtering
 * WCAG Level AA compliant
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Shield,
  Heart,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector } from '../../store';
import { selectCoachingHistory } from '../../store/unifiedCoachingSlice';
import { CoachingDecision, CoachingPriority, CoachingContribution } from '../../features/unified-coaching/types/unifiedCoaching.types';

interface CoachingHistoryProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
}

export const CoachingHistory: React.FC<CoachingHistoryProps> = ({
  className = '',
  maxItems = 20,
  showFilters = true
}) => {
  const history = useAppSelector(selectCoachingHistory);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [filterPriority, setFilterPriority] = useState<CoachingPriority | 'all'>('all');
  const [filterConflicts, setFilterConflicts] = useState<'all' | boolean>('all');

  // Get priority icon
  const getPriorityIcon = (priority: CoachingPriority) => {
    switch (priority) {
      case CoachingPriority.SAFETY:
        return Shield;
      case CoachingPriority.INJURY:
        return Heart;
      case CoachingPriority.FORM:
        return Activity;
      case CoachingPriority.ADAPTATION:
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: CoachingPriority) => {
    switch (priority) {
      case CoachingPriority.SAFETY:
        return 'text-red-600 bg-red-100 border-red-200';
      case CoachingPriority.INJURY:
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case CoachingPriority.FORM:
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case CoachingPriority.ADAPTATION:
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Filter history based on selected filters
  const filteredHistory = useMemo(() => {
    let filtered = [...history].reverse(); // Show newest first

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    // Apply conflict filter
    if (filterConflicts !== 'all') {
      filtered = filtered.filter(item => 
        filterConflicts ? 
          item.metadata.conflictsResolved > 0 : 
          item.metadata.conflictsResolved === 0
      );
    }

    return filtered.slice(0, maxItems);
  }, [history, filterPriority, filterConflicts, maxItems]);

  // Toggle expanded state for an item
  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (filteredHistory.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No coaching history available</p>
        {showFilters && (
          <p className="text-sm mt-1">
            Try adjusting filters to see more results
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as CoachingPriority | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value={CoachingPriority.SAFETY}>Safety</option>
                <option value={CoachingPriority.INJURY}>Injury Prevention</option>
                <option value={CoachingPriority.FORM}>Form Correction</option>
                <option value={CoachingPriority.ADAPTATION}>Performance Adaptation</option>
              </select>
            </div>

            {/* Conflict Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conflicts
              </label>
              <select
                value={filterConflicts === 'all' ? 'all' : filterConflicts ? 'true' : 'false'}
                onChange={(e) => setFilterConflicts((e.target.value as string) === 'all' ? 'all' : (e.target.value as string) === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="true">With Conflicts</option>
                <option value="false">No Conflicts</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* History Items */}
      <div className="space-y-3">
        {filteredHistory.map((decision, index) => {
          const PriorityIcon = getPriorityIcon(decision.priority);
          const priorityColor = getPriorityColor(decision.priority);
          const isExpanded = expandedItems.has(index);

          return (
            <div 
              key={decision.metadata.timestamp}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div 
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${priorityColor}`}
                onClick={() => toggleExpanded(index)}
                role="button"
                aria-expanded={isExpanded}
                aria-controls={`history-item-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <PriorityIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {decision.priority.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTime(decision.metadata.timestamp)} • 
                        {formatDuration(decision.metadata.processingTime)} • 
                        {decision.contributingSystems.length} systems
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {decision.metadata.conflictsResolved > 0 && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {decision.metadata.conflictsResolved}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div 
                  id={`history-item-${index}`}
                  className="p-4 bg-white border-t border-gray-200"
                >
                  <div className="space-y-3">
                    {/* Recommendation */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Recommendation</h4>
                      <div className="text-sm text-gray-700">
                        {typeof decision.response.recommendation === 'object' && 
                         decision.response.recommendation.message ? (
                          <p>{decision.response.recommendation.message}</p>
                        ) : (
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(decision.response.recommendation, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Confidence: {(decision.response.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Contributing Systems */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Contributing Systems</h4>
                      <div className="space-y-1">
                        {decision.contributingSystems.map((contribution: CoachingContribution, sysIndex: number) => (
                          <div 
                            key={sysIndex}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {contribution.system.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Priority: #{String(contribution.priority)}</span>
                              {contribution.wasConflicted && (
                                <span className="text-orange-600 font-medium">Conflict</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conflict Resolution */}
                    {decision.conflictResolution && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Conflict Resolution</h4>
                        <div className="text-sm text-gray-700">
                          <div>Strategy: {decision.conflictResolution.strategy}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {decision.conflictResolution.reasoning}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Processing: {formatDuration(decision.metadata.processingTime)}</div>
                        <div>Systems: {decision.metadata.systemsConsidered}</div>
                        <div>Conflicts: {decision.metadata.conflictsResolved}</div>
                        <div>Priority: {decision.priority}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More/Less */}
      {history.length > maxItems && (
        <div className="text-center text-sm text-gray-500">
          Showing {Math.min(maxItems, filteredHistory.length)} of {history.length} total decisions
        </div>
      )}
    </div>
  );
};