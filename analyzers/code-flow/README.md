# Code Flow Validator

Validates that code follows proper data flow patterns from UI → Services → State → Storage, ensuring architectural consistency and best practices.

## Features

- **Data Flow Tracing**: Traces data flow from React components through services and state
- **Redux Pattern Validation**: Ensures Redux patterns are followed correctly
- **Service Layer Enforcement**: Checks that components use service layer instead of direct API calls
- **Direct Storage Detection**: Identifies direct localStorage/sessionStorage access
- **State Mutation Detection**: Finds direct state mutations that bypass Redux
- **Type Safety Checks**: Verifies proper TypeScript typing in state access

## Usage

```typescript
import { CodeFlowValidator } from "./analyzers/code-flow";
import { AnalysisConfig } from "./analyzers/config";

const validator = new CodeFlowValidator();

const config: AnalysisConfig = {
  include: ["src/**/*.tsx", "components/**/*.tsx"],
  exclude: ["node_modules", "**/*.test.ts"],
  flowValidation: {
    enabled: true,
    enforceReduxPatterns: true,
    enforceServiceLayer: true,
  },
  // ... other config options
};

const report = await validator.analyze(config);

console.log(`Components analyzed: ${report.totalComponents}`);
console.log(`Violations found: ${report.totalViolations}`);
console.log(`Critical: ${report.criticalViolations}`);
```

## Report Structure

The validator returns a `CodeFlowReport` containing:

- **traces**: Data flow traces for each component
- **patternViolations**: Redux pattern violations
- **serviceLayerViolations**: Service layer usage violations
- **totalComponents**: Number of components analyzed
- **componentsWithViolations**: Components with at least one violation
- **totalViolations**: Total number of violations found
- **criticalViolations**: Number of error-level violations

## Violation Types

### Flow Violations

- **direct-state-mutation**: Direct mutation of state instead of using Redux actions
- **missing-service-layer**: Direct API calls instead of using service layer
- **direct-storage-access**: Direct localStorage/sessionStorage access
- **improper-redux-usage**: Incorrect Redux patterns
- **missing-type-safety**: Missing or improper TypeScript types

### Pattern Violations

- **redux**: Redux pattern violations (direct mutations, improper dispatch)
- **service-layer**: Service layer violations (direct API calls)
- **component-structure**: Component structure issues

## Data Flow Trace

For each component, the validator traces:

- **State Access**: Redux state access via useSelector
- **Service Calls**: Calls to service layer methods
- **Direct Storage Access**: Direct localStorage/sessionStorage usage
- **Violations**: Any flow violations found

## Best Practices Enforced

### Redux Patterns

✅ **Correct**:

```typescript
const dispatch = useDispatch();
dispatch(updateUser({ name: "John" }));
```

❌ **Incorrect**:

```typescript
state.user.name = "John"; // Direct mutation
```

### Service Layer

✅ **Correct**:

```typescript
const userService = getService<IUserService>("UserService");
const user = await userService.getUser(id);
```

❌ **Incorrect**:

```typescript
const response = await fetch("/api/user/" + id); // Direct API call
```

### Storage Access

✅ **Correct**:

```typescript
const storageService = getService<IStorageService>("StorageService");
await storageService.save("user", userData);
```

❌ **Incorrect**:

```typescript
localStorage.setItem("user", JSON.stringify(userData)); // Direct access
```

## Configuration

```typescript
{
  flowValidation: {
    enabled: true,              // Enable flow validation
    enforceReduxPatterns: true, // Check Redux patterns
    enforceServiceLayer: true,  // Check service layer usage
  }
}
```

## Example Output

```
=== Code Flow Validation Report ===

Total components analyzed: 25
Components with violations: 8
Total violations: 15
Critical violations: 3

--- Component Data Flow Traces ---

UserProfile (src/components/UserProfile.tsx):
  State access: 3
  Service calls: 1
  Direct storage access: 2
  Violations: 2
    [WARNING] Line 45: direct-storage-access
      → Use StorageService instead of direct localStorage access
    [ERROR] Line 67: direct-state-mutation
      → Use Redux actions to update state instead of direct mutation

--- Redux Pattern Violations ---
[ERROR] src/components/Dashboard.tsx:123
  Direct state mutation detected
  → Use Redux actions and reducers to update state

--- Service Layer Violations ---
[WARNING] UserList (src/components/UserList.tsx:89)
  Direct fetch call in component
  → Move API calls to service layer

=== Validation Complete ===

⚠️  Found 15 violations that need attention.
❌ 3 critical violations must be fixed.
```

## Severity Levels

- **error**: Critical violations that must be fixed (direct mutations, broken patterns)
- **warning**: Best practice violations that should be addressed (direct API calls, storage access)

## Integration with Other Analyzers

The Code Flow Validator works well with:

- **Service Integration Analyzer**: Ensures services are properly integrated
- **Type System Optimizer**: Improves type safety in data flow
- **Dependency Graph Analyzer**: Visualizes component-service relationships

## Limitations

- Only analyzes TypeScript/React components
- May not detect all dynamic patterns
- Requires Redux for state management checks
- Service layer detection is pattern-based

## Future Enhancements

- [ ] Support for other state management libraries (MobX, Zustand)
- [ ] Detect async/await patterns
- [ ] Analyze error handling in data flow
- [ ] Generate flow diagrams
- [ ] Auto-fix capabilities for common violations
