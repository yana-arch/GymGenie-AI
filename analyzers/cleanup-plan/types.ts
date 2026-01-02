import { AnalysisReport, CleanupAction, ImpactEstimate } from '../types';
import { DeadCodeReport } from '../dead-code/types';
import { DuplicateCodeReport } from '../duplicate-code/types';
import { OrphanedFilesReport } from '../orphaned-files/types';

/**
 * Safety level for cleanup operations
 */
export type SafetyLevel = 'safe' | 'review-needed' | 'risky';

/**
 * Comprehensive analysis report containing all analyzer results
 */
export interface ComprehensiveAnalysisReport {
  deadCode?: DeadCodeReport;
  duplicates?: DuplicateCodeReport;
  orphanedFiles?: OrphanedFilesReport;
  unusedImports?: AnalysisReport & { unusedImports: any[] };
  typeIssues?: AnalysisReport & { issues: any[] };
  dependencies?: AnalysisReport & { circularDependencies: any[] };
  serviceIntegration?: AnalysisReport & { unusedServices: any[] };
  codeFlow?: AnalysisReport & { violations: any[] };
}

/**
 * Cleanup plan containing all actions to be executed
 */
export interface CleanupPlan {
  id: string;
  createdAt: Date;
  analysisReport: ComprehensiveAnalysisReport;
  actions: CleanupAction[];
  estimatedImpact: ImpactEstimate;
  safetyLevel: SafetyLevel;
}

/**
 * Action dependency information
 */
export interface ActionDependency {
  actionId: string;
  dependsOn: string[];
  reason: string;
}

/**
 * Cleanup plan generation options
 */
export interface CleanupPlanOptions {
  /**
   * Include only safe actions
   */
  safeOnly?: boolean;

  /**
   * Minimum confidence level for actions
   */
  minConfidence?: 'high' | 'medium' | 'low';

  /**
   * Maximum number of actions to include
   */
  maxActions?: number;

  /**
   * Prioritize high-impact actions
   */
  prioritizeHighImpact?: boolean;

  /**
   * Include actions that require review
   */
  includeReviewRequired?: boolean;
}

/**
 * Action generation result
 */
export interface ActionGenerationResult {
  actions: CleanupAction[];
  dependencies: ActionDependency[];
  skipped: {
    action: Partial<CleanupAction>;
    reason: string;
  }[];
}
