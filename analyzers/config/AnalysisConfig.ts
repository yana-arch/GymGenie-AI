import { z } from 'zod';

/**
 * Confidence level for analysis results
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Dead code analysis configuration
 */
export const DeadCodeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  checkDynamicImports: z.boolean().default(true),
  confidenceThreshold: z.enum(['high', 'medium', 'low']).default('medium'),
});

/**
 * Unused imports analysis configuration
 */
export const UnusedImportsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoFix: z.boolean().default(false),
  preserveTypeImports: z.boolean().default(true),
});

/**
 * Duplicate code detection configuration
 */
export const DuplicatesConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minLines: z.number().min(1).default(5),
  minTokens: z.number().min(1).default(50),
  similarityThreshold: z.number().min(0).max(1).default(0.85),
});

/**
 * Orphaned files detection configuration
 */
export const OrphanedFilesConfigSchema = z.object({
  enabled: z.boolean().default(true),
  excludePatterns: z.array(z.string()).default([
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/vite.config.ts',
    '**/vitest.config.ts',
    '**/tailwind.config.js',
    '**/postcss.config.js',
  ]),
});

/**
 * Type optimization configuration
 */
export const TypeOptimizationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  suggestCentralization: z.boolean().default(true),
});

/**
 * Service analysis configuration
 */
export const ServiceAnalysisConfigSchema = z.object({
  enabled: z.boolean().default(true),
  checkIntegration: z.boolean().default(true),
});

/**
 * Flow validation configuration
 */
export const FlowValidationConfigSchema = z.object({
  enabled: z.boolean().default(true),
  enforceReduxPatterns: z.boolean().default(true),
  enforceServiceLayer: z.boolean().default(true),
});

/**
 * Dependency analysis configuration
 */
export const DependenciesConfigSchema = z.object({
  enabled: z.boolean().default(true),
  detectCircular: z.boolean().default(true),
  visualize: z.boolean().default(false),
});

/**
 * Main analysis configuration schema
 */
export const AnalysisConfigSchema = z.object({
  // Paths to analyze
  include: z.array(z.string()).default(['src/**/*.ts', 'src/**/*.tsx', '**/*.ts', '**/*.tsx']),
  exclude: z.array(z.string()).default([
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ]),

  // Entry points for dependency analysis
  entryPoints: z.array(z.string()).default([
    'index.tsx',
    'App.tsx',
    'vite.config.ts',
  ]),

  // Analysis options
  deadCode: DeadCodeConfigSchema,
  unusedImports: UnusedImportsConfigSchema,
  duplicates: DuplicatesConfigSchema,
  orphanedFiles: OrphanedFilesConfigSchema,
  typeOptimization: TypeOptimizationConfigSchema,
  serviceAnalysis: ServiceAnalysisConfigSchema,
  flowValidation: FlowValidationConfigSchema,
  dependencies: DependenciesConfigSchema,
});

/**
 * Analysis configuration type
 */
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;

/**
 * Partial analysis configuration for user input
 */
export type PartialAnalysisConfig = z.input<typeof AnalysisConfigSchema>;
