import { WorkoutSession } from './WorkoutSession';
import { SessionConflictDetector, SessionConflict, ConflictResolutionOption } from './SessionConflictDetector';
import { SessionState, WorkoutAnalysis } from '@/types';

export interface ConflictResolutionContext {
  userPreferences: {
    autoResolveConflicts: boolean;
    preferredResolution: 'CONTINUE_EXISTING' | 'ABANDON_EXISTING' | 'ASK_USER';
    rememberChoice: boolean;
  };
  sessionHistory: {
    recentConflicts: ConflictResolutionRecord[];
    userPatterns: Record<string, number>; // Track user's preferred resolutions
  };
}

export interface ConflictResolutionRecord {
  timestamp: number;
  conflictType: string;
  resolution: string;
  sessionKeys: string[];
  userChoice: boolean; // true if user made the choice, false if auto-resolved
}

export interface UserPromptConfig {
  title: string;
  message: string;
  options: ConflictResolutionOption[];
  timeout?: number; // Auto-resolve after timeout
  defaultOption?: string;
  showDetails: boolean;
}

export interface ConflictResolutionResult {
  resolved: boolean;
  chosenResolution: ConflictResolutionOption | null;
  newSessions: Map<string, WorkoutSession>;
  newActiveSessionKey: string | null;
  shouldProceedWithNewSession: boolean;
  userInteractionRequired: boolean;
  promptConfig?: UserPromptConfig;
}

/**
 * Advanced session conflict resolution system with user prompts,
 * automatic resolution, and conflict pattern learning
 */
export class SessionConflictResolver {
  private conflictDetector: SessionConflictDetector;
  private context: ConflictResolutionContext;
  private readonly STORAGE_KEY = 'gymgenie_conflict_resolution_context';

  constructor() {
    this.conflictDetector = new SessionConflictDetector();
    this.context = this.loadContext();
  }

  /**
   * Resolve a session conflict with intelligent decision making
   */
  async resolveConflict(
    conflict: SessionConflict,
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null,
    userChoice?: string
  ): Promise<ConflictResolutionResult> {
    
    // Record the conflict
    await this.recordConflict(conflict);

    // If user provided a choice, use it
    if (userChoice) {
      return this.executeResolution(conflict, userChoice, sessions, activeSessionKey, true);
    }

    // Check if we can auto-resolve based on preferences and patterns
    const autoResolution = this.attemptAutoResolution(conflict);
    if (autoResolution) {
      return this.executeResolution(conflict, autoResolution.id, sessions, activeSessionKey, false);
    }

    // Require user interaction
    return this.createUserPrompt(conflict, sessions, activeSessionKey);
  }

  /**
   * Attempt automatic resolution based on user preferences and patterns
   */
  private attemptAutoResolution(conflict: SessionConflict): ConflictResolutionOption | null {
    // Don't auto-resolve if user prefers to be asked
    if (!this.context.userPreferences.autoResolveConflicts) {
      return null;
    }

    // Check for learned patterns
    const learnedResolution = this.getLearnedResolution(conflict);
    if (learnedResolution) {
      return learnedResolution;
    }

    // Apply default preferences
    const preferredResolution = this.context.userPreferences.preferredResolution;
    
    switch (preferredResolution) {
      case 'CONTINUE_EXISTING':
        return conflict.resolutionOptions.find(opt => opt.action === 'CONTINUE_EXISTING') || null;
      
      case 'ABANDON_EXISTING':
        return conflict.resolutionOptions.find(opt => opt.action === 'ABANDON_EXISTING') || null;
      
      case 'ASK_USER':
      default:
        return null;
    }
  }

