# Unused Import Analyzer

Detects and automatically fixes unused import statements in TypeScript and JavaScript files using ESLint.

## Features

- **Unused Import Detection**: Identifies all unused import statements across the codebase
- **Import Categorization**: Distinguishes between value imports, type imports, and side-effect imports
- **Path Alias Resolution**: Handles TypeScript path aliases (e.g., `@/` imports)
- **Auto-Fix Capability**: Automatically removes unused imports with safety checks
- **Type Import Preservation**: Optionally preserves type-only imports even if unused

## Usage

```typescript
import { UnusedImportAnalyzer } from "./analyzers/unused-imports";
import { AnalysisConfig } from "./analyzers/config";

const analyzer = new UnusedImportAnalyzer();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["node_modules", "dist"],
  entryPoints: ["src/index.ts"],
  unusedImports: {
    enabled: true,
    autoFix: false,
    preserveTypeImports: true,
  },
  // ... other config
};

// Run analysis
const report = await analyzer.analyze(config);

console.log(`Found ${report.summary.totalUnusedImports} unused imports`);
console.log(`Affected files: ${report.summary.filesAffected}`);
console.log(`Auto-fixable: ${report.summary.autoFixable}`);

// Scan a single file
const unusedImports = await analyzer.scanFile("src/components/MyComponent.tsx");

// Auto-fix unused imports
if (config.unusedImports.autoFix) {
  for (const file of new Set(report.unusedImports.map((i) => i.file))) {
    const fileImports = report.unusedImports.filter((i) => i.file === file);
    const result = await analyzer.autoFix(file, fileImports);
    console.log(`Fixed ${result.importsRemoved} imports in ${file}`);
  }
}
```

## Import Categories

The analyzer categorizes imports into four types:

1. **Value Imports**: Regular imports used as values

   ```typescript
   import { useState } from "react";
   ```

2. **Type Imports**: Type-only imports

   ```typescript
   import type { User } from "./types";
   import { type Config } from "./config";
   ```

3. **Both**: Imports used as both values and types

   ```typescript
   import { MyClass } from "./MyClass";
   const instance = new MyClass();
   type MyType = typeof MyClass;
   ```

4. **Side-Effect**: Imports for side effects only
   ```typescript
   import "./styles.css";
   import "polyfills";
   ```

## Path Alias Resolution

The analyzer automatically resolves TypeScript path aliases:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// In your code
import { MyComponent } from '@/components/MyComponent';
// Resolves to: /path/to/project/components/MyComponent
```

## Auto-Fix Safety

The auto-fix feature includes safety checks:

- ✅ Simple single-line imports
- ✅ Named imports (removes only unused names)
- ✅ Default imports
- ❌ Multi-line imports with comments
- ❌ Complex import statements
- ❌ Type-only imports (when `preserveTypeImports` is true)

## Configuration Options

```typescript
interface UnusedImportsConfig {
  enabled: boolean; // Enable/disable the analyzer
  autoFix: boolean; // Automatically fix unused imports
  preserveTypeImports: boolean; // Keep type-only imports even if unused
}
```

## Report Structure

```typescript
interface UnusedImportsReport {
  analyzer: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  unusedImports: UnusedImport[];
  summary: {
    totalUnusedImports: number;
    filesAffected: number;
    autoFixable: number;
    typeOnlyImports: number;
  };
}

interface UnusedImport {
  file: string;
  line: number;
  column: number;
  importName: string;
  importPath: string;
  isTypeOnly: boolean;
  isNamedImport: boolean;
  canAutoFix: boolean;
  category: ImportCategory;
}
```

## Integration with ESLint

The analyzer uses ESLint with TypeScript support to detect unused imports. It relies on:

- `@typescript-eslint/no-unused-vars` rule
- `no-unused-vars` rule (for JavaScript files)

Make sure your `.eslintrc.json` is properly configured:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ]
  }
}
```

## Examples

### Example 1: Detect Unused Imports

```typescript
// Before
import { useState, useEffect, useMemo } from "react";
import { formatDate } from "@/utils/date";
import type { User } from "@/types";

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// Analysis Result:
// - useEffect: unused (line 1)
// - useMemo: unused (line 1)
// - formatDate: unused (line 2)
// - User: unused type (line 3)
```

### Example 2: Auto-Fix

```typescript
// After auto-fix (with preserveTypeImports: false)
import { useState } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

### Example 3: Named Import Removal

```typescript
// Before
import { Button, Card, Input, Select } from "@/components";

function MyForm() {
  return <Button>Submit</Button>;
}

// After auto-fix
import { Button } from "@/components";

function MyForm() {
  return <Button>Submit</Button>;
}
```

## Performance

- Analyzes ~100 files per second (typical TypeScript project)
- Uses ESLint's built-in caching for improved performance
- Parallel file processing for large codebases

## Limitations

- Cannot detect imports used only in JSDoc comments
- May not detect dynamic string-based imports
- Requires valid TypeScript/JavaScript syntax
- ESLint configuration must be present

## Best Practices

1. **Run analysis before auto-fix**: Always review the report before enabling auto-fix
2. **Preserve type imports**: Enable `preserveTypeImports` to avoid breaking type-only imports
3. **Use with version control**: Commit before running auto-fix for easy rollback
4. **Combine with tests**: Run tests after auto-fix to ensure nothing broke
5. **Regular cleanup**: Run the analyzer regularly to prevent import bloat
