# 👨‍💻 Development and Contribution Guide

Welcome to the GymGenie development team! This guide provides all the information you need to understand the project structure, coding conventions, and contribution workflow.

## 📜 Table of Contents

- [👨‍💻 Development and Contribution Guide](#-development-and-contribution-guide)
  - [📜 Table of Contents](#-table-of-contents)
  - [🌟 Project Philosophy](#-project-philosophy)
  - [📂 Project Structure](#-project-structure)
    - [Key Directories Explained](#key-directories-explained)
  - [🧩 Core Concepts](#-core-concepts)
    - [State Management](#state-management)
    - [Service Layer](#service-layer)
    - [Type Safety](#type-safety)
    - [Performance Optimization](#performance-optimization)
  - [🎨 Coding Conventions](#-coding-conventions)
  - [🚀 Contribution Workflow](#-contribution-workflow)
  - [⚙️ Implementation Design](#️-implementation-design)
    - [Data Flow](#data-flow)
    - [Session Management](#session-management)
  - [🤸 User-Facing Features](#-user-facing-features)

---

## 🌟 Project Philosophy

Our goal is to build a high-quality, maintainable, and performant application. We adhere to the following principles:

- **Modularity**: Code is organized into features and reusable components.
- **Clarity over cleverness**: Write code that is easy to understand and maintain.
- **Strong Typing**: Leverage TypeScript to its full potential to catch errors early.
- **Test Everything**: All new features and bug fixes must be accompanied by tests.

---

## 📂 Project Structure

The project follows a feature-based structure which is scalable and easy to navigate.

```
/
├── .vscode/          # VSCode settings
├── components/       # Global, reusable React components
│   ├── dashboard/    # Components specific to the dashboard layout
│   └── ...
├── context/          # React Context providers (e.g., AppContext)
├── docs/             # Project documentation (like this file)
├── hooks/            # Custom reusable React hooks
├── public/           # Static assets
├── services/         # Core business logic and API interactions
│   ├── container/    # Dependency injection container
│   ├── interfaces/   # Service interface definitions
│   └── __tests__/    # Tests for services
├── src/
│   ├── features/     # Feature-based modules
│   │   ├── session/  # Everything related to workout sessions
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── store/ (Redux slice)
│   │   ├── user/     # User-related logic
│   │   └── workout/  # Workout creation and history
│   └── ...
├── store/            # Redux store setup and global providers
├── test/             # Test setup, mocks, and integration tests
├── types/            # Global TypeScript type definitions and schemas
└── utils/            # General utility functions
```

### Key Directories Explained

- **`components/`**: Contains UI components that are shared across multiple features, such as `ResponsiveNavigation` or custom buttons. Components specific to a single feature should live within that feature's `components` directory.
- **`services/`**: This is the heart of the business logic. It handles API calls (e.g., `geminiService.ts`), data persistence (`SessionPersistenceManager.ts`), and other core functionalities that are independent of the UI.
- **`src/features/`**: The application is broken down into "features" or "domains" (e.g., `workout`, `session`). Each feature directory is a self-contained module with its own components, services, and state management logic (Redux slice).
- **`store/`**: Contains the main Redux store configuration, root reducer, and middleware. Feature-specific state is managed within each feature's `store` directory and combined here.
- **`types/`**: Houses all shared TypeScript types, interfaces, and Zod schemas (`schemas.ts`) for API validation.
- **`hooks/`**: For custom React hooks that can be reused across the application, like `useBreakpoint` for responsive design.

---

## 🧩 Core Concepts

### State Management

We use a hybrid approach:
1.  **Redux Toolkit**: For complex, global state that is shared across many components (e.g., user authentication, workout data). Each feature has its own slice to keep the state management modular.
2.  **React Context**: For simpler, more localized state that doesn't change as often, such as theme settings or managing layout state (`AppContext.tsx`).

### Service Layer

The service layer abstracts away the complexities of data fetching, caching, and business logic from the UI components. We use a **Dependency Injection (DI)** pattern (see `services/container/`) to manage service instances, making them easy to mock in tests and manage dependencies.

### Type Safety

We enforce strict type safety using TypeScript and **Zod** (`types/schemas.ts`).
- **TypeScript**: Used for all application code.
- **Zod**: Used to define schemas for validating API responses and other external data sources, ensuring data integrity from the edge.

### Performance Optimization

Performance is critical. We use several techniques:
- **`React.memo`**: For wrapping components to prevent unnecessary re-renders.
- **`useCallback` and `useMemo`**: To memoize functions and values.
- **Virtualization**: For rendering long lists of items (e.g., `VirtualizedWorkoutHistory.tsx`) to keep the DOM light and responsive.
- **Code Splitting**: Vite handles this automatically, but we structure our features to support it.

---

## 🎨 Coding Conventions

- **File Naming**: Use `PascalCase` for React components (`MyComponent.tsx`) and `kebab-case` for other files (`my-utility.ts`).
- **Component Style**: Prefer functional components with hooks.
- **Styling**: Use Tailwind CSS utility classes directly in the JSX. Avoid creating separate CSS files unless absolutely necessary.
- **Imports**: Organize imports into groups: external libraries, internal absolute paths (`@/services`), and relative paths.
- **ESLint & Prettier**: The project is configured with ESLint and Prettier to enforce a consistent code style. Make sure to run `npm run lint` before committing.

---

## 🚀 Contribution Workflow

1.  **Create a Branch**: Create a new branch from `main` for your feature or bugfix (e.g., `feature/add-new-chart` or `fix/login-bug`).
2.  **Develop**: Write your code, following the conventions outlined above.
3.  **Write Tests**: Add unit or integration tests for your changes in the appropriate `test/` or `__tests__/` directory.
4.  **Run Checks**: Ensure all tests and lint checks pass:
    ```bash
    npm run test
    npm run lint
    ```
5.  **Submit a Pull Request**: Push your branch to the repository and open a Pull Request against the `main` branch. Provide a clear description of the changes you've made.
6.  **Code Review**: A team member will review your code, and once approved, it will be merged.

---

## ⚙️ Implementation Design

This section provides a high-level overview of how different parts of the application interact.

### Data Flow

1.  **UI Components**: A user interacts with a React component (e.g., clicks a "Save Set" button).
2.  **Redux Action**: The component dispatches a Redux action (e.g., `sessionSlice.actions.addSet(...)`).
3.  **Redux Reducer**: The corresponding reducer in the feature's slice handles the action, updating the state immutably.
4.  **Component Re-render**: Components subscribed to this part of the state re-render with the new data.
5.  **Side Effects (Thunks)**: For asynchronous operations (like API calls), the component dispatches a thunk action.
   - The thunk action calls a method from the **Service Layer** (e.g., `workoutService.saveWorkout(...)`).
   - The service handles the API call, data transformation, and validation.
   - Upon completion, the thunk dispatches further actions (e.g., `.../fulfilled` or `.../rejected`) to update the state with the result.

### Session Management

- **`sessionStateManager.ts`**: A key service that orchestrates the lifecycle of a workout session.
- **`SessionPersistenceManager.ts`**: Responsible for saving the current session state to `localStorage` or another storage medium. This allows the user to resume their session even if they close the browser.
- **Conflict Resolution**: The system includes logic (`SessionConflictDetector.ts`, `SessionConflictModal.tsx`) to handle cases where session data might be out of sync (e.g., if the user has the app open in two tabs).

---

## 🤸 User-Facing Features

This is a summary of the core functionalities available to the end-user. Understanding these features will provide context for development tasks.

- **Workout Dashboard (`WorkoutDashboard.tsx`)**:
 - The main screen for the user.
 - Displays current workout progress, weekly calendar, and quick-access buttons.

- **Exercise Management**:
 - Users can view a list of exercises (`VirtualizedExerciseList.tsx`).
 - They can see details for each exercise in a modal (`ExerciseDetailModal.tsx`).
 - During a workout, they can log sets, reps, and weight for each exercise.

- **Live Session Tracking**:
 - When a workout is active, the user can see their progress in real-time.
 - A rest timer (`RestTimer.tsx`) is available between sets.
 - Completion stats (`CompletionStats.tsx`) are shown at the end of the workout.

- **Workout History (`WorkoutHistory.tsx`, `VirtualizedWorkoutHistory.tsx`)**:
 - Users can view a log of their past workouts.
 - The history is presented in a calendar view (`WeeklyProgressCalendar.tsx`) and a list view, optimized for performance with virtualization.

- **AI-Powered Nutrition Advice (`NutritionGenie.tsx`)**:
 - A feature that likely uses the `geminiService` to provide nutrition-related suggestions to the user.

- **Onboarding (`Onboarding.tsx`)**:
 - A guided setup process for new users to configure their initial settings and preferences.