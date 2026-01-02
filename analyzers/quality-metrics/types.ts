/**
 * Quality metrics for a codebase
 */
export interface QualityMetrics {
  timestamp: Date;
  coverage: CoverageMetrics;
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  codeHealth: CodeHealthMetrics;
}

/**
 * Code coverage metrics
 */
export interface CoverageMetrics {
  lines: CoverageDetail;
  statements: CoverageDetail;
  functions: CoverageDetail;
  branches: CoverageDetail;
  overall: number; // 0-100
}

/**
 * Coverage detail for a specific metric
 */
export interface CoverageDetail {
  total: number;
  covered: number;
  percentage: number;
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  highComplexityFunctions: ComplexFunction[];
  totalFunctions: number;
  complexityDistribution: ComplexityDistribution;
}

/**
 * Complex function information
 */
export interface ComplexFunction {
  file: string;
  name: string;
  line: number;
  complexity: number;
  recommendation: string;
}

/**
 * Complexity distribution
 */
export interface ComplexityDistribution {
  low: number; // 1-5
  medium: number; // 6-10
  high: number; // 11-20
  veryHigh: number; // 21+
}

/**
 * Maintainability metrics
 */
export interface MaintainabilityMetrics {
  maintainabilityIndex: number; // 0-100
  averageLinesPerFile: number;
  averageFunctionsPerFile: number;
  filesWithIssues: number;
  totalFiles: number;
  technicalDebt: TechnicalDebt;
}

/**
 * Technical debt information
 */
export interface TechnicalDebt {
  estimatedHours: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issues: TechnicalDebtIssue[];
}

/**
 * Technical debt issue
 */
export interface TechnicalDebtIssue {
  type: string;
  file: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  description: string;
}

/**
 * Code health metrics
 */
export interface CodeHealthMetrics {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    coverage: number;
    complexity: number;
    maintainability: number;
    duplication: number;
  };
}

/**
 * Metrics comparison (before/after)
 */
export interface MetricsComparison {
  before: QualityMetrics;
  after: QualityMetrics;
  improvements: MetricsImprovement;
  timestamp: Date;
}

/**
 * Metrics improvement details
 */
export interface MetricsImprovement {
  coverage: {
    change: number;
    improved: boolean;
  };
  complexity: {
    change: number;
    improved: boolean;
  };
  maintainability: {
    change: number;
    improved: boolean;
  };
  codeHealth: {
    change: number;
    improved: boolean;
  };
  summary: string;
}

/**
 * Metrics calculation options
 */
export interface MetricsOptions {
  /**
   * Include coverage analysis
   */
  includeCoverage?: boolean;

  /**
   * Include complexity analysis
   */
  includeComplexity?: boolean;

  /**
   * Include maintainability analysis
   */
  includeMaintainability?: boolean;

  /**
   * Complexity threshold for flagging functions
   */
  complexityThreshold?: number;

  /**
   * Files to analyze (glob patterns)
   */
  files?: string[];

  /**
   * Files to exclude (glob patterns)
   */
  exclude?: string[];
}
