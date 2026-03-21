# Phase 6: Asset List + Navigation — Research

**Researched:** 2026-03-21
**Domain:** Next.js 16 App Router — Server Components, localStorage client state, Supabase query patterns, bottom nav layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**List card design**
- Text only — no photo thumbnails (no presigned URL fetches on the list)
- Each card shows: asset type, make/model/year (from `assets.fields` JSONB), status badge, last updated timestamp (relative)
- When make/model aren't filled yet (fresh draft): show "No data yet" as the subtitle
- Status badge visually distinct: Draft cards look actionable; Confirmed cards look done (different badge color/style)
- Timestamp: last updated (`assets.updated_at`), displayed as relative (e.g. "2h ago")
- List sorted by `updated_at DESC` (most recently touched first)

**Asset status (draft/confirmed)**
- Add `status` column to `assets` table — `'draft' | 'confirmed'`
- All existing records default to `'draft'`
- Status flips to `'confirmed'` when staff tap "Book In New Asset" on the output page — the Server Action marks the current record confirmed before navigating away
- Draft records route to `/assets/[id]/review` when tapped from the list
- Confirmed records route to `/assets/[id]/output` when tapped from the list

**Navigation chrome**
- Persistent bottom nav bar on all authenticated pages (inside `(app)` route group layout)
- Two items: "Assets" (links to `/`, list icon) and "New Asset" (links to `/assets/new`, plus icon)
- "Assets" tab always takes staff back to the list — even from deep inside the review or output page
- Bottom nav respects `env(safe-area-inset-bottom)` for iPhone home bar

**Branch selection + URL structure**
- Asset list lives at `/` (existing `src/app/(app)/page.tsx` becomes the real list)
- Branch selection is required before seeing the list
- On first visit (no branch in localStorage): show a branch selector screen (not the list) — staff pick their branch
- On return visits: branch is remembered in `localStorage('lastUsedBranch')` — go straight to the filtered list
- Branch can be changed from the list header (a branch dropdown/chip that updates localStorage and re-fetches)
- The list filters assets by `branch = selectedBranch` from Supabase query
- "New Asset" pre-selects the active branch: `localStorage('lastUsedBranch')` is already read by the wizard in step 1 — no extra work needed

### Claude's Discretion
- Exact status badge colors/styles (consistent with existing Tailwind v4 oklch tokens)
- Exact branch selector UI on first visit (full-screen or inline prompt)
- Bottom nav active state styling (which tab is "current")
- Empty state for a branch with no assets yet
- Pagination or infinite scroll for long lists (simple query for MVP — expected to be short lists)

### Deferred Ideas (OUT OF SCOPE)
- Branch tab/page — separate tabs per branch; deferred to a future phase
- Recently viewed toggle — out of scope; recency sort covers this implicitly
- Branch-level asset count on branch selection screen — deferred
- All assets currently assigned to Brisbane regardless of auction location — business data concern, not Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASSET-03 | User can view a list of asset records sorted by recency | Server Component Supabase query with `.order('updated_at', { ascending: false })`, branch filter, card display pattern |
| ASSET-04 | User can resume editing an asset record from the list | `status` column already in schema (confirmed by migration inspection); resume routing logic (draft → `/review`, confirmed → `/output`) in `AssetCard` link href |
</phase_requirements>

---

## Summary

Phase 6 replaces the placeholder list page at `/` with a real Supabase-backed asset list, adds persistent bottom navigation, and wires up resume routing. The technical domain spans three areas: (1) Server Component data fetching with a branch filter and `updated_at` sort, (2) client-side localStorage state for branch persistence that gates what the Server Component renders, and (3) layout-level chrome (bottom nav bar) that wraps all authenticated pages.

The critical architectural constraint is that the list page is a Server Component (DB reads server-side) but branch selection state lives in `localStorage` (client-only). This tension is resolved by making `AssetListPage` a Server Component wrapper that receives branch as a prop from a `'use client'` wrapper that reads localStorage. Alternatively — and more cleanly given the existing pattern — the list page itself becomes a thin Server Component shell that renders a `'use client'` `AssetListClient` which handles localStorage read, branch gating, and calls a server action (or a Server Component slot) to fetch assets once a branch is known. The review of existing code shows this is how the wizard handles the same problem: the `new/page.tsx` is itself a Client Component that uses `useEffect` + localStorage.

