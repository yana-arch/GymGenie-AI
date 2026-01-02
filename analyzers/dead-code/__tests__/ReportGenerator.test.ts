import { describe, it, expect, beforeEach } from 'vitest';
import { DeadCodeReportGenerator } from '../ReportGenerator';
import { DeadCodeReport } from '../types';

describe('DeadCodeReportGenerator', () => {
  let generator: DeadCodeReportGenerator;
  let mockReport: DeadCodeReport;

  beforeEach(() => {
    generator = new DeadCodeReportGenerator();
    mockReport = {
      analyzer: 'DeadCodeAnalyzer',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      duration: 1000,
      success: true,
      unusedExports: [
        {
          file: 'src/utils/helper.ts',
          name: 'unusedHelper',
          line: 10,
          column: 5,
          type: 'function',
          exportType: 'named',
          potentialDynamicUsage: false,
        },
      ],
      unusedFunctions: [],
      unusedVariables: [],
      unusedTypes: [
        {
          file: 'src/types/index.ts',
          name: 'UnusedType',
          line: 20,
          column: 0,
          kind: 'type',
          isExported: true,
        },
      ],
      confidence: 'high',
      summary: {
        totalUnusedExports: 1,
        totalUnusedFunctions: 0,
        totalUnusedVariables: 0,
        totalUnusedTypes: 1,
        filesAffected: 2,
      },
    };
  });

  it('should create generator instance', () => {
    expect(generator).toBeDefined();
  });

  it('should generate JSON report', () => {
    const json = generator.generate(mockReport, { format: 'json' });

    expect(json).toBeDefined();
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.analyzer).toBe('DeadCodeAnalyzer');
    expect(parsed.summary.totalUnusedExports).toBe(1);
  });

  it('should generate simplified JSON report', () => {
    const json = generator.generate(mockReport, {
      format: 'json',
      includeDetails: false,
    });

    const parsed = JSON.parse(json);
    expect(parsed.summary).toBeDefined();
    expect(parsed.confidence).toBe('high');
    expect(parsed.unusedExports).toBeUndefined();
  });

  it('should generate HTML report', () => {
    const html = generator.generate(mockReport, { format: 'html' });

    expect(html).toBeDefined();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Dead Code Analysis Report');
    expect(html).toContain('unusedHelper');
    expect(html).toContain('UnusedType');
  });

  it('should generate Markdown report', () => {
    const markdown = generator.generate(mockReport, { format: 'markdown' });

    expect(markdown).toBeDefined();
    expect(markdown).toContain('# Dead Code Analysis Report');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('unusedHelper');
    expect(markdown).toContain('UnusedType');
  });

  it('should generate grouped by file report', () => {
    const html = generator.generate(mockReport, {
      format: 'html',
      groupByFile: true,
    });

    expect(html).toContain('Issues by File');
    expect(html).toContain('src/utils/helper.ts');
    expect(html).toContain('src/types/index.ts');
  });

  it('should handle empty report', () => {
    const emptyReport: DeadCodeReport = {
      analyzer: 'DeadCodeAnalyzer',
      timestamp: new Date(),
      duration: 0,
      success: true,
      unusedExports: [],
      unusedFunctions: [],
      unusedVariables: [],
      unusedTypes: [],
      confidence: 'high',
      summary: {
        totalUnusedExports: 0,
        totalUnusedFunctions: 0,
        totalUnusedVariables: 0,
        totalUnusedTypes: 0,
        filesAffected: 0,
      },
    };

    const json = generator.generate(emptyReport, { format: 'json' });
    expect(json).toBeDefined();

    const html = generator.generate(emptyReport, { format: 'html' });
    expect(html).toContain('Dead Code Analysis Report');

    const markdown = generator.generate(emptyReport, { format: 'markdown' });
    expect(markdown).toContain('# Dead Code Analysis Report');
  });
});
