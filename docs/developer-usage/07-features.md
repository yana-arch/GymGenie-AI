# 7. Features

This document breaks down the core features of GymGenie. Each section describes the feature's purpose, its main UI components, state management, and any associated services.

## Onboarding

*   **Purpose**: To collect essential user information (biometrics, goals, injuries, available equipment) to generate a personalized and safe workout plan.
*   **UI**: A multi-step form experience managed by [`Onboarding.tsx`](../../src/features/onboarding/components/Onboarding.tsx).
*   **State**: The temporary onboarding state is managed locally within the component. Upon completion, the data is used to populate the `userSlice`.
*   **Services**:
    *   Uses [`WorkoutGenerator`](../../src/features/workout/services/WorkoutGenerator.ts) (which in turn calls `geminiService`) to create the initial plan.
    *   User data is saved via the `userSlice` and persisted by `storageService`.

## Workout Dashboard

*   **Purpose**: The main landing screen of the app. It provides a summary of the user's current program and shows the next workout to be performed.
*   **UI**: [`WorkoutDashboard.tsx`](../../src/features/workout/components/WorkoutDashboard.tsx) is the container.
    *   [`ProgramOverview.tsx`](../../src/features/workout/components/ProgramOverview.tsx): Displays overall program goals and progress.
    *   [`NextWorkout.tsx`](../../src/features/workout/components/NextWorkout.tsx): Shows a card with details of the next scheduled workout, with a clear "Start" button.
*   **State**: Primarily reads from [`workoutSlice`](../../src/features/workout/store/workoutSlice.ts) and [`userSlice`](../../src/features/user/store/userSlice.ts).

## Live Workout Session

*   **Purpose**: A focused, distraction-free environment for performing a workout.
*   **UI**: [`LiveWorkoutSession.tsx`](../../src/features/session/components/LiveWorkoutSession.tsx). This component takes over the entire screen (Focus Mode).
*   **State**: All state for the active session is managed in [`sessionSlice`](../../src/features/session/store/sessionSlice.ts). This includes the current exercise, set number, reps, weight, and rest timer state.
*   **Services**: This feature is service-heavy.
    *   [`sessionStateManager.ts`](../../src/features/session/services/sessionStateManager.ts): The core service for managing the session lifecycle (start, next exercise, complete set, end).
    *   [`SessionPersistenceManager.ts`](../../src/features/session/services/SessionPersistenceManager.ts): Handles saving and recovering session state to prevent data loss if the app is closed.
    *   [`SessionConflictResolver.ts`](../../src/features/session/services/SessionConflictResolver.ts): Manages cases where a session is already active or a stale session is found.

## Progress Dashboard

*   **Purpose**: To give users a clear view of their historical performance and progress over time.
*   **UI**: [`ProgressDashboard.tsx`](../../src/features/workout/components/ProgressDashboard.tsx).
    *   [`TrainingVolumeChart.tsx`](../../src/features/workout/components/TrainingVolumeChart.tsx): A chart (using `recharts`) showing total training volume over time.
    *   [`WeeklyProgressCalendar.tsx`](../../src/features/workout/components/WeeklyProgressCalendar.tsx): A collapsible calendar showing completed workout days.
    *   [`WorkoutHistoryList.tsx`](../../src/features/workout/components/WorkoutHistoryList.tsx): A list of all past workouts.
*   **State**: Reads from the `workoutHistory` array within [`workoutSlice`](../../src/features/workout/store/workoutSlice.ts).

## Kitchen (Nutrition)

*   **Purpose**: To provide AI-powered meal ideas and allow users to track their nutrition.
*   **UI**: [`NutritionGenie.tsx`](../../src/features/nutrition/components/NutritionGenie.tsx). This likely includes an overview, a "Scan Food" feature, and a list of AI meal ideas.
*   **State**: Managed in a dedicated `nutritionSlice` (not shown in file list, but would be at `src/features/nutrition/store/nutritionSlice.ts`).
*   **Services**:
    *   [`DietService.ts`](../../src/features/nutrition/services/DietService.ts): Interacts with `geminiService` to generate meal ideas based on the user's TDEE and preferences.

## Profile & Settings

*   **Purpose**: Allows users to manage their personal data, equipment, and application settings.
*   **UI**: [`ProfileDashboard.tsx`](../../src/features/profile/components/ProfileDashboard.tsx).
    *   [`BiometricEditor.tsx`](../../src/features/profile/components/BiometricEditor.tsx): Edit weight, height, etc., which recalculates BMI/TDEE.
    *   [`InjuriesManager.tsx`](../../src/features/profile/components/InjuriesManager.tsx): Add or remove injuries to influence plan generation.
    *   [`EquipmentList.tsx`](../../src/features/profile/components/EquipmentList.tsx): Manage the list of available workout equipment.
    *   [`DataManagementSection.tsx`](../../src/features/profile/components/DataManagementSection.tsx): For exporting user data or resetting the app state.
*   **State**: Reads and writes to [`userSlice`](../../src/features/user/store/userSlice.ts).
*   **Services**: `userSlice` thunks would be used to handle the logic for updating user data.
