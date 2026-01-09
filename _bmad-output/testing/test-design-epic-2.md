# Test Design: Epic 2 - Personal AI Learning

**Date:** 2026-01-08
**Author:** Wavister
**Status:** Draft

---

## Executive Summary

**Scope:** full test design for Epic 2

**Risk Summary:**

- Total risks identified: 4
- High-priority risks (≥6): 1
- Critical categories: DATA, BUS, PERF

**Coverage Summary:**

- P0 scenarios: 0 (0 hours)
- P1 scenarios: 5 (5 hours)
- P2/P3 scenarios: 3 (1.25 hours)
- **Total effort**: 6.25 hours (~0.8 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   | Timeline |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- | -------- |
| R-201   | DATA      | AI learning incorrect preferences due to noisy or conflicting feedback | 2           | 3      | 6     | Implement feedback validation and conflict resolution logic | DEV | 2026-01-15   |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description   | Probability | Impact | Score | Mitigation   | Owner   |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------------ | ------- |
| R-202   | BUS     | AI recommendation drift (recommendations becoming irrelevant or "weird") | 2           | 2      | 4     | Add feedback-driven recalibration and reset options | DEV |
| R-203   | PERF     | Processing large historical patterns on-device causes UI lag | 2           | 2      | 4     | Optimize pattern recognition algorithms for background execution | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description   | Probability | Impact | Score | Action  |
| ------- | -------- | ------------- | ----------- | ------ | ----- | ------- |
| R-204   | TECH      | Integration failure between historical patterns and real-time adaptations | 1           | 3      | 3     | Monitor |

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
| (None identified for Epic 2 yet) | - | - | 0 | - | - |

**Total P0**: 0 tests, 0 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| SC-2.1.1: Exercise frequency preference storage | API        | -         | 3          | QA    | Verify correct identification of top exercises |
| SC-2.1.2: Intensity level preference storage | API        | -         | 3          | QA    | Verify adaptation to user's preferred RPE |
| SC-2.2.1: Progress dashboard volume evolution | Component  | R-203     | 2          | DEV   | Ensure rendering doesn't lag with large history |
| SC-2.3.1: Positive feedback learning | API        | R-201     | 4          | QA    | Verify increase in recommendation weight |
| SC-2.3.2: Negative feedback learning | API        | R-201     | 4          | QA    | Verify decrease/exclusion in future |

**Total P1**: 5 scenarios, 16 tests, 16 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement   | Test Level | Risk Link | Test Count | Owner | Notes   |
| ------------- | ---------- | --------- | ---------- | ----- | ------- |
| SC-2.1.3: Outlier exclusion in learning | API        | R-201     | 3          | QA    | Ensure one-off sessions don't skew preferences |
| SC-2.2.2: Adaptation correlation insights | API        | R-202     | 2          | QA    | Verify logic that ties progress to AI suggestions |
| SC-2.3.3: Rationale explanation transparency | Component  | -         | 2          | DEV   | Verify UI shows feedback impact correctly |

**Total P2**: 3 scenarios, 7 tests, 3.5 hours

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

- [ ] SC-2.1.1 basic preference check (30s)
- [ ] SC-2.3.1 positive feedback link (45s)

**Total**: 2 scenarios

### P0 Tests (<10 min)

**Purpose**: Critical path validation

(None identified for this epic)

### P1 Tests (<30 min)

**Purpose**: Important feature coverage

- [ ] SC-2.1.1 full validation (API)
- [ ] SC-2.1.2 intensity learning (API)
- [ ] SC-2.2.1 dashboard performance (Component)
- [ ] SC-2.3.1 weight adaptation (API)
- [ ] SC-2.3.2 exclusion logic (API)

**Total**: 5 scenarios

### P2/P3 Tests (<60 min)

**Purpose**: Full regression coverage

- [ ] SC-2.1.3 outlier handling (API)
- [ ] SC-2.2.2 correlation insights (API)
- [ ] SC-2.3.3 rationale UI (Component)

**Total**: 3 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority  | Count             | Hours/Test | Total Hours       | Notes                   |
| --------- | ----------------- | ---------- | ----------------- | ----------------------- |
| P0        | 0                 | 2.0        | 0                 | -                       |
| P1        | 16                | 1.0        | 16.0              | Core learning logic     |
| P2        | 7                 | 0.5        | 3.5               | Edge cases, UI          |
| P3        | 0                 | 0.25       | 0                 | -                       |
| **Total** | **23** | **-**      | **19.5** | **~2.4 days**  |

### Prerequisites

**Test Data:**

- `PreferenceFactory` (stores exercise/intensity patterns)
- `HistoryFixture` (mock workout history generator)

**Tooling:**

- `Vitest` for API/Unit tests
- `React Testing Library` for Component tests

**Environment:**

- Local dev environment with mock persistent storage (IndexedDB mock)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80%
- **Security scenarios**: 100% (n/a for this epic)
- **Business logic**: ≥70%
- **Edge cases**: ≥50%

### Non-Negotiable Requirements

- [ ] All P1 tests pass (since no P0)
- [ ] No high-risk (≥6) items unmitigated
- [ ] Data integrity tests (DATA category) pass 100%

---

## Mitigation Plans

### R-201: AI learning incorrect preferences due to noisy or conflicting feedback (Score: 6)

**Mitigation Strategy:** Implement a feedback validation layer that checks for statistical significance before updating preference models. Use a "cooling-off" period for rapid contradictory feedback.
**Owner:** DEV
**Timeline:** 2026-01-15
**Status:** Planned
**Verification:** Stress test with randomized feedback patterns to ensure model stability.

---

## Assumptions and Dependencies

### Assumptions

1. Preference learning models can run in a background worker to avoid UI block.
2. Historical data is stored in a structured format (e.g., SQLite or IndexedDB) on the device.
3. Users will provide feedback at least once every 5 sessions.

### Dependencies

1. `LocalStoreService` must support complex queries for pattern recognition.
2. `GeminiService` (local) must support context injection for preference-aware adaptations.

### Risks to Plan

- **Risk**: On-device model size grows too large.
  - **Impact**: App storage limits reached.
  - **Contingency**: Implement data aging/pruning for old history (>2 years).

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: _bmad-output/planning-artifacts/prd.md
- Epics: _bmad-output/planning-artifacts/epics.md
- Architecture: _bmad-output/planning-artifacts/architecture.md

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
