# Story 4.3: Contextual Modifications

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user experiencing changing conditions during workouts,
I want the AI to make contextual adjustments based on my current state,
so that my workout remains optimal despite varying circumstances.

## Acceptance Criteria

1. **Given** a user shows signs of fatigue (form breakdown, reduced speed) or reports changing conditions (time constraint, energy drop)
2. **When** the AI detects these contextual changes via telemetry or user input (AC: #FR24, #FR44)
3. **Then** it suggests appropriate modifications in real-time within 2 seconds (e.g., reduce reps, increase rest, skip accessory work) (AC: #NFR1)
4. **And** modifications maintain workout effectiveness while prioritizing user comfort and safety (AC: #FR1, #FR9)
5. **And** the adaptation is explained clearly (e.g., "Noticing some fatigue - let's drop the weight by 10% to keep your form perfect.") (AC: #FR21)
6. **And** the user can accept, adjust, or ignore the modification with a single tap (AC: #FR3, #FR46)
7. **And** the system logs the context and outcome for future personalization (AC: #FR12, #FR15)

## Tasks / Subtasks

- [x] **Implement Context Detection Logic** (AC: 1, 2)
  - [x] Integrate `FormAnalysisService` results (form quality trends) into the `userContext`.
  - [x] Add fatigue detection based on velocity loss (if supported by PoseDetection) or manual "Feel" check.
  - [x] Create `ContextCaptureService` (Singleton) to aggregate energy, time, and fatigue signals.
  - [x] Update `unifiedCoaching.types.ts` with new `ADAPTATION` trigger types (fatigue, time-constraints).
- [x] **Enhance Adaptation Orchestration** (AC: 3, 4, 5)
  - [x] Extend `EnhancedAICoachingOrchestrator` to handle `ADAPTATION` priority conflicts specifically for fatigue.
  - [x] Implement `AdaptationGenerator` to create specific exercise-level modifications (Weight -10%, Reps -2, Rest +30s).
  - [x] Integrate with `ExerciseCatalogService` to suggest similar but lower-intensity alternatives.
- [x] **Build Real-time Adaptation UI** (AC: 5, 6)
  - [x] Create `AdaptationPrompt` component using Mantine `Notification` or `Modal`.
  - [x] Add "Quick Accept" and "Manual Override" controls.
  - [x] Integrate with `AudioCoachingService` to announce adaptations hands-free.
- [x] **Data Persistence & Learning** (AC: 7)
  - [x] Update `liveSessionSlice` to track "Adaptation Events" and user responses.
  - [x] Feed response data back to `PreferenceLearningService` to calibrate future sensitivity.

## Review Follow-ups (AI)

- [x] [AI-Review][High] Fixed missing integration of `AdaptationPrompt` in `LiveWorkoutSession`.
- [x] [AI-Review][High] Integrated `AudioCoachingService.announceAdaptation` for hands-free guidance.
- [x] [AI-Review][High] Fixed safety violation in Orchestrator where fatigue could downgrade safety priority.
- [x] [AI-Review][Medium] Fixed singleton state leakage by clearing context on session end.
- [x] [AI-Review][Medium] Corrected path alias violations in service files.
- [x] [AI-Review][Low] Refactored redundant logic in `ContextCaptureService`.

## Dev Notes

- **Priority Hierarchy**: Never let an Adaptation override a Safety or Injury warning. If the user is injured, the Injury system stops the exercise; the Adaptation system shouldn't just "reduce reps".
- **Telemetry Sources**:
  - `formCorrection.latestQuality`: Trend of < 70% quality over 3 reps = Fatigue Trigger.
  - `session.timeRemaining`: If < 5 mins and 3 exercises left = Time Constraint Trigger.
- **Mantine Components**:
  - Use `Alert` with `icon` for subtle adaptations.
  - Use `Drawer` for complex alternative exercise selections.

### Project Structure Notes

- New Service: `src/features/session/services/ContextCaptureService.ts`
- Orchestrator Update: `src/features/unified-coaching/services/EnhancedAICoachingOrchestrator.ts`
- UI Component: `src/features/session/components/AdaptationPrompt.tsx`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#FR24]
- [Source: _bmad-output/planning-artifacts/prd.md#FR44]
- [Source: _bmad-output/planning-artifacts/architecture.md#AI-Service-Architecture]
- [Source: src/features/unified-coaching/AICoachingOrchestrator.ts]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash) - Ultimate Story Context Engine

### Previous Story Intelligence

- **From Story 4.1**: Re-use `useGuidanceLoop`. The adaptation check should occur every 5-10 seconds or on specific telemetry triggers.
- **From Story 4.2**: Use the energetic tone for success, but switch to a supportive, "coaching" tone for fatigue adaptations.
- **Library Note**: `canvas-confetti` is already in the project; ensure it doesn't trigger during "negative" adaptations (fatigue), only for positive progress.

### Completion Notes List

- Implemented `ContextCaptureService` as a Singleton to aggregate fatigue, energy, and time signals.
- Added fatigue detection logic based on form quality trends (< 70% over 3 reps).
- Created `AdaptationGenerator` to provide specific exercise-level modifications (Weight -10%, Reps -2, etc.).
- Built `AdaptationPrompt` UI using Mantine Modal for real-time user interaction.
- Integrated `AudioCoachingService` to announce adaptations hands-free.
- Updated `liveSessionSlice` to track adaptation events and history.
- Connected user feedback to `PreferenceLearningService` for future sensitivity calibration.
- Verified logic with unit tests for `ContextCaptureService` and `AdaptationGenerator`.

### File List

- `src/features/session/services/ContextCaptureService.ts` (New)
- `src/features/session/services/AdaptationGenerator.ts` (New)
- `src/features/session/components/AdaptationPrompt.tsx` (New)
- `src/features/session/__tests__/ContextCaptureService.test.ts` (New)
- `src/features/session/__tests__/AdaptationGenerator.test.ts` (New)
- `src/features/unified-coaching/types/unifiedCoaching.types.ts` (Modified)
- `src/features/unified-coaching/types/coachingIntelligence.types.ts` (Modified)
- `src/features/unified-coaching/services/EnhancedAICoachingOrchestrator.ts` (Modified)
- `src/features/form-correction/services/FormAnalysisService.ts` (Modified)
- `src/features/form-correction/services/AudioCoachingService.ts` (Modified)
- `src/features/session/store/liveSessionSlice.ts` (Modified)
- `src/features/preference-learning/types/preferenceLearning.types.ts` (Modified)
- `src/features/preference-learning/PreferenceLearningService.ts` (Modified)
