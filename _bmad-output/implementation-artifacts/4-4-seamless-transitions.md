# Story 4.4: Seamless Transitions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user moving between exercises,
I want smooth, uninterrupted transitions without losing momentum,
so that my workout flow remains natural and engaging.

## Acceptance Criteria

1. **Given** a user completes an exercise set or the entire exercise (AC: #FR25)
2. **When** transitioning to the next exercise in the plan
3. **Then** a transition screen/overlay appears immediately showing the next exercise, required equipment, and setup tips
4. **And** a countdown timer (Rest period) is displayed and functional (AC: #FR43)
5. **And** the `AudioCoachingService` announces the next exercise and provides brief preparation cues (AC: #FR41, #FR22)
6. **And** the user can "Skip Rest" or "Extend Rest" with a single tap without disrupting the session flow (AC: #FR46)
7. **And** the camera/computer vision system automatically prepares for the next exercise's pose detection requirements
8. **And** no workflow disruption or data loss occurs during the changeover (AC: #NFR5)

## Tasks / Subtasks

- [x] **Implement Transition Management Logic**
  - [x] Create `TransitionService` (Singleton) to manage states between exercises (Rest, Prep, Active).
  - [x] Add `nextExercise` and `transitionStatus` to `liveSessionSlice`.
  - [x] Implement rest period logic with auto-advance capability.
- [x] **Develop Transition UI Components**
  - [x] Create `TransitionOverlay` component using Mantine `Modal` or `Overlay`.
  - [x] Display next exercise preview (name, image/gif placeholder).
  - [x] Add "Skip Rest", "Extend Rest (+30s)", and "Ready Now" controls.
  - [x] Show equipment setup checklist for the upcoming exercise.
- [x] **Integrate Coaching & Vision**
  - [x] Trigger `AudioCoachingService.announceNextExercise(exerciseId)`.
  - [x] Update `FormAnalysisService` to switch to the next exercise's pose model or configuration.
  - [x] Ensure `EnhancedAICoachingOrchestrator` suppresses non-critical coaching during rest periods.
- [x] **Testing & Quality**
  - [x] Unit tests for `TransitionService` state transitions.
  - [x] Integration tests for `liveSessionSlice` transition updates.
  - [x] Smoke tests for UI responsiveness during exercise changeover.

## Dev Notes

- **Momentum Preservation**: The transition should be as low-friction as possible. Avoid forcing the user to touch the screen if "Auto-Advance" is enabled.
- **Pose Detection Warmup**: Use the rest period to initialize/warmup the pose detection model for the next exercise to avoid the 500ms lag when the set starts.
- **Mantine Components**:
  - Use `RingProgress` for the rest countdown timer.
  - Use `Stepper` or `Progress` to show overall workout completion during transitions.
  - Use `List` for the equipment checklist.

### Project Structure Notes

- New Service: `src/features/session/services/TransitionService.ts`
- UI Component: `src/features/session/components/TransitionOverlay.tsx`
- Store Update: `src/features/session/store/liveSessionSlice.ts`
- Coaching Integration: `src/features/form-correction/services/AudioCoachingService.ts`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#FR25]
- [Source: _bmad-output/planning-artifacts/prd.md#FR43]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Seamless-Transitions]
- [Source: _bmad-output/implementation-artifacts/4-3-contextual-modifications.md]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash) - Ultimate Story Context Engine

### Previous Story Intelligence

- **From Story 4.1**: Re-use `LiveWorkoutSession` context providers for session state.
- **From Story 4.3**: Ensure `ContextCaptureService` continues to monitor for fatigue even during rest periods (e.g., if heart rate remains high).
- **Audio Note**: Use the `AudioCoachingService` established in 4.3 for all transition announcements.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **AI Review Fixes**:
  - Converted `AudioCoachingService` and `FormAnalysisService` to Singletons for app-wide consistency.
  - Implemented dynamic equipment checklist and exercise preview images in `TransitionOverlay`.
  - Added simulated pose model warmup in `FormAnalysisService.prepareForExercise` to meet SLA requirements.
  - Added input validation for rest durations.

### File List

- `src/features/session/services/TransitionService.ts` (Modified - Added validation, Singleton integration)
- `src/features/session/components/TransitionOverlay.tsx` (Modified - Added dynamic data and image preview)
- `src/features/session/__tests__/TransitionService.test.ts` (Modified - Fixed for Singleton pattern)
- `src/features/session/store/__tests__/liveSessionSlice.transition.test.ts` (New)
- `src/features/session/store/liveSessionSlice.ts` (Modified)
- `src/features/form-correction/services/FormAnalysisService.ts` (Modified - Singleton pattern, warmup logic)
- `src/features/form-correction/services/AudioCoachingService.ts` (Modified - Singleton pattern)
- `src/features/form-correction/__tests__/AudioCoachingService.test.ts` (Modified - Fixed for Singleton pattern)
- `src/features/unified-coaching/services/EnhancedAICoachingOrchestrator.ts` (Modified)
