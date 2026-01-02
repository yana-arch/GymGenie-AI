import { execSync } from 'child_process';
import * as path from 'path';
import { BaseAnalyzer } from '../base/BaseAnalyzer';
import { AnalysisConfig } from '../config/AnalysisConfig';
import { ConfidenceLevel, CodeItem } from '../types';
import {
  DeadCodeReport,
  UnusedExport,
  UnusedFunction,
  UnusedVariable,
  UnusedType,
  RemovalPlan,
  RemovalAction,
  UnusedExportType,
} from './types';

/**
 * Knip issue type from Knip output
 */
interface KnipIssue {
  file: string;
  symbol: string;
  line: number;
  col: number;
  type: string;
  parentSymbol?: string;
}

/**
 * Knip output structure
 */
interface KnipOutput {
  files: string[];
  issues: KnipIssue[];
}

/**
 * Dead code analyzer using Knip
 */
export class DeadCodeAnalyzer extends BaseAnalyzer<DeadCodeReport> {
  constructor() {
    super('DeadCodeAnalyzer');
  }

  /**
   * Run dead code analysis using Knip
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<DeadCodeReport> {
    this.validateConfig(config);

    if (!config.deadCode.enabled) {
      return this.createEmptyReport();
    }

    try {
      // Run Knip to detect unused exports
      const knipOutput = await this.runKnip(config);

      // Parse Knip output
      const unusedExports = this.parseUnusedExports(knipOutput, config);
      const unusedFunctions = this.parseUnusedFunctions(knipOutput);
      const unusedVariables = this.parseUnusedVariables(knipOutput);
      const unusedTypes = this.parseUnusedTypes(knipOutput);

      // Calculate confidence level
      const confidence = this.calculateConfidence(config, unusedExports);

      // Create summary
      const filesAffected = new Set([
        ...unusedExports.map((e) => e.file),
        ...unusedFunctions.map((f) => f.file),
        ...unusedVariables.map((v) => v.file),
        ...unusedTypes.map((t) => t.file),
      ]).size;

      return {
        analyzer: this.name,
        timestamp: new Date(),
        duration: 0,
        success: true,
        unusedExports,
        unusedFunctions,
        unusedVariables,
        unusedTypes,
        confidence,
        summary: {
          totalUnusedExports: unusedExports.length,
          totalUnusedFunctions: unusedFunctions.length,
          totalUnusedVariables: unusedVariables.length,
          totalUnusedTypes: unusedTypes.length,
          filesAffected,
        },
      };
    } catch (error) {
      this.logger.error('Dead code analysis failed', error);
      throw error;
    }
  }

  /**
   * Run Knip command and parse output
   */
  private async runKnip(config: AnalysisConfig): Promise<KnipOutput> {
    try {
      // Run Knip with JSON reporter
      const command = 'npx knip --reporter json --include exports,types,nsExports,nsTypes';
      this.logger.info(`Running Knip: ${command}`);

      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Parse JSON output
      const result = JSON.parse(output);
      return this.normalizeKnipOutput(result);
    } catch (error: any) {
      // Knip exits with non-zero code when it finds issues
      // Try to parse the output anyway
      if (error.stdout) {
        try {
          const result = JSON.parse(error.stdout);
          return this.normalizeKnipOutput(result);
        } catch (parseError) {
          this.logger.warn('Failed to parse Knip output', parseError);
        }
      }

      this.logger.warn('Knip execution failed, returning empty results', error.message);
      return { files: [], issues: [] };
    }
  }

  /**
   * Normalize Knip output to consistent format
   */
  private normalizeKnipOutput(knipResult: any): KnipOutput {
    const issues: KnipIssue[] = [];
    const files: string[] = [];

    // Knip output structure varies, handle different formats
    if (knipResult.files) {
      files.push(...knipResult.files);
    }

    // Parse issues from different Knip output formats
    if (knipResult.issues) {
      issues.push(...knipResult.issues);
    } else if (Array.isArray(knipResult)) {
      // Handle array format
      for (const item of knipResult) {
        if (item.issues) {
          issues.push(...item.issues);
        }
      }
    } else {
      // Handle object format with file keys
      for (const [file, fileIssues] of Object.entries(knipResult)) {
        if (Array.isArray(fileIssues)) {
          for (const issue of fileIssues as any[]) {
            issues.push({
              file,
              symbol: issue.symbol || issue.name || '',
              line: issue.line || 0,
              col: issue.col || issue.column || 0,
              type: issue.type || 'export',
              parentSymbol: issue.parentSymbol,
            });
          }
        }
      }
    }

    return { files, issues };
  }

