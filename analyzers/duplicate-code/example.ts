/**
 * Example usage of DuplicateCodeDetector
 */

import { DuplicateCodeDetector } from './DuplicateCodeDetector';
import { AnalysisConfig } from '../config/AnalysisConfig';

async function runDuplicateDetection() {
  // Create analyzer instance
  const detector = new DuplicateCodeDetector();

  // Configure analysis
  const config: AnalysisConfig = {
    include: ['src/**/*.ts', 'src/**/*.tsx', 'components/**/*.tsx'],
    exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**', '**/dist/**'],
    entryPoints: ['src/index.tsx', 'App.tsx'],
    
    deadCode: {
      enabled: false,
      checkDynamicImports: false,
      confidenceThreshold: 'high',
    },
    
    unusedImports: {
      enabled: false,
      autoFix: false,
      preserveTypeImports: true,
    },
    
    duplicates: {
      enabled: true,
      minLines: 5,
      minTokens: 50,
      similarityThreshold: 0.85,
      ignorePatterns: ['**/*.test.ts', '**/*.spec.ts'],
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
    console.log('🔍 Running duplicate code detection...\n');
    
    // Run analysis
    const report = await detector.analyze(config);

    // Display summary
    console.log('📊 Summary:');
    console.log(`  Total duplicate groups: ${report.summary.totalDuplicates}`);
    console.log(`  Total instances: ${report.summary.totalInstances}`);
    console.log(`  Files affected: ${report.summary.filesAffected}`);
    console.log(`  Lines duplicated: ${report.summary.linesDuplicated}`);
    console.log(`  Potential lines saved: ${report.summary.potentialLinesSaved}`);
    console.log(`  High-impact duplicates: ${report.summary.highImpactCount}\n`);

    // Display high-impact duplicates
    const highImpact = report.duplicates.filter(d => d.impact === 'high');
    
    if (highImpact.length > 0) {
      console.log('🔥 High-Impact Duplicates:\n');
      
      for (const duplicate of highImpact.slice(0, 5)) {
        console.log(`Duplicate Group #${duplicate.id.slice(0, 8)}`);
        console.log(`  Occurrences: ${duplicate.occurrences}`);
        console.log(`  Similarity: ${(duplicate.similarity * 100).toFixed(1)}%`);
        console.log(`  Total lines: ${duplicate.linesTotal}`);
        console.log(`  Files:`);
        
        for (const instance of duplicate.instances) {
          console.log(`    - ${instance.file}:${instance.line}-${instance.endLine}`);
        }
        
        console.log(`  Suggestion: ${duplicate.suggestedRefactoring.type}`);
        console.log(`  Priority: ${duplicate.suggestedRefactoring.priority}`);
        console.log(`  Target: ${duplicate.suggestedRefactoring.targetLocation}`);
        console.log(`  Impact: ${duplicate.suggestedRefactoring.estimatedImpact} lines saved`);
        console.log(`  ${duplicate.suggestedRefactoring.description}\n`);
      }
    }

    // Display medium-impact duplicates count
    const mediumImpact = report.duplicates.filter(d => d.impact === 'medium');
    if (mediumImpact.length > 0) {
      console.log(`⚠️  ${mediumImpact.length} medium-impact duplicates found\n`);
    }

    // Display low-impact duplicates count
    const lowImpact = report.duplicates.filter(d => d.impact === 'low');
    if (lowImpact.length > 0) {
      console.log(`ℹ️  ${lowImpact.length} low-impact duplicates found\n`);
    }

    return report;
  } catch (error) {
    console.error('❌ Duplicate detection failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runDuplicateDetection()
    .then(() => {
      console.log('✅ Analysis complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { runDuplicateDetection };
