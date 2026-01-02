import { AnalysisReport, FileLocation } from '../types';

/**
 * Duplicate code detection configuration
 */
export interface DuplicateConfig {
  minLines: number;
  minTokens: number;
  similarityThreshold: number; // 0-1
  ignorePatterns: string[];
}

/**
 * Code block information
 */
export interface CodeBlock extends FileLocation {
  endLine: number;
  code: string;
  hash: string;
  tokens: number;
}

/**
 * Refactoring suggestion type
 */
export type RefactoringType =
  | 'extract-function'
  | 'extract-utility'
  | 'extract-hook'
  | 'extract-component';

/**
 * Priority level for refactoring
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * Impact level for duplicates
 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  type: RefactoringType;
  targetLocation: string;
  estimatedImpact: number; // lines saved
  priority: Priority;
  description: string;
  affectedFiles: string[];
}

/**
 * Group of duplicate code blocks
 */
export interface DuplicateGroup {
  id: string;
  instances: CodeBlock[];
  similarity: number;
  impact: ImpactLevel;
  suggestedRefactoring: RefactoringSuggestion;
  linesTotal: number;
  occurrences: number;
}

/**
 * Duplicate code analysis report
 */
export interface DuplicateCodeReport extends AnalysisReport {
  duplicates: DuplicateGroup[];
  config: DuplicateConfig;
  summary: {
    totalDuplicates: number;
    totalInstances: number;
    filesAffected: number;
    linesDuplicated: number;
    potentialLinesSaved: number;
    highImpactCount: number;
  };
}
