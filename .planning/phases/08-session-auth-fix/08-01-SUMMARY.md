---
phase: 08-session-auth-fix
plan: 01
subsystem: auth
tags: [nextjs, middleware, supabase, routing, vitest]

# Dependency graph
requires: []
provides:
  - Authenticated users reach asset list at / without redirect loop
  - Authenticated users at /login are redirected to /
  - Post-login redirect goes to / (asset list) not /assets/new
  - 6 auth routing tests covering both guard directions
affects: [09-prefill, 10-copy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bidirectional auth routing: unauthenticated-to-login AND authenticated-to-root guards in middleware"
    - "Stable vi.fn() references declared outside mock factory for assertable router mocks"

key-files:
  created:
    - src/__tests__/middleware.test.ts (extended — new test added)
    - src/__tests__/auth.test.ts (extended — new test added, mock refactored)
  modified:
    - middleware.ts
    - src/components/auth/LoginForm.tsx
  deleted:
    - src/app/page.tsx

key-decisions:
  - "Delete src/app/page.tsx entirely rather than replacing — (app) route group page.tsx becomes the sole / handler"
  - "Inverse guard placed after existing unauthenticated guard in middleware — order preserves current redirect behaviour"

patterns-established:
  - "Middleware auth guard pattern: both directions — unauthenticated-to-login AND authenticated-to-root"
  - "Router mock pattern: declare mockPush/mockRefresh outside vi.mock factory for stable assertable references"

requirements-completed: [AUTH-01]

# Metrics
duration: 5min
completed: 2026-03-21
---

# Phase 8 Plan 01: Session Auth Fix Summary

**Deleted conflicting root redirect, added bidirectional middleware auth guards, and fixed post-login destination — resolving the authenticated-user redirect loop at /**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-21T03:50:24Z
- **Completed:** 2026-03-21T03:51:45Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 deleted)

## Accomplishments
- Deleted src/app/page.tsx which was redirecting all / traffic to /login regardless of auth state
- Added inverse guard to middleware.ts: authenticated users at /login are now redirected to /
- Changed LoginForm.tsx post-login redirect from /assets/new to / (asset list)
- Refactored useRouter mock in auth.test.ts to use stable vi.fn() references for assertability
- All 220 tests pass; 6 dedicated auth routing tests cover both redirect directions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add failing test cases for new auth routing behaviour** - `bd57ea2` (test)
2. **Task 2: Apply the three surgical auth routing fixes** - `cdb8bbc` (feat)

**Plan metadata:** (docs commit follows)

_Note: Task 1 used TDD RED phase — tests committed before implementation to confirm failure_

## Files Created/Modified
- `src/__tests__/middleware.test.ts` - Added test: authenticated user at /login redirects to /
- `src/__tests__/auth.test.ts` - Refactored useRouter mock (stable references); added redirect-to-/ test
- `middleware.ts` - Added inverse auth guard (authenticated user at /login → redirect to /)
- `src/components/auth/LoginForm.tsx` - Changed router.push('/assets/new') to router.push('/')
- `src/app/page.tsx` - DELETED (was redirect("/login") — caused auth loop)

## Decisions Made
- Deleted src/app/page.tsx entirely rather than replacing with redirect or stub — the (app) route group's page.tsx at src/app/(app)/page.tsx becomes the sole handler for /
- Inverse guard placed after the existing unauthenticated guard in middleware — ordering is correct and preserves existing redirect behaviour

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth routing is fully fixed. Authenticated users navigate to / and see the asset list.
- Phase 9 (pre-fill) and Phase 10 (copy) can now be tested without false redirect loops.
- Phase 9 pre-decision still pending: confirm field label conventions (Forklift "Unladen Weight" vs `truck_weight`; Caravan length ft vs metric).

---
*Phase: 08-session-auth-fix*
*Completed: 2026-03-21*
