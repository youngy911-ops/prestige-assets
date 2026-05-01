---
phase: 26-extraction-accuracy-audit
plan: 02
subsystem: ai
tags: [gpt-4o, system-prompt, describe-route, general-goods, attachments]

# Dependency graph
requires:
  - phase: 26-extraction-accuracy-audit
    provides: Phase 26 roadmap and plan set for extraction accuracy improvements
provides:
  - Subtype-specific description guidance for 8 general goods categories in DESCRIPTION_SYSTEM_PROMPT
affects: [describe-route, gpt-4o output quality, general-goods, attachments]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subtype-branching within a single system prompt section — one heading with named sub-blocks, each listing priority specs and an example"

key-files:
  created: []
  modified:
    - src/app/api/describe/route.ts

key-decisions:
  - "Replace the flat 8-line ATTACHMENTS / GENERAL GOODS block with named subtype sections (GENERATORS, COMPRESSORS, TOOLS, TOOLBOXES, CATERING, MEDICAL, IT, OFFICE, AGRICULTURE, EARTHMOVING, MISCELLANEOUS) plus a UNIVERSAL RULES footer — more guidance per subtype without creating a separate asset type"
  - "Earthmoving attachments close with 'Sold As Is, Untested.' (not 'Unregistered') — explicit note added to prevent GPT-4o from copying the vehicle close"
  - "Keep 'Sold As Is, Untested.' as the final line of the section (plan requirement) so the section delimiter is unambiguous"

patterns-established:
  - "Subtype guidance pattern: each category block names the subtype enum value(s), lists 4-6 spec lines in priority order, and where useful includes a one-line example description"

requirements-completed: [EXTRACT-03]

# Metrics
duration: 8min
completed: 2026-04-30
---

# Phase 26 Plan 02: Extraction Accuracy Audit — General Goods Template Expansion Summary

**DESCRIPTION_SYSTEM_PROMPT ATTACHMENTS / GENERAL GOODS section expanded from 8 generic lines to 11 named subtype blocks (generators, compressors, tools, toolboxes, catering, medical, IT, office, agriculture attachments, earthmoving attachments, miscellaneous) each listing priority spec lines for GPT-4o**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-30T10:09:00Z
- **Completed:** 2026-04-30T10:17:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced flat generic template with 11 subtype-specific blocks covering all common general goods categories
- Each block specifies the expected spec lines (e.g. generators: kVA, fuel type, engine make/model, enclosure type, hours; IT: per-item vs. pallet-lot branching with data-state note)
- Added UNIVERSAL RULES footer that consolidates cross-cutting rules (confirm-from-evidence, condition notes, "Sold As Is, Untested." close)
- Earthmoving attachments block explicitly notes NOT to use "Unregistered" — preventing GPT-4o from copying the vehicle close formula
- All 404 tests continue to pass; MARINE section preserved with blank line separator

## Task Commits

1. **Task 1: Expand general goods description template** - `a615b27` (feat)

**Plan metadata:** committed with SUMMARY in final docs commit

## Files Created/Modified
- `src/app/api/describe/route.ts` — DESCRIPTION_SYSTEM_PROMPT ATTACHMENTS / GENERAL GOODS section expanded (+93 lines, -24 lines)

## Decisions Made
- Chose to write subtype blocks inline within the existing section heading rather than creating separate PLAN headings — keeps the prompt cohesive and avoids confusing GPT-4o with a new asset type it would need to route to
- Earthmoving and compressors both map to `subtype: plant_equipment`, so both are documented under that subtype label to aid keyword matching

## Deviations from Plan

None — plan executed exactly as written. The stash-pop during baseline testing surfaced pre-existing unstaged Phase 26-01 changes (marine.ts, extraction-schema.ts, caravan.ts) but these were not staged or committed as part of this plan.

## Issues Encountered
- On first full test run after stash-pop, one test in `extraction-schema.test.ts` appeared to fail (expected 19 marine AI-extractable fields, got 18). Re-running the isolated test file immediately showed 29/29 passing — confirmed to be a Vitest module cache warm-up issue, not a real regression. Subsequent full suite run: 404/404 passing.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 26 plan 02 complete; general goods descriptions will now be subtype-aware
- Pre-existing Phase 26-01 changes (marine fuel_type field, extraction-schema exterior scan guidance) remain unstaged — these should be committed as part of Phase 26-01 completion
- No blockers for further work

---
*Phase: 26-extraction-accuracy-audit*
*Completed: 2026-04-30*
