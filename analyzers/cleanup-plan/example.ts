import { CleanupPlanGenerator } from './CleanupPlanGenerator';
import { ComprehensiveAnalysisReport } from './types';
import { DeadCodeReport } from '../dead-code/types';
import { DuplicateCodeReport } from '../duplicate-code/types';
import { OrphanedFilesReport } from '../orphaned-files/types';

/**
 * Example: Generate a cleanup plan from analysis reports
 */
async function generateCleanupPlanExample() {
  // Create sample analysis reports
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
        potentialDynamicUsage: true,
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
          {
            file: 'src/components/AdminCard.tsx',
            line: 25,
            endLine: 40,
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
          estimatedImpact: 45,
          priority: 'high',
          description: 'Extract common card rendering logic',
          affectedFiles: [
            'src/components/UserCard.tsx',
            'src/components/ProfileCard.tsx',
            'src/components/AdminCard.tsx',
          ],
        },
        linesTotal: 45,
        occurrences: 3,
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
      totalInstances: 3,
      filesAffected: 3,
      linesDuplicated: 45,
      potentialLinesSaved: 30,
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
      {
        path: 'src/utils/deprecated.ts',
        fileType: 'utility',
        lastModified: new Date('2024-03-15'),
        size: 1200,
        potentialReason: 'Marked as deprecated',
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
      needsReview: [
        {
          path: 'src/utils/deprecated.ts',
          fileType: 'utility',
          lastModified: new Date('2024-03-15'),
          size: 1200,
          potentialReason: 'Marked as deprecated',
        },
      ],
      keepForReference: [],
    },
    dependencyGraph: {
      totalNodes: 150,
      totalEdges: 320,
      entryPoints: ['src/index.tsx', 'src/App.tsx'],
    },
    summary: {
      totalOrphaned: 2,
      safeToDelete: 1,
      needsReview: 1,
      keepForReference: 0,
      estimatedSizeReduction: 3700,
    },
  };

  // Create comprehensive analysis report
  const analysisReport: ComprehensiveAnalysisReport = {
    deadCode: deadCodeReport,
    duplicates: duplicateReport,
    orphanedFiles: orphanedFilesReport,
  };

  // Create generator
  const generator = new CleanupPlanGenerator();

  // Example 1: Generate safe-only plan
  console.log('=== Example 1: Safe-only cleanup plan ===');
  const safePlan = await generator.generatePlan(analysisReport, {
    safeOnly: true,
    minConfidence: 'high',
    includeReviewRequired: false,
  });

  console.log(`Plan ID: ${safePlan.id}`);
  console.log(`Safety Level: ${safePlan.safetyLevel}`);
  console.log(`Total Actions: ${safePlan.actions.length}`);
  console.log(`Files Affected: ${safePlan.estimatedImpact.filesAffected}`);
  console.log(`Lines Removed: ${safePlan.estimatedImpact.linesRemoved}`);
  console.log(
    `Bundle Size Reduction: ${safePlan.estimatedImpact.bundleSizeReduction} bytes`
  );
  console.log(
    `Estimated Time: ${safePlan.estimatedImpact.estimatedTimeMinutes} minutes`
  );
  console.log('\nActions:');
  safePlan.actions.forEach((action, index) => {
    console.log(`  ${index + 1}. [${action.type}] ${action.description}`);
    console.log(
      `     Auto-executable: ${action.autoExecutable}, Requires Review: ${action.requiresReview}`
    );
  });

  // Example 2: Generate comprehensive plan with review items
  console.log('\n=== Example 2: Comprehensive cleanup plan ===');
  const comprehensivePlan = await generator.generatePlan(analysisReport, {
    prioritizeHighImpact: true,
    includeReviewRequired: true,
  });

  console.log(`Plan ID: ${comprehensivePlan.id}`);
  console.log(`Safety Level: ${comprehensivePlan.safetyLevel}`);
  console.log(`Total Actions: ${comprehensivePlan.actions.length}`);
  console.log(
    `Files Affected: ${comprehensivePlan.estimatedImpact.filesAffected}`
  );
  console.log(
    `Lines Removed: ${comprehensivePlan.estimatedImpact.linesRemoved}`
  );
  console.log(
    `Bundle Size Reduction: ${comprehensivePlan.estimatedImpact.bundleSizeReduction} bytes`
  );
  console.log(
    `Estimated Time: ${comprehensivePlan.estimatedImpact.estimatedTimeMinutes} minutes`
  );
  console.log('\nActions:');
  comprehensivePlan.actions.forEach((action, index) => {
    console.log(`  ${index + 1}. [${action.type}] ${action.description}`);
    console.log(
      `     Auto-executable: ${action.autoExecutable}, Requires Review: ${action.requiresReview}`
    );
    console.log(`     Estimated Impact: ${action.estimatedImpact} lines`);
    if (action.dependencies.length > 0) {
      console.log(`     Dependencies: ${action.dependencies.join(', ')}`);
    }
  });

  // Example 3: High-impact only plan
  console.log('\n=== Example 3: High-impact only plan ===');
  const highImpactPlan = await generator.generatePlan(analysisReport, {
    prioritizeHighImpact: true,
    includeReviewRequired: true,
    maxActions: 5,
  });

  console.log(`Plan ID: ${highImpactPlan.id}`);
  console.log(`Safety Level: ${highImpactPlan.safetyLevel}`);
  console.log(`Total Actions: ${highImpactPlan.actions.length}`);
  console.log(
    `Estimated Impact: ${highImpactPlan.estimatedImpact.linesRemoved} lines removed`
  );
}

// Run example
if (require.main === module) {
  generateCleanupPlanExample().catch(console.error);
}

export { generateCleanupPlanExample };
