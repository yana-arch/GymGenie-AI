import { ESLint } from 'eslint';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAnalyzer } from '../base/BaseAnalyzer';
import { AnalysisConfig } from '../config/AnalysisConfig';
import { AnalysisError } from '../utils/errors';
import {
  UnusedImportsReport,
  UnusedImport,
  ImportCategory,
  AutoFixResult,
} from './types';

/**
 * ESLint message for unused imports
 */
interface ESLintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
  nodeType?: string;
  messageId?: string;
  endLine?: number;
  endColumn?: number;
}

/**
 * ESLint result for a file
 */
interface ESLintResult {
  filePath: string;
  messages: ESLintMessage[];
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;
  usedDeprecatedRules?: any[];
}

/**
 * Analyzer for detecting and fixing unused imports using ESLint
 */
export class UnusedImportAnalyzer extends BaseAnalyzer<UnusedImportsReport> {
  private eslint: ESLint;

  constructor() {
    super('UnusedImportAnalyzer');
    this.eslint = new ESLint({
      overrideConfigFile: '.eslintrc.json',
      fix: false, // We'll handle fixing separately
    });
  }

  /**
   * Run unused imports analysis
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<UnusedImportsReport> {
    this.validateConfig(config);

    if (!config.unusedImports.enabled) {
      return this.createEmptyReport();
    }

    try {
      // Get all TypeScript/JavaScript files to analyze
      const files = await this.getFilesToAnalyze(config);
      this.logger.info(`Analyzing ${files.length} files for unused imports`);

      // Scan all files
      const allUnusedImports: UnusedImport[] = [];
      for (const file of files) {
        const unusedImports = await this.scanFile(file, config);
        allUnusedImports.push(...unusedImports);
      }

      // Create summary
      const filesAffected = new Set(allUnusedImports.map((i) => i.file)).size;
      const autoFixable = allUnusedImports.filter((i) => i.canAutoFix).length;
      const typeOnlyImports = allUnusedImports.filter((i) => i.isTypeOnly).length;

      return {
        analyzer: this.name,
        timestamp: new Date(),
        duration: 0,
        success: true,
        unusedImports: allUnusedImports,
        summary: {
          totalUnusedImports: allUnusedImports.length,
          filesAffected,
          autoFixable,
          typeOnlyImports,
        },
      };
    } catch (error) {
      this.logger.error('Unused imports analysis failed', error);
      throw error;
    }
  }

  /**
   * Scan a single file for unused imports
   */
  public async scanFile(filePath: string, config?: AnalysisConfig): Promise<UnusedImport[]> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Run ESLint on the file
      const results = await this.eslint.lintText(content, {
        filePath,
      });

      if (results.length === 0) {
        return [];
      }

      const result = results[0];
      const unusedImports: UnusedImport[] = [];

      // Parse ESLint messages for unused imports
      for (const message of result.messages) {
        if (this.isUnusedImportMessage(message)) {
          const unusedImport = await this.parseUnusedImport(
            message,
            filePath,
            content,
            config
          );
          if (unusedImport) {
            unusedImports.push(unusedImport);
          }
        }
      }

