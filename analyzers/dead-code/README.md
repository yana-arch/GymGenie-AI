# Dead Code Analyzer

The Dead Code Analyzer detects unused exports, functions, variables, and types in your TypeScript/JavaScript codebase using [Knip](https://knip.dev/).

## Features

- ✅ Detects unused exports (named and default)
- ✅ Identifies unused functions, variables, and types
- ✅ Handles dynamic imports and React patterns
- ✅ Configurable confidence levels
- ✅ Entry point detection
- ✅ Multiple report formats (JSON, HTML, Markdown)
- ✅ Removal plan generation

## Usage

### Basic Usage

```typescript
import { DeadCodeAnalyzer } from "./analyzers/dead-code";
import { AnalysisConfig } from "./analyzers/config";

const analyzer = new DeadCodeAnalyzer();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["node_modules/**", "dist/**"],
  entryPoints: ["index.tsx", "App.tsx"],
  deadCode: {
    enabled: true,
    checkDynamicImports: true,
    confidenceThreshold: "medium",
  },
  // ... other config options
};

const report = await analyzer.analyze(config);

console.log(`Found ${report.summary.totalUnusedExports} unused exports`);
```

### Generate Reports

```typescript
import { DeadCodeReportGenerator } from "./analyzers/dead-code";

const generator = new DeadCodeReportGenerator();

// Generate JSON report
await generator.generateToFile(report, {
  format: "json",
  outputPath: "reports/dead-code.json",
});

// Generate HTML report
await generator.generateToFile(report, {
  format: "html",
  outputPath: "reports/dead-code.html",
  groupByFile: true,
});

// Generate Markdown report
await generator.generateToFile(report, {
  format: "markdown",
  outputPath: "reports/dead-code.md",
});
```

### Generate Removal Plan

```typescript
const plan = analyzer.generateRemovalPlan(report);

console.log(`Actions: ${plan.actions.length}`);
console.log(`Safety Level: ${plan.safetyLevel}`);
console.log(`Estimated Impact: ${plan.estimatedImpact.linesRemoved} lines`);
```

## Configuration

### Dead Code Options

```typescript
deadCode: {
  enabled: boolean; // Enable/disable dead code analysis
  checkDynamicImports: boolean; // Check for dynamic import usage
  confidenceThreshold: "high" | "medium" | "low"; // Minimum confidence level
}
```

### Entry Points

Entry points are files that serve as the starting point of your application. They should never be marked as dead code.

```typescript
entryPoints: ["index.tsx", "App.tsx", "vite.config.ts", "vitest.config.ts"];
```

## Report Structure

### DeadCodeReport

```typescript
interface DeadCodeReport {
  analyzer: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  unusedExports: UnusedExport[];
  unusedFunctions: UnusedFunction[];
  unusedVariables: UnusedVariable[];
  unusedTypes: UnusedType[];
  confidence: "high" | "medium" | "low";
  summary: {
    totalUnusedExports: number;
    totalUnusedFunctions: number;
    totalUnusedVariables: number;
    totalUnusedTypes: number;
    filesAffected: number;
  };
}
```

### UnusedExport

```typescript
interface UnusedExport {
  file: string;
  name: string;
  line: number;
  column?: number;
  type: "function" | "class" | "variable" | "type" | "interface" | "enum";
  exportType: "named" | "default";
  potentialDynamicUsage: boolean;
}
```

## Confidence Levels

- **High**: No potential dynamic usage detected, dynamic import checking enabled
- **Medium**: Dynamic import checking disabled or some potential dynamic usage
- **Low**: Significant potential for dynamic usage detected

## Dynamic Usage Detection

The analyzer attempts to detect code that might be used dynamically:

- React hooks (e.g., `useCustomHook`)
- Event handlers (e.g., `handleClick`, `onClick`)
- React components (e.g., `MyComponent`)
- Context providers (e.g., `AuthProvider`)

Items with potential dynamic usage are flagged in the report and marked as requiring review.

## Example Output

### Console Output

```
🔍 Running dead code analysis...

📊 Analysis Summary:
   Unused Exports: 15
   Unused Functions: 8
   Unused Variables: 3
   Unused Types: 4
   Files Affected: 12
   Confidence Level: high

📋 Removal Plan:
   Actions: 15
   Files Affected: 12
   Exports to Remove: 15
   Estimated Lines Removed: 45
   Safety Level: safe

✅ JSON report saved to: reports/dead-code-report.json
✅ HTML report saved to: reports/dead-code-report.html
✅ Markdown report saved to: reports/dead-code-report.md

✨ Analysis complete!
```

## Integration with Knip

This analyzer uses [Knip](https://knip.dev/) under the hood. Make sure you have a `knip.config.ts` file in your project root:

```typescript
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["index.tsx", "App.tsx"],
  project: ["**/*.ts", "**/*.tsx"],
  ignore: ["node_modules/**", "dist/**"],
};

export default config;
```

## Best Practices

1. **Review Before Removing**: Always review the report before removing code, especially items with low confidence or potential dynamic usage.

2. **Start with High Confidence**: Begin by removing only high-confidence unused code.

3. **Test After Removal**: Run your test suite after removing dead code to ensure nothing breaks.

4. **Use Entry Points**: Properly configure entry points to avoid false positives.

5. **Check Dynamic Usage**: Enable `checkDynamicImports` to reduce false positives for dynamically imported code.

## Limitations

- May not detect all dynamic usage patterns
- String-based imports are difficult to detect
- Reflection and meta-programming patterns may cause false positives
- External references (e.g., from HTML files) are not detected

## See Also

- [Knip Documentation](https://knip.dev/)
- [Analysis Configuration](../config/README.md)
- [Base Analyzer](../base/README.md)