  /**
   * Get learned resolution based on user's historical choices
   */
  private getLearnedResolution(conflict: SessionConflict): ConflictResolutionOption | null {
    const conflictTypePattern = this.context.sessionHistory.userPatterns[conflict.type];
    
    if (!conflictTypePattern) {
      return null;
    }

    // Find the most frequently chosen resolution for this conflict type
    const recentConflicts = this.context.sessionHistory.recentConflicts
      .filter(record => record.conflictType === conflict.type && record.userChoice)
      .slice(-10); // Consider last 10 user choices

    if (recentConflicts.length < 3) {
      return null; // Need at least 3 examples to establish a pattern
    }

    // Count resolution frequencies
    const resolutionCounts: Record<string, number> = {};
    recentConflicts.forEach(record => {
      resolutionCounts[record.resolution] = (resolutionCounts[record.resolution] || 0) + 1;
    });

    // Find most common resolution
    const mostCommon = Object.entries(resolutionCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommon && mostCommon[1] >= recentConflicts.length * 0.7) { // 70% consistency
      return conflict.resolutionOptions.find(opt => opt.id === mostCommon[0]) || null;
    }

    return null;
  }

  /**
   * Create user prompt configuration for conflict resolution
   */
  private createUserPrompt(
    conflict: SessionConflict,
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null
  ): ConflictResolutionResult {
    
    const promptConfig: UserPromptConfig = {
      title: this.getConflictTitle(conflict),
      message: this.enhanceConflictMessage(conflict, sessions),
      options: this.enhanceResolutionOptions(conflict),
      timeout: 30000, // 30 seconds
      defaultOption: this.getDefaultOption(conflict),
      showDetails: true
    };

    return {
      resolved: false,
      chosenResolution: null,
      newSessions: sessions,
      newActiveSessionKey: activeSessionKey,
      shouldProceedWithNewSession: false,
      userInteractionRequired: true,
      promptConfig
    };
  }

  /**
   * Execute the chosen resolution
   */
  private executeResolution(
    conflict: SessionConflict,
    resolutionId: string,
    sessions: Map<string, WorkoutSession>,
    activeSessionKey: string | null,
    isUserChoice: boolean
  ): ConflictResolutionResult {
    
    const resolution = this.conflictDetector.resolveConflict(
      conflict,
      resolutionId,
      sessions,
      activeSessionKey
    );

    const chosenOption = conflict.resolutionOptions.find(opt => opt.id === resolutionId);

    // Record the resolution
    this.recordResolution(conflict, resolutionId, isUserChoice);

    // Update user patterns if this was a user choice
    if (isUserChoice && chosenOption) {
      this.updateUserPatterns(conflict.type, resolutionId);
    }

    return {
      resolved: true,
      chosenResolution: chosenOption || null,
      newSessions: resolution.sessions,
      newActiveSessionKey: resolution.activeSessionKey,
      shouldProceedWithNewSession: resolution.shouldProceedWithNewSession,
      userInteractionRequired: false
    };
  }

  /**
   * Get appropriate title for conflict type
   */
  private getConflictTitle(conflict: SessionConflict): string {
    switch (conflict.type) {
      case 'MULTIPLE_ACTIVE':
        return 'Multiple Active Sessions Detected';
      case 'DUPLICATE_SESSION':
        return 'Session Already Exists';
      case 'STATE_CONFLICT':
        return 'Session State Conflict';
      default:
        return 'Session Conflict';
    }
  }

  /**
   * Enhance conflict message with additional context
   */
  private enhanceConflictMessage(
    conflict: SessionConflict,
    sessions: Map<string, WorkoutSession>
  ): string {
    let message = conflict.message;

    // Add session details
    const existingSession = conflict.existingSession;
    const sessionAge = this.getSessionAge(existingSession);
    const sessionProgress = this.getSessionProgress(existingSession, sessions);

    message += `\n\nSession Details:`;
    message += `\n• Started: ${sessionAge}`;
    message += `\n• Progress: ${sessionProgress}`;
    message += `\n• State: ${existingSession.state}`;

    if (existingSession.isStale) {
      message += `\n• ⚠️ This session is stale (inactive for more than 24 hours)`;
    }

    // Add recommendation based on session analysis
    const recommendation = this.getSmartRecommendation(conflict, sessions);
    if (recommendation) {
      message += `\n\n💡 Recommendation: ${recommendation}`;
    }

    return message;
  }