      return unusedImports;
    } catch (error) {
      this.logger.warn(`Failed to scan file ${filePath}`, error);
      return [];
    }
  }

  /**
   * Check if ESLint message is about unused imports
   */
  private isUnusedImportMessage(message: ESLintMessage): boolean {
    if (!message.ruleId) {
      return false;
    }

    // Check for unused variable rules that apply to imports
    const unusedRules = [
      '@typescript-eslint/no-unused-vars',
      'no-unused-vars',
    ];

    if (!unusedRules.includes(message.ruleId)) {
      return false;
    }

    // Check if the message is about an import
    return (
      message.message.includes('is defined but never used') ||
      message.message.includes('imported but never used')
    );
  }

  /**
   * Parse unused import from ESLint message
   */
  private async parseUnusedImport(
    message: ESLintMessage,
    filePath: string,
    content: string,
    config?: AnalysisConfig
  ): Promise<UnusedImport | null> {
    try {
      // Extract import name from message
      const importName = this.extractImportName(message.message);
      if (!importName) {
        return null;
      }

      // Find the import statement in the file
      const lines = content.split('\n');
      const importInfo = this.findImportStatement(lines, importName, message.line);

      if (!importInfo) {
        return null;
      }

      // Categorize the import
      const category = this.categorizeImport(importInfo.statement, importName);

      // Check if it's type-only
      const isTypeOnly = this.isTypeOnlyImport(importInfo.statement);

      // Determine if we should preserve it
      const shouldPreserve =
        config?.unusedImports.preserveTypeImports && isTypeOnly;

      // Check if it can be auto-fixed
      const canAutoFix = !shouldPreserve && this.canAutoFixImport(importInfo.statement);

      // Resolve import path (handle path aliases)
      const importPath = this.resolveImportPath(
        importInfo.importPath,
        filePath,
        config
      );

      return {
        file: filePath,
        line: message.line,
        column: message.column,
        importName,
        importPath,
        isTypeOnly,
        isNamedImport: importInfo.isNamed,
        canAutoFix,
        category,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse unused import from message`, error);
      return null;
    }
  }

  /**
   * Extract import name from ESLint message
   */
  private extractImportName(message: string): string | null {
    // Match patterns like "'importName' is defined but never used"
    const match = message.match(/['"]([^'"]+)['"]\s+is\s+(?:defined|imported)/);
    return match ? match[1] : null;
  }

  /**
   * Find import statement in file content
   */
  private findImportStatement(
    lines: string[],
    importName: string,
    startLine: number
  ): {
    statement: string;
    importPath: string;
    isNamed: boolean;
  } | null {
    // Search around the reported line
    const searchStart = Math.max(0, startLine - 5);
    const searchEnd = Math.min(lines.length, startLine + 5);

    for (let i = searchStart; i < searchEnd; i++) {
      const line = lines[i];

      // Check if this line contains an import statement with the import name
      if (line.includes('import') && line.includes(importName)) {
        // Extract import path
        const pathMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        const importPath = pathMatch ? pathMatch[1] : '';

        // Determine if it's a named import
        const isNamed = line.includes('{') && line.includes('}');

        // Get full import statement (might span multiple lines)
        let statement = line;
        let j = i;
        while (!statement.includes(';') && !statement.includes('\n') && j < lines.length - 1) {
          j++;
          statement += ' ' + lines[j];
        }

        return {
          statement: statement.trim(),
          importPath,
          isNamed,
        };
      }
    }

    return null;
  }

  /**
   * Categorize import type
   */
  public categorizeImport(statement: string, importName: string): ImportCategory {
    // Check for side-effect imports (no bindings)
    if (statement.match(/^import\s+['"]/) && !statement.includes('from')) {
      return 'side-effect';
    }

    // Check for type-only imports
    if (statement.includes('import type') || statement.includes('type ' + importName)) {
      return 'type';
    }

    // Check if it's used as both value and type
    // This is a simplified check - in reality, we'd need full AST analysis
    if (statement.includes('typeof')) {
      return 'both';
    }

    // Default to value import
    return 'value';
  }

  /**
   * Check if import is type-only
   */
  private isTypeOnlyImport(statement: string): boolean {
    return (
      statement.includes('import type') ||
      statement.match(/import\s+{\s*type\s+/) !== null
    );
  }

  /**
   * Check if import can be auto-fixed
   */
  private canAutoFixImport(statement: string): boolean {
    // Can auto-fix if it's a simple import statement
    // Avoid auto-fixing complex multi-line imports or imports with comments
    return (
      !statement.includes('//') &&
      !statement.includes('/*') &&
      statement.split('\n').length <= 2
    );
  }

  /**
   * Resolve import path (handle TypeScript path aliases)
   */
  public resolveImportPath(
    importPath: string,
    filePath: string,
    config?: AnalysisConfig
  ): string {
    // Handle @/ path alias
    if (importPath.startsWith('@/')) {
      // @/ maps to project root
      const projectRoot = process.cwd();
      const resolvedPath = importPath.replace('@/', '');
      return path.join(projectRoot, resolvedPath);
    }

    // Handle relative paths
    if (importPath.startsWith('.')) {
      const fileDir = path.dirname(filePath);
      return path.resolve(fileDir, importPath);
    }

    // Return as-is for node_modules imports
    return importPath;
  }

  /**
   * Auto-fix unused imports in a file
   */
  public async autoFix(file: string, imports: UnusedImport[]): Promise<AutoFixResult> {
    try {
      // Read file content
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      // Sort imports by line number (descending) to avoid line number shifts
      const sortedImports = [...imports].sort((a, b) => b.line - a.line);

      let importsRemoved = 0;

      for (const unusedImport of sortedImports) {
        if (!unusedImport.canAutoFix) {
          continue;
        }

        // Find and remove the import
        const lineIndex = unusedImport.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];

          if (unusedImport.isNamedImport) {
            // For named imports, remove just the specific import
            const removed = this.removeNamedImport(lines, lineIndex, unusedImport.importName);
            if (removed) {
              importsRemoved++;
            }
          } else {
            // For default imports, remove the entire line
            lines.splice(lineIndex, 1);
            importsRemoved++;
          }
        }
      }

      // Write back to file
      const newContent = lines.join('\n');
      await fs.writeFile(file, newContent, 'utf-8');

      return {
        file,
        success: true,
        importsRemoved,
      };
    } catch (error) {
      return {
        file,
        success: false,
        importsRemoved: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove a named import from an import statement
   */
  private removeNamedImport(
    lines: string[],
    lineIndex: number,
    importName: string
  ): boolean {
    const line = lines[lineIndex];

    // Extract the imports section
    const match = line.match(/import\s+{([^}]+)}\s+from/);
    if (!match) {
      return false;
    }

    const importsSection = match[1];
    const imports = importsSection.split(',').map((i) => i.trim());

    // Remove the specific import
    const filteredImports = imports.filter((i) => {
      const importNameMatch = i.match(/(?:type\s+)?(\w+)/);
      return importNameMatch && importNameMatch[1] !== importName;
    });

    if (filteredImports.length === 0) {
      // Remove entire import statement if no imports left
      lines.splice(lineIndex, 1);
    } else {
      // Update the import statement
      const newImportsSection = filteredImports.join(', ');
      lines[lineIndex] = line.replace(
        /import\s+{[^}]+}\s+from/,
        `import { ${newImportsSection} } from`
      );
    }

    return true;
  }

  /**
   * Get files to analyze based on configuration
   */
  private async getFilesToAnalyze(config: AnalysisConfig): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of config.include) {
      const matchedFiles = await this.findFiles(pattern, config.exclude);
      files.push(...matchedFiles);
    }

    // Filter for TypeScript/JavaScript files
    return files.filter((file) =>
      /\.(ts|tsx|js|jsx)$/.test(file) && !file.includes('node_modules')
    );
  }

  /**
   * Find files matching a pattern
   */
  private async findFiles(pattern: string, exclude: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const stats = await fs.stat(pattern);

      if (stats.isFile()) {
        files.push(pattern);
      } else if (stats.isDirectory()) {
        const dirFiles = await this.scanDirectory(pattern, exclude);
        files.push(...dirFiles);
      }
    } catch (error) {
      this.logger.warn(`Failed to find files for pattern ${pattern}`, error);
    }

    return files;
  }

  /**
   * Recursively scan directory for files
   */
  private async scanDirectory(dir: string, exclude: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Check if path should be excluded
        if (this.shouldExclude(fullPath, exclude)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, exclude);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to scan directory ${dir}`, error);
    }

    return files;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(filePath: string, exclude: string[]): boolean {
    for (const pattern of exclude) {
      if (filePath.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Create empty report when analysis is disabled
   */
  private createEmptyReport(): UnusedImportsReport {
    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      unusedImports: [],
      summary: {
        totalUnusedImports: 0,
        filesAffected: 0,
        autoFixable: 0,
        typeOnlyImports: 0,
      },
    };
  }
}
