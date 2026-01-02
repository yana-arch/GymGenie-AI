# Dependency Graph Analyzer

Analyzes module dependencies to detect circular dependencies, identify tightly coupled modules, and suggest decoupling strategies.

## Features

- **Dependency Graph Building**: Creates complete dependency graph of all modules
- **Circular Dependency Detection**: Finds circular import chains
- **Coupling Analysis**: Identifies tightly coupled modules
- **Decoupling Suggestions**: Provides actionable strategies to reduce coupling
- **Visualization**: Generates DOT format graphs for Graphviz
- **Metrics**: Calculates dependency metrics and coupling scores

## Usage

```typescript
import { DependencyGraphAnalyzer } from "./analyzers/dependency-graph";
import { AnalysisConfig } from "./analyzers/config";

const analyzer = new DependencyGraphAnalyzer();

const config: AnalysisConfig = {
  include: ["src/**/*.ts", "components/**/*.tsx"],
  exclude: ["node_modules", "**/*.test.ts"],
  entryPoints: ["src/main.ts", "App.tsx"],
  dependencies: {
    enabled: true,
    detectCircular: true,
    visualize: true,
  },
  // ... other config options
};

const report = await analyzer.analyze(config);

console.log(`Modules: ${report.metrics.totalModules}`);
console.log(`Circular: ${report.metrics.circularCount}`);
console.log(`Tightly coupled: ${report.metrics.tightlyCoupledCount}`);
```

## Report Structure

The analyzer returns a `DependencyGraphReport` containing:

- **graph**: Complete dependency graph with nodes and edges
- **circularDependencies**: Array of circular dependency cycles
- **couplingReport**: Tightly coupled modules and decoupling suggestions
- **visualization**: DOT format graph (if enabled)
- **metrics**: Dependency metrics and statistics

## Dependency Graph

The graph contains:

- **nodes**: Map of module paths to ModuleNode objects
- **edges**: Array of dependency edges between modules
- **entryPoints**: List of entry point modules
- **totalModules**: Total number of modules
- **totalDependencies**: Total number of dependencies

## Circular Dependencies

Each circular dependency includes:

- **cycle**: Array of module names forming the cycle
- **severity**: 'critical' (2-3 modules) or 'warning' (4+ modules)
- **suggestion**: Recommended fix strategy

## Coupling Analysis

The analyzer calculates coupling scores based on:

- Direct dependencies (0.5 points each direction)
- Shared dependencies (up to 0.3 points)
- Bidirectional dependencies (1.0 points)

Modules with coupling score ≥ 0.7 are considered tightly coupled.

## Decoupling Strategies

The analyzer suggests four main strategies:

### 1. Interface Abstraction

For bidirectional dependencies:

```typescript
// Before: A imports B, B imports A
// After: Both import IShared interface

interface IShared {
  doSomething(): void;
}

class A implements IShared {}
class B implements IShared {}
```

### 2. Extract Common

For modules with many shared dependencies:

```typescript
// Before: A and B both import X, Y, Z
// After: Extract to Common module

// common.ts
export { X, Y, Z };

// A.ts and B.ts
import { X, Y, Z } from "./common";
```

### 3. Dependency Injection

For direct dependencies:

```typescript
// Before: A directly imports B
import { B } from './B';

// After: Inject B through constructor
constructor(private b: IB) { }
```

### 4. Event Bus

For loosely related modules:

```typescript
// Before: A imports B to call methods
// After: Use event bus

eventBus.emit("action", data);
eventBus.on("action", handler);
```

## Visualization

The analyzer generates DOT format graphs compatible with Graphviz:

```bash
# Generate SVG
dot -Tsvg dependency-graph.dot -o dependency-graph.svg

# Generate PNG
dot -Tpng dependency-graph.dot -o dependency-graph.png

# Generate interactive HTML
dot -Tsvg dependency-graph.dot | dot2html > dependency-graph.html
```

Graph features:

- Entry points are highlighted in light blue
- Circular dependencies are shown in red
- Dynamic imports are shown as dashed lines

## Metrics

The analyzer calculates:

- **totalModules**: Number of modules analyzed
- **totalDependencies**: Number of dependency edges
- **circularCount**: Number of circular dependency cycles
- **tightlyCoupledCount**: Number of tightly coupled pairs
- **averageDependencies**: Average dependencies per module
- **maxDependencies**: Maximum dependencies for any module

## Configuration

```typescript
{
  dependencies: {
    enabled: true,        // Enable dependency analysis
    detectCircular: true, // Detect circular dependencies
    visualize: true,      // Generate visualization
  }
}
```

## Example Output

```
=== Dependency Graph Analysis Report ===

Total modules: 156
Total dependencies: 423
Average dependencies per module: 2.71
Max dependencies: 15
Circular dependencies: 3
Tightly coupled pairs: 8

--- Circular Dependencies ---

1. [CRITICAL] Cycle:
   UserService → SessionService → UserService
   Suggestion: Extract common functionality to a third module

2. [WARNING] Cycle:
   ComponentA → ComponentB → ComponentC → ComponentD → ComponentA
   Suggestion: Refactor to reduce coupling between modules

--- Tightly Coupled Modules ---
Average coupling score: 0.75
Max coupling score: 0.95

1. UserService ↔ SessionService
   Coupling score: 0.95
   Reason: Bidirectional dependency
   Shared dependencies: StorageService, ErrorHandler

2. Dashboard ↔ Navigation
   Coupling score: 0.82
   Reason: Share 5 common dependencies
   Shared dependencies: AppContext, UserSlice, ThemeProvider...

--- Decoupling Suggestions ---

1. UserService & SessionService (high priority)
   Strategy: interface-abstraction
   Impact: Breaks circular dependency
   Steps:
     1. Create interface for shared functionality
     2. Have both modules depend on interface instead of each other
     3. Use dependency injection to provide implementations

2. Dashboard & Navigation (medium priority)
   Strategy: extract-common
   Impact: Reduces shared dependencies
   Steps:
     1. Extract shared dependencies to common module
     2. Have both modules depend on common module
     3. Reduce direct coupling

--- Visualization ---
Saved DOT file to: dependency-graph.dot
To generate SVG: dot -Tsvg dependency-graph.dot -o dependency-graph.svg
To generate PNG: dot -Tpng dependency-graph.dot -o dependency-graph.png

=== Analysis Complete ===

⚠️  Found 3 circular dependencies that should be resolved.
⚠️  Found 8 tightly coupled module pairs.
```

## Best Practices

1. **Avoid Circular Dependencies**: Always resolve circular dependencies
2. **Minimize Coupling**: Keep coupling scores below 0.7
3. **Use Interfaces**: Abstract dependencies through interfaces
4. **Dependency Injection**: Prefer DI over direct imports
5. **Single Responsibility**: Each module should have one clear purpose
6. **Layered Architecture**: Organize modules in clear layers

## Integration with Other Analyzers

Works well with:

- **Orphaned File Detector**: Identifies unreachable modules
- **Code Flow Validator**: Ensures proper data flow patterns
- **Service Integration Analyzer**: Validates service dependencies

## Limitations

- Only analyzes TypeScript/JavaScript modules
- May not detect runtime dynamic imports
- Coupling score is heuristic-based
- Requires valid TypeScript configuration

## Future Enhancements

- [ ] Interactive visualization with zoom/pan
- [ ] Dependency impact analysis
- [ ] Auto-refactoring for simple cases
- [ ] Module size analysis
- [ ] Import cost calculation
- [ ] Dependency health score
