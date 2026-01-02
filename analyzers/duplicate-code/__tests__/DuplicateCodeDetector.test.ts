import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicateCodeDetector } from '../DuplicateCodeDetector';
import { AnalysisConfig } from '../../config/AnalysisConfig';
import { CodeBlock, ImpactLevel, Priority } from '../types';

describe('DuplicateCodeDetector', () => {
  let detector: DuplicateCodeDetector;
  let config: AnalysisConfig;

  beforeEach(() => {
    detector = new DuplicateCodeDetector();
    
    config = {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
      entryPoints: ['src/index.tsx'],
      
      deadCode: {
        enabled: false,
        checkDynamicImports: false,
        confidenceThreshold: 'high',
      },
      
      unusedImports: {
        enabled: false,
        autoFix: false,
        preserveTypeImports: true,
      },
      
      duplicates: {
        enabled: true,
        minLines: 5,
        minTokens: 50,
        similarityThreshold: 0.85,
        ignorePatterns: [],
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

  describe('analyze', () => {
    it('should return empty report when duplicates analysis is disabled', async () => {
      config.duplicates.enabled = false;
      
      const report = await detector.analyze(config);
      
      expect(report.success).toBe(true);
      expect(report.duplicates).toHaveLength(0);
      expect(report.summary.totalDuplicates).toBe(0);
    });

    it('should return report with correct structure', async () => {
      const report = await detector.analyze(config);
      
      expect(report).toHaveProperty('analyzer');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('duration');
      expect(report).toHaveProperty('success');
      expect(report).toHaveProperty('duplicates');
      expect(report).toHaveProperty('config');
      expect(report).toHaveProperty('summary');
      
      expect(report.analyzer).toBe('DuplicateCodeDetector');
      expect(report.success).toBe(true);
    });

    it('should have valid summary statistics', async () => {
      const report = await detector.analyze(config);
      
      expect(report.summary).toHaveProperty('totalDuplicates');
      expect(report.summary).toHaveProperty('totalInstances');
      expect(report.summary).toHaveProperty('filesAffected');
      expect(report.summary).toHaveProperty('linesDuplicated');
      expect(report.summary).toHaveProperty('potentialLinesSaved');
      expect(report.summary).toHaveProperty('highImpactCount');
      
      expect(report.summary.totalDuplicates).toBeGreaterThanOrEqual(0);
      expect(report.summary.totalInstances).toBeGreaterThanOrEqual(0);
      expect(report.summary.filesAffected).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical token counts', () => {
      const block1: CodeBlock = {
        file: 'test1.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: 'const x = 1;',
        hash: 'hash1',
        tokens: 100,
      };
      
      const block2: CodeBlock = {
        file: 'test2.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: 'const x = 1;',
        hash: 'hash2',
        tokens: 100,
      };
      
      const similarity = detector.calculateSimilarity(block1, block2);
      
      expect(similarity).toBe(1.0);
    });

    it('should return 0 for blocks with zero tokens', () => {
      const block1: CodeBlock = {
        file: 'test1.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: '',
        hash: 'hash1',
        tokens: 0,
      };
      
      const block2: CodeBlock = {
        file: 'test2.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: 'const x = 1;',
        hash: 'hash2',
        tokens: 100,
      };
      
      const similarity = detector.calculateSimilarity(block1, block2);
      
      expect(similarity).toBe(0);
    });

    it('should return ratio for different token counts', () => {
      const block1: CodeBlock = {
        file: 'test1.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: 'const x = 1;',
        hash: 'hash1',
        tokens: 50,
      };
      
      const block2: CodeBlock = {
        file: 'test2.ts',
        line: 1,
        column: 0,
        endLine: 10,
        code: 'const x = 1; const y = 2;',
        hash: 'hash2',
        tokens: 100,
      };
      
      const similarity = detector.calculateSimilarity(block1, block2);
      
      expect(similarity).toBe(0.5);
    });
  });

  describe('duplicate groups', () => {
    it('should include refactoring suggestions for each group', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        expect(group.suggestedRefactoring).toBeDefined();
        expect(group.suggestedRefactoring).toHaveProperty('type');
        expect(group.suggestedRefactoring).toHaveProperty('targetLocation');
        expect(group.suggestedRefactoring).toHaveProperty('estimatedImpact');
        expect(group.suggestedRefactoring).toHaveProperty('priority');
        expect(group.suggestedRefactoring).toHaveProperty('description');
        expect(group.suggestedRefactoring).toHaveProperty('affectedFiles');
      }
    });

    it('should have valid impact levels', async () => {
      const report = await detector.analyze(config);
      const validImpacts: ImpactLevel[] = ['high', 'medium', 'low'];
      
      for (const group of report.duplicates) {
        expect(validImpacts).toContain(group.impact);
      }
    });

    it('should have valid priority levels', async () => {
      const report = await detector.analyze(config);
      const validPriorities: Priority[] = ['high', 'medium', 'low'];
      
      for (const group of report.duplicates) {
        expect(validPriorities).toContain(group.suggestedRefactoring.priority);
      }
    });

    it('should have at least 2 instances per group', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        expect(group.instances.length).toBeGreaterThanOrEqual(2);
        expect(group.occurrences).toBeGreaterThanOrEqual(2);
      }
    });

    it('should calculate estimated impact correctly', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        // Estimated impact should be positive for duplicates
        expect(group.suggestedRefactoring.estimatedImpact).toBeGreaterThanOrEqual(0);
        
        // Should be less than total lines (can't save more than exists)
        expect(group.suggestedRefactoring.estimatedImpact).toBeLessThanOrEqual(group.linesTotal);
      }
    });
  });

  describe('refactoring suggestions', () => {
    it('should suggest appropriate refactoring types', async () => {
      const report = await detector.analyze(config);
      const validTypes = ['extract-function', 'extract-utility', 'extract-hook', 'extract-component'];
      
      for (const group of report.duplicates) {
        expect(validTypes).toContain(group.suggestedRefactoring.type);
      }
    });

    it('should provide target locations', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        expect(group.suggestedRefactoring.targetLocation).toBeTruthy();
        expect(typeof group.suggestedRefactoring.targetLocation).toBe('string');
      }
    });

    it('should provide descriptions', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        expect(group.suggestedRefactoring.description).toBeTruthy();
        expect(typeof group.suggestedRefactoring.description).toBe('string');
        expect(group.suggestedRefactoring.description.length).toBeGreaterThan(0);
      }
    });

    it('should list affected files', async () => {
      const report = await detector.analyze(config);
      
      for (const group of report.duplicates) {
        expect(Array.isArray(group.suggestedRefactoring.affectedFiles)).toBe(true);
        expect(group.suggestedRefactoring.affectedFiles.length).toBeGreaterThan(0);
        
        // All affected files should be in the instances
        const instanceFiles = new Set(group.instances.map(i => i.file));
        for (const file of group.suggestedRefactoring.affectedFiles) {
          expect(instanceFiles.has(file)).toBe(true);
        }
      }
    });
  });

  describe('summary statistics', () => {
    it('should count high-impact duplicates correctly', async () => {
      const report = await detector.analyze(config);
      
      const actualHighImpact = report.duplicates.filter(d => d.impact === 'high').length;
      expect(report.summary.highImpactCount).toBe(actualHighImpact);
    });

    it('should count total instances correctly', async () => {
      const report = await detector.analyze(config);
      
      const actualInstances = report.duplicates.reduce((sum, g) => sum + g.occurrences, 0);
      expect(report.summary.totalInstances).toBe(actualInstances);
    });

    it('should count files affected correctly', async () => {
      const report = await detector.analyze(config);
      
      const filesSet = new Set<string>();
      for (const group of report.duplicates) {
        for (const instance of group.instances) {
          filesSet.add(instance.file);
        }
      }
      
      expect(report.summary.filesAffected).toBe(filesSet.size);
    });
  });
});
