import { AnalysisConfig } from '../config';
import { ComprehensiveAnalysisReport } from '../cleanup-plan/types';

/**
 * Analysis pipeline stage
 */
export interface AnalysisStage {
  name: string;
  description: string;
  analyzer: string;
  enabled: boolean;
  dependencies: string[];
  timeout?: number;
}

/**
 * Pipeline execution result
 */
export interface PipelineExecutionResult {
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  stagesExecuted: number;
  stagesFailed: number;
  stagesSkipped: number;
  results: StageResult[];
  report: ComprehensiveAnalysisReport;
  errors: PipelineError[];
}

/**
 * Stage execution result
 */
export interface StageResult {
  stage: string;
  success: boolean;
  duration: number;
  error?: string;
  result?: any;
}

/**
 * Pipeline error
 */
export interface PipelineError {
  stage: string;
  error: string;
  recoverable: boolean;
}

/**
 * Pipeline options
 */
export interface PipelineOptions {
  /**
   * Configuration for analysis
   */
  config: AnalysisConfig;

  /**
   * Stages to execute (if not specified, run all enabled stages)
   */
  stages?: string[];

  /**
   * Stop on first error
   */
  stopOnError?: boolean;

  /**
   * Enable parallel execution where possible
   */
  parallel?: boolean;

  /**
   * Progress callback
   */
  onProgress?: (progress: PipelineProgress) => void;

  /**
   * Timeout for entire pipeline (milliseconds)
   */
  timeout?: number;
}

/**
 * Pipeline progress information
 */
export interface PipelineProgress {
  stage: string;
  status: 'starting' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  message: string;
}
