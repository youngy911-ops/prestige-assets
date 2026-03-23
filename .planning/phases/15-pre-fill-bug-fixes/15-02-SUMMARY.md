---
phase: 15-pre-fill-bug-fixes
plan: "02"
subsystem: inspection-notes
tags: [sendBeacon, unmount-flush, api-route, ios-bug-fix]
dependency_graph:
  requires: ["15-01"]
  provides: ["POST /api/inspection-notes", "sendBeacon unmount flush"]
  affects: ["InspectionNotesSection", "inspection notes persistence"]
tech_stack:
  added: []
  patterns: ["navigator.sendBeacon + Blob for fire-and-forget POST", "Object.defineProperty for navigator stub in tests"]
key_files:
  created:
    - src/app/api/inspection-notes/route.ts
    - src/__tests__/inspection-notes-route.test.ts
  modified:
    - src/components/asset/InspectionNotesSection.tsx
    - src/__tests__/InspectionNotesSection.test.tsx
    - src/__tests__/extraction-ui.test.tsx
    - src/__tests__/extraction-result.test.tsx
decisions:
  - "sendBeacon + Blob(JSON, application/json) used for unmount flush — same-origin, no CORS preflight, guaranteed delivery"
  - "Object.defineProperty(navigator, 'sendBeacon') used in extraction-ui/result tests to avoid breaking @base-ui detectBrowser.js via navigator spread"
  - "buildCombinedNotes extracted as useCallback with empty deps — reads only stable refs, no duplication"
  - "revalidatePath intentionally excluded from POST route — user has navigated away, revalidation is unnecessary"
metrics:
  duration: "273s"
  completed: "2026-03-23"
  tasks_completed: 2
  files_changed: 6
---

# Phase 15 Plan 02: sendBeacon Unmount Flush Summary

One-liner: iOS back-button data loss fixed by replacing Server Action unmount flush with navigator.sendBeacon to a new authenticated POST /api/inspection-notes route.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create POST /api/inspection-notes route + tests | 42e9d44 | route.ts, inspection-notes-route.test.ts |
| 2 | Rewrite InspectionNotesSection unmount flush + update tests | 4c00701 | InspectionNotesSection.tsx, 3 test files |

## What Was Built

**POST /api/inspection-notes route** (`src/app/api/inspection-notes/route.ts`):
- Auth guard (returns 401 for unauthenticated requests)
- Body validation (returns 400 for missing assetId or invalid JSON)
- DB update using `supabase.from('assets').update({ inspection_notes }).eq('id', assetId).eq('user_id', user.id)`
- No `revalidatePath` — user has already navigated away
- Pattern identical to existing `src/app/api/extract/route.ts`

**InspectionNotesSection unmount flush** (`src/components/asset/InspectionNotesSection.tsx`):
- Extracted `buildCombinedNotes` as `useCallback` with empty deps (reads from stable refs only)
- `persistNotes` delegates to `buildCombinedNotes` (eliminates logic duplication)
- `useEffect` cleanup now calls `navigator.sendBeacon('/api/inspection-notes', new Blob([JSON], { type: 'application/json' }))`
- 500ms debounced autosave path via `scheduleAutosave` → `persistNotes` → `saveInspectionNotes` retained unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock hoisting error in route test**
- **Found during:** Task 1
- **Issue:** Plan's test scaffold referenced `mockSupabase` variable inside `vi.mock` factory, which is hoisted before variable initialization
- **Fix:** Adopted project's established pattern (top-level `mockGetUser`/`mockUpdate` functions, dynamic `await import()` for module under test)
- **Files modified:** src/__tests__/inspection-notes-route.test.ts
- **Commit:** 42e9d44

**2. [Rule 2 - Missing test infrastructure] Added sendBeacon stubs to two test files**
- **Found during:** Task 2 (full suite run)
- **Issue:** `extraction-ui.test.tsx` and `extraction-result.test.tsx` render `InspectionNotesSection` without stubbing `navigator.sendBeacon`, causing `TypeError: navigator.sendBeacon is not a function` on unmount
- **Fix:** Added `Object.defineProperty(navigator, 'sendBeacon', { value: vi.fn(), writable: true, configurable: true })` in `beforeEach` of the relevant describe blocks. Used `Object.defineProperty` (not `vi.stubGlobal`) to avoid breaking `@base-ui`'s `detectBrowser.js` browser sniffing which reads `navigator.userAgent`
- **Files modified:** src/__tests__/extraction-ui.test.tsx, src/__tests__/extraction-result.test.tsx
- **Commit:** 4c00701

## Verification

- `npx vitest run src/__tests__/inspection-notes-route.test.ts` — 5/5 pass
- `npx vitest run src/__tests__/InspectionNotesSection.test.tsx` — 6/6 pass
- `npx vitest run` — 285/285 pass (27 test files)

## Self-Check: PASSED
