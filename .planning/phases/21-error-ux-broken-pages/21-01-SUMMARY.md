---
phase: 21-error-ux-broken-pages
plan: 01
subsystem: ui
tags: [error-boundaries, next-js, tailwind, lucide-react, vitest]

requires: []
provides:
  - Shared ErrorDisplay component (icon/title/message/actions/details toggle)
  - App error boundary with classifyError (auth/asset/server) and contextual copy
  - Auth error boundary with session-expired messaging and /login recovery action
  - Polished global-error.tsx with "Go to home" link and "Show details" toggle
  - Dead edit-type route removed from disk
  - error-boundaries.test.tsx with 12 content-contract assertions
affects: [phase-22, phase-23]

tech-stack:
  added: []
  patterns:
    - "buttonVariants used to style Link elements as buttons (base-ui Button has no asChild prop)"
    - "Error boundary classifyError pattern: inspects error.message.toLowerCase() for auth/asset/server keywords"
    - "global-error.tsx keeps inline styles only — CSS not loaded at this boundary level"
    - "ErrorDisplay shared component accepts icon/title/message/actions as props, renders Show details toggle via native <details>"

key-files:
  created:
    - src/components/error/ErrorDisplay.tsx
    - src/__tests__/error-boundaries.test.tsx
  modified:
    - src/app/(app)/error.tsx
    - src/app/(auth)/error.tsx
    - src/app/global-error.tsx
  deleted:
    - src/app/(app)/assets/[id]/edit-type/page.tsx

key-decisions:
  - "Used buttonVariants + Link instead of Button asChild — @base-ui/react/button uses render prop pattern, not Radix asChild"
  - "global-error.tsx inline styles preserved — CSS not loaded at root error boundary, Tailwind unavailable"
  - "ErrorDisplay className prop lets callers set max-width and top padding for different contexts"

patterns-established:
  - "buttonVariants: import and apply to Link className for button-styled navigation in error contexts"
  - "Error classification: classifyError(error) returns auth|asset|server from message keywords"

requirements-completed: [ERR-01, ERR-02]

duration: 8min
completed: 2026-04-16
---

# Phase 21 Plan 01: Error UX & Broken Pages Summary

**Shared ErrorDisplay scaffold with contextual app/auth error boundaries (classifyError auth/asset/server), polished global-error with "Go to home" link, and deleted dead edit-type route — all tests green**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-16T12:07:00Z
- **Completed:** 2026-04-16T12:09:30Z
- **Tasks:** 2
- **Files modified:** 6 (5 modified + 1 deleted + 2 created)

## Accomplishments

- Created `ErrorDisplay` shared component with icon/title/message/actions layout and native `<details>` "Show details" toggle including digest display
- Rewrote app error boundary with `classifyError` function (auth/asset/server) and distinct headings, body copy, and recovery actions per type
- Auth error boundary shows "Your session has expired" with "Sign in again" → /login
- Polished `global-error.tsx` with contextual body copy, "Show details" toggle, and "Go to home" link — all inline styles only
- Deleted dead `edit-type/page.tsx` stub with zero inbound references remaining
- Added `error-boundaries.test.tsx` (12 tests) — all pass alongside brand smoke tests (11 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ErrorDisplay component and upgrade app + auth error boundaries** - `38b3358` (feat)
2. **Task 2: Polish global-error.tsx, delete edit-type route, add tests** - `092a4ba` (feat)

## Files Created/Modified

- `src/components/error/ErrorDisplay.tsx` - Shared error layout with icon/title/message/actions/details toggle
- `src/app/(app)/error.tsx` - App error boundary with classifyError and contextual copy per error type
- `src/app/(auth)/error.tsx` - Auth error boundary with session-expired messaging
- `src/app/global-error.tsx` - Polished last-resort boundary with "Go to home" link and "Show details"
- `src/__tests__/error-boundaries.test.tsx` - 12 content-contract assertions (file-system based)
- `src/app/(app)/assets/[id]/edit-type/page.tsx` - DELETED (dead stub route)

## Decisions Made

- **buttonVariants + Link pattern:** `@base-ui/react/button` uses a `render` prop not `asChild`, so `Button asChild` is not supported. Used `buttonVariants({ variant, size })` applied to Next.js `Link` className instead — same visual result.
- **global-error.tsx stays inline-only:** CSS/Tailwind not loaded at root error boundary level; preserving existing inline style pattern with brand hex `#0f1f0f` and `#3a7a3a`.
- **ErrorDisplay className prop:** Callers set `max-w-[480px] pt-16` (app) or `max-w-[360px] pt-24` (auth) to keep each context's spacing without baking it into the shared component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced Button asChild with buttonVariants + Link**
- **Found during:** Task 1 (creating app + auth error boundaries)
- **Issue:** Plan specified `<Button asChild variant="default"><Link>` but `@base-ui/react/button` has no `asChild` prop — it uses a `render` prop API. Using `asChild` would silently pass through an unrecognised prop.
- **Fix:** Used `buttonVariants({ variant: 'default', size: 'lg' })` applied to Next.js `Link` className, achieving identical visual styling with correct link semantics.
- **Files modified:** src/app/(app)/error.tsx, src/app/(auth)/error.tsx
- **Verification:** Brand smoke tests pass, no TypeScript errors
- **Committed in:** 38b3358 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug/incorrect API usage)
**Impact on plan:** Necessary correctness fix. No scope creep. Output matches plan intent exactly.

## Issues Encountered

None beyond the asChild deviation above.

## Next Phase Readiness

- Error UX foundation is complete and demo-ready
- All error boundaries provide contextual guidance and recovery actions
- No dead routes remain in the app
- Phase 22 and 23 can proceed independently

---
*Phase: 21-error-ux-broken-pages*
*Completed: 2026-04-16*
