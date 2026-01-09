# Story 6.1: Brand Identity & Theme Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a premium fitness brand feel and themed interface,
so that I feel motivated and engaged with the application.

## Acceptance Criteria

1. **Brand Identity Foundation**:
   - [x] Establish a consistent "Premium Fitness" brand identity across all application screens.
   - [x] Implement a custom brand color palette (brand-50 through brand-900) aligned with high-performance fitness aesthetics.
   - [x] Define and implement typography standards that convey energy and professionalism.

2. **Mantine System Integration**:
   - [x] Configure `MantineProvider` with a comprehensive custom theme object.
   - [x] Utilize Mantine's color scheme support for both light and dark modes (with a premium dark-first bias).
   - [x] Customize Mantine components (Button, Card, Tabs, etc.) to align with the brand identity.

3. **Visual Consistency**:
   - [x] Ensure consistent spacing, border-radii, and shadow patterns using Mantine/Tailwind variables.
   - [x] Implement a "Glassmorphism" or similar high-end visual style for dashboard elements.

4. **User Customization**:
   - [x] Provide basic theme customization options (e.g., primary color selection) for users.

## Tasks / Subtasks

- [x] **Theme Configuration & Brand Setup**
  - [x] Define the `brand` color palette in `src/theme/colors.ts`.
  - [x] Update `MantineProvider` in `App.tsx` (or `main.tsx`) with the custom theme.
  - [x] Set up Tailwind CSS 4 configuration to sync with Mantine theme variables.
- [x] **Global Component Styling**
  - [x] Create a `ThemeCustomizer` utility or component to manage user-selected colors.
  - [x] Apply brand-specific styles to common UI components (Buttons, Inputs, Cards).
- [x] **Layout & Navigation Polish**
  - [x] Update `MainLayout.tsx` to reflect the new brand identity.
  - [x] Refine navigation elements (Sidebars, Bottom Tabs) with premium micro-interactions.
- [x] **Testing & Validation**
  - [x] Verify color contrast ratios for accessibility (WCAG AA).
  - [x] Test theme switching consistency across major feature modules (Workout, Analytics, Settings).

## Dev Notes

- **Relevant Architecture Patterns**:
  - Use Mantine's `createTheme` for the primary configuration.
  - **Refinement**: Migrate the inline theme in `src/App.tsx` to a dedicated `src/theme/index.ts`.
  - **Synchronization**: Sync Mantine's `colorScheme` with the existing `ThemeProvider.tsx` which manages document-level `dark`/`light` classes for Tailwind CSS 4.
  - Leverage CSS variables for cross-compatibility between Mantine and Tailwind CSS 4.
  - Follow the "Emotional Design" principle from the architecture (feeling understood and supported).
- **Source Tree Components**:
  - `src/theme/` (New directory for theme configuration: `colors.ts`, `index.ts`, `components.ts`)
  - `src/App.tsx` (Update to use centralized theme and dynamic color scheme)
  - `src/components/ThemeProvider.tsx` (Consider integrating Mantine `useMantineColorScheme` for unified control)
  - `src/components/ui/` (Component overrides)
- **Testing Standards**:
  - `@p1`: Visual regression tests for core components.
  - `@p2`: Accessibility contrast checks for the new `brand` palette.

### Project Structure Notes

- Alignment with Mantine 8.x patterns.
- **Critical**: Ensure `src/App.tsx` `MantineProvider` is updated to remove the hardcoded `primaryColor: 'blue'`.
- Ensure the `brand` palette is accessible via both `theme.colors.brand` and Tailwind's `text-brand-500` classes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Styling-&-UI]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Previous Story Intelligence

- **Learnings from Story 5.5**:
  - Heavily utilized Mantine's `Tabs` and `Skeleton` for analytics; ensure these components are themed correctly in this story.
  - UI consistency in `ProgressDashboard.tsx` is a priority.
- **Patterns**:
  - Feature-based organization is working well; theme-related logic should be centralized but easily consumable by features.

## Git Intelligence Summary

- **Recent Work**:
  - Implementation of Epic 5 analytics features (Predictions, Trends, Milestones).
  - Transition to UI/UX refinement phase (`docs(planning): update epics with UI/UX refinement`).
- **Conventions**:
  - Commit style: `feat(feature): message`.
  - Type-safe implementations using Zod and strict TypeScript.

## Dev Agent Record

### Agent Model Used

opencode (gemini-2.0-flash-exp)

### AI Code Review Follow-up (Adversarial Review)

- **Issues Fixed**: 
  - 🔴 **CRITICAL**: Fixed `App.tsx` to use `defaultColorScheme="dark"` for premium dark-first bias.
  - 🟠 **HIGH**: Refactored `DashboardHeader` and `DashboardBottomNav` to use Mantine CSS variables (`var(--mantine-primary-color-filled)`) for dynamic color synchronization.
  - 🟠 **HIGH**: Fixed `any` type violation in `src/theme/index.ts` using `MantineTheme`.
  - 🟡 **MEDIUM**: Implemented Glassmorphism in `DashboardHeader.tsx` (backdrop-blur + opacity).
  - 🟡 **MEDIUM**: Removed hardcoded hex in `ThemeCustomizer.tsx`, importing from `colors.ts`.
  - 🟡 **MEDIUM**: Improved `theme.test.tsx` assertions to verify primary color mapping.
  - 🟢 **LOW**: Aligned active state styling across navigation components.
  - 💎 **PREMIUM**: Implemented "Atmospheric Vibe" architecture:
    - Cards now feature semi-transparent backgrounds with `backdrop-blur` and vibe-based tints.
    - Added high-performance hover animations (glow + scale) to all Card and Paper elements.
    - Integrated a dynamic radial gradient background that pulses with the chosen vibe color.
    - Synchronized all Tailwind `brand-` utility classes to follow the active Mantine theme.

### Debug Log References

- Initialized story 6.1 based on Epic 6 requirements.
- Resolved tech stack versions from `package.json` (Mantine 8, Tailwind 4).
- Extracted brand identity goals from PRD and Architecture documents.
- Created `src/theme` directory and centralized theme configuration.
- Implemented `ThemeCustomizer` for dynamic theme switching.
- Updated Navigation components with premium styling and micro-interactions.

### Implementation Plan

1. Define brand color palette in `src/theme/colors.ts`.
2. Centralize theme in `src/theme/index.ts`.
3. Update `App.tsx` to use dynamic theme managed by `AppContext`.
4. Create `ThemeCustomizer.tsx` for user color selection.
5. Update `DashboardHeader` and `DashboardBottomNav` for premium feel.

### Completion Notes List

- ✅ Brand identity established with premium "GymGenie" vibrant orange palette.
- ✅ Mantine 8.x theme fully integrated and synchronized with Tailwind CSS 4.
- ✅ Dynamic theme switching implemented via `ThemeCustomizer`.
- ✅ Navigation elements refined with bold typography and interactive states.
- ✅ Unit tests passing for theme configuration and dynamic updates.

### File List

- src/theme/colors.ts
- src/theme/index.ts
- src/theme/ThemeCustomizer.tsx
- src/theme/theme.test.tsx
- src/App.tsx
- src/index.css
- src/types.ts
- src/context/AppContext.tsx
- src/services/storage/StorageService.ts
- src/components/dashboard/DashboardHeader.tsx
- src/components/dashboard/DashboardBottomNav.tsx
- src/features/profile/components/ProfileDashboard.tsx
- _bmad-output/implementation-artifacts/6-1-brand-identity-theme-integration.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Status

Status: done
