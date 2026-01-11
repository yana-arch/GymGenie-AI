# Story 7.2: Incremental AI Adoption

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a cautious user exploring AI features,
I want to opt into AI capabilities one at a time based on my comfort level,
so that I can gradually build trust in the AI without feeling overwhelmed.

## Acceptance Criteria

1. **Granular AI Feature Toggles**:
   - [x] Implement a "AI Features" settings page using Mantine components.
   - [x] Provide individual toggles for:
     - **AI Coaching** (Real-time adaptations, form correction)
     - **Personalization** (Preference learning, historical patterns)
     - **Analytics** (Progress predictions, trend analysis)
   - [x] Ensure toggles are integrated with the `featureFlagSlice` implemented in Story 7.1.

2. **UI Dynamic Visibility**:
   - [x] Components related to AI features must conditionally render based on the corresponding feature flag.
   - [x] If a feature is disabled, all its UI entry points (buttons, cards, dashboard sections) must be completely hidden.
   - [x] Ensure smooth transitions when toggling features (no layout shifts or jarring jumps).

3. **Persistence and Default State**:
   - [x] Feature flags must persist across sessions using `redux-persist`.
   - [x] Default state for new users: All AI features are **OFF** (to support cautious adoption), with a clear "Enable AI" onboarding call-to-action.

## Tasks / Subtasks

- [x] **UI: AI Settings Page** (AC: 1)
  - [x] Create `src/features/settings/components/AISettings.tsx`.
  - [x] Use Mantine `Switch` or `Checkbox` components for each feature.
  - [x] Add tooltips/descriptions explaining what each feature does.
- [x] **State: Flag Integration** (AC: 1, 3)
  - [x] Update `featureFlagSlice.ts` if necessary to include specific keys for Coaching, Personalization, and Analytics.
  - [x] Ensure default state reflects the "Privacy/Caution First" approach.
- [x] **UI: Conditional Rendering Implementation** (AC: 2)
  - [x] Wrap AI-specific components in a `FeatureGuard` component or use `useAppSelector` with the flags.
  - [x] Audit `LiveWorkoutSession`, `Dashboard`, and `Progress` views for AI elements.
- [x] **Verification: Testing Visibility** (AC: 2)
  - [x] Write tests to verify that UI elements disappear when flags are toggled.
  - [x] Verify that disabling a feature doesn't break the rest of the application.

## Dev Notes

- **Relevant Architecture Patterns**:
  - **Feature Guarding**: Created a reusable `FeatureGuard` component in `src/components/ui/FeatureGuard.tsx`.
  - **Mantine Settings**: Used `Card`, `Stack`, and `Group` for layout.
  - **State Mapping**:
    - **AI Coaching** -> `enableCoaching`
    - **Personalization** -> `enablePersonalization`
    - **Analytics** -> `enableAnalytics`
- **Source Tree Components Touched**:
  - `src/features/ui/store/featureFlagSlice.ts`
  - `src/features/settings/components/AISettings.tsx`
  - `src/components/ui/FeatureGuard.tsx`
  - `src/features/profile/components/SettingsMenu.tsx`
  - `src/features/session/components/LiveWorkoutSession.tsx`
  - `src/features/analytics/components/ProgressDashboard.tsx`
- **Testing Standards**:
  - `src/features/ui/store/featureFlagSlice.test.ts` (Passed)
  - `src/components/ui/FeatureGuard.test.tsx` (Passed)
  - `src/features/settings/components/AISettings.test.tsx` (Passed)

### Project Structure Notes

- New settings component in `src/features/settings`.
- Reusable guard in `src/components/ui`.
- **Fixed Type Mismatch**: Corrected `Difficulty.Intermediate` usage in `store.test.ts`.

### References

- [Source: _bmad-output/planning-artifacts/specs/epics.md#Story-7.2]
- [Source: _bmad-output/implementation-artifacts/7-1-backward-compatibility-foundation.md]
- [Source: _bmad-output/planning-artifacts/specs/ux-design-specification.md#Progressive-Disclosure]

## Dev Agent Record

### Agent Model Used

opencode (gemini-2.0-flash-exp)

### Debug Log References

- Fixed `window.matchMedia` issue in tests by updating `test/setup.ts`.
- Fixed missing slices in `createMockStore` in `TestingHelpers.tsx`.

### Completion Notes List

- Implemented granular toggles for Coaching, Personalization, and Analytics.
- Default state is now OFF for all AI features.
- Integrated `FeatureGuard` in `LiveWorkoutSession` and `ProgressDashboard`.
- **Review Fixes**: 
  - Guarded AI logic leakage in `LiveWorkoutSession` (camera/service initialization now respects flags).
  - Added onboarding CTA banner in `AISettings` when all features are off.
  - Added missing granular toggles for Form Guard and Injury Awareness.
  - Added priority tags to slice tests.
- Added tests for all new functionality.

### File List

- `src/features/ui/store/featureFlagSlice.ts`
- `src/features/ui/store/featureFlagSlice.test.ts`
- `src/components/ui/FeatureGuard.tsx`
- `src/components/ui/FeatureGuard.test.tsx`
- `src/features/settings/components/AISettings.tsx`
- `src/features/settings/components/AISettings.test.tsx`
- `src/features/profile/components/SettingsMenu.tsx`
- `src/features/session/components/LiveWorkoutSession.tsx`
- `src/features/analytics/components/ProgressDashboard.tsx`
- `src/store/__tests__/store.test.ts`
- `test/setup.ts`
- `src/test-utils/helpers/TestingHelpers.tsx`
- `src/components/ui/SimpleTest.test.tsx`
- `_bmad-output/implementation-artifacts/validation-report-7-2-incremental-ai-adoption.md`

