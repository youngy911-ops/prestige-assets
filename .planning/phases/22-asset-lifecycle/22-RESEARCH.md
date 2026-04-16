# Phase 22: Asset Lifecycle - Research

**Researched:** 2026-04-16
**Domain:** Next.js 16 / Supabase / React — asset delete + status lifecycle
**Confidence:** HIGH

## Summary

Phase 22 is entirely within the existing codebase — no new libraries are required. The two requirements are:

1. **ASSET-01 (delete):** Add a `deleteAsset` server action that deletes the row from Supabase. The cascade on `asset_photos` (already in the schema) handles photo cleanup automatically. UI needs a confirm dialog on both the asset list and the detail (output/review) pages.

2. **ASSET-02 (status badge):** The infrastructure is already 80% built. The DB has `status text not null default 'draft'`, `saveReview` sets it to `'confirmed'`, and `AssetStatusBadge` renders two states. The gap is that the requirement calls for three states (draft / reviewed / confirmed) but the codebase only implements two (draft / confirmed). The status field in the DB accepts any text, so adding a third value is a data-layer decision with no migration needed. The AssetSummary type and badge component need updating to include `'reviewed'`, and the workflow needs a point where status transitions to `'reviewed'`.

**Primary recommendation:** Introduce `'reviewed'` as a third status value; set it when `saveReview` completes (currently jumps straight to `'confirmed'`). Rename the current `'confirmed'` transition to happen when the user clicks "Copy All to Clipboard" on the output page. This maps status semantically to the three workflow steps: creation → draft, review submitted → reviewed, output copied → confirmed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASSET-01 | User can delete an asset from asset list or detail view, with confirmation. Deleted asset no longer appears in list. | Supabase `delete()` + cascade schema already in place; needs server action + optimistic UI removal |
| ASSET-02 | Asset records display visible status badge (draft / reviewed / confirmed) that advances automatically through workflow | Badge component exists for 2 states; DB column accepts any text; needs third state + transition wiring |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.7 | Server actions for delete/status update | Already in use throughout |
| @supabase/supabase-js | ^2.99.2 | Delete row, update status | Already used in all actions |
| react | 19.2.3 | Optimistic state removal after delete | Already used |
| lucide-react | ^0.577.0 | Trash icon for delete trigger | Already used; `Trash2` available |
| @base-ui/react | ^1.3.0 | No new usage needed | Existing pattern for buttons |
| vitest + @testing-library/react | ^4.1.0 / ^16.3.2 | Tests for new action + badge variants | Existing test infrastructure |

### Installation

```bash
# No new packages required
```

---

## Architecture Patterns

### Existing Patterns to Follow

**Server actions pattern** (from `asset.actions.ts`, `review.actions.ts`):
```typescript
'use server'
// Auth check first
// Supabase operation with .eq('user_id', user.id) RLS guard
// Return { success: true } | { error: string }
```

**Optimistic list removal** (from `AssetList.tsx`):
```typescript
// After deleteAsset succeeds: setAssets(prev => prev?.filter(a => a.id !== id) ?? prev)
```

**Confirm-before-action** (existing pattern in `OutputPanel.tsx`, `confirmingRegen`):
```typescript
const [confirmingDelete, setConfirmingDelete] = useState(false)
// First click: setConfirmingDelete(true) — show inline confirm
// Second click: call deleteAsset(id), optimistically remove from list
```

### Recommended Status Transition Points

| Event | Status Before | Status After | Where to Wire |
|-------|--------------|-------------|---------------|
| `createAsset` called | — | `'draft'` | Already set in `asset.actions.ts` |
| `saveReview` called | `'draft'` | `'reviewed'` | `review.actions.ts` line 35 — change `'confirmed'` to `'reviewed'` |
| Copy All clicked (output) | `'reviewed'` | `'confirmed'` | `OutputPanel.tsx` `handleCopyAll` — call new `markAssetConfirmed` action |

### Anti-Patterns to Avoid

- **Hard-coding 2-state logic in multiple places:** `AssetCard`, `AssetList` filter chips, and `AssetStatusBadge` all currently hard-code `'draft' | 'confirmed'`. Update all three together or introduce a shared type.
- **Forgetting the `user_id` RLS guard in delete action:** Every Supabase write must include `.eq('user_id', user.id)` — the DB has RLS but server actions should be explicit.
- **Missing `revalidatePath` after delete:** After deletion, the list page cache needs invalidation — though `AssetList` is a client component that manages its own state, the server cache still needs revalidating for SSR re-entry.
- **Leaving orphaned storage files:** The `asset_photos` table cascades on delete (schema line: `references public.assets(id) on delete cascade`), but Storage bucket objects do NOT auto-delete via cascade. The delete action must also remove storage objects for the asset's photos.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialog | Custom modal | Inline confirm state (existing `confirmingRegen` pattern) | No dialog library installed; inline pattern already proven in codebase |
| Status progression | Custom state machine | Direct DB update in server action | Three states are linear; no branching logic needed |
| Storage cleanup on delete | Custom delete orchestration | `supabase.storage.from('photos').remove(paths[])` after DB delete | Supabase JS client handles batch removal |
| Type safety for status | Custom enum | Extend existing `'draft' | 'confirmed'` union to `'draft' | 'reviewed' | 'confirmed'` | Already typed in `AssetSummary`; extend in one place |

