---
phase: 03-ai-extraction
plan: "03"
subsystem: testing
tags: [vitest, typescript, schema-registry, extract-route]

# Dependency graph
requires:
  - phase: 03-ai-extraction
    provides: "UAT-verified extract route returning extraction_result in response body; truck schema with 4 priority fields (registration_expiry removed)"
provides:
  - "Test suite aligned with UAT-driven codebase changes — all 19 tests in extraction-schema.test.ts and extract-route.test.ts pass"
  - "route.ts clean of dead import and void call"
affects: [04-review-form, 05-description-generator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test assertions must be updated when production schema changes during UAT — aiExtractable status is live truth"

key-files:
  created: []
  modified:
    - src/__tests__/extraction-schema.test.ts
    - src/__tests__/extract-route.test.ts
    - src/app/api/extract/route.ts

key-decisions:
  - "Stale odometer strip-test updated to use chassis_number (still non-aiExtractable) — odometer is now aiExtractable for truck post-UAT expansion"

patterns-established:
  - "When reviewing test failures after UAT, check both the test assertion AND the current aiExtractable field list before deciding which is stale"

requirements-completed: [AI-01, AI-02, AI-03]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 03 Plan 03: Stale Tests + Dead Import Gap Closure Summary

**Aligned vitest tests with UAT-driven truck schema changes — 4-field priority assertions, extraction_result response shape, and removed dead getInspectionPriorityFields call from route.ts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T13:41:13Z
- **Completed:** 2026-03-18T13:43:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Corrected two stale assertions in extraction-schema.test.ts (truck 4-field reality, length check)
- Corrected extract-route.test.ts success path to assert `{ success: true, extraction_result: expect.any(Object) }`
- Removed dead `getInspectionPriorityFields` import and void call from route.ts — no TypeScript errors
- Full targeted test suite (19 tests across 2 files) passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix stale test assertions** - `2d76dbc` (fix)
2. **Task 2: Remove dead import and void call from route.ts** - `29c6781` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/__tests__/extraction-schema.test.ts` - Updated truck priority field description/assertions (4 fields not 5); updated strip-test to use chassis_number instead of odometer (odometer is now aiExtractable post-UAT)
- `src/__tests__/extract-route.test.ts` - Updated success path assertion to include extraction_result
- `src/app/api/extract/route.ts` - Removed unused import of getInspectionPriorityFields and dead void call

## Decisions Made
- Updated the buildExtractionSchema strip-test to use `chassis_number` rather than `odometer` as the non-aiExtractable key — odometer became aiExtractable during the Phase 03 UAT expansion. chassis_number has `aiExtractable: false` in the current truck schema and remains a valid test sentinel.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale strip-test using odometer (now aiExtractable)**
- **Found during:** Task 1 (Fix stale test assertions)
- **Issue:** The plan specified fixing the 4-field description and length assertions, but the buildExtractionSchema strip-test still used `odometer` as the "not aiExtractable" sentinel key. Since the UAT expansion made odometer aiExtractable for trucks, the test assertion `expect(result.data).not.toHaveProperty('odometer')` was failing — odometer is now included in the extraction schema.
- **Fix:** Changed the strip-test to use `chassis_number` which has `aiExtractable: false` in the current truck schema.
- **Files modified:** src/__tests__/extraction-schema.test.ts
- **Verification:** All 19 targeted tests pass after fix
- **Committed in:** 2d76dbc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix)
**Impact on plan:** Auto-fix necessary for correctness — the plan's specified changes alone would not have made all tests pass. No scope creep.

## Issues Encountered
- Full test suite (`npm run test -- --run`) has one pre-existing failure in `PhotoUploadZone.test.tsx` — the file input `capture="environment"` attribute was removed in an uncommitted working tree change to `PhotoUploadZone.tsx` before this plan executed. Already documented in `deferred-items.md`. Not caused by this plan.

## Next Phase Readiness
- Phase 03 test suite fully clean for the 3 extraction-specific test files
- route.ts is clean with no dead imports or void calls
- TypeScript compiles with no errors
- Pre-existing `PhotoUploadZone.tsx` capture attribute issue should be addressed before Phase 04

---
*Phase: 03-ai-extraction*
*Completed: 2026-03-18*
