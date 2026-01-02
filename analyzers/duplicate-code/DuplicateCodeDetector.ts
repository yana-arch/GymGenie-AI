import { execSync } from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { BaseAnalyzer } from '../base/BaseAnalyzer';
import { AnalysisConfig } from '../config/AnalysisConfig';
import {
  DuplicateCodeReport,
  DuplicateConfig,
  DuplicateGroup,
  CodeBlock,
  RefactoringSuggestion,
  ImpactLevel,
  Priority,
  RefactoringType,
} from './types';

/**
 * jscpd output format
 */
interface JscpdClone {
  format: string;
  lines: number;
  tokens: number;
  firstFile: {
    name: string;
    start: number;
    end: number;
    startLoc: { line: number; column: number };
    endLoc: { line: number; column: number };
  };
  secondFile: {
    name: string;
    start: number;
    end: number;
    startLoc: { line: number; column: number };
    endLoc: { line: number; column: number };
  };
}

interface JscpdOutput {
  statistics: {
    clones: {
      [key: string]: JscpdClone[];
    };
  };
  duplicates: JscpdClone[];
}

/**
 * Duplicate code detector using jscpd
 */
export class DuplicateCodeDetector extends BaseAnalyzer<DuplicateCodeReport> {
  constructor() {
    super('DuplicateCodeDetector');
  }

  /**
   * Run duplicate code detection
   */
  protected async runAnalysis(config: AnalysisConfig): Promise<DuplicateCodeReport> {
    this.validateConfig(config);

    if (!config.duplicates.enabled) {
      return this.createEmptyReport(config.duplicates);
    }

    try {
      // Run jscpd to detect duplicates
      const jscpdOutput = await this.runJscpd(config);

      // Parse jscpd output into code blocks
      const codeBlocks = this.parseCodeBlocks(jscpdOutput);

      // Group duplicates by similarity
      const duplicateGroups = this.groupDuplicates(codeBlocks, config.duplicates);

      // Generate refactoring suggestions for each group
      for (const group of duplicateGroups) {
        group.suggestedRefactoring = this.generateRefactoringSuggestion(group);
      }

      // Calculate summary statistics
      const summary = this.calculateSummary(duplicateGroups);

      return {
        analyzer: this.name,
        timestamp: new Date(),
        duration: 0,
        success: true,
        duplicates: duplicateGroups,
        config: config.duplicates,
        summary,
      };
    } catch (error) {
      this.logger.error('Duplicate code detection failed', error);
      throw error;
    }
  }

  /**
   * Run jscpd command and parse output
   */
  private async runJscpd(config: AnalysisConfig): Promise<JscpdOutput> {
    try {
      const outputPath = path.join(process.cwd(), '.jscpd-report.json');

      // Build jscpd command
      const command = [
        'npx jscpd',
        '--min-lines', config.duplicates.minLines.toString(),
        '--min-tokens', config.duplicates.minTokens.toString(),
        '--threshold', (config.duplicates.similarityThreshold * 100).toString(),
        '--reporters', 'json',
        '--output', outputPath,
        '--format', 'typescript,javascript,tsx,jsx',
        ...config.include.map(p => `"${p}"`),
      ].join(' ');

      this.logger.info(`Running jscpd: ${command}`);

      try {
        execSync(command, {
          encoding: 'utf-8',
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          stdio: 'pipe',
        });
      } catch (error: any) {
        // jscpd may exit with non-zero code even on success
        this.logger.warn('jscpd command exited with non-zero code, checking output');
      }

      // Read the output file
      if (fs.existsSync(outputPath)) {
        const output = fs.readFileSync(outputPath, 'utf-8');
        const result = JSON.parse(output);
        
        // Clean up output file
        fs.unlinkSync(outputPath);
        
        return this.normalizeJscpdOutput(result);
      }

      this.logger.warn('jscpd output file not found, returning empty results');
      return { statistics: { clones: {} }, duplicates: [] };
    } catch (error: any) {
      this.logger.warn('jscpd execution failed, returning empty results', error.message);
      return { statistics: { clones: {} }, duplicates: [] };
    }
  }

  /**
   * Normalize jscpd output to consistent format
   */
  private normalizeJscpdOutput(jscpdResult: any): JscpdOutput {
    const duplicates: JscpdClone[] = [];

    // jscpd output structure varies, handle different formats
    if (jscpdResult.duplicates && Array.isArray(jscpdResult.duplicates)) {
      duplicates.push(...jscpdResult.duplicates);
    } else if (jscpdResult.statistics?.clones) {
      // Extract clones from statistics
      for (const clones of Object.values(jscpdResult.statistics.clones)) {
        if (Array.isArray(clones)) {
          duplicates.push(...clones);
        }
      }
    }

    return {
      statistics: jscpdResult.statistics || { clones: {} },
      duplicates,
    };
  }

