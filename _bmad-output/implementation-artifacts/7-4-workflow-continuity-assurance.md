# Story 7.4: Workflow Continuity Assurance

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user with established workout routines,
I want AI enhancements to improve my experience without changing how I use the app,
so that I benefit from intelligent features while maintaining my preferred workflow.

## Acceptance Criteria

### Interaction & UI Design
1. **Non-Interruptive Presentation**:
    - [x] AI suggestions must appear as non-modal overlays (e.g., Mantine `Popover`, `Tooltip`, or subtle inline `Alert`).
    - [x] Suggestions must NOT block user interactions with the core workout interface (no blocking modals).
    - [x] Suggestions must have a configurable auto-dismissal timeout (default 10s).

2. **Explicit Ignorability**:
    - [x] Users can proceed with their workout without interacting with the AI suggestion.
    - [x] Ignoring a suggestion must have zero impact on the state of the current exercise or the overall workout session.

3. **User Control & Feedback**:
    - [x] Each suggestion overlay must include a clear "Dismiss" action.
    - [x] User dismissals must be logged via `PreferenceLearningService.recordAdaptationResponse` (as `AdaptationEvent` with `userResponse: 'ignored'`) to refine future suggestion timing and frequency.

### Technical Implementation
4. **State Isolation**:
    - [x] Suggestion state must be managed independently from the core workout execution state to prevent side effects.
    - [x] Use Redux selectors to ensure UI updates for suggestions don't trigger unnecessary re-renders of the main workout timer or video.

5. **Service Integration**:
    - [x] Suggestions only triggered when `isServiceAvailable` is true (referencing `HealthService` from Story 7.3).
    - [x] Suggestions must be prioritized: safety-critical first, then performance-optimizing, then motivational.

## Tasks / Subtasks

- [x] **UI: Suggestion Overlay Component** (AC: 1, 3)
    - [x] Create `src/features/session/components/SuggestionOverlay.tsx` using Mantine `Alert` or `Transition`.
    - [x] Implement auto-dismissal logic using `useEffect` or Mantine hooks.
- [x] **State: Suggestion Management** (AC: 4)
    - [x] Update `liveSessionSlice.ts` to include a `suggestions` queue.
    - [x] Create `addSuggestion` and `dismissSuggestion` reducers.
- [x] **Integration: Live Workout Hookup** (AC: 1, 2, 5)
    - [x] Integrate `SuggestionOverlay` into `LiveWorkoutSession.tsx`.
    - [x] Ensure `FeatureGuard` or service health checks wrap the suggestion trigger logic.
- [x] **Persistence: Feedback Logging** (AC: 3)
    - [x] Implement `logSuggestionFeedback` thunk in `src/features/preference-learning/store/preferenceLearningSlice.ts`.
    - [x] Ensure it calls `PreferenceLearningService.recordAdaptationResponse` with the appropriate context.
- [x] **Testing: Continuity Verification** (AC: 1, 2, 4)
    - [x] Write Vitest tests with `@smoke` tags verifying that suggestions don't block input.
    - [x] Test that ignoring suggestions doesn't affect workout progress.

## Dev Notes

- **Relevant Architecture Patterns**:
    - **Trusted Partner Metaphor**: Suggestions should feel like a coach whispering in your ear, not someone stepping in front of your barbell.
    - **Optimistic Updates**: Use Redux for immediate UI feedback when dismissing suggestions.
    - **Selector Optimization**: Use `createSelector` from `@reduxjs/toolkit` for non-trivial state selection to minimize re-renders (referencing `project-context.md`).
- **Source Tree Components to Touch**:
    - `src/features/session/components/LiveWorkoutSession.tsx`
    - `src/features/session/store/liveSessionSlice.ts`
    - `src/features/session/components/SuggestionOverlay.tsx` (New)
- **Testing Standards**:
    - Minimum P0 test coverage for suggestion state isolation.
    - UI tests must verify "no-blocking" behavior using `userEvent`.

### Project Structure Notes

- Keep suggestions in `src/features/session` as they are contextually tied to the live workout.
- Reuse `HealthService` and `isServiceAvailable` flag from Story 7.3.

### References

- [Source: _bmad-output/planning-artifacts/specs/ux-design-specification.md#Effortless-Interactions]
- [Source: _bmad-output/planning-artifacts/specs/ux-design-specification.md#Experience-Principles]
- [Source: _bmad-output/implementation-artifacts/7-3-graceful-feature-degradation.md#Feature-Guarding]
- [Source: _bmad-output/project-context.md#Framework-Specific-Rules]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash)

### Debug Log References

- Implemented `suggestions` queue in `liveSessionSlice.ts` with priority-based sorting (safety > performance > motivation).
- Created `SuggestionOverlay.tsx` using Mantine `Alert` and `Transition` for non-modal presentation.
- Integrated `SuggestionOverlay` into `LiveWorkoutSession.tsx`, ensuring adaptations are presented non-interruptively.
- Added `logSuggestionFeedback` thunk to `preferenceLearningSlice.ts` to track user interaction with suggestions.
- Verified implementation with new test suite `src/features/session/store/__tests__/continuityAssurance.test.ts`.

### Completion Notes List

- ✅ AC 1, 2, 3: Non-modal suggestion overlays implemented and integrated.
- ✅ AC 4: State isolation for suggestions achieved in Redux.
- ✅ AC 5: Health service integration and prioritization logic implemented.
- ✅ **Code Review Fixes**: Removed redundant toasts, optimized priority sorting, limited suggestion queue to 3 items, and standardized timeout constants.

### File List

- `src/features/session/store/liveSessionSlice.ts` (Modified)
- `src/features/session/components/SuggestionOverlay.tsx` (New)
- `src/features/session/components/LiveWorkoutSession.tsx` (Modified)
- `src/store/preferenceLearningSlice.ts` (Modified)
- `src/features/session/store/__tests__/continuityAssurance.test.ts` (New)

### Change Log

- 2026-01-12: Implemented workflow continuity assurance features (Story 7.4).
- 2026-01-12: Added non-modal suggestion overlays and preference logging.
- 2026-01-12: Conducted adversarial review and applied auto-fixes for redundancy and performance.

## Status

Status: done

