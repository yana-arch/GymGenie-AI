# 9. UI/UX Guidelines

This document outlines the rules, conventions, and best practices for building consistent and high-quality user interfaces in GymGenie.

## Layout and Spacing

*   **Framework**: We use [Tailwind CSS](https://tailwindcss.com/) for all styling. Avoid writing custom CSS files unless absolutely necessary.
*   **Breakpoints**: The primary breakpoints are defined in [`tailwind.config.js`](../../tailwind.config.js). The most common are `sm`, `md`, `lg`. Use responsive prefixes for designing mobile-first (e.g., `flex-col lg:flex-row`). The `useBreakpoint` hook can be used for logic-based responsive rendering.
*   **Spacing**: Use Tailwind's spacing scale (`p-4`, `m-2`, `gap-8`, etc.) for all margins, padding, and gaps. This ensures consistency. Do not use arbitrary values like `margin: 13px`.

## Empty States & Loading States

*   **Requirement**: Every view or component that fetches and displays data **must** have explicit loading, empty, and error states.
*   **Loading State**: Show a loading spinner or skeleton loader while data is being fetched. This provides immediate feedback to the user.
*   **Empty State**: When a fetch is successful but the data array is empty (e.g., no workout history), display a helpful message and, if applicable, a call-to-action. For example, "You haven't completed any workouts yet. Start one today!"
*   **Error State**: If a data fetch fails, display a clear error message with an option to retry the action.

## Toasts and Error Notifications

*   **Usage**: For non-blocking feedback, such as "Workout saved successfully," use a toast notification.
*   **Implementation**: The global UI state for toasts is managed in [`src/features/ui/store/uiSlice.ts`](../../src/features/ui/store/uiSlice.ts). Dispatch an action to this slice to show a toast from anywhere in the app.
*   **Critical Errors**: For critical errors that prevent a feature from working, use a modal or a dedicated error component within the view itself, rather than a transient toast. An example is a Zod validation failure on app load, which should present a blocking error.

## Accessibility (A11y)

While not exhaustive, follow these basic accessibility practices:

*   **Semantic HTML**: Use appropriate HTML tags (`<nav>`, `<main>`, `<button>`, etc.).
*   **Image `alt` Tags**: All `<img>` tags must have a descriptive `alt` attribute.
*   **Button & Link Text**: Buttons and links should have clear, descriptive text. Avoid "Click here."
*   **Focus Management**: Ensure interactive elements are focusable and have a clear focus state (Tailwind's `focus:` variants are good for this).

## Troubleshooting Common UI Issues

*   **Bottom Nav Overlapping Content**: Ensure the main content container has a bottom padding (`pb-16` or similar) that is at least the height of the [`DashboardBottomNav`](../../components/dashboard/DashboardBottomNav.tsx) component. This prevents the nav from hiding content at the bottom of the list.
*   **Chart Shows "No Data"**: This is often due to an empty data array being passed. Check the selector pulling data from the Redux store. The component should correctly render its "Empty State" in this scenario rather than the chart's default message.
