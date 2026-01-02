/**
 * Example usage of TypeSystemOptimizer
 */

import { TypeSystemOptimizer } from './TypeSystemOptimizer';
import { AnalysisConfig } from '../config';

async function runTypeSystemAnalysis() {
  console.log('=== Type System Optimizer Example ===\n');

  // Create analyzer instance
  const optimizer = new TypeSystemOptimizer();

  // Configure analysis
  const config: AnalysisConfig = {
    include: ['src/**/*.ts', 'src/**/*.tsx', 'types/**/*.ts'],
    exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
    entryPoints: ['src/index.ts', 'App.tsx'],
    typeOptimization: {
      enabled: true,
      suggestCentralization: true,
    },
  };

  try {
    // Run analysis
    console.log('Running type system analysis...\n');
    const report = await optimizer.analyze(config);

    // Display results
    console.log('=== Analysis Results ===\n');
    console.log(`Total types analyzed: ${report.totalTypesAnalyzed}`);
    console.log(`Duplicate types found: ${report.duplicateCount}`);
    console.log(`Unused types found: ${report.unusedCount}`);
    console.log(`Consolidation opportunities: ${report.consolidationOpportunities.length}\n`);

    // Show duplicate types
    if (report.duplicateTypes.length > 0) {
      console.log('=== Duplicate Types ===\n');
      report.duplicateTypes.forEach((dup) => {
        console.log(`Type: ${dup.name}`);
        console.log(`Can merge: ${dup.canMerge}`);
        console.log('Locations:');
        dup.locations.forEach((loc) => {
          console.log(`  - ${loc.file}:${loc.line} (exported: ${loc.isExported})`);
        });
        console.log();
      });
    }

    // Show unused types
    if (report.unusedTypes.length > 0) {
      console.log('=== Unused Types ===\n');
      report.unusedTypes.slice(0, 10).forEach((unused) => {
        console.log(`- ${unused.name} in ${unused.file}:${unused.line}`);
      });
      if (report.unusedTypes.length > 10) {
        console.log(`... and ${report.unusedTypes.length - 10} more\n`);
      }
    }

    // Show consolidation opportunities
    if (report.consolidationOpportunities.length > 0) {
      console.log('=== Consolidation Opportunities ===\n');
      report.consolidationOpportunities.forEach((opp) => {
        console.log(`Types: ${opp.types.join(', ')}`);
        console.log(`Suggested name: ${opp.suggestedName}`);
        console.log(`Target file: ${opp.targetFile}`);
        console.log(`Affected files: ${opp.affectedFiles.length}`);
        console.log();
      });
    }

    // Show centralization plan
    if (report.centralizationPlan) {
      console.log('=== Centralization Plan ===\n');
      console.log(`Target file: ${report.centralizationPlan.targetFile}`);
      console.log(`Common types to centralize: ${report.centralizationPlan.commonTypes.length}`);
      console.log(`Migrations needed: ${report.centralizationPlan.migrations.length}\n`);

      if (report.centralizationPlan.migrations.length > 0) {
        console.log('Migrations:');
        report.centralizationPlan.migrations.forEach((migration) => {
          console.log(`  ${migration.fromFile} -> ${migration.toFile}`);
          console.log(`  Types: ${migration.types.join(', ')}`);
          console.log(`  Import updates: ${migration.updateImports.length}`);
          console.log();
        });
      }
    }

    console.log('=== Analysis Complete ===');
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runTypeSystemAnalysis().catch(console.error);
}

export { runTypeSystemAnalysis };
