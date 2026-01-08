---
project_name: 'GymGenie-AI'
user_name: 'Wavister'
date: '2026-01-08'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 28
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Framework
- **React**: 19.2.3
- **TypeScript**: ~5.8.2 (Strict mode enabled)
- **Build Tool**: Vite 6.2.0

### State & Data
- **Redux Toolkit**: 2.11.2 (with React Redux 9.2.0 & Redux Persist 6.0.0)
- **Zod**: 4.2.1 (Schema validation)

### UI & Styling
- **Mantine**: 8.3.11 (Core components and hooks)
- **Tailwind CSS**: 4.1.18 (Utility-first styling)
- **Lucide React**: 0.562.0 (Icons)

### AI & Mobile
- **Google Generative AI**: 1.34.0
- **TensorFlow.js**: 4.22.0 (Local pose detection)
- **Capacitor**: 8.0.0 (Android/Core/CLI)

### Quality & Testing
- **Vitest**: 4.0.16
- **Testing Library**: React 16.3.1
- **ESLint**: 9.39.2

---

## Critical Implementation Rules

### Language-Specific Rules

- **Strict TypeScript**: Always use explicit types; `noImplicitAny` is strictly enforced. Avoid `any` at all costs.
- **Path Aliases**: Use the `@/` prefix for all internal module imports (e.g., `import { User } from '@/types'`).
- **Standardized Error Handling**:
  - Use `createApiError` and `createNetworkError` for consistency.
  - Wrap async UI operations in `handleAsyncError`.
  - Use `useErrorHandler` for unified error UI responses.
- **Type Safety**: Prefer `interfaces` for object definitions and `type` for unions/aliases. Use `import type` when only metadata is needed.

### Framework-Specific Rules (React & Mantine)

- **Component Architecture**: 
  - Use arrow functions for all components.
  - Define a props interface immediately above every component.
  - Extract complex logic into custom hooks (e.g., `useWorkoutSession`).
- **State Management (Redux Toolkit)**:
  - Organize slices by feature (e.g., `features/workout/store/workoutSlice.ts`).
  - Use `createSelector` for all non-trivial state selection.
  - Always use `handleAsyncError` when creating `createAsyncThunk`.
- **UI & Performance**:
  - Use `react-window` for all large or infinite lists.
  - Apply Mantine's theme variables for styling instead of raw CSS/hex values.
  - Wrap expensive sub-trees in `React.memo` when props are stable but parent renders frequently.

### Testing Rules

- **Mandatory Tagging**: Every `it` or `test` block must include a priority tag: `@smoke`, `@p0`, `@p1`, `@p2`, or `@p3`.
- **Colocation**: Place `.test.ts(x)` files directly next to the code they test.
- **AI/ML Mocking**: Always mock `GeminiService` and TensorFlow operations to avoid network calls and heavy computation during tests.
- **Custom Renders**: Use `renderWithProviders` for component tests to ensure Redux and Mantine context are available.
- **Safety First**: Features involving injury detection or form correction require `@smoke` or `@p0` regression tests.

### Code Quality & Style Rules

- **Import Organization**: 
  1. External libraries (React, Redux, etc.)
  2. Internal imports with `@/` alias
  3. Relative imports (`./LocalComponent`)
- **Naming Conventions**:
  - **Components**: PascalCase (e.g., `LiveWorkoutSession.tsx`)
  - **Services**: PascalCase with `Service` suffix (e.g., `GeminiService.ts`)
  - **Utilities/Types**: camelCase (e.g., `stringUtils.ts`)
- **Styling**: Use Tailwind CSS utility classes. Support dark mode with the `dark:` prefix.
- **Cleanup**: Regularly run `npm run cleanup` to identify and remove unused code/dependencies.

### Development Workflow Rules

- **Pre-Commit Checks**: Always run `npm run lint` and `npm run test:critical` before committing changes.
- **Branch Strategy**: Use feature branches. Never commit directly to `main`.
- **PR Requirement**: Include test coverage for any new logic or AI-driven features.

### Critical Don't-Miss Rules (Anti-Patterns & Safety)

- **AI Privacy**: **NEVER** include PII (Personally Identifiable Information) or sensitive health data in prompts sent to `GeminiService`.
- **Safety Validation**: Any workout modification suggested by AI **MUST** be processed through the safety validation utility before being displayed to the user.
- **Battery & Performance**: Computer vision (pose detection) is expensive. Always provide a way to disable it and ensure it doesn't run in the background when the workout is paused.
- **Mocking**: Do not attempt to run real TensorFlow or Gemini operations in unit tests; use the provided mocks in `test/mocks/`.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-01-08
