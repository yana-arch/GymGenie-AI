import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  BundleSizeReport,
  BundleChunk,
  BundleContributor,
  BundleSuggestion,
  TreeShakingReport,
  BundleSizeOptions,
  BundleComparison,
  BundleModule,
} from './types';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Analyzes bundle size and provides optimization suggestions
 */
export class BundleSizeAnalyzer {
  /**
   * Analyze bundle size
   */
  async analyze(options: BundleSizeOptions = {}): Promise<BundleSizeReport> {
    logger.info('Analyzing bundle size...');

    const buildCommand = options.buildCommand || 'npm run build';
    const outputDir = options.outputDir || 'dist';
    const minSizeThreshold = options.minSizeThreshold || 10000; // 10KB
    const topContributorsCount = options.topContributorsCount || 10;

    // Run build if needed
    try {
      logger.info(`Running build command: ${buildCommand}`);
      await execAsync(buildCommand, { timeout: 300000 }); // 5 minutes timeout
    } catch (error) {
      logger.warn(`Build command failed: ${error}`);
      // Continue with analysis of existing build
    }

    // Analyze build output
    const chunks = await this.analyzeChunks(outputDir, minSizeThreshold);
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce(
      (sum, chunk) => sum + chunk.gzippedSize,
      0
    );

    // Identify largest contributors
    const largestContributors = this.identifyLargestContributors(
      chunks,
      topContributorsCount
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(chunks, largestContributors);

    // Analyze tree shaking effectiveness
    const treeShakingEffectiveness = this.analyzeTreeShaking(chunks);

    const report: BundleSizeReport = {
      timestamp: new Date(),
      totalSize,
      gzippedSize,
      chunks,
      largestContributors,
      suggestions,
      treeShakingEffectiveness,
    };

    logger.info(
      `Bundle analysis complete: ${this.formatSize(totalSize)} (${this.formatSize(gzippedSize)} gzipped)`
    );

    return report;
  }

  /**
   * Compare bundle sizes before and after optimization
   */
  compareBundles(
    before: BundleSizeReport,
    after: BundleSizeReport
  ): BundleComparison {
    const totalSizeReduction = before.totalSize - after.totalSize;
    const gzippedSizeReduction = before.gzippedSize - after.gzippedSize;
    const percentageReduction =
      (totalSizeReduction / before.totalSize) * 100;
    const chunksRemoved = before.chunks.length - after.chunks.length;

    const summary = this.generateComparisonSummary(
      totalSizeReduction,
      gzippedSizeReduction,
      percentageReduction
    );

    return {
      before,
      after,
      improvements: {
        totalSizeReduction,
        gzippedSizeReduction,
        percentageReduction,
        chunksRemoved,
        summary,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Analyze chunks in build output
   */
  private async analyzeChunks(
    outputDir: string,
    minSizeThreshold: number
  ): Promise<BundleChunk[]> {
    const chunks: BundleChunk[] = [];

    try {
      const files = await this.getJavaScriptFiles(outputDir);

      for (const file of files) {
        const stats = await fs.stat(file);
        
        if (stats.size < minSizeThreshold) {
          continue;
        }

        const content = await fs.readFile(file, 'utf-8');
        const modules = this.extractModules(content);
        const chunkType = this.determineChunkType(file, content);

        // Estimate gzipped size (rough approximation: 30% of original)
        const gzippedSize = Math.round(stats.size * 0.3);

        chunks.push({
          name: path.basename(file),
          size: stats.size,
          gzippedSize,
          modules,
          type: chunkType,
        });
      }
    } catch (error) {
      logger.warn(`Could not analyze chunks: ${error}`);
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  /**
   * Get all JavaScript files in directory
   */
  private async getJavaScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getJavaScriptFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  /**
   * Extract modules from chunk content
   */
  private extractModules(content: string): BundleModule[] {
    const modules: BundleModule[] = [];

    // Simple heuristic: look for module patterns
    // In a real implementation, use a proper bundle analyzer like webpack-bundle-analyzer

    // Look for import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Create a module entry (simplified)
    if (imports.length > 0) {
      modules.push({
        name: 'main',
        size: content.length,
        imports: [...new Set(imports)],
        isTreeShakeable: this.isTreeShakeable(content),
      });
    }

    return modules;
  }

  /**
   * Determine chunk type
   */
  private determineChunkType(
    filePath: string,
    content: string
  ): 'entry' | 'vendor' | 'async' | 'shared' {
    const fileName = path.basename(filePath);

    if (fileName.includes('vendor') || fileName.includes('node_modules')) {
      return 'vendor';
    }
    if (fileName.includes('async') || fileName.includes('lazy')) {
      return 'async';
    }
    if (fileName.includes('shared') || fileName.includes('common')) {
      return 'shared';
    }
    if (fileName.includes('index') || fileName.includes('main')) {
      return 'entry';
    }

    return 'shared';
  }

  /**
   * Check if code is tree-shakeable
   */
  private isTreeShakeable(content: string): boolean {
    // Simple heuristic: ES modules are tree-shakeable
    return content.includes('export') && !content.includes('module.exports');
  }

  /**
   * Identify largest contributors to bundle size
   */
  private identifyLargestContributors(
    chunks: BundleChunk[],
    count: number
  ): BundleContributor[] {
    const contributors: BundleContributor[] = [];
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

    for (const chunk of chunks.slice(0, count)) {
      const percentage = (chunk.size / totalSize) * 100;

      contributors.push({
        name: chunk.name,
        size: chunk.size,
        percentage,
        type: chunk.type === 'vendor' ? 'package' : 'module',
        suggestion: this.getSuggestionForContributor(chunk, percentage),
      });
    }

    return contributors;
  }

  /**
   * Get suggestion for a contributor
   */
  private getSuggestionForContributor(
    chunk: BundleChunk,
    percentage: number
  ): string {
    if (percentage > 30) {
      return 'Critical: Consider code splitting or lazy loading';
    } else if (percentage > 20) {
      return 'High: Split into smaller chunks';
    } else if (percentage > 10) {
      return 'Medium: Consider optimization';
    }
    return 'Acceptable size';
  }

  /**
   * Generate optimization suggestions
   */
  private generateSuggestions(
    chunks: BundleChunk[],
    contributors: BundleContributor[]
  ): BundleSuggestion[] {
    const suggestions: BundleSuggestion[] = [];

    // Suggest code splitting for large chunks
    const largeChunks = chunks.filter((c) => c.size > 500000); // 500KB
    if (largeChunks.length > 0) {
      suggestions.push({
        type: 'code-splitting',
        priority: 'high',
        description: `Split ${largeChunks.length} large chunks into smaller pieces`,
        estimatedSavings: largeChunks.reduce((sum, c) => sum + c.size * 0.3, 0),
        modules: largeChunks.map((c) => c.name),
        action: 'Use dynamic imports or route-based code splitting',
      });
    }

    // Suggest dynamic imports for async chunks
    const syncChunks = chunks.filter(
      (c) => c.type !== 'async' && c.size > 100000
    );
    if (syncChunks.length > 0) {
      suggestions.push({
        type: 'dynamic-import',
        priority: 'medium',
        description: `Convert ${syncChunks.length} synchronous imports to dynamic imports`,
        estimatedSavings: syncChunks.reduce((sum, c) => sum + c.size * 0.5, 0),
        modules: syncChunks.map((c) => c.name),
        action: 'Use import() for non-critical modules',
      });
    }

    // Suggest tree shaking improvements
    const nonTreeShakeableModules = chunks.flatMap((c) =>
      c.modules.filter((m) => !m.isTreeShakeable)
    );
    if (nonTreeShakeableModules.length > 0) {
      suggestions.push({
        type: 'tree-shaking',
        priority: 'medium',
        description: `Improve tree shaking for ${nonTreeShakeableModules.length} modules`,
        estimatedSavings: nonTreeShakeableModules.reduce(
          (sum, m) => sum + m.size * 0.2,
          0
        ),
        action: 'Convert to ES modules and use named exports',
      });
    }

    // Suggest lazy loading for large vendor chunks
    const vendorChunks = chunks.filter(
      (c) => c.type === 'vendor' && c.size > 200000
    );
    if (vendorChunks.length > 0) {
      suggestions.push({
        type: 'lazy-load',
        priority: 'high',
        description: `Lazy load ${vendorChunks.length} large vendor libraries`,
        estimatedSavings: vendorChunks.reduce((sum, c) => sum + c.size * 0.4, 0),
        modules: vendorChunks.map((c) => c.name),
        action: 'Load vendor libraries on demand',
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Analyze tree shaking effectiveness
   */
  private analyzeTreeShaking(chunks: BundleChunk[]): TreeShakingReport {
    const allModules = chunks.flatMap((c) => c.modules);
    const nonTreeShakeableModules = allModules.filter((m) => !m.isTreeShakeable);
    const unusedExports = nonTreeShakeableModules.length;
    const potentialSavings = nonTreeShakeableModules.reduce(
      (sum, m) => sum + m.size * 0.2,
      0
    );

    const issues = nonTreeShakeableModules.slice(0, 5).map((module) => ({
      module: module.name,
      reason: 'Not using ES modules',
      impact: Math.round(module.size * 0.2),
      suggestion: 'Convert to ES modules with named exports',
    }));

    return {
      isEffective: unusedExports < allModules.length * 0.1,
      unusedExports,
      potentialSavings,
      issues,
    };
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(
    totalReduction: number,
    gzippedReduction: number,
    percentageReduction: number
  ): string {
    if (totalReduction <= 0) {
      return 'No size reduction achieved';
    }

    return `Bundle size reduced by ${this.formatSize(totalReduction)} (${percentageReduction.toFixed(1)}%), ` +
      `gzipped size reduced by ${this.formatSize(gzippedReduction)}`;
  }

  /**
   * Format size in human-readable format
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}
