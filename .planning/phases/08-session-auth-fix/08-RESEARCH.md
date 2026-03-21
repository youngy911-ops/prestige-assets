# Phase 8: Session Auth Fix - Research

**Researched:** 2026-03-21
**Domain:** Next.js App Router routing, Supabase SSR middleware, authentication guards
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Delete `src/app/page.tsx` — the unconditional `redirect('/login')` conflicts with `src/app/(app)/page.tsx` (the real assets list at `/`). After deletion, `src/app/(app)/page.tsx` becomes the sole handler for `/`. Do NOT add a replacement root page.
- Keep BOTH the middleware check AND the AppLayout server-component check (belt-and-suspenders). This is the Supabase SSR recommended pattern — do not consolidate to middleware only.
- Middleware: add inverse guard — authenticated users hitting `/login` should be redirected to `/`. Current middleware only handles unauthenticated → `/login`.
- `LoginForm.tsx` post-login redirect: change `router.push('/assets/new')` to `router.push('/')`.

### Claude's Discretion
- Login page UX during auth check: no loading state needed — middleware handles the redirect server-side before the login page renders.
- Session expiry handling: silent redirect to `/login` on next navigation (middleware catches expired session); no mid-workflow warning needed.
- Auth error handling: if `supabase.auth.getUser()` fails (network error), treat as unauthenticated and redirect to login.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Authenticated user can navigate to the asset list via the Assets tab without being redirected to login | Root cause identified: `src/app/page.tsx` unconditionally redirects to `/login`, intercepting the route before `(app)/page.tsx` can serve it. Three surgical fixes address all three success criteria. |
</phase_requirements>

---

## Summary

Phase 8 is a pure routing correctness fix with no new UI, no schema changes, and no new dependencies. The bug has a clear root cause: `src/app/page.tsx` contains an unconditional `redirect('/login')` that fires for every request to `/`, including authenticated ones, before the Next.js App Router can match the `(app)` route group's page at the same path.

The fix is three surgical changes: delete the conflicting root page, patch the middleware to redirect authenticated users away from `/login`, and update the post-login redirect destination from `/assets/new` to `/`. All three changes are in already-read code, all relevant patterns are established in the codebase, and the test suite already has dedicated test files for both middleware and LoginForm that need updating to cover the new behaviour.

**Primary recommendation:** Delete `src/app/page.tsx`, add one guard condition to `middleware.ts`, change one string in `LoginForm.tsx`. No new files, no new dependencies, no new UI.

---

## Standard Stack

### Core (already installed — no installation required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | installed | Server-side Supabase client (middleware + layouts) | Official Supabase SSR pattern; uses `getUser()` not `getSession()` |
| `next/navigation` | Next.js 15 | `redirect()` for server components, `useRouter` for client | App Router standard |
| `next/server` | Next.js 15 | `NextResponse`, `NextRequest` in middleware | App Router standard |

### No New Libraries Needed

This phase touches no new problem domains. All required tools are already present and in use.

---

## Architecture Patterns

### Root Cause: Route Priority Conflict

```
src/app/
├── page.tsx          ← PROBLEM: matches "/" unconditionally, redirects to /login
├── (app)/
│   ├── layout.tsx    ← auth guard (keep as-is)
│   └── page.tsx      ← REAL "/" handler: asset list
└── (auth)/
    └── login/
        └── page.tsx
```

Next.js App Router evaluates `src/app/page.tsx` before route group pages when both exist for the same path. The unconditional `redirect('/login')` in `src/app/page.tsx` intercepts every request to `/`, even from authenticated users, before `(app)/page.tsx` can be rendered. Deleting `src/app/page.tsx` removes the conflict — `(app)/page.tsx` then becomes the sole handler for `/`.

### Pattern 1: Supabase SSR Belt-and-Suspenders Auth

**What:** Two independent auth checks for every protected route — middleware (fast, catches most cases) and server component layout (authoritative, catches edge cases like middleware bypass or cookie staleness).

