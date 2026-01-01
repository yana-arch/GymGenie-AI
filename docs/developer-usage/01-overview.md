# 1. Overview

## App Purpose

GymGenie is a smart workout and nutrition assistant designed to help users achieve their fitness goals. It leverages AI to generate personalized workout plans and meal ideas, tracks progress, and adapts to user feedback and performance.

## Core Principles

The development of GymGenie is guided by two main principles:

1.  **Workout-First**: The primary user experience is centered around the workout. All features are designed to support, enhance, or lead to a workout session with minimal friction. The "time to workout" should always be as short as possible.
2.  **Minimalist & Action-Oriented UI**: The interface is clean, decluttered, and focuses on actionable elements. We avoid information overload and prioritize clarity. Every screen should have a clear purpose and guide the user to the next logical action.

## Core UX Rules & Invariants

To maintain a consistent and intuitive user experience, the following rules are enforced across the application:

*   **Live Session Focus**: During a live workout session (`LiveWorkoutSession`), all navigation elements (header, bottom nav) are hidden to create a "focus mode" and prevent accidental navigation.
*   **Consistent Layout**: Features like Progress, Profile, and Kitchen share a consistent layout structure: a header with a title and optional actions, followed by a container for the main content. This creates a predictable user experience.
*   **Sequential Progress**: The app enforces a linear progression through workout days. Users can only perform the workout scheduled for the current day. They cannot skip ahead or perform workouts from past days that were missed. Future days are disabled in the calendar/plan view.
*   **Mandatory Empty and Error States**: Every component that fetches or displays data must have well-defined states for loading, empty data, and error conditions. This prevents user confusion and provides clear feedback.
*   **Responsive by Design**: The application must be fully functional and usable across all target devices, from mobile phones to desktops. This is primarily handled by the [`ResponsiveNavigation`](../../components/ResponsiveNavigation.tsx:1) component and responsive utility classes.
