import { ReportGenerator } from './ReportGenerator';
import { ComprehensiveAnalysisReport } from '../cleanup-plan/types';
import { CleanupExecutionResult } from '../cleanup-executor/types';
import { DeadCodeReport } from '../dead-code/types';
import { DuplicateCodeReport } from '../duplicate-code/types';
import { OrphanedFilesReport } from '../orphaned-files/types';

/**
 * Example: Generate reports in multiple formats
 */
async function generateReportsExample() {
  // Create sample analysis report
  const deadCodeReport: DeadCodeReport = {
    analyzer: 'dead-code',
    timestamp: new Date(),
    duration: 5000,
    success: true,
    unusedExports: [
      {
        file: 'src/utils/helpers.ts',
        line: 42,
        name: 'formatDate',
        type: 'function',
        exportType: 'named',
        potentialDynamicUsage: false,
      },
      {
        file: 'src/components/OldButton.tsx',
        line: 10,
        name: 'OldButton',
        type: 'class',
        exportType: 'default',
        potentialDynamicUsage: false,
      },
    ],
    unusedFunctions: [],
    unusedVariables: [],
    unusedTypes: [],
    confidence: 'high',
    summary: {
      totalUnusedExports: 2,
      totalUnusedFunctions: 0,
      totalUnusedVariables: 0,
      totalUnusedTypes: 0,
      filesAffected: 2,
    },
  };

  const duplicateReport: DuplicateCodeReport = {
    analyzer: 'duplicate-code',
    timestamp: new Date(),
    duration: 8000,
    success: true,
    duplicates: [
      {
        id: 'dup-1',
        instances: [
          {
            file: 'src/components/UserCard.tsx',
            line: 20,
            endLine: 35,
            code: '// duplicate code...',
            hash: 'abc123',
            tokens: 150,
          },
          {
            file: 'src/components/ProfileCard.tsx',
            line: 15,
            endLine: 30,
            code: '// duplicate code...',
            hash: 'abc123',
            tokens: 150,
          },
        ],
        similarity: 0.95,
        impact: 'high',
        suggestedRefactoring: {
          type: 'extract-component',
          targetLocation: 'src/components/shared/BaseCard.tsx',
          estimatedImpact: 30,
          priority: 'high',
          description: 'Extract common card rendering logic',
          affectedFiles: [
            'src/components/UserCard.tsx',
            'src/components/ProfileCard.tsx',
          ],
        },
        linesTotal: 30,
        occurrences: 2,
      },
    ],
    config: {
      minLines: 5,
      minTokens: 50,
      similarityThreshold: 0.8,
      ignorePatterns: ['**/*.test.ts'],
    },
    summary: {
      totalDuplicates: 1,
      totalInstances: 2,
      filesAffected: 2,
      linesDuplicated: 30,
      potentialLinesSaved: 15,
      highImpactCount: 1,
    },
  };

  const orphanedFilesReport: OrphanedFilesReport = {
    analyzer: 'orphaned-files',
    timestamp: new Date(),
    duration: 3000,
    success: true,
    orphanedFiles: [
      {
        path: 'src/legacy/OldComponent.tsx',
        fileType: 'component',
        lastModified: new Date('2024-01-01'),
        size: 2500,
        potentialReason: 'Not imported anywhere',
      },
    ],
    categorized: {
      safeToDelete: [
        {
          path: 'src/legacy/OldComponent.tsx',
          fileType: 'component',
          lastModified: new Date('2024-01-01'),
          size: 2500,
          potentialReason: 'Not imported anywhere',
        },
      ],
      needsReview: [],
      keepForReference: [],
    },
    dependencyGraph: {
      totalNodes: 150,
      totalEdges: 320,
      entryPoints: ['src/index.tsx', 'src/App.tsx'],
    },
    summary: {
      totalOrphaned: 1,
      safeToDelete: 1,
      needsReview: 0,
      keepForReference: 0,
      estimatedSizeReduction: 2500,
    },
  };

  const analysisReport: ComprehensiveAnalysisReport = {
    deadCode: deadCodeReport,
    duplicates: duplicateReport,
    orphanedFiles: orphanedFilesReport,
  };

  // Sample execution result
  const executionResult: CleanupExecutionResult = {
    planId: 'plan-123',
    startTime: new Date(),
    endTime: new Date(),
    duration: 5000,
    totalActions: 4,
    successfulActions: 3,
    failedActions: 0,
    skippedActions: 1,
    results: [],
    testsRun: true,
    testsPassed: true,
  };

  const generator = new ReportGenerator();

  // Example 1: Generate JSON report
  console.log('=== Example 1: JSON Report ===');
  const jsonReport = await generator.generateReport(
    analysisReport,
    executionResult,
    {
      format: 'json',
      outputPath: 'reports/cleanup-report.json',
      projectName: 'GymGenie AI',
    }
  );
  console.log('JSON report generated');
  console.log(`Length: ${jsonReport.length} characters`);
  console.log('');

  // Example 2: Generate Markdown report
  console.log('=== Example 2: Markdown Report ===');
  const markdownReport = await generator.generateReport(
    analysisReport,
    executionResult,
    {
      format: 'markdown',
      outputPath: 'reports/cleanup-report.md',
      projectName: 'GymGenie AI',
      title: 'Code Cleanup Analysis Report',
      includeDetails: true,
    }
  );
  console.log('Markdown report generated');
  console.log('Preview:');
  console.log(markdownReport.substring(0, 500) + '...');
  console.log('');

  // Example 3: Generate HTML report
  console.log('=== Example 3: HTML Report ===');
  const htmlReport = await generator.generateReport(
    analysisReport,
    executionResult,
    {
      format: 'html',
      outputPath: 'reports/cleanup-report.html',
      projectName: 'GymGenie AI',
      title: 'Code Cleanup Analysis Report',
      includeVisualizations: true,
    }
  );
  console.log('HTML report generated');
  console.log(`Length: ${htmlReport.length} characters`);
  console.log('');

  // Example 4: Generate report without execution results
  console.log('=== Example 4: Analysis-Only Report ===');
  const analysisOnlyReport = await generator.generateReport(
    analysisReport,
    undefined,
    {
      format: 'markdown',
      outputPath: 'reports/analysis-only.md',
      projectName: 'GymGenie AI',
      includeDetails: true,
    }
  );
  console.log('Analysis-only report generated');
  console.log('');

  // Example 5: Generate multiple formats
  console.log('=== Example 5: Generate All Formats ===');
  const formats: Array<'json' | 'html' | 'markdown'> = [
    'json',
    'html',
    'markdown',
  ];

  for (const format of formats) {
    await generator.generateReport(analysisReport, executionResult, {
      format,
      outputPath: `reports/cleanup-report.${format === 'markdown' ? 'md' : format}`,
      projectName: 'GymGenie AI',
      includeDetails: true,
      includeVisualizations: format === 'html',
    });
    console.log(`${format.toUpperCase()} report generated`);
  }
  console.log('');

  console.log('All reports generated successfully!');
}

// Run example
if (require.main === module) {
  generateReportsExample().catch(console.error);
}

export { generateReportsExample };
