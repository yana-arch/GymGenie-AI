/**
 * Types for Documentation Generator
 * Generates comprehensive documentation for cleanup decisions and maintenance
 */

import type { AnalysisReport } from '../types/AnalysisReport';
import type { CleanupPlan, CleanupAction } from '../cleanup-plan/types';
import type { QualityMetrics } from '../quality-metrics/types';

/**
 * Documentation generation configuration
 */
export interface DocumentationConfig {
  /** Output directory for documentation */
  outputDir: string;
  /** Include before/after code comparisons */
  includeCodeComparisons: boolean;
  /** Include decision rationale */
  includeDecisionRationale: boolean;
  /** Include maintenance checklist */
  includeMaintenanceChecklist: boolean;
  /** Include best practices guide */
  includeBestPractices: boolean;
  /** Output format */
  format: 'markdown' | 'html' | 'pdf';
}

/**
 * Complete documentation package
 */
export interface DocumentationPackage {
  /** Cleanup decision documentation */
  cleanupDecisions: CleanupDecisionDoc;
  /** Before/after code comparisons */
  codeComparisons: CodeComparisonDoc[];
  /** Maintenance checklist */
  maintenanceChecklist: MaintenanceChecklistDoc;
  /** Best practices guide */
  bestPractices: BestPracticesDoc;
  /** Generated timestamp */
  generatedAt: Date;
}

/**
 * Cleanup decision documentation
 */
export interface CleanupDecisionDoc {
  /** Summary of cleanup decisions */
  summary: DecisionSummary;
  /** Detailed decisions by category */
  decisions: CleanupDecision[];
  /** Overall impact assessment */
  impact: ImpactAssessment;
}

/**
 * Summary of cleanup decisions
 */
export interface DecisionSummary {
  /** Total actions planned */
  totalActions: number;
  /** Actions by type */
  actionsByType: Record<string, number>;
  /** Actions by safety level */
  actionsBySafety: {
    safe: number;
    reviewNeeded: number;
    risky: number;
  };
  /** Estimated impact */
  estimatedImpact: {
    filesAffected: number;
    linesRemoved: number;
    bundleSizeReduction: number;
  };
}

/**
 * Individual cleanup decision
 */
export interface CleanupDecision {
  /** Action being taken */
  action: CleanupAction;
  /** Rationale for the decision */
  rationale: string;
  /** Evidence supporting the decision */
  evidence: Evidence[];
  /** Risks and mitigation strategies */
  risks: Risk[];
  /** Alternative approaches considered */
  alternatives: Alternative[];
}

/**
 * Evidence supporting a cleanup decision
 */
