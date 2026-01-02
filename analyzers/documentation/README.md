# Documentation Generator

Generates comprehensive documentation for code cleanup decisions, before/after comparisons, and maintenance guidelines.

## Features

- **Cleanup Decision Documentation**: Documents rationale, evidence, risks, and alternatives for each cleanup action
- **Before/After Code Comparisons**: Shows code changes with complexity and dependency analysis
- **Maintenance Checklist**: Provides daily, weekly, monthly, and quarterly maintenance tasks
- **Best Practices Guide**: Includes best practices, anti-patterns, and success stories
- **Multiple Output Formats**: Supports Markdown, HTML, and PDF export

## Usage

```typescript
import { DocumentationGenerator } from "./analyzers/documentation";
import type { DocumentationConfig } from "./analyzers/documentation";

const generator = new DocumentationGenerator();

const config: DocumentationConfig = {
  outputDir: "./docs/cleanup",
  includeCodeComparisons: true,
  includeDecisionRationale: true,
  includeMaintenanceChecklist: true,
  includeBestPractices: true,
  format: "markdown",
};

// Generate complete documentation
const documentation = await generator.generateDocumentation(
  analysisReport,
  cleanupPlan,
  beforeMetrics,
  afterMetrics,
  config
);

// Export to file
const outputPath = await generator.exportDocumentation(documentation, config);
console.log(`Documentation generated at: ${outputPath}`);
```

## Documentation Components

### Cleanup Decisions

Documents each cleanup action with:

- **Rationale**: Why the action is being taken
- **Evidence**: Supporting data from analysis
- **Risks**: Potential issues and mitigation strategies
- **Alternatives**: Other approaches considered

### Code Comparisons

Shows before/after code with:

- Line count changes
- Complexity metrics
- Dependency changes
- Visual diff

### Maintenance Checklist

Provides structured maintenance tasks:

- **Daily**: Quick checks (5-10 minutes)
- **Weekly**: Regular analysis (15-30 minutes)
- **Monthly**: Comprehensive review (1-2 hours)
- **Quarterly**: Major cleanup (4-8 hours)

### Best Practices

Includes:

- General best practices
- Category-specific practices
- Anti-patterns to avoid
- Success stories and lessons learned

## Configuration Options

```typescript
interface DocumentationConfig {
  outputDir: string; // Output directory
  includeCodeComparisons: boolean; // Include before/after comparisons
  includeDecisionRationale: boolean; // Include decision documentation
  includeMaintenanceChecklist: boolean; // Include maintenance tasks
  includeBestPractices: boolean; // Include best practices guide
  format: "markdown" | "html" | "pdf"; // Output format
}
```

## Output Structure

### Markdown Format

```
# Code Cleanup Documentation

## Cleanup Decisions
### Summary
- Total Actions: 45
- Files Affected: 23
- Lines Removed: 1,234

### Detailed Decisions
#### remove-dead-code: src/utils/old-helper.ts
**Rationale:** This code is not referenced anywhere...
**Risks:**
- Code might be used dynamically (medium)
  - Mitigation: Run comprehensive tests...

## Code Comparisons
### src/components/Button.tsx
**Action:** remove-unused-import
**Changes:**
- Lines removed: 3
- Complexity: 5 → 5

## Maintenance Checklist
### Daily Tasks
- Review and fix linting errors (5-10 minutes)
- Check for unused imports (2-5 minutes)

## Best Practices
### General Best Practices
#### Regular Code Analysis
Run automated code analysis regularly...
```

## Integration

### With Analysis Pipeline

```typescript
const pipeline = new AnalysisPipeline(config);
const report = await pipeline.execute();

const cleanupPlan = planGenerator.generatePlan(report);
const beforeMetrics = await metricsCalculator.calculate(config.projectRoot);

// Execute cleanup
await cleanupExecutor.execute(cleanupPlan);

const afterMetrics = await metricsCalculator.calculate(config.projectRoot);

// Generate documentation
const documentation = await generator.generateDocumentation(
  report,
  cleanupPlan,
  beforeMetrics,
  afterMetrics,
  docConfig
);
```

### With CI/CD

```yaml
# .github/workflows/cleanup.yml
- name: Generate Cleanup Documentation
  run: |
    npm run analyze:full
    npm run cleanup:plan
    npm run docs:generate

- name: Upload Documentation
  uses: actions/upload-artifact@v2
  with:
    name: cleanup-docs
    path: docs/cleanup/
```

## Best Practices

1. **Generate After Each Cleanup**: Document decisions immediately
2. **Include in Code Reviews**: Share documentation with team
3. **Update Regularly**: Keep maintenance checklist current
4. **Track Metrics**: Compare before/after metrics over time
5. **Share Success Stories**: Document and share wins

## Requirements Validation

- ✅ **Requirement 12.1**: Step-by-step cleanup guide
- ✅ **Requirement 12.2**: Document cleanup decisions
- ✅ **Requirement 12.3**: Best practices for preventing code bloat
- ✅ **Requirement 12.4**: Before/after code comparisons
- ✅ **Requirement 12.5**: Maintenance checklist

## Example Output

See `example.ts` for a complete example of generating documentation for a cleanup project.
