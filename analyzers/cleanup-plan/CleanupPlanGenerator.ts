import { v4 as uuidv4 } from 'uuid';
import { CleanupAction, ImpactEstimate, ActionType } from '../types';
import {
  CleanupPlan,
  ComprehensiveAnalysisReport,
  CleanupPlanOptions,
  SafetyLevel,
  ActionDependency,
  ActionGenerationResult,
} from './types';
import { DeadCodeReport } from '../dead-code/types';
import { DuplicateCodeReport } from '../duplicate-code/types';
import { OrphanedFilesReport } from '../orphaned-files/types';

/**
 * Generates cleanup plans from analysis reports
 */
export class CleanupPlanGenerator {
  /**
   * Generate a cleanup plan from analysis reports
   */
  async generatePlan(
    analysisReport: ComprehensiveAnalysisReport,
    options: CleanupPlanOptions = {}
  ): Promise<CleanupPlan> {
    const startTime = Date.now();

    // Generate actions from all analysis reports
    const actionResult = this.generateActions(analysisReport, options);

    // Resolve action dependencies
    const orderedActions = this.resolveDependencies(
      actionResult.actions,
      actionResult.dependencies
    );

    // Calculate estimated impact
    const estimatedImpact = this.calculateImpact(orderedActions);

    // Determine overall safety level
    const safetyLevel = this.calculateSafetyLevel(orderedActions);

    const plan: CleanupPlan = {
      id: uuidv4(),
      createdAt: new Date(),
      analysisReport,
      actions: orderedActions,
      estimatedImpact,
      safetyLevel,
    };

    return plan;
  }

