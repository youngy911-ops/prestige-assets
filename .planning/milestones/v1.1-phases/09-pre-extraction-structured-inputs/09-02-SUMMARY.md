---
phase: 09-pre-extraction-structured-inputs
plan: "02"
subsystem: ui
tags: [react, base-ui, select, inspection-notes, ai-extraction, structured-fields]

# Dependency graph
requires:
  - phase: 09-pre-extraction-structured-inputs/09-01
    provides: "schema inputType/options flags for suspension (select) and all other priority fields"
provides:
  - "Select dropdown rendering in InspectionNotesSection for suspension type (truck and trailer)"
  - "parseStructuredFields function in extract route: parses inspection_notes key:value lines into structuredFields"
  - "structuredFields passed to buildUserPrompt replacing hardcoded empty object"
affects:
  - 10-description-template
  - ai-extraction

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Select is UNCONTROLLED in InspectionNotesSection — no value/defaultValue prop (re-hydration deferred to v1.2 PREFILL-06)"
    - "onValueChange typed as string | null with null guard — Base UI Select passes null on deselect"
    - "parseStructuredFields excludes 'Notes' freeform key; only schema-key: value lines become structuredFields"
    - "Export helpers from Next.js route files to enable direct unit testing without HTTP"

key-files:
  created: []
  modified:
    - src/components/asset/InspectionNotesSection.tsx
    - src/app/api/extract/route.ts
    - src/__tests__/extract-route.test.ts

key-decisions:
  - "onValueChange typed as (value: string | null) — Base UI Root.Props generic defaults to unknown without explicit type parameter"
  - "parseStructuredFields exported from route.ts to allow direct unit test import without HTTP overhead"

patterns-established:
  - "Select uncontrolled pattern: no value prop on Select root in InspectionNotesSection (re-hydration is v1.2)"
  - "Structured field parsing: colonIdx = indexOf(': ') excludes 'Notes' and empty values, handles null input"

requirements-completed: [PREFILL-01, PREFILL-02, PREFILL-03, PREFILL-04, PREFILL-05]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 09 Plan 02: Pre-Extraction Structured Inputs (UI + Backend) Summary

**Select dropdown for suspension type in truck/trailer inspection cards, with parseStructuredFields wiring pre-entered values into AI prompt as authoritative overrides**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T04:51:06Z
- **Completed:** 2026-03-21T04:54:46Z
- **Tasks:** 2 automated (Task 3 pending human verify checkpoint)
- **Files modified:** 3

## Accomplishments
- Added `parseStructuredFields` to extract route — parses `key: value` lines from `inspection_notes`, excludes `Notes` freeform key, handles null input safely
- Replaced hardcoded `const structuredFields: Record<string, string> = {}` with `parseStructuredFields(asset.inspection_notes)` — pre-entered values now flow to AI as "Staff-provided field values (use these directly)"
- Added Select dropdown rendering branch in `InspectionNotesSection` for `field.inputType === 'select'` fields — suspension type on truck and trailer now renders as Spring/Airbag/6 Rod/Other dropdown
- Added 4 new `FIELD_PLACEHOLDERS` entries: suspension, truck_weight, max_lift_height, trailer_length
- 4 new TDD test cases for parseStructuredFields: basic parsing, Notes exclusion, null input, malformed lines — all green

## Task Commits

Each task was committed atomically:

1. **Task 1: Add parseStructuredFields test + add to extract route** - `3b8f2f9` (feat)
2. **Task 2: InspectionNotesSection — add Select rendering for select-type priority fields** - `fd3a7b6` (feat)

_Note: Task 1 used TDD (RED then GREEN steps within single commit)_

## Files Created/Modified
- `src/app/api/extract/route.ts` - Added exported `parseStructuredFields` function; replaced hardcoded empty structuredFields
- `src/__tests__/extract-route.test.ts` - Added 4 parseStructuredFields test cases in new describe block
- `src/components/asset/InspectionNotesSection.tsx` - Added Select imports, 4 placeholder entries, inputType === 'select' branch in priorityFields.map()

## Decisions Made
- `onValueChange` callback typed as `(value: string | null)` with null guard (`value ?? ''`) — Base UI Select Root generic defaults to `unknown` without an explicit type parameter, causing TS2345. The null guard ensures handleStructuredChange always receives a string.
- `parseStructuredFields` exported from `route.ts` — enables direct unit testing via `await import('@/app/api/extract/route')` without HTTP overhead or mock setup complexity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error on onValueChange callback**
- **Found during:** Task 2 (InspectionNotesSection Select rendering)
- **Issue:** Base UI `Select.Root` `onValueChange` prop types `value` as `SelectValueType<Value, Multiple>` which resolves to `unknown` without explicit type parameter. Plan specified `(value: string)` but this caused TS2345 (not assignable to `string | null`).
- **Fix:** Typed as `(value: string | null)` with null coalescence guard `value ?? ''` on the handleStructuredChange call.
- **Files modified:** src/components/asset/InspectionNotesSection.tsx
- **Verification:** `npx tsc --noEmit` shows no errors for InspectionNotesSection.tsx
- **Committed in:** fd3a7b6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** TypeScript fix was necessary for clean compilation. No behaviour change — null deselect simply stores empty string which the filter in persistNotes correctly excludes.

## Issues Encountered
None beyond the type fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All PREFILL-01 through PREFILL-05 requirements satisfied
- Awaiting human verify checkpoint (Task 3) — staff must confirm UI rendering in browser for truck, trailer, forklift, caravan asset types
- After checkpoint approval, phase 09 is complete
- Phase 10 (description template) can proceed

---
*Phase: 09-pre-extraction-structured-inputs*
*Completed: 2026-03-21*
