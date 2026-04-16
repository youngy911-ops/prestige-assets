# Phase 21: Error UX & Broken Pages - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see helpful, contextual error messages and never hit dead-end stub pages. Covers the (app) error boundary, (auth) error boundary, global-error boundary, and removal of the dead edit-type stub route. Not-found (404) pages are explicitly deferred.

</domain>

<decisions>
## Implementation Decisions

### Error page content & recovery
- Smart contextual actions per error type — not one-size-fits-all buttons
  - Auth errors: "Your session has expired" + "Sign in again" button routing to /login
  - Asset/data errors: "This asset couldn't be loaded" + "Go to Assets" + "Try Again"
  - Server/extraction errors: "Something went wrong" + "Try Again" + "Go to Assets"
- Technical error message shown behind a "Show details" toggle — not visible by default, accessible for staff debugging without dev tools

### Edit Type page
- Remove the route entirely — delete `src/app/(app)/assets/[id]/edit-type/page.tsx`
- Zero inbound links exist; it's unreachable dead code (silent redirect stub from early phases)
- If type editing becomes a real need, it gets its own phase later

### Not-found handling
- Skip for v1.5 — not a demo blocker, users won't be typing random URLs during demo
- Next.js default 404 is acceptable for now
- Can be added in a future phase if needed

### Error visual design
- Global-error.tsx gets light polish: improved contextual message + home link, but keeps inline styles (renders before CSS loads, brand hex values already correct from Phase 20)

### Claude's Discretion
- Whether to use a shared ErrorDisplay component vs aligned-but-separate error pages (choose cleanest approach)
- Icon choice per error type (Lucide icons available — AlertTriangle, ShieldOff, etc.)
- Exact spacing, typography, and layout within the dark theme

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Error boundaries
- `src/app/(app)/error.tsx` — Current app-level error boundary (generic, needs contextual upgrade)
- `src/app/(auth)/error.tsx` — Current auth error boundary (generic, needs session-expired messaging)
- `src/app/global-error.tsx` — Global error boundary with inline styles (light polish only, keep inline styles)

### Dead route to remove
- `src/app/(app)/assets/[id]/edit-type/page.tsx` — Stub redirect, zero inbound links, delete entirely

### Brand config (from Phase 20)
- `src/lib/brand.ts` — Brand config with semantic color tokens; error pages in (app)/(auth) should use semantic Tailwind classes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — Button component for recovery actions
- `src/components/ui/card.tsx` — Card component if error content needs a container
- Lucide icons available via lucide-react (already in project for Phase 23 CODE-02 direction)

### Established Patterns
- Dark theme with semantic Tailwind tokens (text-destructive, bg-card, bg-background) — Phase 20 established this
- Global error uses inline styles by design — no Tailwind available at that boundary
- Error boundaries follow Next.js App Router convention: `error.tsx` per route group

### Integration Points
- (app) error.tsx handles all errors within the authenticated app shell
- (auth) error.tsx handles errors on login/auth pages
- global-error.tsx is the last-resort catch-all (renders own html/body)
- No not-found.tsx exists at any level (explicitly deferred)

</code_context>

<specifics>
## Specific Ideas

- Auth error should specifically say "Your session has expired" rather than generic auth failure
- Error detail toggle lets staff debug without opening dev tools — practical for on-site use
- Demo on Friday 2026-04-17 — error pages must be crash-proof and look professional if triggered

</specifics>

<deferred>
## Deferred Ideas

- Custom not-found (404) pages — skip for v1.5, add in a future phase if needed
- Type editing functionality (change asset type/subtype after creation) — remove stub now, build as its own phase if needed

</deferred>

---

*Phase: 21-error-ux-broken-pages*
*Context gathered: 2026-04-16*
