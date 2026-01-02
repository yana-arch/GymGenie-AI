/**
 * Example usage of DeadCodeAnalyzer
 * 
 * This demonstrates how to use the DeadCodeAnalyzer to detect
 * unused code in your project and generate reports.
 */

import { DeadCodeAnalyzer } from './DeadCodeAnalyzer';
import { DeadCodeReportGenerator } from './ReportGenerator';
import { AnalysisConfig } from '../config/AnalysisConfig';

async function runDeadCodeAnalysis() {
  // Create analyzer instance
  const analyzer = new DeadCodeAnalyzer();

  // Configure analysis
  const config: AnalysisConfig = {
    include: ['src/**/*.ts', 'src/**/*.tsx', '**/*.ts', '**/*.tsx'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    entryPoints: ['index.tsx', 'App.tsx', 'vite.config.ts'],
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

  try {
    console.log('🔍 Running dead code analysis...\n');

    // Run analysis
    const report = await analyzer.analyze(config);

    // Display summary
    console.log('📊 Analysis Summary:');
    console.log(`   Unused Exports: ${report.summary.totalUnusedExports}`);
    console.log(`   Unused Functions: ${report.summary.totalUnusedFunctions}`);
    console.log(`   Unused Variables: ${report.summary.totalUnusedVariables}`);
    console.log(`   Unused Types: ${report.summary.totalUnusedTypes}`);
    console.log(`   Files Affected: ${report.summary.filesAffected}`);
    console.log(`   Confidence Level: ${report.confidence}\n`);

    // Generate removal plan
    const plan = analyzer.generateRemovalPlan(report);
    console.log('📋 Removal Plan:');
    console.log(`   Actions: ${plan.actions.length}`);
    console.log(`   Files Affected: ${plan.estimatedImpact.filesAffected}`);
    console.log(`   Exports to Remove: ${plan.estimatedImpact.exportsRemoved}`);
    console.log(`   Estimated Lines Removed: ${plan.estimatedImpact.linesRemoved}`);
    console.log(`   Safety Level: ${plan.safetyLevel}\n`);

    // Generate reports
    const reportGenerator = new DeadCodeReportGenerator();

    // Generate JSON report
    const jsonPath = await reportGenerator.generateToFile(report, {
      format: 'json',
      outputPath: 'reports/dead-code-report.json',
    });
    console.log(`✅ JSON report saved to: ${jsonPath}`);

    // Generate HTML report
    const htmlPath = await reportGenerator.generateToFile(report, {
      format: 'html',
      outputPath: 'reports/dead-code-report.html',
      groupByFile: true,
    });
    console.log(`✅ HTML report saved to: ${htmlPath}`);

    // Generate Markdown report
    const mdPath = await reportGenerator.generateToFile(report, {
      format: 'markdown',
      outputPath: 'reports/dead-code-report.md',
      groupByFile: false,
    });
    console.log(`✅ Markdown report saved to: ${mdPath}`);

    console.log('\n✨ Analysis complete!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDeadCodeAnalysis();
}

export { runDeadCodeAnalysis };
