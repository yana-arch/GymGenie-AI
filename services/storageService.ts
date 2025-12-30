import { AppState, UserProfile, WorkoutPlan, WorkoutHistoryEntry } from '../types';

const KEYS = {
  USER_PROFILE: 'gymgenie_user',
  EQUIPMENT: 'gymgenie_equipment',
  WORKOUT_PLAN: 'gymgenie_plan',
  APP_STEP: 'gymgenie_step',
  WORKOUT_HISTORY: 'gymgenie_history'
};

export const StorageService = {
  saveUser: (user: UserProfile): void => {
    try {
      localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  },

  getUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveEquipment: (equipment: string[]): void => {
    localStorage.setItem(KEYS.EQUIPMENT, JSON.stringify(equipment));
  },

  getEquipment: (): string[] => {
    const data = localStorage.getItem(KEYS.EQUIPMENT);
    return data ? JSON.parse(data) : [];
  },

  savePlan: (plan: WorkoutPlan): void => {
    localStorage.setItem(KEYS.WORKOUT_PLAN, JSON.stringify(plan));
  },

  getPlan: (): WorkoutPlan | null => {
    const data = localStorage.getItem(KEYS.WORKOUT_PLAN);
    return data ? JSON.parse(data) : null;
  },

  saveStep: (step: string): void => {
    localStorage.setItem(KEYS.APP_STEP, step);
  },

  getStep: (): string | null => {
    return localStorage.getItem(KEYS.APP_STEP);
  },

  saveHistory: (history: WorkoutHistoryEntry[]): void => {
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
  },

  getHistory: (): WorkoutHistoryEntry[] => {
    const data = localStorage.getItem(KEYS.WORKOUT_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  clearAll: (): void => {
    localStorage.clear();
  }
};