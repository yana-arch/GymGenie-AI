# Story 6.3: Visual Feedback for AI Adaptations

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want clear and attractive visual feedback for AI adaptations,
so that I understand why and how my workout is changing and feel confident in the AI's partnership.

## Acceptance Criteria

1. **Clear Visual Indicators**:
   - [x] AI-suggested modifications must be highlighted with high-contrast visual cues (using `brand` palette).
   - [x] Implement "Delta" indicators (e.g., `+5kg`, `-2 reps`) to show changes at a glance.
   - [x] Use semantic icons (Lucide) to categorize adaptations (e.g., `Zap` for performance, `ShieldCheck` for safety, `Flame` for intensity).

2. **Engaging Feedback States**:
   - [x] Implement an attractive "AI is thinking" state with motion (e.g., a pulsing or shimmering effect on the active exercise card).
   - [x] Use Mantine `Notification` or `Indicator` to show when a new adaptation is available without blocking the flow.

3. **High-Fidelity Interaction**:
   - [x] Adaptations must use the established `MotionFeedback` component for "glow" or "pulse" transitions.
   - [x] Ensure all feedback elements are readable in both light and dark modes.
   - [x] Feedback must be clear even during high-intensity exercise (high contrast, large text where appropriate).

4. **Performance & Trust**:
   - [x] Visual feedback must be rendered within 500ms of the AI suggestion being generated.
   - [x] Total response time from trigger to visual presentation must stay under 2 seconds (NFR1).
   - [x] All adaptations must clearly cite the reasoning (e.g., "Based on your fatigue report...").

## Tasks / Subtasks

- [x] **Component Enhancements**
  - [x] Update `src/features/session/components/AdaptationPrompt.tsx` to include semantic icons and "Before/After" delta comparisons.
  - [x] Integrate `MotionFeedback` into `AdaptationPrompt` for entry/exit animations.
  - [x] Create a `ThinkingIndicator` component in `src/features/session/components/` for the "AI analysis" phase.
- [x] **UI Integration**
  - [x] Update `LiveWorkoutSession.tsx` to trigger the "Thinking" state when the adaptation request starts.
  - [x] Implement a "New Adaptation" notification using Mantine's `Notification` system.
- [x] **Polish & Theme**
  - [x] Audit `brand` color usage to ensure adaptations stand out from standard UI elements.
  - [x] Verify accessibility of "Delta" indicators (color + text).
- [x] **Testing & Quality**
  - [x] Add `@smoke` tests for the adaptation feedback flow.
  - [x] Add `@p1` tests for "Before/After" calculation logic in the UI.
  - [x] Verify `prefers-reduced-motion` compliance.

## Dev Notes

- **Relevant Architecture Patterns**:
  - **Mantine 8.x Indicators**: Use `Indicator` for non-intrusive "New Adaptation" signals.
  - **Delta Logic**: Calculate deltas in a utility or within the component to show `+`/`-` changes clearly.
  - **Safety First**: Any modification displayed MUST have passed through the safety validation service (already established in `6.2`).
- **Source Tree Components to Touch**:
  - `src/features/session/components/AdaptationPrompt.tsx`
  - `src/features/session/components/LiveWorkoutSession.tsx`
  - `src/features/session/components/ThinkingIndicator.tsx` (New)
  - `src/components/ui/MotionFeedback.tsx`
- **Testing Standards**:
  - Use `renderWithProviders` for all tests.
  - Mock `GeminiService` and safety validation for UI tests.

### Project Structure Notes

- **Feature Alignment**: Keep all session-specific feedback within `src/features/session/`.
- **Naming**: Use semantic names for icons and components (e.g., `AdaptationDelta`, `ReasoningBadge`).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical-Success-Moments]
- [Source: _bmad-output/implementation-artifacts/6-2-interactive-micro-interactions-motion.md]

## Dev Agent Record

### Agent Model Used

opencode (gemini-2.0-flash-exp)

### Debug Log References

- [Log: Sprint Status updated to ready-for-dev]
- [Log: Project diagnostics noted - potential theme property mismatch in Mantine 8.x]

### Completion Notes List

- Implemented `ThinkingIndicator` component for AI analysis feedback.
- Enhanced `AdaptationPrompt` with semantic icons (Lucide) and high-contrast "Delta" indicators using the `brand` palette.
- Integrated `MotionFeedback` (glow effect) into the adaptation prompt and fixed color prop bug.
- Updated `LiveWorkoutSession` to display the `ThinkingIndicator` during AI processing.
- Added pulsing "shimmer" effect to the exercise card during AI analysis phase (AC 2.1).
- Integrated Mantine `Indicator` for non-intrusive "New Adaptation" signals (AC 2.2).
- Repositioned `ThinkingIndicator` to the top of the screen to avoid UI overlaps.
- Improved accessibility with ARIA labels and `role="status"` for AI feedback elements.
- Added comprehensive unit tests for the new feedback components and button interactions.
- Verified all visual elements are responsive and accessible.

### File List

- src/features/session/components/ThinkingIndicator.tsx
- src/features/session/components/AdaptationPrompt.tsx
- src/features/session/components/LiveWorkoutSession.tsx
- src/features/session/components/__tests__/AdaptationFeedback.test.tsx
- src/features/session/components/__tests__/LiveWorkoutSession.test.tsx
- src/components/ui/MotionFeedback.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/6-3-visual-feedback-for-ai-adaptations.md

## Change Log

- 2026-01-09: Initial implementation of visual feedback for AI adaptations. Added ThinkingIndicator, enhanced AdaptationPrompt, and integrated with LiveWorkoutSession.
