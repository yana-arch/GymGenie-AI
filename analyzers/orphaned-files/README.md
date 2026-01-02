# Orphaned File Detector

Detects files that are not referenced anywhere in the codebase and categorizes them by safety level for potential removal.

## Features

- **Dependency Graph Building**: Constructs a complete dependency graph of the codebase
- **Entry Point Detection**: Automatically identifies entry points and traces reachable files
- **Import/Export Parsing**: Analyzes TypeScript/JavaScript imports and exports using TypeScript Compiler API
- **Smart Categorization**: Categorizes orphaned files into safe-to-delete, needs-review, and keep-for-reference
- **Pattern Exclusion**: Supports glob patterns to exclude specific files (tests, configs, etc.)
- **Impact Assessment**: Estimates size reduction and provides detailed reasoning for each orphaned file

## Usage

```typescript
import { OrphanedFileDetector } from "./analyzers/orphaned-files";
import { AnalysisConfig } from "./analyzers/config";

const detector = new OrphanedFileDetector();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["node_modules/**", "dist/**"],
  entryPoints: ["src/index.tsx", "src/App.tsx"],
  orphanedFiles: {
    enabled: true,
    excludePatterns: ["**/*.test.ts", "**/*.test.tsx", "**/vite.config.ts"],
  },
  // ... other config options
};

const report = await detector.analyze(config);

console.log(`Found ${report.summary.totalOrphaned} orphaned files`);
console.log(`Safe to delete: ${report.summary.safeToDelete}`);
console.log(`Needs review: ${report.summary.needsReview}`);
console.log(
  `Estimated size reduction: ${report.summary.estimatedSizeReduction} bytes`
);
```

## How It Works

### 1. Dependency Graph Construction

The analyzer builds a complete dependency graph by:

- Scanning all TypeScript/JavaScript files in the project
- Parsing imports and exports using TypeScript Compiler API
- Resolving relative and absolute import paths
- Creating nodes (files) and edges (dependencies)

### 2. Reachability Analysis

Starting from entry points, the analyzer:

- Performs breadth-first search (BFS) to find all reachable files
- Marks files that can be reached through import chains
- Identifies files that are not reachable from any entry point

### 3. Exclusion Pattern Matching

Files matching exclusion patterns are filtered out:

- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Configuration files (`**/vite.config.ts`, etc.)
- Custom patterns specified in configuration

### 4. Categorization

Orphaned files are categorized based on:

**Safe to Delete:**

- Type-only files with no references
- Small, old utility files (< 5KB, > 90 days old)
- Files with clear indicators of being unused

**Needs Review:**

- Recently modified files (< 30 days)
- Large files (> 10KB)
- Test files (might be for future features)
- Files with unclear usage patterns

**Keep for Reference:**

- Configuration files
- Documentation files
- Files explicitly marked to keep

### 5. Impact Assessment

For each orphaned file, the analyzer provides:

- File type classification
- Last modified date
- File size
- Potential reason for being orphaned
- Estimated impact of removal

## Configuration

```typescript
interface OrphanedFilesConfig {
  enabled: boolean;
  excludePatterns: string[];
}
```

### Options

- `enabled`: Enable/disable orphaned file detection
- `excludePatterns`: Array of glob patterns to exclude from analysis

### Default Exclude Patterns

```typescript
[
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/vite.config.ts",
  "**/vitest.config.ts",
  "**/tailwind.config.js",
  "**/postcss.config.js",
];
```

## Report Structure

```typescript
interface OrphanedFilesReport {
  analyzer: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  orphanedFiles: OrphanedFile[];
  categorized: CategorizedOrphans;
  dependencyGraph: {
    totalNodes: number;
    totalEdges: number;
    entryPoints: string[];
  };
  summary: {
    totalOrphaned: number;
    safeToDelete: number;
    needsReview: number;
    keepForReference: number;
    estimatedSizeReduction: number;
  };
}
```

## Example Output

```json
{
  "analyzer": "OrphanedFileDetector",
  "timestamp": "2025-01-02T10:30:00.000Z",
  "duration": 1250,
  "success": true,
  "orphanedFiles": [
    {
      "path": "src/utils/oldHelper.ts",
      "fileType": "utility",
      "lastModified": "2024-06-15T08:20:00.000Z",
      "size": 2048,
      "potentialReason": "Not reachable from any entry point"
    }
  ],
  "categorized": {
    "safeToDelete": [
      /* ... */
    ],
    "needsReview": [
      /* ... */
    ],
    "keepForReference": [
      /* ... */
    ]
  },
  "dependencyGraph": {
    "totalNodes": 245,
    "totalEdges": 512,
    "entryPoints": ["index.tsx", "App.tsx"]
  },
  "summary": {
    "totalOrphaned": 12,
    "safeToDelete": 5,
    "needsReview": 6,
    "keepForReference": 1,
    "estimatedSizeReduction": 15360
  }
}
```

## Best Practices

1. **Review Before Deleting**: Always review files marked as "safe to delete" before removing them
2. **Check Git History**: Look at git history to understand why files were created
3. **Run Tests**: Run full test suite after removing orphaned files
4. **Incremental Cleanup**: Remove files in small batches and verify after each batch
5. **Keep Backups**: Create git commits or backups before bulk deletions

## Limitations

- Cannot detect files used through dynamic imports with computed paths
- May not detect files used only in build scripts or external tools
- Requires accurate entry point configuration for best results
- Does not analyze non-TypeScript/JavaScript files

## Integration with Other Analyzers

The Orphaned File Detector works well with:

- **Dead Code Analyzer**: Identifies unused exports within files
- **Unused Import Analyzer**: Cleans up imports before checking for orphaned files
- **Dependency Graph Analyzer**: Provides visualization of file relationships

## Performance

- Typical analysis time: 1-3 seconds for ~250 files
- Memory usage: ~50-100MB for medium-sized projects
- Scales linearly with number of files

## Troubleshooting

**Issue**: Entry points not found

- **Solution**: Verify entry point paths are relative to project root

**Issue**: Too many false positives

- **Solution**: Add more patterns to `excludePatterns` configuration

**Issue**: Files incorrectly marked as orphaned

- **Solution**: Check if files are used through dynamic imports or external tools