**Primary recommendation:** Model the list page after `new/page.tsx` — a Client Component that reads `localStorage('lastUsedBranch')` on mount, then either renders the branch picker or fetches assets via a Server Action / Route Handler. This avoids the awkward props-from-client-to-server pattern and aligns with the established codebase approach.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.7 (in-use) | Server Components, layouts, routing | Established project foundation |
| `@supabase/ssr` | 0.9.0 (in-use) | Server-side DB queries with auth context | Established project pattern — `createClient` from `@/lib/supabase/server` |
| Tailwind v4 | 4.x (in-use) | Styling with oklch tokens | Established project pattern |
| lucide-react | 0.577.0 (in-use) | Icons (List, Plus, ChevronDown) | Already installed; used throughout project |
| shadcn `badge`, `card` | installed | Status badge, card container | Already installed per UI-SPEC |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` `usePathname` | Next.js 16 | Detect active bottom nav tab | Client Component that needs current path |
| `next/navigation` `useRouter` | Next.js 16 | Programmatic navigation after branch selection | Client Components that navigate |
| React `useEffect` / `useState` | React 19 | localStorage read on mount, branch state | Any Client Component touching localStorage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client Component with Server Action for list fetch | Pure Server Component with searchParams branch | searchParams would require URL to carry branch state, breaking the localStorage-only requirement |
| Client Component list page | RSC + async Server Component | RSC cannot read localStorage — client wrapper required regardless |

**Installation:**
No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 6:

```
src/
├── app/(app)/
│   ├── layout.tsx                        # ADD: BottomNav inside layout
│   └── page.tsx                          # REPLACE: real asset list (Client Component shell)
├── components/asset/
│   ├── AssetCard.tsx                     # NEW: card component
│   ├── AssetStatusBadge.tsx              # NEW: draft/confirmed badge
│   ├── BranchHeader.tsx                  # NEW: branch chip + change dropdown
│   └── BranchPickerScreen.tsx            # NEW: first-visit full-screen picker
├── components/nav/
│   └── BottomNav.tsx                     # NEW: persistent bottom nav
└── lib/actions/
    └── asset.actions.ts                  # EXTEND: add confirmAsset() action
```

### Pattern 1: localStorage-gated Client Component list page

**What:** `page.tsx` is `'use client'`, reads `localStorage('lastUsedBranch')` on mount. If null, renders `BranchPickerScreen`. If set, fetches asset list via a Server Action and renders the list.

**When to use:** Any page that needs localStorage to decide what to display. Established pattern in `new/page.tsx`.

**Example (conceptual — based on existing `new/page.tsx` pattern):**
```typescript
// src/app/(app)/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { BranchPickerScreen } from '@/components/asset/BranchPickerScreen'
import { AssetList } from '@/components/asset/AssetList'
import type { BranchKey } from '@/lib/constants/branches'

const LAST_BRANCH_KEY = 'lastUsedBranch'

