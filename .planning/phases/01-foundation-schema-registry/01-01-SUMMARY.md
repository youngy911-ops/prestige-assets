---
phase: 01-foundation-schema-registry
plan: 01
subsystem: auth
tags: [nextjs, supabase, auth, middleware, tailwind, shadcn, vitest, testing-library]

# Dependency graph
requires: []
provides:
  - Next.js 15 project scaffold with App Router, TypeScript, Tailwind v4, shadcn/ui v4
  - Supabase BrowserClient (lib/supabase/client.ts) for client components
  - Supabase ServerClient (lib/supabase/server.ts) for server components/actions
  - Auth middleware (middleware.ts) redirecting unauthenticated requests to /login
  - Login page at /login with Slattery Auctions branding, email+password form
  - Protected app shell at / with New Asset button and empty state
  - Vitest test framework configured with jsdom and @testing-library
  - 4 passing unit tests (AUTH-01 x2, AUTH-02 x2)
affects: [01-02, 01-03, all-downstream-plans]

# Tech tracking
tech-stack:
  added:
    - next@16.1.7 (App Router)
    - react@19.2.3
    - "@supabase/ssr@^0.9.0"
    - "@supabase/supabase-js@^2.99.2"
    - tailwindcss@^4 (Tailwind v4)
    - shadcn@4.0.8 (shadcn/ui v4 with @base-ui/react)
    - lucide-react@^0.577.0
    - zod@^4.3.6
    - server-only
    - clsx, tailwind-merge, class-variance-authority
    - vitest@^4.1.0
    - "@testing-library/react, @testing-library/jest-dom, @testing-library/user-event"
    - "@vitejs/plugin-react"
    - jsdom
  patterns:
    - Supabase BrowserClient pattern via createBrowserClient from @supabase/ssr
    - Supabase ServerClient with import server-only guard and await cookies()
    - Middleware auth guard using supabase.auth.getUser() (not getSession)
    - TDD test stubs (RED) then implementation (GREEN) workflow
    - Dynamic import in test files after vi.mock() calls for client components

key-files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - middleware.ts
    - src/components/auth/LoginForm.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx
    - vitest.config.ts
    - vitest.setup.ts
    - src/__tests__/auth.test.ts
    - src/__tests__/middleware.test.ts
    - .env.local.example
  modified:
    - package.json (added test scripts, dependencies)
    - src/app/globals.css (brand colour overrides)
    - src/app/layout.tsx (Inter font, Slattery metadata)

key-decisions:
  - "shadcn v4 uses @base-ui/react instead of @radix-ui — Button component doesn't support asChild; used plain Link element styled with Tailwind for New Asset button"
  - "Tailwind v4 uses oklch color space — adapted plan's HSL CSS variables to oklch equivalents for brand colours (#166534, #14532D, #1E3A5F)"
  - "create-next-app refuses to scaffold into non-empty directory — scaffolded in /tmp then copied files to project root"
  - "middleware.test.ts imports middleware from ../../middleware (relative path from src/__tests__/) to avoid @supabase/ssr being resolved before vi.mock() replaces it"

patterns-established:
  - "Pattern: Supabase client in tests — vi.mock('@/lib/supabase/client') returns object with auth.signInWithPassword mock"
  - "Pattern: Dynamic import after mocks — const { Component } = await import('@/components/...') ensures mocks are applied before module loads"
  - "Pattern: Middleware test — vi.mock('@supabase/ssr') replaces createServerClient; import middleware after mock"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 7min
completed: 2026-03-17
---

# Phase 1 Plan 01: Foundation + Auth Summary

