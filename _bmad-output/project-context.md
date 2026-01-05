---
project_name: 'GymGenie-AI'
user_name: 'Wavister'
date: '2026-01-05'
sections_completed: ['technology_stack']
existing_patterns_found: 8
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core Framework
- **React**: 19.2.3 (latest major version with concurrent features)
- **TypeScript**: ~5.8.2 (strict type checking required)
- **Build Tool**: Vite 6.2.0 (fast development and optimized production builds)

### State Management
- **Redux Toolkit**: ^2.11.2 (modern Redux with RTK Query)
- **Redux Persist**: ^6.0.0 (offline state persistence)
- **React Redux**: ^9.2.0 (React bindings)

### UI & Styling
- **Tailwind CSS**: ^4.1.18 (utility-first CSS framework)
- **Lucide React**: ^0.562.0 (icon library)
- **Recharts**: ^3.6.0 (data visualization)

### Mobile & Native
- **Capacitor**: 8.0.0 (cross-platform mobile deployment)
- **Capacitor Android**: ^8.0.0
- **Capacitor CLI**: ^8.0.0

### AI & ML
- **Google Generative AI**: ^1.34.0 (@google/genai)
- **TensorFlow.js**: Required for computer vision (to be added)
- **MediaPipe**: For pose estimation (to be added)

### Data & Validation
- **Zod**: ^4.2.1 (runtime type validation)
- **UUID**: ^13.0.0 (unique identifier generation)

### Development & Quality
- **Vitest**: ^4.0.16 (testing framework)
- **Testing Library**: React & Jest DOM for component testing
- **ESLint**: ^9.39.2 (code linting)
- **TypeScript ESLint**: ^8.51.0 (TypeScript-specific rules)
- **Knip**: ^5.79.0 (unused dependency detection)
- **Dependency Cruiser**: ^17.3.5 (dependency analysis)
- **JSCPD**: ^4.0.5 (duplicate code detection)

### Performance & Virtualization
- **React Virtualized**: ^9.22.6 (large list performance)
- **React Window**: ^2.2.3 (virtual scrolling)
- **React Window Infinite Loader**: ^2.0.0 (infinite loading)

## Critical Implementation Rules

### TypeScript Configuration
- **Strict Mode Required**: All TypeScript files must use strict mode
- **No Any Types**: Never use `any` type - use proper type definitions
- **Interface vs Type**: Use `interface` for object shapes, `type` for unions/aliases
- **Optional Properties**: Use `?:` for optional properties, not union with undefined
- **Generic Constraints**: Use proper generic constraints to ensure type safety

### React Patterns
- **Functional Components Only**: No class components allowed
- **Custom Hooks**: Extract reusable logic into custom hooks in `/hooks` directory
- **Component Naming**: PascalCase for component files (UserCard.tsx)
- **Props Interface**: Define props interfaces above component declarations
- **Error Boundaries**: Implement error boundaries for critical user paths

### State Management (Redux Toolkit)
- **Slice Organization**: Each feature gets its own slice in `/store` directory
- **Action Naming**: Command-based actions (loginUser, startWorkout, completeExercise)
- **Selector Naming**: camelCase selectors (useUser, selectWorkoutStatus)
- **Async Thunks**: Use createAsyncThunk for API calls
- **Immutable Updates**: Always use immer for state mutations

### API Communication
- **Response Format**: Envelope structure `{"data": {...}, "meta": {...}}`
- **Error Format**: Consistent error structure with type and message
- **Loading States**: Implement proper loading/error/success states
- **Caching**: Use appropriate caching strategies for offline capability

### Testing Requirements
- **Test Colocation**: Tests live next to implementation files
- **Coverage**: Aim for 80%+ coverage on critical paths
- **Mock Strategy**: Mock external dependencies, test integration points
- **Component Testing**: Use Testing Library for user-centric tests

### File Organization
- **Type-based Structure**: `components/`, `services/`, `store/`, `types/` by feature area
- **Index Files**: Export from index.ts files for clean imports
- **Utility Functions**: Place in `/utils` with descriptive names
- **Constants**: Group related constants in dedicated files

### Performance Patterns
- **Code Splitting**: Use dynamic imports for large components
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Virtualization**: Use react-window for large lists
- **Bundle Analysis**: Regularly check bundle sizes with build tools

### Security Considerations
- **Input Validation**: Validate all user inputs with Zod schemas
- **API Security**: Implement proper authentication and authorization
- **Data Encryption**: Encrypt sensitive data at rest and in transit
- **Privacy First**: Local processing of health data whenever possible

### Code Quality Standards
- **Linting**: All code must pass ESLint rules
- **Formatting**: Consistent formatting across all files
- **Documentation**: Document complex logic and public APIs
- **Dependency Management**: Keep dependencies updated and secure
