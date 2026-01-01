# 5. Navigation and Layout

This document explains how navigation and overall layout are managed in GymGenie.

## Responsive Navigation

The core of our navigation system is the [`ResponsiveNavigation`](../../components/ResponsiveNavigation.tsx) component. It adapts to the screen size to provide an optimal user experience on both desktop and mobile devices.

*   **Desktop**: A traditional header with navigation links is displayed at the top of the screen.
    *   Component: [`DashboardHeader`](../../components/dashboard/DashboardHeader.tsx)
*   **Mobile**: A bottom navigation bar is used for primary navigation, as it's easier to reach with a thumb.
    *   Component: [`DashboardBottomNav`](../../components/dashboard/DashboardBottomNav.tsx)

The switch between these two modes is handled automatically by the `useBreakpoint` hook.

## View Management with `AppContext`

The currently displayed view (or "screen") is controlled by the [`AppContext`](../../context/AppContext.tsx).

*   **`activeView`**: A state variable within the context that holds the key of the currently active view (e.g., `'dashboard'`, `'progress'`, `'profile'`).
*   **`setActiveView`**: The function used to change the active view.
*   **Usage**: The main [`App.tsx`](../../App.tsx) component reads the `activeView` and renders the corresponding feature component. Navigation components like `DashboardBottomNav` call `setActiveView` when a user taps on a tab.

This provides a simple, centralized way to manage the main application state without relying on a complex routing library, which is suitable for our app's shell-like structure.

## Back Behavior

On mobile, the app should handle the system's back button press. This logic is also managed within `AppContext`, allowing for custom back-behavior depending on the current view or modal state.

## Focus Mode (Live Workout Session)

A critical UX invariant is the "focus mode" during a live workout.

*   **Component**: [`LiveWorkoutSession`](../../src/features/session/components/LiveWorkoutSession.tsx)
*   **Behavior**: When a workout session is active, all primary navigation elements (`DashboardHeader`, `DashboardBottomNav`) are hidden.
*   **Implementation**: A layout effect hook `useLayoutManager` or a simple state check in [`App.tsx`](../../App.tsx) is used to determine if a session is active. If so, `ResponsiveNavigation` is not rendered. This ensures the user is fully focused on the workout without distractions.

## Content Layout

Most feature views follow a consistent layout structure for a predictable user experience.

*   **Anatomy**:
    1.  **Header**: A component, often specific to the feature (e.g., [`ProfileHeader`](../../src/features/profile/components/ProfileHeader.tsx)), displaying the title and any primary actions.
    2.  **Container**: A `div` with padding that wraps the main content of the view. This ensures consistent spacing and alignment across different screens.

This pattern is applied to the Profile, Progress, and Kitchen dashboards.
