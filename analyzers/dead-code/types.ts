import { AnalysisReport, ConfidenceLevel, FileLocation } from '../types';

/**
 * Type of unused export
 */
export type UnusedExportType = 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum';

/**
 * Export type classification
 */
export type ExportType = 'named' | 'default';

/**
 * Unused export information
 */
export interface UnusedExport extends FileLocation {
  name: string;
  type: UnusedExportType;
  exportType: ExportType;
  potentialDynamicUsage: boolean;
}

/**
 * Unused function information
 */
export interface UnusedFunction extends FileLocation {
  name: string;
  isExported: boolean;
  complexity?: number;
}

/**
 * Unused variable information
 */
export interface UnusedVariable extends FileLocation {
  name: string;
  isExported: boolean;
  scope: 'global' | 'module' | 'local';
}

/**
 * Unused type information
 */
export interface UnusedType extends FileLocation {
  name: string;
  kind: 'type' | 'interface' | 'enum';
  isExported: boolean;
}

/**
 * Dead code analysis report
 */
export interface DeadCodeReport extends AnalysisReport {
  unusedExports: UnusedExport[];
  unusedFunctions: UnusedFunction[];
  unusedVariables: UnusedVariable[];
  unusedTypes: UnusedType[];
  confidence: ConfidenceLevel;
  summary: {
    totalUnusedExports: number;
    totalUnusedFunctions: number;
    totalUnusedVariables: number;
    totalUnusedTypes: number;
    filesAffected: number;
  };
}

/**
 * Removal plan for dead code
 */
export interface RemovalPlan {
  actions: RemovalAction[];
  estimatedImpact: {
    filesAffected: number;
    exportsRemoved: number;
    linesRemoved: number;
  };
  safetyLevel: 'safe' | 'review-needed' | 'risky';
}

/**
 * Individual removal action
 */
export interface RemovalAction {
  file: string;
  line: number;
  name: string;
  type: UnusedExportType;
  reason: string;
  autoExecutable: boolean;
}
