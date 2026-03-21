---
phase: 09-pre-extraction-structured-inputs
plan: "01"
subsystem: testing
tags: [schema-registry, inspectionPriority, vitest, tdd, truck, trailer, forklift, caravan]

# Dependency graph
requires: []
provides:
  - "truck schema: vin + suspension as inspectionPriority fields; suspension is select [Spring, Airbag, 6 Rod, Other]"
  - "trailer schema: vin + suspension as inspectionPriority fields; suspension is select [Spring, Airbag, 6 Rod, Other]"
  - "forklift schema: max_lift_height + truck_weight as inspectionPriority fields; truck_weight label is 'Unladen Weight'"
  - "caravan schema: trailer_length as inspectionPriority field; label is 'Length (ft)'"
  - "extraction-schema.test.ts assertions updated to match new priority field lists"
affects:
  - "09-02 pre-extraction-structured-inputs: InspectionNotesSection UI reads inspectionPriority fields"
  - "AI extraction pipeline: suspension fields now constrained to select options"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD: write failing tests first, update schemas to pass — schema changes are guarded by pre-existing test suite"
    - "inspectionPriority: true is single source of truth for which fields appear in InspectionNotesSection card"
    - "inputType: 'select' + options[] required when field is constrained to a fixed set of values"

key-files:
  created: []
  modified:
    - src/__tests__/extraction-schema.test.ts
    - src/lib/schema-registry/schemas/truck.ts
    - src/lib/schema-registry/schemas/trailer.ts
    - src/lib/schema-registry/schemas/forklift.ts
    - src/lib/schema-registry/schemas/caravan.ts

key-decisions:
  - "Suspension Type is select with 4 options [Spring, Airbag, 6 Rod, Other] on both truck and trailer — constrains AI extraction and UI to a fixed value set"
  - "Forklift truck_weight key retained; label changed to 'Unladen Weight' to match industry terminology without breaking Salesforce field mapping"
  - "Caravan trailer_length key retained; label changed to 'Length (ft)' to match unit convention used in practice"

patterns-established:
  - "Schema-first: priority field changes done in schema layer before UI/backend wiring — Plan 02 consumes correct data without further schema work"
  - "TDD guard: update test assertions to RED first, then fix schemas to GREEN — prevents silent regressions"

requirements-completed: [PREFILL-01, PREFILL-02, PREFILL-03, PREFILL-04]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 9 Plan 01: Pre-Extraction Structured Inputs — Schema Changes Summary

**Four asset schemas updated with inspectionPriority flags, select types for suspension, and corrected labels for Unladen Weight and Length (ft) — all guarded by a TDD RED/GREEN cycle with 57 passing tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T04:47:25Z
- **Completed:** 2026-03-21T04:50:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Truck and trailer suspension fields converted from `inputType: 'text'` to `inputType: 'select'` with options `['Spring', 'Airbag', '6 Rod', 'Other']` and `inspectionPriority: true`
- Truck and trailer VIN fields promoted to `inspectionPriority: true` so they appear as structured inputs in InspectionNotesSection
- Forklift `max_lift_height` promoted to `inspectionPriority: true`; `truck_weight` label renamed to 'Unladen Weight' and also promoted
- Caravan `trailer_length` label renamed to 'Length (ft)' and promoted to `inspectionPriority: true`
- All 57 tests pass across `extraction-schema.test.ts` and `schema-registry.test.ts` (including existing select/options validation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update test assertions to match new priority field lists (RED)** - `592a04e` (test)
2. **Task 2: Schema changes — add priority fields, fix labels, add select options (GREEN)** - `66d9eba` (feat)

## Files Created/Modified

- `src/__tests__/extraction-schema.test.ts` — Updated 5 test assertions: truck/trailer/forklift/caravan priority field arrays and truck length count (4→6)
- `src/lib/schema-registry/schemas/truck.ts` — vin gets `inspectionPriority: true`; suspension changed to select with 4 options + `inspectionPriority: true`
- `src/lib/schema-registry/schemas/trailer.ts` — vin gets `inspectionPriority: true`; suspension changed to select with 4 options + `inspectionPriority: true`
- `src/lib/schema-registry/schemas/forklift.ts` — `max_lift_height` gets `inspectionPriority: true`; `truck_weight` label to 'Unladen Weight' + `inspectionPriority: true`
- `src/lib/schema-registry/schemas/caravan.ts` — `trailer_length` label to 'Length (ft)' + `inspectionPriority: true`

## Decisions Made

- Suspension select options chosen as `['Spring', 'Airbag', '6 Rod', 'Other']` matching the UI-SPEC contract — constrains AI extraction to a fixed value set
- Salesforce keys (`truck_weight`, `trailer_length`) unchanged; only labels updated — no downstream field mapping breakage
- TDD approach used: test assertions updated to RED first to prove guard validity, then schemas changed to GREEN

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Schema layer complete: `getInspectionPriorityFields('truck')` returns `[vin, odometer, registration_number, hourmeter, suspension, service_history]` in sfOrder
- Plan 02 can consume `getInspectionPriorityFields()` directly to render InspectionNotesSection structured inputs without further schema work
- Suspension select options are enforced at schema level; Plan 02 UI needs only render select inputs for fields where `inputType === 'select'`

---
*Phase: 09-pre-extraction-structured-inputs*
*Completed: 2026-03-21*
