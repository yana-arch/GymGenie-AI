# Type System Optimizer

Analyzer for TypeScript type system optimization. Detects duplicate types, unused types, and suggests consolidation opportunities.

## Features

- **Duplicate Type Detection**: Finds type definitions with the same name across multiple files
- **Unused Type Detection**: Identifies exported types that are not imported or used anywhere
- **Type Consolidation**: Suggests opportunities to consolidate similar types
- **Type Centralization**: Recommends moving commonly used types to a central location

## Usage

```typescript
import { TypeSystemOptimizer } from "./analyzers/type-system";
import { AnalysisConfig } from "./analyzers/config";

const optimizer = new TypeSystemOptimizer();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["node_modules", "dist", "**/*.test.ts"],
  entryPoints: ["src/index.ts"],
  typeOptimization: {
    enabled: true,
    suggestCentralization: true,
  },
};

const report = await optimizer.analyze(config);

console.log(`Found ${report.duplicateCount} duplicate types`);
console.log(`Found ${report.unusedCount} unused types`);
console.log(
  `Found ${report.consolidationOpportunities.length} consolidation opportunities`
);
```

## Report Structure

```typescript
interface TypeSystemReport {
  duplicateTypes: DuplicateType[];
  unusedTypes: UnusedType[];
  consolidationOpportunities: TypeConsolidation[];
  centralizationPlan: CentralizationPlan | null;
  totalTypesAnalyzed: number;
  duplicateCount: number;
  unusedCount: number;
}
```

## Example Output

```json
{
  "duplicateTypes": [
    {
      "name": "UserProfile",
      "locations": [
        { "file": "src/types/user.ts", "line": 10, "isExported": true },
        {
          "file": "src/features/profile/types.ts",
          "line": 5,
          "isExported": true
        }
      ],
      "definition": "interface UserProfile { id: string; name: string; }",
      "canMerge": true
    }
  ],
  "unusedTypes": [
    {
      "name": "OldUserType",
      "file": "src/types/legacy.ts",
      "line": 15,
      "isExported": true
    }
  ],
  "consolidationOpportunities": [
    {
      "types": ["UserProps", "UserProperties"],
      "suggestedName": "UserProps",
      "targetFile": "src/types/index.ts",
      "affectedFiles": ["src/components/User.tsx", "src/features/user/types.ts"]
    }
  ]
}
```

## Configuration

The analyzer respects the following configuration options:

- `include`: Glob patterns for files to analyze
- `exclude`: Glob patterns for files to exclude
- `typeOptimization.enabled`: Enable/disable type optimization analysis
- `typeOptimization.suggestCentralization`: Enable/disable centralization suggestions

## Requirements Validated

- **5.1**: Identifies duplicate type definitions across files
- **5.2**: Finds types that can be consolidated
- **5.3**: Detects unused type exports
- **5.5**: Suggests moving common types to centralized type files
