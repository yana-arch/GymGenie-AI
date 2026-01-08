/**
 * Privacy Service for Form Correction Data
 * Implements local-only processing and GDPR compliance
 */

export interface AuditLog {
  operation: string;
  timestamp: number;
  dataHash: string;
  userId: string;
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
}

export interface MemoryUsage {
  sensitiveDataInMemory: number;
  totalBuffersAllocated: number;
  lastCleanupTime: number;
}

export class PrivacyService {
  private auditLogger: ((log: AuditLog) => void) | null = null;
  private memoryBuffers: Set<ArrayBuffer> = new Set();
  private retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store form data only in local storage (never cloud)
   */
  async storeFormDataLocal(data: any): Promise<void> {
    const encryptedData = await this.encryptForLocalStorage(data);
    const key = `form_data_${Date.now()}`;
    
    localStorage.setItem(key, encryptedData);
    
    this.logAudit('store_local', await this.hashData(data));
  }

  /**
   * Process data and securely cleanup sensitive information
   */
  async processAndCleanup(data: any): Promise<void> {
    // Process the data (simulate processing)
    await this.simulateProcessing(data);
    
    // Cleanup sensitive data
    this.clearSensitiveData();
    
    // Clear memory buffers
    this.clearMemoryBuffers();
  }

  /**
   * Check if sensitive data exists in memory
   */
  hasSensitiveData(): boolean {
    return this.memoryBuffers.size > 0;
  }

  /**
   * Sanitize data for logging (remove PII)
   */
  sanitizeForLogging(data: any): any {
    const sanitized = { ...data };
    
    // Redact PII fields
    if (sanitized.userId) sanitized.userId = '[REDACTED]';
    if (sanitized.email) sanitized.email = '[REDACTED]';
    if (sanitized.name) sanitized.name = '[REDACTED]';
    if (sanitized.phone) sanitized.phone = '[REDACTED]';
    
    return sanitized;
  }

  /**
   * Process data securely with memory management
   */
  async secureProcess(data: any): Promise<void> {
    const buffer = new ArrayBuffer(1024); // Simulate sensitive buffer
    
    this.memoryBuffers.add(buffer);
    
    // Process the data
    await this.processAndCleanup(data);
    
    // Buffer should be cleared in processAndCleanup
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage(): MemoryUsage {
    return {
      sensitiveDataInMemory: this.memoryBuffers.size,
      totalBuffersAllocated: this.memoryBuffers.size,
      lastCleanupTime: Date.now()
    };
  }

  /**
   * Check if old data should be deleted based on retention policy
   */
  shouldDeleteOldData(data: any): boolean {
    if (!data.timestamp) return true;
    
    const age = Date.now() - data.timestamp;
    return age > this.retentionPeriod;
  }

  /**
   * Minimize data according to GDPR principles
   */
  minimizeData(fullData: any): any {
    // Keep only essential data for form correction
    const minimized = {
      poses: fullData.poses,
      exerciseType: fullData.exerciseType,
      timestamp: fullData.timestamp
    };
    
    // Remove all PII if they exist
    if ('userId' in minimized) delete (minimized as any).userId;
    if ('email' in minimized) delete (minimized as any).email;
    if ('name' in minimized) delete (minimized as any).name;
    if ('age' in minimized) delete (minimized as any).age;
    if ('phone' in minimized) delete (minimized as any).phone;
    
    return minimized;
  }

  /**
   * Check access controls for sensitive data
   */
  async checkAccess(userId: string, data: any): Promise<AccessResult> {
    // Simple access control simulation
    const authorizedUsers = ['system', 'ai_coach', 'user_service'];
    
    if (!authorizedUsers.includes(userId)) {
      return {
        granted: false,
        reason: 'Unauthorized access attempt'
      };
    }
    
    return { granted: true };
  }

  /**
   * Set audit logger for compliance tracking
   */
  setAuditLogger(logger: (log: AuditLog) => void): void {
    this.auditLogger = logger;
  }

  /**
   * Perform data operation with audit logging
   */
  async performDataOperation(operation: string, data: any): Promise<void> {
    const result = await this.executeOperation(operation, data);
    
    if (this.auditLogger) {
      this.auditLogger({
        operation,
        timestamp: Date.now(),
        dataHash: await this.hashData(data),
        userId: 'system'
      });
    }
    
    return result;
  }

  // Private helper methods

  private async encryptForLocalStorage(data: any): Promise<string> {
    // Simple encryption simulation (in production, use proper encryption)
    return btoa(JSON.stringify(data));
  }

  private async hashData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private logAudit(operation: string, dataHash: string): void {
    if (this.auditLogger) {
      this.auditLogger({
        operation,
        timestamp: Date.now(),
        dataHash,
        userId: 'system'
      });
    }
  }

  private async simulateProcessing(data: any): Promise<void> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private clearSensitiveData(): void {
    // Clear any sensitive data in memory
    this.clearMemoryBuffers();
  }

  private clearMemoryBuffers(): void {
    this.memoryBuffers.forEach(buffer => {
      // Zero out buffers
      const view = new Uint8Array(buffer);
      view.fill(0);
    });
    this.memoryBuffers.clear();
  }

  private async executeOperation(operation: string, data: any): Promise<void> {
    // Simulate operation execution
    switch (operation) {
      case 'access':
        // Simulate data access
        break;
      case 'process':
        // Simulate data processing
        break;
      case 'delete':
        // Simulate data deletion
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}