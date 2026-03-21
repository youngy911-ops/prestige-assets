---
phase: 01-foundation-schema-registry
plan: 02
subsystem: database
tags: [supabase, postgres, rls, migrations, server-actions, vitest, nextjs]

# Dependency graph
requires:
  - phase: 01-01
    provides: Supabase ServerClient (src/lib/supabase/server.ts) used by createAsset action
provides:
  - Supabase DB migration for assets + asset_photos tables with RLS policies
  - BRANCHES constant with 10 Australian branch locations (key/label pairs, BranchKey type)
  - createAsset() Server Action returning { assetId: string } | { error: string }
  - 11 unit tests covering DB migration structure and Server Action behaviour (ASSET-01)
affects: [01-03, all-downstream-plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase DB migration SQL in supabase/migrations/ with timestamped filenames
    - RLS enabled immediately after table creation (security-first ordering)
    - RLS on child table (asset_photos) via EXISTS subquery joining to parent (assets)
    - Server Action returns discriminated union { assetId } | { error } not throwing
    - revalidatePath('/assets') called on successful asset creation

key-files:
  created:
    - supabase/migrations/20260317000001_initial_schema.sql
    - src/lib/constants/branches.ts
    - src/lib/actions/asset.actions.ts
    - src/__tests__/db.test.ts
    - src/__tests__/asset.actions.test.ts
  modified: []

key-decisions:
  - "Files placed under src/lib/ (not root lib/) to match existing project convention established in 01-01 where src/lib/supabase/ was created"
  - "db.test.ts tests 8 behaviours (3 BRANCHES + 5 SQL) rather than the plan's stated 5 — BRANCHES tests were inlined into the same file per the plan's action block"

patterns-established:
  - "Pattern: createAsset returns discriminated union — caller checks 'error' in result, never catches exceptions from Server Actions"
  - "Pattern: RLS child table — asset_photos RLS uses EXISTS subquery to assets.user_id = auth.uid() (no direct user_id column on photos)"
  - "Pattern: BRANCHES constant — as const array with key/label, BranchKey type derived via (typeof BRANCHES)[number]['key']"

requirements-completed: [ASSET-01]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 1 Plan 02: DB Schema + createAsset Server Action Summary

**Supabase migration with assets + asset_photos tables, RLS ownership policies, BRANCHES constant, and createAsset() Server Action — 15 tests GREEN across all 4 test files**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T12:18:49Z
- **Completed:** 2026-03-17T12:24:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- DB migration file creates assets table (uuid, user_id, branch, asset_type, asset_subtype, fields jsonb, status, timestamps) with RLS restricting rows to auth.uid() = user_id
- asset_photos table with FK to assets and RLS via EXISTS subquery joining through to assets.user_id
- BRANCHES constant with all 10 Australian locations (Brisbane, Roma, Mackay, Newcastle, Sydney, Canberra, Melbourne, Perth, Adelaide, Karratha) and BranchKey type
- createAsset() Server Action with 'use server' directive, auth guard, insert to assets table, revalidatePath on success
- 15 tests GREEN across 4 files (auth + middleware + db + asset.actions)

## Task Commits

Each task was committed atomically with TDD RED then GREEN pattern:

1. **Task 1 RED - DB migration test stubs** - `e836c8c` (test)
2. **Task 1 GREEN - DB migration + BRANCHES constant** - `c8a68dd` (feat)
3. **Task 2 RED - createAsset test stubs** - `dbbaeb1` (test)
4. **Task 2 GREEN - createAsset Server Action** - `b3e3b6b` (feat)

_TDD tasks have separate RED/GREEN commits_

## Files Created/Modified
- `supabase/migrations/20260317000001_initial_schema.sql` - DB migration for assets + asset_photos with RLS and updated_at trigger
- `src/lib/constants/branches.ts` - BRANCHES constant (10 branches) and BranchKey type
- `src/lib/actions/asset.actions.ts` - createAsset Server Action with auth guard and Supabase insert
- `src/__tests__/db.test.ts` - 8 tests: BRANCHES structure (count, key format, uniqueness) + SQL file checks (file exists, RLS on both tables, policy, jsonb column)
- `src/__tests__/asset.actions.test.ts` - 3 tests: unauthenticated returns error, success returns assetId, insert failure returns error

## Decisions Made
- Files placed under `src/lib/` (not root `lib/`) to match existing project convention from 01-01 — the `@` alias resolves to `./src` so `@/lib/...` imports work correctly
- `db.test.ts` covers 8 behaviours instead of the plan's stated 5 — both BRANCHES tests and SQL tests were defined in the same file per the plan's action block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted file paths from lib/ to src/lib/ to match project convention**
- **Found during:** Task 1 (initial read of project structure)
- **Issue:** Plan specified files at `lib/constants/branches.ts` and `lib/actions/asset.actions.ts` (root-level lib/), but the project's `@` alias maps to `./src` and the existing Supabase clients are at `src/lib/supabase/`. Creating files at root `lib/` would break the `@/lib/...` import paths used in the plan's own code.
- **Fix:** Created all files under `src/lib/` — `src/lib/constants/branches.ts` and `src/lib/actions/asset.actions.ts`
- **Files modified:** Same files as planned, just under src/lib/ instead of lib/
- **Verification:** All imports resolve, TypeScript clean (npx tsc --noEmit passes), 15 tests GREEN
- **Committed in:** c8a68dd and b3e3b6b

---

**Total deviations:** 1 auto-fixed (1x Rule 3 - blocking)
**Impact on plan:** Import paths work correctly as specified in the plan. No functional difference.

## Issues Encountered
None — project structure deviation was caught before writing any files and resolved immediately.

## User Setup Required
None at this stage. DB migration needs to be applied to a Supabase project (via `supabase db push` or Supabase dashboard) once project credentials are configured.

## Next Phase Readiness
- DB migration ready to deploy to Supabase project
- createAsset() Server Action ready to be called from the New Asset wizard (Plan 01-03)
- BRANCHES constant ready for use in AssetSubtypeSelector and all branch-aware UI
- Test suite at 15 GREEN tests, foundation complete for Plan 01-03

---
*Phase: 01-foundation-schema-registry*
*Completed: 2026-03-17*

## Self-Check: PASSED

All files present, all 4 task commits verified in git log.
