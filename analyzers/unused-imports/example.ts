/**
 * Example usage of UnusedImportAnalyzer
 * 
 * This file demonstrates how to use the UnusedImportAnalyzer to detect
 * and automatically fix unused imports in your codebase.
 */

import { UnusedImportAnalyzer } from './UnusedImportAnalyzer';
import { AnalysisConfig } from '../config/AnalysisConfig';

async function main() {
  // Create analyzer instance
  const analyzer = new UnusedImportAnalyzer();

  // Configure analysis
  const config: AnalysisConfig = {
    include: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'components/**/*.tsx',
      'services/**/*.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    entryPoints: [
      'index.tsx',
      'App.tsx',
    ],
    deadCode: {
      enabled: false,
      checkDynamicImports: false,
      confidenceThreshold: 'high',
    },
    unusedImports: {
      enabled: true,
      autoFix: false, // Set to true to automatically fix
      preserveTypeImports: true, // Keep type-only imports
    },
    duplicates: {
      enabled: false,
      minLines: 5,
      minTokens: 50,
      similarityThreshold: 0.9,
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

  console.log('🔍 Analyzing codebase for unused imports...\n');

  // Run analysis
  const report = await analyzer.analyze(config);

  // Display results
  console.log('📊 Analysis Results:');
  console.log(`   Total unused imports: ${report.summary.totalUnusedImports}`);
  console.log(`   Files affected: ${report.summary.filesAffected}`);
  console.log(`   Auto-fixable: ${report.summary.autoFixable}`);
  console.log(`   Type-only imports: ${report.summary.typeOnlyImports}`);
  console.log();

  // Display detailed results
  if (report.unusedImports.length > 0) {
    console.log('📝 Unused Imports by File:\n');

    // Group by file
    const byFile = new Map<string, typeof report.unusedImports>();
    for (const unusedImport of report.unusedImports) {
      if (!byFile.has(unusedImport.file)) {
        byFile.set(unusedImport.file, []);
      }
      byFile.get(unusedImport.file)!.push(unusedImport);
    }

    // Display each file
    for (const [file, imports] of byFile) {
      console.log(`📄 ${file}`);
      for (const imp of imports) {
        const typeLabel = imp.isTypeOnly ? '[TYPE]' : '[VALUE]';
        const fixLabel = imp.canAutoFix ? '✓ fixable' : '✗ manual';
        console.log(`   Line ${imp.line}: ${imp.importName} from "${imp.importPath}" ${typeLabel} ${fixLabel}`);
      }
      console.log();
    }
  }

  // Example: Scan a single file
  console.log('🔍 Scanning single file example:\n');
  const singleFileImports = await analyzer.scanFile('App.tsx');
  console.log(`Found ${singleFileImports.length} unused imports in App.tsx`);
  console.log();

  // Example: Auto-fix (if enabled)
  if (config.unusedImports.autoFix && report.unusedImports.length > 0) {
    console.log('🔧 Auto-fixing unused imports...\n');

    const filesToFix = new Set(report.unusedImports.map(i => i.file));
    let totalFixed = 0;

    for (const file of filesToFix) {
      const fileImports = report.unusedImports.filter(i => i.file === file);
      const result = await analyzer.autoFix(file, fileImports);

      if (result.success) {
        console.log(`✓ Fixed ${result.importsRemoved} imports in ${file}`);
        totalFixed += result.importsRemoved;
      } else {
        console.log(`✗ Failed to fix ${file}: ${result.error}`);
      }
    }

    console.log();
    console.log(`✅ Total imports fixed: ${totalFixed}`);
  } else if (report.unusedImports.length > 0) {
    console.log('💡 Tip: Set autoFix: true in config to automatically remove unused imports');
  }

  // Example: Categorize imports
  console.log('\n📋 Import Categories:\n');
  const categories = {
    value: report.unusedImports.filter(i => i.category === 'value').length,
    type: report.unusedImports.filter(i => i.category === 'type').length,
    both: report.unusedImports.filter(i => i.category === 'both').length,
    sideEffect: report.unusedImports.filter(i => i.category === 'side-effect').length,
  };

  console.log(`   Value imports: ${categories.value}`);
  console.log(`   Type imports: ${categories.type}`);
  console.log(`   Both: ${categories.both}`);
  console.log(`   Side-effect: ${categories.sideEffect}`);

  // Example: Path alias resolution
  console.log('\n🔗 Path Alias Resolution Example:\n');
  const examplePaths = [
    '@/components/Button',
    './utils/helpers',
    'react',
  ];

  for (const importPath of examplePaths) {
    const resolved = analyzer.resolveImportPath(importPath, 'src/pages/Home.tsx');
    console.log(`   ${importPath} → ${resolved}`);
  }

  console.log('\n✨ Analysis complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