  /**
   * Enhance resolution options with additional information
   */
  private enhanceResolutionOptions(conflict: SessionConflict): ConflictResolutionOption[] {
    return conflict.resolutionOptions.map(option => ({
      ...option,
      description: this.enhanceOptionDescription(option, conflict)
    }));
  }

  /**
   * Enhance option description with consequences and benefits
   */
  private enhanceOptionDescription(
    option: ConflictResolutionOption,
    conflict: SessionConflict
  ): string {
    let description = option.description;

    switch (option.action) {
      case 'CONTINUE_EXISTING':
        if (conflict.existingSession.isStale) {
          description += ' (Note: Session is stale - you may want to abandon it instead)';
        } else if (conflict.existingSession.isCompleted) {
          description += ' (Session is completed - you can log it now)';
        }
        break;

      case 'ABANDON_EXISTING':
        const exerciseCount = Object.keys(conflict.existingSession.exerciseTimestamps).length;
        if (exerciseCount > 0) {
          description += ` (⚠️ You will lose progress on ${exerciseCount} exercises)`;
        }
        break;

      case 'FORCE_NEW':
        description += ' (Previous session data will be permanently lost)';
        break;

      case 'ABANDON_NEW':
        description += ' (No data will be lost)';
        break;
    }

    return description;
  }

  /**
   * Get default option based on conflict analysis
   */
  private getDefaultOption(conflict: SessionConflict): string {
    // For stale sessions, default to abandoning
    if (conflict.existingSession.isStale) {
      const abandonOption = conflict.resolutionOptions.find(opt => 
        opt.action === 'ABANDON_EXISTING' || opt.action === 'FORCE_NEW'
      );
      if (abandonOption) return abandonOption.id;
    }

    // For completed sessions, default to continuing (so user can log)
    if (conflict.existingSession.isCompleted) {
      const continueOption = conflict.resolutionOptions.find(opt => 
        opt.action === 'CONTINUE_EXISTING'
      );
      if (continueOption) return continueOption.id;
    }

    // Default to the first safe option
    const safeOption = conflict.resolutionOptions.find(opt => 
      opt.action === 'CONTINUE_EXISTING' || opt.action === 'ABANDON_NEW'
    );
    
    return safeOption?.id || conflict.resolutionOptions[0].id;
  }

  /**
   * Get smart recommendation based on session analysis
   */
  private getSmartRecommendation(
    conflict: SessionConflict,
    sessions: Map<string, WorkoutSession>
  ): string | null {
    const session = conflict.existingSession;

    if (session.isStale) {
      return 'This session is stale. Consider abandoning it and starting fresh.';
    }

    if (session.isCompleted && !session.isLogged) {
      return 'This session is completed but not logged. Continue to log your workout.';
    }

    if (session.isActive) {
      const exerciseCount = Object.keys(session.exerciseTimestamps).length;
      if (exerciseCount > 0) {
        return `You have progress on ${exerciseCount} exercises. Continue to avoid losing your work.`;
      } else {
        return 'No exercises completed yet. You can safely start a new session.';
      }
    }

    return null;
  }