---

## Common Pitfalls

### Pitfall 1: Storage objects not deleted with the asset

**What goes wrong:** DB row and photos rows are deleted (cascade), but Storage bucket objects persist indefinitely, consuming quota.

**Why it happens:** Supabase cascades are DB-level only; Storage is a separate service.

**How to avoid:** In `deleteAsset` server action: (1) fetch all `storage_path` values for the asset's photos, (2) call `supabase.storage.from('photos').remove(storagePaths)`, (3) then delete the asset row (cascade handles photo rows). Order matters — fetch paths before row delete since cascade removes them.

**Warning signs:** Storage usage grows even after assets are deleted.

### Pitfall 2: Status filter chips break with third status value

**What goes wrong:** `AssetList.tsx` has hard-coded filter chips: `(['all', 'draft', 'confirmed'] as const)`. Adding `'reviewed'` without updating this array means reviewed assets are invisible under the 'confirmed' filter.

**Why it happens:** Status values are duplicated in the filter chip list — not derived from a single source.

**How to avoid:** Update the filter chips array to `['all', 'draft', 'reviewed', 'confirmed']`.

### Pitfall 3: AssetCard routing breaks for 'reviewed' status

**What goes wrong:** `AssetCard` routes `status === 'draft'` to `/review`, otherwise to `/output`. A `'reviewed'` asset would route to `/output`, which is correct, but the intent should be verified.

**Why it happens:** Binary check `status === 'draft'`. After introducing `'reviewed'`, the routing logic is: draft → review page, reviewed/confirmed → output page. This is correct behaviour but must be intentional.

**How to avoid:** The existing routing logic works correctly for `'reviewed'` without change — reviewed assets should go to output. Document this explicitly.

### Pitfall 4: TypeScript type union is duplicated

**What goes wrong:** `AssetSummary.status` is typed `'draft' | 'confirmed'` in `asset.actions.ts`. `AssetStatusBadge` also hard-codes `'draft' | 'confirmed'`. Adding `'reviewed'` in one place but not the other causes TypeScript errors.

**Why it happens:** No shared `AssetStatus` type — the union is inline in two places.

**How to avoid:** Define `export type AssetStatus = 'draft' | 'reviewed' | 'confirmed'` in `asset.actions.ts` (or a shared types file) and import it in `AssetStatusBadge`, `AssetCard`, and `AssetList`.

### Pitfall 5: Delete from detail page needs navigation

**What goes wrong:** After deleting from `/assets/[id]/output` or `/assets/[id]/review`, the user is on a page for a non-existent asset. A redirect must happen.

**Why it happens:** Detail pages don't auto-detect when their asset is gone.

**How to avoid:** After successful delete, call `router.push('/')` from the detail page client component.

---

## Code Examples

### deleteAsset server action pattern

```typescript
// Source: mirrors asset.actions.ts createAsset / getAssets patterns
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAsset(
  assetId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Fetch storage paths before cascade deletes the photo rows
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path')
    .eq('asset_id', assetId)

  // 2. Delete storage objects (best-effort — don't fail if some are missing)
  const paths = (photos ?? []).map(p => p.storage_path)
  if (paths.length > 0) {
    await supabase.storage.from('photos').remove(paths)
  }

  // 3. Delete asset row — cascade removes asset_photos rows
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)
    .eq('user_id', user.id)  // RLS guard in action layer

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
```

### markAssetConfirmed server action pattern

```typescript
// Source: mirrors saveReview pattern in review.actions.ts
export async function markAssetConfirmed(
  assetId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({ status: 'confirmed' })
    .eq('id', assetId)
    .eq('user_id', user.id)
    .eq('status', 'reviewed')  // Only advance if currently reviewed

  if (error) return { error: error.message }
  return { success: true }
}
```

### AssetStatusBadge with three states

```typescript
// Extend existing AssetStatusBadge to handle 'reviewed'
type AssetStatus = 'draft' | 'reviewed' | 'confirmed'

const BADGE_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  },
}
```

### Inline delete confirm pattern (from OutputPanel.tsx `confirmingRegen`)

