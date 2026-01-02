# Duplicate Code Detector

Detects duplicate code blocks across the codebase using jscpd and provides refactoring suggestions.

## Features

- **Duplicate Detection**: Uses jscpd to find similar code blocks
- **Similarity Calculation**: Configurable similarity threshold
- **Smart Grouping**: Groups duplicates by similarity
- **Impact Analysis**: Categorizes duplicates by impact (high/medium/low)
- **Refactoring Suggestions**: Generates actionable refactoring recommendations
- **Priority Calculation**: Prioritizes high-impact duplicates

## Usage

```typescript
import { DuplicateCodeDetector } from "./analyzers/duplicate-code";
import { AnalysisConfig } from "./analyzers/config";

const detector = new DuplicateCodeDetector();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["**/*.test.ts", "**/node_modules/**"],
  entryPoints: ["src/index.tsx"],
  duplicates: {
    enabled: true,
    minLines: 5,
    minTokens: 50,
    similarityThreshold: 0.85,
  },
  // ... other config
};

const report = await detector.analyze(config);

console.log(`Found ${report.summary.totalDuplicates} duplicate groups`);
console.log(`Potential lines saved: ${report.summary.potentialLinesSaved}`);

// Process high-impact duplicates
const highImpact = report.duplicates.filter((d) => d.impact === "high");
for (const duplicate of highImpact) {
  console.log(`\nDuplicate found in ${duplicate.occurrences} places:`);
  console.log(`Suggestion: ${duplicate.suggestedRefactoring.description}`);
  console.log(`Target: ${duplicate.suggestedRefactoring.targetLocation}`);
}
```

## Configuration

- `minLines`: Minimum number of lines for a duplicate (default: 5)
- `minTokens`: Minimum number of tokens for a duplicate (default: 50)
- `similarityThreshold`: Similarity threshold 0-1 (default: 0.85)
- `ignorePatterns`: Patterns to ignore during detection

## Refactoring Types

The detector suggests different refactoring strategies:

1. **extract-component**: For duplicate JSX/React components
2. **extract-hook**: For duplicate React hook logic
3. **extract-utility**: For duplicate utility functions
4. **extract-function**: For general duplicate code

## Impact Levels

- **High**: 3+ occurrences or large blocks (20+ lines)
- **Medium**: 2 occurrences with moderate size (10+ lines)
- **Low**: 2 occurrences with small size

## Example Output

```typescript
{
  duplicates: [
    {
      id: "abc-123",
      instances: [
        { file: "src/components/A.tsx", line: 10, endLine: 25, ... },
        { file: "src/components/B.tsx", line: 15, endLine: 30, ... },
        { file: "src/components/C.tsx", line: 20, endLine: 35, ... }
      ],
      similarity: 0.92,
      impact: "high",
      occurrences: 3,
      linesTotal: 48,
      suggestedRefactoring: {
        type: "extract-component",
        targetLocation: "src/components/shared",
        estimatedImpact: 32,
        priority: "high",
        description: "Extract duplicate JSX into a reusable component...",
        affectedFiles: ["src/components/A.tsx", "src/components/B.tsx", "src/components/C.tsx"]
      }
    }
  ],
  summary: {
    totalDuplicates: 15,
    totalInstances: 42,
    filesAffected: 28,
    linesDuplicated: 856,
    potentialLinesSaved: 612,
    highImpactCount: 5
  }
}
```

## Integration

The detector integrates with the analysis pipeline:

```typescript
import { AnalysisPipeline } from "./analyzers";
import { DuplicateCodeDetector } from "./analyzers/duplicate-code";

const pipeline = new AnalysisPipeline();
pipeline.addStage({
  name: "duplicate-detection",
  analyzer: new DuplicateCodeDetector(),
  config: analysisConfig,
});

const results = await pipeline.execute();
```
