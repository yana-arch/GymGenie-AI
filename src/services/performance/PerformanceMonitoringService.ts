/**
 * Performance Monitoring Service for All AI Services
 * Tracks response times, errors, and SLA compliance
 */

export interface AIServiceMetric {
  serviceName: string;
  method: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  success: boolean;
  error?: string;
  dataSize?: number;
  cacheHit?: boolean;
}

export interface ServicePerformanceReport {
  serviceName: string;
  totalRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  errorRate: number;
  slaCompliance: number; // Percentage meeting SLA
  recentMetrics: AIServiceMetric[];
}

export interface SLADefinition {
  serviceName: string;
  maxResponseTime: number; // milliseconds
  maxErrorRate: number; // percentage
  minSuccessRate: number; // percentage
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: AIServiceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  // SLA definitions for different AI services
  private readonly SLA_DEFINITIONS: SLADefinition[] = [
    {
      serviceName: 'GeminiService.generateWorkoutAdaptation',
      maxResponseTime: 2000, // 2 seconds
      maxErrorRate: 5, // 5%
      minSuccessRate: 95 // 95%
    },
    {
      serviceName: 'FormAnalysisService.analyzeForm',
      maxResponseTime: 500, // 500ms for real-time form correction
      maxErrorRate: 2, // 2% for real-time systems
      minSuccessRate: 98 // 98%
    },
    {
      serviceName: 'PoseDetectionService.detectPose',
      maxResponseTime: 100, // 100ms for pose detection
      maxErrorRate: 1, // 1%
      minSuccessRate: 99 // 99%
    },
    {
      serviceName: 'OverrideDetectionService.detectOverride',
      maxResponseTime: 100, // 100ms for UI interactions
      maxErrorRate: 1, // 1%
      minSuccessRate: 99 // 99%
    }
  ];

  private constructor() {}

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Start monitoring for an AI service call
   */
  public startMonitoring(serviceName: string, method: string, dataSize?: number): {
    monitoringId: string;
    startTime: number;
  } {
    const monitoringId = crypto.randomUUID();
    return {
      monitoringId,
      startTime: performance.now()
    };
  }

  /**
   * End monitoring and record metrics
   */
  public endMonitoring(
    monitoringId: string, 
    startTime: number, 
    success: boolean, 
    error?: string,
    cacheHit?: boolean
  ): void {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const metric: AIServiceMetric = {
      serviceName: this.getServiceNameFromMonitoringId(monitoringId),
      method: this.getMethodFromMonitoringId(monitoringId),
      startTime,
      endTime,
      responseTime,
      success,
      error,
      cacheHit
    };

    this.addMetric(metric);
  }

  /**
   * Record a complete metric (for services that can't be instrumented with start/end)
   */
  public recordMetric(metric: Omit<AIServiceMetric, 'startTime' | 'endTime'>): void {
    const fullMetric: AIServiceMetric = {
      ...metric,
      startTime: performance.now() - metric.responseTime,
      endTime: performance.now()
    };

    this.addMetric(fullMetric);
  }

  /**
   * Get performance report for a specific service
   */
  public getServiceReport(serviceName: string): ServicePerformanceReport {
    const serviceMetrics = this.metrics.filter(m => 
      m.serviceName === serviceName
    );

    if (serviceMetrics.length === 0) {
      return {
        serviceName,
        totalRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        slaCompliance: 100,
        recentMetrics: []
      };
    }

    const totalRequests = serviceMetrics.length;
    const successfulRequests = serviceMetrics.filter(m => m.success).length;
    const responseTimes = serviceMetrics.map(m => m.responseTime);
    
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const successRate = (successfulRequests / totalRequests) * 100;
    const errorRate = 100 - successRate;

    const slaDefinition = this.SLA_DEFINITIONS.find(sla => sla.serviceName === serviceName);
    const slaCompliantRequests = slaDefinition 
      ? serviceMetrics.filter(m => 
          m.success && 
          m.responseTime <= slaDefinition.maxResponseTime
        ).length
      : successfulRequests;
    
    const slaCompliance = slaDefinition 
      ? (slaCompliantRequests / totalRequests) * 100
      : 100;

    return {
      serviceName,
      totalRequests,
      averageResponseTime,
      maxResponseTime,
      minResponseTime,
      successRate,
      errorRate,
      slaCompliance,
      recentMetrics: serviceMetrics.slice(-10) // Last 10 requests
    };
  }