  /**
   * Parse unused exports from Knip output
   */
  private parseUnusedExports(
    knipOutput: KnipOutput,
    config: AnalysisConfig
  ): UnusedExport[] {
    const unusedExports: UnusedExport[] = [];
    const entryPoints = new Set(config.entryPoints);

    for (const issue of knipOutput.issues) {
      // Skip entry points
      if (this.isEntryPoint(issue.file, entryPoints)) {
        continue;
      }

      // Check if it's an export-related issue
      if (
        issue.type === 'exports' ||
        issue.type === 'nsExports' ||
        issue.type === 'export'
      ) {
        const potentialDynamicUsage = config.deadCode.checkDynamicImports
          ? this.checkDynamicUsage(issue.symbol, issue.file)
          : false;

        unusedExports.push({
          file: issue.file,
          name: issue.symbol,
          line: issue.line,
          column: issue.col,
          type: this.inferExportType(issue),
          exportType: issue.type === 'nsExports' ? 'default' : 'named',
          potentialDynamicUsage,
        });
      }
    }

    return unusedExports;
  }

  /**
   * Parse unused functions from Knip output
   */
  private parseUnusedFunctions(knipOutput: KnipOutput): UnusedFunction[] {
    const unusedFunctions: UnusedFunction[] = [];

    for (const issue of knipOutput.issues) {
      if (
        issue.type === 'exports' &&
        (issue.symbol.startsWith('function ') ||
          issue.symbol.includes('()') ||
          this.looksLikeFunction(issue.symbol))
      ) {
        unusedFunctions.push({
          file: issue.file,
          name: issue.symbol,
          line: issue.line,
          column: issue.col,
          isExported: true,
        });
      }
    }

    return unusedFunctions;
  }

  /**
   * Parse unused variables from Knip output
   */
  private parseUnusedVariables(knipOutput: KnipOutput): UnusedVariable[] {
    const unusedVariables: UnusedVariable[] = [];

    for (const issue of knipOutput.issues) {
      if (
        issue.type === 'exports' &&
        !this.looksLikeFunction(issue.symbol) &&
        !this.looksLikeType(issue.symbol)
      ) {
        unusedVariables.push({
          file: issue.file,
          name: issue.symbol,
          line: issue.line,
          column: issue.col,
          isExported: true,
          scope: 'module',
        });
      }
    }

    return unusedVariables;
  }

  /**
   * Parse unused types from Knip output
   */
  private parseUnusedTypes(knipOutput: KnipOutput): UnusedType[] {
    const unusedTypes: UnusedType[] = [];

    for (const issue of knipOutput.issues) {
      if (issue.type === 'types' || issue.type === 'nsTypes') {
        unusedTypes.push({
          file: issue.file,
          name: issue.symbol,
          line: issue.line,
          column: issue.col,
          kind: this.inferTypeKind(issue.symbol),
          isExported: true,
        });
      }
    }

    return unusedTypes;
  }

