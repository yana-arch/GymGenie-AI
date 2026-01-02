import { OrphanedFileDetector } from './OrphanedFileDetector';
import { AnalysisConfig } from '../config';

/**
 * Example usage of OrphanedFileDetector
 */
async function runOrphanedFileAnalysis() {
  console.log('=== Orphaned File Detection Example ===\n');

  // Create detector instance
  const detector = new OrphanedFileDetector();

  // Configure analysis
  const config: Partial<AnalysisConfig> = {
    include: ['src/**/*.ts', 'src/**/*.tsx', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'build/**'],
    entryPoints: ['index.tsx', 'App.tsx', 'vite.config.ts'],
    orphanedFiles: {
      enabled: true,
      excludePatterns: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/vite.config.ts',
        '**/vitest.config.ts',
        '**/tailwind.config.js',
        '**/postcss.config.js',
      ],
    },
  };

  try {
    // Run analysis
    console.log('Running orphaned file analysis...\n');
    const report = await detector.analyze(config as AnalysisConfig);

    // Display results
    console.log('Analysis Results:');
    console.log('=================\n');

    console.log('Dependency Graph:');
    console.log(`  Total files analyzed: ${report.dependencyGraph.totalNodes}`);
    console.log(`  Total dependencies: ${report.dependencyGraph.totalEdges}`);
    console.log(`  Entry points: ${report.dependencyGraph.entryPoints.join(', ')}\n`);

    console.log('Orphaned Files Summary:');
    console.log(`  Total orphaned: ${report.summary.totalOrphaned}`);
    console.log(`  Safe to delete: ${report.summary.safeToDelete}`);
    console.log(`  Needs review: ${report.summary.needsReview}`);
    console.log(`  Keep for reference: ${report.summary.keepForReference}`);
    console.log(`  Estimated size reduction: ${(report.summary.estimatedSizeReduction / 1024).toFixed(2)} KB\n`);

    // Display safe to delete files
    if (report.categorized.safeToDelete.length > 0) {
      console.log('Files Safe to Delete:');
      console.log('=====================');
      for (const file of report.categorized.safeToDelete) {
        console.log(`  📄 ${file.path}`);
        console.log(`     Type: ${file.fileType}`);
        console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`     Last modified: ${file.lastModified.toLocaleDateString()}`);
        console.log(`     Reason: ${file.potentialReason}\n`);
      }
    }

    // Display files needing review
    if (report.categorized.needsReview.length > 0) {
      console.log('Files Needing Review:');
      console.log('=====================');
      for (const file of report.categorized.needsReview.slice(0, 5)) {
        console.log(`  ⚠️  ${file.path}`);
        console.log(`     Type: ${file.fileType}`);
        console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`     Last modified: ${file.lastModified.toLocaleDateString()}`);
        console.log(`     Reason: ${file.potentialReason}\n`);
      }
      if (report.categorized.needsReview.length > 5) {
        console.log(`  ... and ${report.categorized.needsReview.length - 5} more\n`);
      }
    }

    // Display files to keep
    if (report.categorized.keepForReference.length > 0) {
      console.log('Files to Keep for Reference:');
      console.log('============================');
      for (const file of report.categorized.keepForReference) {
        console.log(`  📌 ${file.path}`);
        console.log(`     Type: ${file.fileType}`);
        console.log(`     Reason: ${file.potentialReason}\n`);
      }
    }

    console.log('\nAnalysis completed successfully!');
    console.log(`Duration: ${report.duration}ms`);

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

// Run example if executed directly
if (require.main === module) {
  runOrphanedFileAnalysis().catch(console.error);
}

export { runOrphanedFileAnalysis };
