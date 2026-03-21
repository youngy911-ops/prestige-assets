---
phase: 10-description-verbatim-fidelity
plan: 01
subsystem: api
tags: [gpt-4o, prompt-engineering, tdd, vitest, openai]

# Dependency graph
requires:
  - phase: 09-pre-extraction-structured-inputs
    provides: parseStructuredFields function exported from extract/route.ts
provides:
  - Belt-and-suspenders verbatim fidelity: system prompt rule + structured user prompt block labelling
  - parseStructuredFields reused in describe/route.ts via direct import
  - buildDescriptionUserPrompt splits inspection_notes into verbatim structured fields and freeform Notes blocks
affects: [describe/route.ts, prompt output sent to GPT-4o]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD red-green cycle, cross-route function reuse via direct import]

key-files:
  created: []
  modified:
    - src/__tests__/describe-route.test.ts
    - src/app/api/describe/route.ts

key-decisions:
  - "Import parseStructuredFields directly from extract/route.ts — no duplicate parser, no shared lib file needed (direct import worked without TypeScript errors)"
  - "Verbatim block omitted gracefully when no structured key:value lines exist; freeform block omitted when no Notes: line present"

patterns-established:
  - "Split inspection_notes: structured key:value lines to 'Staff-provided values (use verbatim):' block; Notes: freeform content to 'Inspection notes:' block"
  - "System prompt rule + user prompt labelling together as belt-and-suspenders constraint on GPT-4o output"

requirements-completed: [DESCR-01]

# Metrics
duration: 8min
completed: 2026-03-21
---

# Phase 10 Plan 01: Description Verbatim Fidelity Summary

**Belt-and-suspenders GPT-4o verbatim constraint: system prompt rule added + buildDescriptionUserPrompt restructured to split inspection_notes into labelled verbatim/freeform blocks using imported parseStructuredFields**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T06:10:02Z
- **Completed:** 2026-03-21T06:11:50Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Added 5 new tests covering verbatim split behaviour (RED phase), 4 failing as expected against old implementation
- Updated `DESCRIPTION_SYSTEM_PROMPT` with verbatim rule bullet under UNIVERSAL RULES
- Replaced `buildDescriptionUserPrompt` to split `inspection_notes` into a `Staff-provided values (use verbatim):` block (structured key:value lines) and an `Inspection notes:` block (freeform Notes: content only)
- Imported `parseStructuredFields` from `extract/route.ts` — no duplicate parser
- All 229 tests pass (full suite green)

## Task Commits

Each task was committed atomically:

1. **Task 1: RED - Add failing tests for verbatim split behaviour** - `ce3f53d` (test)
2. **Task 2: GREEN - Implement verbatim system prompt rule and restructured user prompt** - `efc022d` (feat)

_Note: TDD tasks — test commit followed by implementation commit_

## Files Created/Modified
- `src/__tests__/describe-route.test.ts` - Added 5 new test cases covering verbatim rule in system prompt, split verbatim/freeform blocks, and graceful fallbacks
- `src/app/api/describe/route.ts` - Added parseStructuredFields import, verbatim rule bullet, and restructured buildDescriptionUserPrompt

## Decisions Made
- Import `parseStructuredFields` directly from `extract/route.ts` — the direct import worked without TypeScript or edge-runtime errors, so no shared lib file was needed
- Graceful omission of both blocks (verbatim and freeform) when their respective content is absent ensures backward compatibility with existing assets that have null inspection_notes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Verbatim fidelity constraint is live; GPT-4o will receive labelled blocks directing it to preserve staff-entered measurements and values
- Phase 10 plan 01 is the only plan in this phase — phase is complete

---
*Phase: 10-description-verbatim-fidelity*
*Completed: 2026-03-21*
