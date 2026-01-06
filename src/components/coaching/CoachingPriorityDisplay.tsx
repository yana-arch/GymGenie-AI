/**
 * Coaching Priority Display Component
 * Shows priority levels and conflict resolution information
 * WCAG Level AA compliant
 */

import React from 'react';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Shield,
  Heart,
  Activity,
  TrendingUp
} from 'lucide-react';
import { CoachingDecision, CoachingPriority } from '../../features/unified-coaching/types/unifiedCoaching.types';

interface CoachingPriorityDisplayProps {
  decision: CoachingDecision;
  priorityInfo?: {
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  };
}

export const CoachingPriorityDisplay: React.FC<CoachingPriorityDisplayProps> = ({
  decision,
  priorityInfo
}) => {
  // Get system-specific icons
  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'safety-override':
        return Shield;
      case 'injury-aware':
        return Heart;
      case 'form-correction':
        return Activity;
      case 'realtime-adaptations':
        return TrendingUp;
      default:
        return Info;
    }
  };

  // Get severity icon and color
  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'High Priority'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          label: 'Medium Priority'
        };
      case 'low':
        return {
          icon: Info,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Low Priority'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'No Issues'
        };
    }
  };

  // Get priority order number
  const getPriorityOrder = (priority: CoachingPriority): number => {
    switch (priority) {
      case CoachingPriority.SAFETY:
        return 1;
      case CoachingPriority.INJURY:
        return 2;
      case CoachingPriority.FORM:
        return 3;
      case CoachingPriority.ADAPTATION:
        return 4;
      default:
        return 999;
    }
  };

  return (
    <div className="space-y-3">
      {/* Priority Level */}
      {priorityInfo && (
        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-center space-x-2">
            <span className={`font-medium text-sm ${priorityInfo.color}`}>
              Priority #{getPriorityOrder(decision.priority)}
            </span>
            <span className="text-sm text-gray-700">
              {priorityInfo.label}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>Highest priority among {decision.metadata.systemsConsidered} systems</span>
          </div>
        </div>
      )}

      {/* Contributing Systems */}
      {decision.contributingSystems.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-md">
          <h4 className="font-medium text-sm text-gray-900 mb-2">
            AI Systems Contributing
          </h4>
          <div className="space-y-2">
            {decision.contributingSystems.map((contribution, index) => {
              const SystemIcon = getSystemIcon(contribution.system);
              const wasConflicted = contribution.wasConflicted;
              
              return (
                <div 
                  key={`${contribution.system}-${index}`}
                  className={`flex items-center justify-between p-2 rounded border ${
                    wasConflicted ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SystemIcon 
                      className={`h-4 w-4 ${
                        wasConflicted ? 'text-orange-600' : 'text-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={`text-sm ${
                      contribution.priority === decision.priority ? 'font-medium' : 'text-gray-600'
                    }`}>
                      {contribution.system.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {wasConflicted && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Conflict</span>
                      </div>
                    )}
                    <span>Conf: {(contribution.response.confidence * 100).toFixed(1)}%</span>
                    <span>Priority: #{getPriorityOrder(contribution.priority)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conflict Resolution */}
      {decision.conflictResolution && decision.conflictResolution.conflicts.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
          <h4 className="font-medium text-sm text-orange-900 mb-2">
            Conflict Resolution Applied
          </h4>
          <div className="space-y-2">
            <div className="text-xs text-orange-700">
              Strategy: {decision.conflictResolution.strategy}
            </div>
            
            {decision.conflictResolution.conflicts.map((conflict, index) => {
              const severityInfo = getSeverityInfo(conflict.severity);
              const SeverityIcon = severityInfo.icon;
              
              return (
                <div 
                  key={index}
                  className={`flex items-start space-x-2 p-2 rounded ${severityInfo.bgColor} border border-orange-200`}
                >
                  <SeverityIcon 
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${severityInfo.color}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {severityInfo.label} Conflict
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {conflict.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Resolution: {conflict.resolution}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {decision.conflictResolution.reasoning && (
            <div className="mt-2 text-xs text-orange-700 italic">
              {decision.conflictResolution.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Processing Metadata */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Processing strategy: Priority hierarchy with conflict resolution</div>
        <div>Total processing time: {decision.metadata.processingTime.toFixed(0)}ms</div>
        <div>Systems evaluated: {decision.contributingSystems.length}</div>
        <div>Conflicts resolved: {decision.metadata.conflictsResolved}</div>
      </div>
    </div>
  );
};