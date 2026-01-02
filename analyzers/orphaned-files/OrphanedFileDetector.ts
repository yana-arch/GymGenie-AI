import * as fs from 'fs';
import * as path from 'path';
import { BaseAnalyzer } from '../base/BaseAnalyzer';
import { AnalysisConfig } from '../config';
import { DependencyGraphBuilder } from './DependencyGraphBuilder';
import {
  OrphanedFilesReport,
  DependencyGraph,
  OrphanedFile,
  CategorizedOrphans,
  FileNode,
} from './types';
import { FileType } from '../types';
import { getRelativePath } from '../utils/fileUtils';

/**
 * Detects orphaned files that are not referenced anywhere in the codebase
 */
export class OrphanedFileDetector extends BaseAnalyzer<OrphanedFilesReport> {
  private graphBuilder: DependencyGraphBuilder;
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    super('OrphanedFileDetector');
    this.rootDir = rootDir;
    this.graphBuilder = new DependencyGraphBuilder(rootDir, this.logger);
  }

  /**
   * Run orphaned file analysis
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<OrphanedFilesReport> {
    this.validateConfig(config);

    if (!config.orphanedFiles.enabled) {
      this.logger.info('Orphaned files analysis is disabled');
      return this.createEmptyReport();
    }

    // Build dependency graph
    const graph = await this.graphBuilder.buildDependencyGraph(
      config.include,
      config.exclude,
      config.entryPoints
    );

    // Find orphaned files
    const orphanedFiles = this.findOrphanedFiles(graph, config.orphanedFiles.excludePatterns);

    // Categorize orphaned files
    const categorized = this.categorizeOrphans(orphanedFiles);

    // Calculate summary
    const summary = this.calculateSummary(categorized);

    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      orphanedFiles,
      categorized,
      dependencyGraph: {
        totalNodes: graph.nodes.size,
        totalEdges: this.countEdges(graph.edges),
        entryPoints: graph.entryPoints,
      },
      summary,
    };
  }

  /**
   * Find files that are not referenced anywhere
   */
  private findOrphanedFiles(
    graph: DependencyGraph,
    excludePatterns: string[]
  ): OrphanedFile[] {
    this.logger.info('Finding orphaned files...');

    const orphaned: OrphanedFile[] = [];
    const reachable = this.findReachableFiles(graph);

    for (const [filePath, node] of Array.from(graph.nodes.entries())) {
      // Skip if file is reachable from entry points
      if (reachable.has(filePath)) {
        continue;
      }

      // Skip if file matches exclusion patterns
      if (this.matchesExclusionPattern(filePath, excludePatterns)) {
        continue;
      }

      // Get file stats
      const absolutePath = path.resolve(this.rootDir, filePath);
      let stats: fs.Stats;
      
      try {
        stats = fs.statSync(absolutePath);
      } catch (error) {
        this.logger.warn(`Could not stat file: ${filePath}`);
        continue;
      }

      // Determine potential reason for being orphaned
      const potentialReason = this.determinePotentialReason(node, graph);

      orphaned.push({
        path: filePath,
        fileType: node.fileType,
        lastModified: stats.mtime,
        size: stats.size,
        potentialReason,
      });
    }

    this.logger.info(`Found ${orphaned.length} orphaned files`);

    return orphaned;
  }

  /**
   * Find all files reachable from entry points using BFS
   */
  private findReachableFiles(graph: DependencyGraph): Set<string> {
    const reachable = new Set<string>();
    const queue: string[] = [...graph.entryPoints];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (reachable.has(current)) {
        continue;
      }

      reachable.add(current);

      // Add all files that this file imports
      const edges = graph.edges.get(current);
      if (edges) {
        for (const imported of Array.from(edges)) {
          if (!reachable.has(imported)) {
            queue.push(imported);
          }
        }
      }

      // Also add files that import this file (reverse edges)
      for (const [file, imports] of Array.from(graph.edges.entries())) {
        if (imports.has(current) && !reachable.has(file)) {
          queue.push(file);
        }
      }
    }

    return reachable;
  }

  /**
   * Check if file path matches any exclusion pattern
   */
  private matchesExclusionPattern(filePath: string, patterns: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const pattern of patterns) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');

      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(normalizedPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine potential reason why file is orphaned
   */
  private determinePotentialReason(node: FileNode, graph: DependencyGraph): string {
    // Check if file has exports but no imports
    if (node.exports.length > 0 && node.imports.length === 0) {
      return 'Has exports but no imports - might be unused utility';
    }

    // Check if file only imports but doesn't export
    if (node.imports.length > 0 && node.exports.length === 0) {
      return 'Only imports, no exports - might be incomplete implementation';
    }

    // Check if file has no imports or exports
    if (node.imports.length === 0 && node.exports.length === 0) {
      return 'No imports or exports - standalone file or dead code';
    }

    // Check if all imports are external
    const hasInternalImports = node.imports.some(imp => graph.nodes.has(imp));
    if (!hasInternalImports) {
      return 'Only imports external modules - might be entry point candidate';
    }

    return 'Not reachable from any entry point';
  }

  /**
   * Categorize orphaned files by safety level
   */
  private categorizeOrphans(orphanedFiles: OrphanedFile[]): CategorizedOrphans {
    const safeToDelete: OrphanedFile[] = [];
    const needsReview: OrphanedFile[] = [];
    const keepForReference: OrphanedFile[] = [];

    for (const file of orphanedFiles) {
      const category = this.determineCategory(file);

      switch (category) {
        case 'safe':
          safeToDelete.push(file);
          break;
        case 'review':
          needsReview.push(file);
          break;
        case 'keep':
          keepForReference.push(file);
          break;
      }
    }

    return {
      safeToDelete,
      needsReview,
      keepForReference,
    };
  }

  /**
   * Determine category for orphaned file
   */
  private determineCategory(file: OrphanedFile): 'safe' | 'review' | 'keep' {
    // Keep config files for reference
    if (file.fileType === 'config') {
      return 'keep';
    }

    // Keep test files for review (might be for future features)
    if (file.fileType === 'test') {
      return 'review';
    }

    // Recently modified files need review
    const daysSinceModified = (Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 30) {
      return 'review';
    }

    // Large files need review
    if (file.size > 10000) { // > 10KB
      return 'review';
    }

    // Type files are usually safe to delete if orphaned
    if (file.fileType === 'type') {
      return 'safe';
    }

    // Small, old utility files are safe to delete
    if (file.fileType === 'utility' && file.size < 5000 && daysSinceModified > 90) {
      return 'safe';
    }

    // Default to review
    return 'review';
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(categorized: CategorizedOrphans) {
    const totalOrphaned = 
      categorized.safeToDelete.length +
      categorized.needsReview.length +
      categorized.keepForReference.length;

    const estimatedSizeReduction = categorized.safeToDelete.reduce(
      (sum, file) => sum + file.size,
      0
    );

    return {
      totalOrphaned,
      safeToDelete: categorized.safeToDelete.length,
      needsReview: categorized.needsReview.length,
      keepForReference: categorized.keepForReference.length,
      estimatedSizeReduction,
    };
  }

  /**
   * Count total edges in graph
   */
  private countEdges(edges: Map<string, Set<string>>): number {
    let count = 0;
    for (const edgeSet of Array.from(edges.values())) {
      count += edgeSet.size;
    }
    return count;
  }

  /**
   * Create empty report when analysis is disabled
   */
  private createEmptyReport(): OrphanedFilesReport {
    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      orphanedFiles: [],
      categorized: {
        safeToDelete: [],
        needsReview: [],
        keepForReference: [],
      },
      dependencyGraph: {
        totalNodes: 0,
        totalEdges: 0,
        entryPoints: [],
      },
      summary: {
        totalOrphaned: 0,
        safeToDelete: 0,
        needsReview: 0,
        keepForReference: 0,
        estimatedSizeReduction: 0,
      },
    };
  }
}
