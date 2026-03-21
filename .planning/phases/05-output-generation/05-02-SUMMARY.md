---
phase: 05-output-generation
plan: "02"
subsystem: api
tags: [ai, gpt-4o, vercel-ai-sdk, supabase, migration, tdd]

# Dependency graph
requires:
  - phase: 03-ai-extraction
    provides: /api/extract pattern — generateText + signed URL generation template
  - phase: 04-review-form-save
    provides: saveReview server action — patched to clear cached description
provides:
  - POST /api/describe — GPT-4o plain text description generation with user_id guard
  - assets.description nullable text column (migration applied)
  - saveReview clears description on re-review (stale prevention)
affects: [05-output-generation, 05-03-output-page, output-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - generateText (not Output.object) for plain text AI output — mirrors extract but uses text not output
    - DESCRIPTION_SYSTEM_PROMPT constant — verbatim prompt from planning doc imported into route
    - buildDescriptionUserPrompt helper — formats confirmed fields + inspection_notes as user message
    - Nullable DB column as cache invalidation signal — null triggers regeneration on page load

key-files:
  created:
    - supabase/migrations/20260319000005_description_column.sql
    - src/app/api/describe/route.ts
    - src/__tests__/describe-route.test.ts
  modified:
    - src/lib/actions/review.actions.ts

key-decisions:
  - "generateText (not Output.object) used for /api/describe — plain text output, no schema needed"
  - "description: null in saveReview clears cached description on every re-review — output page always regenerates for fresh field values"
  - "user_id guard on update in addition to RLS — defense in depth, mirrors saveReview pattern"

patterns-established:
  - "Plain text AI routes: generateText, read result.text, no Output.object"
  - "Cache invalidation via nullable column: null = not generated, truthy = cached"

requirements-completed: [SF-02]

# Metrics
duration: 8min
completed: 2026-03-21
---

# Phase 05 Plan 02: Description Route Handler Summary

**POST /api/describe with GPT-4o plain text generation, assets.description migration, and saveReview stale-clear patch**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-21T00:08:00Z
- **Completed:** 2026-03-21T00:16:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- DB migration adds nullable `assets.description` text column (applied to remote DB)
- `saveReview` patched to set `description: null` on every save — output page always regenerates from current field values, never shows stale descriptions
- `POST /api/describe` route implemented with verbatim DESCRIPTION_SYSTEM_PROMPT (~180 lines), photo signed URL integration, and `user_id` ownership guard
- TDD: 6 describe-route tests cover auth, bad input, 404, generateText call verification, DB persist check, and response shape

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration + saveReview stale-clear patch** - `207438e` (feat)
2. **Task 2: /api/describe Route Handler + describe-route tests** - `05b51bd` (feat)

## Files Created/Modified

- `supabase/migrations/20260319000005_description_column.sql` — adds nullable `description text` column to assets table
- `src/lib/actions/review.actions.ts` — `description: null` added to update payload to clear cached description on save
- `src/app/api/describe/route.ts` — POST handler: auth, request parse, asset/photo load, signed URLs, GPT-4o generateText call, DB persist with user_id guard
- `src/__tests__/describe-route.test.ts` — upgraded from Wave 0 `.todo` scaffold to 6 passing tests

## Decisions Made

- `generateText` used (not `Output.object`) for plain text description — matches the extract route pattern but reads `result.text` instead of `result.output`
- `description: null` in saveReview clears cached description on re-review so output page always regenerates for fresh field values
- `user_id` guard on update in addition to RLS — defense in depth, same pattern as saveReview

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Pre-existing `PhotoUploadZone.test.tsx` failure (missing `capture="environment"` on empty-state input) was present before this plan's changes. Already documented in `deferred-items.md` from 05-01. Not caused by this plan's changes and out of scope.

## Next Phase Readiness

- `/api/describe` route is complete and tested — ready for output page to call it
- `assets.description` column exists in DB for storage and cache-hit checks
- Plan 05-03 (output page) can call `POST /api/describe` and display the returned description

---
*Phase: 05-output-generation*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: supabase/migrations/20260319000005_description_column.sql
- FOUND: src/app/api/describe/route.ts
- FOUND: src/__tests__/describe-route.test.ts
- FOUND: commit 207438e (Task 1)
- FOUND: commit 05b51bd (Task 2)