  /**
   * Get performance report for all services
   */
  public getAllReports(): ServicePerformanceReport[] {
    const serviceNames = [...new Set(this.metrics.map(m => m.serviceName))];
    return serviceNames.map(name => this.getServiceReport(name));
  }

  /**
   * Get services with SLA breaches
   */
  public getSLABreaches(): ServicePerformanceReport[] {
    const allReports = this.getAllReports();
    return allReports.filter(report => {
      const sla = this.SLA_DEFINITIONS.find(s => s.serviceName === report.serviceName);
      if (!sla) return false;
      
      return report.slaCompliance < 100 || 
             report.successRate < sla.minSuccessRate ||
             report.errorRate > sla.maxErrorRate ||
             report.averageResponseTime > sla.maxResponseTime;
    });
  }

  /**
   * Get overall system health score
   */
  public getSystemHealthScore(): {
    overall: number;
    byService: { [serviceName: string]: number };
    criticalIssues: string[];
  } {
    const allReports = this.getAllReports();
    const byService: { [serviceName: string]: number } = {};
    const criticalIssues: string[] = [];

    allReports.forEach(report => {
      const sla = this.SLA_DEFINITIONS.find(s => s.serviceName === report.serviceName);
      if (!sla) {
        byService[report.serviceName] = 50; // Unknown service
        return;
      }

      let score = 100;
      
      // Penalize SLA breaches
      if (report.slaCompliance < 100) {
        score -= (100 - report.slaCompliance) * 0.5;
        if (report.slaCompliance < 90) {
          criticalIssues.push(`${report.serviceName}: SLA compliance at ${report.slaCompliance.toFixed(1)}%`);
        }
      }
      
      // Penalize high error rates
      if (report.errorRate > sla.maxErrorRate) {
        score -= (report.errorRate - sla.maxErrorRate) * 2;
        if (report.errorRate > sla.maxErrorRate * 2) {
          criticalIssues.push(`${report.serviceName}: Error rate at ${report.errorRate.toFixed(1)}%`);
        }
      }
      
      // Penalize slow response times
      if (report.averageResponseTime > sla.maxResponseTime) {
        score -= (report.averageResponseTime - sla.maxResponseTime) * 0.1;
        if (report.averageResponseTime > sla.maxResponseTime * 2) {
          criticalIssues.push(`${report.serviceName}: Response time at ${report.averageResponseTime.toFixed(0)}ms`);
        }
      }

      byService[report.serviceName] = Math.max(0, score);
    });

    const overall = Object.values(byService).reduce((a, b) => a + b, 0) / Object.keys(byService).length;

    return {
      overall: Math.round(overall),
      byService,
      criticalIssues
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  public clearOldMetrics(olderThanMs: number = 60 * 60 * 1000): void { // Default 1 hour
    const cutoffTime = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.endTime > cutoffTime);
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): AIServiceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by time range
   */
  public getMetricsByTimeRange(startTime: number, endTime: number): AIServiceMetric[] {
    return this.metrics.filter(m => 
      m.startTime >= startTime && m.endTime <= endTime
    );
  }

  private addMetric(metric: AIServiceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  private getServiceNameFromMonitoringId(monitoringId: string): string {
    // For simplicity, extract service name from monitoring ID
    // In real implementation, this would be more sophisticated
    const parts = monitoringId.split('-');
    return parts[0] || 'unknown';
  }

  private getMethodFromMonitoringId(monitoringId: string): string {
    const parts = monitoringId.split('-');
    return parts[1] || 'unknown';
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();