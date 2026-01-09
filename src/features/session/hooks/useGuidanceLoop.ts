import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActiveGuidance, 
  addMilestone 
} from '../store/liveSessionSlice';
import { sessionGuidanceService } from '../services/SessionGuidanceService';
import { EncouragementService } from '../services/EncouragementService';
import { AudioCoachingService } from '@/features/form-correction/services/AudioCoachingService';
import { RootState } from '@/store';
import { 
  CoachingPriority,
  LiveSessionState as CoachingLiveSessionState,
  FormCorrectionState as CoachingFormCorrectionState,
  SafetyOverrideState as CoachingSafetyOverrideState,
  InjuryAwareState as CoachingInjuryAwareState
} from '@/features/unified-coaching/types/unifiedCoaching.types';

export const useGuidanceLoop = (isActive: boolean, progress: number) => {
  const dispatch = useDispatch();
  const lastMessageRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isActiveStored = useSelector((state: RootState) => state.liveSession.isActive);
  const currentAdaptation = useSelector((state: RootState) => state.liveSession.adaptation);
  const energy = useSelector((state: RootState) => state.liveSession.activeContext.energy);
  const time = useSelector((state: RootState) => state.liveSession.activeContext.time);
  const sessionVolume = useSelector((state: RootState) => state.liveSession.sessionVolume);
  const quietMode = useSelector((state: RootState) => state.liveSession.quietMode);
  
  // Get other coaching contexts from state
  const formCorrection = useSelector((state: RootState) => state.formCorrection);
  const safetyOverride = useSelector((state: RootState) => state.safetyOverride);
  const injuryAware = useSelector((state: RootState) => state.injuryAware);

  const activeGuidance = useSelector((state: RootState) => state.liveSession.activeGuidance);
  const milestoneHistory = useSelector((state: RootState) => state.liveSession.milestoneHistory);

  useEffect(() => {
    if (isActive) {
      sessionGuidanceService.startGuidanceLoop();
      
      const tick = async () => {
        try {
          // Prepare compatible objects for the orchestrator
          const orchestratorInput = {
            liveSession: {
              isActive: isActiveStored,
              currentAdaptation: currentAdaptation,
              confidence: 0.9
            } as CoachingLiveSessionState,
            formCorrection: {
              isActive: formCorrection.isActive,
              currentCorrection: formCorrection.feedback,
              confidence: 0.9
            } as CoachingFormCorrectionState,
            safetyOverride: {
              isActive: safetyOverride.isMonitoring,
            } as CoachingSafetyOverrideState,
            injuryAware: {
              isActive: injuryAware.activeSessionInjuryStatus !== 'unknown',
              currentRecommendation: injuryAware.filteredRecommendations,
              confidence: 0.9
            } as CoachingInjuryAwareState
          };

          const decision = await sessionGuidanceService.processGuidanceTick(orchestratorInput);
          
          dispatch(setActiveGuidance(decision));

          // Audio guidance if message changed and not in quiet mode
          const message = decision.response.recommendation.message;
          if (message && message !== lastMessageRef.current && !quietMode) {
            // Coaching decisions are usually safety or form related - high priority
            AudioCoachingService.getInstance().speak(message, decision.priority);
            lastMessageRef.current = message;
          }
          
          // Check for milestones
          const reachedMilestones = sessionGuidanceService.checkMilestones(progress, energy);
          reachedMilestones.forEach(m => {
            dispatch(addMilestone(m));
            // Milestones are lower priority - don't cancel safety warnings
            if (!quietMode && m.encouragement) {
              AudioCoachingService.getInstance().speak(m.encouragement, CoachingPriority.ENCOURAGEMENT);
            }
          });

          // Encouragement triggers
          const encouragementService = EncouragementService.getInstance();
          
          // Workout-level progress (25%, 50%, 75%)
          encouragementService.checkWorkoutProgress(progress);
          
          // Fatigue check
          encouragementService.checkFatigue();
          
          // Volume milestone check
          if (sessionVolume > 0) {
            encouragementService.celebrateVolume(sessionVolume);
          }
          
        } catch (error) {
          console.error('Guidance tick failed:', error);
        }
      };

      // Initial tick
      tick();
      
      // Setup interval
      intervalRef.current = setInterval(tick, 5000);
    } else {
      sessionGuidanceService.stopGuidanceLoop();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      dispatch(setActiveGuidance(null));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, dispatch, progress, isActiveStored, currentAdaptation, energy, time, sessionVolume, formCorrection, safetyOverride, injuryAware]);

  return {
    activeGuidance,
    milestoneHistory
  };
};