**When to use:** Always, for any SSR-protected route. Do not remove the AppLayout check even though middleware covers the same ground.

**Current middleware (lines 22-25):**
```typescript
// Source: middleware.ts (verified by direct read)
const { data: { user } } = await supabase.auth.getUser()
if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

**After patch — add inverse guard:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
if (user && request.nextUrl.pathname.startsWith('/login')) {
  return NextResponse.redirect(new URL('/', request.url))
}
```

### Pattern 2: `getUser()` not `getSession()`

**What:** The codebase already uses `supabase.auth.getUser()` everywhere (middleware line 22, AppLayout line 7). This is correct — `getUser()` validates the JWT against the Supabase auth server on every call, while `getSession()` trusts the local cookie without server validation.

**Why it matters here:** No change needed — existing pattern is correct. Do not introduce `getSession()`.

### Pattern 3: Client-side post-login redirect

**What:** `LoginForm.tsx` uses `router.push('/assets/new')` followed by `router.refresh()`. The `router.refresh()` is required to force the server components (AppLayout's auth check) to re-run with the newly set session cookie.

**After patch:**
```typescript
// Source: src/components/auth/LoginForm.tsx line 29 (verified by direct read)
// Change: '/assets/new' → '/'
router.push('/')
router.refresh()
```

The `router.refresh()` call must be kept.

### Anti-Patterns to Avoid

- **Replacing the deleted page.tsx with a redirect to `(app)/page.tsx`:** The `(app)` route group handles the redirect already via the layout's auth guard. Adding a new redirect creates another conflict.
- **Removing the AppLayout auth guard:** Middleware-only is explicitly rejected by the locked decisions. The double-check is intentional.
- **Using `getSession()` instead of `getUser()`:** The existing codebase uses `getUser()` for security reasons; do not introduce `getSession()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth-aware routing | Custom redirect logic | Middleware + AppLayout pattern already in codebase | Cookie handling, PKCE flow, refresh token rotation are all handled by `@supabase/ssr` |
| Session validation | JWT parsing | `supabase.auth.getUser()` | Server-side validation against Supabase auth server |

---

## Common Pitfalls

### Pitfall 1: Forgetting `router.refresh()` after post-login redirect

**What goes wrong:** The client navigates to `/` but the server components (AppLayout) still see no session cookie because the React cache hasn't been invalidated. AppLayout's `supabase.auth.getUser()` returns null and redirects back to `/login`, creating an infinite loop.

**Why it happens:** Next.js App Router caches server component renders. `router.push()` alone does not invalidate the server cache.

**How to avoid:** Keep both `router.push('/')` AND `router.refresh()` in LoginForm on success — the existing code already has `router.refresh()` on line 30, only the push destination changes.

**Warning signs:** Login appears to succeed (no error shown) but user ends up back at `/login`.

### Pitfall 2: Middleware returning `supabaseResponse` vs `NextResponse.redirect()`

**What goes wrong:** Returning the wrong response object causes session cookies to not be forwarded, breaking auth state on subsequent requests.

**Why it happens:** The `supabaseResponse` object is constructed by the `setAll` cookie handler in the middleware setup. If you return a bare `NextResponse.redirect()` without the session cookies, the client loses the session.

**How to avoid:** The new guard condition uses `NextResponse.redirect(new URL('/', request.url))` — this is correct for a redirect (it's a new response that the browser follows, so there's no cookie to forward). The existing unauthenticated redirect uses the same pattern and is correct.

**Warning signs:** User gets redirected correctly once, then loses their session on the next request.

### Pitfall 3: Route group overlap with root page

**What goes wrong:** If any `src/app/page.tsx` exists alongside `src/app/(app)/page.tsx`, Next.js will throw a build error or silently prefer the non-grouped page.

**How to avoid:** Verify `src/app/page.tsx` is fully deleted after the task — `git status` should show it as deleted.

**Warning signs:** Build warning "Conflicting pages" or authenticated users still hitting redirect loops.

---

## Code Examples

### Middleware after patch (complete file)

```typescript
// Source: middleware.ts (verified by direct read — patch adds lines 23-25)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### LoginForm success handler after patch

```typescript
// Source: src/components/auth/LoginForm.tsx lines 28-31 (verified by direct read)
// Only change: '/assets/new' → '/'
} else {
  router.push('/')
  router.refresh()
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `getSession()` for server auth | `getUser()` (validates server-side) | Security — codebase already uses correct approach |
| Pages Router middleware | App Router middleware.ts | Already using App Router correctly |
| Single auth check (middleware only) | Middleware + layout double-check | Belt-and-suspenders; Supabase SSR recommendation |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (config: `vitest.config.ts`) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/middleware.test.ts src/__tests__/auth.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Unauthenticated request to `/` redirects to `/login` | unit | `npx vitest run src/__tests__/middleware.test.ts` | Yes (existing test covers this already) |
| AUTH-01 | Authenticated request to `/` passes through (no redirect) | unit | `npx vitest run src/__tests__/middleware.test.ts` | Yes (existing test covers this, target path must be `/` not `/assets`) |
| AUTH-01 | Authenticated user at `/login` is redirected to `/` | unit | `npx vitest run src/__tests__/middleware.test.ts` | Partial — new test case needed in existing file |
| AUTH-01 | Post-login redirect goes to `/` not `/assets/new` | unit | `npx vitest run src/__tests__/auth.test.ts` | Partial — new assertion needed in existing file |

### Existing Test Coverage Assessment

`src/__tests__/middleware.test.ts` currently has two tests:
1. "redirects unauthenticated request to /login" — passes; behaviour unchanged
2. "allows authenticated request to pass through" — passes; behaviour unchanged

Missing test case needed: "redirects authenticated user at /login to /" — covers the new middleware guard.

`src/__tests__/auth.test.ts` (LoginForm tests) currently does NOT assert the redirect destination after successful login. The existing mock uses `vi.fn()` for `push` but never checks what URL was passed. A new assertion is needed: after successful login, `router.push` is called with `'/'`.

### Sampling Rate

- **Per task commit:** `npx vitest run src/__tests__/middleware.test.ts src/__tests__/auth.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/middleware.test.ts` — add test case: "redirects authenticated user at /login to /"
- [ ] `src/__tests__/auth.test.ts` — add assertion: successful login calls `router.push('/')`

*(Existing test infrastructure and framework are fully present — no new files or installs needed, only additional test cases in existing files.)*

---

## Open Questions

None. All technical questions were resolved in the CONTEXT.md discussion session. The fix is fully specified and the code has been read directly.

---

## Sources

### Primary (HIGH confidence)

- Direct code read: `middleware.ts` — full file, verified current implementation
- Direct code read: `src/app/page.tsx` — confirmed unconditional `redirect('/login')`
- Direct code read: `src/app/(app)/layout.tsx` — confirmed auth guard pattern
- Direct code read: `src/components/auth/LoginForm.tsx` — confirmed `router.push('/assets/new')` at line 29
- Direct code read: `src/app/(app)/page.tsx` — confirmed this is the real assets list page
- Direct code read: `src/__tests__/middleware.test.ts` — confirmed existing test coverage
- Direct code read: `src/__tests__/auth.test.ts` — confirmed existing test coverage
- Direct code read: `vitest.config.ts` — confirmed test framework configuration

### Secondary (MEDIUM confidence)

- Supabase SSR documentation pattern (reflected in existing codebase): `getUser()` over `getSession()`, belt-and-suspenders middleware + layout pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read directly from source
- Architecture: HIGH — root cause verified by direct file read, no inference needed
- Pitfalls: HIGH — pitfall 1 verified by reading existing code (router.refresh() is already present), pitfalls 2-3 derived from direct middleware code reading
- Test gaps: HIGH — both test files read directly, gaps identified precisely

**Research date:** 2026-03-21
**Valid until:** Not time-sensitive — internal codebase, no external API version drift risk
