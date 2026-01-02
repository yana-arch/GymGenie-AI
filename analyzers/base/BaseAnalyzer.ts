import { CodeAnalyzer, AnalysisReport } from '../types';
import { AnalysisConfig } from '../config';
import { Logger, defaultLogger } from '../utils/logger';
import { AnalysisError } from '../utils/errors';

/**
 * Abstract base class for all analyzers
 */
export abstract class BaseAnalyzer<TReport extends AnalysisReport> implements CodeAnalyzer<TReport> {
  protected logger: Logger;

  constructor(
    public readonly name: string,
    logger?: Logger
  ) {
    this.logger = logger ?? defaultLogger.child(name);
  }

  /**
   * Run the analysis with error handling and timing
   */
  async analyze(config: AnalysisConfig): Promise<TReport> {
    const startTime = Date.now();
    this.logger.info(`Starting analysis: ${this.name}`);

    try {
      const report = await this.runAnalysis(config);
      const duration = Date.now() - startTime;

      this.logger.info(`Completed analysis: ${this.name} (${duration}ms)`);

      return {
        ...report,
        analyzer: this.name,
        timestamp: new Date(),
        duration,
        success: true,
      } as TReport;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Analysis failed: ${this.name}`, error);

      throw new AnalysisError(
        error instanceof Error ? error.message : String(error),
        this.name,
        undefined,
        true
      );
    }
  }

  /**
   * Abstract method to be implemented by concrete analyzers
   */
  protected abstract runAnalysis(config: AnalysisConfig): Promise<TReport>;

  /**
   * Validate configuration for this analyzer
   */
  protected validateConfig(config: AnalysisConfig): void {
    if (!config) {
      throw new AnalysisError('Configuration is required', this.name);
    }
  }
}
