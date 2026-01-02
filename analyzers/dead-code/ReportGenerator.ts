import * as fs from 'fs';
import * as path from 'path';
import { DeadCodeReport, UnusedExport, UnusedFunction, UnusedVariable, UnusedType } from './types';

/**
 * Report format options
 */
export type ReportFormat = 'json' | 'html' | 'markdown';

/**
 * Report generation options
 */
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeDetails?: boolean;
  groupByFile?: boolean;
}

/**
 * Dead code report generator
 */
export class DeadCodeReportGenerator {
  /**
   * Generate report in specified format
   */
  public generate(report: DeadCodeReport, options: ReportOptions): string {
    switch (options.format) {
      case 'json':
        return this.generateJSON(report, options);
      case 'html':
        return this.generateHTML(report, options);
      case 'markdown':
        return this.generateMarkdown(report, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Generate and save report to file
   */
  public async generateToFile(
    report: DeadCodeReport,
    options: ReportOptions
  ): Promise<string> {
    const content = this.generate(report, options);

    if (options.outputPath) {
      const dir = path.dirname(options.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(options.outputPath, content, 'utf-8');
      return options.outputPath;
    }

    // Generate default filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = options.format === 'json' ? 'json' : options.format === 'html' ? 'html' : 'md';
    const filename = `dead-code-report-${timestamp}.${ext}`;
    const outputPath = path.join(process.cwd(), 'reports', filename);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    return outputPath;
  }

  /**
   * Generate JSON report
   */
  private generateJSON(report: DeadCodeReport, options: ReportOptions): string {
    if (options.includeDetails === false) {
      // Simplified report
      return JSON.stringify(
        {
          summary: report.summary,
          confidence: report.confidence,
          timestamp: report.timestamp,
        },
        null,
        2
      );
    }

    // Full report
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate HTML report
   */
  private generateHTML(report: DeadCodeReport, options: ReportOptions): string {
    const groupedByFile = options.groupByFile
      ? this.groupByFile(report)
      : null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dead Code Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #e74c3c;
    }
    .confidence {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .confidence.high {
      background: #27ae60;
      color: white;
    }
    .confidence.medium {
      background: #f39c12;
      color: white;
    }
    .confidence.low {
      background: #e74c3c;
      color: white;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section h2 {
      margin: 0 0 20px 0;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    th {
      background: #ecf0f1;
      font-weight: 600;
      color: #2c3e50;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .file-path {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #7f8c8d;
    }
    .symbol-name {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #2c3e50;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
    }
    .badge.function { background: #3498db; color: white; }
    .badge.class { background: #9b59b6; color: white; }
    .badge.variable { background: #1abc9c; color: white; }
    .badge.type { background: #e67e22; color: white; }
    .badge.interface { background: #e67e22; color: white; }
    .badge.enum { background: #e67e22; color: white; }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .file-group {
      margin-bottom: 30px;
    }
    .file-group h3 {
      color: #2c3e50;
      margin: 0 0 15px 0;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Dead Code Analysis Report</h1>
    <p>Generated: ${report.timestamp.toLocaleString()}</p>
    <p>Confidence Level: <span class="confidence ${report.confidence}">${report.confidence}</span></p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Unused Exports</h3>
      <div class="value">${report.summary.totalUnusedExports}</div>
    </div>
    <div class="summary-card">
      <h3>Unused Functions</h3>
      <div class="value">${report.summary.totalUnusedFunctions}</div>
    </div>
    <div class="summary-card">
      <h3>Unused Variables</h3>
      <div class="value">${report.summary.totalUnusedVariables}</div>
    </div>
    <div class="summary-card">
      <h3>Unused Types</h3>
      <div class="value">${report.summary.totalUnusedTypes}</div>
    </div>
    <div class="summary-card">
      <h3>Files Affected</h3>
      <div class="value">${report.summary.filesAffected}</div>
    </div>
  </div>

  ${this.generateHTMLWarnings(report)}

  ${groupedByFile ? this.generateHTMLGroupedByFile(groupedByFile) : this.generateHTMLTables(report)}

</body>
</html>`;
  }

  /**
   * Generate HTML warnings section
   */
  private generateHTMLWarnings(report: DeadCodeReport): string {
    const warnings: string[] = [];

    if (report.confidence === 'low') {
      warnings.push(
        'Low confidence level detected. Some items may be used dynamically. Manual review recommended.'
      );
    }

    const potentialDynamic = report.unusedExports.filter(
      (e) => e.potentialDynamicUsage
    );
    if (potentialDynamic.length > 0) {
      warnings.push(
        `${potentialDynamic.length} exports may be used dynamically. Review carefully before removal.`
      );
    }

    if (warnings.length === 0) {
      return '';
    }

    return `
  <div class="warning">
    <strong>⚠️ Warnings:</strong>
    <ul>
      ${warnings.map((w) => `<li>${w}</li>`).join('\n')}
    </ul>
  </div>`;
  }

  /**
   * Generate HTML tables for each category
   */
  private generateHTMLTables(report: DeadCodeReport): string {
    let html = '';

    if (report.unusedExports.length > 0) {
      html += `
  <div class="section">
    <h2>Unused Exports (${report.unusedExports.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Type</th>
          <th>File</th>
          <th>Line</th>
          <th>Dynamic Usage</th>
        </tr>
      </thead>
      <tbody>
        ${report.unusedExports
          .map(
            (item) => `
        <tr>
          <td><span class="symbol-name">${item.name}</span></td>
          <td><span class="badge ${item.type}">${item.type}</span></td>
          <td><span class="file-path">${item.file}</span></td>
          <td>${item.line}</td>
          <td>${item.potentialDynamicUsage ? '⚠️ Possible' : '✓ No'}</td>
        </tr>`
          )
          .join('\n')}
      </tbody>
    </table>
  </div>`;
    }

    if (report.unusedTypes.length > 0) {
      html += `
  <div class="section">
    <h2>Unused Types (${report.unusedTypes.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Type Name</th>
          <th>Kind</th>
          <th>File</th>
          <th>Line</th>
        </tr>
      </thead>
      <tbody>
        ${report.unusedTypes
          .map(
            (item) => `
        <tr>
          <td><span class="symbol-name">${item.name}</span></td>
          <td><span class="badge ${item.kind}">${item.kind}</span></td>
          <td><span class="file-path">${item.file}</span></td>
          <td>${item.line}</td>
        </tr>`
          )
          .join('\n')}
      </tbody>
    </table>
  </div>`;
    }

    return html;
  }

  /**
   * Generate HTML grouped by file
   */
  private generateHTMLGroupedByFile(grouped: Map<string, any[]>): string {
    let html = '<div class="section"><h2>Issues by File</h2>';

    for (const [file, items] of grouped.entries()) {
      html += `
    <div class="file-group">
      <h3>📄 ${file} (${items.length} issues)</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Line</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
          <tr>
            <td><span class="symbol-name">${item.name}</span></td>
            <td><span class="badge ${item.type || item.kind}">${item.type || item.kind}</span></td>
            <td>${item.line}</td>
          </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
    </div>`;
    }

    html += '</div>';
    return html;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(report: DeadCodeReport, options: ReportOptions): string {
    const groupedByFile = options.groupByFile
      ? this.groupByFile(report)
      : null;

    let md = `# Dead Code Analysis Report

**Generated:** ${report.timestamp.toLocaleString()}  
**Confidence Level:** ${report.confidence.toUpperCase()}  
**Analyzer:** ${report.analyzer}

## Summary

| Metric | Count |
|--------|-------|
| Unused Exports | ${report.summary.totalUnusedExports} |
| Unused Functions | ${report.summary.totalUnusedFunctions} |
| Unused Variables | ${report.summary.totalUnusedVariables} |
| Unused Types | ${report.summary.totalUnusedTypes} |
| Files Affected | ${report.summary.filesAffected} |

`;

    // Add warnings
    if (report.confidence === 'low') {
      md += `\n> ⚠️ **Warning:** Low confidence level. Some items may be used dynamically.\n\n`;
    }

    const potentialDynamic = report.unusedExports.filter(
      (e) => e.potentialDynamicUsage
    );
    if (potentialDynamic.length > 0) {
      md += `\n> ⚠️ **Warning:** ${potentialDynamic.length} exports may be used dynamically.\n\n`;
    }

    if (groupedByFile) {
      md += this.generateMarkdownGroupedByFile(groupedByFile);
    } else {
      md += this.generateMarkdownTables(report);
    }

    return md;
  }

  /**
   * Generate Markdown tables for each category
   */
  private generateMarkdownTables(report: DeadCodeReport): string {
    let md = '';

    if (report.unusedExports.length > 0) {
      md += `\n## Unused Exports (${report.unusedExports.length})\n\n`;
      md += `| Symbol | Type | File | Line | Dynamic Usage |\n`;
      md += `|--------|------|------|------|---------------|\n`;

      for (const item of report.unusedExports) {
        md += `| \`${item.name}\` | ${item.type} | ${item.file} | ${item.line} | ${item.potentialDynamicUsage ? '⚠️ Possible' : '✓ No'} |\n`;
      }
    }

    if (report.unusedTypes.length > 0) {
      md += `\n## Unused Types (${report.unusedTypes.length})\n\n`;
      md += `| Type Name | Kind | File | Line |\n`;
      md += `|-----------|------|------|------|\n`;

      for (const item of report.unusedTypes) {
        md += `| \`${item.name}\` | ${item.kind} | ${item.file} | ${item.line} |\n`;
      }
    }

    if (report.unusedFunctions.length > 0) {
      md += `\n## Unused Functions (${report.unusedFunctions.length})\n\n`;
      md += `| Function Name | File | Line |\n`;
      md += `|---------------|------|------|\n`;

      for (const item of report.unusedFunctions) {
        md += `| \`${item.name}\` | ${item.file} | ${item.line} |\n`;
      }
    }

    if (report.unusedVariables.length > 0) {
      md += `\n## Unused Variables (${report.unusedVariables.length})\n\n`;
      md += `| Variable Name | Scope | File | Line |\n`;
      md += `|---------------|-------|------|------|\n`;

      for (const item of report.unusedVariables) {
        md += `| \`${item.name}\` | ${item.scope} | ${item.file} | ${item.line} |\n`;
      }
    }

    return md;
  }

  /**
   * Generate Markdown grouped by file
   */
  private generateMarkdownGroupedByFile(grouped: Map<string, any[]>): string {
    let md = '\n## Issues by File\n\n';

    for (const [file, items] of grouped.entries()) {
      md += `\n### 📄 ${file} (${items.length} issues)\n\n`;
      md += `| Symbol | Type | Line |\n`;
      md += `|--------|------|------|\n`;

      for (const item of items) {
        md += `| \`${item.name}\` | ${item.type || item.kind} | ${item.line} |\n`;
      }
    }

    return md;
  }

  /**
   * Group report items by file
   */
  private groupByFile(report: DeadCodeReport): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    const allItems = [
      ...report.unusedExports,
      ...report.unusedFunctions,
      ...report.unusedVariables,
      ...report.unusedTypes,
    ];

    for (const item of allItems) {
      if (!grouped.has(item.file)) {
        grouped.set(item.file, []);
      }
      grouped.get(item.file)!.push(item);
    }

    // Sort by file path
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }
}
