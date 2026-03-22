---
phase: 11-pre-fill-value-restoration
plan: 01
subsystem: api
tags: [typescript, vitest, utility, parsing, next-js]

# Dependency graph
requires: []
provides:
  - "src/lib/utils/parseStructuredFields.ts — shared pure utility importable by both server and client"
  - "11 unit tests for parseStructuredFields and extractFreeformNotes"
  - "extract/route.ts imports from shared util (no inline definition)"
  - "describe/route.ts imports from shared util (fixed broken import)"
affects:
  - "11-02-pre-fill-value-restoration"
  - "InspectionNotesSection.tsx (can now import parseStructuredFields)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared pure utility in src/lib/utils/ — importable by both client components and route handlers"
    - "TDD: write failing tests first, then implement to pass"

key-files:
  created:
    - "src/lib/utils/parseStructuredFields.ts"
    - "src/__tests__/parseStructuredFields.test.ts"
  modified:
    - "src/app/api/extract/route.ts"
    - "src/__tests__/extract-route.test.ts"
    - "src/app/api/describe/route.ts"

key-decisions:
  - "Co-locate parseStructuredFields and extractFreeformNotes in same utility file — both parse the same inspection_notes string format"
  - "Remove export from extract/route.ts entirely — function must not be exported from route handler to prevent cross-boundary imports"

patterns-established:
  - "Shared parsing utilities go in src/lib/utils/ — not in route handlers — so client components can import them"

requirements-completed: [PREFILL-06]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 11 Plan 01: Extract parseStructuredFields to Shared Utility Summary

**Moved `parseStructuredFields` and new `extractFreeformNotes` from server-only route handler into `src/lib/utils/parseStructuredFields.ts`, making both functions importable by client components for Plan 11-02**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-22T03:14:23Z
- **Completed:** 2026-03-22T03:16:19Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `src/lib/utils/parseStructuredFields.ts` with two named exports: `parseStructuredFields` and `extractFreeformNotes`
- Added 11 unit tests covering null/empty input, happy-path parsing, Notes key exclusion, malformed lines, and freeform extraction
- Removed inline `parseStructuredFields` from `extract/route.ts` and replaced with shared util import
- Updated 4 dynamic imports in `extract-route.test.ts` to point to shared util path
- Fixed `describe/route.ts` broken import (was importing from extract/route which no longer exports the function)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/lib/utils/parseStructuredFields.ts with unit tests** - `d0d94d8` (feat)
2. **Task 2: Update route.ts import and fix extract-route.test.ts import path** - `4d1bab2` (feat)

## Files Created/Modified
- `src/lib/utils/parseStructuredFields.ts` - Shared pure utility with two named exports
- `src/__tests__/parseStructuredFields.test.ts` - 11 unit tests (all green)
- `src/app/api/extract/route.ts` - Removed inline function, added import from shared util
- `src/__tests__/extract-route.test.ts` - Updated 4 dynamic imports to shared util path
- `src/app/api/describe/route.ts` - Fixed broken import (Rule 3 auto-fix)

## Decisions Made
- Co-located `parseStructuredFields` and `extractFreeformNotes` in the same utility file — they both operate on the same `inspection_notes` string format
- Removed the `export` from the inline definition in `extract/route.ts` entirely by deleting the function body — route handlers should not export utility functions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed broken import in describe/route.ts**
- **Found during:** Task 2 (Update route.ts import and fix extract-route.test.ts import path)
- **Issue:** `src/app/api/describe/route.ts` imported `parseStructuredFields` from `@/app/api/extract/route`. After removing the inline export from extract/route.ts, this import became broken (`Module declares 'parseStructuredFields' locally, but it is not exported`). TypeScript build check caught this.
- **Fix:** Changed import in describe/route.ts to `@/lib/utils/parseStructuredFields`
- **Files modified:** `src/app/api/describe/route.ts`
- **Verification:** `npx tsc --noEmit` no longer reports the error for this file; all tests still pass
- **Committed in:** `4d1bab2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was essential — removing the export from extract/route.ts without updating describe/route.ts would leave the codebase in a broken TypeScript state. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `src/__tests__/extraction-schema.test.ts` (Zod type compatibility) and `.next/types/validator.ts` (stale Next.js build cache) — out of scope, not touched.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `parseStructuredFields` and `extractFreeformNotes` are now importable from `@/lib/utils/parseStructuredFields`
- Plan 11-02 can import these functions in `InspectionNotesSection.tsx` (client component) without Next.js boundary violations
- All 20 tests (11 utility + 9 extract-route) are green

---
*Phase: 11-pre-fill-value-restoration*
*Completed: 2026-03-22*
