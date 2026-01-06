import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { Injury, InjuryHistory } from '../../features/injury-aware/types';
import {
  loadInjuryHistory,
  saveInjuryHistory,
  selectInjuryHistory,
  selectInjuryConstraints,
  selectInjuryError
} from '../../features/injury-aware/store/injuryAwareSlice';

interface InjuryHistoryComponentProps {
  className?: string;
}

const InjuryHistoryComponent: React.FC<InjuryHistoryComponentProps> = ({ className = '' }) => {
  const dispatch = useDispatch();
  const injuryHistory = useSelector(selectInjuryHistory);
  const constraints = useSelector(selectInjuryConstraints);
  const isLoading = useSelector((state: any) => state.injuryAware?.isLoadingInjuries || false);
  const error = useSelector(selectInjuryError);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingHistory, setEditingHistory] = useState<InjuryHistory>({ injuries: [] });

  useEffect(() => {
    dispatch(loadInjuryHistory() as any);
  }, [dispatch]);

  useEffect(() => {
    setEditingHistory(injuryHistory);
  }, [injuryHistory]);

  const handleAddInjury = () => {
    const newInjury: Injury = {
      id: `injury_${Date.now()}`,
      type: 'knee',
      location: 'left',
      severity: 'moderate',
      date: new Date().toISOString().split('T')[0],
      status: 'recovering',
      restrictions: []
    };
    setEditingHistory({
      injuries: [...editingHistory.injuries, newInjury]
    });
  };

  const handleRemoveInjury = (injuryId: string) => {
    setEditingHistory({
      injuries: editingHistory.injuries.filter(injury => injury.id !== injuryId)
    });
  };

  const handleUpdateInjury = (injuryId: string, updates: Partial<Injury>) => {
    setEditingHistory({
      injuries: editingHistory.injuries.map(injury =>
        injury.id === injuryId ? { ...injury, ...updates } : injury
      )
    });
  };

  const handleSave = async () => {
    try {
      await dispatch(saveInjuryHistory(editingHistory) as any);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save injury history:', error);
    }
  };

  const handleCancel = () => {
    setEditingHistory(injuryHistory);
    setIsEditing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'severe': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recovered': return 'text-green-600 bg-green-100';
      case 'recovering': return 'text-blue-600 bg-blue-100';
      case 'chronic': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-red-600">
          <p className="font-semibold">Error loading injury history</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Injury History</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your injury history for safe workout recommendations
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isLoading as boolean}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isLoading as boolean}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleAddInjury}
              >
                Add Injury
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Current Constraints Display */}
      {constraints && (
        <Card variant="outlined" className="mb-6 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Current Safety Constraints
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {constraints.constraints.map((constraint, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                {constraint.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          {constraints.blockedMovements.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Blocked Movements:
              </p>
              <div className="flex flex-wrap gap-1">
                {constraints.blockedMovements.map((movement, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                  >
                    {movement.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Injury List */}
      <div className="space-y-4">
        {editingHistory.injuries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No injuries recorded. Add injuries to get personalized safety recommendations.
            </p>
          </div>
        ) : (
          editingHistory.injuries.map((injury) => (
            <Card key={injury.id} variant="outlined" className="p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <select
                        value={injury.type}
                        onChange={(e) => handleUpdateInjury(injury.id, { type: injury.type as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="knee">Knee</option>
                        <option value="shoulder">Shoulder</option>
                        <option value="back">Back</option>
                        <option value="ankle">Ankle</option>
                        <option value="wrist">Wrist</option>
                        <option value="hip">Hip</option>
                        <option value="elbow">Elbow</option>
                        <option value="neck">Neck</option>
                      </select>

                      <select
                        value={injury.location}
                        onChange={(e) => handleUpdateInjury(injury.id, { location: injury.location as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="center">Center</option>
                        <option value="upper">Upper</option>
                        <option value="lower">Lower</option>
                      </select>

                      <select
                        value={injury.severity}
                        onChange={(e) => handleUpdateInjury(injury.id, { severity: injury.severity as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>

                      <select
                        value={injury.status}
                        onChange={(e) => handleUpdateInjury(injury.id, { status: injury.status as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      >
                        <option value="recovering">Recovering</option>
                        <option value="recovered">Recovered</option>
                        <option value="chronic">Chronic</option>
                      </select>

                      <input
                        type="date"
                        value={injury.date}
                        onChange={(e) => handleUpdateInjury(injury.id, { date: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveInjury(injury.id)}
                      className="ml-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {injury.location} {injury.type} Injury
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(injury.date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(injury.severity)}`}>
                        {injury.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(injury.status)}`}>
                        {injury.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

export default InjuryHistoryComponent;