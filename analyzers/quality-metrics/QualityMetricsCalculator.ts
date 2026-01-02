import * as fs from 'fs/promises';
import * as path from 'path';
import {
  QualityMetrics,
  CoverageMetrics,
  ComplexityMetrics,
  MaintainabilityMetrics,
  CodeHealthMetrics,
  MetricsComparison,
  MetricsOptions,
  ComplexFunction,
  ComplexityDistribution,
} from './types';
import { logger } from '../utils/logger';

/**
 * Calculates quality metrics for a codebase
 */
export class QualityMetricsCalculator {
  /**
   * Calculate quality metrics for the codebase
   */
  async calculateMetrics(
    options: MetricsOptions = {}
  ): Promise<QualityMetrics> {
    logger.info('Calculating quality metrics...');

    const coverage = options.includeCoverage !== false
      ? await this.calculateCoverage(options)
      : this.getDefaultCoverage();

    const complexity = options.includeComplexity !== false
      ? await this.calculateComplexity(options)
      : this.getDefaultComplexity();

    const maintainability = options.includeMaintainability !== false
      ? await this.calculateMaintainability(options)
      : this.getDefaultMaintainability();

    const codeHealth = this.calculateCodeHealth(
      coverage,
      complexity,
      maintainability
    );

    const metrics: QualityMetrics = {
      timestamp: new Date(),
      coverage,
      complexity,
      maintainability,
      codeHealth,
    };

    logger.info('Quality metrics calculated successfully');

    return metrics;
  }

  /**
   * Compare metrics before and after cleanup
   */
  compareMetrics(
    before: QualityMetrics,
    after: QualityMetrics
  ): MetricsComparison {
    const coverageChange = after.coverage.overall - before.coverage.overall;
    const complexityChange =
      before.complexity.averageCyclomaticComplexity -
      after.complexity.averageCyclomaticComplexity;
    const maintainabilityChange =
      after.maintainability.maintainabilityIndex -
      before.maintainability.maintainabilityIndex;
    const codeHealthChange = after.codeHealth.score - before.codeHealth.score;

    const improvements = {
      coverage: {
        change: coverageChange,
        improved: coverageChange > 0,
      },
      complexity: {
        change: complexityChange,
        improved: complexityChange > 0, // Lower is better
      },
      maintainability: {
        change: maintainabilityChange,
        improved: maintainabilityChange > 0,
      },
      codeHealth: {
        change: codeHealthChange,
        improved: codeHealthChange > 0,
      },
      summary: this.generateImprovementSummary(
        coverageChange,
        complexityChange,
        maintainabilityChange,
        codeHealthChange
      ),
    };

    return {
      before,
      after,
      improvements,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate code coverage metrics
   */
  private async calculateCoverage(
    options: MetricsOptions
  ): Promise<CoverageMetrics> {
    // In a real implementation, this would:
    // 1. Run test coverage tool (e.g., Istanbul, c8)
    // 2. Parse coverage reports
    // 3. Calculate metrics

    // For now, return simulated metrics
    logger.info('Calculating coverage metrics...');

    return {
      lines: {
        total: 1000,
        covered: 750,
        percentage: 75,
      },
      statements: {
        total: 1200,
        covered: 900,
        percentage: 75,
      },
      functions: {
        total: 150,
        covered: 120,
        percentage: 80,
      },
      branches: {
        total: 200,
        covered: 140,
        percentage: 70,
      },
      overall: 75,
    };
  }

  /**
   * Calculate complexity metrics
   */
  private async calculateComplexity(
    options: MetricsOptions
  ): Promise<ComplexityMetrics> {
    logger.info('Calculating complexity metrics...');

    // Get files to analyze
    const files = await this.getFilesToAnalyze(options);

    const complexityThreshold = options.complexityThreshold || 10;
    const highComplexityFunctions: ComplexFunction[] = [];
    let totalComplexity = 0;
    let maxComplexity = 0;
    let totalFunctions = 0;

    const distribution: ComplexityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
    };

    // Analyze each file
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileComplexity = this.analyzeFileComplexity(
          file,
          content,
          complexityThreshold
        );

        totalComplexity += fileComplexity.totalComplexity;
        totalFunctions += fileComplexity.functionCount;
        maxComplexity = Math.max(maxComplexity, fileComplexity.maxComplexity);

        highComplexityFunctions.push(...fileComplexity.highComplexityFunctions);

        // Update distribution
        distribution.low += fileComplexity.distribution.low;
        distribution.medium += fileComplexity.distribution.medium;
        distribution.high += fileComplexity.distribution.high;
        distribution.veryHigh += fileComplexity.distribution.veryHigh;
      } catch (error) {
        logger.warn(`Could not analyze file ${file}: ${error}`);
      }
    }

