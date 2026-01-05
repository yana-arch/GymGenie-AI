# GymGenie AI - Project Documentation Index

## Project Overview

### Project Type
- **Type:** Mobile Application (React + Capacitor)
- **Architecture:** Monolithic with Feature-Driven Design
- **Primary Language:** TypeScript
- **Platform:** Cross-platform (Web + Android)

### Technology Stack Summary
- **Frontend:** React 19.2.3, TypeScript 5.8.2
- **State Management:** Redux Toolkit 2.11.2, Redux Persist 6.0.0
- **Mobile Runtime:** Capacitor 8.0.0
- **AI Integration:** Google Gemini AI SDK 1.34.0
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS 4.1.18

## Quick Reference

### Architecture Overview
- **Pattern:** Feature-Driven Architecture with Service Layer
- **State:** Redux for global state, Context for component state
- **Data:** IndexedDB for exercises, LocalStorage for preferences
- **Mobile:** Capacitor bridges web app to native Android

### Development Setup
- **Entry Point:** `src/main.tsx`
- **Development Server:** `npm run dev` (port 3000)
- **Build:** `npm run build` → `dist/` directory
- **Android APK:** `npx cap sync && npx cap open android`

### Key Features
- AI-powered workout planning and nutrition guidance
- Live workout session tracking with real-time analytics
- Equipment identification via AI image recognition
- Offline-first architecture with local data persistence

## Generated Documentation

### Technology & Architecture
- [Technology Stack](./technology-stack-main.md) - Complete tech stack analysis with justifications
- [Architecture Documentation](./planning-artifacts/architecture.md) - System design and component overview
- [System-Level Test Design](./test-design-system.md) - Testability assessment and testing strategy
- [API Contracts](./api-contracts-main.md) _(To be generated)_ - API endpoints and data contracts
- [Data Models](./data-models-main.md) _(To be generated)_ - Database schema and entity relationships

### Development & Deployment
- [Development Guide](./development-guide-main.md) _(To be generated)_ - Setup, build, and development workflow
- [Deployment Guide](./deployment-guide.md) _(To be generated)_ - Production deployment and CI/CD
- [Component Inventory](./component-inventory-main.md) _(To be generated)_ - UI components and design system
- [Testing Strategy](./testing-guide-main.md) _(To be generated)_ - Test structure and quality assurance

### Project Structure
- [Source Tree Analysis](./source-tree-analysis.md) _(To be generated)_ - Directory structure with annotations
- [Integration Architecture](./integration-architecture.md) _(To be generated)_ - Cross-part communication (N/A for monolithic)

## Existing Documentation

### Comprehensive Project Guides
- [README.md](../README.md) - Project overview, features, and quick start guide
- [Developer Usage Guide](../docs/DEVELOPER_USAGE.md) - Detailed development information
- [Development Usage Guide](../docs/DEVELOPMENT_USAGE.md) - Development workflow and guidelines
- [Implementation Summary](../docs/IMPLEMENTATION_SUMMARY.md) - Implementation details and architecture
- [Maintenance Guide](../docs/MAINTENANCE_GUIDE.md) - Maintenance procedures and best practices

### Detailed Feature Documentation
- [Final Documentation](../docs/FINAL_DOCUMENTATION.md) - Complete project documentation
- [Completion Summary](../docs/COMPLETION_SUMMARY.md) - Project completion status

### Developer Usage Sections
- [01 Overview](../docs/developer-usage/01-overview.md) - Project overview and goals
- [02 Quickstart](../docs/developer-usage/02-quickstart.md) - Getting started guide
- [03 Architecture](../docs/developer-usage/03-architecture.md) - System architecture
- [04 Folder Structure](../docs/developer-usage/04-folder-structure.md) - Directory organization
- [05 Navigation Layout](../docs/developer-usage/05-navigation-layout.md) - UI navigation structure
- [06 Data Flow Models](../docs/developer-usage/06-data-flow-models.md) - Data flow and state management
- [07 Features](../docs/developer-usage/07-features.md) - Feature overview and implementation
- [08 Common Tasks](../docs/developer-usage/08-common-tasks.md) - Development task patterns
- [09 UI/UX Guidelines](../docs/developer-usage/09-ui-ux-guidelines.md) - Design and user experience
- [10 Glossary](../docs/developer-usage/10-glossary.md) - Terminology and definitions
- [11 Testing](../docs/developer-usage/11-testing.md) - Testing strategy and procedures
- [12 Contributing](../docs/developer-usage/12-contributing.md) - Contribution guidelines

## Development Workflow

### Getting Started
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: `npm install`
3. **Configure Environment**: Copy `.env.example` to `.env` and add Gemini API key
4. **Start Development**: `npm run dev`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run test` - Run test suite
- `npm run test:ui` - Run tests with UI
- `npm run preview` - Preview production build
- `npx cap sync` - Sync web assets to mobile platforms
- `npx cap open android` - Open Android Studio for mobile development

### Key Directories
```
src/
├── features/          # Feature-driven architecture
│   ├── workout/       # Workout management features
│   ├── nutrition/     # Nutrition and diet features
│   ├── profile/       # User profile management
│   ├── onboarding/    # User onboarding flow
│   └── session/       # Live workout sessions
├── services/          # Business logic and AI integration
├── store/            # Redux state management
├── components/       # Shared UI components
└── types/            # TypeScript type definitions

android/              # Android platform files (Capacitor)
docs/                 # Project documentation
test/                 # Test files and configurations
```

## Brownfield Development Guide

### For PRD Creation
When creating Product Requirements Documents for new features:

1. **Reference Existing Architecture**: Use [Technology Stack](./technology-stack-main.md) and existing docs
2. **Follow Feature Patterns**: Study existing features in `src/features/` for implementation patterns
3. **AI Integration**: Leverage Google Gemini AI for intelligent features
4. **State Management**: Use Redux Toolkit for global state, Context for local state

### Key Integration Points
- **AI Services**: `src/services/ai/GeminiService.ts` for AI-powered features
- **Data Persistence**: IndexedDB via service layer for exercise data
- **State Management**: Redux slices in `src/features/*/store/`
- **UI Components**: Shared components in `src/components/ui/`

### Mobile Considerations
- **Capacitor APIs**: Available through Capacitor plugins
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance**: Virtual scrolling for large lists, optimized bundles

---

**Documentation Generated:** January 5, 2026
**Project Version:** Based on current codebase analysis
**Scan Level:** Quick scan (pattern-based, no source file reading)
