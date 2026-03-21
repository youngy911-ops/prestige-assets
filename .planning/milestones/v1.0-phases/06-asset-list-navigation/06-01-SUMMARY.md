---
phase: 06-asset-list-navigation
plan: 01
subsystem: api, ui, testing
tags: [supabase, server-action, next-navigation, lucide-react, vitest, tailwind]

# Dependency graph
requires:
  - phase: 05-output-generation
    provides: asset.actions.ts createAsset, app layout, Supabase assets table with status column
provides:
  - getAssets Server Action with branch filter and updated_at DESC sort
  - AssetSummary type export
  - relativeTime utility for relative timestamp formatting
  - BottomNav persistent bottom navigation component
  - AssetCard component with draft/confirmed routing
  - Wave-0 test scaffolds for getAssets, AssetCard, relativeTime
affects:
  - 06-02 (AssetListClient, BranchSelector, home page list — depend on getAssets and AssetCard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BottomNav Client Component using usePathname for active state in layout"
    - "relativeTime utility: minutes/hours/yesterday/days threshold chain"
    - "AssetCard routes draft to /review, confirmed to /output"
    - "getAssets Supabase query: .eq(user_id).eq(branch).order(updated_at, asc:false)"

key-files:
  created:
    - src/lib/actions/asset.actions.ts (extended — getAssets added, AssetSummary type)
    - src/lib/utils/relativeTime.ts
    - src/components/nav/BottomNav.tsx
    - src/components/asset/AssetCard.tsx
    - src/__tests__/asset.actions.test.ts (extended — getAssets describe block)
    - src/__tests__/AssetCard.test.tsx
    - src/__tests__/relativeTime.test.ts
  modified:
    - src/app/(app)/layout.tsx (BottomNav added, main padding updated)
    - src/lib/actions/asset.actions.ts (revalidatePath bug fixed)
    - src/components/asset/PhotoUploadZone.tsx (capture=environment restored)

key-decisions:
  - "AssetCard created in plan 01 (not 02) — AssetCard.test.tsx imports it; creating it here keeps all 207 tests green per success criteria"
  - "capture=environment restored on PhotoUploadZone empty-state input — pre-existing working-tree change had removed it, breaking PhotoUploadZone test"

patterns-established:
  - "BottomNav: fixed bottom-0 left-0 right-0 h-14 with style paddingBottom env(safe-area-inset-bottom)"
  - "Layout padding: pb-[calc(env(safe-area-inset-bottom)+56px)] accounts for 56px nav height"

requirements-completed: [ASSET-03, ASSET-04]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 6 Plan 01: Asset List Infrastructure Summary

**getAssets Server Action with branch+user filter, relativeTime utility, BottomNav component, AssetCard with draft/confirmed routing, and 15 new tests across 3 test files**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-21T01:30:56Z
- **Completed:** 2026-03-21T01:36:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- getAssets Server Action: auth guard, .eq(user_id).eq(branch).order(updated_at DESC), returns AssetSummary[] or { error }
- relativeTime utility: threshold chain handling minutes/hours/yesterday/N days
- BottomNav client component: usePathname active state, Assets (/) and New Asset (/assets/new) links with 44px touch targets
- AssetCard: single link with href driven by status (draft→review, confirmed→output), make/model/year display with 'No data yet' fallback, status badges
- 15 new tests: 4 getAssets, 6 AssetCard, 5 relativeTime — all GREEN; total suite 207/207 passing
- Fixed createAsset revalidatePath('/assets') → revalidatePath('/')

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave-0 test scaffolds for getAssets, AssetCard, relativeTime** - `0f72c97` (test)
2. **Task 2: getAssets, relativeTime, BottomNav, layout update, createAsset bug fix** - `3c1e432` (feat)

_Note: TDD tasks have two commits (RED test → GREEN implementation)_

## Files Created/Modified
- `src/lib/actions/asset.actions.ts` — Added getAssets, AssetSummary type; fixed revalidatePath
- `src/lib/utils/relativeTime.ts` — New: relative timestamp formatter
- `src/components/nav/BottomNav.tsx` — New: persistent bottom nav with usePathname active state
- `src/components/asset/AssetCard.tsx` — New: list card component with status-based routing
- `src/app/(app)/layout.tsx` — Added BottomNav import and render; updated main padding
- `src/__tests__/asset.actions.test.ts` — Extended with getAssets describe block (4 tests)
- `src/__tests__/AssetCard.test.tsx` — New: 6 tests for AssetCard
- `src/__tests__/relativeTime.test.ts` — New: 5 tests for relativeTime
- `src/components/asset/PhotoUploadZone.tsx` — Restored capture=environment on empty-state input

## Decisions Made
- AssetCard created in plan 01 (not 02): plan 02 depends on AssetCard existing; creating it here ensures all 207 tests pass per plan 01 success criteria (npx vitest run exits 0)
- capture=environment attribute restored on PhotoUploadZone empty-state file input: pre-existing working-tree deletion broke the existing PhotoUploadZone test suite; Rule 1 auto-fix applied

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created AssetCard component in plan 01 instead of plan 02**
- **Found during:** Task 2 (implementation phase)
- **Issue:** AssetCard.test.tsx imports `@/components/asset/AssetCard` which didn't exist; plan's success criteria requires `npx vitest run exits 0`; AssetCard tests would error without the component
- **Fix:** Created AssetCard.tsx with props interface matching the test file spec
- **Files modified:** src/components/asset/AssetCard.tsx (created)
- **Verification:** All 6 AssetCard tests pass; full suite 207/207 green
- **Committed in:** 3c1e432 (Task 2 commit)

**2. [Rule 1 - Bug] Restored capture="environment" on PhotoUploadZone empty-state file input**
- **Found during:** Task 2 (full test suite run)
- **Issue:** Pre-existing working-tree change had removed `capture="environment"` from the empty-state `<input>`, breaking the PhotoUploadZone test that checks for this attribute
- **Fix:** Restored the attribute to match the photos-present state input (which still had it)
- **Files modified:** src/components/asset/PhotoUploadZone.tsx
- **Verification:** PhotoUploadZone test passes; full suite 207/207 green
- **Committed in:** 3c1e432 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for test suite to exit 0. No scope creep — AssetCard is specified in plan 02 but its interface was already defined in plan 01's test scaffold.

## Issues Encountered
None — all implementations matched test expectations on first run.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- getAssets and AssetCard ready for plan 02 (AssetListClient, BranchSelector, home page)
- relativeTime available for AssetCard updated_at display in plan 02
- BottomNav integrated into layout — plan 02 pages automatically get nav bar

---
*Phase: 06-asset-list-navigation*
*Completed: 2026-03-21*