**Next.js 15 scaffold with Supabase SSR auth middleware, branded login page, and 4 passing unit tests covering AUTH-01 and AUTH-02**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T12:07:52Z
- **Completed:** 2026-03-17T12:14:52Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Working Next.js 15 App Router project with Tailwind v4, shadcn/ui v4, Inter font, and Slattery Auctions dark green brand
- Supabase auth wrappers (BrowserClient + ServerClient with server-only guard) and middleware redirecting unauthenticated requests to /login
- Login page at /login with "Slattery Auctions" heading, "Book-in tool" subheading, email/password form, loading spinner, and inline error display
- Protected app shell at / with "No assets yet" empty state and "New Asset" button
- 4 unit tests GREEN: AUTH-01 (LoginForm calls signInWithPassword correctly, shows error on failure) and AUTH-02 (middleware redirects unauthenticated, passes authenticated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold project, install deps, configure vitest, write Wave 0 test stubs** - `ccdb499` (feat)
2. **Task 2: Supabase clients, middleware, login page, app shell, tests GREEN** - `9e5fa43` (feat)

## Files Created/Modified
- `src/lib/supabase/client.ts` - createBrowserClient wrapper for client components
- `src/lib/supabase/server.ts` - createServerClient with server-only guard and await cookies()
- `middleware.ts` - Auth guard using supabase.auth.getUser(), redirects to /login
- `src/components/auth/LoginForm.tsx` - use client form with signInWithPassword, Loader2 spinner, error display
- `src/app/(auth)/login/page.tsx` - Public login route with Slattery branding
- `src/app/(app)/layout.tsx` - Server-side auth check layout for protected routes
- `src/app/(app)/page.tsx` - Asset list shell with empty state copy
- `src/app/globals.css` - Brand colour overrides (dark green #166534, navy #1E3A5F, oklch format for Tailwind v4)
- `src/app/layout.tsx` - Root layout with Inter font
- `vitest.config.ts` - jsdom environment, @/* alias, setupFiles
- `vitest.setup.ts` - @testing-library/jest-dom import
- `src/__tests__/auth.test.ts` - AUTH-01 tests (2 GREEN)
- `src/__tests__/middleware.test.ts` - AUTH-02 tests (2 GREEN)
- `.env.local.example` - Supabase env var template

## Decisions Made
- Used plain `<Link>` styled with Tailwind instead of shadcn Button with asChild for "New Asset" link — shadcn v4 uses @base-ui/react which doesn't support the asChild pattern
- Adapted brand CSS variables from HSL to oklch for Tailwind v4 compatibility (brand hex values remain correct: #166534, #14532D, #1E3A5F, #F87171)
- Scaffolded in /tmp then copied files to project root (create-next-app refuses non-empty directories)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded in /tmp due to non-empty project directory**
- **Found during:** Task 1 (scaffold)
- **Issue:** `create-next-app` refuses to scaffold into a directory with existing files (.claude/, .planning/)
- **Fix:** Scaffolded into /tmp/prestige_app then copied all files to project root
- **Files modified:** All scaffold files
- **Verification:** Project structure complete, `npm run dev` starts
- **Committed in:** ccdb499 (Task 1 commit)

**2. [Rule 3 - Blocking] Adapted CSS variables for Tailwind v4 oklch color space**
- **Found during:** Task 2 (globals.css)
- **Issue:** Plan specified HSL CSS variable overrides using `@tailwind base/components/utilities` directives — Tailwind v4 uses `@import "tailwindcss"` and oklch color space
- **Fix:** Converted brand hex values (#166534, #14532D, #1E3A5F, #F87171) to oklch equivalents and used Tailwind v4 CSS variable pattern
- **Files modified:** src/app/globals.css
- **Verification:** Brand colours applied, TypeScript clean, tests pass
- **Committed in:** 9e5fa43 (Task 2 commit)

**3. [Rule 3 - Blocking] Used styled Link instead of Button asChild for New Asset**
- **Found during:** Task 2 (app/(app)/page.tsx)
- **Issue:** shadcn v4 Button uses @base-ui/react which doesn't support the asChild prop pattern that the plan used
- **Fix:** Used a plain `<Link>` element with matching Tailwind classes for the "New Asset" navigation button
- **Files modified:** src/app/(app)/page.tsx
- **Verification:** TypeScript clean, visual result matches UI-SPEC spec
- **Committed in:** 9e5fa43 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3x Rule 3 - blocking)
**Impact on plan:** All auto-fixes required due to newer package versions (Next.js 16, shadcn v4, Tailwind v4). Core functionality matches plan specification exactly.

## Issues Encountered
- shadcn v4 (installed as part of Next.js 16 ecosystem) uses @base-ui/react primitives instead of @radix-ui — resolved by using native HTML/Next.js elements where asChild was needed
- Tailwind v4 CSS structure is significantly different from v3 — adapted variable syntax while preserving all brand colour values

## User Setup Required
None - no external service configuration required at this stage. Supabase credentials needed before app can authenticate (see .env.local.example).

## Next Phase Readiness
- Project scaffold complete, all dependencies installed
- Auth middleware and login page functional (pending Supabase project credentials)
- Protected app shell ready at / route
- Test infrastructure operational — 4 tests GREEN, framework ready for Plan 01-02 tests
- Plan 01-02 (DB schema + migrations) can proceed immediately

---
*Phase: 01-foundation-schema-registry*
*Completed: 2026-03-17*
