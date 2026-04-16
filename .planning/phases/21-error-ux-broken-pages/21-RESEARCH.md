# Phase 21: Error UX & Broken Pages - Research

**Researched:** 2026-04-16
**Domain:** Next.js App Router error boundaries, React error UI, route cleanup
**Confidence:** HIGH

## Summary

This phase is a targeted, low-risk cleanup of three files and deletion of one dead route. All architectural decisions are locked in CONTEXT.md. The codebase was inspected directly — no external library research is needed. The three error boundaries (`(app)/error.tsx`, `(auth)/error.tsx`, `global-error.tsx`) are already in place and follow Next.js App Router conventions; they need content and styling upgrades, not structural changes. The edit-type stub has zero inbound links and can be safely deleted with `git rm`.

The work is entirely in the presentation layer. No server actions, no database calls, no new dependencies. The Button component from `@base-ui/react` and Lucide icons (`lucide-react`) are already installed and used project-wide.

**Primary recommendation:** Two tasks — (1) upgrade all three error boundaries in one commit, (2) delete the edit-type stub in a separate atomic commit. A shared `ErrorDisplay` component is the cleanest approach given three pages share the same layout scaffold.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Smart contextual actions per error type:
  - Auth errors: "Your session has expired" + "Sign in again" button routing to /login
  - Asset/data errors: "This asset couldn't be loaded" + "Go to Assets" + "Try Again"
  - Server/extraction errors: "Something went wrong" + "Try Again" + "Go to Assets"
- Technical error message shown behind a "Show details" toggle — not visible by default
- Edit Type page: remove the route entirely — delete `src/app/(app)/assets/[id]/edit-type/page.tsx`
- global-error.tsx: light polish only, improved contextual message + home link, keep inline styles (renders before CSS loads, brand hex values already correct from Phase 20)

### Claude's Discretion
- Whether to use a shared ErrorDisplay component vs aligned-but-separate error pages
- Icon choice per error type (Lucide icons available — AlertTriangle, ShieldOff, etc.)
- Exact spacing, typography, and layout within the dark theme

### Deferred Ideas (OUT OF SCOPE)
- Custom not-found (404) pages — skip for v1.5, add in a future phase
- Type editing functionality (change asset type/subtype after creation) — remove stub now, build as its own phase if needed
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ERR-01 | App error pages show contextual messages with recovery guidance (not just "Something went wrong" + retry) | Three error boundary files identified and inspected; current state is generic single-button pages; upgrade path is clear |
| ERR-02 | Edit Type page is functional or route is removed cleanly (no silent stub redirect) | File confirmed as zero-inbound-link dead code; `git rm` is the complete implementation |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | Already installed | `error.tsx` / `global-error.tsx` conventions | Project is already using this; no changes needed |
| lucide-react | Already installed | Icons per error type (AlertTriangle, ShieldOff, RefreshCw, Home, ArrowLeft) | Project-standard icon library, already present |
| `src/components/ui/button.tsx` | Local | Recovery action buttons | Project's shared button component with all needed variants |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` (`useRouter`) | Already installed | "Go to Assets" / "Sign in again" navigation | Recovery buttons that route away from current page |
| `next/link` | Already installed | Static recovery links | Preferred over router.push for accessible link semantics |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared ErrorDisplay component | Separate identical markup in each file | Shared component removes duplication; separate files allow per-boundary customisation if needed later. Shared component recommended. |

**Installation:** None required. All dependencies are already in place.

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/
├── (app)/error.tsx          # Upgrade: contextual asset/server error UX
├── (auth)/error.tsx         # Upgrade: auth/session-expired UX
├── global-error.tsx         # Light polish: inline styles, add home link
└── components/
    └── error/
        └── ErrorDisplay.tsx # NEW: shared layout scaffold (app + auth only)

