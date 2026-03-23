---
phase: 16-subtype-schema-alignment
plan: 01
subsystem: ui
tags: [schema-registry, subtypes, salesforce, typescript]

# Dependency graph
requires: []
provides:
  - Truck subtypes array — 24 Salesforce-matching entries (service_truck, coupe, crane_truck, fuel_truck, garbage, hook_bin, skip_bin, stock_truck, tanker, tray_truck, water_truck added; tipper removed; Concrete - Agitator/Pump labels corrected)
  - Trailer subtypes array — 24 Salesforce-matching entries (extendable/drop_deck removed; 15 new entries added including walking_floor, refrigerated_curtainsider)
  - Earthmoving subtypes array — 19 Salesforce-matching entries (bulldozer+crawler_tractor merged into bulldozer_crawler_tractor; backhoe_loader renamed backhoe; telehandler/trencher removed)
  - Marine subtypes array — 10 Salesforce-matching entries (boat/yacht/jet_ski replaced with full marine taxonomy)
affects: [16-02, 16-03, description-templates, salesforce-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/schema-registry/schemas/truck.ts
    - src/lib/schema-registry/schemas/trailer.ts
    - src/lib/schema-registry/schemas/earthmoving.ts
    - src/lib/schema-registry/schemas/marine.ts

key-decisions:
  - "Coupe included in Truck, Trailer, Earthmoving, and Marine subtypes per Salesforce requirement — even though automotive-only in context"
  - "Bulldozer and Crawler Tractor merged into single bulldozer_crawler_tractor key with label 'Bulldozer/Crawler Tractor' (no spaces around slash)"
  - "Concrete labels use space-dash-space format: 'Concrete - Agitator' and 'Concrete - Pump' — exact Salesforce match"

patterns-established:
  - "Subtype arrays are sorted alphabetically by label"
  - "Merged concepts use slash in label with no surrounding spaces (Bulldozer/Crawler Tractor)"
  - "Compound category labels use space-slash-space (Conveyors / Stackers)"

requirements-completed: [SUBTYPE-01, SUBTYPE-02, SUBTYPE-03, SUBTYPE-07]

# Metrics
duration: 1min
completed: 2026-03-23
---

# Phase 16 Plan 01: Subtype Schema Alignment (Truck/Trailer/Earthmoving/Marine) Summary

**Four schema files updated to match Salesforce exactly — truck 15→24 subtypes, trailer 11→24, earthmoving 12→19, marine 3→10 — with merged bulldozer/crawler_tractor, renamed backhoe, and complete marine taxonomy**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-23T12:55:41Z
- **Completed:** 2026-03-23T12:57:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Truck subtypes aligned to 24 SF entries: `service_truck` replaces `service`, `tipper` removed, `coupe`/`crane_truck`/`fuel_truck`/`garbage`/`hook_bin`/`skip_bin`/`stock_truck`/`tanker`/`tray_truck`/`water_truck` added, "Concrete - Agitator" and "Concrete - Pump" labels corrected to include space-dash-space
- Trailer subtypes aligned to 24 SF entries: `extendable` and `drop_deck` removed, 15 new entries added including `walking_floor`, `refrigerated_curtainsider`, `car_carrier`, `dog`, `dolly`, `deck_widener`, `timber_jinker`, `side_tipper`
- Earthmoving subtypes aligned to 19 SF entries: `bulldozer` + `crawler_tractor` merged into `bulldozer_crawler_tractor`, `backhoe_loader` renamed to `backhoe`, `telehandler` and `trencher` removed, 8 new entries added
- Marine subtypes replaced entirely: 3-entry list (Boat/Yacht/Jet Ski) replaced with 10-entry Salesforce taxonomy including `personal_watercraft`, `trailer_boat`, `tug`, `barge`, `fishing_vessel`

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Truck and Trailer subtype arrays** - `f4f4289` (feat)
2. **Task 2: Replace Earthmoving and Marine subtype arrays** - `cda46ac` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/lib/schema-registry/schemas/truck.ts` — subtypes array replaced: 15 entries → 24 Salesforce-matching entries
- `src/lib/schema-registry/schemas/trailer.ts` — subtypes array replaced: 11 entries → 24 Salesforce-matching entries
- `src/lib/schema-registry/schemas/earthmoving.ts` — subtypes array replaced: 12 entries → 19 Salesforce-matching entries (bulldozer/crawler_tractor merged, backhoe renamed)
- `src/lib/schema-registry/schemas/marine.ts` — subtypes array replaced: 3 entries → 10 Salesforce-matching entries

## Decisions Made

- **Coupe included across all four schemas** — Salesforce requires this entry even though it is automotive-only in practice. Including exactly as specified.
- **bulldozer_crawler_tractor key** — Merges the old separate `bulldozer` and `crawler_tractor` entries into a single Salesforce-aligned key with label "Bulldozer/Crawler Tractor" (slash, no surrounding spaces).
- **Concrete label formatting** — Labels corrected from "Concrete Agitator"/"Concrete Pump" to "Concrete - Agitator"/"Concrete - Pump" (space-dash-space as required by Salesforce).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four schema files now have Salesforce-matching subtype arrays
- Plan 02 (Forklift/Agricultural/Other schemas) can proceed independently
- Plan 03 (test suite update) must run after Plans 01 and 02 — existing test assertions for subtype counts will fail until Plan 03 updates them (expected and documented in plan)
- Telehandler key removed from earthmoving — Plan 02 must add it to Forklift schema

---
*Phase: 16-subtype-schema-alignment*
*Completed: 2026-03-23*

## Self-Check: PASSED

- FOUND: src/lib/schema-registry/schemas/truck.ts
- FOUND: src/lib/schema-registry/schemas/trailer.ts
- FOUND: src/lib/schema-registry/schemas/earthmoving.ts
- FOUND: src/lib/schema-registry/schemas/marine.ts
- FOUND: .planning/phases/16-subtype-schema-alignment/16-01-SUMMARY.md
- Commits f4f4289 (task 1) and cda46ac (task 2) verified in git log
