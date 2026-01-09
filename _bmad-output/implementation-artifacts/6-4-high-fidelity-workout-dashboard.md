# Story 6.4: High-Fidelity Workout Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user,
I want a beautiful live session UI,
so that I can stay focused and motivated during my workout.

## Acceptance Criteria

1. **Atmospheric Visual Polish**:
   - [x] Implement a dynamic, atmospheric background that subtly reacts to workout intensity (e.g., color shifts or gentle motion).
   - [x] Apply glassmorphism effects to the primary control cards to create a premium, layered feel.
   - [x] Refine typography using Mantine's theme for better readability during movement (higher contrast, optimized line heights).

2. **Optimized Layout for Focus**:
   - [x] Reorganize the dashboard to prioritize the "Active Exercise" and "Timer" while minimizing secondary controls.
   - [x] Implement a "Focus Mode" that hides non-essential HUD elements during a set.
   - [x] Ensure all critical information (Reps, Weight, Time) is readable from 3-5 feet away (typical phone distance during exercise).

3. **Integrated Exercise Display**:
   - [x] Replace the standalone GIF box with a more integrated "Exercise Guide" that can be toggled or minimized.
   - [x] Smooth transitions when switching between exercises (using `AnimatePresence` or Mantine's transition components).

4. **Enhanced HUD for AI/Camera**:
   - [x] Overlay the camera view with a technical "HUD" (Head-Up Display) style aesthetic (e.g., scanning lines, joint point markers, safety status).
   - [x] Integrate `ThinkingIndicator` into a dedicated "AI Status" corner of the dashboard rather than a floating overlay.

5. **Refined Interaction Design**:
   - [x] Update Weight/Reps controls to be more "tactile" with haptic feedback (using `@capacitor/haptics`) and smoother animations.
   - [x] Use Mantine's `Stepper` or a custom progress indicator to show session progress more elegantly than a simple percentage.

## Tasks / Subtasks

- [x] **UI Refinement**
  - [x] Create `AtmosphericBackground` component using CSS gradients or simple canvas/WebGL.
  - [x] Update `LiveWorkoutSession.tsx` with glassmorphism styles (blur, border-white/20).
  - [x] Implement `WorkoutHUD` overlay for the camera view.
  - [x] Update typography and global theme settings in `src/theme/index.ts` for optimized exercise readability.
- [x] **Layout Optimization**
  - [x] Refactor `LiveWorkoutSession.tsx` layout to use a more balanced grid/flex structure.
  - [x] Add "Focus Mode" toggle logic and visual states (managed via Redux in `liveSessionSlice`).
- [x] **Component Integration**
  - [x] Refine `ExerciseGuide` component to better integrate with the dashboard layout.
  - [x] Move `ThinkingIndicator` to a fixed HUD position.
- [x] **Polish & Animation**
  - [x] Add entry/exit animations for all dashboard sections.
  - [x] Ensure theme consistency across all sub-components (`AdaptationPrompt`, `RestTimer`, etc.).
- [x] **Testing & Quality**
  - [x] Verify readability on multiple devices (Mobile-first).
  - [x] Ensure NFR1 (2s response) is maintained despite visual overhead.
  - [x] Add `@p1` tests for layout state transitions.

## Dev Notes

- **Relevant Architecture Patterns**:
  - **Mantine 8.x Theming**: Use `theme.other` or custom CSS variables for the atmospheric background.
  - **Glassmorphism**: Use `backdrop-filter: blur(8px)` and semi-transparent backgrounds.
  - **Z-Index Management**: Ensure `AdaptationPrompt` and `MilestoneCelebration` remain above the atmospheric background but integrated into the vibe.
- **Source Tree Components to Touch**:
  - `src/features/session/components/LiveWorkoutSession.tsx`
  - `src/features/session/components/ThinkingIndicator.tsx`
  - `src/features/session/components/SessionProgressHUD.tsx`
  - `src/features/session/components/WorkoutHUD.tsx` (New)
  - `src/components/ui/AtmosphericBackground.tsx` (New)
- **Testing Standards**:
  - Verify that visual "polish" doesn't degrade performance (measure frame rates if possible).
  - Accessibility: High contrast must be maintained despite glassmorphism.

### Project Structure Notes

- Keep all high-fidelity components within `src/features/session/components/`.
- Ensure new assets (icons, patterns) follow established naming conventions.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core-User-Experience]
- [Source: _bmad-output/planning-artifacts/architecture.md#Styling-&-UI]
- [Source: _bmad-output/implementation-artifacts/6-3-visual-feedback-for-ai-adaptations.md]

## Dev Agent Record

### Agent Model Used

opencode (gemini-2.0-flash-exp)

### Debug Log References

- [Log: Analyzed LiveWorkoutSession.tsx for high-fidelity opportunities]
- [Log: Identified need for integrated HUD and atmospheric backgrounds]
- [Log: Resolved infinite loop in useGuidanceLoop hook by granularizing dependencies]
- [Log: Updated test utilities to include all necessary feature slices in mock store]

### Completion Notes List

- Comprehensive developer guide created for high-fidelity dashboard implementation.
- Defined specific visual and layout improvements for premium experience.
- Integrated previous learnings from Story 6.3 regarding AI status indicators.
- Implemented `AtmosphericBackground` with CSS animations for better JSDOM compatibility.
- Applied glassmorphism across all session UI components for a unified "pro" look.
- Optimized `useGuidanceLoop` to prevent re-render loops.

### File List

- _bmad-output/implementation-artifacts/6-4-high-fidelity-workout-dashboard.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/validation-report-20260109.md
- src/components/ui/AtmosphericBackground.tsx
- src/components/ui/AtmosphericBackground.test.tsx
- src/features/session/components/WorkoutHUD.tsx
- src/features/session/components/ExerciseGuide.tsx
- src/features/session/components/LiveWorkoutSession.tsx
- src/features/session/components/__tests__/LiveWorkoutSession.test.tsx
- src/features/session/components/SessionProgressHUD.tsx
- src/features/session/components/TransitionPrep.tsx
- src/features/session/store/liveSessionSlice.ts
- src/theme/index.ts
- test/test-utils.tsx
- src/test-utils/helpers/TestingHelpers.tsx
- src/features/session/hooks/useGuidanceLoop.ts
- package.json
- package-lock.json

## Senior Developer Review (AI)

### Review Date: 2026-01-09
### Reviewer: BMAD Senior Adversarial Reviewer

**Verdict: PASS WITH FIXES APPLIED**

During the review of Story 6.4, several critical and medium-severity issues were identified and automatically fixed:

1.  **Haptic Feedback Implementation (CRITICAL):** AC 5.1 required tactile feedback using `@capacitor/haptics`. This was missing and has now been implemented for Weight/Reps adjustments and Set logging.
2.  **Strict Typing Violations (MEDIUM):** Multiple `any` types were found in `LiveWorkoutSession.tsx` and `useGuidanceLoop.ts`. These have been replaced with proper `RootState` and feature-specific interfaces.
3.  **Redundant AI Indicators (MEDIUM):** Violating AC 4.2, the `ThinkingIndicator` was still a floating fixed overlay. It has been removed in favor of the integrated status in `WorkoutHUD`.
4.  **Dual State Sync Risk (MEDIUM):** `activeExerciseIndex` was tracked in both local state and Redux. Local state was removed to ensure a single source of truth.
5.  **Documentation Gaps (MEDIUM):** Updated the story File List to include missing implementation artifacts and package configuration changes.

**Summary of Changes:**
- Installed `@capacitor/haptics`.
- Refactored `LiveWorkoutSession.tsx` for haptics, typing, and state synchronization.
- Fixed typing in `useGuidanceLoop.ts` and `LiveWorkoutSession.test.tsx`.
- Integrated AI status indicators.
- Synchronized sprint status.

**Follow-up Actions:**
- [ ] Monitor battery consumption with haptics enabled during long sessions (NFR9).
- [ ] Decompose `LiveWorkoutSession.tsx` further into smaller sub-features to improve maintainability.
