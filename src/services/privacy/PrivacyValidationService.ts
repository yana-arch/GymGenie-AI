/**
 * Privacy-Preserving API Validation Service
 * Ensures all AI service calls comply with privacy requirements
 */

export interface PrivacyCheckResult {
  isCompliant: boolean;
  violations: string[];
  piiDetected: string[];
  safeToSend: boolean;
  sanitizedData?: any;
}

export interface DataTransmissionLog {
  timestamp: number;
  service: string;
  dataSize: number;
  piiPresent: boolean;
  blocked: boolean;
  reason?: string;
}

export class PrivacyValidationService {
  private static instance: PrivacyValidationService;
  private transmissionLogs: DataTransmissionLog[] = [];
  private readonly MAX_LOG_SIZE = 1000;

  // PII detection patterns (basic)
  private readonly PII_PATTERNS = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
    /\b\d{1,3}\s\w+\s(st|ave|rd|blvd|dr|ln|ct)\b/gi, // Addresses
  ];

  // Health data PII patterns (more sensitive)
  private readonly HEALTH_PII_PATTERNS = [
    /\b(medical|health|patient|doctor|hospital)\s+(record|history|id|number)\b/gi,
    /\b(blood|heart|blood.pressure|cholesterol|diabetes)\s+(level|pressure|sugar)\b/gi,
  ];

  private constructor() {}

  public static getInstance(): PrivacyValidationService {
    if (!PrivacyValidationService.instance) {
      PrivacyValidationService.instance = new PrivacyValidationService();
    }
    return PrivacyValidationService.instance;
  }

  /**
   * Validate data for privacy compliance before AI processing
   */
  public validateDataForAI(data: any, serviceName: string): PrivacyCheckResult {
    const dataString = JSON.stringify(data);
    const violations: string[] = [];
    const piiDetected: string[] = [];

    // Check for general PII
    this.PII_PATTERNS.forEach(pattern => {
      const matches = dataString.match(pattern);
      if (matches) {
        piiDetected.push(...matches);
        violations.push(`General PII detected: ${pattern}`);
      }
    });

    // Check for health-specific PII
    this.HEALTH_PII_PATTERNS.forEach(pattern => {
      const matches = dataString.match(pattern);
      if (matches) {
        piiDetected.push(...matches);
        violations.push(`Health PII detected: ${pattern}`);
      }
    });

    // Check data size limits
    const dataSize = this.getDataSize(data);
    if (dataSize > 1024 * 10) { // 10KB limit
      violations.push(`Data size too large: ${dataSize} bytes (max: 10KB)`);
    }

    // Check for prohibited fields
    const prohibitedFields = ['email', 'name', 'phone', 'address', 'ssn', 'medicalId'];
    prohibitedFields.forEach(field => {
      if (this.hasField(data, field)) {
        violations.push(`Prohibited field present: ${field}`);
        piiDetected.push(field);
      }
    });

    const isCompliant = violations.length === 0;
    const safeToSend = isCompliant && piiDetected.length === 0;

    // Log the transmission attempt
    this.transmissionLogs.push({
      timestamp: Date.now(),
      service: serviceName,
      dataSize,
      piiPresent: piiDetected.length > 0,
      blocked: !safeToSend,
      reason: !safeToSend ? violations.join('; ') : undefined
    });

    // Sanitize data if possible
    let sanitizedData;
    if (!isCompliant) {
      sanitizedData = this.sanitizeData(data);
    }

    return {
      isCompliant,
      violations,
      piiDetected,
      safeToSend,
      sanitizedData
    };
  }

  /**
   * Sanitize data by removing PII and sensitive information
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};

    const sanitizeString = (str: string): string => {
      let sanitized = str;
      
      // Remove PII patterns
      this.PII_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      
      this.HEALTH_PII_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });

      return sanitized;
    };

    const sanitizeObject = (obj: any): any => {
      const result = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          // Skip prohibited fields entirely
          if (['email', 'name', 'phone', 'address', 'ssn', 'medicalId'].includes(key.toLowerCase())) {
            continue;
          }
          
          if (typeof value === 'string') {
            (result as any)[key] = sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            (result as any)[key] = sanitizeObject(value);
          } else {
            (result as any)[key] = value;
          }
        }
      }
      
      return result;
    };

    return sanitizeObject(data);
  }

  /**
   * Check if object has a specific field (deep search)
   */
  private hasField(obj: any, fieldName: string): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    for (const key in obj) {
      if (key.toLowerCase() === fieldName.toLowerCase()) {
        return true;
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.hasField(obj[key], fieldName)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get approximate data size in bytes
   */
  private getDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Get privacy compliance metrics
   */
  public getPrivacyMetrics(): {
    totalTransmissions: number;
    blockedTransmissions: number;
    piiIncidents: number;
    complianceRate: number;
    recentViolations: DataTransmissionLog[];
  } {
    const totalTransmissions = this.transmissionLogs.length;
    const blockedTransmissions = this.transmissionLogs.filter(log => log.blocked).length;
    const piiIncidents = this.transmissionLogs.filter(log => log.piiPresent).length;
    const complianceRate = totalTransmissions > 0 ? ((totalTransmissions - blockedTransmissions) / totalTransmissions) * 100 : 100;
    const recentViolations = this.transmissionLogs
      .filter(log => log.blocked)
      .slice(-10); // Last 10 violations

    return {
      totalTransmissions,
      blockedTransmissions,
      piiIncidents,
      complianceRate,
      recentViolations
    };
  }

  /**
   * Clear transmission logs (for privacy)
   */
  public clearLogs(): void {
    this.transmissionLogs = [];
  }

  /**
   * Export privacy audit log
   */
  public exportAuditLog(): DataTransmissionLog[] {
    return [...this.transmissionLogs];
  }
}

export const privacyValidationService = PrivacyValidationService.getInstance();