  /**
   * Generate cleanup actions from analysis reports
   */
  private generateActions(
    report: ComprehensiveAnalysisReport,
    options: CleanupPlanOptions
  ): ActionGenerationResult {
    const actions: CleanupAction[] = [];
    const dependencies: ActionDependency[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    // Generate actions from dead code report
    if (report.deadCode) {
      const deadCodeActions = this.generateDeadCodeActions(
        report.deadCode,
        options
      );
      actions.push(...deadCodeActions.actions);
      skipped.push(...deadCodeActions.skipped);
    }

    // Generate actions from duplicate code report
    if (report.duplicates) {
      const duplicateActions = this.generateDuplicateActions(
        report.duplicates,
        options
      );
      actions.push(...duplicateActions.actions);
      dependencies.push(...duplicateActions.dependencies);
      skipped.push(...duplicateActions.skipped);
    }

    // Generate actions from orphaned files report
    if (report.orphanedFiles) {
      const orphanedActions = this.generateOrphanedFileActions(
        report.orphanedFiles,
        options
      );
      actions.push(...orphanedActions.actions);
      skipped.push(...orphanedActions.skipped);
    }

    // Generate actions from unused imports
    if (report.unusedImports?.unusedImports) {
      const importActions = this.generateUnusedImportActions(
        report.unusedImports,
        options
      );
      actions.push(...importActions.actions);
      skipped.push(...importActions.skipped);
    }

    // Generate actions from type issues
    if (report.typeIssues?.issues) {
      const typeActions = this.generateTypeActions(report.typeIssues, options);
      actions.push(...typeActions.actions);
      dependencies.push(...typeActions.dependencies);
      skipped.push(...typeActions.skipped);
    }

    return { actions, dependencies, skipped };
  }

  /**
   * Generate actions for dead code removal
   */
  private generateDeadCodeActions(
    report: DeadCodeReport,
    options: CleanupPlanOptions
  ): Omit<ActionGenerationResult, 'dependencies'> {
    const actions: CleanupAction[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    // Process unused exports
    for (const unusedExport of report.unusedExports) {
      // Skip if confidence is below threshold
      if (
        options.minConfidence === 'high' &&
        report.confidence !== 'high' &&
        unusedExport.potentialDynamicUsage
      ) {
        skipped.push({
          action: {
            type: 'remove-dead-code',
            target: `${unusedExport.file}:${unusedExport.name}`,
            description: `Remove unused export ${unusedExport.name}`,
          },
          reason: 'Confidence level below threshold or potential dynamic usage',
        });
        continue;
      }

      const action: CleanupAction = {
        id: uuidv4(),
        type: 'remove-dead-code',
        target: `${unusedExport.file}:${unusedExport.line}`,
        description: `Remove unused ${unusedExport.type} export '${unusedExport.name}' from ${unusedExport.file}`,
        autoExecutable: !unusedExport.potentialDynamicUsage,
        requiresReview: unusedExport.potentialDynamicUsage,
        estimatedImpact: this.estimateCodeRemovalImpact(unusedExport.type),
        dependencies: [],
      };

      if (options.includeReviewRequired || !action.requiresReview) {
        actions.push(action);
      } else {
        skipped.push({
          action,
          reason: 'Requires review and includeReviewRequired is false',
        });
      }
    }

    return { actions, skipped };
  }

  /**
   * Generate actions for duplicate code refactoring
   */
  private generateDuplicateActions(
    report: DuplicateCodeReport,
    options: CleanupPlanOptions
  ): ActionGenerationResult {
    const actions: CleanupAction[] = [];
    const dependencies: ActionDependency[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    for (const duplicate of report.duplicates) {
      // Skip low-impact duplicates if prioritizing high impact
      if (
        options.prioritizeHighImpact &&
        duplicate.impact !== 'high' &&
        duplicate.occurrences < 3
      ) {
        skipped.push({
          action: {
            type: 'refactor-duplicate',
            target: duplicate.id,
            description: `Refactor duplicate code (${duplicate.occurrences} occurrences)`,
          },
          reason: 'Low impact and prioritizeHighImpact is enabled',
        });
        continue;
      }

      const action: CleanupAction = {
        id: uuidv4(),
        type: 'refactor-duplicate',
        target: duplicate.id,
        description: `Refactor duplicate code: ${duplicate.suggestedRefactoring.description} (${duplicate.occurrences} occurrences, ${duplicate.linesTotal} lines)`,
        autoExecutable: false, // Refactoring always requires manual review
        requiresReview: true,
        estimatedImpact: duplicate.suggestedRefactoring.estimatedImpact,
        dependencies: [],
      };

      if (options.includeReviewRequired) {
        actions.push(action);
      } else {
        skipped.push({
          action,
          reason: 'Requires review and includeReviewRequired is false',
        });
      }
    }

    return { actions, dependencies, skipped };
  }

  /**
   * Generate actions for orphaned file deletion
   */
  private generateOrphanedFileActions(
    report: OrphanedFilesReport,
    options: CleanupPlanOptions
  ): Omit<ActionGenerationResult, 'dependencies'> {
    const actions: CleanupAction[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    // Process safe-to-delete files
    for (const file of report.categorized.safeToDelete) {
      const action: CleanupAction = {
        id: uuidv4(),
        type: 'delete-orphaned-file',
        target: file.path,
        description: `Delete orphaned ${file.fileType} file: ${file.path} (${file.potentialReason})`,
        autoExecutable: options.safeOnly !== false,
        requiresReview: false,
        estimatedImpact: Math.ceil(file.size / 100), // Rough estimate: 1 point per 100 bytes
        dependencies: [],
      };

      actions.push(action);
    }

    // Process files that need review
    if (options.includeReviewRequired) {
      for (const file of report.categorized.needsReview) {
        const action: CleanupAction = {
          id: uuidv4(),
          type: 'delete-orphaned-file',
          target: file.path,
          description: `Review and potentially delete: ${file.path} (${file.potentialReason})`,
          autoExecutable: false,
          requiresReview: true,
          estimatedImpact: Math.ceil(file.size / 100),
          dependencies: [],
        };

        actions.push(action);
      }
    } else {
      for (const file of report.categorized.needsReview) {
        skipped.push({
          action: {
            type: 'delete-orphaned-file',
            target: file.path,
            description: `Review and potentially delete: ${file.path}`,
          },
          reason: 'Requires review and includeReviewRequired is false',
        });
      }
    }

    return { actions, skipped };
  }

  /**
   * Generate actions for unused import removal
   */
  private generateUnusedImportActions(
    report: any,
    options: CleanupPlanOptions
  ): Omit<ActionGenerationResult, 'dependencies'> {
    const actions: CleanupAction[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    for (const unusedImport of report.unusedImports) {
      const action: CleanupAction = {
        id: uuidv4(),
        type: 'remove-unused-import',
        target: `${unusedImport.file}:${unusedImport.line}`,
        description: `Remove unused import '${unusedImport.importName}' from ${unusedImport.file}`,
        autoExecutable: unusedImport.canAutoFix !== false,
        requiresReview: !unusedImport.canAutoFix,
        estimatedImpact: 1, // Small impact per import
        dependencies: [],
      };

      if (options.includeReviewRequired || !action.requiresReview) {
        actions.push(action);
      } else {
        skipped.push({
          action,
          reason: 'Cannot auto-fix and includeReviewRequired is false',
        });
      }
    }

    return { actions, skipped };
  }

  /**
   * Generate actions for type consolidation
   */
  private generateTypeActions(
    report: any,
    options: CleanupPlanOptions
  ): ActionGenerationResult {
    const actions: CleanupAction[] = [];
    const dependencies: ActionDependency[] = [];
    const skipped: ActionGenerationResult['skipped'] = [];

    for (const issue of report.issues) {
      const action: CleanupAction = {
        id: uuidv4(),
        type: 'consolidate-types',
        target: issue.target || 'unknown',
        description: issue.description || 'Consolidate type definitions',
        autoExecutable: false,
        requiresReview: true,
        estimatedImpact: issue.estimatedImpact || 5,
        dependencies: [],
      };

      if (options.includeReviewRequired) {
        actions.push(action);
      } else {
        skipped.push({
          action,
          reason: 'Requires review and includeReviewRequired is false',
        });
      }
    }

    return { actions, dependencies, skipped };
  }

  /**
   * Resolve action dependencies and order actions
   */
  private resolveDependencies(
    actions: CleanupAction[],
    dependencies: ActionDependency[]
  ): CleanupAction[] {
    // Create a map of action IDs to actions
    const actionMap = new Map<string, CleanupAction>();
    for (const action of actions) {
      actionMap.set(action.id, action);
    }

    // Create a map of dependencies
    const depMap = new Map<string, string[]>();
    for (const dep of dependencies) {
      depMap.set(dep.actionId, dep.dependsOn);
    }

    // Topological sort to order actions
    const visited = new Set<string>();
    const result: CleanupAction[] = [];

    const visit = (actionId: string) => {
      if (visited.has(actionId)) {
        return;
      }

      visited.add(actionId);

      // Visit dependencies first
      const deps = depMap.get(actionId) || [];
      for (const depId of deps) {
        if (actionMap.has(depId)) {
          visit(depId);
        }
      }

      // Add action to result
      const action = actionMap.get(actionId);
      if (action) {
        // Update action dependencies
        action.dependencies = deps.filter((depId) => actionMap.has(depId));
        result.push(action);
      }
    };

    // Visit all actions
    for (const action of actions) {
      visit(action.id);
    }

    return result;
  }

  /**
   * Calculate estimated impact of all actions
   */
  private calculateImpact(actions: CleanupAction[]): ImpactEstimate {
    const filesAffected = new Set<string>();
    let linesRemoved = 0;
    let bundleSizeReduction = 0;

    for (const action of actions) {
      // Extract file path from target
      const filePath = action.target.split(':')[0];
      if (filePath) {
        filesAffected.add(filePath);
      }

      // Accumulate impact
      linesRemoved += action.estimatedImpact;

      // Estimate bundle size reduction (rough estimate: 50 bytes per line)
      bundleSizeReduction += action.estimatedImpact * 50;
    }

    // Estimate time: 2 minutes per action on average
    const estimatedTimeMinutes = Math.ceil(actions.length * 2);

    return {
      filesAffected: filesAffected.size,
      linesRemoved,
      bundleSizeReduction,
      estimatedTimeMinutes,
    };
  }

  /**
   * Calculate overall safety level of the plan
   */
  private calculateSafetyLevel(actions: CleanupAction[]): SafetyLevel {
    if (actions.length === 0) {
      return 'safe';
    }

    const reviewRequiredCount = actions.filter(
      (a) => a.requiresReview
    ).length;
    const reviewRequiredRatio = reviewRequiredCount / actions.length;

    const nonAutoExecutableCount = actions.filter(
      (a) => !a.autoExecutable
    ).length;
    const nonAutoExecutableRatio = nonAutoExecutableCount / actions.length;

    // Risky if more than 50% require review or are not auto-executable
    if (reviewRequiredRatio > 0.5 || nonAutoExecutableRatio > 0.5) {
      return 'risky';
    }

    // Review needed if more than 20% require review
    if (reviewRequiredRatio > 0.2 || nonAutoExecutableRatio > 0.2) {
      return 'review-needed';
    }

    return 'safe';
  }

  /**
   * Estimate impact of removing a code item
   */
  private estimateCodeRemovalImpact(type: string): number {
    // Rough estimates based on typical code sizes
    switch (type) {
      case 'function':
        return 10; // Average function is ~10 lines
      case 'class':
        return 20; // Average class is ~20 lines
      case 'variable':
        return 1; // Single line
      case 'type':
      case 'interface':
        return 5; // Average type is ~5 lines
      case 'enum':
        return 8; // Average enum is ~8 lines
      default:
        return 5; // Default estimate
    }
  }
}
