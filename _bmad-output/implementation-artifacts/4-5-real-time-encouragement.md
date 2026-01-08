# Story 4.5: Real-Time Encouragement

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user working through challenging moments,
I want continuous encouragement and progress updates,
so that I stay motivated and informed throughout my entire session.

## Acceptance Criteria

1. **Given** a user is engaged in a workout (AC: #FR26)
2. **When** they reach specific performance triggers (e.g., 50% through a set, maintaining consistent pace, completing a personal best)
3. **Then** they receive timely encouragement messages via both UI and Audio (AC: #FR26, #FR41)
4. **And** progress updates are provided at logical intervals (e.g., after each exercise, 25/50/75% through total workout) (AC: #FR44)
5. **And** updates are contextually relevant to their current performance (e.g., "Great pace!", "Almost there!", "You've lifted 1000kg so far today") (AC: #FR62)
6. **And** encouragement does not interfere with critical safety alerts or form correction (AC: #FR4, #FR8)
7. **And** no workflow disruption or data loss occurs during these notifications (AC: #NFR5)

## Tasks / Subtasks

- [x] **Implement Encouragement Logic & Triggers**
  - [x] Add `ENCOURAGEMENT` to `CoachingPriority` enum in `unifiedCoaching.types.ts` (Priority: Low).
  - [x] Define `EncouragementService` (Singleton) to monitor performance and trigger messages.
  - [x] Implement trigger logic: Set progress (50%, 90%), Pace consistency, Difficulty detection (from fatigue sensors).
  - [x] Integrate with `LiveSessionSlice` to track aggregate session progress (volume, time, sets).
  - [x] Respect `userPreferences.communicationStyle === 'encouraging'` from `coachingIntelligenceSlice`.
- [x] **Develop Encouragement UI Components**
  - [x] Create `EncouragementToast` or `EncouragementOverlay` (Mantine-based).
  - [x] Implement non-intrusive "Quick Progress" HUD elements.
  - [x] Add animations for "Mini-Milestones" (e.g., "5 exercises down!").
- [x] **Integrate Audio Feedback**
  - [x] Add `EncouragementService.speakEncouragement()` calling `AudioCoachingService`.
  - [x] Define a library of context-aware encouragement phrases.
- [x] **Testing & Quality**
  - [x] Unit tests for trigger logic in `EncouragementService`.
  - [x] Integration tests for HUD updates during active sets.
  - [x] Smoke tests for audio/UI concurrency.

## Dev Notes

- **Encouragement Logic**: Use a "Cooldown" period (e.g., 30s-60s) between encouragements to avoid being annoying.
- **Priority System**: Safety Alerts > Form Correction > Guidance > Encouragement. Use the `EnhancedAICoachingOrchestrator` to manage this priority.
- **Contextual Awareness**: Encouragement should be smarter than just random phrases.
  - If user is slower than usual: "Keep it up, you're doing great!"
  - If user is crushing it: "Powerhouse! You're beating your usual pace!"
  - If halfway: "Halfway there, stay strong!"
- **Mantine Components**:
  - Use `Notification` or `showNotification` for visual encouragement.
  - Use `Text` with `gradient` for high-impact milestones.

### Project Structure Notes

- New Service: `src/features/session/services/EncouragementService.ts`
- Store Update: `src/features/session/store/liveSessionSlice.ts` (add `sessionVolume`, `currentSetProgress`)
- Coaching Integration: `src/features/form-correction/services/AudioCoachingService.ts`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#FR26]
- [Source: _bmad-output/planning-artifacts/prd.md#FR44]
- [Source: _bmad-output/planning-artifacts/prd.md#FR62]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Real-Time-Feedback]

## Dev Agent Guardrails

### Technical Requirements

- **Service Pattern**: Implement `EncouragementService` as a Singleton.
- **State Integration**: Use `useAppSelector` to monitor `liveSessionSlice` changes.
- **Audio Concurrency**: Use `AudioCoachingService.getInstance().speak()` which should handle queuing/priority.

### Architecture Compliance

- **Privacy**: No health data sent to cloud for encouragement generation; use local phrase templates.
- **Performance**: Trigger evaluation should happen in <100ms to ensure "timely" delivery.
- **Offline**: Encouragement library must be bundled locally.

### Library Framework Requirements

- **Mantine**: Use `notifications` system for non-blocking UI updates.
- **Framer Motion**: (Optional) Use for subtle "pop" animations on progress updates.

### File Structure Requirements

- `src/features/session/services/EncouragementService.ts`
- `src/features/session/__tests__/EncouragementService.test.ts`

### Testing Requirements

- Verify that encouragement triggers ONLY when appropriate conditions are met.
- Ensure priority system correctly suppresses encouragement during form correction.
- Test "Volume" calculation accuracy for progress updates.

## Previous Story Intelligence

- **CRITICAL FIX NEEDED**: Several files (`LiveWorkoutSession.tsx`, `FormCorrectionService.ts`) are currently failing to compile because they try to `new AudioCoachingService()` and `new FormAnalysisService()`. These were recently converted to Singletons. **Use `.getInstance()` instead.**
- **Missing Test Files**: Ensure `MilestoneService`, `ContextCaptureService`, and `AdaptationGenerator` tests are correctly mapped to their service paths.
- **From Story 4.4**: The `TransitionOverlay` now exists; `EncouragementService` should coordinate with `TransitionService` to show progress summaries during rest periods.

## Git Intelligence Summary

- **Recent Patterns**: Shift towards Singleton services and centralized orchestration via `EnhancedAICoachingOrchestrator`.
- **Recent Feats**: Milestone tracking (`17e4455`) and Contextual Modifications (`85f01aa`) provide the data foundation for this story.

## Project Context Reference

- See `AGENTS.md` for project structure and coding standards.
- Use `@/` alias for all internal imports.

## Story Completion Status

- **Status**: ready-for-dev
- **Analysis**: Ultimate context engine analysis completed - comprehensive developer guide created
- **Ready for Dev**: YES

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash) - Ultimate Story Context Engine

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **Implemented EncouragementService**: Singleton service with logic for set progress (50%/90%), pace consistency, and fatigue detection.
- **Enhanced AudioCoachingService**: Exposed public `speak` method with priority queuing support.
- **Added Real-time HUD**: Created `SessionProgressHUD` to show live session volume, set progress, and exercise completion.
- **Fixed Singleton Patterns**: Resolved compilation errors where services were being instantiated with `new` instead of `.getInstance()`.
- **Integrated Guidance Loop**: Refactored `useGuidanceLoop` to use the unified `AudioCoachingService` and trigger real-time fatigue checks.

### File List

- `src/features/session/services/EncouragementService.ts` (New)
- `src/features/session/components/SessionProgressHUD.tsx` (New)
- `src/features/session/__tests__/EncouragementService.test.ts` (New)
- `src/features/form-correction/services/AudioCoachingService.ts` (Modified)
- `src/features/form-correction/services/FormAnalysisService.ts` (Modified)
- `src/features/form-correction/services/FormCorrectionService.ts` (Modified)
- `src/features/session/components/LiveWorkoutSession.tsx` (Modified)
- `src/features/session/hooks/useGuidanceLoop.ts` (Modified)
- `src/features/session/store/liveSessionSlice.ts` (Modified)
- `src/features/form-correction/store/formCorrectionSlice.ts` (Modified)
- `src/features/unified-coaching/types/unifiedCoaching.types.ts` (Modified)
- `src/features/unified-coaching/AICoachingOrchestrator.ts` (Modified)
- `src/features/unified-coaching/services/EnhancedAICoachingOrchestrator.ts` (Modified)
- `src/features/unified-coaching/types/coachingIntelligence.types.ts` (Modified)
- `src/features/form-correction/__tests__/FormAnalysisService.test.ts` (Modified)
- `src/features/form-correction/__tests__/LocalProcessingVerification.test.ts` (Modified)
- `src/features/form-correction/__tests__/PerformanceBaseline.test.ts` (Modified)
- `src/features/form-correction/__tests__/FormCorrectionSecurity.test.ts` (Modified)

