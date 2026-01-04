import { UserProfile, WorkoutPlan, WorkoutHistoryEntry, AppStep } from '@/types';

export interface IStorageService {
  /**
   * Save data to storage with the specified key
   * @param key - Storage key
   * @param data - Data to save
   * @returns Promise that resolves when save is complete
   */
  save<T>(key: string, data: T): Promise<void>;
  
  /**
   * Load data from storage with the specified key
   * @param key - Storage key
   * @returns Promise resolving to the data or null if not found
   */
  load<T>(key: string): Promise<T | null>;
  
  /**
   * Remove data from storage with the specified key
   * @param key - Storage key
   * @returns Promise that resolves when removal is complete
   */
  remove(key: string): Promise<void>;
  
  /**
   * Clear all data from storage
   * @returns Promise that resolves when clear is complete
   */
  clear(): Promise<void>;
  
  /**
   * Create a backup of all user data
   * @returns Promise resolving to backup data
   */
  backup(): Promise<BackupData>;
  
  /**
   * Restore data from backup
   * @param backupData - The backup data to restore
   * @returns Promise that resolves when restore is complete
   */
  restore(backupData: BackupData): Promise<void>;
  
  /**
   * Get available storage space information
   * @returns Promise resolving to storage info
   */
  getStorageInfo(): Promise<StorageInfo>;
  
  // Convenience methods for specific data types
  
  /**
   * Save user profile
   * @param user - User profile to save
   */
  saveUser(user: UserProfile): Promise<void>;
  
  /**
   * Load user profile
   * @returns Promise resolving to user profile or null
   */
  getUser(): Promise<UserProfile | null>;
  
  /**
   * Save equipment list
   * @param equipment - Equipment array to save
   */
  saveEquipment(equipment: string[]): Promise<void>;
  
  /**
   * Load equipment list
   * @returns Promise resolving to equipment array or null
   */
  getEquipment(): Promise<string[] | null>;
  
  /**
   * Save workout plan
   * @param plan - Workout plan to save
   */
  savePlan(plan: WorkoutPlan): Promise<void>;
  
  /**
   * Load workout plan
   * @returns Promise resolving to workout plan or null
   */
  getPlan(): Promise<WorkoutPlan | null>;
  
  /**
   * Save current app step
   * @param step - App step to save
   */
  saveStep(step: AppStep): Promise<void>;
  
  /**
   * Load current app step
   * @returns Promise resolving to app step or null
   */
  getStep(): Promise<AppStep | null>;
  
  /**
   * Save workout history
   * @param history - History array to save
   */
  saveHistory(history: WorkoutHistoryEntry[]): Promise<void>;
  
  /**
   * Load workout history
   * @returns Promise resolving to history array or null
   */
  getHistory(): Promise<WorkoutHistoryEntry[] | null>;
}

export interface BackupData {
  version: string;
  timestamp: number;
  user: UserProfile | null;
  equipment: string[];
  plan: WorkoutPlan | null;
  step: AppStep;
  history: WorkoutHistoryEntry[];
  sessions: Record<string, any>;
}

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}