  /**
   * Check if file is an entry point
   */
  private isEntryPoint(file: string, entryPoints: Set<string>): boolean {
    const normalizedFile = path.normalize(file);
    for (const entryPoint of entryPoints) {
      const normalizedEntry = path.normalize(entryPoint);
      if (
        normalizedFile === normalizedEntry ||
        normalizedFile.endsWith(normalizedEntry)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if symbol might be used dynamically
   */
  private checkDynamicUsage(symbol: string, file: string): boolean {
    // Simple heuristic: check if symbol name suggests dynamic usage
    const dynamicPatterns = [
      /^use[A-Z]/, // React hooks
      /^handle[A-Z]/, // Event handlers
      /^on[A-Z]/, // Event handlers
      /Component$/, // React components
      /Provider$/, // Context providers
      /Context$/, // React contexts
    ];

    return dynamicPatterns.some((pattern) => pattern.test(symbol));
  }

  /**
   * Infer export type from issue
   */
  private inferExportType(issue: KnipIssue): UnusedExportType {
    const symbol = issue.symbol.toLowerCase();

    if (this.looksLikeType(issue.symbol)) {
      return 'type';
    }
    if (symbol.includes('class ') || /^[A-Z]/.test(issue.symbol)) {
      return 'class';
    }
    if (this.looksLikeFunction(issue.symbol)) {
      return 'function';
    }

    return 'variable';
  }

  /**
   * Check if symbol looks like a function
   */
  private looksLikeFunction(symbol: string): boolean {
    return (
      symbol.includes('()') ||
      symbol.startsWith('function ') ||
      /^[a-z][a-zA-Z0-9]*$/.test(symbol) // camelCase
    );
  }

  /**
   * Check if symbol looks like a type
   */
  private looksLikeType(symbol: string): boolean {
    return (
      /^[A-Z][a-zA-Z0-9]*$/.test(symbol) || // PascalCase
      symbol.includes('Type') ||
      symbol.includes('Interface') ||
      symbol.includes('Enum')
    );
  }

  /**
   * Infer type kind
   */
  private inferTypeKind(symbol: string): 'type' | 'interface' | 'enum' {
    if (symbol.includes('Enum') || symbol.toUpperCase() === symbol) {
      return 'enum';
    }
    if (symbol.startsWith('I') && /^I[A-Z]/.test(symbol)) {
      return 'interface';
    }
    return 'type';
  }

  /**
   * Calculate confidence level for analysis
   */
  private calculateConfidence(
    config: AnalysisConfig,
    unusedExports: UnusedExport[]
  ): ConfidenceLevel {
    // High confidence if:
    // - Dynamic import checking is enabled
    // - No potential dynamic usage detected
    const hasPotentialDynamicUsage = unusedExports.some(
      (e) => e.potentialDynamicUsage
    );

    if (config.deadCode.checkDynamicImports && !hasPotentialDynamicUsage) {
      return 'high';
    }

    if (!config.deadCode.checkDynamicImports) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Verify if code item is truly unused
   */
  public verifyUnused(item: CodeItem): boolean {
    // This is a placeholder for more sophisticated verification
    // In a real implementation, this would:
    // 1. Check for dynamic imports
    // 2. Check for string-based references
    // 3. Check for reflection usage
    // 4. Check for external references (e.g., from HTML)

    return !this.checkDynamicUsage(item.name, item.file);
  }

  /**
   * Generate removal plan from dead code report
   */
  public generateRemovalPlan(report: DeadCodeReport): RemovalPlan {
    const actions: RemovalAction[] = [];

    // Add removal actions for unused exports
    for (const unusedExport of report.unusedExports) {
      actions.push({
        file: unusedExport.file,
        line: unusedExport.line,
        name: unusedExport.name,
        type: unusedExport.type,
        reason: `Unused ${unusedExport.exportType} export`,
        autoExecutable: !unusedExport.potentialDynamicUsage,
      });
    }

    // Calculate estimated impact
    const filesAffected = new Set(actions.map((a) => a.file)).size;
    const exportsRemoved = actions.length;
    const linesRemoved = exportsRemoved * 3; // Rough estimate

    // Determine safety level
    const hasRiskyActions = actions.some((a) => !a.autoExecutable);
    const safetyLevel = hasRiskyActions
      ? 'review-needed'
      : report.confidence === 'high'
        ? 'safe'
        : 'review-needed';

    return {
      actions,
      estimatedImpact: {
        filesAffected,
        exportsRemoved,
        linesRemoved,
      },
      safetyLevel,
    };
  }

  /**
   * Create empty report when analysis is disabled
   */
  private createEmptyReport(): DeadCodeReport {
    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      unusedExports: [],
      unusedFunctions: [],
      unusedVariables: [],
      unusedTypes: [],
      confidence: 'high',
      summary: {
        totalUnusedExports: 0,
        totalUnusedFunctions: 0,
        totalUnusedVariables: 0,
        totalUnusedTypes: 0,
        filesAffected: 0,
      },
    };
  }
}
