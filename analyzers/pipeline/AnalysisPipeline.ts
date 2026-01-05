import { AnalysisConfig } from '../config';
import { DeadCodeAnalyzer } from '../dead-code';
import { UnusedImportAnalyzer } from '../unused-imports';
import { DuplicateCodeDetector } from '../duplicate-code';
import { OrphanedFileDetector } from '../orphaned-files';
import { TypeSystemOptimizer } from '../type-system';
import { ServiceIntegrationAnalyzer } from '../service-integration';
import { CodeFlowValidator } from '../code-flow';
import { DependencyGraphAnalyzer } from '../dependency-graph';
import { ComprehensiveAnalysisReport } from '../cleanup-plan/types';
import {
  AnalysisStage,
  PipelineExecutionResult,
  PipelineOptions,
  StageResult,
  PipelineError,
  PipelineProgress,
} from './types';
import { defaultLogger as Logger } from '../utils/logger';

/**
 * Orchestrates the execution of multiple analysis stages
 */
export class AnalysisPipeline {
  private stages: AnalysisStage[];

  constructor() {
    this.stages = this.defineStages();
  }

  /**
   * Execute the analysis pipeline
   */
  async execute(options: PipelineOptions): Promise<PipelineExecutionResult> {
    const startTime = new Date();
    Logger.info('Starting analysis pipeline...');

    const stagesToRun = this.getStagesToRun(options);
    const results: StageResult[] = [];
    const errors: PipelineError[] = [];
    let stagesExecuted = 0;
    let stagesFailed = 0;
    let stagesSkipped = 0;

    // Report initial progress
    this.reportProgress(options, {
      stage: 'pipeline',
      status: 'starting',
      progress: 0,
      message: 'Initializing analysis pipeline',
    });

    // Execute stages
    if (options.parallel) {
      // Execute independent stages in parallel
      const stageGroups = this.groupStagesByDependencies(stagesToRun);
      
      for (const group of stageGroups) {
        const groupResults = await Promise.allSettled(
          group.map((stage) => this.executeStage(stage, options))
        );

        for (let i = 0; i < groupResults.length; i++) {
          const result = groupResults[i];
          const stage = group[i];

          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.success) {
              stagesExecuted++;
            } else {
              stagesFailed++;
              errors.push({
                stage: stage.name,
                error: result.value.error || 'Unknown error',
                recoverable: true,
              });
            }
          } else {
            stagesFailed++;
            results.push({
              stage: stage.name,
              success: false,
              duration: 0,
              error: result.reason?.message || 'Unknown error',
            });
            errors.push({
              stage: stage.name,
              error: result.reason?.message || 'Unknown error',
              recoverable: false,
            });
          }
        }

        // Stop on error if configured
        if (options.stopOnError && stagesFailed > 0) {
          Logger.error('Stopping pipeline due to error');
          break;
        }
      }
    } else {
      // Execute stages sequentially
      for (const stage of stagesToRun) {
        const result = await this.executeStage(stage, options);
        results.push(result);

        if (result.success) {
          stagesExecuted++;
        } else {
          stagesFailed++;
          errors.push({
            stage: stage.name,
            error: result.error || 'Unknown error',
            recoverable: true,
          });

          if (options.stopOnError) {
            Logger.error('Stopping pipeline due to error');
            break;
          }
        }

        // Report progress
        const progress = ((stagesExecuted + stagesFailed) / stagesToRun.length) * 100;
        this.reportProgress(options, {
          stage: stage.name,
          status: result.success ? 'completed' : 'failed',
          progress,
          message: result.success
            ? `Completed ${stage.name}`
            : `Failed ${stage.name}: ${result.error}`,
        });
      }
    }

    stagesSkipped = stagesToRun.length - stagesExecuted - stagesFailed;

    // Aggregate results into comprehensive report
    const report = this.aggregateResults(results);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Report completion
    this.reportProgress(options, {
      stage: 'pipeline',
      status: 'completed',
      progress: 100,
      message: `Pipeline completed: ${stagesExecuted} succeeded, ${stagesFailed} failed`,
    });

    Logger.info(
      `Pipeline completed in ${duration}ms: ${stagesExecuted} succeeded, ${stagesFailed} failed, ${stagesSkipped} skipped`
    );

    return {
      success: stagesFailed === 0,
      startTime,
      endTime,
      duration,
      stagesExecuted,
      stagesFailed,
      stagesSkipped,
      results,
      report,
      errors,
    };
  }

  /**
   * Execute a single stage
   */
  private async executeStage(
    stage: AnalysisStage,
    options: PipelineOptions
  ): Promise<StageResult> {
    const startTime = Date.now();
    Logger.info(`Executing stage: ${stage.name}`);

    this.reportProgress(options, {
      stage: stage.name,
      status: 'starting',
      progress: 0,
      message: `Starting ${stage.name}`,
    });

    try {
      const result = await this.runAnalyzer(stage.analyzer, options.config);

      const duration = Date.now() - startTime;

      return {
        stage: stage.name,
        success: true,
        duration,
        result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      Logger.error(`Stage ${stage.name} failed: ${errorMessage}`);

      return {
        stage: stage.name,
        success: false,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Run a specific analyzer
   */
  private async runAnalyzer(
    analyzerName: string,
    config: AnalysisConfig
  ): Promise<any> {
    switch (analyzerName) {
      case 'dead-code':
        const deadCodeAnalyzer = new DeadCodeAnalyzer();
        return await deadCodeAnalyzer.analyze(config);

      case 'unused-imports':
        const unusedImportAnalyzer = new UnusedImportAnalyzer();
        return await unusedImportAnalyzer.analyze(config);

      case 'duplicate-code':
        const duplicateDetector = new DuplicateCodeDetector();
        return await duplicateDetector.analyze(config);

      case 'orphaned-files':
        const orphanedDetector = new OrphanedFileDetector();
        return await orphanedDetector.analyze(config);

      case 'type-system':
        const typeOptimizer = new TypeSystemOptimizer();
        return await typeOptimizer.analyze(config);

      case 'service-integration':
        const serviceAnalyzer = new ServiceIntegrationAnalyzer();
        return await serviceAnalyzer.analyze(config);

      case 'code-flow':
        const flowValidator = new CodeFlowValidator();
        return await flowValidator.analyze(config);

      case 'dependency-graph':
        const depAnalyzer = new DependencyGraphAnalyzer();
        return await depAnalyzer.analyze(config);

      default:
        throw new Error(`Unknown analyzer: ${analyzerName}`);
    }
  }

  /**
   * Define pipeline stages
   */
  private defineStages(): AnalysisStage[] {
    return [
      {
        name: 'Dead Code Analysis',
        description: 'Detect unused exports, functions, and variables',
        analyzer: 'dead-code',
        enabled: true,
        dependencies: [],
        timeout: 60000,
      },
      {
        name: 'Unused Imports Analysis',
        description: 'Detect unused import statements',
        analyzer: 'unused-imports',
        enabled: true,
        dependencies: [],
        timeout: 30000,
      },
      {
        name: 'Duplicate Code Detection',
        description: 'Find duplicate code blocks',
        analyzer: 'duplicate-code',
        enabled: true,
        dependencies: [],
        timeout: 120000,
      },
      {
        name: 'Orphaned Files Detection',
        description: 'Find files not referenced anywhere',
        analyzer: 'orphaned-files',
        enabled: true,
        dependencies: [],
        timeout: 60000,
      },
      {
        name: 'Type System Optimization',
        description: 'Analyze type definitions for redundancy',
        analyzer: 'type-system',
        enabled: true,
        dependencies: [],
        timeout: 60000,
      },
      {
        name: 'Service Integration Analysis',
        description: 'Analyze service layer integration',
        analyzer: 'service-integration',
        enabled: true,
        dependencies: [],
        timeout: 30000,
      },
      {
        name: 'Code Flow Validation',
        description: 'Validate data flow patterns',
        analyzer: 'code-flow',
        enabled: true,
        dependencies: [],
        timeout: 60000,
      },
      {
        name: 'Dependency Graph Analysis',
        description: 'Analyze module dependencies',
        analyzer: 'dependency-graph',
        enabled: true,
        dependencies: [],
        timeout: 60000,
      },
    ];
  }

  /**
   * Get stages to run based on options
   */
  private getStagesToRun(options: PipelineOptions): AnalysisStage[] {
    let stages = this.stages.filter((s) => s.enabled);

    if (options.stages && options.stages.length > 0) {
      stages = stages.filter((s) => options.stages!.includes(s.name));
    }

    return stages;
  }

  /**
   * Group stages by dependencies for parallel execution
   */
  private groupStagesByDependencies(
    stages: AnalysisStage[]
  ): AnalysisStage[][] {
    const groups: AnalysisStage[][] = [];
    const processed = new Set<string>();

    // Simple grouping: stages with no dependencies can run in parallel
    const independentStages = stages.filter((s) => s.dependencies.length === 0);
    if (independentStages.length > 0) {
      groups.push(independentStages);
      independentStages.forEach((s) => processed.add(s.name));
    }

    // Remaining stages run sequentially
    const dependentStages = stages.filter((s) => !processed.has(s.name));
    dependentStages.forEach((s) => groups.push([s]));

    return groups;
  }

  /**
   * Aggregate stage results into comprehensive report
   */
  private aggregateResults(results: StageResult[]): ComprehensiveAnalysisReport {
    const report: ComprehensiveAnalysisReport = {};

    for (const result of results) {
      if (!result.success || !result.result) {
        continue;
      }

      switch (result.stage) {
        case 'Dead Code Analysis':
          report.deadCode = result.result;
          break;
        case 'Duplicate Code Detection':
          report.duplicates = result.result;
          break;
        case 'Orphaned Files Detection':
          report.orphanedFiles = result.result;
          break;
        case 'Unused Imports Analysis':
          report.unusedImports = result.result;
          break;
        case 'Type System Optimization':
          report.typeIssues = result.result;
          break;
        case 'Service Integration Analysis':
          report.serviceIntegration = result.result;
          break;
        case 'Code Flow Validation':
          report.codeFlow = result.result;
          break;
        case 'Dependency Graph Analysis':
          report.dependencies = result.result;
          break;
      }
    }

    return report;
  }

  /**
   * Report progress
   */
  private reportProgress(
    options: PipelineOptions,
    progress: PipelineProgress
  ): void {
    if (options.onProgress) {
      options.onProgress(progress);
    }
  }

  /**
   * Get available stages
   */
  getStages(): AnalysisStage[] {
    return [...this.stages];
  }

  /**
   * Enable/disable a stage
   */
  setStageEnabled(stageName: string, enabled: boolean): void {
    const stage = this.stages.find((s) => s.name === stageName);
    if (stage) {
      stage.enabled = enabled;
    }
  }
}