export interface Evidence {
  /** Type of evidence */
  type: 'analysis-result' | 'usage-data' | 'test-coverage' | 'dependency-graph';
  /** Description of evidence */
  description: string;
  /** Source of evidence */
  source: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Risk associated with a cleanup action
 */
export interface Risk {
  /** Risk description */
  description: string;
  /** Severity level */
  severity: 'high' | 'medium' | 'low';
  /** Mitigation strategy */
  mitigation: string;
  /** Likelihood of occurrence */
  likelihood: 'high' | 'medium' | 'low';
}

/**
 * Alternative approach considered
 */
export interface Alternative {
  /** Description of alternative */
  description: string;
  /** Why it was not chosen */
  reasonNotChosen: string;
  /** Pros of this alternative */
  pros: string[];
  /** Cons of this alternative */
  cons: string[];
}

/**
 * Overall impact assessment
 */
export interface ImpactAssessment {
  /** Code quality improvements */
  qualityImprovements: QualityImprovement[];
  /** Performance improvements */
  performanceImprovements: PerformanceImprovement[];
  /** Maintainability improvements */
  maintainabilityImprovements: MaintainabilityImprovement[];
  /** Potential breaking changes */
  breakingChanges: BreakingChange[];
}

/**
 * Code quality improvement
 */
export interface QualityImprovement {
  /** Metric name */
  metric: string;
  /** Before value */
  before: number;
  /** After value */
  after: number;
  /** Improvement percentage */
  improvement: number;
  /** Description */
  description: string;
}

/**
 * Performance improvement
 */
export interface PerformanceImprovement {
  /** Metric name */
  metric: string;
  /** Before value */
  before: string;
  /** After value */
  after: string;
  /** Improvement description */
  improvement: string;
}

/**
 * Maintainability improvement
 */
export interface MaintainabilityImprovement {
  /** Area of improvement */
  area: string;
  /** Description */
  description: string;
  /** Impact level */
  impact: 'high' | 'medium' | 'low';
}

/**
 * Potential breaking change
 */
export interface BreakingChange {
  /** Description of change */
  description: string;
  /** Affected areas */
  affectedAreas: string[];
  /** Migration steps */
  migrationSteps: string[];
  /** Severity */
  severity: 'critical' | 'major' | 'minor';
}

/**
 * Before/after code comparison
 */
export interface CodeComparisonDoc {
  /** File path */
  file: string;
  /** Action type */
  actionType: string;
  /** Before code */
  before: CodeSnapshot;
  /** After code */
  after: CodeSnapshot;
  /** Changes summary */
  changesSummary: ChangesSummary;
  /** Visual diff */
  diff: string;
}

/**
 * Code snapshot
 */
export interface CodeSnapshot {
  /** Code content */
  code: string;
  /** Line count */
  lines: number;
  /** Complexity metrics */
  complexity?: number;
  /** Dependencies */
  dependencies?: string[];
}

/**
 * Summary of changes
 */
export interface ChangesSummary {
  /** Lines added */
  linesAdded: number;
  /** Lines removed */
  linesRemoved: number;
  /** Lines modified */
  linesModified: number;
  /** Key changes */
  keyChanges: string[];
}

/**
 * Maintenance checklist documentation
 */
export interface MaintenanceChecklistDoc {
  /** Daily maintenance tasks */
  daily: ChecklistItem[];
  /** Weekly maintenance tasks */
  weekly: ChecklistItem[];
  /** Monthly maintenance tasks */
  monthly: ChecklistItem[];
  /** Quarterly maintenance tasks */
  quarterly: ChecklistItem[];
  /** Code review guidelines */
  codeReviewGuidelines: CodeReviewGuideline[];
}

/**
 * Checklist item
 */
export interface ChecklistItem {
  /** Task description */
  task: string;
  /** Why it's important */
  rationale: string;
  /** How to perform the task */
  howTo: string;
  /** Estimated time */
  estimatedTime: string;
  /** Tools needed */
  tools: string[];
}

/**
 * Code review guideline
 */
export interface CodeReviewGuideline {
  /** Category */
  category: string;
  /** Guidelines */
  guidelines: string[];
  /** Red flags to watch for */
  redFlags: string[];
  /** Examples */
  examples: ReviewExample[];
}

/**
 * Code review example
 */
export interface ReviewExample {
  /** Example title */
  title: string;
  /** Bad code example */
  bad: string;
  /** Good code example */
  good: string;
  /** Explanation */
  explanation: string;
}

/**
 * Best practices documentation
 */
export interface BestPracticesDoc {
  /** General best practices */
  general: BestPractice[];
  /** Category-specific best practices */
  byCategory: Record<string, BestPractice[]>;
  /** Anti-patterns to avoid */
  antiPatterns: AntiPattern[];
  /** Success stories */
  successStories: SuccessStory[];
}

/**
 * Best practice
 */
export interface BestPractice {
  /** Practice title */
  title: string;
  /** Description */
  description: string;
  /** Why it's important */
  rationale: string;
  /** How to implement */
  implementation: string;
  /** Code examples */
  examples: CodeExample[];
  /** Related practices */
  relatedPractices: string[];
}

/**
 * Code example
 */
export interface CodeExample {
  /** Example title */
  title: string;
  /** Code snippet */
  code: string;
  /** Language */
  language: string;
  /** Explanation */
  explanation: string;
}

/**
 * Anti-pattern to avoid
 */
export interface AntiPattern {
  /** Pattern name */
  name: string;
  /** Description */
  description: string;
  /** Why it's problematic */
  problems: string[];
  /** How to fix */
  solution: string;
  /** Example */
  example: CodeExample;
}

/**
 * Success story
 */
export interface SuccessStory {
  /** Story title */
  title: string;
  /** Context */
  context: string;
  /** Problem faced */
  problem: string;
  /** Solution applied */
  solution: string;
  /** Results achieved */
  results: string[];
  /** Lessons learned */
  lessonsLearned: string[];
}

/**
 * Documentation generator interface
 */
export interface IDocumentationGenerator {
  /**
   * Generate complete documentation package
   */
  generateDocumentation(
    analysisReport: AnalysisReport,
    cleanupPlan: CleanupPlan,
    beforeMetrics: QualityMetrics,
    afterMetrics: QualityMetrics,
    config: DocumentationConfig
  ): Promise<DocumentationPackage>;

  /**
   * Generate cleanup decision documentation
   */
  generateCleanupDecisions(
    cleanupPlan: CleanupPlan,
    analysisReport: AnalysisReport
  ): CleanupDecisionDoc;

  /**
   * Generate before/after code comparisons
   */
  generateCodeComparisons(
    cleanupPlan: CleanupPlan,
    beforeMetrics: QualityMetrics,
    afterMetrics: QualityMetrics
  ): Promise<CodeComparisonDoc[]>;

  /**
   * Generate maintenance checklist
   */
  generateMaintenanceChecklist(): MaintenanceChecklistDoc;

  /**
   * Generate best practices guide
   */
  generateBestPractices(analysisReport: AnalysisReport): BestPracticesDoc;

  /**
   * Export documentation to file
   */
  exportDocumentation(
    documentation: DocumentationPackage,
    config: DocumentationConfig
  ): Promise<string>;
}
