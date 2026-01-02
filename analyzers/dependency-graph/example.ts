import { DependencyGraphAnalyzer } from './DependencyGraphAnalyzer';
import { AnalysisConfig } from '../config';
import * as fs from 'fs';

/**
 * Example usage of DependencyGraphAnalyzer
 */
async function analyzeDependencyGraph() {
  const analyzer = new DependencyGraphAnalyzer();

  const config: AnalysisConfig = {
    include: ['src/**/*.ts', 'src/**/*.tsx', 'components/**/*.tsx', 'services/**/*.ts'],
    exclude: ['node_modules', 'dist', 'build', '**/*.test.ts', '**/*.spec.ts'],
    entryPoints: ['src/main.ts', 'App.tsx', 'index.tsx'],
    deadCode: {
      enabled: false,
      checkDynamicImports: false,
      confidenceThreshold: 'high',
    },
    unusedImports: {
      enabled: false,
      autoFix: false,
      preserveTypeImports: false,
    },
    duplicates: {
      enabled: false,
      minLines: 5,
      minTokens: 50,
      similarityThreshold: 0.8,
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
      enabled: true,
      detectCircular: true,
      visualize: true,
    },
  };

  try {
    console.log('Starting dependency graph analysis...');
    const report = await analyzer.analyze(config);

    console.log('\n=== Dependency Graph Analysis Report ===\n');
    console.log(`Total modules: ${report.metrics.totalModules}`);
    console.log(`Total dependencies: ${report.metrics.totalDependencies}`);
    console.log(`Average dependencies per module: ${report.metrics.averageDependencies.toFixed(2)}`);
    console.log(`Max dependencies: ${report.metrics.maxDependencies}`);
    console.log(`Circular dependencies: ${report.metrics.circularCount}`);
    console.log(`Tightly coupled pairs: ${report.metrics.tightlyCoupledCount}`);

    if (report.circularDependencies.length > 0) {
      console.log('\n--- Circular Dependencies ---');
      report.circularDependencies.forEach((circular, i) => {
        console.log(`\n${i + 1}. [${circular.severity.toUpperCase()}] Cycle:`);
        console.log(`   ${circular.cycle.join(' → ')}`);
        console.log(`   Suggestion: ${circular.suggestion}`);
      });
    }

    if (report.couplingReport.tightlyCoupled.length > 0) {
      console.log('\n--- Tightly Coupled Modules ---');
      console.log(`Average coupling score: ${report.couplingReport.averageCoupling.toFixed(2)}`);
      console.log(`Max coupling score: ${report.couplingReport.maxCoupling.toFixed(2)}`);

      report.couplingReport.tightlyCoupled.slice(0, 10).forEach((pair, i) => {
        console.log(`\n${i + 1}. ${pair.module1} ↔ ${pair.module2}`);
        console.log(`   Coupling score: ${pair.couplingScore.toFixed(2)}`);
        console.log(`   Reason: ${pair.reason}`);
        if (pair.sharedDependencies.length > 0) {
          console.log(`   Shared dependencies: ${pair.sharedDependencies.slice(0, 3).join(', ')}${pair.sharedDependencies.length > 3 ? '...' : ''}`);
        }
      });
    }

    if (report.couplingReport.suggestions.length > 0) {
      console.log('\n--- Decoupling Suggestions ---');
      report.couplingReport.suggestions.slice(0, 5).forEach((suggestion, i) => {
        console.log(`\n${i + 1}. ${suggestion.modules.join(' & ')} (${suggestion.priority} priority)`);
        console.log(`   Strategy: ${suggestion.strategy}`);
        console.log(`   Impact: ${suggestion.estimatedImpact}`);
        console.log('   Steps:');
        suggestion.steps.forEach((step, j) => {
          console.log(`     ${j + 1}. ${step}`);
        });
      });
    }

    // Save visualization if generated
    if (report.visualization) {
      const outputPath = 'dependency-graph.dot';
      fs.writeFileSync(outputPath, report.visualization);
      console.log(`\n--- Visualization ---`);
      console.log(`Saved DOT file to: ${outputPath}`);
      console.log('To generate SVG: dot -Tsvg dependency-graph.dot -o dependency-graph.svg');
      console.log('To generate PNG: dot -Tpng dependency-graph.dot -o dependency-graph.png');
    }

    console.log('\n=== Analysis Complete ===\n');

    // Summary
    if (report.metrics.circularCount === 0 && report.metrics.tightlyCoupledCount === 0) {
      console.log('✅ No circular dependencies or tight coupling found!');
    } else {
      if (report.metrics.circularCount > 0) {
        console.log(`⚠️  Found ${report.metrics.circularCount} circular dependencies that should be resolved.`);
      }
      if (report.metrics.tightlyCoupledCount > 0) {
        console.log(`⚠️  Found ${report.metrics.tightlyCoupledCount} tightly coupled module pairs.`);
      }
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  analyzeDependencyGraph().catch(console.error);
}

export { analyzeDependencyGraph };
