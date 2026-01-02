/**
 * Bundle size analysis report
 */
export interface BundleSizeReport {
  timestamp: Date;
  totalSize: number;
  gzippedSize: number;
  chunks: BundleChunk[];
  largestContributors: BundleContributor[];
  suggestions: BundleSuggestion[];
  treeShakingEffectiveness: TreeShakingReport;
}

/**
 * Bundle chunk information
 */
export interface BundleChunk {
  name: string;
  size: number;
  gzippedSize: number;
  modules: BundleModule[];
  type: 'entry' | 'vendor' | 'async' | 'shared';
}

/**
 * Bundle module information
 */
export interface BundleModule {
  name: string;
  size: number;
  imports: string[];
  isTreeShakeable: boolean;
}

/**
 * Largest bundle contributor
 */
export interface BundleContributor {
  name: string;
  size: number;
  percentage: number;
  type: 'module' | 'package' | 'asset';
  suggestion: string;
}

/**
 * Bundle optimization suggestion
 */
export interface BundleSuggestion {
  type: SuggestionType;
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
  modules?: string[];
  action: string;
}

/**
 * Suggestion type
 */
export type SuggestionType =
  | 'code-splitting'
  | 'dynamic-import'
  | 'tree-shaking'
  | 'remove-unused'
  | 'optimize-package'
  | 'lazy-load';

/**
 * Tree shaking effectiveness report
 */
export interface TreeShakingReport {
  isEffective: boolean;
  unusedExports: number;
  potentialSavings: number;
  issues: TreeShakingIssue[];
}

/**
 * Tree shaking issue
 */
export interface TreeShakingIssue {
  module: string;
  reason: string;
  impact: number;
  suggestion: string;
}

/**
 * Bundle size analysis options
 */
export interface BundleSizeOptions {
  /**
   * Build command to run
   */
  buildCommand?: string;

  /**
   * Output directory to analyze
   */
  outputDir?: string;

  /**
   * Minimum size threshold for reporting (bytes)
   */
  minSizeThreshold?: number;

  /**
   * Number of top contributors to report
   */
  topContributorsCount?: number;

  /**
   * Include source maps in analysis
   */
  includeSourceMaps?: boolean;
}

/**
 * Bundle comparison (before/after)
 */
export interface BundleComparison {
  before: BundleSizeReport;
  after: BundleSizeReport;
  improvements: {
    totalSizeReduction: number;
    gzippedSizeReduction: number;
    percentageReduction: number;
    chunksRemoved: number;
    summary: string;
  };
  timestamp: Date;
}
