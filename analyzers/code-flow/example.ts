import { CodeFlowValidator } from './CodeFlowValidator';
import { AnalysisConfig } from '../config';

/**
 * Example usage of CodeFlowValidator
 */
async function validateCodeFlow() {
  const validator = new CodeFlowValidator();

  const config: AnalysisConfig = {
    include: ['src/**/*.tsx', 'src/**/*.ts', 'components/**/*.tsx'],
    exclude: ['node_modules', 'dist', 'build', '**/*.test.ts', '**/*.spec.ts'],
    entryPoints: ['src/main.ts', 'App.tsx'],
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
      enabled: true,
      enforceReduxPatterns: true,
      enforceServiceLayer: true,
    },
    dependencies: {
      enabled: false,
      detectCircular: false,
      visualize: false,
    },
  };

  try {
    console.log('Starting code flow validation...');
    const report = await validator.analyze(config);

    console.log('\n=== Code Flow Validation Report ===\n');
    console.log(`Total components analyzed: ${report.totalComponents}`);
    console.log(`Components with violations: ${report.componentsWithViolations}`);
    console.log(`Total violations: ${report.totalViolations}`);
    console.log(`Critical violations: ${report.criticalViolations}`);

    if (report.traces.length > 0) {
      console.log('\n--- Component Data Flow Traces ---');
      report.traces.forEach((trace) => {
        if (trace.violations.length > 0 || trace.directStorageAccess.length > 0) {
          console.log(`\n${trace.component} (${trace.file}):`);
          console.log(`  State access: ${trace.stateAccess.length}`);
          console.log(`  Service calls: ${trace.serviceCall.length}`);
          console.log(`  Direct storage access: ${trace.directStorageAccess.length}`);
          console.log(`  Violations: ${trace.violations.length}`);

          if (trace.violations.length > 0) {
            trace.violations.forEach((v) => {
              console.log(`    [${v.severity.toUpperCase()}] Line ${v.line}: ${v.type}`);
              console.log(`      → ${v.suggestion}`);
            });
          }
        }
      });
    }

    if (report.patternViolations.length > 0) {
      console.log('\n--- Redux Pattern Violations ---');
      report.patternViolations.forEach((v) => {
        console.log(`[${v.severity.toUpperCase()}] ${v.location}:${v.line}`);
        console.log(`  ${v.description}`);
        console.log(`  → ${v.suggestion}`);
      });
    }

    if (report.serviceLayerViolations.length > 0) {
      console.log('\n--- Service Layer Violations ---');
      report.serviceLayerViolations.forEach((v) => {
        console.log(`[${v.severity.toUpperCase()}] ${v.component} (${v.file}:${v.line})`);
        console.log(`  ${v.violation}`);
        console.log(`  → ${v.suggestion}`);
      });
    }

    console.log('\n=== Validation Complete ===\n');

    // Summary
    if (report.totalViolations === 0) {
      console.log('✅ No violations found! Code flow follows best practices.');
    } else {
      console.log(`⚠️  Found ${report.totalViolations} violations that need attention.`);
      if (report.criticalViolations > 0) {
        console.log(`❌ ${report.criticalViolations} critical violations must be fixed.`);
      }
    }
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  validateCodeFlow().catch(console.error);
}

export { validateCodeFlow };