src/app/(app)/assets/[id]/
└── edit-type/               # DELETE entire directory
```

### Pattern 1: Next.js App Router Error Boundary
**What:** `error.tsx` is a Client Component that catches errors thrown in its route segment. It receives `error` (Error object with optional `digest`) and `reset` (re-renders the segment).
**When to use:** Already the established pattern — no change needed.
**Example:**
```typescript
// Current pattern in (app)/error.tsx — basis for upgrade
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // ... UI
}
```

### Pattern 2: Contextual Error Detection
**What:** Classify errors at render time by inspecting `error.message` to present the right contextual copy.
**When to use:** `(app)/error.tsx` handles both auth failures and asset/server errors depending on where in the app the error is thrown.
**Example:**
```typescript
// Classify error type for contextual messaging
function classifyError(error: Error): 'auth' | 'asset' | 'server' {
  const msg = error.message?.toLowerCase() ?? ''
  if (msg.includes('auth') || msg.includes('session') || msg.includes('unauthorized')) return 'auth'
  if (msg.includes('asset') || msg.includes('not found') || msg.includes('load')) return 'asset'
  return 'server'
}
```

### Pattern 3: "Show details" Toggle for Technical Error
**What:** Collapsed `<details>` / `<summary>` element or simple state toggle showing raw `error.message` and `error.digest`. Not visible by default. Practical for staff debugging.
**When to use:** All three error boundaries — allows staff to read error details without dev tools.
**Example:**
```typescript
// Simple details/summary — no state needed, native browser collapse
<details className="mt-4 text-left">
  <summary className="text-xs text-muted-foreground cursor-pointer">Show details</summary>
  <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-all">
    {error.message}
    {error.digest && `\nDigest: ${error.digest}`}
  </pre>
</details>
```

### Pattern 4: global-error.tsx Inline Style Constraint
**What:** `global-error.tsx` renders its own `<html><body>` because Tailwind CSS is not loaded at this boundary. Must use inline styles only.
**When to use:** This file only — all other error pages use Tailwind.
**Key constraint:** Brand hex `#0f1f0f` (background) is already correct from Phase 20 and must not be changed.
**Example (light polish additions):**
```typescript
// Add a Home link with inline style (no Tailwind available)
<a
  href="/"
  style={{ display: 'inline-block', marginTop: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}
>
  Go to home
</a>
```

### Anti-Patterns to Avoid
- **Using raw `<button>` with ad-hoc className instead of `Button` component:** The existing error pages do this — upgrade should use the project's `Button` component for consistency.
- **Hardcoded hex in (app) or (auth) error.tsx:** These files load with Tailwind — use semantic tokens (`text-destructive`, `bg-card`, etc.), not hex. The existing files use `bg-emerald-600` which should be replaced with `bg-primary` or equivalent.
- **Hardcoded hex in global-error.tsx:** Inline styles are mandatory here but must use the already-established brand hex values — do not introduce new hex values.
- **Routing with `router.push` instead of `Link` for recovery buttons:** Use `next/link` for accessible, pre-fetchable navigation. `useRouter().push` is acceptable for the `reset` callback.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error collapse/expand | Custom accordion component | Native `<details><summary>` | Zero JS, zero dependencies, correct semantics |
| Recovery navigation | Custom router logic | `next/link` `href` prop | Handles prefetch, accessible by default |
| Button styling | New className string | `Button` component from `src/components/ui/button.tsx` | Already covers variant/size/dark-mode/focus rings |
| Icons | SVG literals or emoji | Lucide icons (AlertTriangle, ShieldOff, RefreshCw, Home) | Already installed, consistent sizing |

---

## Common Pitfalls

### Pitfall 1: Using Tailwind classes in global-error.tsx
**What goes wrong:** Tailwind classes render as unstyled text — CSS module is not loaded at the global error boundary.
**Why it happens:** `global-error.tsx` provides its own `<html><body>` wrapper, which means the Next.js root layout (and its CSS imports) never runs.
**How to avoid:** Keep inline styles in this file. The CONTEXT.md explicitly mandates this.
**Warning signs:** Any `className=` prop in global-error.tsx.

### Pitfall 2: Introducing new hardcoded hex colors
**What goes wrong:** Breaks Phase 20's brand.test.ts smoke tests which scan for banned hex values in app/ and components/ files.
**Why it happens:** Easy to copy the existing `bg-emerald-600` pattern or paste a hex from brand.ts.
**How to avoid:** Use semantic Tailwind tokens in (app) and (auth) error pages. The banned list in brand.test.ts is `['#F87171', '#166534', '#111f11', '#0a1a0a']` — global-error.tsx is explicitly exempted in that test.
**Warning signs:** Any `#` character in className strings in (app)/error.tsx or (auth)/error.tsx.

### Pitfall 3: Leaving orphaned test expectations after deleting edit-type
**What goes wrong:** A test asserting the file exists would fail.
**Why it happens:** Overly broad test scanning.
**How to avoid:** Search tests for `edit-type` references before deletion. Current grep confirms zero test references.
**Warning signs:** `grep -r "edit-type"` returns anything other than the file itself.

