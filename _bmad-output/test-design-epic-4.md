# Test Design: Epic 4 - Live Workout Sessions

**Date:** 2026-01-09
**Author:** Wavister
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 4

**Risk Summary:**

- Total risks identified: 5
- High-priority risks (≥6): 2
- Critical categories: PERF, TECH, BUS

**Coverage Summary:**

- P0 scenarios: 3 (6 hours)
- P1 scenarios: 5 (5 hours)
- P2/P3 scenarios: 2 (1 hour)
- **Total effort**: 12 hours (~1.5 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   | Timeline |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- | -------- |
| R-401   | PERF     | Latency in contextual modifications (>2s) during live session | 3 | 3 | 9 | Implement optimistic UI and local inference caching | DEV | 2026-01-20 |
| R-402   | TECH     | Session state desync during rapid exercise transitions | 2 | 3 | 6 | Atomic state updates in Redux with transaction logging | DEV | 2026-01-20 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- |
| R-403   | BUS      | Milestone celebrations overlapping with critical guidance | 2 | 2 | 4 | Priority-based notification queue | DEV |
| R-404   | TECH     | Battery drain exceeding 30% during 1-hour session | 2 | 2 | 4 | Optimize camera/GPU usage duty cycles | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description   | Probability | Impact | Score | Action  |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------- |
| R-405   | OPS      | Offline session data loss on app crash | 1 | 2 | 2 | Frequent local checkpointing | Monitor |

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 4.1: Live guidance | E2E | - | 3 | QA | Core workout loop validation |
| 4.3: Contextual modifications | API | R-401 | 5 | DEV | Response time benchmarking |
| 4.4: Seamless transitions | E2E | R-402 | 2 | QA | Race condition testing in transitions |

**Total P0**: 3 scenarios, 10 tests, 6 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 4.2: Milestone celebrations | Component | R-403 | 4 | DEV | Animation and timing check |
| 4.5: Real-time encouragement | Component | - | 3 | DEV | Content relevance validation |
| 4.3: Fatigue-based adaptation | API | R-401 | 4 | QA | Decision logic accuracy |
| 4.1: Exercise progress updates | Integration | - | 3 | DEV | State consistency check |

**Total P1**: 4 scenarios, 14 tests, 5 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| 4.4: Multi-phase transitions | Integration | - | 4 | QA | Complex workout structure tests |
| 4.1: Resume session after crash | E2E | R-405 | 2 | QA | Persistence validation |

**Total P2**: 2 scenarios, 6 tests, 1 hour

---

## Execution Order

### Smoke Tests (<5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] 4.1-E2E: Basic session start/stop (30s)
- [ ] 4.4-E2E: Single transition (45s)

**Total**: 2 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] 4.1-E2E: Full workout session (E2E)
- [ ] 4.3-API: Adaptation latency (API)
- [ ] 4.4-E2E: Transition race conditions (E2E)

**Total**: 3 scenarios

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] 4.2-COMP: Celebration UI (Component)
- [ ] 4.5-COMP: Encouragement triggers (Component)
- [ ] 4.3-API: Decision logic (API)

**Total**: 3 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count             | Hours/Test | Total Hours       | Notes                   |
| --------- | ----------------- | ---------- | ----------------- | ----------------------- |
| P0        | 3                 | 2.0        | 6.0               | Real-time timing heavy  |
| P1        | 4                 | 1.0        | 4.0               | UI & logic              |
| P2        | 2                 | 0.5        | 1.0               | Edge cases              |
| P3        | 0                 | 0.25       | 0                 | -                       |
| **Total** | **9** | **-**      | **11.0** | **~1.4 days**  |

### Prerequisites

**Test Data:**

- `WorkoutSessionFactory` (generates varied workout structures)
- `BiometricStreamFixture` (simulates fatigue signals)

**Tooling:**

- `Vitest` for logic
- `Playwright` for E2E timing
- `k6` for state high-concurrency simulation

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100%
- **P1 pass rate**: ≥95%
- **Response Time (p95)**: <2s for adaptations

---

## Mitigation Plans

### R-401: Latency in contextual modifications (Score: 9)

**Mitigation Strategy:** Implement a local "fast-path" for common adaptations that doesn't require full LLM inference. Use a rule-based engine for immediate safety adjustments while the LLM processes broader context.
**Owner:** DEV
**Timeline:** 2026-01-20
**Status:** Planned
**Verification:** Performance benchmark suite in CI.

---

## Appendix

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