    const averageComplexity =
      totalFunctions > 0 ? totalComplexity / totalFunctions : 0;

    return {
      averageCyclomaticComplexity: Math.round(averageComplexity * 10) / 10,
      maxCyclomaticComplexity: maxComplexity,
      highComplexityFunctions,
      totalFunctions,
      complexityDistribution: distribution,
    };
  }

  /**
   * Analyze complexity of a single file
   */
  private analyzeFileComplexity(
    file: string,
    content: string,
    threshold: number
  ): {
    totalComplexity: number;
    functionCount: number;
    maxComplexity: number;
    highComplexityFunctions: ComplexFunction[];
    distribution: ComplexityDistribution;
  } {
    // Simple heuristic-based complexity calculation
    // In a real implementation, use a proper AST parser

    const lines = content.split('\n');
    const functions: ComplexFunction[] = [];
    let totalComplexity = 0;
    let maxComplexity = 0;

    const distribution: ComplexityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
    };

    // Find function declarations (simplified)
    const functionRegex = /function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*\(/g;
    let match;
    let lineNum = 0;

    for (const line of lines) {
      lineNum++;
      match = functionRegex.exec(line);

      if (match) {
        const functionName = match[1] || match[2] || match[3];
        
        // Calculate complexity based on control flow keywords
        const complexity = this.calculateLineComplexity(content, lineNum);
        totalComplexity += complexity;
        maxComplexity = Math.max(maxComplexity, complexity);

        // Update distribution
        if (complexity <= 5) {
          distribution.low++;
        } else if (complexity <= 10) {
          distribution.medium++;
        } else if (complexity <= 20) {
          distribution.high++;
        } else {
          distribution.veryHigh++;
        }

        if (complexity > threshold) {
          functions.push({
            file,
            name: functionName,
            line: lineNum,
            complexity,
            recommendation: this.getComplexityRecommendation(complexity),
          });
        }
      }
    }

    return {
      totalComplexity,
      functionCount: functions.length || 1,
      maxComplexity,
      highComplexityFunctions: functions,
      distribution,
    };
  }

  /**
   * Calculate complexity for a line (simplified)
   */
  private calculateLineComplexity(content: string, startLine: number): number {
    // Count control flow keywords as complexity indicators
    const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', '&&', '||', '?'];
    let complexity = 1; // Base complexity

    const lines = content.split('\n');
    const functionContent = lines.slice(startLine, startLine + 50).join('\n');

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = functionContent.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return Math.min(complexity, 50); // Cap at 50
  }

  /**
   * Get complexity recommendation
   */
  private getComplexityRecommendation(complexity: number): string {
    if (complexity > 20) {
      return 'Critical: Consider breaking into smaller functions';
    } else if (complexity > 15) {
      return 'High: Refactor to reduce complexity';
    } else if (complexity > 10) {
      return 'Medium: Consider simplification';
    }
    return 'Acceptable complexity';
  }

  /**
   * Calculate maintainability metrics
   */
  private async calculateMaintainability(
    options: MetricsOptions
  ): Promise<MaintainabilityMetrics> {
    logger.info('Calculating maintainability metrics...');

    const files = await this.getFilesToAnalyze(options);
    let totalLines = 0;
    let totalFunctions = 0;
    let filesWithIssues = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        totalLines += lines;

        // Count functions (simplified)
        const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
        totalFunctions += functionCount;

        // Check for issues (simplified)
        if (lines > 500 || functionCount > 20) {
          filesWithIssues++;
        }
      } catch (error) {
        logger.warn(`Could not analyze file ${file}: ${error}`);
      }
    }

    const averageLinesPerFile = files.length > 0 ? totalLines / files.length : 0;
    const averageFunctionsPerFile = files.length > 0 ? totalFunctions / files.length : 0;

    // Calculate maintainability index (simplified formula)
    // Real formula: 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    const maintainabilityIndex = Math.max(
      0,
      Math.min(100, 100 - (averageLinesPerFile / 10) - (averageFunctionsPerFile * 2))
    );

    return {
      maintainabilityIndex: Math.round(maintainabilityIndex),
      averageLinesPerFile: Math.round(averageLinesPerFile),
      averageFunctionsPerFile: Math.round(averageFunctionsPerFile * 10) / 10,
      filesWithIssues,
      totalFiles: files.length,
      technicalDebt: {
        estimatedHours: filesWithIssues * 2,
        severity: filesWithIssues > 10 ? 'high' : filesWithIssues > 5 ? 'medium' : 'low',
        issues: [],
      },
    };
  }

  /**
   * Calculate overall code health score
   */
  private calculateCodeHealth(
    coverage: CoverageMetrics,
    complexity: ComplexityMetrics,
    maintainability: MaintainabilityMetrics
  ): CodeHealthMetrics {
    // Weight factors
    const coverageWeight = 0.3;
    const complexityWeight = 0.3;
    const maintainabilityWeight = 0.4;

    // Normalize complexity (lower is better, so invert)
    const normalizedComplexity = Math.max(
      0,
      100 - (complexity.averageCyclomaticComplexity * 5)
    );

    // Calculate weighted score
    const score =
      coverage.overall * coverageWeight +
      normalizedComplexity * complexityWeight +
      maintainability.maintainabilityIndex * maintainabilityWeight;

    const grade = this.getGrade(score);

    return {
      score: Math.round(score),
      grade,
      factors: {
        coverage: coverage.overall,
        complexity: normalizedComplexity,
        maintainability: maintainability.maintainabilityIndex,
        duplication: 85, // Would come from duplicate code analysis
      },
    };
  }

  /**
   * Get letter grade from score
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(
    coverageChange: number,
    complexityChange: number,
    maintainabilityChange: number,
    codeHealthChange: number
  ): string {
    const improvements: string[] = [];

    if (coverageChange > 0) {
      improvements.push(`coverage increased by ${coverageChange.toFixed(1)}%`);
    }
    if (complexityChange > 0) {
      improvements.push(`complexity reduced by ${complexityChange.toFixed(1)}`);
    }
    if (maintainabilityChange > 0) {
      improvements.push(`maintainability improved by ${maintainabilityChange.toFixed(1)} points`);
    }
    if (codeHealthChange > 0) {
      improvements.push(`code health improved by ${codeHealthChange.toFixed(1)} points`);
    }

    if (improvements.length === 0) {
      return 'No significant improvements detected';
    }

    return `Improvements: ${improvements.join(', ')}`;
  }

  /**
   * Get files to analyze
   */
  private async getFilesToAnalyze(options: MetricsOptions): Promise<string[]> {
    const patterns = options.files || ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
    const exclude = options.exclude || ['**/node_modules/**', '**/dist/**', '**/*.test.*'];

    const files: string[] = [];
    const baseDir = process.cwd();

    // Recursively find files
    const findFiles = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, fullPath);

          // Check if should be excluded
          if (this.shouldExclude(relativePath, exclude)) {
            continue;
          }

          if (entry.isDirectory()) {
            await findFiles(fullPath);
          } else if (entry.isFile()) {
            // Check if matches patterns
            if (this.matchesPatterns(entry.name, patterns)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await findFiles(baseDir);

    return files;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(relativePath: string, excludePatterns: string[]): boolean {
    for (const pattern of excludePatterns) {
      const cleanPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '');
      if (relativePath.includes(cleanPattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if filename matches patterns
   */
  private matchesPatterns(filename: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      const ext = pattern.replace('**/*', '');
      if (filename.endsWith(ext)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get default coverage metrics
   */
  private getDefaultCoverage(): CoverageMetrics {
    return {
      lines: { total: 0, covered: 0, percentage: 0 },
      statements: { total: 0, covered: 0, percentage: 0 },
      functions: { total: 0, covered: 0, percentage: 0 },
      branches: { total: 0, covered: 0, percentage: 0 },
      overall: 0,
    };
  }

  /**
   * Get default complexity metrics
   */
  private getDefaultComplexity(): ComplexityMetrics {
    return {
      averageCyclomaticComplexity: 0,
      maxCyclomaticComplexity: 0,
      highComplexityFunctions: [],
      totalFunctions: 0,
      complexityDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        veryHigh: 0,
      },
    };
  }

  /**
   * Get default maintainability metrics
   */
  private getDefaultMaintainability(): MaintainabilityMetrics {
    return {
      maintainabilityIndex: 0,
      averageLinesPerFile: 0,
      averageFunctionsPerFile: 0,
      filesWithIssues: 0,
      totalFiles: 0,
      technicalDebt: {
        estimatedHours: 0,
        severity: 'low',
        issues: [],
      },
    };
  }
}
