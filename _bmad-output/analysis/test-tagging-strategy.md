# Test Tagging Strategy

This document outlines the comprehensive test tagging strategy for GymGenie-AI, enabling selective test execution for CI/CD optimization and faster feedback loops.

## Tag Categories

### @smoke - Critical Path Tests
**When to use:** Core functionality that must work for the application to be usable
**Execution:** Runs on every commit
**Target runtime:** < 2 minutes
**Examples:**
- Basic app initialization
- User authentication flows
- Core workout session creation
- Essential data persistence

### @p0 - Critical Functionality
**When to use:** Safety features and functionality that blocks users if broken
**Execution:** Runs on every PR and main branch build
**Target runtime:** < 5 minutes
**Examples:**
- Injury detection and safety systems
- User data protection and privacy
- Session state management
- Critical error handling

### @p1 - High Priority Features
**When to use:** Main feature workflows and important user interactions
**Execution:** Runs on nightly builds and pre-release
**Target runtime:** < 15 minutes
**Examples:**
- Preference learning algorithms
- Form correction analysis
- Historical pattern detection
- Feedback-driven personalization

### @p2 - Medium Priority Features
**When to use:** Important but not blocking functionality
**Execution:** Runs on nightly builds
**Target runtime:** < 30 minutes
**Examples:**
- Performance optimizations
- Advanced analytics
- Edge case handling
- Integration testing

### @p3 - Low Priority Features
**When to use:** Nice-to-have features and minor edge cases
**Execution:** Runs on weekly builds
**Target runtime:** < 60 minutes
**Examples:**
- Documentation tests
- Minor UI enhancements
- Rare edge cases
- Experimental features

## Tag Usage Examples

### BDD Test Structure with Tags

```typescript
import { createSmokeTest, createCriticalTest, createHighPriorityTest } from '../../../test-utils';

describe('Feature Name BDD Tests', () => {
  given('a core application scenario', () => {
    when('critical action is performed', () => {
      then(createSmokeTest(TestCategory.STORAGE, TestType.UNIT, 1, 'should save essential data'), () => {
        // Core functionality test
      });
    });
  });

  given('a safety-critical scenario', () => {
    when('user safety is at risk', () => {
      then(createCriticalTest(TestCategory.SAFETY, TestType.UNIT, 1, 'should prevent injury'), () => {
        // Safety feature test
      });
    });
  });

  given('a main feature workflow', () => {
    when('user interacts with primary feature', () => {
      then(createHighPriorityTest(TestCategory.UNIFIED, TestType.INTEGRATION, 1, 'should complete workflow'), () => {
        // Main feature test
      });
    });
  });
});
```

## Selective Test Execution

### Package.json Scripts

```json
{
  "test:smoke": "vitest --run --grep '@smoke'",
  "test:p0": "vitest --run --grep '@p0'",
  "test:p1": "vitest --run --grep '@p1'",
  "test:critical": "vitest --run --grep '@smoke|@p0'",
  "test:regression": "vitest --run --grep '@p1|@p2|@p3'",
  "test:full": "vitest --run"
}
```

### CI/CD Pipeline Integration

#### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:smoke

  critical-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:critical

  full-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:full
```

## Tagging Guidelines

### 1. Consistency Rules
- Use the standardized test generators from `test-utils`
- Maintain alphabetical ordering within priority levels
- Ensure all tests have at least one priority tag
- Review and update tags quarterly

### 2. Priority Assignment Decision Tree

```
Is this test for core app functionality?
  ├─ Yes → @smoke
  └─ No
      ├─ Is this a safety or data protection feature?
      │    ├─ Yes → @p0
      │    └─ No
      │         ├─ Is this a main user workflow?
      │         │    ├─ Yes → @p1
      │         │    └─ No
      │         │         ├─ Is this important but not blocking?
      │         │         │    ├─ Yes → @p2
      │         │         │    └─ No → @p3
```

### 3. Test Count Targets per Category
- @smoke: 10-15 tests (2-3 min runtime)
- @p0: 20-30 tests (3-5 min runtime)
- @p1: 40-60 tests (10-15 min runtime)
- @p2: 60-80 tests (20-30 min runtime)
- @p3: 80-100 tests (30-60 min runtime)

## Tag Compliance Validation

### Validation Script
```bash
# Check for untagged tests
npm run test:validate-tags

# Generate tag distribution report
npm run test:tag-report

# Verify test coverage per priority
npm run test:coverage-by-priority
```

### Automated Rules
- All tests must have at least one priority tag
- Smoke tests must complete in < 2 seconds
- P0 tests must complete in < 5 seconds
- Tag distribution must follow target percentages
- No test should have conflicting priorities

## Migration Process

### For Existing Tests
1. Review test purpose and business impact
2. Assign appropriate priority using decision tree
3. Replace existing test generators with tagged versions
4. Validate execution times meet targets
5. Update CI/CD pipeline stages

### For New Tests
1. Determine priority during test planning
2. Use appropriate tagged test generator
3. Verify test meets runtime requirements
4. Include tag validation in PR checklist

## Monitoring and Optimization

### Metrics to Track
- Test execution time by priority
- Tag distribution percentages
- Test failure rates by priority
- CI/CD pipeline duration trends
- Developer feedback loop times

### Optimization Strategies
- Regularly review and adjust tag assignments
- Optimize slow tests to lower priority levels
- Parallelize test execution where possible
- Use test caching for expensive operations
- Monitor and address flaky tests by priority

## Troubleshooting

### Common Issues
1. **Tests not running with tag filters**
   - Check tag syntax (@smoke not @SMOKE)
   - Verify test generator usage
   - Ensure tags are in test description, not comments

2. **CI pipeline timeouts**
   - Review test distribution
   - Check for unexpectedly slow tests
   - Consider moving tests to lower priority

3. **Inconsistent tagging**
   - Run validation scripts
   - Review team guidelines
   - Update test generators if needed

## Support and Resources

- **Tag Review:** Schedule monthly tag review sessions
- **Documentation:** Keep this guide updated with examples
- **Tools:** Use provided validation and reporting scripts
- **Training:** Include tagging strategy in developer onboarding