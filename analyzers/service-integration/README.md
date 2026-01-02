# Service Integration Analyzer

Analyzes service layer integration in the codebase to ensure services are properly registered, used, and follow best practices.

## Features

- **Service Detection**: Automatically detects service files in the codebase
- **Interface Matching**: Matches services with their interface definitions
- **Registration Analysis**: Checks if services are registered in the service container
- **Usage Tracking**: Counts how many times each service is used and where
- **Integration Issues**: Identifies missing interfaces, unregistered services, and unused services
- **Improvement Suggestions**: Provides actionable suggestions for better service integration

## Usage

```typescript
import { ServiceIntegrationAnalyzer } from "./analyzers/service-integration";
import { AnalysisConfig } from "./analyzers/config";

const analyzer = new ServiceIntegrationAnalyzer();

const config: AnalysisConfig = {
  include: ["services/**/*.ts", "src/**/*.ts"],
  exclude: ["node_modules", "dist", "**/*.test.ts"],
  serviceAnalysis: {
    enabled: true,
    checkIntegration: true,
  },
  // ... other config options
};

const report = await analyzer.analyze(config);

console.log(`Total services: ${report.totalServices}`);
console.log(`Registered: ${report.registeredServices}`);
console.log(`Unused: ${report.unusedCount}`);
console.log(`Issues: ${report.integrationIssues.length}`);
```

## Report Structure

The analyzer returns a `ServiceAnalysisReport` containing:

- **services**: Array of all detected services with their info
- **unusedServices**: Services that are not used anywhere
- **partiallyIntegrated**: Services missing interface, implementation, or registration
- **integrationIssues**: Specific issues found (missing interface, not registered, etc.)
- **suggestions**: Actionable suggestions for improvement
- **totalServices**: Total number of services found
- **registeredServices**: Number of services registered in container
- **unusedCount**: Number of unused services

## Service Detection

The analyzer detects services by:

1. Looking for files in `services/` directory (excluding `interfaces/` and container files)
2. Looking for files with "Service" in the name (excluding interfaces starting with "I")

## Integration Checks

For each service, the analyzer checks:

- ✅ Has an interface definition (I{ServiceName}Service)
- ✅ Is registered in the service container
- ✅ Is actually used in the codebase
- ✅ Has consumers (files that import/use it)

## Issue Types

- **missing-interface**: Service doesn't have an interface definition
- **missing-implementation**: Interface exists but no implementation found
- **not-registered**: Service is used but not registered in container
- **unused**: Service is registered but never used
- **interface-mismatch**: Service implementation doesn't match interface

## Suggestion Types

- **integrate**: Add missing interface or registration
- **remove**: Delete unused service
- **merge**: Consolidate similar services
- **split**: Break up overly complex service

## Example Output

```
=== Service Integration Analysis Report ===

Total services found: 8
Registered services: 5
Unused services: 2
Partially integrated: 3
Integration issues: 4

--- Services ---

Session:
  File: services/session/SessionService.ts
  Interface: services/interfaces/ISessionService.ts
  Registered: Yes
  Usage count: 15
  Consumers: 12

DataIntegrity:
  File: services/DataIntegrityService.ts
  Interface: None
  Registered: No
  Usage count: 3
  Consumers: 2

--- Integration Issues ---
[WARNING] DataIntegrity: Service does not have an interface definition
[ERROR] DataIntegrity: Service is used but not registered in container

--- Suggestions ---

DataIntegrity (integrate, priority: high):
  Reason: Service is used but not registered in container
  Steps:
    1. Create interface IDataIntegrityService in services/interfaces/
    2. Register DataIntegrityService in serviceRegistration.ts
    3. Update consumers to use dependency injection
```

## Configuration

The analyzer respects the following configuration options:

```typescript
{
  serviceAnalysis: {
    enabled: true,           // Enable service analysis
    checkIntegration: true,  // Check integration status
  }
}
```

## Best Practices

1. **Always create interfaces**: Every service should have an interface for better abstraction
2. **Register services**: Use the service container for dependency injection
3. **Remove unused services**: Clean up services that are no longer needed
4. **Consolidate similar services**: Merge services with overlapping functionality
5. **Follow naming conventions**: Use {Name}Service for implementations and I{Name}Service for interfaces

## Integration with Other Analyzers

The Service Integration Analyzer works well with:

- **Dead Code Analyzer**: Identifies unused service methods
- **Orphaned File Detector**: Finds service files not connected to the app
- **Code Flow Validator**: Ensures services are used correctly in the data flow

## Limitations

- Only detects TypeScript services
- Requires service container pattern for registration detection
- May not detect dynamic service instantiation
- Similarity detection for merging is heuristic-based

## Future Enhancements

- [ ] Detect interface/implementation mismatches
- [ ] Analyze service method usage
- [ ] Suggest service splitting for large services
- [ ] Detect circular service dependencies
- [ ] Generate service documentation
