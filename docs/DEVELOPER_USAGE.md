# GymGenie Developer Usage Guide

Welcome to the official **GymGenie** development guide. This document serves as the **single source of truth**, providing all the necessary information for you to understand, install, and contribute to the project effectively.

---

## 1. Project Overview

### Project Name
**GymGenie**

## Documentation Structure

The documentation is split into multiple files for clarity and easy navigation. It is recommended to read them in the following order:

1.  [**01-Overview.md**](./developer-usage/01-overview.md): Understand the app's purpose, core principles, and UX philosophy.
2.  [**02-Quickstart.md**](./developer-usage/02-quickstart.md): Instructions for setup, running, and testing the project.
3.  [**03-Architecture.md**](./developer-usage/03-architecture.md): A high-level look at the technical architecture, including the feature-based structure, service layer, and state management.
4.  [**04-Folder-Structure.md**](./developer-usage/04-folder-structure.md): A map of the codebase to help you find what you're looking for.
5.  [**05-Navigation-And-Layout.md**](./developer-usage/05-navigation-layout.md): Explains the responsive navigation system and layout principles.
6.  [**06-Data-Flow-And-Models.md**](./developer-usage/06-data-flow-models.md): Details on data models, schemas, and the primary data flows within the app.
7.  [**07-Features.md**](./developer-usage/07-features.md): A breakdown of each core feature.
8.  [**08-Common-Tasks.md**](./developer-usage/08-common-tasks.md): A cookbook of recipes for common development tasks.
9.  [**09-UI-UX-Guidelines.md**](./developer-usage/09-ui-ux-guidelines.md): Rules and best practices for building the user interface.
10. [**10-Glossary.md**](./developer-usage/10-glossary.md): Definitions of key terms used in the project.
11. [**11-Testing.md**](./developer-usage/11-testing.md): Our approach to testing and quality assurance.
12. [**12-Contributing.md**](./developer-usage/12-contributing.md): Guidelines for contributing to the project.

### Core Objective
GymGenie is a personalized fitness application that leverages the power of AI (Gemini) to create and track custom workout plans. The project focuses on a **"Workout-First"** experience—eliminating friction so users can focus on training—combined with a minimalist design, high performance, and offline capabilities.

### Target Audience
Gym enthusiasts ranging from beginners to advanced users who want an intelligent, flexible workout tracking tool that doesn't rely on constant internet connectivity.

