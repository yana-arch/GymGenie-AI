/**
 * Run Full Analysis on GymGenie AI Codebase
 * Task 27.1: Execute complete analysis pipeline
 */

import { AnalysisPipeline } from '../analyzers/pipeline';
import { CleanupPlanGenerator } from '../analyzers/cleanup-plan';
import { ReportGenerator } from '../analyzers/report-generator';
import { QualityMetricsCalculator } from '../analyzers/quality-metrics';
import { DocumentationGenerator } from '../analyzers/documentation';
import { ConfigParser } from '../analyzers/config';
import { CacheManager } from '../analyzers/cache';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runFullAnalysis() {
  console.log('🔍 Starting Full Analysis on GymGenie AI Codebase');
  console.log('=' .repeat(60));
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1: Load Configuration
    console.log('📋 Step 1: Loading configuration...');
    const configParser = new ConfigParser();
    const config = await configParser.loadConfig('.kiro/specs/code-cleanup-refactoring/config.json');
    console.log('✅ Configuration loaded\n');

    // Step 2: Initialize Cache
    console.log('💾 Step 2: Initializing cache...');
    const cache = new CacheManager({
      cacheDir: '.cache/analysis',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      enabled: true,
      maxSize: 100 * 1024 * 1024, // 100 MB
      invalidationStrategy: 'file-change',
    });
    await cache.initialize();
    const cacheStats = await cache.getStats();
    console.log(`✅ Cache initialized (Hit rate: ${cacheStats.hitRate.toFixed(2)}%)\n`);

    // Step 3: Run Analysis Pipeline
    console.log('🔬 Step 3: Running analysis pipeline...');
    const pipeline = new AnalysisPipeline();
    
    const analysisResult = await pipeline.execute({
      config,
      parallel: true,
      onProgress: (progress) => {
        console.log(`  [${progress.stage}] ${progress.message}`);
      },
    });

    console.log(`✅ Analysis complete in ${analysisResult.duration}ms`);
    console.log(`   Stages executed: ${analysisResult.stagesExecuted}`);
    console.log(`   Stages failed: ${analysisResult.stagesFailed}\n`);

    // Step 4: Calculate Quality Metrics (Before)
    console.log('📊 Step 4: Calculating quality metrics...');
    const metricsCalculator = new QualityMetricsCalculator();
    const beforeMetrics = await metricsCalculator.calculateMetrics({
      includeCoverage: true,
      includeComplexity: true,
      includeMaintainability: true,
    });
    console.log(`✅ Metrics calculated`);
    console.log(`   Code Health Score: ${beforeMetrics.codeHealth.score}/100 (${beforeMetrics.codeHealth.grade})`);
    console.log(`   Coverage: ${beforeMetrics.coverage.overall}%`);
    console.log(`   Complexity: ${beforeMetrics.complexity.averageCyclomaticComplexity}`);
    console.log(`   Maintainability: ${beforeMetrics.maintainability.maintainabilityIndex}/100\n`);

    // Step 5: Generate Cleanup Plan
    console.log('📝 Step 5: Generating cleanup plan...');
    const planGenerator = new CleanupPlanGenerator();
    const cleanupPlan = await planGenerator.generatePlan(analysisResult.report, {
      safeOnly: false,
      includeReviewRequired: true,
      prioritizeHighImpact: true,
    });
    console.log(`✅ Cleanup plan generated`);
    console.log(`   Total actions: ${cleanupPlan.actions.length}`);
    console.log(`   Safety level: ${cleanupPlan.safetyLevel}`);
    console.log(`   Estimated impact: ${cleanupPlan.estimatedImpact.linesRemoved} lines removed`);
    console.log(`   Bundle size reduction: ${(cleanupPlan.estimatedImpact.bundleSizeReduction / 1024).toFixed(2)} KB\n`);

    // Step 6: Generate Reports
    console.log('📄 Step 6: Generating reports...');
    await fs.mkdir('reports', { recursive: true });

    const reportGenerator = new ReportGenerator();

    // JSON Report
    await reportGenerator.generateReport(
      analysisResult.report,
      cleanupPlan,
      {
        format: 'json',
        outputPath: 'reports/analysis-report.json',
        projectName: 'GymGenie AI',
        includeDetails: true,
      }
    );

    // HTML Report
    await reportGenerator.generateReport(
      analysisResult.report,
      cleanupPlan,
      {
        format: 'html',
        outputPath: 'reports/analysis-report.html',
        projectName: 'GymGenie AI',
        includeVisualizations: true,
      }
    );

    // Markdown Report
    await reportGenerator.generateReport(
      analysisResult.report,
      cleanupPlan,
      {
        format: 'markdown',
        outputPath: 'reports/analysis-report.md',
        projectName: 'GymGenie AI',
        includeDetails: true,
      }
    );

    console.log('✅ Reports generated:');
    console.log('   - reports/analysis-report.json');
    console.log('   - reports/analysis-report.html');
    console.log('   - reports/analysis-report.md\n');

    // Step 7: Generate Documentation
    console.log('📚 Step 7: Generating documentation...');
    const docGenerator = new DocumentationGenerator();
    
    // Use beforeMetrics for both since we haven't executed cleanup yet
    const documentation = await docGenerator.generateDocumentation(
      analysisResult.report,
      cleanupPlan,
      beforeMetrics,
      beforeMetrics, // Will be updated after cleanup
      {
        outputDir: 'docs/cleanup',
        includeCodeComparisons: true,
        includeDecisionRationale: true,
        includeMaintenanceChecklist: true,
        includeBestPractices: true,
        format: 'markdown',
      }
    );

    const docPath = await docGenerator.exportDocumentation(documentation, {
      outputDir: 'docs/cleanup',
      includeCodeComparisons: true,
      includeDecisionRationale: true,
      includeMaintenanceChecklist: true,
      includeBestPractices: true,
      format: 'markdown',
    });

    console.log(`✅ Documentation generated at: ${docPath}\n`);

    // Step 8: Summary
    const duration = Date.now() - startTime;
    console.log('=' .repeat(60));
    console.log('📊 Analysis Summary');
    console.log('=' .repeat(60));
    console.log('');

    // Dead Code
    if (analysisResult.report.deadCode) {
      console.log('🔴 Dead Code:');
      console.log(`   Unused exports: ${analysisResult.report.deadCode.unusedExports.length}`);
      console.log(`   Unused functions: ${analysisResult.report.deadCode.unusedFunctions.length}`);
      console.log(`   Unused variables: ${analysisResult.report.deadCode.unusedVariables.length}`);
      console.log(`   Unused types: ${analysisResult.report.deadCode.unusedTypes.length}`);
      console.log('');
    }

    // Unused Imports
    if (analysisResult.report.unusedImports) {
      console.log('📦 Unused Imports:');
      console.log(`   Files with unused imports: ${analysisResult.report.unusedImports.files.length}`);
      console.log(`   Total unused imports: ${analysisResult.report.unusedImports.totalUnused}`);
      console.log('');
    }

    // Duplicates
    if (analysisResult.report.duplicates) {
      console.log('📋 Duplicate Code:');
      console.log(`   Duplicate groups: ${analysisResult.report.duplicates.groups.length}`);
      console.log(`   Total duplicates: ${analysisResult.report.duplicates.totalDuplicates}`);
      console.log(`   Estimated savings: ${analysisResult.report.duplicates.estimatedSavings} lines`);
      console.log('');
    }

    // Orphaned Files
    if (analysisResult.report.orphanedFiles) {
      console.log('🗑️  Orphaned Files:');
      console.log(`   Total orphaned: ${analysisResult.report.orphanedFiles.orphaned.length}`);
      console.log(`   Safe to delete: ${analysisResult.report.orphanedFiles.categorized.safeToDelete.length}`);
      console.log(`   Needs review: ${analysisResult.report.orphanedFiles.categorized.needsReview.length}`);
      console.log('');
    }

    // Type Issues
    if (analysisResult.report.typeIssues) {
      console.log('🔤 Type System:');
      console.log(`   Duplicate types: ${analysisResult.report.typeIssues.duplicateTypes.length}`);
      console.log(`   Unused types: ${analysisResult.report.typeIssues.unusedTypes.length}`);
      console.log(`   Consolidation opportunities: ${analysisResult.report.typeIssues.consolidationOpportunities.length}`);
      console.log('');
    }

    // Dependencies
    if (analysisResult.report.dependencies) {
      console.log('🔗 Dependencies:');
      console.log(`   Circular dependencies: ${analysisResult.report.dependencies.circularDependencies.length}`);
      console.log(`   Tightly coupled modules: ${analysisResult.report.dependencies.coupling.tightlyCoupled.length}`);
      console.log('');
    }

    // Code Flow
    if (analysisResult.report.codeFlow) {
      console.log('🔄 Code Flow:');
      console.log(`   Flow violations: ${analysisResult.report.codeFlow.violations.length}`);
      console.log('');
    }

    // Cleanup Plan
    console.log('🧹 Cleanup Plan:');
    console.log(`   Total actions: ${cleanupPlan.actions.length}`);
    console.log(`   Safety level: ${cleanupPlan.safetyLevel}`);
    console.log(`   Files affected: ${cleanupPlan.estimatedImpact.filesAffected}`);
    console.log(`   Lines to remove: ${cleanupPlan.estimatedImpact.linesRemoved}`);
    console.log(`   Bundle size reduction: ${(cleanupPlan.estimatedImpact.bundleSizeReduction / 1024).toFixed(2)} KB`);
    console.log(`   Estimated time: ${cleanupPlan.estimatedImpact.estimatedTimeMinutes} minutes`);
    console.log('');

    // Quality Metrics
    console.log('📈 Quality Metrics:');
    console.log(`   Code Health Score: ${beforeMetrics.codeHealth.score}/100 (${beforeMetrics.codeHealth.grade})`);
    console.log(`   Coverage: ${beforeMetrics.coverage.overall}%`);
    console.log(`   Complexity: ${beforeMetrics.complexity.averageCyclomaticComplexity}`);
    console.log(`   Maintainability: ${beforeMetrics.maintainability.maintainabilityIndex}/100`);
    console.log(`   High complexity functions: ${beforeMetrics.complexity.highComplexityFunctions.length}`);
    console.log('');

    console.log('⏱️  Total Duration:', `${(duration / 1000).toFixed(2)}s`);
    console.log('');
    console.log('✅ Full analysis complete!');
    console.log('');
    console.log('📁 Generated Files:');
    console.log('   - reports/analysis-report.json');
    console.log('   - reports/analysis-report.html');
    console.log('   - reports/analysis-report.md');
    console.log('   - docs/cleanup/cleanup-documentation.md');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Review the analysis reports');
    console.log('   2. Examine the cleanup plan');
    console.log('   3. Run: npm run cleanup:execute (to execute safe cleanup)');
    console.log('   4. Or manually review and execute specific actions');
    console.log('');

    // Save summary to file
    const summary = {
      timestamp: new Date().toISOString(),
      duration: duration,
      analysis: {
        deadCode: analysisResult.report.deadCode ? {
          unusedExports: analysisResult.report.deadCode.unusedExports.length,
          unusedFunctions: analysisResult.report.deadCode.unusedFunctions.length,
          unusedVariables: analysisResult.report.deadCode.unusedVariables.length,
          unusedTypes: analysisResult.report.deadCode.unusedTypes.length,
        } : null,
        unusedImports: analysisResult.report.unusedImports ? {
          filesWithUnusedImports: analysisResult.report.unusedImports.files.length,
          totalUnused: analysisResult.report.unusedImports.totalUnused,
        } : null,
        duplicates: analysisResult.report.duplicates ? {
          groups: analysisResult.report.duplicates.groups.length,
          total: analysisResult.report.duplicates.totalDuplicates,
          estimatedSavings: analysisResult.report.duplicates.estimatedSavings,
        } : null,
        orphanedFiles: analysisResult.report.orphanedFiles ? {
          total: analysisResult.report.orphanedFiles.orphaned.length,
          safeToDelete: analysisResult.report.orphanedFiles.categorized.safeToDelete.length,
          needsReview: analysisResult.report.orphanedFiles.categorized.needsReview.length,
        } : null,
      },
      cleanupPlan: {
        totalActions: cleanupPlan.actions.length,
        safetyLevel: cleanupPlan.safetyLevel,
        estimatedImpact: cleanupPlan.estimatedImpact,
      },
      metrics: {
        codeHealth: beforeMetrics.codeHealth,
        coverage: beforeMetrics.coverage,
        complexity: {
          average: beforeMetrics.complexity.averageCyclomaticComplexity,
          highComplexityFunctions: beforeMetrics.complexity.highComplexityFunctions.length,
        },
        maintainability: beforeMetrics.maintainability.maintainabilityIndex,
      },
    };

    await fs.writeFile(
      'reports/analysis-summary.json',
      JSON.stringify(summary, null, 2),
      'utf-8'
    );

    console.log('💾 Summary saved to: reports/analysis-summary.json');
    console.log('');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run analysis
if (require.main === module) {
  runFullAnalysis().catch(console.error);
}

export { runFullAnalysis };
