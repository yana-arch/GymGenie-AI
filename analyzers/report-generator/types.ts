import { ComprehensiveAnalysisReport } from '../cleanup-plan/types';
import { CleanupExecutionResult } from '../cleanup-executor/types';

/**
 * Report output format
 */
export type ReportFormat = 'json' | 'html' | 'markdown';

/**
 * Comprehensive report containing all analysis and execution results
 */
export interface ComprehensiveReport {
  id: string;
  timestamp: Date;
  projectName: string;
  analysisReport: ComprehensiveAnalysisReport;
  executionResult?: CleanupExecutionResult;
  summary: ReportSummary;
  recommendations: string[];
}

/**
 * Report summary
 */
export interface ReportSummary {
  totalIssuesFound: number;
  issuesByType: Record<string, number>;
  filesAnalyzed: number;
  filesAffected: number;
  estimatedImpact: {
    linesRemoved: number;
    bundleSizeReduction: number;
    timeEstimate: number;
  };
  executionSummary?: {
    actionsExecuted: number;
    actionsSucceeded: number;
    actionsFailed: number;
    duration: number;
  };
}

/**
 * Report generation options
 */
export interface ReportOptions {
  /**
   * Output format
   */
  format: ReportFormat;

  /**
   * Output file path (optional)
   */
  outputPath?: string;

  /**
   * Include detailed analysis
   */
  includeDetails?: boolean;

  /**
   * Include visualizations (HTML only)
   */
  includeVisualizations?: boolean;

  /**
   * Project name
   */
  projectName?: string;

  /**
   * Custom title
   */
  title?: string;
}

/**
 * Chart data for visualizations
 */
export interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}
