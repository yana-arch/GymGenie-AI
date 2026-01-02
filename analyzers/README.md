# Code Analysis and Cleanup System

This directory contains the code analysis and cleanup system for GymGenie AI.

## Structure

````
analyzers/
├── config/           # Configuration system
│   ├── AnalysisConfig.ts    # Configuration schema and types
│   ├── ConfigParser.ts      # Configuration file parser (JSON/YAML)
│   └── templates/           # Configuration templates
│       ├── default.json     # Default configuration
│       ├── minimal.json     # Minimal analysis configuration
│       └── comprehensive.yaml # Comprehensive analysis configuration
├── types/            # Shared type definitions
│   └── index.ts      # Core types and interfaces
├── utils/            # Shared utilities
│   ├── logger.ts     # Logging infrastructure
│   ├── errors.ts     # Error handling and recovery
│   └── fileUtils.ts  # File system utilities
├── base/             # Base classes
│   └── BaseAnalyzer.ts # Abstract base analyzer class
└── index.ts          # Main exports

## Installed Tools

- **Knip** (v5.79.0): Dead code and unused exports detection
- **ESLint** (v9.39.2): Linting and unused imports detection
- **dependency-cruiser** (v17.3.5): Dependency graph analysis
- **jscpd** (v4.0.5): Duplicate code detection
- **TypeScript Compiler API**: Type system analysis

## Configuration Files

- `.eslintrc.json`: ESLint configuration
- `knip.config.ts`: Knip configuration
- `.dependency-cruiser.js`: Dependency cruiser configuration
- `.jscpd.json`: Duplicate code detector configuration

## Usage

### Loading Configuration

```typescript
import { ConfigParser } from './analyzers/config';

// Load from file
const config = ConfigParser.loadConfig('./analysis.config.json');

// Or use default configuration
const defaultConfig = ConfigParser.loadConfig();
````

### Creating a Custom Analyzer

```typescript
import { BaseAnalyzer, AnalysisConfig, AnalysisReport } from "./analyzers";

interface MyReport extends AnalysisReport {
  findings: string[];
}

class MyAnalyzer extends BaseAnalyzer<MyReport> {
  constructor() {
    super("MyAnalyzer");
  }

  protected async runAnalysis(config: AnalysisConfig): Promise<MyReport> {
    // Implement your analysis logic
    return {
      analyzer: this.name,
      timestamp: new Date(),
      duration: 0,
      success: true,
      findings: [],
    };
  }
}
```

### Using Utilities

```typescript
import { Logger, LogLevel, fileExists, readFile } from "./analyzers/utils";

// Create a logger
const logger = new Logger({ level: LogLevel.INFO });
logger.info("Starting analysis...");

// File operations
if (fileExists("path/to/file.ts")) {
  const content = readFile("path/to/file.ts");
  // Process content
}
```

## Next Steps

1. Implement specific analyzers (Dead Code, Unused Imports, etc.)
2. Create analysis pipeline
3. Implement cleanup execution system
4. Add reporting and visualization

## Testing

Property-based tests and unit tests will be added for each analyzer to ensure correctness.
