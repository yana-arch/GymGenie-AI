#!/usr/bin/env node

import { AnalysisPipeline } from '../pipeline';
import { CleanupPlanGenerator } from '../cleanup-plan';
import { CleanupExecutor } from '../cleanup-executor';
import { RollbackManager } from '../rollback-manager';
import { ReportGenerator } from '../report-generator';
import { QualityMetricsCalculator } from '../quality-metrics';
import { ConfigParser } from '../config';
import { logger } from '../utils/logger';

/**
 * Simple CLI for code cleanup and refactoring
 */
class CleanupCLI {
  async run(args: string[]): Promise<void> {
    const command = args[2] || 'help';

    try {
      switch (command) {
        case 'analyze':
          await this.analyze();
          break;
        case 'cleanup':
          await this.cleanup();
          break;
        case 'report':
          await this.generateReport();
          break;
        case 'rollback':
          await this.rollback();
          break;
        case 'metrics':
          await this.calculateMetrics();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      logger.error(`Error: ${error}`);
      process.exit(1);
    }
  }

  private async analyze(): Promise<void> {
    console.log('🔍 Running code analysis...\n');

    // Load configuration
    const configParser = new ConfigParser();
    const config = await configParser.loadConfig();

    // Run analysis pipeline
    const pipeline = new AnalysisPipeline();
    const result = await pipeline.execute({
      config,
      parallel: true,
      onProgress: (progress) => {
        console.log(`[${progress.stage}] ${progress.message}`);
      },
    });

    console.log('\n✅ Analysis complete!');
    console.log(`Stages executed: ${result.stagesExecuted}`);
    console.log(`Stages failed: ${result.stagesFailed}`);
    console.log(`Duration: ${result.duration}ms`);

    // Generate report
    const reportGenerator = new ReportGenerator();
    await reportGenerator.generateReport(
      result.report,
      undefined,
      {
        format: 'markdown',
        outputPath: 'reports/analysis-report.md',
        projectName: 'GymGenie AI',
        includeDetails: true,
      }
    );

    console.log('\n📄 Report saved to: reports/analysis-report.md');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Running cleanup...\n');

    // Load configuration
    const configParser = new ConfigParser();
    const config = await configParser.loadConfig();

    // Run analysis
    const pipeline = new AnalysisPipeline();
    const analysisResult = await pipeline.execute({
      config,
      parallel: true,
    });

    // Generate cleanup plan
    const planGenerator = new CleanupPlanGenerator();
    const plan = await planGenerator.generatePlan(analysisResult.report, {
      safeOnly: false,
      includeReviewRequired: false,
      prioritizeHighImpact: true,
    });

    console.log(`\n📋 Cleanup plan generated:`);
    console.log(`Total actions: ${plan.actions.length}`);
    console.log(`Safety level: ${plan.safetyLevel}`);
    console.log(`Estimated impact: ${plan.estimatedImpact.linesRemoved} lines removed`);

    // Execute cleanup
    const executor = new CleanupExecutor();
    const executionResult = await executor.execute(plan, {
      createBackup: true,
      runTests: false,
      skipReviewRequired: true,
      verbose: true,
    });

    console.log('\n✅ Cleanup complete!');
    console.log(`Successful: ${executionResult.successfulActions}`);
    console.log(`Failed: ${executionResult.failedActions}`);
    console.log(`Skipped: ${executionResult.skippedActions}`);

    if (executor.getBackupDir()) {
      console.log(`\n💾 Backup created at: ${executor.getBackupDir()}`);
      console.log(`Checkpoint ID: ${executor.getCheckpointId()}`);
    }
  }

  private async generateReport(): Promise<void> {
    console.log('📊 Generating comprehensive report...\n');

    // Load configuration
    const configParser = new ConfigParser();
    const config = await configParser.loadConfig();

    // Run analysis
    const pipeline = new AnalysisPipeline();
    const result = await pipeline.execute({
      config,
      parallel: true,
    });

    // Generate reports in multiple formats
    const reportGenerator = new ReportGenerator();

    await reportGenerator.generateReport(
      result.report,
      undefined,
      {
        format: 'html',
        outputPath: 'reports/cleanup-report.html',
        projectName: 'GymGenie AI',
        includeVisualizations: true,
      }
    );

    await reportGenerator.generateReport(
      result.report,
      undefined,
      {
        format: 'json',
        outputPath: 'reports/cleanup-report.json',
        projectName: 'GymGenie AI',
      }
    );

    console.log('✅ Reports generated:');
    console.log('  - reports/cleanup-report.html');
    console.log('  - reports/cleanup-report.json');
  }

  private async rollback(): Promise<void> {
    console.log('⏪ Rolling back changes...\n');

    const manager = new RollbackManager();
    await manager.initialize();

    const checkpoints = manager.listCheckpoints();

    if (checkpoints.length === 0) {
      console.log('No checkpoints found.');
      return;
    }

    // Use the most recent checkpoint
    const latestCheckpoint = checkpoints[0];
    console.log(`Rolling back to: ${latestCheckpoint.label}`);
    console.log(`Created: ${latestCheckpoint.timestamp.toISOString()}`);

    const result = await manager.rollback(latestCheckpoint.id, {
      force: true,
      verbose: true,
    });

    console.log('\n✅ Rollback complete!');
    console.log(`Files restored: ${result.filesRestored.length}`);
    console.log(`Files skipped: ${result.filesSkipped.length}`);
    console.log(`Errors: ${result.errors.length}`);
  }

  private async calculateMetrics(): Promise<void> {
    console.log('📈 Calculating quality metrics...\n');

    const calculator = new QualityMetricsCalculator();
    const metrics = await calculator.calculateMetrics({
      includeCoverage: true,
      includeComplexity: true,
      includeMaintainability: true,
    });

    console.log('✅ Metrics calculated:\n');
    console.log(`Code Health Score: ${metrics.codeHealth.score}/100 (${metrics.codeHealth.grade})`);
    console.log(`\nCoverage: ${metrics.coverage.overall}%`);
    console.log(`Complexity: ${metrics.complexity.averageCyclomaticComplexity}`);
    console.log(`Maintainability: ${metrics.maintainability.maintainabilityIndex}/100`);
    console.log(`\nHigh Complexity Functions: ${metrics.complexity.highComplexityFunctions.length}`);
    console.log(`Files with Issues: ${metrics.maintainability.filesWithIssues}`);
  }

  private showHelp(): void {
    console.log(`
🧹 Code Cleanup and Refactoring CLI

Usage: npm run cleanup <command>

Commands:
  analyze   - Run full code analysis
  cleanup   - Execute cleanup operations
  report    - Generate comprehensive reports
  rollback  - Rollback to previous checkpoint
  metrics   - Calculate quality metrics
  help      - Show this help message

Examples:
  npm run cleanup analyze
  npm run cleanup cleanup
  npm run cleanup report
  npm run cleanup rollback
  npm run cleanup metrics

Configuration:
  Place your configuration in .kiro/specs/code-cleanup-refactoring/config.json
    `);
  }
}

// Run CLI
const cli = new CleanupCLI();
cli.run(process.argv).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
