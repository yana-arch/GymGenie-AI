import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActiveGuidance, 
  addMilestone 
} from '../store/liveSessionSlice';
import { sessionGuidanceService } from '../services/SessionGuidanceService';
import { RootState } from '@/store';

const speakGuidance = (message: string, isPriority: boolean = false) => {
  if ('speechSynthesis' in window) {
    // Safety > Celebration: Only cancel if this is a priority message
    // If not priority, wait for current speech to finish
    if (isPriority) {
      window.speechSynthesis.cancel();
    }
    
    if (isPriority || !window.speechSynthesis.speaking) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = isPriority ? 0.9 : 1.1; // Slightly different pitches for safety vs celebration
      window.speechSynthesis.speak(utterance);
    }
  }
};

export const useGuidanceLoop = (isActive: boolean, progress: number) => {
  const dispatch = useDispatch();
  const lastMessageRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const liveSession = useSelector((state: RootState) => state.liveSession);
  const quietMode = liveSession.quietMode;
  
  // Get other coaching contexts from state
  const formCorrection = useSelector((state: RootState) => (state as any).formCorrection || { isActive: false });
  const safetyOverride = useSelector((state: RootState) => (state as any).safetyOverride || { isActive: false });
  const injuryAware = useSelector((state: RootState) => (state as any).injuryAware || { isActive: false });

  useEffect(() => {
    if (isActive) {
      sessionGuidanceService.startGuidanceLoop();
      
      const tick = async () => {
        try {
          // Prepare compatible objects for the orchestrator
          const orchestratorInput = {
            liveSession: {
              isActive: liveSession.isActive,
              currentAdaptation: liveSession.adaptation,
              confidence: 0.9,
              energy: liveSession.activeContext.energy,
              time: liveSession.activeContext.time
            },
            formCorrection: {
              isActive: formCorrection.isActive,
              currentCorrection: formCorrection.currentCorrection,
              confidence: formCorrection.confidence
            },
            safetyOverride: {
              isActive: safetyOverride.isActive,
              overrideAction: safetyOverride.overrideAction
            },
            injuryAware: {
              isActive: injuryAware.isActive,
              currentRecommendation: injuryAware.currentRecommendation,
              confidence: injuryAware.confidence
            }
          };

          const decision = await sessionGuidanceService.processGuidanceTick(orchestratorInput as any);
          
          dispatch(setActiveGuidance(decision));

          // Audio guidance if message changed and not in quiet mode
          const message = decision.response.recommendation.message;
          if (message && message !== lastMessageRef.current && !quietMode) {
            // Coaching decisions are usually safety or form related - high priority
            speakGuidance(message, true);
            lastMessageRef.current = message;
          }
          
          // Check for milestones
          const reachedMilestones = sessionGuidanceService.checkMilestones(progress, liveSession.activeContext.energy);
          reachedMilestones.forEach(m => {
            dispatch(addMilestone(m));
            // Milestones are lower priority - don't cancel safety warnings
            if (!quietMode && m.encouragement) speakGuidance(m.encouragement, m.priority === 'high');
          });
          
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
  }, [isActive, dispatch, progress, liveSession.isActive, liveSession.adaptation, formCorrection, safetyOverride, injuryAware]);

  return {
    activeGuidance: liveSession.activeGuidance,
    milestoneHistory: liveSession.milestoneHistory
  };
};
