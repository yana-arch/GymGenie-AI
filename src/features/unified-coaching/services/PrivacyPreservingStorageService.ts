/**
 * Privacy-Preserving Coaching Intelligence Storage
 * Secure local storage with encryption and data minimization
 */

import {
  CoachingIntelligenceStorage,
  PrivacyConfig,
  SessionLearningSummary,
  AdaptationRecord,
  PreferenceChange
} from '../types/coachingIntelligence.types';

/**
 * Privacy-Preserving Storage Service
 * Handles secure storage and retrieval of coaching intelligence data
 */
export class PrivacyPreservingStorageService {
  private readonly STORAGE_KEY = 'gymgenie-coaching-intelligence';
  private readonly encryptionKey: string;
  private config: PrivacyConfig;

  constructor(config: PrivacyConfig) {
    this.config = config;
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Store coaching intelligence data with privacy protection
   */
  async storeData(data: CoachingIntelligenceStorage): Promise<void> {
    try {
      // Apply privacy transformations
      const privacySafeData = await this.applyPrivacyTransformations(data);
      
      // Encrypt if enabled
      const finalData = this.config.encryptionEnabled 
        ? await this.encryptData(privacySafeData)
        : privacySafeData;

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        data: finalData,
        metadata: {
          encrypted: this.config.encryptionEnabled,
          anonymizationLevel: this.config.anonymizationLevel,
          timestamp: Date.now(),
          version: '1.0.0'
        }
      }));

    } catch (error) {
      console.error('Failed to store coaching intelligence data:', error);
      throw new Error('Storage operation failed');
    }
  }

  /**
   * Retrieve coaching intelligence data
   */
  async retrieveData(): Promise<CoachingIntelligenceStorage> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createDefaultStorage();
      }

      const parsed = JSON.parse(stored);
      let data = parsed.data;

      // Decrypt if needed
      if (parsed.metadata?.encrypted) {
        data = await this.decryptData(data);
      }

      // Validate and sanitize retrieved data
      return this.validateAndSanitizeData(data);

    } catch (error) {
      console.error('Failed to retrieve coaching intelligence data:', error);
      return this.createDefaultStorage();
    }
  }

  /**
   * Clear all coaching intelligence data
   */
  async clearData(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear coaching intelligence data:', error);
      throw new Error('Clear operation failed');
    }
  }

  /**
   * Get storage statistics and privacy metrics
   */
  async getStorageStats(): Promise<{
    size: number;
    recordCount: number;
    lastUpdated: number;
    privacyLevel: string;
    encryptionEnabled: boolean;
    retentionDaysLeft: number;
  }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : null;
      const coachingData = data ? await this.retrieveData() : await this.createDefaultStorage();

      return {
        size: stored ? new Blob([stored]).size : 0,
        recordCount: this.countRecords(coachingData),
        lastUpdated: coachingData.metadata.lastUpdated,
        privacyLevel: coachingData.metadata.privacyLevel,
        encryptionEnabled: this.config.encryptionEnabled,
        retentionDaysLeft: this.calculateRetentionDaysLeft(coachingData.metadata.lastUpdated)
      };

    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        size: 0,
        recordCount: 0,
        lastUpdated: 0,
        privacyLevel: 'local',
        encryptionEnabled: false,
        retentionDaysLeft: 0
      };
    }
  }

  /**
   * Apply data retention policies
   */
  async applyRetentionPolicy(): Promise<void> {
    try {
      const data = await this.retrieveData();
      const cutoffDate = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

      // Filter old records
      data.learningHistory.sessionSummaries = data.learningHistory.sessionSummaries.filter(
        summary => summary.timestamp > cutoffDate
      );

      data.learningHistory.adaptationHistory = data.learningHistory.adaptationHistory.filter(
        record => record.timestamp > cutoffDate
      );

      data.learningHistory.preferenceChanges = data.learningHistory.preferenceChanges.filter(
        change => change.timestamp > cutoffDate
      );

      // Update metadata
      data.metadata.lastUpdated = Date.now();
      data.metadata.dataPoints = this.countRecords(data);

      // Store cleaned data
      await this.storeData(data);

    } catch (error) {
      console.error('Failed to apply retention policy:', error);
    }
  }

  /**
   * Export data with privacy controls
   */
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const data = await this.retrieveData();
      const anonymizedData = this.anonymizeData(data);

      if (format === 'json') {
        return JSON.stringify(anonymizedData, null, 2);
      } else {
        return this.convertToCSV(anonymizedData);
      }

    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Export operation failed');
    }
  }

  /**
   * Import data with validation
   */
  async importData(importedData: string, format: 'json' | 'csv' = 'json'): Promise<boolean> {
    try {
      let data: CoachingIntelligenceStorage;

      if (format === 'json') {
        data = JSON.parse(importedData);
      } else {
        data = this.parseFromCSV(importedData);
      }

      // Validate imported data
      const validatedData = this.validateAndSanitizeData(data);

      // Merge with existing data
      const existingData = await this.retrieveData();
      const mergedData = this.mergeData(existingData, validatedData);

      // Store merged data
      await this.storeData(mergedData);

      return true;

    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Apply privacy transformations to data
   */
  private async applyPrivacyTransformations(
    data: CoachingIntelligenceStorage
  ): Promise<CoachingIntelligenceStorage> {
    let transformed = { ...data };

    // Apply anonymization based on level
    if (this.config.anonymizationLevel === 'partial' || this.config.anonymizationLevel === 'full') {
      transformed = this.anonymizeData(transformed);
    }

    // Remove sensitive fields
    if (this.config.sensitiveDataFields.length > 0) {
      transformed = this.removeSensitiveFields(transformed);
    }

    // Limit data history for privacy
    transformed.learningHistory.sessionSummaries = 
      transformed.learningHistory.sessionSummaries.slice(-100);
    transformed.learningHistory.adaptationHistory = 
      transformed.learningHistory.adaptationHistory.slice(-100);
    transformed.learningHistory.preferenceChanges = 
      transformed.learningHistory.preferenceChanges.slice(-50);

    return transformed;
  }

  /**
   * Anonymize data based on privacy level
   */
  private anonymizeData(data: CoachingIntelligenceStorage): CoachingIntelligenceStorage {
    const anonymized = JSON.parse(JSON.stringify(data));

    if (this.config.anonymizationLevel === 'full') {
      // Full anonymization - remove all personally identifiable patterns
      anonymized.learningHistory.sessionSummaries = anonymized.learningHistory.sessionSummaries.map(
        (summary: SessionLearningSummary) => ({
          ...summary,
          sessionId: this.hashString(summary.sessionId),
          keyLearnings: summary.keyLearnings.map(learning => this.hashString(learning))
        })
      );

      anonymized.learningHistory.adaptationHistory = anonymized.learningHistory.adaptationHistory.map(
        (record: AdaptationRecord) => ({
          ...record,
          trigger: typeof record.trigger === 'string' ? this.hashString(record.trigger) : record.trigger
        })
      );
    } else if (this.config.anonymizationLevel === 'partial') {
      // Partial anonymization - hash sensitive identifiers only
      anonymized.learningHistory.sessionSummaries = anonymized.learningHistory.sessionSummaries.map(
        (summary: SessionLearningSummary) => ({
          ...summary,
          sessionId: this.hashString(summary.sessionId)
        })
      );
    }

    return anonymized;
  }

  /**
   * Remove sensitive fields from data
   */
  private removeSensitiveFields(data: CoachingIntelligenceStorage): CoachingIntelligenceStorage {
    const cleaned = JSON.parse(JSON.stringify(data));

    this.config.sensitiveDataFields.forEach(field => {
      // Remove field at any depth
      const removeField = (obj: any, path: string) => {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (current[keys[i]]) {
            current = current[keys[i]];
          } else {
            return;
          }
        }
        
        if (current[keys[keys.length - 1]]) {
          delete current[keys[keys.length - 1]];
        }
      };

      removeField(cleaned, field);
    });

    return cleaned;
  }

  /**
   * Encrypt data using simple XOR encryption (for demo purposes)
   * In production, use proper encryption libraries
   */
  private async encryptData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    let encrypted = '';
    
    for (let i = 0; i < jsonString.length; i++) {
      const charCode = jsonString.charCodeAt(i);
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      encrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return btoa(encrypted); // Base64 encode
  }

  /**
   * Decrypt data
   */
  private async decryptData(encryptedData: string): Promise<any> {
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = '';
    
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
      decrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return JSON.parse(decrypted);
  }

  /**
   * Generate encryption key from user agent and timestamp
   */
  private generateEncryptionKey(): string {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    const combined = userAgent + timestamp;
    
    // Simple hash - in production use proper crypto
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Hash string for anonymization
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}`;
  }

  /**
   * Create default storage structure
   */
  private createDefaultStorage(): CoachingIntelligenceStorage {
    return {
      preferences: {
        communicationFrequency: 'moderate',
        communicationTone: 'encouraging',
        feedbackStyle: 'balanced',
        primaryFocus: 'balanced',
        adaptSpeed: 'moderate',
        explanationLevel: 'intermediate',
        correctionPromptness: 'immediate',
        adaptationTolerance: 'medium',
        maxRecommendationsPerSession: 5,
        allowConcurrentRecommendations: false,
        preferredCoachingHours: {
          start: '06:00',
          end: '22:00'
        }
      },
      learningProfile: {
        responseRate: {
          overall: 0.7,
          byPriority: {
            safety: 0.95,
            injury: 0.9,
            form: 0.75,
            adaptation: 0.6
          },
          byType: {}
        },
        averageResponseTime: 15000,
        responseTimeDistribution: {
          fast: 0.3,
          medium: 0.5,
          slow: 0.2
        },
        preferredCoachingTimes: [],
        coachingEffectiveness: {
          byTimeOfDay: {},
          bySessionPhase: {}
        },
        adaptationRate: 0.5,
        correctionAcceptance: 0.8,
        confusionEvents: 0,
        trendData: {
          engagementLevel: [],
          complianceRate: [],
          satisfactionScore: []
        }
      },
      metadata: {
        lastUpdated: Date.now(),
        dataPoints: 0,
        privacyLevel: this.config.anonymizationLevel === 'none' ? 'local' : 
                     this.config.anonymizationLevel === 'full' ? 'encrypted' : 'local',
        version: '1.0.0'
      },
      learningHistory: {
        sessionSummaries: [],
        adaptationHistory: [],
        preferenceChanges: []
      }
    };
  }

  /**
   * Validate and sanitize retrieved data
   */
  private validateAndSanitizeData(data: any): CoachingIntelligenceStorage {
    // Ensure all required fields exist
    const sanitized = this.createDefaultStorage();
    
    // Merge with retrieved data, ensuring type safety
    if (data.preferences) {
      sanitized.preferences = { ...sanitized.preferences, ...data.preferences };
    }
    
    if (data.learningProfile) {
      sanitized.learningProfile = { ...sanitized.learningProfile, ...data.learningProfile };
    }
    
    if (data.metadata) {
      sanitized.metadata = { ...sanitized.metadata, ...data.metadata };
    }
    
    if (data.learningHistory) {
      sanitized.learningHistory = {
        sessionSummaries: Array.isArray(data.learningHistory.sessionSummaries) 
          ? data.learningHistory.sessionSummaries.slice(-100) 
          : [],
        adaptationHistory: Array.isArray(data.learningHistory.adaptationHistory) 
          ? data.learningHistory.adaptationHistory.slice(-100) 
          : [],
        preferenceChanges: Array.isArray(data.learningHistory.preferenceChanges) 
          ? data.learningHistory.preferenceChanges.slice(-50) 
          : []
      };
    }
    
    return sanitized;
  }

  /**
   * Count total records in storage
   */
  private countRecords(data: CoachingIntelligenceStorage): number {
    return data.learningHistory.sessionSummaries.length +
           data.learningHistory.adaptationHistory.length +
           data.learningHistory.preferenceChanges.length;
  }

  /**
   * Calculate retention days left
   */
  private calculateRetentionDaysLeft(lastUpdated: number): number {
    const elapsed = Date.now() - lastUpdated;
    const elapsedDays = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return Math.max(0, this.config.dataRetentionDays - elapsedDays);
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: CoachingIntelligenceStorage): string {
    const csvRows: string[] = [];
    
    // Add session summaries
    data.learningHistory.sessionSummaries.forEach(summary => {
      csvRows.push(`session,${summary.sessionId},${summary.timestamp},${summary.recommendationsPresented},${summary.recommendationsAccepted}`);
    });
    
    // Add adaptation history
    data.learningHistory.adaptationHistory.forEach(record => {
      csvRows.push(`adaptation,${record.timestamp},${record.trigger},${record.adaptation.type},${record.adaptation.effectiveness}`);
    });
    
    // Add preference changes
    data.learningHistory.preferenceChanges.forEach(change => {
      csvRows.push(`preference,${change.timestamp},${change.field},${change.oldValue},${change.newValue}`);
    });
    
    return csvRows.join('\n');
  }

  /**
   * Parse data from CSV format
   */
  private parseFromCSV(csvData: string): CoachingIntelligenceStorage {
    const data = this.createDefaultStorage();
    const lines = csvData.split('\n');
    
    lines.forEach(line => {
      const parts = line.split(',');
      const type = parts[0];
      const timestamp = parseInt(parts[1]);
      
      if (type === 'session') {
        data.learningHistory.sessionSummaries.push({
          sessionId: parts[1],
          timestamp: parseInt(parts[2]),
          duration: 0,
          recommendationsPresented: parseInt(parts[3]),
          recommendationsAccepted: parseInt(parts[4]),
          averageResponseTime: 0,
          satisfactionIndicators: 0,
          keyLearnings: [],
          preferenceShifts: {}
        });
      }
      // Add parsing for other types as needed
    });
    
    return data;
  }

  /**
   * Merge imported data with existing data
   */
  private mergeData(
    existing: CoachingIntelligenceStorage,
    imported: CoachingIntelligenceStorage
  ): CoachingIntelligenceStorage {
    return {
      preferences: { ...existing.preferences, ...imported.preferences },
      learningProfile: { ...existing.learningProfile, ...imported.learningProfile },
      metadata: {
        ...existing.metadata,
        ...imported.metadata,
        lastUpdated: Date.now()
      },
      learningHistory: {
        sessionSummaries: [
          ...existing.learningHistory.sessionSummaries,
          ...imported.learningHistory.sessionSummaries
        ].slice(-100),
        adaptationHistory: [
          ...existing.learningHistory.adaptationHistory,
          ...imported.learningHistory.adaptationHistory
        ].slice(-100),
        preferenceChanges: [
          ...existing.learningHistory.preferenceChanges,
          ...imported.learningHistory.preferenceChanges
        ].slice(-50)
      }
    };
  }
}