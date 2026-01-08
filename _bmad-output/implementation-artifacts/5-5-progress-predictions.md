# Story 5.5: Progress Predictions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user,
I want AI-powered predictions of my progress based on current performance,
so that I can set realistic goals and stay motivated by seeing potential outcomes.

## Acceptance Criteria

1. **Prediction Engine**:
   - [x] Implement a prediction engine that calculates potential future performance based on historical trends (linear and exponential models).
   - [x] Support predictions for multiple metrics: Max Strength (Estimated 1RM), Total Volume, and Endurance (reps/time).
   - [x] Include a "Confidence Level" for each prediction based on data consistency and volume (e.g., "High Confidence" if 10+ data points in last 30 days).

2. **Realistic Goal Setting**:
   - [x] Provide "Target Date" estimations for user-defined goals (e.g., "When will I hit a 100kg Bench Press?").
   - [x] Offer "Realistic" vs. "Optimistic" vs. "Conservative" projections.
   - [x] Factor in detected plateaus from Story 5.4 to adjust expectations.

3. **Predictive Visualization**:
   - [x] Extend `TrajectoryChart.tsx` to display dotted/shaded "Forecast" lines extending from historical data.
   - [x] Show "Uncertainty Bands" around predicted paths to visualize confidence intervals.
   - [x] Provide a summary view of predicted milestones (e.g., "Next milestone: 225lb Squat - Estimated March 15th").

4. **Contextual Factors**:
   - [x] Highlight factors that could influence outcomes (e.g., "Maintaining current frequency is critical", "Plateau detected - consider deload").
   - [x] Use `GeminiService` to generate natural language explanations for the predictions.

5. **UI Integration**:
   - [x] Integrate as a "Predictions" tab in the `ProgressDashboard.tsx`.
   - [x] Ensure mobile-first responsiveness for all forecasting visualizations.

## Tasks / Subtasks

- [x] **Prediction Service Implementation**
  - [x] Create `PredictionService.ts` in `src/features/analytics/services/`.
  - [x] Implement linear regression and basic exponential growth models for time-series forecasting.
  - [x] Implement confidence interval calculations based on standard deviation of historical residuals.
  - [x] Add `estimateDateForTarget` utility.
- [x] **Store & API Updates**
  - [x] Update `analyticsSlice` to handle prediction state and user targets.
  - [x] Implement `PredictionService` integration with `GeminiService` for "why" explanations.
- [x] **UI Component Development**
  - [x] Create `PredictionTab.tsx` in `src/features/analytics/components/predictions/`.
  - [x] Create `ForecastChart.tsx` (extension or wrapper for `TrajectoryChart.tsx` with forecasting).
  - [x] Create `MilestoneProjectionCard.tsx` for displaying upcoming achievements.
  - [x] Create `PredictionExplanation.tsx` for AI-generated context.
- [x] **Dashboard Integration**
  - [x] Update `ProgressDashboard.tsx` to include the "Predictions" tab.
  - [x] Add goal input UI for users to specify targets for prediction.
- [x] **Testing & Quality**
  - [x] Write unit tests for prediction models and confidence calculations (@p0).
  - [x] Write component tests for `ForecastChart` ensuring proper rendering of uncertainty bands (@p1).
  - [x] Validate AI prompt consistency for prediction explanations.
- [x] **Review Follow-ups (AI)**
  - [x] [AI-Review][High] Fix regression math to use date differences instead of indices. [PredictionService.ts]
  - [x] [AI-Review][High] Integrate plateau detection into prediction damping. [PredictionTab.tsx]
  - [x] [AI-Review][High] Support multiple metrics (Volume, Reps) in UI. [PredictionTab.tsx]
  - [x] [AI-Review][Medium] Prevent negative physical value predictions. [PredictionService.ts]
  - [x] [AI-Review][Medium] Use Standard Deviation for optimistic/conservative paths. [PredictionService.ts]
  - [x] [AI-Review][Medium] Add "Upcoming Milestones" summary view. [PredictionTab.tsx]

## Dev Notes

- **Relevant Architecture Patterns**:
  - Singleton `PredictionService`.
  - Use `mathjs` or simple linear algebra for regression models to keep it lightweight.
  - Use `recharts` `<Area />` components for uncertainty bands.
- **Source Tree Components**:
  - `src/features/analytics/services/PredictionService.ts`
  - `src/features/analytics/components/predictions/`
- **Testing Standards**:
  - Mandatory tagging: `@p0` for mathematical accuracy of predictions.
  - Mock `GeminiService` for prompt-based explanations.

### Project Structure Notes

- Keep mathematical models separate from service orchestration logic.
- Align with Mantine's `Tabs`, `Skeleton` (for prediction loading), and `Alert` components.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.5]
- [Source: _bmad-output/planning-artifacts/prd.md#Progress-Tracking-&-Analytics]
- [Source: _bmad-output/implementation-artifacts/5-4-trend-analysis-dashboard.md] - Previous context on plateaus and trends.

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-exp

### Debug Log References

- Implemented linear and exponential regression in `PredictionService`.
- Added confidence interval calculations using standard deviation of residuals.
- Integrated `GeminiService` for natural language explanations.

### Completion Notes List

- Prediction engine supports both linear and exponential models.
- Milestone projections include Realistic, Optimistic, and Conservative dates.
- UI integrated seamlessly into Progress Dashboard with a new "Predictions" tab.
- Unit and component tests passed.

### File List

- `src/features/analytics/services/PredictionService.ts`
- `src/features/analytics/services/PredictionService.test.ts`
- `src/features/analytics/store/analyticsSlice.ts`
- `src/features/analytics/components/predictions/ForecastChart.tsx`
- `src/features/analytics/components/predictions/MilestoneProjectionCard.tsx`
- `src/features/analytics/components/predictions/PredictionExplanation.tsx`
- `src/features/analytics/components/predictions/PredictionTab.tsx`
- `src/features/analytics/components/predictions/__tests__/ForecastChart.test.tsx`
- `src/services/ai/GeminiService.ts` (updated)
- `src/store/index.ts` (updated)
- `src/features/analytics/components/ProgressDashboard.tsx` (updated)

