import { SessionState, WorkoutAnalysis } from '@/types';
import { WorkoutSessionStorageObject, SetPerformance, ExerciseSessionData, EnhancedWorkoutSession, SessionEnvironment } from '@/types/enhanced';

/**
 * Enhanced WorkoutSession class with immutable updates and state transition validation
 * Implements the session management patterns from the architecture optimization design
 */
export class WorkoutSession implements EnhancedWorkoutSession {
  // BaseEntity
  public readonly createdAt: number;
  public readonly updatedAt: number;
  
  // Timestamped
  public readonly timestamp: number;

  // SessionMetrics
  public readonly totalExercises: number = 0;
  public readonly completedExercises: number = 0;
  public readonly estimatedDuration: number = 60;
  public readonly actualDuration?: number | null;
  public readonly caloriesBurned?: number;

  constructor(
    public readonly id: string,
    public readonly weekId: string,
    public readonly dayId: string,
    public readonly state: SessionState,
    public readonly startTime: number,
    public readonly completedTime: number | null = null,
    public readonly loggedTime: number | null = null,
    public readonly exerciseTimestamps: Record<string, number> = {},
    public readonly isReadOnly: boolean = false,
    public readonly rpe?: number,
    public readonly analysis?: WorkoutAnalysis,
    public readonly exerciseData: Record<string, ExerciseSessionData> = {},
    public readonly environment: SessionEnvironment = { location: 'gym', equipment: [] },
    public readonly notes?: string,
    // Optional overrides for base properties
    createdAt?: number,
    updatedAt?: number
  ) {
    this.createdAt = createdAt || startTime;
    this.updatedAt = updatedAt || Date.now();
    this.timestamp = this.updatedAt;
    
    // Validate session data on construction
    this.validateSessionData();
  }

  /**
   * Create a new WorkoutSession instance
   */
  static create(weekId: string, dayId: string): WorkoutSession {
    const now = Date.now();
    return new WorkoutSession(
      crypto.randomUUID(),
      weekId,
      dayId,
      SessionState.ACTIVE,
      now,
      null,
      null,
      {},
      false,
      undefined,
      undefined,
      {},
      { location: 'gym', equipment: [] },
      undefined,
      now,
      now
    );
  }

  /**
   * Create WorkoutSession from stored data with validation
   */
  static fromStoredData(data: any): WorkoutSession {
    if (!WorkoutSession.isValidSessionData(data)) {
      throw new Error('Invalid session data provided');
    }

    return new WorkoutSession(
      data.id,
      data.weekId,
      data.dayId,
      data.state,
      data.startTime,
      data.completedTime,
      data.loggedTime,
      data.exerciseTimestamps || {},
      data.isReadOnly,
      data.rpe,
      data.analysis,
      data.exerciseData || {},
      data.environment || { location: 'gym', equipment: [] },
      data.notes,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Validate if data represents a valid WorkoutSession
   */
  static isValidSessionData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.id !== 'string') return false;
    if (typeof data.weekId !== 'string') return false;
    if (typeof data.dayId !== 'string') return false;
    if (!Object.values(SessionState).includes(data.state)) return false;
    if (typeof data.startTime !== 'number') return false;
    if (data.completedTime !== null && typeof data.completedTime !== 'number') return false;
    if (data.loggedTime !== null && typeof data.loggedTime !== 'number') return false;
    if (typeof data.isReadOnly !== 'boolean') return false;
    if (data.exerciseTimestamps && typeof data.exerciseTimestamps !== 'object') return false;
    if (data.rpe !== undefined && (typeof data.rpe !== 'number' || data.rpe < 1 || data.rpe > 10)) return false;

    return true;
  }

  /**
   * Get session key for storage and identification
   */
  get sessionKey(): string {
    return `${this.weekId}-${this.dayId}`;
  }

  /**
   * Check if session is currently active
   */
  get isActive(): boolean {
    return this.state === SessionState.ACTIVE;
  }

  /**
   * Check if session is completed but not yet logged
   */
  get isCompleted(): boolean {
    return this.state === SessionState.COMPLETED;
  }

  /**
   * Check if session is fully logged
   */
  get isLogged(): boolean {
    return this.state === SessionState.LOGGED;
  }

  /**
   * Check if session is inactive
   */
  get isInactive(): boolean {
    return this.state === SessionState.INACTIVE;
  }

  /**
   * Get session duration in milliseconds
   */
  get duration(): number | null {
    if (!this.completedTime) return null;
    return this.completedTime - this.startTime;
  }

  /**
   * Check if session is stale (inactive for more than 24 hours)
   */
  get isStale(): boolean {
    const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    const lastActivity = this.completedTime || this.startTime;
    return (now - lastActivity) > STALE_THRESHOLD;
  }

