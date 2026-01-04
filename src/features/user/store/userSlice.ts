import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile, AppStep, AiProviderConfig } from "@/types";
import { StorageService } from "@/services/storage/StorageService";

interface UserSliceState {
  profile: UserProfile | null;
  equipment: string[];
  currentStep: AppStep;
  aiConfig: AiProviderConfig;
  preferences: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    autoStartTimer: boolean;
    defaultRestTime: number;
    units: "metric" | "imperial";
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
  };
}

const initialState: UserSliceState = {
  profile: null,
  equipment: [],
  currentStep: "onboarding",
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
  },
  aiConfig: StorageService.getAiConfig() || {
    provider: "google",
    apiKey: "",
    useCustomUrl: false,
    customUrl: "",
    model: "gemini-1.5-flash",
  },
  preferences: {
    theme: "system",
    notifications: true,
    autoStartTimer: true,
    defaultRestTime: 60,
    units: "metric",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },

    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },

    setEquipment: (state, action: PayloadAction<string[]>) => {
      state.equipment = action.payload;
    },

    addEquipment: (state, action: PayloadAction<string>) => {
      if (!state.equipment.includes(action.payload)) {
        state.equipment.push(action.payload);
      }
    },

    removeEquipment: (state, action: PayloadAction<string>) => {
      state.equipment = state.equipment.filter(
        (item) => item !== action.payload
      );
    },

    setCurrentStep: (state, action: PayloadAction<AppStep>) => {
      state.currentStep = action.payload;
    },

    setAiConfig: (state, action: PayloadAction<AiProviderConfig>) => {
      state.aiConfig = action.payload;
      StorageService.saveAiConfig(action.payload);
    },

    updateAiConfig: (
      state,
      action: PayloadAction<Partial<AiProviderConfig>>
    ) => {
      state.aiConfig = { ...state.aiConfig, ...action.payload };
      StorageService.saveAiConfig(state.aiConfig);
    },

    updatePreferences: (
      state,
      action: PayloadAction<Partial<UserSliceState["preferences"]>>
    ) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.preferences.theme = action.payload;
    },

    toggleNotifications: (state) => {
      state.preferences.notifications = !state.preferences.notifications;
    },

    setDefaultRestTime: (state, action: PayloadAction<number>) => {
      state.preferences.defaultRestTime = Math.max(
        10,
        Math.min(600, action.payload)
      );
    },

    setUnits: (state, action: PayloadAction<"metric" | "imperial">) => {
      state.preferences.units = action.payload;
    },

    updateStreak: (state) => {
      const today = new Date().toISOString().split("T")[0];
      const lastWorkout = state.streak.lastWorkoutDate;

      if (lastWorkout === today) {
        return; // Already updated today
      }

      if (lastWorkout) {
        const lastDate = new Date(lastWorkout);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          state.streak.currentStreak += 1;
        } else {
          state.streak.currentStreak = 1;
        }
      } else {
        state.streak.currentStreak = 1;
      }

      if (state.streak.currentStreak > state.streak.longestStreak) {
        state.streak.longestStreak = state.streak.currentStreak;
      }
      state.streak.lastWorkoutDate = today;
    },

    clearUserData: (state) => {
      state.profile = null;
      state.equipment = [];
      state.currentStep = "onboarding";
      state.streak = {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
      };
      // Keep preferences when clearing user data
    },

    resetAllUserData: (state) => {
      return initialState;
    },
  },
});

export const {
  setProfile,
  updateProfile,
  setEquipment,
  addEquipment,
  removeEquipment,
  setCurrentStep,
  setAiConfig,
  updateAiConfig,
  updatePreferences,
  setTheme,
  toggleNotifications,
  setDefaultRestTime,
  setUnits,
  updateStreak,
  clearUserData,
  resetAllUserData,
} = userSlice.actions;

export default userSlice.reducer;
