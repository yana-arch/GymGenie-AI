import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SessionState, WorkoutAnalysis } from '@/types';
import { EnhancedWorkoutSession, SetPerformance, ExerciseSessionData } from '@/types/enhanced';

interface SessionSliceState {
  currentSession: EnhancedWorkoutSession | null;
  sessions: Record<string, EnhancedWorkoutSession>; // key: `${weekId}-${dayId}`
  staleSessionData: {
    lastActivity: number;
    activeSessionKey: string;
    sessionCount: number;
  } | null;
  showStaleSessionModal: boolean;
}

const initialState: SessionSliceState = {
  currentSession: null,
  sessions: {},
  staleSessionData: null,
  showStaleSessionModal: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<{ weekId: string; dayId: string }>) => {
      const { weekId, dayId } = action.payload;
      const sessionKey = `${weekId}-${dayId}`;
      const now = Date.now();
      
      // Check for existing active sessions
      const activeSession = Object.values(state.sessions).find(
        session => session.state === SessionState.ACTIVE
      );
      
      if (activeSession) {
        throw new Error('MULTIPLE_ACTIVE_SESSIONS: Cannot start new session while another is active');
      }
      
      // Check if session already exists and is not in a startable state
      const existingSession = state.sessions[sessionKey];
      if (existingSession && existingSession.state === SessionState.LOGGED) {
        throw new Error('INVALID_STATE_TRANSITION: Cannot restart a logged session');
      }
      
      const newSession: EnhancedWorkoutSession = {
        id: crypto.randomUUID(),
        weekId,
        dayId,
        state: SessionState.ACTIVE,
        startTime: now,
        completedTime: null,
        loggedTime: null,
        exerciseTimestamps: existingSession?.exerciseTimestamps || {},
        isReadOnly: false,
        exerciseData: {},
        // Enhanced properties
        createdAt: now,
        updatedAt: now,
        timestamp: now,
        environment: {
          location: 'gym',
          equipment: []
        },
        totalExercises: 0, // Should be populated from plan
        completedExercises: 0,
        estimatedDuration: 60 // Default
      };
      
      state.sessions[sessionKey] = newSession;
      state.currentSession = newSession;
    },
    
    addSetToSession: (state, action: PayloadAction<{ exerciseId: string; set: SetPerformance }>) => {
      const { exerciseId, set } = action.payload;
      if (!state.currentSession) return;
      
      // We need to properly instantiate the WorkoutSession if it's just a plain object from Redux
      // or implement the logic here directly to avoid class instantiation overhead in Redux reducer
      
      // Direct implementation for Redux state mutation (since Redux Toolkit uses Immer)
      if (!state.currentSession.exerciseData) {
        state.currentSession.exerciseData = {};
      }
      
      if (!state.currentSession.exerciseData[exerciseId]) {
        state.currentSession.exerciseData[exerciseId] = {
          exerciseId,
          sets: [],
          isCompleted: false
        };
      }
      
      state.currentSession.exerciseData[exerciseId].sets.push(set);
      
      // Update the sessions map as well
      const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
      state.sessions[sessionKey] = state.currentSession;
    },

    completeSession: (state) => {
      if (!state.currentSession) {
        throw new Error('SESSION_NOT_FOUND: No active session to complete');
      }
      
      if (state.currentSession.state !== SessionState.ACTIVE) {
        throw new Error('INVALID_STATE_TRANSITION: Can only complete active sessions');
      }
      
      const now = Date.now();
      const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
      
      const completedSession: EnhancedWorkoutSession = {
        ...state.currentSession,
        state: SessionState.COMPLETED,
        completedTime: now,
        updatedAt: now
      };
      
      state.sessions[sessionKey] = completedSession;
      state.currentSession = completedSession;
    },
    
    logSession: (state, action: PayloadAction<{ rpe: number; analysis?: WorkoutAnalysis }>) => {
      const { rpe, analysis } = action.payload;
      
      if (!state.currentSession) {
        throw new Error('SESSION_NOT_FOUND: No session to log');
      }
      
      if (state.currentSession.state !== SessionState.COMPLETED) {
        throw new Error('INVALID_STATE_TRANSITION: Session must be completed before logging');
      }
      
      if (rpe < 1 || rpe > 10) {
        throw new Error('RPE must be between 1 and 10');
      }
      
      const now = Date.now();
      const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
      
      const loggedSession: EnhancedWorkoutSession = {
        ...state.currentSession,
        state: SessionState.LOGGED,
        loggedTime: now,
        isReadOnly: true,
        rpe,
        analysis,
        updatedAt: now
      };
      
      state.sessions[sessionKey] = loggedSession;
      state.currentSession = null; // Clear current session after logging
    },
    
    abandonSession: (state) => {
      if (!state.currentSession) {
        return; // Safe to call even if no session
      }
      
      if (state.currentSession.state === SessionState.LOGGED) {
        throw new Error('INVALID_STATE_TRANSITION: Cannot abandon a logged session');
      }
      
      const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
      delete state.sessions[sessionKey];
      state.currentSession = null;
    },
    
    updateExerciseTimestamp: (state, action: PayloadAction<{ exerciseId: string; timestamp: number }>) => {
      const { exerciseId, timestamp } = action.payload;
      
      if (state.currentSession) {
        const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
        
        // Update legacy timestamp
        state.currentSession.exerciseTimestamps[exerciseId] = timestamp;
        
        // Update new data structure
        if (!state.currentSession.exerciseData) {
          state.currentSession.exerciseData = {};
        }
        
        if (!state.currentSession.exerciseData[exerciseId]) {
          state.currentSession.exerciseData[exerciseId] = {
            exerciseId,
            sets: [],
            isCompleted: true,
            completedAt: timestamp
          };
        } else {
          state.currentSession.exerciseData[exerciseId].isCompleted = true;
          state.currentSession.exerciseData[exerciseId].completedAt = timestamp;
        }
        
        state.sessions[sessionKey] = state.currentSession;
      }
    },
    
    removeExerciseTimestamp: (state, action: PayloadAction<{ exerciseId: string }>) => {
      const { exerciseId } = action.payload;
      
      if (state.currentSession) {
        const sessionKey = `${state.currentSession.weekId}-${state.currentSession.dayId}`;
        
        // Update legacy timestamp
        delete state.currentSession.exerciseTimestamps[exerciseId];
        
        // Update new data structure
        if (state.currentSession.exerciseData && state.currentSession.exerciseData[exerciseId]) {
          state.currentSession.exerciseData[exerciseId].isCompleted = false;
          state.currentSession.exerciseData[exerciseId].completedAt = undefined;
        }
        
        state.sessions[sessionKey] = state.currentSession;
      }
    },
    
    setStaleSessionData: (state, action: PayloadAction<SessionSliceState['staleSessionData']>) => {
      state.staleSessionData = action.payload;
      state.showStaleSessionModal = !!action.payload;
    },
    
    clearStaleSessionModal: (state) => {
      state.staleSessionData = null;
      state.showStaleSessionModal = false;
    },
    
    recoverStaleSession: (state, action: PayloadAction<{ shouldContinue: boolean }>) => {
      const { shouldContinue } = action.payload;
      
      if (!shouldContinue) {
        // Reset all sessions
        state.sessions = {};
        state.currentSession = null;
      }
      
      state.staleSessionData = null;
      state.showStaleSessionModal = false;
    },
    
    clearAllSessions: (state) => {
      state.sessions = {};
      state.currentSession = null;
      state.staleSessionData = null;
      state.showStaleSessionModal = false;
    },
  },
});

export const {
  startSession,
  addSetToSession,
  completeSession,
  logSession,
  abandonSession,
  updateExerciseTimestamp,
  removeExerciseTimestamp,
  setStaleSessionData,
  clearStaleSessionModal,
  recoverStaleSession,
  clearAllSessions,
} = sessionSlice.actions;

export const selectCurrentSession = (state: { session: SessionSliceState }) => 
  state.session.currentSession;

export const selectSessions = (state: { session: SessionSliceState }) => 
  state.session.sessions;

export default sessionSlice.reducer;