  /**
   * Parse code blocks from jscpd output
   */
  private parseCodeBlocks(jscpdOutput: JscpdOutput): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const seenBlocks = new Set<string>();

    for (const clone of jscpdOutput.duplicates) {
      // Add first file block
      const block1 = this.createCodeBlock(clone.firstFile, clone);
      const hash1 = this.hashCodeBlock(block1);
      if (!seenBlocks.has(hash1)) {
        blocks.push({ ...block1, hash: hash1 });
        seenBlocks.add(hash1);
      }

      // Add second file block
      const block2 = this.createCodeBlock(clone.secondFile, clone);
      const hash2 = this.hashCodeBlock(block2);
      if (!seenBlocks.has(hash2)) {
        blocks.push({ ...block2, hash: hash2 });
        seenBlocks.add(hash2);
      }
    }

    return blocks;
  }

  /**
   * Create code block from jscpd file info
   */
  private createCodeBlock(
    fileInfo: JscpdClone['firstFile'] | JscpdClone['secondFile'],
    clone: JscpdClone
  ): Omit<CodeBlock, 'hash'> {
    // Read the actual code from the file
    let code = '';
    try {
      const fullPath = path.resolve(process.cwd(), fileInfo.name);
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const lines = fileContent.split('\n');
        code = lines
          .slice(fileInfo.startLoc.line - 1, fileInfo.endLoc.line)
          .join('\n');
      }
    } catch (error) {
      this.logger.warn(`Failed to read code from ${fileInfo.name}`, error);
    }

    return {
      file: fileInfo.name,
      line: fileInfo.startLoc.line,
      column: fileInfo.startLoc.column,
      endLine: fileInfo.endLoc.line,
      code,
      tokens: clone.tokens,
    };
  }

  /**
   * Hash a code block for deduplication
   */
  private hashCodeBlock(block: Omit<CodeBlock, 'hash'>): string {
    const content = `${block.file}:${block.line}:${block.endLine}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Calculate similarity between two code blocks
   */
  public calculateSimilarity(block1: CodeBlock, block2: CodeBlock): number {
    // Use token-based similarity
    const tokens1 = block1.tokens;
    const tokens2 = block2.tokens;
    
    if (tokens1 === 0 || tokens2 === 0) {
      return 0;
    }

    // Simple similarity: ratio of common tokens
    const minTokens = Math.min(tokens1, tokens2);
    const maxTokens = Math.max(tokens1, tokens2);
    
    return minTokens / maxTokens;
  }

  /**
   * Group duplicate code blocks
   */
  private groupDuplicates(
    blocks: CodeBlock[],
    config: DuplicateConfig
  ): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const grouped = new Set<string>();

    // Group blocks by similarity
    for (let i = 0; i < blocks.length; i++) {
      if (grouped.has(blocks[i].hash)) continue;

      const group: CodeBlock[] = [blocks[i]];
      grouped.add(blocks[i].hash);

      // Find similar blocks
      for (let j = i + 1; j < blocks.length; j++) {
        if (grouped.has(blocks[j].hash)) continue;

        const similarity = this.calculateSimilarity(blocks[i], blocks[j]);
        if (similarity >= config.similarityThreshold) {
          group.push(blocks[j]);
          grouped.add(blocks[j].hash);
        }
      }

      // Only create group if we have duplicates (2+ instances)
      if (group.length >= 2) {
        const avgSimilarity = this.calculateAverageSimilarity(group);
        const impact = this.calculateImpact(group);
        const linesTotal = group.reduce(
          (sum, block) => sum + (block.endLine - block.line + 1),
          0
        );

        groups.push({
          id: crypto.randomUUID(),
          instances: group,
          similarity: avgSimilarity,
          impact,
          suggestedRefactoring: {} as RefactoringSuggestion, // Will be filled later
          linesTotal,
          occurrences: group.length,
        });
      }
    }

    // Sort by impact (high first) and then by occurrences
    groups.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
      if (impactDiff !== 0) return impactDiff;
      return b.occurrences - a.occurrences;
    });

    return groups;
  }

  /**
   * Calculate average similarity for a group
   */
  private calculateAverageSimilarity(blocks: CodeBlock[]): number {
    if (blocks.length < 2) return 1.0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        totalSimilarity += this.calculateSimilarity(blocks[i], blocks[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Calculate impact level for duplicate group
   */
  private calculateImpact(blocks: CodeBlock[]): ImpactLevel {
    const occurrences = blocks.length;
    const avgLines = blocks.reduce(
      (sum, block) => sum + (block.endLine - block.line + 1),
      0
    ) / blocks.length;

    // High impact: 3+ occurrences or large blocks
    if (occurrences >= 3 || avgLines >= 20) {
      return 'high';
    }

    // Medium impact: 2 occurrences with moderate size
    if (occurrences === 2 && avgLines >= 10) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate refactoring suggestion for duplicate group
   */
  private generateRefactoringSuggestion(group: DuplicateGroup): RefactoringSuggestion {
    const { instances, impact, linesTotal, occurrences } = group;

    // Determine refactoring type based on file patterns
    const type = this.determineRefactoringType(instances);

    // Calculate estimated impact (lines saved)
    const avgLines = linesTotal / occurrences;
    const estimatedImpact = Math.floor(avgLines * (occurrences - 1));

    // Determine priority based on impact
    const priority = this.determinePriority(impact, occurrences);

    // Suggest target location
    const targetLocation = this.suggestTargetLocation(instances, type);

    // Get affected files
    const affectedFiles = [...new Set(instances.map(block => block.file))];

    // Generate description
    const description = this.generateRefactoringDescription(
      type,
      occurrences,
      avgLines,
      estimatedImpact
    );

    return {
      type,
      targetLocation,
      estimatedImpact,
      priority,
      description,
      affectedFiles,
    };
  }

  /**
   * Determine refactoring type based on code patterns
   */
  private determineRefactoringType(instances: CodeBlock[]): RefactoringType {
    const files = instances.map(block => block.file);
    const hasReactComponent = files.some(f => 
      f.includes('component') || f.endsWith('.tsx')
    );
    const hasHook = instances.some(block => 
      block.code.includes('use') && block.code.includes('useState')
    );
    const hasUtility = files.some(f => 
      f.includes('util') || f.includes('helper')
    );

    if (hasReactComponent && instances[0].code.includes('return')) {
      return 'extract-component';
    }
    if (hasHook) {
      return 'extract-hook';
    }
    if (hasUtility) {
      return 'extract-utility';
    }

    return 'extract-function';
  }

  /**
   * Determine priority based on impact and occurrences
   */
  private determinePriority(impact: ImpactLevel, occurrences: number): Priority {
    if (impact === 'high' || occurrences >= 4) {
      return 'high';
    }
    if (impact === 'medium' || occurrences === 3) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Suggest target location for refactored code
   */
  private suggestTargetLocation(
    instances: CodeBlock[],
    type: RefactoringType
  ): string {
    const files = instances.map(block => block.file);
    const commonPath = this.findCommonPath(files);

    switch (type) {
      case 'extract-component':
        return path.join(commonPath, 'components', 'shared');
      case 'extract-hook':
        return path.join(commonPath, 'hooks');
      case 'extract-utility':
        return path.join(commonPath, 'utils');
      case 'extract-function':
      default:
        return path.join(commonPath, 'utils', 'helpers.ts');
    }
  }

  /**
   * Find common path among files
   */
  private findCommonPath(files: string[]): string {
    if (files.length === 0) return '';
    if (files.length === 1) return path.dirname(files[0]);

    const paths = files.map(f => f.split(path.sep));
    const commonParts: string[] = [];

    for (let i = 0; i < paths[0].length; i++) {
      const part = paths[0][i];
      if (paths.every(p => p[i] === part)) {
        commonParts.push(part);
      } else {
        break;
      }
    }

    return commonParts.join(path.sep) || '.';
  }

  /**
   * Generate refactoring description
   */
  private generateRefactoringDescription(
    type: RefactoringType,
    occurrences: number,
    avgLines: number,
    estimatedImpact: number
  ): string {
    const typeDescriptions = {
      'extract-component': 'Extract duplicate JSX into a reusable component',
      'extract-hook': 'Extract duplicate React hook logic into a custom hook',
      'extract-utility': 'Extract duplicate utility logic into a shared function',
      'extract-function': 'Extract duplicate code into a shared function',
    };

    return `${typeDescriptions[type]}. Found ${occurrences} occurrences averaging ${Math.round(avgLines)} lines each. Refactoring could save approximately ${estimatedImpact} lines of code.`;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(groups: DuplicateGroup[]) {
    const filesAffected = new Set<string>();
    let linesDuplicated = 0;
    let potentialLinesSaved = 0;
    let highImpactCount = 0;

    for (const group of groups) {
      group.instances.forEach(block => filesAffected.add(block.file));
      linesDuplicated += group.linesTotal;
      potentialLinesSaved += group.suggestedRefactoring.estimatedImpact;
      if (group.impact === 'high') {
        highImpactCount++;
      }
    }

    return {
      totalDuplicates: groups.length,
      totalInstances: groups.reduce((sum, g) => sum + g.occurrences, 0),
      filesAffected: filesAffected.size,
      linesDuplicated,
      potentialLinesSaved,
      highImpactCount,
    };
  }

  /**
   * Create empty report when analysis is disabled
   */
  private createEmptyReport(config: DuplicateConfig): DuplicateCodeReport {
    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      duplicates: [],
      config,
      summary: {
        totalDuplicates: 0,
        totalInstances: 0,
        filesAffected: 0,
        linesDuplicated: 0,
        potentialLinesSaved: 0,
        highImpactCount: 0,
      },
    };
  }
}
