import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Achievement } from '../types/achievement.types';

interface AchievementState {
  earnedAchievements: Achievement[];
  recentAchievementIds: string[]; // IDs of achievements earned in the current session
}

const initialState: AchievementState = {
  earnedAchievements: [],
  recentAchievementIds: [],
};

const achievementSlice = createSlice({
  name: 'achievement',
  initialState,
  reducers: {
    addAchievements: (state, action: PayloadAction<Achievement[]>) => {
      // Avoid duplicate achievements by definition ID if they are consistency/volume/streak
      // but allow multiple for PBs if they are for different exercises (though our current service avoids duplicates)
      const newAchievements = action.payload.filter(
        newA => !state.earnedAchievements.some(existingA => existingA.id === newA.id)
      );
      
      if (newAchievements.length > 0) {
        state.earnedAchievements.push(...newAchievements);
        state.recentAchievementIds.push(...newAchievements.map(a => a.earnedId));
      }
    },
    clearRecentAchievements: (state) => {
      state.recentAchievementIds = [];
    },
    resetAchievements: (state) => {
      state.earnedAchievements = [];
      state.recentAchievementIds = [];
    }
  }
});

export const { addAchievements, clearRecentAchievements, resetAchievements } = achievementSlice.actions;
export default achievementSlice.reducer;
