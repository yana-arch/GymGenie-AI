# Test Design: Epic 3 - Privacy-First Data Management

**Date:** 2026-01-09
**Author:** Wavister
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 3

**Risk Summary:**

- Total risks identified: 4
- High-priority risks (≥6): 2
- Critical categories: DATA, SEC, TECH

**Coverage Summary:**

- P0 scenarios: 4 (8 hours)
- P1 scenarios: 4 (4 hours)
- P2/P3 scenarios: 1 (0.5 hours)
- **Total effort**: 12.5 hours (~1.6 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   | Timeline |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- | -------- |
| R-301   | DATA     | Data synchronization conflict leading to inconsistent state | 2 | 3 | 6 | Implement versioned state reconciliation (CRDT-lite) | DEV | 2026-01-20 |
| R-302   | SEC      | PII leakage in AI recommendation metadata sync | 2 | 3 | 6 | Implement strict PII sanitization filter for metadata | DEV | 2026-01-20 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- |
| R-303   | TECH     | Local processing failure due to resource constraints | 2 | 2 | 4 | Use background workers and chunked processing | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description   | Probability | Impact | Score | Action  |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------- |
| R-304   | BUS      | Transparency report audit gap (missing decision data) | 1 | 3 | 3 | Enforce decision logging in AI service contract | QA |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 3.1: Sanitization filter | Unit | R-302 | 10 | DEV | Test with various PII patterns |
| 3.1: Data encryption at rest | API | - | 4 | QA | Verify AES-256 storage |
| 3.1: Local processing isolation | E2E | R-302 | 2 | QA | Verify zero network egress during inference |
| 3.1: Setup validation | API | - | 3 | DEV | Ensure local store initializes |

**Total P0**: 4 scenarios, 19 tests, 8 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 3.2: Settings respect | Integration | - | 5 | QA | Disable data point -> verify exclusion |
| 3.1: Sync reconciliation | Integration | R-301 | 4 | DEV | Offline conflicts -> resolve |
| 3.3: Explanation mapping | API | R-304 | 4 | QA | Input data -> verify explanation |
| 3.3: Audit journey | E2E | R-304 | 2 | QA | End-to-end transparency check |

**Total P1**: 4 scenarios, 15 tests, 4 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 3.2: Dashboard visual | Component | - | 3 | DEV | Visual state validation |

**Total P2**: 1 scenarios, 3 tests, 0.5 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement   | Test Level | Test Count | Owner | Notes   |
| ------------- | ---------- | ---------- | ----- | ------- |
| (None identified) | - | 0 | - | - |

**Total P3**: 0 tests, 0 hours

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] 3.1-UNIT: Basic sanitization (30s)
- [ ] 3.1-API: Store encryption check (45s)

**Total**: 2 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] 3.1-UNIT: Full sanitization suite (Unit)
- [ ] 3.1-API: Local store setup (API)
- [ ] 3.1-E2E: Network isolation check (E2E)

**Total**: 4 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] 3.2-INT: Privacy settings enforcement (Integration)
- [ ] 3.1-INT: Sync reconciliation (Integration)
- [ ] 3.3-API: Decision explanation logic (API)
- [ ] 3.3-E2E: Audit transparency journey (E2E)

**Total**: 4 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] 3.2-COMP: Dashboard UI states (Component)

**Total**: 1 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count             | Hours/Test | Total Hours       | Notes                   |
| --------- | ----------------- | ---------- | ----------------- | ----------------------- |
| P0        | 4                 | 2.0        | 8.0               | Security isolation heavy |
| P1        | 4                 | 1.0        | 4.0               | Sync & transparency     |
| P2        | 1                 | 0.5        | 0.5               | UI polish               |
| P3        | 0                 | 0.25       | 0                 | -                       |
| **Total** | **9** | **-**      | **12.5** | **~1.6 days**  |

### Prerequisites

**Test Data:**

- `PrivacyProfileFactory` (generates various PII and non-PII data)
- `SyncConflictFixture` (simulates concurrent local/cloud changes)

**Tooling:**

- `Vitest` for Unit/API tests
- `Playwright` for E2E network monitoring
- `React Testing Library` for Dashboard components

**Environment:**

- Clean local storage environment (mocked for speed)
- Mock sync server for reconciliation tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80%
- **Security scenarios**: 100%
- **Business logic**: ≥70%
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Security tests (SEC category) pass 100%
- [ ] Performance targets met (PERF category)

---

## Mitigation Plans

### R-301: Data synchronization conflict (Score: 6)

**Mitigation Strategy:** Implement versioned state reconciliation (CRDT-lite) to handle concurrent updates. Ensure all data mutations are timestamped and use a deterministic merge strategy (last-write-wins with manual override capability).
**Owner:** DEV
**Timeline:** 2026-01-20
**Status:** Planned
**Verification:** Automated integration tests with high-concurrency race condition simulations.

### R-302: PII leakage in metadata sync (Score: 6)

**Mitigation Strategy:** Implement a strict PII sanitization filter that intercept all outgoing metadata sync payloads. Use regex-based detection for common PII patterns (email, names, biometric IDs) and replace them with anonymous tokens.
**Owner:** DEV
**Timeline:** 2026-01-20
**Status:** Planned
**Verification:** Unit tests with comprehensive PII pattern suite and E2E network egress monitoring.

---

## Assumptions and Dependencies

### Assumptions

1. Local storage (IndexedDB or similar) is reliably persistent across app restarts.
2. The `PrivacyShieldService` can intercept all AI service calls before they reach the network layer.
3. Users will accept a slightly slower first-time initialization for local encryption setup.

### Dependencies

1. `EncryptionService` must be ready for integration by 2026-01-15.
2. `SyncOrchestrator` requires the federated data schema definition.

### Risks to Plan

- **Risk**: Local encryption adds significant latency to UI.
  - **Impact**: PERF degradation.
  - **Contingency**: Move encryption logic to Web Workers.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: _bmad-output/planning-artifacts/prd.md
- Epic: _bmad-output/planning-artifacts/epics.md
- Architecture: _bmad-output/planning-artifacts/architecture.md

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
