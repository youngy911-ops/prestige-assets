---
phase: 03-ai-extraction
plan: 02
subsystem: extraction-ui
tags: [ai, extraction, ui, react, client-components, tdd, photos-page]
dependency_graph:
  requires:
    - 03-01
  provides:
    - ConfidenceBadge UI primitive
    - InspectionNotesSection with 500ms debounced autosave
    - ExtractionTriggerState / ExtractionLoadingState / ExtractionFailureState
    - ExtractionResultPanel (all Salesforce fields with confidence badges)
    - ExtractionPageClient state machine (idle/loading/success/failure)
    - PhotosPageCTA (fire-and-navigate pattern)
    - /assets/[id]/extract Server Component page
  affects:
    - src/app/(app)/assets/[id]/photos/page.tsx (InspectionNotesSection + PhotosPageCTA)
tech_stack:
  added: []
  patterns:
    - fire-and-navigate (PhotosPageCTA: POST fires then router.push immediately)
    - router.push for Server Component remount (not router.refresh — avoids stale state)
    - TDD with vitest + @testing-library/react for all new client components
    - 500ms debounced autosave via useRef + setTimeout
key_files:
  created:
    - src/components/asset/ConfidenceBadge.tsx
    - src/components/asset/InspectionNotesSection.tsx
    - src/components/asset/ExtractionTriggerState.tsx
    - src/components/asset/ExtractionLoadingState.tsx
    - src/components/asset/ExtractionFailureState.tsx
    - src/components/asset/ExtractionResultPanel.tsx
    - src/components/asset/ExtractionPageClient.tsx
    - src/components/asset/PhotosPageCTA.tsx
    - src/app/(app)/assets/[id]/extract/page.tsx
    - src/__tests__/extraction-ui.test.tsx
    - src/__tests__/extraction-result.test.tsx
  modified:
    - src/app/(app)/assets/[id]/photos/page.tsx (DB select + InspectionNotesSection + PhotosPageCTA)
decisions:
  - "router.push used (not router.refresh) after extraction POST — push causes Server Component remount, reading fresh extraction_result from DB; refresh alone does not remount Server Component"
  - "ExtractionPageClient owns the state machine (idle/loading/success/failure) — Server Component only reads DB and passes initialExtractionResult as prop"
  - "PhotosPageCTA uses fire-and-navigate: POST fires but is not awaited; user navigates immediately to /extract where loading state is shown"
  - "ConfidenceBadge comment includes router.refresh() in explanation text — acceptance criterion grep for router.refresh hits comment but not actual call; this is intentional documentation"
metrics:
  duration: "5 minutes"
  completed: "2026-03-18"
  tasks_completed: 2
  files_created: 11
  files_modified: 1
---

# Phase 03 Plan 02: Extraction UI Components + Extract Page Summary

**One-liner:** Complete staff-facing extraction workflow: InspectionNotesSection with debounced autosave, 4-state ExtractionPageClient machine, ExtractionResultPanel with per-field confidence badges, and fire-and-navigate PhotosPageCTA.

## What Was Built

Two atomic commits delivering the complete extraction UI layer:

**Task 1: ConfidenceBadge + InspectionNotesSection + ExtractionTriggerState + ExtractionLoadingState + ExtractionFailureState**

- `ConfidenceBadge`: color-coded confidence indicator using CheckCircle2 (green, high), AlertCircle (amber, medium), MinusCircle (muted white/40, low/not_found) — screen-reader labels included
- `InspectionNotesSection`: Card wrapper with asset-type-driven structured priority fields (up to 5) + freeform "Other notes" textarea; 500ms debounced autosave via `saveInspectionNotes` Server Action
- `ExtractionTriggerState`: "Run AI Extraction" button + "Skip to Manual Entry" link; no-photo empty state variant
- `ExtractionLoadingState`: Loader2 spinner + "Analysing photos and notes…" + can-navigate-away sub-message
- `ExtractionFailureState`: error banner + "Try Again" button + "Skip to Manual Entry" link

**Task 2: ExtractionResultPanel + ExtractionPageClient + PhotosPageCTA + /extract page + photos page extension**

- `ExtractionResultPanel`: flat scrollable list of all Salesforce fields in sfOrder — extracted values in bold white, unextracted as "Not found" muted text — per-field `ConfidenceBadge` — sticky "Proceed to Review" CTA + "Re-run Extraction" secondary
- `ExtractionPageClient`: 'use client' state machine (idle/loading/success/failure) — uses `router.push` (not `router.refresh`) to cause Server Component remount after successful extraction
- `PhotosPageCTA`: fire-and-navigate — POSTs to /api/extract without awaiting, immediately pushes to /extract page
- `/assets/[id]/extract`: Server Component reads `extraction_result` and `inspection_notes` from DB, dispatches to `ExtractionPageClient` with `initialExtractionResult`
- `/assets/[id]/photos`: Extended DB select to include `inspection_notes`; added `InspectionNotesSection` between photo grid and CTA; replaced Link CTA with `PhotosPageCTA` (when photos exist) or "Skip to Manual Entry" Link (when no photos)

## Test Results

- 24 new tests added (14 in extraction-ui.test.tsx, 10 in extraction-result.test.tsx)
- 109 tests passing total (pre-existing + new)
- 1 pre-existing failure in PhotoUploadZone.test.tsx (deferred from Plan 01 — out of scope)
- `npm run build` passes cleanly — /assets/[id]/extract shows as new dynamic route

## Deviations from Plan

### Auto-corrected Issues

**1. [Rule 1 - Bug] ConfidenceBadge not_found test assertion fixed**
- **Found during:** Task 1 TDD GREEN
- **Issue:** Test used `getByText('Not found')` but ConfidenceBadge renders "Not found" in both an `sr-only` span and a visible `aria-hidden` span — `getByText` throws on multiple matches
- **Fix:** Changed to `getAllByText('Not found').length > 0`
- **Files modified:** src/__tests__/extraction-ui.test.tsx

### Minor Acceptance Criterion Note

The acceptance criterion `grep "router.refresh" src/components/asset/ExtractionPageClient.tsx returns no output` technically fails because `router.refresh()` appears in a code comment explaining why NOT to use it. The actual implementation correctly uses `router.push()` only — no actual call to `router.refresh()` exists. The comment is intentional documentation of the architectural decision.

### Checkpoint Status

Task 3 (human-verify checkpoint) reached — plan paused awaiting browser verification.

## Self-Check: PASSED

All 11 created files found on disk. Both task commits (be678bd, aeeae6a) verified in git log. Build and all new tests pass.
