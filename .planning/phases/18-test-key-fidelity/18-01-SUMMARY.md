---
phase: 18-test-key-fidelity
plan: 01
subsystem: testing
tags: [vitest, schema-registry, earthmoving, forklift, marine, subtype-keys]

# Dependency graph
requires:
  - phase: 17-description-template-coverage
    provides: Phase 17 getSystemContentP17 tests and describe-route.test.ts structure
provides:
  - Six phantom subtype key strings corrected to real schema keys in describe-route.test.ts
  - Tests now exercise actual code paths matching real user interactions
affects:
  - 18-02 (Phase 19 new subtype tests build on the corrected test file)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test key fidelity: getSystemContentP17 second argument must match the schema subtype key exactly"

key-files:
  created: []
  modified:
    - src/__tests__/describe-route.test.ts

key-decisions:
  - "Phase 18 scope is corrections only — no new describe blocks or it() tests added; Phase 19 adds 'recreational' and 'personal_watercraft'"
  - "Line 500 'boat' fixture in mock data is pre-existing, unrelated to phantom key corrections, left as-is"

patterns-established:
  - "Subtype key string in getSystemContentP17 must match the schema key exactly — never a display-label variant or alias"

requirements-completed: [DESCR-04, DESCR-06, DESCR-08]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 18 Plan 01: Test Key Fidelity Summary

**Six phantom subtype keys corrected in describe-route.test.ts so getSystemContentP17 tests exercise real schema code paths instead of silently passing on non-existent keys**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-24T11:30:00Z
- **Completed:** 2026-03-24T11:33:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced `washing_plant` with `washing` (earthmoving schema key)
- Replaced `order_picker` with `stock_picker` (forklift schema key)
- Replaced `ewp_forklift` with `ewp` (forklift schema key)
- Replaced `boat` with `private` (marine schema key)
- Replaced `commercial_vessel` with `commercial` (marine schema key)
- Replaced `tug_workboat` with `tug` (marine schema key)
- All 105 describe-route tests pass; 361 total suite tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace six phantom subtype keys with real schema keys** - `2775f64` (fix)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `src/__tests__/describe-route.test.ts` - Six getSystemContentP17 second arguments corrected to match actual schema keys

## Decisions Made

- Phase 18 scope is corrections only — no new describe blocks or it() tests; Phase 19 adds `recreational` and `personal_watercraft` marine subtypes
- The `'boat'` string at line 500 is a pre-existing mock fixture for `asset_subtype`, not a `getSystemContentP17` argument — left unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

All created/modified files confirmed present. Task commit 2775f64 confirmed in git log.

## Next Phase Readiness

- describe-route.test.ts now has correct subtype key fidelity for earthmoving, forklift, and marine
- Phase 19 can add `recreational` and `personal_watercraft` marine tests without risk of carrying forward phantom key patterns

---
*Phase: 18-test-key-fidelity*
*Completed: 2026-03-24*
