import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { AchievementService } from '../services/AchievementService';
import { addAchievements } from '../store/achievementSlice';

/**
 * Headless component that monitors workout history and sessions
 * to trigger achievement checks.
 */
const AchievementManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state: any) => state.workout.history);
  const sessions = useAppSelector((state: any) => state.session.sessions);
  const earnedAchievements = useAppSelector((state: any) => state.achievement.earnedAchievements);
  
  useEffect(() => {
    // Only check if we have history data
    if (history && history.length > 0) {
      const achievementService = AchievementService.getInstance();
      const existingIds = earnedAchievements ? earnedAchievements.map((a: any) => a.id) : [];
      
      // checkAchievements is efficient and skips existing IDs
      const newAchievements = achievementService.checkAchievements(history, sessions || {}, existingIds);
      
      if (newAchievements.length > 0) {
        dispatch(addAchievements(newAchievements));
      }
    }
  }, [history, sessions, earnedAchievements, dispatch]);

  return null;
};

export default AchievementManager;
