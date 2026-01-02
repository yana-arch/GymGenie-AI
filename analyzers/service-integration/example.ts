import { ServiceIntegrationAnalyzer } from './ServiceIntegrationAnalyzer';
import { AnalysisConfig } from '../config';

/**
 * Example usage of ServiceIntegrationAnalyzer
 */
async function analyzeServiceIntegration() {
  const analyzer = new ServiceIntegrationAnalyzer();

  const config: AnalysisConfig = {
    include: ['services/**/*.ts', 'src/**/*.ts'],
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
      enabled: true,
      checkIntegration: true,
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
    console.log('Starting service integration analysis...');
    const report = await analyzer.analyze(config);

    console.log('\n=== Service Integration Analysis Report ===\n');
    console.log(`Total services found: ${report.totalServices}`);
    console.log(`Registered services: ${report.registeredServices}`);
    console.log(`Unused services: ${report.unusedCount}`);
    console.log(`Partially integrated: ${report.partiallyIntegrated.length}`);
    console.log(`Integration issues: ${report.integrationIssues.length}`);

    if (report.services.length > 0) {
      console.log('\n--- Services ---');
      report.services.forEach((service) => {
        console.log(`\n${service.name}:`);
        console.log(`  File: ${service.file}`);
        console.log(`  Interface: ${service.interface || 'None'}`);
        console.log(`  Registered: ${service.isRegistered ? 'Yes' : 'No'}`);
        console.log(`  Usage count: ${service.usageCount}`);
        console.log(`  Consumers: ${service.consumers.length}`);
      });
    }

    if (report.unusedServices.length > 0) {
      console.log('\n--- Unused Services ---');
      report.unusedServices.forEach((service) => {
        console.log(`- ${service.name} (${service.file})`);
      });
    }

    if (report.integrationIssues.length > 0) {
      console.log('\n--- Integration Issues ---');
      report.integrationIssues.forEach((issue) => {
        console.log(`[${issue.severity.toUpperCase()}] ${issue.service}: ${issue.message}`);
      });
    }

    if (report.suggestions.length > 0) {
      console.log('\n--- Suggestions ---');
      report.suggestions.forEach((suggestion) => {
        console.log(`\n${suggestion.service} (${suggestion.type}, priority: ${suggestion.priority}):`);
        console.log(`  Reason: ${suggestion.reason}`);
        console.log('  Steps:');
        suggestion.steps.forEach((step, i) => {
          console.log(`    ${i + 1}. ${step}`);
        });
      });
    }

    console.log('\n=== Analysis Complete ===\n');
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  analyzeServiceIntegration().catch(console.error);
}

export { analyzeServiceIntegration };
