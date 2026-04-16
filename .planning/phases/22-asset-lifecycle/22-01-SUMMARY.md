---
phase: 22-asset-lifecycle
plan: 01
subsystem: api
tags: [supabase, server-actions, typescript, vitest, asset-lifecycle]

# Dependency graph
requires: []
provides:
  - "AssetStatus type ('draft' | 'reviewed' | 'confirmed') exported from asset.actions.ts"
  - "deleteAsset server action with storage cleanup and cascade delete"
  - "markAssetConfirmed server action with reviewed-state guard"
  - "saveReview now sets status to 'reviewed' instead of 'confirmed'"
  - "AssetStatusBadge three-state component (amber/blue/emerald)"
affects: [asset-list, review-page, output-page, asset-card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared AssetStatus type defined once in asset.actions.ts, imported everywhere"
    - "Data-driven badge config (BADGE_CONFIG record) instead of if/else branching"
    - "deleteAsset: fetch storage paths before cascade delete to avoid orphaned files"

key-files:
  created: []
  modified:
    - src/lib/actions/asset.actions.ts
    - src/lib/actions/review.actions.ts
    - src/components/asset/AssetStatusBadge.tsx
    - src/components/asset/AssetCard.tsx
    - src/__tests__/asset.actions.test.ts
    - src/__tests__/review.actions.test.ts
    - src/__tests__/AssetCard.test.tsx

key-decisions:
  - "AssetStatus type lives in asset.actions.ts and is imported by badge and card components — single source of truth"
  - "saveReview sets status to 'reviewed'; 'confirmed' only reached via markAssetConfirmed after user copies output"
  - "reviewed and confirmed assets both link to /output in AssetCard — reviewed means ready to view"
  - "deleteAsset fetches storage paths first before deleting the row, avoiding orphaned storage objects after cascade"

patterns-established:
  - "BADGE_CONFIG pattern: Record<AssetStatus, config> drives rendering without conditionals"

requirements-completed: [ASSET-01, ASSET-02]

# Metrics
duration: 8min
completed: 2026-04-16
---

# Phase 22 Plan 01: Asset Lifecycle Data Layer Summary

**Three-state asset lifecycle (draft/reviewed/confirmed) with deleteAsset storage cleanup, markAssetConfirmed state guard, and data-driven AssetStatusBadge using shared AssetStatus type**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-16T12:25:00Z
- **Completed:** 2026-04-16T12:33:14Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added `AssetStatus = 'draft' | 'reviewed' | 'confirmed'` as shared type, used in AssetSummary and all components
- `deleteAsset` action: fetches photo storage paths first, removes from Supabase Storage, then deletes asset row (cascade removes asset_photos)
- `markAssetConfirmed` guards with `.eq('status', 'reviewed')` preventing status skipping
- `saveReview` now sets `status: 'reviewed'` — the reviewed/confirmed split enables a two-step confirmation workflow
- `AssetStatusBadge` upgraded from 2-state if/else to data-driven BADGE_CONFIG with amber/blue/emerald colors
- 23 tests across 3 files all passing (11 new tests added)

## Task Commits

1. **Task 1: Add AssetStatus type, deleteAsset and markAssetConfirmed actions** - `84c8adf` (feat)
2. **Task 2: Update saveReview status, upgrade AssetStatusBadge to 3 states** - `0aee666` (feat)
3. **Task 3: Update tests** - `52937d1` (test)

## Files Created/Modified
- `src/lib/actions/asset.actions.ts` - Added AssetStatus type, deleteAsset, markAssetConfirmed; updated AssetSummary
- `src/lib/actions/review.actions.ts` - Changed status to 'reviewed' in saveReview update
- `src/components/asset/AssetStatusBadge.tsx` - Replaced with BADGE_CONFIG-driven 3-state component
- `src/components/asset/AssetCard.tsx` - Updated to import and use AssetStatus type (deviation: required by TS error)
- `src/__tests__/asset.actions.test.ts` - Added deleteAsset (3 cases) and markAssetConfirmed (1 case) tests
- `src/__tests__/review.actions.test.ts` - Added test verifying status: 'reviewed' in update call
- `src/__tests__/AssetCard.test.tsx` - Added reviewed badge and output-link tests

## Decisions Made
- `saveReview` sets `reviewed`, not `confirmed` — separates "data entered" from "user explicitly confirmed output"
- `markAssetConfirmed` uses `.eq('status', 'reviewed')` guard to prevent jumping directly from draft to confirmed
- Reviewed assets link to `/output` in AssetCard (same as confirmed) — reviewed means output is ready to view

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated AssetCard.tsx to use AssetStatus type**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** AssetCard still had `status: 'draft' | 'confirmed'` inline — caused TS2322 error after AssetSummary changed to AssetStatus
- **Fix:** Added `import type { AssetStatus }` and changed the prop type to `AssetStatus`
- **Files modified:** src/components/asset/AssetCard.tsx
- **Verification:** TypeScript compile passed after fix
- **Committed in:** 84c8adf (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch bug)
**Impact on plan:** Required for TypeScript correctness. AssetCard was in-scope as a consumer of AssetStatus.

## Issues Encountered
- Pre-existing `.next/types/validator.ts` TS error about missing `edit-type` page (stale Next.js type artifact) — out of scope, not caused by these changes.
- Pre-existing test failures in extraction/output/checklist tests — unrelated to this plan's changes, not touched.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AssetStatus type and all three lifecycle states are wired up end-to-end
- `deleteAsset` and `markAssetConfirmed` ready for UI integration in next plan
- AssetStatusBadge renders all three states correctly

---
*Phase: 22-asset-lifecycle*
*Completed: 2026-04-16*