### Tech Stack
*   **Frontend Library**: [React](https://react.dev/) (v19)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **State Management**:
    *   [Redux Toolkit](https://redux-toolkit.js.org/) (Global State)
    *   React Context (Local/UI State)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **AI Integration**: Google Gemini API via `@google/genai`
*   **Testing**: [Vitest](https://vitest.dev/) & React Testing Library
*   **Validation**: [Zod](https://zod.dev/)
*   **Performance**: React Virtualized / React Window for large lists.

---

## 2. Core Philosophy & Principles

We strictly adhere to the following principles to ensure the project remains sustainable and maintainable:

1.  **Modularity**:
    *   The codebase is organized using a **Feature-based architecture**. Everything related to a specific feature (e.g., `workout`, `session`, `user`) resides in a single directory. Code logic is not scattered across the project.

2.  **Clarity over Cleverness**:
    *   Write code for humans to read. Prioritize clarity and explicitness over "clever" but obscure solutions. Readable code is maintainable code.

3.  **Strong Typing**:
    *   TypeScript is not a suggestion; it's the law. Use `strict: true`.
    *   All external data (API, LocalStorage) **must** be validated with **Zod** before entering the application.

4.  **Test Everything**:
    *   No feature is considered complete without Unit Tests or Integration Tests. High test coverage allows for confident refactoring.

5.  **Workout-First & Minimalist UX**:
    *   The interface must serve the person working out (sweaty hands, moving around). Buttons must be large, and interactions must require minimal steps. Minimalize everything unnecessary.

---

## 3. System Architecture

### Data Flow Diagram

Data flow in GymGenie follows the **Unidirectional Data Flow** model:

```mermaid
graph LR
    User((User)) -->|Interacts| UI[UI Component]
    UI -->|Dispatches| Action[Redux Action / Thunk]
    Action -->|Calls| Service[Service Layer (API/AI)]
    Service -->|Returns Data| Action
    Action -->|Updates| Reducer[Redux Reducer]
    Reducer -->|Updates| Store[Global Store]
    Store -->|Selects| UI
```

1.  **UI Component**: Receives user interaction, dispatches an action.
2.  **Redux Thunk**: Handles asynchronous logic, calls the Service Layer.
3.  **Service Layer**: Executes API calls (Gemini), performs complex business logic. Completely independent of the UI.
4.  **Redux Reducer**: Updates State immutably.
5.  **UI Component**: Automatically re-renders when State changes (via `useAppSelector`).

### State Management
*   **Global State (Redux Toolkit)**: Used for data shared across multiple features (User info, Workout History, Active Session).
    *   Divided into `slices` located within each feature (e.g., `src/features/workout/store/workoutSlice.ts`).
*   **Local State (React State/Context)**: Used for local UI state (Form inputs, Modal open/close, Theme).

### Service Layer & Dependency Injection
*   All business logic (API calls, calculations) resides in `src/services/`.
*   We use a simple **Dependency Injection (DI)** pattern via `ServiceContainer`.
*   **Benefit**: Easy to mock services when writing tests, separates logic from UI.

### Component Structure
*   **`src/components/`**: Contains "atomic", globally reusable components (Button, Input, Modal wrapper). Does not contain feature-specific business logic.
*   **`src/features/<name>/components/`**: Contains components specific to that feature (WorkoutCard, ExerciseList). Can connect directly to Redux.

---

## 4. Project Directory Structure

```
/
├── components/          # Global reusable UI components (Buttons, Layouts)
│   ├── dashboard/       # Components specific to dashboard layout
│   └── ...
├── context/             # React Context Providers (AppContext, ThemeContext)
├── hooks/               # Custom React Hooks (useBreakpoint, useDebounce)
├── services/            # Business Logic & API calls
│   ├── container/       # DI Container Setup
│   ├── interfaces/      # Interfaces for Services
│   └── ...
├── store/               # Redux Store Configuration & Root Reducer
├── types/               # Global TypeScript Types & Zod Schemas
├── utils/               # Helper functions (date formatting, calculation)
├── src/
│   └── features/        # FEATURE-BASED MODULES (Core of the App)
│       ├── workout/     # Workout Feature
│       │   ├── components/  # Workout-specific UI
│       │   ├── services/    # Workout-specific Logic (WorkoutGenerator)
│       │   └── store/       # Workout Redux Slice
│       ├── session/     # Active Session Management
│       ├── user/        # User Profile & Auth
│       └── ...
└── test/                # Test configurations & Global tests
```

### Key Directories Explained:

*   **`src/features/`**: This is where the main code lives. Each subdirectory is a business domain.
    *   Example: `src/features/workout/` contains everything related to creating and managing workouts.
*   **`components/`**: "Dumb" UI components. They only receive props and render.
    *   Naming convention: `PascalCase.tsx` (e.g., `PrimaryButton.tsx`).
*   **`services/`**: The "brain" of the application.
    *   Example: `services/enhanced-gemini-service.ts` handles communication with AI.
*   **`types/`**: Definitions of Interfaces and Schemas.
    *   `types/schemas.ts`: Contains critical Zod Schemas.

---

## 5. Developer Workflows

### 1. Installation & Setup Guide

```bash
# 1. Clone repository
git clone https://github.com/your-repo/gymgenie-ai.git
cd gymgenie-ai

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Open .env file and enter your VITE_GEMINI_API_KEY

# 4. Run Development Server
npm run dev
```

### 2. Adding a New Feature
Suppose you want to add a "Leaderboard" feature:

1.  **Create Directory**: `mkdir src/features/leaderboard`
2.  **Sub-structure**: Create `components`, `services`, `store` folders inside.
3.  **Create Slice**: Create `leaderboardSlice.ts` and add it to `store/index.ts`.
4.  **Create Service**: If API calls are needed, create `LeaderboardService.ts` in the feature's service folder or global service if shared.
5.  **UI**: Create `LeaderboardPage.tsx` in `components` and export it.

### 3. Creating a Reusable UI Component
*   **When?**: When the component contains no business logic and can be used in at least 2 different features.
*   **Where?**: `src/components/ui/` (for example).
*   **Example**: You need a button with a special ripple effect. Create `src/components/ui/RippleButton.tsx`.

### 4. Working with API/AI Service
*   Do not call `fetch` directly in a Component.
*   Inject the Service or use a Thunk.
*   **Standard Pattern**:
    ```typescript
    // In Component
    const handleGenerate = async () => {
      try {
        dispatch(setLoading(true));
        // Call thunk or service
        await dispatch(generateWorkoutThunk(userPreferences));
      } catch (error) {
        // Handle UI error
      } finally {
        dispatch(setLoading(false));
      }
    };
    ```

### 5. Commit Workflow
*   We adhere to **Conventional Commits**:
    *   `feat: add leaderboard feature`
    *   `fix: resolve session conflict issue`
    *   `docs: update developer usage guide`
    *   `refactor: optimize workout calculation logic`
*   Keep commits atomic; each commit should do one thing only.

---

## 6. Coding Conventions & Best Practices

### Styling (Tailwind CSS)
*   Use **Utility-first**: Write classes directly in JSX.
    *   ✅ `className="bg-blue-500 text-white p-4 rounded"`
    *   ❌ Do not create separate `.css` files for components unless the animation is very complex.
*   Do not overuse `@apply` in CSS files.

### Type Safety (TypeScript + Zod)
*   **Strict Mode**: Always on. Do not use `any`. If the type is unknown, use `unknown` and narrow it.
*   **Zod Validation**: When receiving data from an API:
    ```typescript
    const response = await api.get('/data');
    const result = UserSchema.parse(response.data); // Will throw error if format is incorrect
    ```

### Component Design
*   Prioritize **Functional Components** and **Hooks**.
*   Use `React.memo` for components that render frequently (like items in a long list).
*   Break down components: A component should not exceed 300 lines of code.

### State Management Rules
*   Only put state in Redux if it needs to be accessed in multiple places.
*   Always use `useAppSelector` and `useAppDispatch` (typed versions) instead of the original `useSelector`.

---

## 7. UI/UX & Design System

Based on `tailwind.config.js` and `ui-ux-guidelines.md`:

### Colors
*   **Brand Primary**: `blue-600` (`#2563eb`) - Used for main buttons, primary actions.
*   **Brand Secondary**: `blue-500` (`#3b82f6`) - Lighter highlight.
*   **Background**: Typically `gray-50` or `white`.
*   **Text**: `gray-900` (primary), `gray-600` (secondary).

### Typography
*   Responsive font size system defined via CSS variables (e.g., `text-responsive-base`).
*   Default Font Family: Sans-serif (system).

### Spacing & Layout
*   Use Tailwind's 4px grid system:
    *   `p-1` = 4px, `p-4` = 16px.
*   **Mobile-first**: Always code for mobile first, then add breakpoints `md:`, `lg:`.
    *   Mobile: `< 768px`
    *   Tablet: `768px`
    *   Desktop: `1024px`

### Icons
*   Library: `lucide-react`.
*   Convention: Import specific icons directly. Example: `import { Dumbbell, Calendar } from 'lucide-react';`

---

## 8. Glossary

| Term | Definition in GymGenie Context |
| :--- | :--- |
| **AI** | Google Gemini service integrated via `enhanced-gemini-service`. |
| **Feature** | A high-level directory in `src/features`, containing the complete logic of a business function (Workout, Nutrition...). |
| **Slice** | A part of the Redux State, managing data for a specific Feature. |
| **Service Container** | Where Service instances (Singleton) are registered and managed, serving Dependency Injection. |
| **Workout-First** | Design philosophy prioritizing the workout screen, minimizing taps required to start training. |
| **Virtualization** | Technique for rendering long lists (workout history) by only rendering elements currently visible on screen to optimize performance. |

---

*This document was last updated in May 2024. If you find outdated information, please create a Pull Request to update it!*
