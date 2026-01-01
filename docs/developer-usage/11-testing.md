# 11. Testing

This document describes our testing strategy for GymGenie, which is essential for maintaining code quality, preventing regressions, and ensuring a reliable user experience. Our testing is done with [Vitest](https://vitest.dev/).

## Testing Philosophy

We aim for a practical and effective testing pyramid:

1.  **Unit Tests (Most Numerous)**: Fast, focused tests for individual functions, components, or services in isolation.
2.  **Integration Tests**: Tests that verify the interaction between several units (e.g., a component interacting with a Redux slice, or a service calling another service).
3.  **End-to-End (E2E) Tests (Fewest)**: Slower, high-level tests that simulate a full user workflow through the application.

## Running Tests

*   To run all tests:
    ```bash
    pnpm test
    ```
*   To run tests in watch mode with a UI:
    ```bash
    pnpm test:ui
    ```

Test files are located in the [`test/`](../../test) directory and have a `.test.ts` or `.test.tsx` extension.

## Unit & Integration Testing

*   **What to Test**:
    *   **Services**: Test public methods of services to ensure business logic is correct. Mock dependencies (like other services or APIs) where necessary. See [`test/sessionStateManager.test.ts`](../../test/sessionStateManager.test.ts).
    *   **Redux Logic**: Test reducers to ensure they update state correctly. Test thunks to ensure they dispatch the correct actions and call services as expected. See [`store/__tests__/store.test.ts`](../../store/__tests__/store.test.ts).
    *   **Utility Functions**: Any complex utility function should have unit tests.
    *   **Components**: Test that components render correctly based on props, that they display different states (loading, empty, error), and that they call functions on user interaction. We use React Testing Library for this. See [`test/ResponsiveWorkoutCard.test.tsx`](../../test/responsive-workout-card.test.tsx).

## Critical Flows to Test

When adding new features or refactoring, ensure that the following critical user flows remain covered by tests:

1.  **Onboarding to Dashboard**: The flow of a new user signing up, entering their details, successfully generating a plan, and landing on the main dashboard.
2.  **Start and Complete Workout**: The entire lifecycle of a workout session: starting the session, progressing through exercises and sets, and successfully completing the workout, which should result in a new entry in the workout history. See [`test/integration/sessionWorkflow.test.ts`](../../test/integration/sessionWorkflow.test.ts).
3.  **Data Persistence and Recovery**: Tests should verify that application state (like the user's plan or a session in progress) is correctly saved to storage and successfully reloaded when the app restarts. See [`test/session-persistence.test.ts`](../../test/session-persistence.test.ts) (hypothetical example).
4.  **Profile Updates**: A user should be able to update their biometrics or equipment, and those changes should be reflected in future plan generations.
5.  **Offline Behavior**: Critical actions, like saving a completed workout, should be queued and retried if the user is offline. See [`test/offline-request-queue.test.ts`](../../test/offline-request-queue.test.ts).
