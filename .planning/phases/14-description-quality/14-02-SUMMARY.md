---
phase: 14-description-quality
plan: 02
subsystem: api
tags: [openai, gpt-4o, description-generation, truck, earthmoving, templates]

# Dependency graph
requires:
  - phase: 14-01
    provides: normalizeFooter, TBC rule removed, DESCRIPTION_SYSTEM_PROMPT baseline
  - phase: 13-subtype-expansions
    provides: bulldozer key rename (dozer -> bulldozer), all 15 truck subtypes, all 12 earthmoving subtypes
provides:
  - Named ALL_CAPS template for every truck subtype (all 15 covered)
  - Named ALL_CAPS template for every earthmoving subtype (all 12 covered)
  - DOZER heading renamed to BULLDOZER in DESCRIPTION_SYSTEM_PROMPT
  - 9 new truck templates: FLAT DECK, CAB CHASSIS, REFRIGERATED PANTECH, BEAVERTAIL, TILT TRAY, VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP
  - 4 new earthmoving templates: COMPACTOR, DUMP TRUCK, TRENCHER, CRAWLER TRACTOR
affects: [describe-route, description-quality, gpt-4o-prompt]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ALL_CAPS heading pattern for GPT-4o template selection in DESCRIPTION_SYSTEM_PROMPT
    - Specialised body-specific buyer fields for VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP
    - CRAWLER TRACTOR distinct from BULLDOZER — drawbar/PTO/implements vs blade/ripper

key-files:
  created: []
  modified:
    - src/app/api/describe/route.ts
    - src/__tests__/describe-route.test.ts

key-decisions:
  - "DOZER heading renamed to BULLDOZER in DESCRIPTION_SYSTEM_PROMPT — matches schema key change from Phase 13"
  - "VACUUM TRUCK includes tank capacity, vacuum pump make/type/CFM, hose, water tank, waste type — specialised buyer fields"
  - "CONCRETE PUMP includes pump type (Line/Boom), reach dimensions (boom only), pipeline diameter, output m3/hr"
  - "CONCRETE AGITATOR includes drum capacity/speed, water tank, chute type"
  - "EWP (ELEVATED WORK PLATFORM) includes boom type, max working height, basket capacity, outriggers, certification status"
  - "CRAWLER TRACTOR emphasises drawbar, PTO, implements — does NOT include blade width, blade type, or ripper (bulldozer-specific)"

patterns-established:
  - "ALL_CAPS heading per subtype enables GPT-4o template selection by pattern matching"
  - "Specialised templates include body-specific buyer fields beyond the generic chassis+engine format"

requirements-completed: [TRUCK-02, DESC-02]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 14 Plan 02: Description Templates Summary

**13 new ALL_CAPS description templates added to DESCRIPTION_SYSTEM_PROMPT, giving GPT-4o named format guidance for all 15 truck subtypes and all 12 earthmoving subtypes, plus DOZER renamed to BULLDOZER.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-23T06:59:00Z
- **Completed:** 2026-03-23T06:59:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added 9 new truck templates: FLAT DECK, CAB CHASSIS, REFRIGERATED PANTECH, BEAVERTAIL, TILT TRAY, VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP (ELEVATED WORK PLATFORM)
- Added 4 new earthmoving templates: COMPACTOR, DUMP TRUCK, TRENCHER, CRAWLER TRACTOR
- Renamed DOZER heading to BULLDOZER — aligns with schema key from Phase 13
- All 276 tests pass (33 in describe-route.test.ts, 276 total across 26 test files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add template heading assertions (TDD RED)** - `111eaf6` (test)
2. **Task 2: Add 13 new templates + rename DOZER to BULLDOZER** - `fcbe359` (feat)

_Note: TDD — test commit (RED) followed by implementation commit (GREEN)._

## Files Created/Modified

- `src/app/api/describe/route.ts` — 13 new templates added to DESCRIPTION_SYSTEM_PROMPT, DOZER renamed to BULLDOZER (129 lines added, 1 changed)
- `src/__tests__/describe-route.test.ts` — 14 new heading assertions in new describe block (97 lines added)

## Decisions Made

- CRAWLER TRACTOR template is deliberately distinct from BULLDOZER: emphasises drawbar (Xt), PTO if fitted, and implements included — does NOT include blade width, blade type, or ripper (bulldozer-specific fields)
- EWP uses full name "ELEVATED WORK PLATFORM" in parentheses after "EWP" heading so GPT-4o has both short and long form for matching
- VACUUM TRUCK, CONCRETE PUMP, CONCRETE AGITATOR, EWP include specialised body-specific buyer fields beyond the generic chassis + engine format

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 15 truck subtypes and all 12 earthmoving subtypes now have named templates in DESCRIPTION_SYSTEM_PROMPT
- GPT-4o will generate consistent, correctly-formatted descriptions for all asset subtypes
- Phase 14 Plan 03 (if any) or Phase 15 can proceed

---
*Phase: 14-description-quality*
*Completed: 2026-03-23*
