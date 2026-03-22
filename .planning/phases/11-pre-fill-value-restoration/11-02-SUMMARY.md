---
phase: 11-pre-fill-value-restoration
plan: 02
subsystem: ui
tags: [react, vitest, testing-library, uncontrolled-inputs, useref, useeffect]

# Dependency graph
requires:
  - phase: 11-01
    provides: parseStructuredFields and extractFreeformNotes shared utility at src/lib/utils/parseStructuredFields.ts
provides:
  - InspectionNotesSection wires all 5 pre-fill restoration fixes
  - structuredValuesRef seeded from parseStructuredFields(initialNotes) at mount
  - notesRef seeded from extractFreeformNotes(initialNotes) at mount
  - Input and Select fields display saved values via defaultValue
  - Textarea shows only freeform notes (not full blob)
  - Unmount useEffect flushes in-flight edits synchronously
  - 5-test component test suite covering all restoration behaviours
affects: [pre-fill-restoration, inspection-notes, asset-editing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD: write failing tests first, then implement to make them green"
    - "JSX attributes use template literals (backticks) for strings requiring newline escapes"
    - "Uncontrolled inputs seeded from parsed state at mount via useRef initialiser argument"
    - "Unmount useEffect pattern: cancel debounce timer + persist synchronously in cleanup function"

key-files:
  created:
    - src/__tests__/InspectionNotesSection.test.tsx
  modified:
    - src/components/asset/InspectionNotesSection.tsx

key-decisions:
  - "JSX string attributes do not interpret \\n as newlines — test strings must use template literals (backticks) to produce real newlines"
  - "Use defaultValue (uncontrolled) for Select restoration — no controlled fallback needed since tests pass with defaultValue"
  - "Unmount flush placed as useEffect cleanup, dependent on [persistNotes] to get stable reference"

patterns-established:
  - "useRef initialiser argument: seed refs from parsed state at mount (never recalculate from props mid-lifecycle)"
  - "Unmount flush pattern: useEffect return () => { clearTimeout; persistFn() } — synchronous on unmount, no Promise"

requirements-completed: [PREFILL-06]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 11 Plan 02: Pre-fill Value Restoration — InspectionNotesSection Summary

**All 5 pre-fill restoration fixes wired into InspectionNotesSection: ref seeding, Input/Select defaultValue, textarea freeform-only, and synchronous unmount flush**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T03:18:41Z
- **Completed:** 2026-03-22T03:21:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Wrote 5 failing TDD tests covering all restoration behaviours before touching the component
- Applied 7 surgical changes to InspectionNotesSection.tsx: imports, ref seeding, unmount flush, Input/Select defaultValue, textarea fix
- All 245 tests in full suite pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write InspectionNotesSection component tests (TDD RED)** - `a0019d5` (test)
2. **Task 2: Apply all pre-fill restoration fixes to InspectionNotesSection.tsx** - `5a4e734` (feat)

_Note: TDD tasks have two commits — test (RED) then feat (GREEN)_

## Files Created/Modified

- `src/__tests__/InspectionNotesSection.test.tsx` — 5-test component suite: input defaultValue, ref integrity, textarea freeform, textarea empty, unmount flush
- `src/components/asset/InspectionNotesSection.tsx` — All 5 restoration fixes applied: useEffect import, parseStructuredFields/extractFreeformNotes import, ref seeding, unmount flush, Input/Select/textarea defaultValue wiring

## Decisions Made

- JSX string attributes do not interpret `\n` as newlines — template literals required in tests for multi-line strings
- Uncontrolled Select with `defaultValue` prop works in jsdom without needing the controlled `useState` fallback
- Placed unmount flush `useEffect` directly after `scheduleAutosave` so `persistNotes` dependency is in scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test strings used JSX attribute quotes which do not interpret \\n as newlines**
- **Found during:** Task 1 (test RED phase) / Task 2 (GREEN verification)
- **Issue:** Plan's skeleton code used `"vin: ABC\nodometer: 50000"` as JSX attribute strings. In JSX, `\n` inside double-quoted attributes is a literal two-character sequence, not a newline — so `parseStructuredFields` never split lines and all tests stayed RED even after the component fixes were applied.
- **Fix:** Changed all `initialNotes="..."` to `initialNotes={`...`}` (template literals) so `\n` becomes actual newline characters.
- **Files modified:** src/__tests__/InspectionNotesSection.test.tsx
- **Verification:** All 5 tests GREEN after this fix with correct component implementation
- **Committed in:** `5a4e734` (combined with Task 2 component fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test bug, not a production code issue)
**Impact on plan:** Auto-fix was essential for correct test behaviour. No scope creep.

## Issues Encountered

- JSX string attributes vs template literals: `"string\n"` in JSX attributes is NOT an escape sequence — `\n` is literal. Template literals in JSX expressions `{\`string\n\`}` are required for real newlines. Discovered during TDD GREEN phase when tests remained red despite correct implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 11 complete — all pre-fill value restoration functionality is implemented and tested
- PREFILL-06 requirement fulfilled
- Manual verification still recommended: visit an asset with saved suspension type and confirm the Select shows the saved value (not the placeholder), and fast-navigation flush test

## Self-Check: PASSED

- FOUND: src/__tests__/InspectionNotesSection.test.tsx
- FOUND: src/components/asset/InspectionNotesSection.tsx
- FOUND: .planning/phases/11-pre-fill-value-restoration/11-02-SUMMARY.md
- FOUND: commit a0019d5 (test RED)
- FOUND: commit 5a4e734 (feat GREEN)
- Full suite: 245/245 tests pass

---
*Phase: 11-pre-fill-value-restoration*
*Completed: 2026-03-22*
