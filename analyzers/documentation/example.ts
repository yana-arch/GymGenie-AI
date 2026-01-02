/**
 * Example: Documentation Generator Usage
 * Demonstrates how to generate comprehensive cleanup documentation
 */

import { DocumentationGenerator } from './DocumentationGenerator';
import type { DocumentationConfig } from './types';
import type { AnalysisReport } from '../types/AnalysisReport';
import type { CleanupPlan } from '../cleanup-plan/types';
import type { QualityMetrics } from '../quality-metrics/types';

async function generateCleanupDocumentation() {
  console.log('Generating cleanup documentation...\n');

  // Mock analysis report
  const analysisReport: AnalysisReport = {
    projectRoot: './src',
    timestamp: new Date(),
    deadCode: {
      unusedExports: [
        {
          file: 'src/utils/old-helper.ts',
          name: 'oldHelper',
          line: 10,
          type: 'function',
          exportType: 'named',
          potentialDynamicUsage: false,
        },
      ],
      unusedFunctions: [],
      unusedVariables: [],
      unusedTypes: [],
      confidence: 'high',
    },
    unusedImports: {
      files: [
        {
          file: 'src/components/Button.tsx',
          imports: [
            {
              file: 'src/components/Button.tsx',
              line: 2,
              importName: 'useMemo',
              importPath: 'react',
              isTypeOnly: false,
              isNamedImport: true,
              canAutoFix: true,
            },
          ],
        },
      ],
      totalUnused: 1,
    },
    duplicates: {
      groups: [],
      totalDuplicates: 0,
      estimatedSavings: 0,
    },
    orphanedFiles: {
      orphaned: [],
      categorized: {
        safeToDelete: [],
        needsReview: [],
        keepForReference: [],
      },
    },
    typeIssues: {
      duplicateTypes: [],
      unusedTypes: [],
      consolidationOpportunities: [],
    },
    serviceIntegration: {
      services: [],
      unusedServices: [],
      partiallyIntegrated: [],
      integrationIssues: [],
    },
    codeFlow: {
      violations: [],
      components: [],
    },
    dependencies: {
      graph: {
        nodes: new Map(),
        edges: new Map(),
        entryPoints: [],
      },
      circularDependencies: [],
      coupling: {
        tightlyCoupled: [],
        suggestions: [],
      },
    },
  };

  // Mock cleanup plan
  const cleanupPlan: CleanupPlan = {
    id: 'cleanup-001',
    createdAt: new Date(),
    analysisReport,
    actions: [
      {
        id: 'action-001',
        type: 'remove-dead-code',
        target: 'src/utils/old-helper.ts',
        description: 'Remove unused helper function',
        autoExecutable: true,
        requiresReview: false,
        estimatedImpact: 50,
        dependencies: [],
      },
      {
        id: 'action-002',
        type: 'remove-unused-import',
        target: 'src/components/Button.tsx',
        description: 'Remove unused useMemo import',
        autoExecutable: true,
        requiresReview: false,
        estimatedImpact: 1,
        dependencies: [],
      },
    ],
    estimatedImpact: {
      filesAffected: 2,
      linesRemoved: 51,
      bundleSizeReduction: 2048,
      estimatedTimeMinutes: 5,
    },
    safetyLevel: 'safe',
  };

  // Mock metrics
  const beforeMetrics: QualityMetrics = {
    timestamp: new Date(),
    coverage: {
      lines: 75,
      statements: 76,
      functions: 72,
      branches: 68,
    },
    complexity: {
      average: 8.5,
      max: 25,
      highComplexityFunctions: [
        {
          file: 'src/services/complex-service.ts',
          function: 'processData',
          complexity: 25,
          line: 45,
        },
      ],
    },
    maintainability: {
      index: 65,
      rating: 'B',
      issues: [
        {
          type: 'high-complexity',
          severity: 'warning',
          file: 'src/services/complex-service.ts',
          message: 'Function has high cyclomatic complexity',
        },
      ],
    },
    codeHealth: {
      score: 72,
      grade: 'B',
      factors: {
        coverage: 75,
        complexity: 70,
        maintainability: 65,
        duplication: 80,
      },
    },
  };

  const afterMetrics: QualityMetrics = {
    ...beforeMetrics,
    coverage: {
      lines: 80,
      statements: 81,
      functions: 78,
      branches: 72,
    },
    complexity: {
      average: 7.8,
      max: 22,
      highComplexityFunctions: [],
    },
    maintainability: {
      index: 75,
      rating: 'A',
      issues: [],
    },
    codeHealth: {
      score: 82,
      grade: 'A',
      factors: {
        coverage: 80,
        complexity: 78,
        maintainability: 75,
        duplication: 95,
      },
    },
  };

  // Configuration
  const config: DocumentationConfig = {
    outputDir: './docs/cleanup',
    includeCodeComparisons: true,
    includeDecisionRationale: true,
    includeMaintenanceChecklist: true,
    includeBestPractices: true,
    format: 'markdown',
  };

  // Generate documentation
  const generator = new DocumentationGenerator();
  const documentation = await generator.generateDocumentation(
    analysisReport,
    cleanupPlan,
    beforeMetrics,
    afterMetrics,
    config
  );

  console.log('Documentation Package Generated:');
  console.log('================================\n');

  // Display summary
  console.log('Cleanup Decisions Summary:');
  console.log(`- Total Actions: ${documentation.cleanupDecisions.summary.totalActions}`);
  console.log(`- Files Affected: ${documentation.cleanupDecisions.summary.estimatedImpact.filesAffected}`);
  console.log(`- Lines Removed: ${documentation.cleanupDecisions.summary.estimatedImpact.linesRemoved}`);
  console.log(`- Bundle Size Reduction: ${(documentation.cleanupDecisions.summary.estimatedImpact.bundleSizeReduction / 1024).toFixed(2)} KB\n`);

  console.log('Actions by Safety Level:');
  console.log(`- Safe: ${documentation.cleanupDecisions.summary.actionsBySafety.safe}`);
  console.log(`- Review Needed: ${documentation.cleanupDecisions.summary.actionsBySafety.reviewNeeded}`);
  console.log(`- Risky: ${documentation.cleanupDecisions.summary.actionsBySafety.risky}\n`);

  console.log('Maintenance Checklist:');
  console.log(`- Daily Tasks: ${documentation.maintenanceChecklist.daily.length}`);
  console.log(`- Weekly Tasks: ${documentation.maintenanceChecklist.weekly.length}`);
  console.log(`- Monthly Tasks: ${documentation.maintenanceChecklist.monthly.length}`);
  console.log(`- Quarterly Tasks: ${documentation.maintenanceChecklist.quarterly.length}\n`);

  console.log('Best Practices:');
  console.log(`- General Practices: ${documentation.bestPractices.general.length}`);
  console.log(`- Anti-Patterns: ${documentation.bestPractices.antiPatterns.length}`);
  console.log(`- Success Stories: ${documentation.bestPractices.successStories.length}\n`);

  // Export documentation
  const outputPath = await generator.exportDocumentation(documentation, config);
  console.log(`Documentation exported to: ${outputPath}`);

  // Display sample decision
  if (documentation.cleanupDecisions.decisions.length > 0) {
    const decision = documentation.cleanupDecisions.decisions[0];
    console.log('\nSample Decision:');
    console.log('================');
    console.log(`Action: ${decision.action.type}`);
    console.log(`Target: ${decision.action.target}`);
    console.log(`Rationale: ${decision.rationale}`);
    console.log(`Evidence Count: ${decision.evidence.length}`);
    console.log(`Risks Count: ${decision.risks.length}`);
    console.log(`Alternatives Count: ${decision.alternatives.length}`);
  }

  // Display sample maintenance task
  if (documentation.maintenanceChecklist.daily.length > 0) {
    const task = documentation.maintenanceChecklist.daily[0];
    console.log('\nSample Daily Task:');
    console.log('==================');
    console.log(`Task: ${task.task}`);
    console.log(`Rationale: ${task.rationale}`);
    console.log(`Estimated Time: ${task.estimatedTime}`);
    console.log(`Tools: ${task.tools.join(', ')}`);
  }

  // Display sample best practice
  if (documentation.bestPractices.general.length > 0) {
    const practice = documentation.bestPractices.general[0];
    console.log('\nSample Best Practice:');
    console.log('=====================');
    console.log(`Title: ${practice.title}`);
    console.log(`Description: ${practice.description}`);
    console.log(`Rationale: ${practice.rationale}`);
  }

  console.log('\n✅ Documentation generation complete!');
}

// Run example
if (require.main === module) {
  generateCleanupDocumentation().catch(console.error);
}

export { generateCleanupDocumentation };