  /**
   * Get human-readable session age
   */
  private getSessionAge(session: WorkoutSession): string {
    const now = Date.now();
    const age = now - session.startTime;
    
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get session progress information
   */
  private getSessionProgress(
    session: WorkoutSession,
    sessions: Map<string, WorkoutSession>
  ): string {
    const exerciseCount = Object.keys(session.exerciseTimestamps).length;
    
    if (exerciseCount === 0) {
      return 'No exercises completed';
    }

    return `${exerciseCount} exercise${exerciseCount > 1 ? 's' : ''} completed`;
  }

  /**
   * Record conflict occurrence for analysis
   */
  private async recordConflict(conflict: SessionConflict): Promise<void> {
    // Implementation would track conflict patterns for learning
    console.log(`Recording conflict: ${conflict.type} for session ${conflict.existingSession.sessionKey}`);
  }

  /**
   * Record resolution choice
   */
  private recordResolution(
    conflict: SessionConflict,
    resolutionId: string,
    isUserChoice: boolean
  ): void {
    const record: ConflictResolutionRecord = {
      timestamp: Date.now(),
      conflictType: conflict.type,
      resolution: resolutionId,
      sessionKeys: [conflict.existingSession.sessionKey],
      userChoice: isUserChoice
    };

    this.context.sessionHistory.recentConflicts.push(record);

    // Keep only recent conflicts (last 100)
    if (this.context.sessionHistory.recentConflicts.length > 100) {
      this.context.sessionHistory.recentConflicts = 
        this.context.sessionHistory.recentConflicts.slice(-100);
    }

    this.saveContext();
  }

  /**
   * Update user patterns based on choices
   */
  private updateUserPatterns(conflictType: string, resolutionId: string): void {
    if (!this.context.sessionHistory.userPatterns[conflictType]) {
      this.context.sessionHistory.userPatterns[conflictType] = 0;
    }

    // Simple pattern tracking - could be enhanced with more sophisticated ML
    this.context.sessionHistory.userPatterns[conflictType]++;
    this.saveContext();
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<ConflictResolutionContext['userPreferences']>): void {
    this.context.userPreferences = {
      ...this.context.userPreferences,
      ...preferences
    };
    this.saveContext();
  }

  /**
   * Get current user preferences
   */
  getUserPreferences(): ConflictResolutionContext['userPreferences'] {
    return { ...this.context.userPreferences };
  }

  /**
   * Get conflict resolution statistics
   */
  getResolutionStats(): {
    totalConflicts: number;
    autoResolved: number;
    userResolved: number;
    mostCommonConflictType: string | null;
    mostCommonResolution: string | null;
  } {
    const conflicts = this.context.sessionHistory.recentConflicts;
    const totalConflicts = conflicts.length;
    const autoResolved = conflicts.filter(c => !c.userChoice).length;
    const userResolved = conflicts.filter(c => c.userChoice).length;

    // Find most common conflict type
    const conflictTypeCounts: Record<string, number> = {};
    conflicts.forEach(c => {
      conflictTypeCounts[c.conflictType] = (conflictTypeCounts[c.conflictType] || 0) + 1;
    });
    const mostCommonConflictType = Object.entries(conflictTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Find most common resolution
    const resolutionCounts: Record<string, number> = {};
    conflicts.forEach(c => {
      resolutionCounts[c.resolution] = (resolutionCounts[c.resolution] || 0) + 1;
    });
    const mostCommonResolution = Object.entries(resolutionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    return {
      totalConflicts,
      autoResolved,
      userResolved,
      mostCommonConflictType,
      mostCommonResolution
    };
  }

  /**
   * Clear resolution history (for privacy/reset)
   */
  clearResolutionHistory(): void {
    this.context.sessionHistory = {
      recentConflicts: [],
      userPatterns: {}
    };
    this.saveContext();
  }

  /**
   * Load context from storage
   */
  private loadContext(): ConflictResolutionContext {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          userPreferences: {
            autoResolveConflicts: false,
            preferredResolution: 'ASK_USER',
            rememberChoice: true,
            ...parsed.userPreferences
          },
          sessionHistory: {
            recentConflicts: [],
            userPatterns: {},
            ...parsed.sessionHistory
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load conflict resolution context:', error);
    }

    // Return default context
    return {
      userPreferences: {
        autoResolveConflicts: false,
        preferredResolution: 'ASK_USER',
        rememberChoice: true
      },
      sessionHistory: {
        recentConflicts: [],
        userPatterns: {}
      }
    };
  }

  /**
   * Save context to storage
   */
  private saveContext(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.context));
    } catch (error) {
      console.warn('Failed to save conflict resolution context:', error);
    }
  }
}