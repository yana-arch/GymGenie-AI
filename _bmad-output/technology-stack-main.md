# Technology Stack - Main App

## Executive Summary

GymGenie AI is a modern React-based mobile application built with TypeScript, utilizing Capacitor for cross-platform mobile deployment. The application follows a feature-driven architecture with comprehensive state management and AI integration.

## Core Technologies

### Frontend Framework
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Framework | React | 19.2.3 | Latest React version with concurrent features and improved performance |
| Language | TypeScript | 5.8.2 | Type-safe development with enhanced IDE support and error prevention |
| Build Tool | Vite | 6.2.0 | Fast development server and optimized production builds |

### State Management
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Global State | Redux Toolkit | 2.11.2 | Predictable state management with RTK Query for server state |
| Persistence | Redux Persist | 6.0.0 | Automatic state synchronization across app restarts |
| Local State | React Context | Built-in | Component-specific state management for UI concerns |

### Mobile & Cross-Platform
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Mobile Runtime | Capacitor | 8.0.0 | Native mobile app deployment from web codebase |
| Android Support | Capacitor Android | 8.0.0 | Native Android APK generation and device APIs |

### AI Integration
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| AI SDK | Google Gemini AI | 1.34.0 | Advanced AI capabilities for workout planning and nutrition analysis |

### Data Management
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Client Storage | IndexedDB | Browser API | Large dataset storage for exercise database |
| Preferences | LocalStorage | Browser API | User settings and app configuration |
| Data Validation | Zod | 4.2.1 | Runtime type validation and schema enforcement |

### UI & Styling
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| CSS Framework | Tailwind CSS | 4.1.18 | Utility-first CSS with responsive design system |
| Icons | Lucide React | 0.562.0 | Consistent icon library with accessibility support |
| Charts | Recharts | 3.6.0 | React-based charting library for analytics |

### Development Tools
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Testing | Vitest | 4.0.16 | Fast unit testing with Jest-compatible API |
| Test Utils | React Testing Library | 16.3.1 | Component testing with user-centric approach |
| Linting | ESLint | 9.39.2 | Code quality and consistency enforcement |
| Type Checking | TypeScript Compiler | 5.8.2 | Static type analysis and compilation |

### Performance & Optimization
| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Virtual Scrolling | React Window | 1.8.10 | Efficient rendering of large lists |
| Bundle Analysis | Dependency Cruiser | 17.3.5 | Dependency analysis and bundle optimization |
| Code Quality | JSCPD | 4.0.5 | Duplicate code detection |

## Architecture Pattern

### Feature-Driven Architecture
The application follows a feature-driven architecture where each business domain (workout, nutrition, profile, etc.) is organized as a self-contained feature with its own:

- Components: UI elements specific to the feature
- Services: Business logic and API interactions
- Store: Redux slices for state management
- Types: TypeScript interfaces and schemas

### Service Layer Pattern
A centralized service layer handles:
- AI integration (GeminiService)
- Business logic (WorkoutGenerator, DietService)
- Data persistence (ExerciseCatalogService)
- Session management (SessionEvaluator)

### Mobile-First Design
- Responsive design optimized for mobile devices
- Capacitor enables native mobile app deployment
- Progressive Web App capabilities
- Offline-first architecture with local data storage

## Development Workflow

### Build Optimization
- Code splitting with manual chunks for vendor libraries
- Tree shaking for unused code elimination
- Asset optimization with hashed filenames
- CSS code splitting for better caching

### Quality Assurance
- TypeScript for compile-time type checking
- ESLint for code style consistency
- Vitest for comprehensive test coverage
- Dependency analysis to prevent bundle bloat

### Deployment Strategy
- Web deployment via Vite production build
- Android APK generation via Capacitor
- Cross-platform compatibility maintained
- Environment-specific configuration management