export default function AssetsPage() {
  const [branch, setBranch] = useState<BranchKey | null | undefined>(undefined)
  // undefined = loading, null = no branch saved, BranchKey = branch known

  useEffect(() => {
    const saved = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    setBranch(saved)
  }, [])

  if (branch === undefined) return null // hydration guard — no flash
  if (!branch) return (
    <BranchPickerScreen onSelect={(b) => {
      localStorage.setItem(LAST_BRANCH_KEY, b)
      setBranch(b)
    }} />
  )
  return <AssetList branch={branch} onBranchChange={(b) => {
    localStorage.setItem(LAST_BRANCH_KEY, b)
    setBranch(b)
  }} />
}
```

**Key detail:** The `undefined` initial state prevents hydration mismatch — server renders nothing, client renders based on localStorage after mount. This pattern is safe because the list page has no meaningful SSR content to preserve.

### Pattern 2: Server Action for list fetch (client-triggered)

**What:** `AssetList` (Client Component) calls a Server Action `getAssets(branch)` on mount to fetch the sorted, filtered list. The Server Action uses `createClient` from `@/lib/supabase/server` — the same pattern as all existing Server Actions.

**Example (Server Action):**
```typescript
// src/lib/actions/asset.actions.ts — ADD
'use server'
export async function getAssets(branch: string): Promise<AssetSummary[] | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, status, updated_at')
    .eq('user_id', user.id)
    .eq('branch', branch)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return data ?? []
}
```

**Note:** `.eq('user_id', user.id)` is defense-in-depth; RLS enforces ownership as well — consistent with `saveReview` pattern.

### Pattern 3: confirmAsset Server Action

**What:** Called when staff tap "Book In New Asset" on the output page. Flips `status` to `'confirmed'`, then the client navigates to `/assets/new`.

```typescript
// src/lib/actions/asset.actions.ts — ADD
'use server'
export async function confirmAsset(assetId: string): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({ status: 'confirmed' })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/')
}
```

**Called from:** `OutputPanel` or a wrapper on the output page — the "Book In New Asset" styled Link becomes a button that calls this action, then navigates via `router.push('/assets/new')`.

### Pattern 4: Bottom nav with `usePathname` active state

**What:** `BottomNav` is a `'use client'` component placed inside `(app)/layout.tsx`. Uses `usePathname()` to determine active tab.

```typescript
// src/components/nav/BottomNav.tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { List, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const assetsActive = pathname === '/'
  const newActive = pathname.startsWith('/assets/new')

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-[#14532D] border-t border-[#1E3A5F]"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-[640px] mx-auto h-full flex items-center justify-around">
        <Link href="/" className={cn('flex flex-col items-center gap-1 min-h-[44px] justify-center px-6',
          assetsActive ? 'text-white font-semibold' : 'text-white/65')}>
          <List className="w-5 h-5" />
          <span className="text-xs">Assets</span>
        </Link>
        <Link href="/assets/new" className={cn('flex flex-col items-center gap-1 min-h-[44px] justify-center px-6',
          newActive ? 'text-white font-semibold' : 'text-white/65')}>
          <Plus className="w-5 h-5" />
          <span className="text-xs">New Asset</span>
        </Link>
      </div>
    </nav>
  )
}
```

**Layout integration:** `BottomNav` is inserted inside `(app)/layout.tsx`. The `<main>` element needs `pb-14` (56px nav height) PLUS `pb-[env(safe-area-inset-bottom)]` so content isn't hidden under the nav.

```typescript
// src/app/(app)/layout.tsx — UPDATED
return (
  <div className="min-h-screen bg-[#166534]">
    <main className="pb-[calc(env(safe-area-inset-bottom)+56px)]">
      {children}
    </main>
    <BottomNav />
  </div>
)
```

### Pattern 5: Relative timestamp formatting

**What:** Format `updated_at` (ISO timestamp string from Supabase) as "2h ago", "yesterday", "3 days ago". No third-party library needed — implement with `Date` arithmetic.

```typescript
// Utility — can live in src/lib/utils.ts or inline in AssetCard
export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
```

**Note:** This runs client-side (in Client Component) to avoid server/client hydration mismatch on time-sensitive values.

### Anti-Patterns to Avoid

- **Reading localStorage in a Server Component:** Not possible — `window` is unavailable. Always gate localStorage reads inside `useEffect` or a `'use client'` component.
- **Calling `getUser()` inside a Client Component directly:** All auth + DB access goes through Server Actions or Server Components. The list fetch is a Server Action.
- **Nesting `<Link>` inside `<Link>`:** `AssetCard` should not have nested interactive elements. The entire card is one `<Link>` — no buttons inside cards.
- **Using `Button asChild` with Link:** `@base-ui/react` does not support `asChild`. Use styled `<Link>` directly (established Phase 01 + Phase 05 pattern).
- **Setting `status` in `createAsset` twice:** `createAsset` already inserts `status: 'draft'`. The migration just needs to add the column default — no data backfill needed since the column is already being set by the action.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamps | Custom date library | Inline `Date` arithmetic (< 10 lines) | No dep needed; simple arithmetic sufficient for "Xh ago" / "yesterday" / "X days ago" |
| Bottom nav active state | Complex route matching | `usePathname()` from `next/navigation` | Built-in Next.js hook; exact match for `/` and `startsWith` for `/assets/new` covers all cases |
| Branch persistence | Cookie-based session or URL params | `localStorage('lastUsedBranch')` | Already used in wizard; sharing the same key is the explicit decision |
| List fetch with auth | Custom fetch with Authorization header | Server Action with `createClient()` | Established project pattern; RLS handled automatically |
| Status badge variants | Conditional className logic spread across components | `AssetStatusBadge` component with `variant` prop | Keeps badge styling in one place; matches shadcn `badge` variant pattern |

---

## Common Pitfalls

### Pitfall 1: Hydration mismatch from localStorage read
**What goes wrong:** If the Server Component (or Client Component's initial render) tries to display branch-dependent content, it will differ from the client render after `useEffect` fires — causing a React hydration error.
**Why it happens:** `localStorage` is unavailable on the server; any access during SSR throws or returns null.
**How to avoid:** Use `undefined` as the initial state (not `null`). Render nothing (`return null`) when state is `undefined`. Only render branch-dependent UI after `useEffect` has fired.
**Warning signs:** React hydration errors in console; content flash on page load.

### Pitfall 2: Stale asset list after confirmAsset
**What goes wrong:** Staff confirms an asset and starts a new one; if they navigate back to `/` the list shows the old status.
**Why it happens:** Server Action runs but `revalidatePath('/')` is not called, or the Client Component caches the fetched list.
**How to avoid:** `confirmAsset` Server Action must call `revalidatePath('/')`. `getAssets` Server Action should not be cached — or the Client Component re-fetches on mount each time the page mounts (standard behavior since it's a Client Component calling a Server Action in `useEffect`).

### Pitfall 3: Bottom nav obscuring content
**What goes wrong:** Bottom nav (56px + safe area) overlaps the last card in the list.
**Why it happens:** `(app)/layout.tsx` currently only adds `pb-[env(safe-area-inset-bottom)]`. With a 56px fixed nav added, content needs `pb-[calc(env(safe-area-inset-bottom)+56px)]`.
**How to avoid:** Update layout `<main>` padding when adding `BottomNav`. Also verify all existing pages (`review`, `output`, `photos`, `extract`) have sufficient bottom padding — they currently use `pb-[calc(env(safe-area-inset-bottom)+80px)]` which already exceeds 56px and is sufficient.
**Warning signs:** Last card clipped; copy buttons on output page unreachable.

### Pitfall 4: `status` column already present — no migration needed
**What goes wrong:** Plan writer assumes the `status` column must be added via migration.
**Why it happens:** The CONTEXT.md says "Add `status` column to `assets` table — migration required in plan 06-02." However, inspection of `20260317000001_initial_schema.sql` shows the column is ALREADY PRESENT: `status text not null default 'draft'`. Additionally, `createAsset` already inserts `status: 'draft'`.
**How to avoid:** No migration for `status` column is needed. The planner must NOT create a migration for this column — doing so will fail with "column already exists". Plan 06-02 should confirm this in a pre-flight check rather than running a migration.
**Warning signs:** `ERROR: column "status" of relation "assets" already exists` from Supabase CLI.

### Pitfall 5: saveReview sets status to 'confirmed' on every save
**What goes wrong:** The review form (`saveReview` action) already sets `status: 'confirmed'` on every save. This means assets are confirmed the moment review is saved — before "Book In New Asset" is tapped.
**Why it happens:** Inspecting `src/lib/actions/review.actions.ts` line 18: `status: 'confirmed'` is set unconditionally in the update payload.
**How to avoid:** The "Book In New Asset" confirm-then-navigate action needs to understand this. When staff tap "Book In New Asset", `status` is already `'confirmed'` from `saveReview`. The `confirmAsset` action can still be implemented (idempotent update) or may be unnecessary if saving review already confirms. The plan needs to verify: should saving review auto-confirm, or should confirm be explicit on output page?

  **Recommendation:** Keep `saveReview`'s `status: 'confirmed'` behavior as-is (it's intentional — completing the review IS confirming the data). The "Book In New Asset" button on the output page does NOT need a `confirmAsset` action — it's already confirmed by `saveReview`. The button just navigates to `/assets/new`. This simplifies plan 06-02 significantly.

### Pitfall 6: `revalidatePath('/')` vs `revalidatePath('/assets')`
**What goes wrong:** `createAsset` in `asset.actions.ts` calls `revalidatePath('/assets')` — but the list lives at `/`, not `/assets`. This means creating a new asset does not revalidate the list page cache.
**Why it happens:** The list page was a placeholder when `createAsset` was written.
**How to avoid:** Update `createAsset` to call `revalidatePath('/')` instead of (or in addition to) `revalidatePath('/assets')`.

---

## Code Examples

Verified patterns from existing codebase:

### Supabase query — sorted filtered list (Server Action)
```typescript
// Pattern from review/page.tsx + asset.actions.ts
const { data, error } = await supabase
  .from('assets')
  .select('id, asset_type, asset_subtype, fields, status, updated_at')
  .eq('user_id', user.id)
  .eq('branch', branch)
  .order('updated_at', { ascending: false })
