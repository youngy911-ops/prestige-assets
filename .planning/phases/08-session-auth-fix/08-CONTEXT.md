# Phase 8: Session Auth Fix - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the authentication routing so authenticated users can navigate to the Assets tab (/) without being redirected to login. Unauthenticated users must still be redirected to /login. No new UI, no new auth features — routing correctness only.

</domain>

<decisions>
## Implementation Decisions

### Root page conflict
- Delete `src/app/page.tsx` — the unconditional `redirect('/login')` conflicts with `src/app/(app)/page.tsx` (the real assets list at `/`)
- After deletion, `src/app/(app)/page.tsx` becomes the sole handler for `/`
- Do NOT add a replacement root page; the route group handles it

### Auth check architecture
- Keep BOTH the middleware check AND the AppLayout server-component check (belt-and-suspenders)
- This is the Supabase SSR recommended pattern — do not consolidate to middleware only

### Middleware auth redirect (new behaviour)
- Add: authenticated users hitting `/login` should be redirected to `/`
- Current middleware only handles unauthenticated → `/login`; it needs the inverse too

### Post-login redirect
- `LoginForm.tsx` currently redirects to `/assets/new` after successful login
- Change to redirect to `/` (the assets list) instead

### Claude's Discretion
- Login page UX during auth check: no loading state needed — middleware handles the redirect server-side before the login page renders
- Session expiry handling: silent redirect to `/login` on next navigation (middleware catches expired session); no mid-workflow warning needed for this internal tool
- Auth error handling: if `supabase.auth.getUser()` fails (network error), treat as unauthenticated and redirect to login (safe default — matches current pattern)

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

Requirements traceability: `.planning/REQUIREMENTS.md` — AUTH-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `middleware.ts` — Supabase SSR middleware with cookie handling; needs one new condition (authed user at `/login` → redirect to `/`)
- `src/lib/supabase/server.ts` — `createClient()` server helper; already used in AppLayout
- `src/lib/supabase/client.ts` — client-side Supabase client; used in LoginForm

### Established Patterns
- `@supabase/ssr` `createServerClient` is the pattern for server-side auth (middleware + layout)
- `supabase.auth.getUser()` is used (not `getSession()`) — this is the correct Supabase SSR pattern
- `router.push()` + `router.refresh()` is the client-side redirect pattern after login

### Integration Points
- `src/app/(app)/layout.tsx:8` — auth guard (`if (!user) redirect('/login')`) — keep as-is
- `middleware.ts:23` — unauthenticated guard — add authenticated-at-login guard here
- `src/components/auth/LoginForm.tsx:29` — `router.push('/assets/new')` → change to `router.push('/')`
- `src/app/page.tsx` — DELETE this file

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the fix is surgical: delete the conflicting root page, fix the middleware, fix the post-login redirect.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-session-auth-fix*
*Context gathered: 2026-03-21*
