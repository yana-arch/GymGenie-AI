import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UISliceState {
  // Timer state
  timerSeconds: number;
  isTimerRunning: boolean;
  
  // Modal states
  modals: {
    staleSession: boolean;
    exerciseDetail: boolean;
    workoutComplete: boolean;
    settings: boolean;
  };
  
  // Loading states
  loading: {
    global: boolean;
    workout: boolean;
    session: boolean;
    sync: boolean;
  };
  
  // Navigation state
  navigation: {
    currentView: 'dashboard' | 'workout' | 'history' | 'settings';
    previousView: string | null;
    breadcrumbs: string[];
  };
  
  // Layout state
  layout: {
    sidebarOpen: boolean;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
    orientation: 'portrait' | 'landscape';
  };
  
  // Notifications/Alerts
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    autoHide?: boolean;
    duration?: number;
  }>;
  
  // Form states
  forms: {
    exerciseDetail: {
      isOpen: boolean;
      exerciseId: string | null;
      weekId: string | null;
      dayId: string | null;
    };
  };
}

const initialState: UISliceState = {
  timerSeconds: 0,
  isTimerRunning: false,
  
  modals: {
    staleSession: false,
    exerciseDetail: false,
    workoutComplete: false,
    settings: false,
  },
  
  loading: {
    global: false,
    workout: false,
    session: false,
    sync: false,
  },
  
  navigation: {
    currentView: 'dashboard',
    previousView: null,
    breadcrumbs: [],
  },
  
  layout: {
    sidebarOpen: false,
    breakpoint: 'desktop',
    orientation: 'portrait',
  },
  
  notifications: [],
  
  forms: {
    exerciseDetail: {
      isOpen: false,
      exerciseId: null,
      weekId: null,
      dayId: null,
    },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Timer actions
    setTimerSeconds: (state, action: PayloadAction<number>) => {
      state.timerSeconds = Math.max(0, action.payload);
    },
    
    startTimer: (state, action: PayloadAction<number>) => {
      state.timerSeconds = Math.max(0, action.payload);
      state.isTimerRunning = true;
    },
    
    stopTimer: (state) => {
      state.isTimerRunning = false;
      state.timerSeconds = 0;
    },
    
    pauseTimer: (state) => {
      state.isTimerRunning = false;
    },
    
    resumeTimer: (state) => {
      if (state.timerSeconds > 0) {
        state.isTimerRunning = true;
      }
    },
    
    addTimerSeconds: (state, action: PayloadAction<number>) => {
      state.timerSeconds += action.payload;
    },
    
    tickTimer: (state) => {
      if (state.isTimerRunning && state.timerSeconds > 0) {
        state.timerSeconds -= 1;
        if (state.timerSeconds <= 0) {
          state.isTimerRunning = false;
        }
      }
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<keyof UISliceState['modals']>) => {
      state.modals[action.payload] = true;
    },
    
    closeModal: (state, action: PayloadAction<keyof UISliceState['modals']>) => {
      state.modals[action.payload] = false;
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UISliceState['modals']] = false;
      });
    },
    
    // Loading actions
    setLoading: (state, action: PayloadAction<{ key: keyof UISliceState['loading']; value: boolean }>) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // Navigation actions
    setCurrentView: (state, action: PayloadAction<UISliceState['navigation']['currentView']>) => {
      state.navigation.previousView = state.navigation.currentView;
      state.navigation.currentView = action.payload;
    },
    
    goBack: (state) => {
      if (state.navigation.previousView) {
        const temp = state.navigation.currentView;
        state.navigation.currentView = state.navigation.previousView as UISliceState['navigation']['currentView'];
        state.navigation.previousView = temp;
      }
    },
    
    setBreadcrumbs: (state, action: PayloadAction<string[]>) => {
      state.navigation.breadcrumbs = action.payload;
    },
    
    // Layout actions
    toggleSidebar: (state) => {
      state.layout.sidebarOpen = !state.layout.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.layout.sidebarOpen = action.payload;
    },
    
    setBreakpoint: (state, action: PayloadAction<UISliceState['layout']['breakpoint']>) => {
      state.layout.breakpoint = action.payload;
    },
    
    setOrientation: (state, action: PayloadAction<UISliceState['layout']['orientation']>) => {
      state.layout.orientation = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<UISliceState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Form actions
    openExerciseDetailForm: (state, action: PayloadAction<{ exerciseId: string; weekId: string; dayId: string }>) => {
      const { exerciseId, weekId, dayId } = action.payload;
      state.forms.exerciseDetail = {
        isOpen: true,
        exerciseId,
        weekId,
        dayId,
      };
      state.modals.exerciseDetail = true;
    },
    
    closeExerciseDetailForm: (state) => {
      state.forms.exerciseDetail = {
        isOpen: false,
        exerciseId: null,
        weekId: null,
        dayId: null,
      };
      state.modals.exerciseDetail = false;
    },
    
    // Reset actions
    resetUI: (state) => {
      return initialState;
    },
  },
});

export const {
  setTimerSeconds,
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  addTimerSeconds,
  tickTimer,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  setCurrentView,
  goBack,
  setBreadcrumbs,
  toggleSidebar,
  setSidebarOpen,
  setBreakpoint,
  setOrientation,
  addNotification,
  removeNotification,
  clearNotifications,
  openExerciseDetailForm,
  closeExerciseDetailForm,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;