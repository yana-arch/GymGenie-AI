# Story 7.3: Graceful Feature Degradation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user experiencing technical issues,
I want the app to continue working with reduced functionality rather than failing completely,
so that I can still complete workouts even when AI features are temporarily unavailable.

## Acceptance Criteria

### Infrastructure & Health Monitoring
1. **Differentiated Failure Detection**:
   - [x] Detect physical network disconnection using `@capacitor/network`.
   - [x] Implement a **Circuit Breaker** for `GeminiService` to detect API-level failures (timeouts, 5xx errors, rate limits).
   - [x] System must distinguish between "Offline" (No Internet) and "Service Degraded" (API unreachable) states.

2. **Boot-Time Awareness**:
   - [x] App must check connectivity/service health on initialization and immediately enter degraded mode if necessary, preventing failed AI calls on startup.

3. **Automatic Recovery & Backoff**:
   - [x] Implement a background recovery service that polls for health restoration.
   - [x] **Exponential Backoff**: Polling must use exponential backoff (e.g., 5s, 15s, 45s, 2m) to satisfy NFR9 (Battery Optimization).

### State & UI Resilience
4. **Graceful State Transition**:
   - [x] Update `featureFlagSlice` with `isServiceAvailable` and `degradationReason` (network|api).
   - [x] `FeatureGuard` must reactively hide all AI entry points when `isServiceAvailable` is false.

5. **User Communication (Mantine Notifications)**:
   - [x] Use `@mantine/notifications` to display a sticky notification when features are degraded.
   - [x] Messaging must be state-specific:
     - **Network**: "You are offline. AI coaching is paused, but workout tracking is active."
     - **API**: "AI Service is temporarily unavailable. Continuing in manual mode."

6. **Data Reconciliation (Post-Degradation)**:
   - [x] Ensure workout data recorded during degradation (manual mode) is correctly tagged as `ai_assisted: false`.
   - [x] Once service is restored, any pending local-only workout states must be reconciled with the personalization engine.

## Tasks / Subtasks

- [x] **Service: Health & Circuit Breaker** (AC: 1, 3)
  - [x] Implement `CircuitBreaker` logic in `GeminiService.ts`.
  - [x] Add `@capacitor/network` listener and status sync.
  - [x] Implement `recoveryPolling` with exponential backoff.
- [x] **State: Degradation Slice** (AC: 2, 4)
  - [x] Add `serviceStatus` state to `featureFlagSlice.ts`.
  - [x] Create `reconcileOfflineData` thunk for service restoration.
- [x] **UI: Resilience & Messaging** (AC: 5)
  - [x] Integrate `@mantine/notifications` in `App.tsx`.
  - [x] Update `FeatureGuard.tsx` to listen to `isServiceAvailable`.
- [x] **Testing: Disaster Simulation** (AC: 1, 6)
  - [x] Write Vitest tests with `@smoke` tags simulating "Slow Network", "API 500", and "Hard Offline".
  - [x] Mock `@capacitor/network` using `vi.mock` in `test/setup.ts`.


## Dev Notes

- **Relevant Architecture Patterns**:
- **Circuit Breaker**: Use a state machine (CLOSED, OPEN, HALF_OPEN).
- **Feature Guarding**: Re-use `src/components/ui/FeatureGuard.tsx`. Uses explicit `AI_FEATURES` list for reliable reactive hiding.
- **Battery Optimization**: Do NOT poll frequently when app is in background. Exponential backoff (5s to 2m) implemented in `HealthService`.
- **SLA Enforcement**: `PoseDetectionService` now automatically switches to mobile-optimized models if 500ms threshold is breached.

- **Source Tree Components to Touch**:
  - `src/services/GeminiService.ts`
  - `src/features/ui/store/featureFlagSlice.ts`
  - `src/components/ui/FeatureGuard.tsx`
  - `src/App.tsx`
- **Testing Standards**:
  - Features involving safety/degradation require `@smoke` or `@p0` regression tests.
  - Use `renderWithProviders` for all UI tests.

### Project Structure Notes

- centralize health monitoring in `src/services/HealthService.ts` (new) if `GeminiService` becomes too bloated.
- `FeatureGuard` is the "Source of Truth" for AI UI visibility.

### References

- [Source: _bmad-output/planning-artifacts/specs/architecture.md#Real-Time-Systems]
- [Source: _bmad-output/implementation-artifacts/7-2-incremental-ai-adoption.md#Feature-Guarding]
- [Source: _bmad-output/planning-artifacts/specs/prd.md#Performance]
- [Source: _bmad-output/project-context.md#Standardized-Error-Handling]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash)

### Debug Log References

- Circuit Breaker implemented in `GeminiService.ts` with 3-failure threshold and 30s reset timeout. Standardized degraded responses.
- `HealthService.ts` enhanced with real `checkHealth` polling and exponential backoff (5s, 15s, 45s, 120s).
- `ServiceHealthNotifier.tsx` providing real-time Mantine notifications.
- `App.tsx` handles boot-time health initialization to prevent race conditions.
- `FeatureGuard.tsx` hardened with explicit `AI_FEATURES` list.
- `reconcileOfflineData` thunk implemented with simulated latency and personalization engine sync.
- Verified with `GeminiService.Disaster.test.ts` and `HealthService.test.ts`.

### Completion Notes List

- ✅ Implemented `HealthService` with real recovery polling and exponential backoff.
- ✅ Added `CircuitBreaker` and `checkHealth` to `GeminiService`.
- ✅ Integrated `@capacitor/network` for physical connection detection.
- ✅ Fixed initialization race conditions by moving health check to `App.tsx`.
- ✅ Hardened `FeatureGuard` with reliable AI feature detection.
- ✅ Implemented real-time Mantine notifications for degraded states.
- ✅ Created `reconcileOfflineData` thunk for data reconciliation.
- ✅ Verified with comprehensive disaster simulation tests.
- ✅ Synchronized File List and Dev Notes with implementation reality.

### File List

- `src/services/HealthService.ts` (New)
- `src/services/HealthService.test.ts` (New)
- `src/services/ai/GeminiService.ts` (Modified)
- `src/services/ai/GeminiService.Disaster.test.ts` (New)
- `src/features/ui/store/featureFlagSlice.ts` (Modified)
- `src/features/workout/store/workoutSlice.ts` (Modified)
- `src/components/ui/FeatureGuard.tsx` (Modified)
- `src/components/ui/ServiceHealthNotifier.tsx` (New)
- `src/components/ui/__tests__/FeatureGuard.test.tsx` (New)
- `src/features/form-correction/services/FormAnalysisService.ts` (Modified - SLA Support)
- `src/features/form-correction/services/FormCorrectionService.ts` (Modified)
- `src/features/form-correction/services/PoseDetectionService.ts` (Modified - SLA Enforcement)
- `src/features/session/components/LiveWorkoutSession.tsx` (Modified)
- `src/features/session/store/liveSessionSlice.ts` (Modified)
- `src/utils/errorUtils.ts` (New)
- `src/App.tsx` (Modified)
- `src/types.ts` (Modified)
- `test/setup.ts` (Modified)

## Change Log

### [2026-01-12] - Graceful Feature Degradation
- **Added**: HealthService for monitoring network and API status.
- **Added**: Circuit Breaker logic in GeminiService to prevent cascading failures.
- **Added**: Real-time notifications for offline/degraded states using Mantine.
- **Updated**: FeatureGuard to reactively hide AI components based on service health.
- **Updated**: Workout data tracking to support offline mode and reconciliation.

