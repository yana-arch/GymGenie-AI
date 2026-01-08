# Story 3.3: Transparency and Auditing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a fitness user wanting to understand AI decisions,
I want complete transparency over what data influences recommendations,
so that I can verify the AI's decision-making process and build trust.

## Acceptance Criteria

1. **Given** an AI recommendation is presented
2. **When** the user requests explanation
3. **Then** they see exactly what data influenced the recommendation (detailed breakdown of shared vs. protected categories)
4. **And** they can audit their data usage history with clear timelines (Audit Log View)
5. **And** the audit log shows all privacy-related events: encryption, decryption, data access, and AI inference calls
6. **And** each AI inference entry in the log details which data categories were included in the prompt
7. **And** the history is persisted locally and can be cleared by the user (FR21, FR64, NFR22)

## Tasks / Subtasks

- [x] **Enhance Audit Log Schema and Types** (AC: 5, 6)
  - [x] Update `PrivacyAuditEntry` operation types to include `ai_inference`
  - [x] Add `dataCategories` field to `PrivacyAuditEntry` to capture context for AI calls
- [x] **Implement Detailed AI Usage Logging** (AC: 3, 6)
  - [x] Update `PrivacyAuditService` with `logAiInference` method
  - [x] Update `PrivacyShieldService` to log detailed audit entries for every sanitization event
- [x] **Build Privacy Audit Log UI** (AC: 4, 5, 7)
  - [x] Create `PrivacyAuditLog` component using Mantine components (Timeline view using Tailwind)
  - [x] Implement filtering by event type (Inference, Settings, Security)
  - [x] Add a "Clear History" function with confirmation dialog
- [x] **Enhance Transparency Features in Dashboard** (AC: 1, 2)
  - [x] Integrate `PrivacyAuditLog` into the `DataControlDashboard`
  - [x] Add ability to expand audit entries to see full details (e.g., specific data points shared)
- [x] **Verification and Testing** (Testing)
  - [x] Write tests verifying that every AI call generates a corresponding audit entry
  - [x] Test that clearing history removes all local log data
  - [x] Verify that audit entries correctly reflect user privacy settings at the time of the call

## Dev Notes

### Critical Implementation Requirements
- **TIMELINE VISUALIZATION** - Use a timeline or vertical list to show events in reverse chronological order.
- **MANTINE INTEGRATION** - Use `Timeline`, `Accordion`, or `DataTable` from Mantine for the log view.
- **PERSISTENCE** - Audit logs are already in Redux Persist (from 3.1), ensure they don't exceed size limits (already capped at 100 in `privacySlice`, but consider if that's enough for "complete history").
- **TRANSPARENCY** - The "explanation" should be user-friendly, translating technical data points into plain English (e.g., "Injury History: Restricted" instead of "injuryHistory: false").

### Architecture Compliance
- **Zero-Trust Security**: Logging happens entirely locally.
- **Algorithm Transparency**: Users can see exactly what the AI "saw" before it made a recommendation.
- **Local-Only Processing**: No audit data is ever sent to the cloud (NFR20, NFR27).

### Technical Stack & Libraries
- **React 19 / TypeScript 5.8**: Use functional components.
- **Redux Toolkit**: Manage audit state.
- **Mantine v7**: `Timeline`, `ScrollArea`, `Badge`.
- **Lucide React**: Use icons for different event types (Shield, Brain, Lock, etc.).

### Project Structure Notes
- **Log Component**: `src/features/privacy/components/PrivacyAuditLog.tsx`
- **Service Updates**: `src/features/privacy/services/PrivacyAuditService.ts`
- **Dashboard Integration**: `src/features/privacy/components/DataControlDashboard.tsx`

### References
- [Source: _bmad-output/planning-artifacts/prd.md#FR21]
- [Source: _bmad-output/planning-artifacts/prd.md#FR64]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR22]
- [Source: _bmad-output/planning-artifacts/architecture.md#Safety-&-Validation-Systems]
- [Source: _bmad-output/implementation-artifacts/3-2-data-control-dashboard.md#Dev-Notes]

## Dev Agent Record

### Agent Model Used

opencode (Gemini 2.0 Flash) - Ultimate story context engine

### Debug Log References

- Story discovered from `sprint-status.yaml` line 63.
- Analysis of 3.2 revealed `RecommendationInsights` only shows the *last* result; 3.3 expands this to a full history.
- `PrivacyAuditService.ts` and `RecommendationInsights.tsx` analyzed to ensure implementation continuity.
- NFR22 specifically requires "clear audit trails for users to review data usage".

### Completion Notes List

- ✅ Enhanced `PrivacyAuditEntry` with `ai_inference` operation and `dataCategories` context.
- ✅ Updated `PrivacyAuditService` with async logging and dynamic store import to prevent circular dependencies.
- ✅ Integrated detailed audit logging into `PrivacyShieldService` (sanitization, encryption, decryption).
- ✅ Enhanced `GeminiService` to log AI inference events with privacy context.
- ✅ Built `PrivacyAuditLog` component with timeline visualization, filtering, and history clearing.
- ✅ Integrated audit history into `DataControlDashboard` with tabbed navigation.
- ✅ Verified implementation with comprehensive transparency tests.

### File List

- `src/features/privacy/types/privacy.types.ts`
- `src/features/privacy/services/PrivacyAuditService.ts`
- `src/features/privacy/services/PrivacyShieldService.ts`
- `src/services/ai/GeminiService.ts`
- `src/features/privacy/components/PrivacyAuditLog.tsx`
- `src/features/privacy/components/DataControlDashboard.tsx`
- `src/features/privacy/__tests__/PrivacyTransparency.test.ts`