  /**
   * Validate state transition
   */
  canTransitionTo(newState: SessionState): boolean {
    const validTransitions: Record<SessionState, SessionState[]> = {
      [SessionState.INACTIVE]: [SessionState.ACTIVE],
      [SessionState.ACTIVE]: [SessionState.PAUSED, SessionState.COMPLETED, SessionState.INACTIVE, SessionState.ABANDONED],
      [SessionState.PAUSED]: [SessionState.ACTIVE, SessionState.ABANDONED],
      [SessionState.COMPLETED]: [SessionState.LOGGED, SessionState.ACTIVE],
      [SessionState.LOGGED]: [], // No transitions from logged state
      [SessionState.ABANDONED]: [] // No transitions from abandoned state
    };

    return validTransitions[this.state].includes(newState);
  }

  /**
   * Transition to a new state with immutable update
   */
  withState(newState: SessionState): WorkoutSession {
    if (!this.canTransitionTo(newState)) {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    }

    const now = Date.now();
    let updates: Partial<WorkoutSession> = { state: newState };

    // Apply state-specific updates
    switch (newState) {
      case SessionState.ACTIVE:
        updates = {
          ...updates,
          isReadOnly: false,
          // Reset completion times if transitioning back to active
          completedTime: null,
          loggedTime: null,
          rpe: undefined,
          analysis: undefined
        };
        break;

      case SessionState.COMPLETED:
        updates = {
          ...updates,
          completedTime: now,
          isReadOnly: false // Still editable until logged
        };
        break;

      case SessionState.LOGGED:
        updates = {
          ...updates,
          loggedTime: now,
          isReadOnly: true // Now read-only
        };
        break;

      case SessionState.INACTIVE:
        // Keep existing timestamps when transitioning to inactive
        break;
    }

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      updates.state!,
      this.startTime,
      updates.completedTime !== undefined ? updates.completedTime : this.completedTime,
      updates.loggedTime !== undefined ? updates.loggedTime : this.loggedTime,
      this.exerciseTimestamps,
      updates.isReadOnly !== undefined ? updates.isReadOnly : this.isReadOnly,
      updates.rpe !== undefined ? updates.rpe : this.rpe,
      updates.analysis !== undefined ? updates.analysis : this.analysis,
      this.exerciseData,
      this.environment,
      this.notes,
      this.createdAt,
      now // Update modified time
    );
  }

  /**
   * Complete the session with immutable update
   */
  complete(): WorkoutSession {
    return this.withState(SessionState.COMPLETED);
  }

  /**
   * Log the session with RPE and analysis
   */
  log(rpe: number, analysis?: WorkoutAnalysis): WorkoutSession {
    if (rpe < 1 || rpe > 10) {
      throw new Error('RPE must be between 1 and 10');
    }

    if (!this.canTransitionTo(SessionState.LOGGED)) {
      throw new Error(`Cannot log session in state ${this.state}`);
    }

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      SessionState.LOGGED,
      this.startTime,
      this.completedTime,
      Date.now(),
      this.exerciseTimestamps,
      true, // Read-only when logged
      rpe,
      analysis,
      this.exerciseData,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Add a completed set to an exercise
   */
  addSet(exerciseId: string, set: SetPerformance): WorkoutSession {
    if (this.isReadOnly) {
      throw new Error('Cannot modify read-only session');
    }

    const currentExerciseData = this.exerciseData[exerciseId] || {
      exerciseId,
      sets: [],
      isCompleted: false
    };

    const newExerciseData = {
      ...currentExerciseData,
      sets: [...currentExerciseData.sets, set]
    };

    const newExerciseDataMap = {
      ...this.exerciseData,
      [exerciseId]: newExerciseData
    };

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      this.exerciseTimestamps,
      this.isReadOnly,
      this.rpe,
      this.analysis,
      newExerciseDataMap,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Update exercise completion status
   */
  withExerciseCompletion(exerciseId: string, isCompleted: boolean, timestamp?: number): WorkoutSession {
    if (this.isReadOnly) {
      throw new Error('Cannot modify read-only session');
    }

    const currentExerciseData = this.exerciseData[exerciseId] || {
      exerciseId,
      sets: [],
      isCompleted: false
    };

    const newExerciseData = {
      ...currentExerciseData,
      isCompleted,
      completedAt: isCompleted ? (timestamp || Date.now()) : undefined
    };

    const newExerciseDataMap = {
      ...this.exerciseData,
      [exerciseId]: newExerciseData
    };
    
    // Also update legacy timestamp map for backward compatibility
    const newTimestamps = { ...this.exerciseTimestamps };
    if (isCompleted) {
      newTimestamps[exerciseId] = timestamp || Date.now();
    } else {
      delete newTimestamps[exerciseId];
    }

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      newTimestamps,
      this.isReadOnly,
      this.rpe,
      this.analysis,
      newExerciseDataMap,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Update exercise timestamp with immutable update
   */
  withExerciseTimestamp(exerciseId: string, timestamp: number): WorkoutSession {
    if (this.isReadOnly) {
      throw new Error('Cannot modify read-only session');
    }

    const newTimestamps = {
      ...this.exerciseTimestamps,
      [exerciseId]: timestamp
    };

    // Sync with new data structure
    const currentExerciseData = this.exerciseData[exerciseId] || {
      exerciseId,
      sets: [],
      isCompleted: false
    };

    const newExerciseData = {
      ...currentExerciseData,
      isCompleted: true,
      completedAt: timestamp
    };

    const newExerciseDataMap = {
      ...this.exerciseData,
      [exerciseId]: newExerciseData
    };

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      newTimestamps,
      this.isReadOnly,
      this.rpe,
      this.analysis,
      newExerciseDataMap,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Remove exercise timestamp with immutable update
   */
  withoutExerciseTimestamp(exerciseId: string): WorkoutSession {
    if (this.isReadOnly) {
      throw new Error('Cannot modify read-only session');
    }

    const newTimestamps = { ...this.exerciseTimestamps };
    delete newTimestamps[exerciseId];

    // Sync with new data structure
    const currentExerciseData = this.exerciseData[exerciseId];
    let newExerciseDataMap = { ...this.exerciseData };

    if (currentExerciseData) {
      const newExerciseData = {
        ...currentExerciseData,
        isCompleted: false,
        completedAt: undefined
      };
      newExerciseDataMap[exerciseId] = newExerciseData;
    }

    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      newTimestamps,
      this.isReadOnly,
      this.rpe,
      this.analysis,
      newExerciseDataMap,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Create a copy with updated analysis
   */
  withAnalysis(analysis: WorkoutAnalysis): WorkoutSession {
    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      this.exerciseTimestamps,
      this.isReadOnly,
      this.rpe,
      analysis,
      this.exerciseData,
      this.environment,
      this.notes,
      this.createdAt,
      Date.now()
    );
  }

  /**
   * Validate session data integrity
   */
  private validateSessionData(): void {
    // Validate state consistency
    if (this.state === SessionState.COMPLETED && !this.completedTime) {
      throw new Error('Completed session must have completedTime');
    }

    if (this.state === SessionState.LOGGED && (!this.completedTime || !this.loggedTime)) {
      throw new Error('Logged session must have both completedTime and loggedTime');
    }

    if (this.state === SessionState.LOGGED && !this.isReadOnly) {
      throw new Error('Logged session must be read-only');
    }

    if (this.state === SessionState.LOGGED && !this.rpe) {
      throw new Error('Logged session must have RPE');
    }

    // Validate timestamps
    if (this.completedTime && this.completedTime < this.startTime) {
      throw new Error('Completed time cannot be before start time');
    }

    if (this.loggedTime && this.completedTime && this.loggedTime < this.completedTime) {
      throw new Error('Logged time cannot be before completed time');
    }

    // Validate RPE
    if (this.rpe !== undefined && (this.rpe < 1 || this.rpe > 10)) {
      throw new Error('RPE must be between 1 and 10');
    }
  }

  /**
   * Convert to plain object for storage
   */
  toStorageObject(): WorkoutSessionStorageObject {
    return {
      id: this.id,
      weekId: this.weekId,
      dayId: this.dayId,
      state: this.state,
      startTime: this.startTime,
      completedTime: this.completedTime,
      loggedTime: this.loggedTime,
      exerciseTimestamps: this.exerciseTimestamps,
      isReadOnly: this.isReadOnly,
      rpe: this.rpe,
      analysis: this.analysis,
      exerciseData: this.exerciseData
    };
  }

  /**
   * Create a deep copy of the session
   */
  clone(): WorkoutSession {
    return new WorkoutSession(
      this.id,
      this.weekId,
      this.dayId,
      this.state,
      this.startTime,
      this.completedTime,
      this.loggedTime,
      { ...this.exerciseTimestamps },
      this.isReadOnly,
      this.rpe,
      this.analysis ? { ...this.analysis } : undefined,
      JSON.parse(JSON.stringify(this.exerciseData)), // Deep copy exercise data
      { ...this.environment },
      this.notes,
      this.createdAt,
      this.updatedAt
    );
  }

  /**
   * Check equality with another session
   */
  equals(other: WorkoutSession): boolean {
    return (
      this.id === other.id &&
      this.weekId === other.weekId &&
      this.dayId === other.dayId &&
      this.state === other.state &&
      this.startTime === other.startTime &&
      this.completedTime === other.completedTime &&
      this.loggedTime === other.loggedTime &&
      this.isReadOnly === other.isReadOnly &&
      this.rpe === other.rpe &&
      JSON.stringify(this.exerciseTimestamps) === JSON.stringify(other.exerciseTimestamps) &&
      JSON.stringify(this.analysis) === JSON.stringify(other.analysis)
    );
  }

  /**
   * Get a human-readable string representation
   */
  toString(): string {
    return `WorkoutSession(${this.sessionKey}, ${this.state}, ${this.id.slice(0, 8)})`;
  }
}