### Pitfall 4: Button variant mismatch for recovery actions
**What goes wrong:** "Go to Assets" and "Sign in again" styled with `variant="destructive"` looks alarming; primary variant is more appropriate for recovery.
**Why it happens:** Error context suggests destructive styling.
**How to avoid:** Use `variant="default"` (primary) for recovery actions. Reserve destructive variant for destructive confirmations.

---

## Code Examples

### Correct Button usage (project component)
```typescript
// Source: src/components/ui/button.tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Recovery button — navigates away
<Button asChild variant="default" size="lg">
  <Link href="/assets">Go to Assets</Link>
</Button>

// Retry button — calls reset()
<Button variant="outline" size="lg" onClick={reset}>
  Try Again
</Button>
```

### Correct Lucide icon import
```typescript
// Source: lucide-react (already installed)
import { AlertTriangle, ShieldOff, RefreshCw, Home } from 'lucide-react'
// Icons auto-size to 1rem (16px) by default via button.tsx's [&_svg]:size-4
// For standalone icons: <AlertTriangle className="size-8 text-destructive" />
```

### Semantic Tailwind tokens to use (not hex)
```
text-foreground         — primary text
text-muted-foreground   — secondary/subdued text
bg-background           — page background
bg-card                 — card/panel background
text-destructive        — error/warning text colour
border-border           — standard border
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic "Something went wrong" + single retry | Contextual message + multiple recovery actions | Phase 21 | Users know what failed and have a useful next step |
| Raw `<button>` with ad-hoc Tailwind | `Button` component from shared UI | Phase 20 established component library | Consistent focus rings, dark mode, active states |
| Hardcoded `bg-emerald-600` in error.tsx | `bg-primary` semantic token | Phase 21 | Survives brand colour changes |

---

## Open Questions

1. **SharedErrorDisplay: app-scope only or include auth?**
   - What we know: `(app)/error.tsx` and `(auth)/error.tsx` have similar layouts but different max-width and padding. Auth error is `max-w-[360px] pt-24`; app error is `max-w-[480px] pt-16`.
   - What's unclear: Whether the shared component should accept layout props or whether the differences justify separate implementations.
   - Recommendation: A shared `ErrorDisplay` component accepting `title`, `message`, `actions` props and optional `className` for layout overrides is cleanest. Keep global-error.tsx fully separate (it can't import components anyway).

2. **`error.digest` visibility**
   - What we know: Next.js provides `error.digest` as an opaque hash for server errors. It's useful for correlating with server logs.
   - What's unclear: Whether the Supabase/Next.js setup in this project emits server-side error digests.
   - Recommendation: Include digest in the "Show details" toggle if it exists — low cost, high value for debugging.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts) |
| Config file | `/home/jack/projects/prestige_assets/vitest.config.ts` |
| Quick run command | `npx vitest run src/__tests__/brand.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERR-01 | Error pages render contextual copy and recovery buttons | unit (render test) | `npx vitest run src/__tests__/error-boundaries.test.tsx` | ❌ Wave 0 |
| ERR-01 | No hardcoded hex in updated error files | smoke (file scan) | `npx vitest run src/__tests__/brand.test.ts` | ✅ existing |
| ERR-02 | edit-type route file no longer exists on disk | smoke (fs assertion) | `npx vitest run src/__tests__/error-boundaries.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/brand.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/error-boundaries.test.tsx` — covers ERR-01 (render test for contextual copy) and ERR-02 (fs assertion that edit-type/page.tsx is absent)

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection of `src/app/(app)/error.tsx`, `src/app/(auth)/error.tsx`, `src/app/global-error.tsx` — current state confirmed
- Direct file inspection of `src/app/(app)/assets/[id]/edit-type/page.tsx` — confirmed stub with zero inbound links
- `grep -rn "edit-type"` across entire src — confirmed single occurrence (the file itself)
- `src/lib/constants/brand.ts` — brand tokens confirmed
- `src/components/ui/button.tsx` — Button component variants confirmed
- `src/__tests__/brand.test.ts` — smoke test rules confirmed (banned hex list, global-error exemption)
- `vitest.config.ts` — test framework confirmed as Vitest with jsdom

### Secondary (MEDIUM confidence)
- Next.js App Router error boundary conventions — consistent with inspected file structure and existing code patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed by direct file inspection; no external research needed
- Architecture: HIGH — all three error boundaries and the dead route inspected directly; zero inbound links confirmed by grep
- Pitfalls: HIGH — derived from the existing test rules (brand.test.ts), the global-error constraint (CONTEXT.md), and direct code inspection

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable domain — Next.js App Router error conventions do not change between minor versions)
