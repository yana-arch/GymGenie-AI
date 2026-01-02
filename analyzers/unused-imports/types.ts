import { AnalysisReport } from '../types';

/**
 * Import category classification
 */
export type ImportCategory = 'value' | 'type' | 'both' | 'side-effect';

/**
 * Unused import information
 */
export interface UnusedImport {
  file: string;
  line: number;
  column: number;
  importName: string;
  importPath: string;
  isTypeOnly: boolean;
  isNamedImport: boolean;
  canAutoFix: boolean;
  category: ImportCategory;
}

/**
 * Unused imports analysis report
 */
export interface UnusedImportsReport extends AnalysisReport {
  unusedImports: UnusedImport[];
  summary: {
    totalUnusedImports: number;
    filesAffected: number;
    autoFixable: number;
    typeOnlyImports: number;
  };
}

/**
 * Auto-fix result
 */
export interface AutoFixResult {
  file: string;
  success: boolean;
  importsRemoved: number;
  error?: string;
}
