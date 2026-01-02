import { AnalysisConfig } from '../config';

/**
 * Base interface for all analyzers
 */
export interface CodeAnalyzer<TReport = unknown> {
  /**
   * Name of the analyzer
   */
  readonly name: string;

  /**
   * Run the analysis
   * @param config Analysis configuration
   * @returns Analysis report
   */
  analyze(config: AnalysisConfig): Promise<TReport>;
}

/**
 * Base analysis report interface
 */
export interface AnalysisReport {
  /**
   * Analyzer name
   */
  analyzer: string;

  /**
   * Timestamp of analysis
   */
  timestamp: Date;

  /**
   * Analysis duration in milliseconds
   */
  duration: number;

  /**
   * Whether analysis completed successfully
   */
  success: boolean;

  /**
   * Error message if analysis failed
   */
  error?: string;
}

/**
 * File location information
 */
export interface FileLocation {
  file: string;
  line: number;
  column?: number;
}

/**
 * Code item reference
 */
export interface CodeItem extends FileLocation {
  name: string;
  type: string;
}

/**
 * Confidence level for analysis results
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * File type classification
 */
export type FileType = 'component' | 'service' | 'utility' | 'type' | 'test' | 'config';

/**
 * Action type for cleanup operations
 */
export type ActionType =
  | 'remove-dead-code'
  | 'remove-unused-import'
  | 'refactor-duplicate'
  | 'delete-orphaned-file'
  | 'consolidate-types'
  | 'integrate-service'
  | 'fix-flow-violation'
  | 'break-circular-dependency';

/**
 * Cleanup action
 */
export interface CleanupAction {
  id: string;
  type: ActionType;
  target: string;
  description: string;
  autoExecutable: boolean;
  requiresReview: boolean;
  estimatedImpact: number;
  dependencies: string[];
}

/**
 * Impact estimate for cleanup operations
 */
export interface ImpactEstimate {
  filesAffected: number;
  linesRemoved: number;
  bundleSizeReduction: number;
  estimatedTimeMinutes: number;
}