```

### layout.tsx — adding fixed bottom nav
```typescript
// Existing layout (src/app/(app)/layout.tsx)
// Change: add BottomNav, update main padding
return (
  <div className="min-h-screen bg-[#166534]">
    <main className="pb-[calc(env(safe-area-inset-bottom)+56px)]">
      {children}
    </main>
    <BottomNav />
  </div>
)
```

### Fields extraction for card subtitle
```typescript
// assets.fields is JSONB — cast to Record<string,string>
const fields = (asset.fields ?? {}) as Record<string, string>
const make = fields.make ?? ''
const model = fields.model ?? ''
const year = fields.year ?? ''
const subtitle = [make, model, year].filter(Boolean).join(' ') || 'No data yet'
```

### Active nav tab detection
```typescript
// Client Component using usePathname()
const pathname = usePathname()
const assetsActive = pathname === '/'
const newActive = pathname.startsWith('/assets/new')
// On /assets/[id]/* routes: neither is active (both render at text-white/65)
```

### BranchPickerScreen (wraps existing BranchSelector)
```typescript
// Wraps src/components/asset/BranchSelector.tsx
'use client'
import { BranchSelector } from '@/components/asset/BranchSelector'
import type { BranchKey } from '@/lib/constants/branches'

interface BranchPickerScreenProps {
  onSelect: (branch: BranchKey) => void
}

