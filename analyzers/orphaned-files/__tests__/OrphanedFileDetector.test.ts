import { describe, it, expect, beforeEach } from 'vitest';
import { OrphanedFileDetector } from '../OrphanedFileDetector';
import { AnalysisConfig } from '../../config';
import * as path from 'path';

describe('OrphanedFileDetector', () => {
  let detector: OrphanedFileDetector;
  let config: AnalysisConfig;

  beforeEach(() => {
    detector = new OrphanedFileDetector();
    
    // Basic configuration for testing
    config = {
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.test.tsx'],
      entryPoints: ['index.tsx', 'App.tsx'],
      deadCode: {
        enabled: false,
        checkDynamicImports: true,
        confidenceThreshold: 'medium',
      },
      unusedImports: {
        enabled: false,
        autoFix: false,
        preserveTypeImports: true,
      },
      duplicates: {
        enabled: false,
        minLines: 5,
        minTokens: 50,
        similarityThreshold: 0.85,
      },
      orphanedFiles: {
        enabled: true,
        excludePatterns: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/vite.config.ts',
          '**/vitest.config.ts',
        ],
      },
      typeOptimization: {
        enabled: false,
        suggestCentralization: true,
      },
      serviceAnalysis: {
        enabled: false,
        checkIntegration: true,
      },
      flowValidation: {
        enabled: false,
        enforceReduxPatterns: true,
        enforceServiceLayer: true,
      },
      dependencies: {
        enabled: false,
        detectCircular: true,
        visualize: false,
      },
    };
  });

  it('should create detector instance', () => {
    expect(detector).toBeDefined();
    expect(detector.name).toBe('OrphanedFileDetector');
  });

  it('should return empty report when disabled', async () => {
    config.orphanedFiles.enabled = false;
    
    const report = await detector.analyze(config);
    
    expect(report.success).toBe(true);
    expect(report.orphanedFiles).toHaveLength(0);
    expect(report.summary.totalOrphaned).toBe(0);
  });

  it('should analyze project and find orphaned files', async () => {
    const report = await detector.analyze(config);
    
    expect(report.success).toBe(true);
    expect(report.analyzer).toBe('OrphanedFileDetector');
    expect(report.timestamp).toBeInstanceOf(Date);
    expect(report.dependencyGraph).toBeDefined();
    expect(report.dependencyGraph.totalNodes).toBeGreaterThan(0);
    expect(report.categorized).toBeDefined();
    expect(report.summary).toBeDefined();
  });

  it('should categorize orphaned files', async () => {
    const report = await detector.analyze(config);
    
    expect(report.categorized.safeToDelete).toBeDefined();
    expect(report.categorized.needsReview).toBeDefined();
    expect(report.categorized.keepForReference).toBeDefined();
    
    const totalCategorized = 
      report.categorized.safeToDelete.length +
      report.categorized.needsReview.length +
      report.categorized.keepForReference.length;
    
    expect(totalCategorized).toBe(report.summary.totalOrphaned);
  });

  it('should provide summary statistics', async () => {
    const report = await detector.analyze(config);
    
    expect(report.summary.totalOrphaned).toBeGreaterThanOrEqual(0);
    expect(report.summary.safeToDelete).toBeGreaterThanOrEqual(0);
    expect(report.summary.needsReview).toBeGreaterThanOrEqual(0);
    expect(report.summary.keepForReference).toBeGreaterThanOrEqual(0);
    expect(report.summary.estimatedSizeReduction).toBeGreaterThanOrEqual(0);
  });

  it('should include dependency graph information', async () => {
    const report = await detector.analyze(config);
    
    expect(report.dependencyGraph.totalNodes).toBeGreaterThan(0);
    expect(report.dependencyGraph.totalEdges).toBeGreaterThanOrEqual(0);
    expect(report.dependencyGraph.entryPoints).toBeInstanceOf(Array);
  });

  it('should provide file details for orphaned files', async () => {
    const report = await detector.analyze(config);
    
    if (report.orphanedFiles.length > 0) {
      const file = report.orphanedFiles[0];
      
      expect(file.path).toBeDefined();
      expect(file.fileType).toBeDefined();
      expect(file.lastModified).toBeInstanceOf(Date);
      expect(file.size).toBeGreaterThanOrEqual(0);
      expect(file.potentialReason).toBeDefined();
    }
  });
});
