import { AnalysisReport, FileLocation } from '../types';

/**
 * Type location information
 */
export interface TypeLocation {
  file: string;
  line: number;
  isExported: boolean;
}

/**
 * Duplicate type definition
 */
export interface DuplicateType {
  name: string;
  locations: TypeLocation[];
  definition: string;
  canMerge: boolean;
}

/**
 * Unused type information
 */
export interface UnusedType {
  name: string;
  file: string;
  line: number;
  isExported: boolean;
}

/**
 * Type consolidation opportunity
 */
export interface TypeConsolidation {
  types: string[];
  suggestedName: string;
  targetFile: string;
  affectedFiles: string[];
}

/**
 * Import update information
 */
export interface ImportUpdate {
  file: string;
  oldImport: string;
  newImport: string;
}

/**
 * Type migration information
 */
export interface TypeMigration {
  fromFile: string;
  toFile: string;
  types: string[];
  updateImports: ImportUpdate[];
}

/**
 * Type centralization plan
 */
export interface CentralizationPlan {
  commonTypes: string[];
  targetFile: string;
  migrations: TypeMigration[];
}

/**
 * Type system analysis report
 */
export interface TypeSystemReport extends AnalysisReport {
  duplicateTypes: DuplicateType[];
  unusedTypes: UnusedType[];
  consolidationOpportunities: TypeConsolidation[];
  centralizationPlan: CentralizationPlan | null;
  totalTypesAnalyzed: number;
  duplicateCount: number;
  unusedCount: number;
}
