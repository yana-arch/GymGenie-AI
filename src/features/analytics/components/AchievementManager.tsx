import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch, RootState } from '@/store';
import { AchievementService } from '../services/AchievementService';
import { addAchievements } from '../store/achievementSlice';

/**
 * Headless component that monitors workout history and sessions
 * to trigger achievement checks.
 */
const AchievementManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state: RootState) => state.workout.history);
  const sessions = useAppSelector((state: RootState) => state.session.sessions);
  const earnedAchievements = useAppSelector((state: RootState) => state.achievement.earnedAchievements);
  const userSkillLevel = useAppSelector((state: RootState) => state.user.profile?.fitnessLevel || 'beginner');
  
  useEffect(() => {
    // Only check if we have history data
    if (history && history.length > 0) {
      const achievementService = AchievementService.getInstance();
      const existingIds = earnedAchievements ? earnedAchievements.map(a => a.id) : [];
      
      // checkAchievements is efficient and skips existing IDs
      const newAchievements = achievementService.checkAchievements(
        history, 
        sessions || {}, 
        existingIds,
        userSkillLevel
      );
      
      if (newAchievements.length > 0) {
        dispatch(addAchievements(newAchievements));
      }
    }
  }, [history, sessions, earnedAchievements, userSkillLevel, dispatch]);

  return null;
};

export default AchievementManager;
