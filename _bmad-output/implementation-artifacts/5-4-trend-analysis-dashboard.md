# Story 5.4: Trend Analysis Dashboard

Status: done

## Story

As a fitness user analyzing my training patterns,
I want comprehensive trend analysis showing improvement trajectories,
so that I can make informed decisions about my training approach and goals.

## Acceptance Criteria

1. **Trend Visualization**:
   - [x] Implement multi-metric trend comparison (e.g., volume vs. intensity).
   - [x] Provide moving average (7-day/30-day) overlays to smooth out daily fluctuations.
   - [x] Highlight "Trajectory" - visual indicators showing if the trend is upward, stable, or downward.
2. **"Areas Needing Attention" Detection**:
   - [x] Identify plateaus (e.g., no improvement in max weight or volume for 3+ weeks).
   - [x] Detect significant drops (>20%) in consistency or intensity over a rolling period.
   - [x] Flag exercises where progress has stalled relative to historical performance.
3. **Advanced Filtering & Granularity**:
   - [x] Allow filtering by muscle group (e.g., "Push" trends, "Pull" trends, "Leg" trends).
   - [x] Toggle between different visualization types (Line, Area, Scatter) for different data types.
4. **AI-Powered Trend Commentary**:
   - [x] Generate short, insightful summaries of the trends (e.g., "Your endurance is up 15%, but your squat volume has plateaued.").
   - [x] Use rule-based generation for immediate feedback, optionally enhanced by AI.
5. **UI Integration**:
   - [x] Integrate as a new "Trends" tab in the `ProgressDashboard.tsx`.
   - [x] Ensure mobile-first responsiveness for all charts using `ResponsiveContainer`.

## Tasks / Subtasks

- [x] **Analytics Service Extensions**
  - [x] Update `AnalyticsService.ts` in `src/features/analytics/services/`
  - [x] Implement `calculateTrendTrajectory` logic (slope calculation).
  - [x] Implement `detectPlateaus` logic for exercises.
  - [x] Add `groupByMuscleGroup` utility for session exercise data.
- [x] **Store Enhancements**
  - [x] Update `analyticsSlice` if needed for cached trend data.
- [x] **New UI Components**
  - [x] Create `TrendAnalysisTab.tsx` in `src/features/analytics/components/`
  - [x] Create `TrajectoryChart.tsx` using `recharts` (LineChart with multi-axis support).
  - [x] Create `AttentionAlerts.tsx` for displaying plateau/drop warnings.
  - [x] Create `TrendInsightSummary.tsx` for text-based insights.
- [x] **Dashboard Integration**
  - [x] Update `ProgressDashboard.tsx` to include the "Trends" tab.
  - [x] Ensure state sharing between "Progress" and "Trends" tabs for time period selection.
- [x] **Testing & Quality**
  - [x] Write unit tests for trajectory and plateau detection (@p1).
  - [x] Write component tests for `TrajectoryChart` (@p2).
  - [x] Ensure all new tests follow the mandatory tagging requirement.

## Dev Notes

- **Architecture Patterns**: Continue using the Singleton pattern for `AnalyticsService`. Use `useMemo` for heavy data transformations to keep the UI responsive.
- **Source Tree Components**:
  - `src/features/analytics/components/`: New components.
  - `src/features/analytics/services/AnalyticsService.ts`: Core logic.
- **Testing Standards**:
  - Vitest for service logic.
  - React Testing Library for components.
  - Mandatory tags: `@p1` for core logic, `@p2` for UI.

### Project Structure Notes

- Keep the new components in `src/features/analytics/components/trends/` if the number of files grows large.
- Align with `Mantine` for all UI elements (Papers, Cards, Lists).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data-Architecture]
- [Source: src/features/analytics/services/AnalyticsService.ts] - Base for extension.

### Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (with Adversarial Review & Auto-fix)

### Debug Log References

- Implemented `calculateTrendTrajectory`, `detectPlateaus` (time-based), `detectSignificantDrops`, `groupByMuscleGroup` in `AnalyticsService`.
- Added `TrajectoryChart` (with type support), `AttentionAlerts`, `TrendInsightSummary`, and `TrendAnalysisTab` (with smoothing/type toggles).
- Integrated `TrendAnalysisTab` into `ProgressDashboard`.
- Added unit and component tests.
- **AI Review Fixes**:
  - Fixed missing "Significant Drops" detection logic to use rolling averages and consistency checks.
  - Added UI toggles for Chart Type (Area/Line/Scatter) and Smoothing (7d/30d MA).
  - Improved Plateau detection to correctly calculate time-based stalls (3+ weeks).
  - Fixed hardcoded empty props in `TrendAnalysisTab`.
  - **Adversarial Review Fixes (v2)**:
    - Eliminated `any` types in `ProgressDashboard` for strict type safety.
    - Optimized data processing in `TrendAnalysisTab` to reduce complexity from O(2N) to O(N).
    - Improved `TrajectoryChart` responsiveness for mobile devices.
    - Upgraded test priorities for plateau and trajectory detection to `@p0`.
    - Added input validation and constants to `AnalyticsService`.

### Completion Notes List

- ✅ Trend trajectory calculation uses linear regression for slope.
- ✅ Plateau detection uses a configurable time threshold (default 3 weeks).
- ✅ Trend visualization includes volume, intensity, and configurable moving average.
- ✅ Muscle group filtering and chart type toggling implemented.
- ✅ Significant drop detection (>20%) implemented with rolling averages and consistency tracking.

### File List

- `src/features/analytics/services/AnalyticsService.ts`
- `src/features/analytics/__tests__/AnalyticsService.test.ts`
- `src/features/analytics/components/trends/TrajectoryChart.tsx`
- `src/features/analytics/components/trends/AttentionAlerts.tsx`
- `src/features/analytics/components/trends/TrendInsightSummary.tsx`
- `src/features/analytics/components/trends/TrendAnalysisTab.tsx`
- `src/features/analytics/components/trends/__tests__/TrajectoryChart.test.tsx`
- `src/features/analytics/components/ProgressDashboard.tsx`
- `_bmad-output/implementation-artifacts/validation/validation-report-5-4-trend-analysis-dashboard.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
