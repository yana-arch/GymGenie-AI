import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ComprehensiveAnalysisReport } from '../cleanup-plan/types';
import { CleanupExecutionResult } from '../cleanup-executor/types';
import {
  ComprehensiveReport,
  ReportOptions,
  ReportSummary,
  ChartData,
} from './types';
import { defaultLogger as logger } from '../utils/logger';

/**
 * Generates comprehensive reports from analysis and execution results
 */
export class ReportGenerator {
  /**
   * Generate a comprehensive report
   */
  async generateReport(
    analysisReport: ComprehensiveAnalysisReport,
    executionResult: CleanupExecutionResult | undefined,
    options: ReportOptions
  ): Promise<string> {
    logger.info(`Generating ${options.format} report...`);

    // Create comprehensive report
    const report = this.createComprehensiveReport(
      analysisReport,
      executionResult,
      options
    );

    // Generate report in requested format
    let content: string;
    switch (options.format) {
      case 'json':
        content = this.generateJsonReport(report, options);
        break;
      case 'html':
        content = this.generateHtmlReport(report, options);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(report, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    // Save to file if output path is specified
    if (options.outputPath) {
      await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
      await fs.writeFile(options.outputPath, content, 'utf-8');
      logger.info(`Report saved to: ${options.outputPath}`);
    }

    return content;
  }

  /**
   * Create comprehensive report from analysis and execution results
   */
  private createComprehensiveReport(
    analysisReport: ComprehensiveAnalysisReport,
    executionResult: CleanupExecutionResult | undefined,
    options: ReportOptions
  ): ComprehensiveReport {
    const summary = this.createSummary(analysisReport, executionResult);
    const recommendations = this.generateRecommendations(
      analysisReport,
      executionResult
    );

    return {
      id: uuidv4(),
      timestamp: new Date(),
      projectName: options.projectName || 'Unknown Project',
      analysisReport,
      executionResult,
      summary,
      recommendations,
    };
  }

  /**
   * Create report summary
   */
  private createSummary(
    analysisReport: ComprehensiveAnalysisReport,
    executionResult?: CleanupExecutionResult
  ): ReportSummary {
    const issuesByType: Record<string, number> = {};
    let totalIssues = 0;
    let filesAffected = 0;
    let linesRemoved = 0;
    let bundleSizeReduction = 0;

    // Count issues from dead code report
    if (analysisReport.deadCode) {
      const deadCodeCount =
        analysisReport.deadCode.summary.totalUnusedExports +
        analysisReport.deadCode.summary.totalUnusedFunctions +
        analysisReport.deadCode.summary.totalUnusedVariables +
        analysisReport.deadCode.summary.totalUnusedTypes;
      issuesByType['Dead Code'] = deadCodeCount;
      totalIssues += deadCodeCount;
      filesAffected += analysisReport.deadCode.summary.filesAffected;
    }

    // Count issues from duplicates report
    if (analysisReport.duplicates) {
      issuesByType['Duplicate Code'] =
        analysisReport.duplicates.summary.totalDuplicates;
      totalIssues += analysisReport.duplicates.summary.totalDuplicates;
      filesAffected += analysisReport.duplicates.summary.filesAffected;
      linesRemoved += analysisReport.duplicates.summary.potentialLinesSaved;
    }

    // Count issues from orphaned files report
    if (analysisReport.orphanedFiles) {
      issuesByType['Orphaned Files'] =
        analysisReport.orphanedFiles.summary.totalOrphaned;
      totalIssues += analysisReport.orphanedFiles.summary.totalOrphaned;
      bundleSizeReduction +=
        analysisReport.orphanedFiles.summary.estimatedSizeReduction;
    }

    // Count issues from unused imports
    if (analysisReport.unusedImports?.unusedImports) {
      issuesByType['Unused Imports'] =
        analysisReport.unusedImports.unusedImports.length;
      totalIssues += analysisReport.unusedImports.unusedImports.length;
    }

    // Count issues from type issues
    if (analysisReport.typeIssues?.issues) {
      issuesByType['Type Issues'] = analysisReport.typeIssues.issues.length;
      totalIssues += analysisReport.typeIssues.issues.length;
    }

    const summary: ReportSummary = {
      totalIssuesFound: totalIssues,
      issuesByType,
      filesAnalyzed: 0, // Would need to track this during analysis
      filesAffected,
      estimatedImpact: {
        linesRemoved,
        bundleSizeReduction,
        timeEstimate: Math.ceil(totalIssues * 2), // 2 minutes per issue
      },
    };

    // Add execution summary if available
    if (executionResult) {
      summary.executionSummary = {
        actionsExecuted: executionResult.totalActions,
        actionsSucceeded: executionResult.successfulActions,
        actionsFailed: executionResult.failedActions,
        duration: executionResult.duration,
      };
    }

    return summary;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analysisReport: ComprehensiveAnalysisReport,
    executionResult?: CleanupExecutionResult
  ): string[] {
    const recommendations: string[] = [];

    // Dead code recommendations
    if (analysisReport.deadCode) {
      const deadCodeCount =
        analysisReport.deadCode.summary.totalUnusedExports;
      if (deadCodeCount > 0) {
        recommendations.push(
          `Remove ${deadCodeCount} unused exports to reduce bundle size`
        );
      }
    }

    // Duplicate code recommendations
    if (analysisReport.duplicates) {
      const highImpactCount =
        analysisReport.duplicates.summary.highImpactCount;
      if (highImpactCount > 0) {
        recommendations.push(
          `Refactor ${highImpactCount} high-impact duplicate code blocks to improve maintainability`
        );
      }
    }

    // Orphaned files recommendations
    if (analysisReport.orphanedFiles) {
      const safeToDelete =
        analysisReport.orphanedFiles.summary.safeToDelete;
      if (safeToDelete > 0) {
        recommendations.push(
          `Delete ${safeToDelete} orphaned files that are safe to remove`
        );
      }
    }

    // Execution recommendations
    if (executionResult && !executionResult.testsPassed) {
      recommendations.push(
        'Tests failed after cleanup - consider rolling back changes'
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Codebase is in good shape!');
    }

    return recommendations;
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(
    report: ComprehensiveReport,
    options: ReportOptions
  ): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(
    report: ComprehensiveReport,
    options: ReportOptions
  ): string {
    const title = options.title || 'Code Cleanup Analysis Report';
    let md = `# ${title}\n\n`;
    md += `**Project:** ${report.projectName}\n`;
    md += `**Generated:** ${report.timestamp.toISOString()}\n`;
    md += `**Report ID:** ${report.id}\n\n`;

    // Summary section
    md += `## Summary\n\n`;
    md += `- **Total Issues Found:** ${report.summary.totalIssuesFound}\n`;
    md += `- **Files Affected:** ${report.summary.filesAffected}\n`;
    md += `- **Estimated Lines Removed:** ${report.summary.estimatedImpact.linesRemoved}\n`;
    md += `- **Estimated Bundle Size Reduction:** ${report.summary.estimatedImpact.bundleSizeReduction} bytes\n`;
    md += `- **Estimated Time:** ${report.summary.estimatedImpact.timeEstimate} minutes\n\n`;

    // Issues by type
    md += `## Issues by Type\n\n`;
    md += `| Issue Type | Count |\n`;
    md += `|------------|-------|\n`;
    for (const [type, count] of Object.entries(report.summary.issuesByType)) {
      md += `| ${type} | ${count} |\n`;
    }
    md += `\n`;

    // Recommendations
    md += `## Recommendations\n\n`;
    for (const rec of report.recommendations) {
      md += `- ${rec}\n`;
    }
    md += `\n`;

    // Execution results
    if (report.executionResult) {
      md += `## Execution Results\n\n`;
      md += `- **Actions Executed:** ${report.executionResult.totalActions}\n`;
      md += `- **Successful:** ${report.executionResult.successfulActions}\n`;
      md += `- **Failed:** ${report.executionResult.failedActions}\n`;
      md += `- **Skipped:** ${report.executionResult.skippedActions}\n`;
      md += `- **Duration:** ${report.executionResult.duration}ms\n`;
      md += `- **Tests Run:** ${report.executionResult.testsRun ? 'Yes' : 'No'}\n`;
      md += `- **Tests Passed:** ${report.executionResult.testsPassed ? 'Yes' : 'No'}\n\n`;
    }

    // Detailed analysis
    if (options.includeDetails) {
      md += `## Detailed Analysis\n\n`;

      // Dead code details
      if (report.analysisReport.deadCode) {
        md += `### Dead Code\n\n`;
        md += `- Unused Exports: ${report.analysisReport.deadCode.summary.totalUnusedExports}\n`;
        md += `- Unused Functions: ${report.analysisReport.deadCode.summary.totalUnusedFunctions}\n`;
        md += `- Unused Variables: ${report.analysisReport.deadCode.summary.totalUnusedVariables}\n`;
        md += `- Unused Types: ${report.analysisReport.deadCode.summary.totalUnusedTypes}\n\n`;
      }

      // Duplicate code details
      if (report.analysisReport.duplicates) {
        md += `### Duplicate Code\n\n`;
        md += `- Total Duplicates: ${report.analysisReport.duplicates.summary.totalDuplicates}\n`;
        md += `- Total Instances: ${report.analysisReport.duplicates.summary.totalInstances}\n`;
        md += `- Lines Duplicated: ${report.analysisReport.duplicates.summary.linesDuplicated}\n`;
        md += `- Potential Lines Saved: ${report.analysisReport.duplicates.summary.potentialLinesSaved}\n\n`;
      }

      // Orphaned files details
      if (report.analysisReport.orphanedFiles) {
        md += `### Orphaned Files\n\n`;
        md += `- Total Orphaned: ${report.analysisReport.orphanedFiles.summary.totalOrphaned}\n`;
        md += `- Safe to Delete: ${report.analysisReport.orphanedFiles.summary.safeToDelete}\n`;
        md += `- Needs Review: ${report.analysisReport.orphanedFiles.summary.needsReview}\n\n`;
      }
    }

    return md;
  }

  /**
   * Generate HTML report with interactive dashboard
   */
  private generateHtmlReport(
    report: ComprehensiveReport,
    options: ReportOptions
  ): string {
    const title = options.title || 'Code Cleanup Analysis Report';
    
    // Prepare chart data
    const issuesChartData = this.prepareIssuesChartData(report);

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
    h3 { color: #7f8c8d; margin-top: 20px; margin-bottom: 10px; }
    .meta { color: #7f8c8d; margin-bottom: 30px; }
    .meta span { display: inline-block; margin-right: 20px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
    }
    .summary-card h3 { margin: 0; font-size: 14px; color: #7f8c8d; }
    .summary-card .value { font-size: 32px; font-weight: bold; color: #2c3e50; margin: 10px 0; }
    .summary-card .label { font-size: 12px; color: #95a5a6; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }
    th {
      background: #3498db;
      color: white;
      font-weight: 600;
    }
    tr:hover { background: #f8f9fa; }
    .recommendations {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px;
      margin: 20px 0;
    }
    .recommendations li { margin: 5px 0; }
    .chart-container {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-success { background: #d4edda; color: #155724; }
    .status-warning { background: #fff3cd; color: #856404; }
    .status-error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="meta">
      <span><strong>Project:</strong> ${report.projectName}</span>
      <span><strong>Generated:</strong> ${report.timestamp.toLocaleString()}</span>
      <span><strong>Report ID:</strong> ${report.id}</span>
    </div>

    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Issues</h3>
        <div class="value">${report.summary.totalIssuesFound}</div>
        <div class="label">Found</div>
      </div>
      <div class="summary-card">
        <h3>Files Affected</h3>
        <div class="value">${report.summary.filesAffected}</div>
        <div class="label">Files</div>
      </div>
      <div class="summary-card">
        <h3>Lines Removed</h3>
        <div class="value">${report.summary.estimatedImpact.linesRemoved}</div>
        <div class="label">Estimated</div>
      </div>
      <div class="summary-card">
        <h3>Bundle Size</h3>
        <div class="value">${Math.round(report.summary.estimatedImpact.bundleSizeReduction / 1024)}KB</div>
        <div class="label">Reduction</div>
      </div>
    </div>

    <h2>Issues by Type</h2>
    <table>
      <thead>
        <tr>
          <th>Issue Type</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>`;

    for (const [type, count] of Object.entries(report.summary.issuesByType)) {
      const percentage = ((count / report.summary.totalIssuesFound) * 100).toFixed(1);
      html += `
        <tr>
          <td>${type}</td>
          <td>${count}</td>
          <td>${percentage}%</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>

    <h2>Recommendations</h2>
    <div class="recommendations">
      <ul>`;

    for (const rec of report.recommendations) {
      html += `<li>${rec}</li>`;
    }

    html += `
      </ul>
    </div>`;

    // Execution results
    if (report.executionResult) {
      const statusClass = report.executionResult.testsPassed
        ? 'status-success'
        : report.executionResult.testsRun
        ? 'status-error'
        : 'status-warning';
      const statusText = report.executionResult.testsPassed
        ? 'Passed'
        : report.executionResult.testsRun
        ? 'Failed'
        : 'Not Run';

      html += `
    <h2>Execution Results</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Actions Executed</h3>
        <div class="value">${report.executionResult.totalActions}</div>
      </div>
      <div class="summary-card">
        <h3>Successful</h3>
        <div class="value" style="color: #27ae60;">${report.executionResult.successfulActions}</div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value" style="color: #e74c3c;">${report.executionResult.failedActions}</div>
      </div>
      <div class="summary-card">
        <h3>Tests</h3>
        <div class="value"><span class="${statusClass}">${statusText}</span></div>
      </div>
    </div>`;
    }

    html += `
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Prepare chart data for issues visualization
   */
  private prepareIssuesChartData(report: ComprehensiveReport): ChartData {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [
      '#e74c3c',
      '#3498db',
      '#f39c12',
      '#9b59b6',
      '#1abc9c',
    ];

    for (const [type, count] of Object.entries(report.summary.issuesByType)) {
      labels.push(type);
      values.push(count);
    }

    return { labels, values, colors };
  }
}
