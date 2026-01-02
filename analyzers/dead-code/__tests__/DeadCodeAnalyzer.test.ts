import { describe, it, expect, beforeEach } from 'vitest';
import { DeadCodeAnalyzer } from '../DeadCodeAnalyzer';
import { AnalysisConfig } from '../../config/AnalysisConfig';

describe('DeadCodeAnalyzer', () => {
  let analyzer: DeadCodeAnalyzer;
  let config: AnalysisConfig;

  beforeEach(() => {
    analyzer = new DeadCodeAnalyzer();
    config = {
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules/**', 'dist/**'],
      entryPoints: ['index.tsx', 'App.tsx'],
      deadCode: {
        enabled: true,
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
        enabled: false,
        excludePatterns: [],
      },
      typeOptimization: {
        enabled: false,
        suggestCentralization: false,
      },
      serviceAnalysis: {
        enabled: false,
        checkIntegration: false,
      },
      flowValidation: {
        enabled: false,
        enforceReduxPatterns: false,
        enforceServiceLayer: false,
      },
      dependencies: {
        enabled: false,
        detectCircular: false,
        visualize: false,
      },
    };
  });

  it('should create analyzer instance', () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.name).toBe('DeadCodeAnalyzer');
  });

  it('should return empty report when dead code analysis is disabled', async () => {
    config.deadCode.enabled = false;
    const report = await analyzer.analyze(config);

    expect(report.success).toBe(true);
    expect(report.unusedExports).toHaveLength(0);
    expect(report.unusedFunctions).toHaveLength(0);
    expect(report.unusedVariables).toHaveLength(0);
    expect(report.unusedTypes).toHaveLength(0);
    expect(report.summary.totalUnusedExports).toBe(0);
  });

  it('should run analysis and return report structure', async () => {
    const report = await analyzer.analyze(config);

    expect(report).toBeDefined();
    expect(report.analyzer).toBe('DeadCodeAnalyzer');
    expect(report.timestamp).toBeInstanceOf(Date);
    expect(report.success).toBe(true);
    expect(report.confidence).toMatch(/^(high|medium|low)$/);
    expect(report.summary).toBeDefined();
    expect(report.unusedExports).toBeInstanceOf(Array);
    expect(report.unusedFunctions).toBeInstanceOf(Array);
    expect(report.unusedVariables).toBeInstanceOf(Array);
    expect(report.unusedTypes).toBeInstanceOf(Array);
  });

  it('should generate removal plan from report', async () => {
    const report = await analyzer.analyze(config);
    const plan = analyzer.generateRemovalPlan(report);

    expect(plan).toBeDefined();
    expect(plan.actions).toBeInstanceOf(Array);
    expect(plan.estimatedImpact).toBeDefined();
    expect(plan.estimatedImpact.filesAffected).toBeGreaterThanOrEqual(0);
    expect(plan.estimatedImpact.exportsRemoved).toBeGreaterThanOrEqual(0);
    expect(plan.safetyLevel).toMatch(/^(safe|review-needed|risky)$/);
  });

  it('should verify unused items', () => {
    const item = {
      file: 'test.ts',
      name: 'testFunction',
      line: 10,
      type: 'function',
    };

    const result = analyzer.verifyUnused(item);
    expect(typeof result).toBe('boolean');
  });
});
