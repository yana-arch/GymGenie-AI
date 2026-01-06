/**
 * Unified Coaching Redux Slice
 * Manages state for integrated AI coaching orchestration
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CoachingDecision,
  UnifiedCoachingState,
  CoachingPriority
} from '@/features/unified-coaching/types/unifiedCoaching.types';

import {
  EnhancedCoachingDecision
} from '@/features/unified-coaching/types/coachingIntelligence.types';

const initialState: UnifiedCoachingState = {
  currentDecision: null,
  coachingHistory: [],
  isActive: false,
  sessionStartTime: null,
  totalProcessingTime: 0,
  averageProcessingTime: 0,
  conflictCount: 0,
  lastUpdated: null
};

const unifiedCoachingSlice = createSlice({
  name: 'unifiedCoaching',
  initialState,
  reducers: {
    // Start unified coaching session
    startCoachingSession: (state) => {
      state.isActive = true;
      state.sessionStartTime = Date.now();
      state.currentDecision = null;
      state.conflictCount = 0;
      state.totalProcessingTime = 0;
      state.averageProcessingTime = 0;
    },

    // End unified coaching session
    endCoachingSession: (state) => {
      state.isActive = false;
      state.currentDecision = null;
      state.sessionStartTime = null;
    },

    // Set current coaching decision
    setCoachingDecision: (state, action: PayloadAction<CoachingDecision>) => {
      const decision = action.payload;
      
      state.currentDecision = decision;
      state.lastUpdated = Date.now();
      
      // Update performance metrics
      state.totalProcessingTime += decision.metadata.processingTime;
      
      // Calculate average processing time
      if (state.coachingHistory.length > 0) {
        state.averageProcessingTime = state.totalProcessingTime / (state.coachingHistory.length + 1);
      } else {
        state.averageProcessingTime = decision.metadata.processingTime;
      }
      
      // Update conflict count
      state.conflictCount += decision.metadata.conflictsResolved;
      
      // Add to history
      state.coachingHistory.push(decision);
      
      // Keep history to reasonable size (last 100 decisions)
      if (state.coachingHistory.length > 100) {
        state.coachingHistory = state.coachingHistory.slice(-100);
      }
    },

    // Add coaching history entry
    addCoachingHistory: (state, action: PayloadAction<CoachingDecision>) => {
      state.coachingHistory.push(action.payload);
      
      // Keep history to reasonable size
      if (state.coachingHistory.length > 100) {
        state.coachingHistory = state.coachingHistory.slice(-100);
      }
    },

    // Clear coaching history
    clearCoachingHistory: (state) => {
      state.coachingHistory = [];
      state.conflictCount = 0;
      state.totalProcessingTime = 0;
      state.averageProcessingTime = 0;
    },

    // Update performance metrics
    updatePerformanceMetrics: (state, action: PayloadAction<{
      processingTime: number;
      conflictsResolved: number;
    }>) => {
      const { processingTime, conflictsResolved } = action.payload;
      
      state.totalProcessingTime += processingTime;
      state.conflictCount += conflictsResolved;
      
      // Recalculate average
      const decisionCount = state.coachingHistory.length;
      if (decisionCount > 0) {
        state.averageProcessingTime = state.totalProcessingTime / decisionCount;
      }
    },

    // Set coaching priority override
    setPriorityOverride: (state, action: PayloadAction<CoachingPriority>) => {
      if (state.currentDecision) {
        state.currentDecision.priority = action.payload;
      }
    },

    // Reset slice to initial state
    resetUnifiedCoaching: () => initialState,

    // Emergency stop for safety
    emergencyStop: (state) => {
      state.isActive = false;
      state.currentDecision = {
        system: 'unified-coaching',
        priority: CoachingPriority.SAFETY,
        response: {
          type: 'emergency-stop',
          confidence: 1.0,
          recommendation: {
            action: 'stop',
            message: 'Emergency stop activated for safety'
          },
          reasoning: 'Emergency stop triggered by user or safety system',
          timestamp: Date.now()
        },
        contributingSystems: [],
        conflictResolution: {
          strategy: 'emergency-override',
          conflicts: [],
          reasoning: 'Emergency stop overrides all AI systems'
        },
        metadata: {
          processingTime: 0,
          systemsConsidered: 0,
          conflictsResolved: 0,
          priorityUsed: CoachingPriority.SAFETY,
          timestamp: Date.now()
        }
      };
      state.lastUpdated = Date.now();
    },

    // Set enhanced coaching decision
    setEnhancedCoachingDecision: (state, action: PayloadAction<EnhancedCoachingDecision>) => {
      const decision = action.payload;
      
      // Convert to base decision for compatibility
      const baseDecision: CoachingDecision = {
        system: decision.system,
        priority: decision.priority,
        response: decision.response,
        contributingSystems: decision.contributingSystems,
        conflictResolution: decision.conflictResolution,
        metadata: decision.metadata
      };
      
      state.currentDecision = baseDecision;
      state.lastUpdated = Date.now();
      
      // Update performance metrics
      state.totalProcessingTime += decision.metadata.processingTime;
      
      // Calculate average processing time
      if (state.coachingHistory.length > 0) {
        state.averageProcessingTime = state.totalProcessingTime / (state.coachingHistory.length + 1);
      } else {
        state.averageProcessingTime = decision.metadata.processingTime;
      }
      
      // Update conflict count
      state.conflictCount += decision.metadata.conflictsResolved;
      
      // Add to history
      state.coachingHistory.push(baseDecision);
      
      // Keep history to reasonable size (last 100 decisions)
      if (state.coachingHistory.length > 100) {
        state.coachingHistory = state.coachingHistory.slice(-100);
      }
    },

    // Process user feedback for learning
    processUserFeedback: (state, action: PayloadAction<{
      decisionId: string;
      accepted: boolean;
      responseTime: number;
      satisfaction?: number;
      notes?: string;
    }>) => {
      // This action will be handled by the intelligence service
      // The slice just records the feedback for UI purposes
      console.log('User feedback processed:', action.payload);
    },

    // Update coaching preferences
    updateCoachingPreferences: (state, action: PayloadAction<any>) => {
      // This will be handled by the intelligence service
      console.log('Coaching preferences updated:', action.payload);
    }
  }
});

// Export actions
export const {
  startCoachingSession,
  endCoachingSession,
  setCoachingDecision,
  addCoachingHistory,
  clearCoachingHistory,
  updatePerformanceMetrics,
  setPriorityOverride,
  resetUnifiedCoaching,
  emergencyStop,
  setEnhancedCoachingDecision,
  processUserFeedback,
  updateCoachingPreferences
} = unifiedCoachingSlice.actions;

// Export selectors
export const selectCurrentDecision = (state: any) => 
  state.unifiedCoaching?.currentDecision;

export const selectCoachingHistory = (state: any) => 
  state.unifiedCoaching?.coachingHistory || [];

export const selectCoachingSession = (state: any) => ({
  isActive: state.unifiedCoaching?.isActive || false,
  sessionStartTime: state.unifiedCoaching?.sessionStartTime || null,
  lastUpdated: state.unifiedCoaching?.lastUpdated || null
});

export const selectCoachingMetrics = (state: any) => ({
  totalProcessingTime: state.unifiedCoaching?.totalProcessingTime || 0,
  averageProcessingTime: state.unifiedCoaching?.averageProcessingTime || 0,
  conflictCount: state.unifiedCoaching?.conflictCount || 0,
  decisionCount: state.unifiedCoaching?.coachingHistory?.length || 0
});

export const selectCoachingIsActive = (state: any) => 
  state.unifiedCoaching?.isActive || false;

// Export reducer
export default unifiedCoachingSlice.reducer;