# 3. Architecture

This document provides a high-level overview of GymGenie's technical architecture.

## Core Concepts

*   **React & TypeScript**: The foundation of our application, providing a robust component model and static typing for safety and maintainability.
*   **Redux Toolkit**: For predictable and centralized state management. We use slices to co-locate logic related to specific features.
*   **Tailwind CSS**: A utility-first CSS framework that allows for rapid and consistent UI development.
*   **Vite**: Our build tool, providing a fast development experience with Hot Module Replacement (HMR).

## Architectural Patterns

### Feature-Based Structure

The codebase is organized by features (e.g., `workout`, `profile`, `session`). This is a "feature-based" or "module-based" architecture.

*   **Location**: [`src/features/`](../../src/features)
*   **Principle**: Each feature folder is a self-contained unit, containing its own components, services, state management (slice), and types.
*   **Benefit**: This makes it easy to find and work on all the code related to a specific part of the application, improving scalability and maintainability. When you work on the "Workout Dashboard", you'll spend most of your time in `src/features/workout/`.

### Service Layer & Dependency Injection (DI)

To decouple business logic from the UI and promote reusability, we use a service layer.

*   **Location**: [`src/services/`](../../services)
*   **Principle**: Services encapsulate a specific piece of functionality (e.g., talking to an API, managing persistence, handling session logic). They are plain TypeScript classes.
*   **Dependency Injection**: We use a simple DI container (`ServiceContainer`) to manage instances of our services. This makes dependencies explicit and testing easier. Services are registered at application startup and can be injected into other services or used in Redux thunks.
    *   See: [`services/container/ServiceContainer.ts`](../../services/container/ServiceContainer.ts:1) and [`services/container/serviceRegistration.ts`](../../services/container/serviceRegistration.ts:1)

### State Management with Redux Toolkit

We use Redux Toolkit for its efficiency and boilerplate reduction.

*   **Slices**: Each feature typically has its own "slice" of the Redux state, which includes its reducers and actions. (e.g., [`src/features/workout/store/workoutSlice.ts`](../../src/features/workout/store/workoutSlice.ts:1)).
*   **Thunks**: For asynchronous logic, like fetching data or interacting with services, we use thunks. Thunks can access the DI container to use services.
*   **Selectors**: We use selectors to read data from the store, often with `reselect` for memoization to prevent unnecessary re-renders.

### Validation with Zod

To ensure data integrity, especially for data coming from APIs or local storage, we use [Zod](https://zod.dev/).

*   **Location**: Schemas are often defined in [`types/schemas.ts`](../../types/schemas.ts:1) or within a feature's `types.ts` file.
*   **Usage**: We parse incoming data against a Zod schema. If the data doesn't match the expected shape, Zod throws a detailed error, which we can catch and handle gracefully. This prevents malformed data from entering our application state.
    *   See: [`services/api-validation.ts`](../../services/api-validation.ts:1)
