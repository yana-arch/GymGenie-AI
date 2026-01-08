# Story 4.2: Milestone Celebrations

## Change Log

- **2026-01-08**: Initial implementation of advanced milestone celebrations. Added MilestoneService, updated liveSessionSlice, and enhanced celebration UI. Integrated with form correction and live session tracking.
- **2026-01-08**: AI Code Review Fixes: Implemented audio priority (Safety > Celebration), fixed Personal Best logic for new exercises, stabilized milestone IDs, and added mandatory test tags.

## Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user completing workout milestones,
I want immediate celebrations and encouragement,
so that I stay motivated and feel accomplished during my training.

## Acceptance Criteria

1. **Given** a user completes a set or exercise
2. **When** they hit predefined milestones (percentage completion, personal bests, streaks)
3. **Then** celebratory feedback appears immediately in the UI (AC: #FR23, #FR29)
4. **And** encouragement messages adapt contextually to the progress level and intensity (e.g., "Starting strong!" vs "Final push!")
5. **And** visual effects (confetti/animations) are triggered for major milestones (50%, 100%, PB)
6. **And** audio encouragement is provided via the hands-free guidance system (AC: #FR26)
7. **And** all milestone history is preserved in the local session state for later review (AC: #FR14)
8. **And** celebrations do not disrupt the workout flow or safety guidance priority (Safety > Celebration)

## Tasks / Subtasks

- [x] **Enhance Milestone Detection Engine** (AC: 1, 2, 7)
  - [x] Implement `MilestoneService` to track varied milestones (PB, streaks, volume)
  - [x] Update `liveSessionSlice` to support multi-type milestone history
  - [x] Add logic to detect Personal Bests based on historical session data
- [x] **Build Advanced Celebration UI** (AC: 3, 4, 5)
  - [x] Integrate `canvas-confetti` or CSS-based animation for major hits
  - [x] Create `CelebrationOverlay` with adaptive messaging based on progress stage
  - [x] Implement variety in visual styles (Colors: blue for progress, gold for PB, green for streaks)
- [x] **Integrate Adaptive Encouragement** (AC: 4, 6, 8)
  - [x] Build message bank with intensity-matched categories (Warmup, Grind, Peak, Finish)
  - [x] Connect `SpeechSynthesis` to the celebration trigger with "celebration" voice profile
  - [x] Ensure celebration audio doesn't overlap with critical safety warnings

## Dev Notes

- **Milestone Types**:
  - `PROGRESS`: 25%, 50%, 75%, 100% (Incremental)
  - `STREAK`: 3+ exercises in a row with perfect form (detected by Form Service)
  - `PERSONAL_BEST`: Record weight or reps for an exercise (requires history check)
  - `VOLUME`: Total tonnage milestones (e.g., "1,000kg lifted today!")

- **Mantine Components**:
  - Use `Modal` for major milestones (100%) or `Notification` for minor ones.
  - Use `Transition` for smooth entrance/exit.

- **Audio Pattern**:
  - Celebrations should use a more "energetic" tone/pitch if supported by the OS voice.

### Project Structure Notes

- New service: `src/features/session/services/MilestoneService.ts`
- Enhanced component: `src/features/session/components/MilestoneCelebration.tsx` (or new `CelebrationManager.tsx`)

### References

- [Source: _bmad-output/planning-artifacts/prd.md#FR23]
- [Source: _bmad-output/planning-artifacts/prd.md#FR29]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical-Success-Moments]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash) - Ultimate Story Context Engine

### Previous Story Intelligence

- **From Story 4.1**: Milestone tracking was started with basic percentages. Re-use `SessionGuidanceService` hooks to trigger celebrations.
- **From Story 1.5**: Ensure `AICoachingOrchestrator` is aware of the "User State" (Fatigue) when choosing encouragement messages. Don't say "Pick up the pace!" if fatigue is high; say "Great grit, finish safe!".
- **Code Pattern**: Use the `Confetti` pattern for 100% completion - if `canvas-confetti` is unavailable, use a high-performance CSS particle effect.

### Completion Notes List

- ✅ Implemented `MilestoneService` with support for PROGRESS, STREAK, PERSONAL_BEST, and VOLUME milestones.
- ✅ Integrated adaptive encouragement with fatigue-aware messaging.
- ✅ Updated `liveSessionSlice` to store multi-type milestones.
- ✅ Enhanced `MilestoneCelebration.tsx` with dynamic styling and adaptive messaging.
- ✅ Integrated milestone detection into `FormCorrectionService` (streaks) and `LiveWorkoutSession` (volume, PBs).
- ✅ Verified implementation with unit and integration tests.

### File List

- `src/features/session/services/MilestoneService.ts`
- `src/features/session/__tests__/MilestoneService.test.ts`
- `src/features/session/store/liveSessionSlice.ts`
- `src/features/session/store/__tests__/milestoneIntegration.test.ts`
- `src/features/session/services/SessionGuidanceService.ts`
- `src/features/session/hooks/useGuidanceLoop.ts`
- `src/features/session/components/MilestoneCelebration.tsx`
- `src/features/form-correction/services/FormCorrectionService.ts`
- `src/features/session/components/LiveWorkoutSession.tsx`
- `src/features/session/__tests__/SessionGuidanceService.test.ts`
