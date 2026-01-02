import { AnalysisReport, FileType } from '../types';

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  nodes: Map<string, FileNode>;
  edges: Map<string, Set<string>>;
  entryPoints: string[];
}

/**
 * File node in dependency graph
 */
export interface FileNode {
  path: string;
  imports: string[];
  exports: string[];
  isEntryPoint: boolean;
  fileType: FileType;
}

/**
 * Orphaned file information
 */
export interface OrphanedFile {
  path: string;
  fileType: FileType;
  lastModified: Date;
  size: number;
  potentialReason: string;
}

/**
 * Categorized orphaned files
 */
export interface CategorizedOrphans {
  safeToDelete: OrphanedFile[];
  needsReview: OrphanedFile[];
  keepForReference: OrphanedFile[];
}

/**
 * Orphaned files analysis report
 */
export interface OrphanedFilesReport extends AnalysisReport {
  orphanedFiles: OrphanedFile[];
  categorized: CategorizedOrphans;
  dependencyGraph: {
    totalNodes: number;
    totalEdges: number;
    entryPoints: string[];
  };
  summary: {
    totalOrphaned: number;
    safeToDelete: number;
    needsReview: number;
    keepForReference: number;
    estimatedSizeReduction: number; // bytes
  };
}

/**
 * Import/Export information
 */
export interface ImportExportInfo {
  imports: ImportStatement[];
  exports: ExportStatement[];
}

/**
 * Import statement information
 */
export interface ImportStatement {
  source: string;
  resolvedPath: string | null;
  isTypeOnly: boolean;
  specifiers: string[];
}

/**
 * Export statement information
 */
export interface ExportStatement {
  name: string;
  isDefault: boolean;
  isTypeOnly: boolean;
}
