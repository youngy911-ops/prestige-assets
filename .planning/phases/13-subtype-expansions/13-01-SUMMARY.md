---
phase: 13-subtype-expansions
plan: 01
subsystem: ui
tags: [schema-registry, subtypes, asset-types]

# Dependency graph
requires:
  - phase: 12-marine-asset-type
    provides: schema-registry pattern for adding asset types and subtypes
provides:
  - truck subtypes: 14-entry v1.3 list (prime_mover through service)
  - trailer subtypes: 11-entry v1.3 list (flat_deck through low_loader)
  - earthmoving subtypes: 10-entry v1.3 list (excavator through trencher)
  - general_goods subtypes: 5-entry v1.3 list (tools_equipment through miscellaneous)
affects: [14-description-quality, 15-prefill-bug-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subtype keys are snake_case stored in DB; labels are display strings shown in UI"
    - "Subtypes array is the single source of truth — updating schema file updates entire app"

key-files:
  created: []
  modified:
    - src/lib/schema-registry/schemas/truck.ts
    - src/lib/schema-registry/schemas/trailer.ts
    - src/lib/schema-registry/schemas/earthmoving.ts
    - src/lib/schema-registry/schemas/general-goods.ts

key-decisions:
  - "skid_steer_loader (not skid_steer) and backhoe_loader (not backhoe) — full compound names for earthmoving subtypes"
  - "motor_grader (not grader) — more precise compound key for earthmoving"
  - "general_goods 'general' key removed entirely — replaced with 5 specific category subtypes"

patterns-established:
  - "Only subtypes array is modified — fields, hasGlassValuation, descriptionTemplate, assetType, displayName are always preserved"

requirements-completed: [TRUCK-01, TRAIL-01, EARTH-01, GOODS-01]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 13 Plan 01: Subtype Expansions Summary

**Four schema files updated with v1.3 subtype lists: truck (5→14), trailer (6→11), earthmoving (7→10), general_goods (1→5) — UI selectors updated app-wide with no further changes needed**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-22T08:13:00Z
- **Completed:** 2026-03-22T08:13:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- truck.ts: expanded from 5 to 14 subtypes; removed rigid_truck, crane_truck, service_truck; added flat_deck, cab_chassis, pantech, refrigerated_pantech, curtainsider, beavertail, tilt_tray, vacuum, concrete_pump, concrete_agitator, ewp, service
- trailer.ts: expanded from 6 to 11 subtypes; removed flat_top, side_tipper, dog_trailer, b_double, semi_trailer; added side_loader, tipper, extendable, skel, pig, plant, tag, box, low_loader
- earthmoving.ts: expanded from 7 to 10 subtypes; replaced bare skid_steer/grader/backhoe with compound keys skid_steer_loader/motor_grader/backhoe_loader; added compactor, dump_truck, trencher
- general-goods.ts: expanded from 1 to 5 subtypes; replaced 'general' with tools_equipment, attachments, workshop_equipment, office_it, miscellaneous; fields array unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace truck and trailer subtypes** - `083252b` (feat)
2. **Task 2: Replace earthmoving and general goods subtypes** - `709ded4` (feat)

## Files Created/Modified
- `src/lib/schema-registry/schemas/truck.ts` - subtypes 5→14 entries
- `src/lib/schema-registry/schemas/trailer.ts` - subtypes 6→11 entries
- `src/lib/schema-registry/schemas/earthmoving.ts` - subtypes 7→10 entries
- `src/lib/schema-registry/schemas/general-goods.ts` - subtypes 1→5 entries

## Decisions Made
- skid_steer_loader, motor_grader, backhoe_loader used as compound keys (not bare skid_steer/grader/backhoe) for earthmoving — more precise and consistent with naming conventions
- general_goods 'general' catch-all key removed and replaced with 5 categorical subtypes per v1.3 research

## Deviations from Plan

None - plan executed exactly as written.

Note: The schema-registry test for `general_goods has exactly 1 subtype with key "general"` (line 26-29) fails as expected — this stale assertion is fixed in Plan 02.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four schema subtypes arrays are updated to v1.3 values
- Plan 02 (test suite update) must fix the stale `general_goods` assertion before running full suite
- Phase 14 (Description Quality) can proceed once Plan 02 is complete

---
*Phase: 13-subtype-expansions*
*Completed: 2026-03-22*

## Self-Check: PASSED

- truck.ts: FOUND
- trailer.ts: FOUND
- earthmoving.ts: FOUND
- general-goods.ts: FOUND
- Commit 083252b: FOUND
- Commit 709ded4: FOUND
