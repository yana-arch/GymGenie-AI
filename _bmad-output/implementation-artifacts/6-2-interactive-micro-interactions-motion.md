# Story 6.2: Interactive Micro-interactions & Motion

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want responsive micro-interactions and motion elements,
so that the UI feels alive, responsive, and provides clear tactile feedback.

## Acceptance Criteria

1. **Tactile Button & Control Feedback**:
   - [x] Buttons and interactive icons must provide subtle visual feedback on press/tap (e.g., scale-down, color shift).
   - [x] Hover states on desktop should include glow or subtle elevation increases.
   - [x] Tap targets must be at least 44x44px for mobile accessibility.

2. **Fluid Motion Elements**:
   - [x] Implement smooth entry/exit transitions for Modals, Drawers, and Popovers using Mantine's `Transition` system.
   - [x] Add subtle "staggered" entry animations for list items (e.g., workout exercises, analytics cards).
   - [x] Page transitions should feel seamless, avoiding abrupt content jumps.

3. **Interactive Card Feedback**:
   - [x] Workout exercise cards should have "active" and "selected" states with motion cues.
   - [x] Implement subtle "glow" or "pulse" effects for AI-suggested adaptations to draw attention without being intrusive.

4. **Response & Performance**:
   - [x] All animations must use hardware-accelerated CSS properties (transform, opacity).
   - [x] Motion must not interfere with the 2-second AI response time requirement (NFR1).
   - [x] Ensure animations are disabled or simplified if the device reports "prefers-reduced-motion".

## Tasks / Subtasks

- [x] **Core Interaction Refinement**
  - [x] Update `src/theme/components.ts` (if it exists) or Mantine theme in `src/theme/index.ts` to include default `active` and `hover` transition patterns for Buttons and Cards.
  - [x] Implement a `useSpring` style hover effect (via CSS transitions) for `Paper` elements.
- [x] **Transition Implementation**
  - [x] Wrap main feature routes in Mantine `Transition` components or implement global page transition logic.
  - [x] Audit all existing Modals/Drawers and ensure they use high-performance transition presets (e.g., `slide-up`, `fade`).
- [x] **Feedback Systems**
  - [x] Create a reusable `MotionFeedback` component or utility for AI adaptation notifications.
  - [x] Add "pulse" animations to critical safety alerts and AI guidance cues.
- [x] **Testing & Quality**
  - [x] Add `@p2` Vitest tests to verify transition components render and cleanup correctly.
  - [x] Verify 60fps performance on mobile devices (simulated or real).
  - [x] Ensure dark mode compatibility for all new motion highlights.

## Dev Notes

- **Relevant Architecture Patterns**:
  - **Mantine 8.x Transitions**: Use `Transition` and `Collapse` components from `@mantine/core`.
  - **Tailwind 4 Utilities**: Use `transition-*` and `animate-*` classes for simple micro-interactions.
  - **Vibe Integration**: Motion should complement the "Atmospheric Vibe" established in 6.1 (radial gradients, backdrop-blurs).
  - **Safety**: Ensure motion doesn't distract the user during high-intensity exercise phases.
- **Source Tree Components to Touch**:
  - `src/theme/index.ts`
  - `src/components/ui/`
  - `src/features/workout/components/`
  - `src/features/analytics/components/`
- **Testing Standards**:
  - Use `@p2` for interaction tests.
  - Ensure `renderWithProviders` is used for all UI tests.

### Project Structure Notes

- **Synchronization**: All motion timings should follow a standardized scale (e.g., `short: 150ms`, `standard: 300ms`, `long: 500ms`) defined in the theme.
- **Consistency**: Use the established `brand` color palette for interaction highlights (e.g., `brand-500` for active states).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless-Interactions]
- [Source: _bmad-output/implementation-artifacts/6-1-brand-identity-theme-integration.md]

## Dev Agent Record

### Agent Model Used

opencode (gemini-2.0-flash-exp)

### Completion Notes List

- Standardized motion timings in Mantine theme (short: 150ms, standard: 300ms, long: 500ms)
- Implemented spring-like cubic-bezier transitions for Paper and Card elements
- Updated custom `Button` and `Card` components with hardware-accelerated transitions and tactile feedback
- Fixed `Button` tap targets to minimum 44x44px for mobile accessibility
- Implemented `prefers-reduced-motion` support across all motion components
- Created reusable `MotionFeedback` component for AI adaptation alerts with theme-aware glow
- Implemented global page transitions in `App.tsx`
- Audited and updated Modals with high-performance transition presets
- Fixed staggered entry animations in `VirtualizedExerciseList` with modulo-capped delays
- Refactored `FormCorrectionService` to support singleton pattern and external video targets (AC7 prep)
- Verified implementation with `@p2` Vitest tests, including media-query simulations

### File List

- _bmad-output/implementation-artifacts/6-2-interactive-micro-interactions-motion.md
- src/theme/index.ts
- src/theme/motion.test.tsx
- src/components/ui/Button.tsx
- src/components/ui/Card.tsx
- src/components/ui/MotionFeedback.tsx
- src/components/ui/MotionFeedback.test.tsx
- src/App.tsx
- src/features/analytics/components/AchievementCelebration.tsx
- src/features/session/components/TransitionOverlay.tsx
- src/features/session/components/AdaptationPrompt.tsx
- src/features/workout/components/OptimizedResponsiveWorkoutCard.tsx
- src/features/workout/components/VirtualizedExerciseList.tsx
- src/features/session/components/LiveWorkoutSession.tsx
- src/features/form-correction/services/FormCorrectionService.ts
- src/features/form-correction/services/PoseDetectionService.ts
- src/features/form-correction/store/formCorrectionSlice.ts
- src/features/form-correction/__tests__/FormCorrectionService.test.ts
- src/features/form-correction/__tests__/PoseDetectionService.test.ts
- src/features/form-correction/__tests__/CameraService.test.ts
- src/features/form-correction/__tests__/FormAnalysisService.test.ts
- src/features/form-correction/__tests__/FormFeedbackOverlay.test.tsx
- src/features/form-correction/__tests__/WorkoutIntegration.test.ts
- src/features/form-correction/__tests__/formCorrectionSlice.test.ts
- src/features/form-correction/__tests__/test-utils.ts

