# 4. Folder Structure

This document provides a map of the GymGenie codebase. Understanding the folder structure is key to finding your way around the project and knowing where to add new code.

## "If I want to change X, where do I look?"

*   **Change the main app layout or navigation?**
    *   [`components/ResponsiveNavigation.tsx`](../../components/ResponsiveNavigation.tsx) (The core component that switches between desktop header and mobile bottom nav).
    *   [`components/dashboard/`](../../components/dashboard) (The header and nav components themselves).
    *   [`context/AppContext.tsx`](../../context/AppContext.tsx) (Manages the `activeView`).

*   **Add a new screen/feature?**
    *   Create a new folder inside [`src/features/`](../../src/features). For example, `src/features/new-feature/`.
    *   Inside, you'll add `components/`, `services/`, and `store/` sub-directories as needed.

*   **Change the Workout Dashboard?**
    *   [`src/features/workout/components/WorkoutDashboard.tsx`](../../src/features/workout/components/WorkoutDashboard.tsx).
    *   Child components like [`ProgramOverview`](../../src/features/workout/components/ProgramOverview.tsx) and [`NextWorkout`](../../src/features/workout/components/NextWorkout.tsx) are in the same directory.

*   **Modify the state for user profile?**
    *   [`src/features/user/store/userSlice.ts`](../../src/features/user/store/userSlice.ts). (Note: user profile data is in `userSlice`, while UI components are in `src/features/profile`).

*   **Change how workout data is saved to the device?**
    *   [`services/storageService.ts`](../../services/storageService.ts).

*   **Fix a bug in the Live Workout Session?**
    *   [`src/features/session/components/LiveWorkoutSession.tsx`](../../src/features/session/components/LiveWorkoutSession.tsx).
    *   State logic is in [`src/features/session/store/sessionSlice.ts`](../../src/features/session/store/sessionSlice.ts).
    *   Core logic is in services like [`sessionStateManager.ts`](../../src/features/session/services/sessionStateManager.ts).

*   **Add a new data type or schema?**
    *   Global types are in [`types/index.ts`](../../types/index.ts).
    *   Zod schemas are in [`types/schemas.ts`](../../types/schemas.ts).
    *   Feature-specific types can be inside the feature folder, e.g., `src/features/workout/types.ts`.

*   **Configure Tailwind CSS?**
    *   [`tailwind.config.js`](../../tailwind.config.js).

## Top-Level Directory Breakdown

```
/
├── .vscode/            # VSCode settings
├── components/         # Shared, global React components (e.g., navigation)
├── context/            # React Context providers (e.g., AppContext for navigation)
├── docs/               # Project documentation (you are here!)
├── hooks/              # Shared, global React hooks
├── public/             # Static assets (e.g., favicon)
├── services/           # Global services and DI container
├── src/
│   ├── features/       # Core application features (workout, session, profile, etc.)
│   │   ├── nutrition/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── session/
│   │   ├── ui/         # UI-specific state (e.g., modals, toasts)
│   │   ├── user/       # User profile data state
│   │   └── workout/
│   ├── App.tsx         # Main application component
│   ├── index.css       # Global CSS
│   ├── index.tsx       # Application entry point
├── store/              # Redux store setup and root reducer
├── test/               # Test files (unit, integration)
├── types/              # Global TypeScript types and Zod schemas
├── utils/              # Shared utility functions
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```
