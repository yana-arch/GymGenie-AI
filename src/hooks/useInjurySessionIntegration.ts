import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import type { DiscomfortEvent } from '../features/injury-aware/types';
import {
  recordDiscomfort,
  selectActiveSessionInjuryStatus,
  selectInjuryConstraints,
  filterAIRecommendations,
  updateSessionInjuryStatus
} from '../features/injury-aware/store/injuryAwareSlice';
import type { AIRecommendation } from '../features/injury-aware/types';

/**
 * Hook to integrate injury systems with live sessions
 * Provides real-time injury status updates and AI recommendation filtering
 */
export const useLiveSessionInjuryIntegration = () => {
  const dispatch = useDispatch();
  const injuryStatus = useSelector(selectActiveSessionInjuryStatus);
  const injuryConstraints = useSelector(selectInjuryConstraints);

  // Filter AI recommendations based on injury constraints
  const filterRecommendations = async (recommendations: AIRecommendation[]) => {
    if (!injuryConstraints) {
      return { filtered: recommendations, blocked: [] };
    }

    try {
      const result = await dispatch(filterAIRecommendations(recommendations) as any);
      return result.payload;
    } catch (error) {
      console.error('Failed to filter recommendations:', error);
      return { filtered: recommendations, blocked: [] };
    }
  };

  // Report discomfort with session context
  const reportDiscomfortWithSession = async (discomfortData: Omit<DiscomfortEvent, 'id' | 'timestamp'>) => {
    try {
      const result = await dispatch(recordDiscomfort(discomfortData) as any);

      // Update session injury status based on discomfort severity
      if (result.payload) {
        const severity = result.payload.severity;
        let newStatus: 'safe' | 'caution' | 'stop' = 'safe';
        
        if (severity >= 4) {
          newStatus = 'stop';
        } else if (severity >= 3) {
          newStatus = 'caution';
        }
        
        dispatch(updateSessionInjuryStatus(newStatus));
      }

      return result.payload;
    } catch (error) {
      console.error('Failed to report discomfort:', error);
      throw error;
    }
  };

  // Get safety recommendations for current exercise
  const getSafetyRecommendations = (exerciseId: string): string[] => {
    if (!injuryConstraints) return [];

    const recommendations: string[] = [];
    
    // Check if exercise is blocked
    if (injuryConstraints.blockedMovements.some(blocked => 
      exerciseId.toLowerCase().includes(blocked.toLowerCase()))) {
      recommendations.push('EXERCISE_BLOCKED: This exercise conflicts with your injury history');
      
      // Suggest alternatives
      const alternatives = injuryConstraints.recommendedAlternatives;
      if (alternatives.length > 0) {
        recommendations.push(`ALTERNATIVES: Consider ${alternatives.join(', ')}`);
      }
    }

    // Check for general constraints
    if (injuryConstraints.constraints.includes('no_heavy_lifting')) {
      recommendations.push('REDUCE_INTENSITY: Use lighter weight due to injury constraints');
    }
    
    if (injuryConstraints.constraints.includes('no_high_impact')) {
      recommendations.push('MODIFY_EXERCISE: Reduce impact or choose low-impact alternative');
    }

    return recommendations;
  };

  // Check if exercise is safe for current injury status
  const isExerciseSafe = (exerciseId: string): boolean => {
    if (!injuryConstraints || injuryStatus === 'stop') {
      return false;
    }

    // Check blocked movements
    const isBlocked = injuryConstraints.blockedMovements.some(blocked => 
      exerciseId.toLowerCase().includes(blocked.toLowerCase())
    );

    if (isBlocked) {
      return false;
    }

    // Check if severe constraints apply
    if (injuryConstraints.safetyLevel === 'restricted') {
      return false;
    }

    return true;
  };

  return {
    injuryStatus,
    injuryConstraints,
    filterRecommendations,
    reportDiscomfortWithSession,
    getSafetyRecommendations,
    isExerciseSafe
  };
};

/**
 * Hook to monitor real-time discomfort and trigger automatic adaptations
 */
export const useRealTimeDiscomfortMonitoring = () => {
  const dispatch = useDispatch();
  const injuryStatus = useSelector(selectActiveSessionInjuryStatus);
  const lastDiscomfortEvent = useSelector((state: any) => state.injuryAware?.lastDiscomfortEvent);

  // Analyze discomfort patterns and suggest adaptations
  useEffect(() => {
    if (!lastDiscomfortEvent) return;

    const { severity, location, exercise } = lastDiscomfortEvent;
    
    // Auto-adapt based on severity and location
    if (severity >= 4) {
      // Severe discomfort - immediate safety response
      dispatch(updateSessionInjuryStatus('stop'));
      
      // Log safety event
      console.warn(`Severe discomfort detected in ${location} during ${exercise}. Exercise stopped.`);
      
    } else if (severity >= 3) {
      // Moderate discomfort - caution mode
      dispatch(updateSessionInjuryStatus('caution'));
      
      // Suggest adaptations
      console.log(`Moderate discomfort detected in ${location}. Consider reducing intensity.`);
    }

  }, [lastDiscomfortEvent, dispatch]);

  // Get automatic workout adaptations based on recent discomfort
  const getWorkoutAdaptations = (): {
    shouldModify: boolean;
    modifications: string[];
    alternativeExercises: string[];
  } => {
    if (!lastDiscomfortEvent || injuryStatus === 'safe') {
      return {
        shouldModify: false,
        modifications: [],
        alternativeExercises: []
      };
    }

    const { severity, location, exercise } = lastDiscomfortEvent;
    const modifications: string[] = [];
    const alternativeExercises: string[] = [];

    // Severity-based adaptations
    if (severity >= 4) {
      modifications.push('STOP_CURRENT_EXERCISE');
      modifications.push('TAKE_IMMEDIATE_REST');
      
      // Location-specific alternatives
      switch (location.toLowerCase()) {
        case 'knee':
          alternativeExercises.push('seated_exercises', 'upper_body_workout');
          break;
        case 'back':
          alternativeExercises.push('light_cardio', 'stretching');
          break;
        case 'shoulder':
          alternativeExercises.push('lower_body_focus', 'core_exercises');
          break;
      }
      
    } else if (severity >= 3) {
      modifications.push('REDUCE_WEIGHT_BY_25_PERCENT');
      modifications.push('DECREASE_RANGE_OF_MOTION');
      modifications.push('INCREASE_REST_TIME');
      
      if (location.toLowerCase() === 'knee') {
        alternativeExercises.push('partial_squats', 'leg_press');
      }
    }

    return {
      shouldModify: true,
      modifications,
      alternativeExercises
    };
  };

  return {
    injuryStatus,
    lastDiscomfortEvent,
    getWorkoutAdaptations
  };
};