```typescript
// In AssetCard or detail page — no modal needed
const [confirmingDelete, setConfirmingDelete] = useState(false)
const [deleting, setDeleting] = useState(false)

async function handleDelete() {
  if (!confirmingDelete) {
    setConfirmingDelete(true)
    return
  }
  setDeleting(true)
  const result = await deleteAsset(id)
  if ('error' in result) {
    setDeleting(false)
    setConfirmingDelete(false)
    // show error
  } else {
    onDeleted?.(id)  // parent removes from list
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `'draft' \| 'confirmed'` only | Add `'reviewed'` as intermediate state | Badge reflects where asset actually is in workflow; "confirmed" now means output was copied |
| No delete capability | `deleteAsset` server action + optimistic removal | Users can clean up test/mistake records |

**Existing code that needs updating:**
- `AssetSummary.status` type: currently `'draft' | 'confirmed'` — extend to three values
- `AssetStatusBadge` props: currently `'draft' | 'confirmed'` — extend to three values
- `AssetList.tsx` filter chips: add `'reviewed'` chip
- `review.actions.ts` `saveReview`: change status from `'confirmed'` to `'reviewed'`
- `OutputPanel.tsx` `handleCopyAll`: call `markAssetConfirmed` after copy

**Note on DB migration:** No migration needed — `status text not null default 'draft'` accepts any text. Existing rows with `'confirmed'` remain valid; only the _meaning_ of transitions changes. If "reviewed" is added as a new intermediate step, existing confirmed rows stay confirmed.

---

## Open Questions

1. **Should "reviewed" auto-advance or require a copy action?**
   - What we know: requirement says "output copied = confirmed" — clear trigger.
   - What's unclear: does copying fields alone count, or must the description also be copied? The "Copy All" button copies both — using that as the trigger is cleanest.
   - Recommendation: Use `handleCopyAll` in `OutputPanel.tsx` as the single confirmed trigger.

2. **Delete from asset list: swipe-to-delete or button?**
   - What we know: no swipe gesture library is installed; the card is currently a `<Link>`.
   - What's unclear: whether to add a swipe gesture or a delete icon on the card.
   - Recommendation: Add a long-press or trailing action button. Simplest: a trash icon button on the card that appears inline — avoids needing gesture library for demo readiness.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `/home/jack/projects/prestige_assets/vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSET-01 | `deleteAsset` returns error when unauthenticated | unit | `npm test -- asset.actions` | ✅ (extend existing file) |
| ASSET-01 | `deleteAsset` fetches photo paths before deleting | unit | `npm test -- asset.actions` | ✅ (extend) |
| ASSET-01 | `deleteAsset` calls storage remove with correct paths | unit | `npm test -- asset.actions` | ✅ (extend) |
| ASSET-01 | `deleteAsset` returns `{ success: true }` on success | unit | `npm test -- asset.actions` | ✅ (extend) |
| ASSET-01 | AssetCard shows confirm state before delete | unit | `npm test -- AssetCard` | ✅ (extend existing file) |
| ASSET-02 | `AssetStatusBadge` renders "Draft" for draft status | unit | `npm test -- AssetCard` | ✅ (existing test covers this) |
| ASSET-02 | `AssetStatusBadge` renders "Reviewed" for reviewed status | unit | `npm test -- AssetCard` | ❌ Wave 0: add to AssetCard.test.tsx |
| ASSET-02 | `AssetStatusBadge` renders "Confirmed" for confirmed status | unit | `npm test -- AssetCard` | ✅ (existing test covers this) |
| ASSET-02 | `saveReview` sets status to `'reviewed'` not `'confirmed'` | unit | `npm test -- review.actions` | ✅ (extend existing review.actions.test.ts) |

### Sampling Rate

- **Per task commit:** `npm test -- asset.actions review.actions AssetCard`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add `'reviewed'` badge test to `src/__tests__/AssetCard.test.tsx` — covers ASSET-02 new state
- [ ] Add `deleteAsset` tests to `src/__tests__/asset.actions.test.ts` — covers ASSET-01 (action doesn't exist yet; test file exists and follows the pattern)
- [ ] Update `review.actions.test.ts` to assert `status: 'reviewed'` — covers ASSET-02 transition

---

## Sources

### Primary (HIGH confidence)

- Direct codebase read — `src/lib/actions/asset.actions.ts`, `review.actions.ts`, `photo.actions.ts`
- Direct codebase read — `supabase/migrations/20260317000001_initial_schema.sql`
- Direct codebase read — `src/components/asset/AssetStatusBadge.tsx`, `AssetCard.tsx`, `AssetList.tsx`, `OutputPanel.tsx`
- Direct codebase read — `src/__tests__/asset.actions.test.ts`, `AssetCard.test.tsx`

### Secondary (MEDIUM confidence)

- Supabase JS client `storage.remove()` API — from existing `photo.actions.ts` pattern and Supabase docs knowledge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire implementation is within existing libraries; no new dependencies
- Architecture: HIGH — delete action and status wiring follow established codebase patterns
- Pitfalls: HIGH — storage orphan, type union duplication, and filter chip gaps are directly observable in the codebase

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack, internal codebase)