export function BranchPickerScreen({ onSelect }: BranchPickerScreenProps) {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      <h1 className="text-xl font-semibold text-white mb-2">Select your branch</h1>
      <p className="text-sm text-white/65 mb-6">Your branch is saved — you can change it any time.</p>
      <BranchSelector selected={null} onSelect={onSelect} />
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth-helpers-nextjs` | `@supabase/ssr` `createServerClient` | Phase 01 | Use `@/lib/supabase/server` `createClient` — never the deprecated helper |
| `generateObject` from AI SDK | `generateText + Output.object()` | Phase 03 | Not relevant to Phase 6 |
| `Button asChild` for nav links | Styled `<Link>` component | Phase 01 | `@base-ui/react` does not support `asChild` — use styled Link |

**Deprecated/outdated:**
- `revalidatePath('/assets')` in `createAsset`: should be `revalidatePath('/')` once list moves to root.

---

## Open Questions

1. **Does `saveReview` setting `status: 'confirmed'` mean the "Book In New Asset" confirm action is unnecessary?**
   - What we know: `saveReview` unconditionally sets `status: 'confirmed'` (reviewed in `review.actions.ts` line 18). Every record that has been through review is already confirmed.
   - What's unclear: Is the intent for "Book In New Asset" to be the confirmation trigger (not `saveReview`)? Or is confirming-on-review save correct and "Book In New Asset" is just navigation?
   - Recommendation: Keep `saveReview`'s behavior as-is. "Book In New Asset" is navigation-only. Plan 06-02 should remove the `confirmAsset` Server Action from scope — it's already handled.

2. **Branch header change UX — dropdown or sheet?**
   - What we know: CONTEXT.md says "a branch dropdown/chip that updates localStorage and re-fetches" — exact UI left to Claude's discretion.
   - What's unclear: Whether a native `<select>` or custom dropdown is preferred.
   - Recommendation: Use a `<select>` element styled to match project colors. Simplest implementation, no custom dropdown logic needed, accessible on mobile.

3. **Asset type display formatting on cards**
   - What we know: `asset_type` values are snake_case strings (e.g. `truck`, `earthmoving`, `caravan_motor_home`). The card shows "Asset type label" — needs formatting.
   - What's unclear: Whether to use `SCHEMA_REGISTRY[assetType].displayName` or simple string transform.
   - Recommendation: Use `SCHEMA_REGISTRY[assetType].displayName` — this is the established pattern and handles edge cases like "Caravan / Motor Home" correctly.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSET-03 | `getAssets(branch)` returns records sorted by `updated_at DESC`, filtered by branch and user_id | unit | `npx vitest run src/__tests__/asset.actions.test.ts -t "getAssets"` | ❌ Wave 0 |
| ASSET-03 | `getAssets` returns empty array (not error) when branch has no records | unit | `npx vitest run src/__tests__/asset.actions.test.ts -t "getAssets empty"` | ❌ Wave 0 |
| ASSET-04 | Resume routing: draft asset card href resolves to `/assets/[id]/review` | unit | `npx vitest run src/__tests__/AssetCard.test.tsx -t "draft routes to review"` | ❌ Wave 0 |
| ASSET-04 | Resume routing: confirmed asset card href resolves to `/assets/[id]/output` | unit | `npx vitest run src/__tests__/AssetCard.test.tsx -t "confirmed routes to output"` | ❌ Wave 0 |
| ASSET-04 | `relativeTime` formats timestamps correctly (minutes, hours, days) | unit | `npx vitest run src/__tests__/relativeTime.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/asset.actions.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/asset.actions.test.ts` — extend existing file to cover `getAssets` (ASSET-03)
- [ ] `src/__tests__/AssetCard.test.tsx` — new file; covers resume routing href logic (ASSET-04)
- [ ] `src/__tests__/relativeTime.test.ts` — new file; covers timestamp formatting utility (ASSET-03 display)

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/app/(app)/layout.tsx` — current layout structure; bottom nav integration point
- Direct code inspection: `src/app/(app)/page.tsx` — existing placeholder; exact empty state copy
- Direct code inspection: `src/app/(app)/assets/new/page.tsx` — localStorage + `useEffect` pattern; `LAST_BRANCH_KEY` constant
- Direct code inspection: `src/lib/actions/asset.actions.ts` — `createAsset` with `status: 'draft'`; `revalidatePath('/assets')` bug
- Direct code inspection: `src/lib/actions/review.actions.ts` — `saveReview` sets `status: 'confirmed'` (key finding)
- Direct code inspection: `supabase/migrations/20260317000001_initial_schema.sql` — `status text not null default 'draft'` already in schema
- Direct code inspection: `src/components/asset/BranchSelector.tsx` — reusable branch picker component
- Direct code inspection: `.planning/phases/06-asset-list-navigation/06-UI-SPEC.md` — complete visual + interaction contract for Phase 6
- Direct code inspection: `package.json` — all installed dependencies confirmed

### Secondary (MEDIUM confidence)
- `next/navigation` `usePathname` docs pattern — standard Next.js App Router hook for active nav state; consistent with documented API

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed; no new dependencies required
- Architecture: HIGH — patterns derived directly from existing project code; localStorage + Server Action pattern mirrors `new/page.tsx`
- Pitfalls: HIGH — key finding (status column already exists; saveReview already confirms) verified by direct migration and action inspection
- Test infrastructure: HIGH — vitest config and existing test patterns confirmed

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable stack — 30 days)
