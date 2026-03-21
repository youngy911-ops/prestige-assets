# Phase 6: Asset List + Navigation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can see all asset records for a selected branch, sorted by most recently updated, and tap any record to resume where they left off. The phase adds: a branch-aware asset list at `/`, persistent bottom navigation (Assets + New Asset), asset status tracking (draft/confirmed), and resume routing (draft → /review, confirmed → /output). Navigation between list, new asset wizard, and record detail works on both phone browser and desktop.

This phase ends when the full workflow is navigable without needing to manually type URLs.

</domain>

<decisions>
## Implementation Decisions

### List card design
- **Text only** — no photo thumbnails (no presigned URL fetches on the list)
- Each card shows: asset type, make/model/year (from `assets.fields` JSONB), status badge, last updated timestamp (relative)
- When make/model aren't filled yet (fresh draft): show "No data yet" as the subtitle
- **Status badge visually distinct:** Draft cards look actionable; Confirmed cards look done (different badge color/style)
- Timestamp: last updated (`assets.updated_at`), displayed as relative (e.g. "2h ago")
- List sorted by `updated_at DESC` (most recently touched first)

### Asset status (draft/confirmed)
- Add `status` column to `assets` table — `'draft' | 'confirmed'`
- All existing records default to `'draft'`
- **Status flips to `'confirmed'`** when staff tap "Book In New Asset" on the output page — the Server Action marks the current record confirmed before navigating away
- Draft records route to `/assets/[id]/review` when tapped from the list
- Confirmed records route to `/assets/[id]/output` when tapped from the list

### Navigation chrome
- **Persistent bottom nav bar** on all authenticated pages (inside `(app)` route group layout)
- Two items: "Assets" (links to `/`, list icon) and "New Asset" (links to `/assets/new`, plus icon)
- "Assets" tab always takes staff back to the list — even from deep inside the review or output page
- Bottom nav respects `env(safe-area-inset-bottom)` for iPhone home bar (existing pattern from app layout)

### Branch selection + URL structure
- **Asset list lives at `/`** (existing `src/app/(app)/page.tsx` becomes the real list)
- Branch selection is required before seeing the list
- **On first visit (no branch in localStorage):** show a branch selector screen (not the list) — staff pick their branch
- **On return visits:** branch is remembered in `localStorage('lastUsedBranch')` — go straight to the filtered list
- Branch can be changed from the list header (a branch dropdown/chip that updates localStorage and re-fetches)
- The list filters assets by `branch = selectedBranch` from Supabase query
- **"New Asset" pre-selects the active branch:** `localStorage('lastUsedBranch')` is already read by the wizard in step 1 — no extra work needed; wizard auto-selects the branch staff are currently working in

### Claude's Discretion
- Exact status badge colors/styles (consistent with existing Tailwind v4 oklch tokens)
- Exact branch selector UI on first visit (full-screen or inline prompt)
- Bottom nav active state styling (which tab is "current")
- Empty state for a branch with no assets yet
- Pagination or infinite scroll for long lists (simple query for MVP — expected to be short lists)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Asset Record — ASSET-03 (recency-sorted list), ASSET-04 (resume editing from list)

### Branch constant (source of truth for branch keys + labels)
- `src/lib/constants/branches.ts` — `BRANCHES` array and `BranchKey` type; 10 branches defined

### Existing wizard (branch localStorage pattern already live)
- `src/app/(app)/assets/new/page.tsx` — uses `localStorage('lastUsedBranch')` to pre-select branch in step 1; Phase 6 list page shares this key

### App layout (integration point for bottom nav)
- `src/app/(app)/layout.tsx` — current authenticated layout; bottom nav bar goes inside this layout so it renders on all authenticated pages

### Existing list placeholder (becomes real list)
- `src/app/(app)/page.tsx` — current placeholder with "New Asset" button and empty state; Phase 6 replaces the static content with real Supabase query

### Architecture
- `.planning/PROJECT.md` — Key Decisions table; server-only constraints
- `.planning/STATE.md` §Decisions — established patterns (Server Components for DB reads, Server Actions for writes, `@supabase/ssr`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/constants/branches.ts:BRANCHES` — branch keys and labels; list filter uses `branch` column in `assets` table
- `src/components/asset/BranchSelector.tsx` — branch selection UI already built; may be reusable for the branch picker on first visit
- `src/app/(app)/layout.tsx` — add bottom nav bar here; it wraps all authenticated pages
- `src/app/(app)/page.tsx` — becomes the real asset list; placeholder "New Asset" button + empty state already there
- lucide-react icons — already installed; use for bottom nav icons (List, Plus, etc.)
- shadcn components — available for card/list item treatment

### Established Patterns
- `src/app/(app)/assets/[id]/review/page.tsx` — Server Component pattern: auth check → Supabase query → redirect on miss → render
- Server Components for all DB reads; Server Actions for writes; Route Handlers for AI
- `max-w-[640px] mx-auto px-4` container — phone-first, desktop-friendly
- `env(safe-area-inset-bottom)` in `pb-` for iPhone home bar (used on output, review, and app layout)
- Tailwind v4 oklch color space (`bg-[#166534]` green, white text, `text-white/65` for secondary text)
- `@supabase/ssr` `createServerClient` for auth + DB in Server Components

### Integration Points
- `assets` table needs `status TEXT DEFAULT 'draft'` column (migration required in plan 06-02)
- `assets.fields` JSONB — source for make/model/year on list cards (read from confirmed extraction/review data)
- `assets.branch` column — already exists from Phase 1 (`createAsset` sets it); list query filters on this
- `assets.updated_at` — source for "last updated" timestamp on list cards
- `saveReview` Server Action (Phase 4) — sets `updated_at` on save; no changes needed
- `/api/describe` Route Handler (Phase 5) — also updates `assets`; `updated_at` tracks automatically
- "Book In New Asset" button on output page — needs Server Action to flip `status` to `confirmed` before navigating

</code_context>

<specifics>
## Specific Ideas

- Branch selector on first visit: staff pick their branch once, app remembers it — mirrors the wizard's existing `lastUsedBranch` localStorage pattern
- The wizard already auto-selects the remembered branch in step 1 — so staff working in "Brisbane" context can tap "New Asset" and the wizard skips straight to asset type selection (branch is pre-filled)
- Status badge: Draft = actionable/needs attention styling; Confirmed = done/muted styling — easy visual scan on a list of records
- "Book In New Asset" on output page confirms the current record AND starts a new one — clean handoff between book-in sessions

</specifics>

<deferred>
## Deferred Ideas

- **Branch tab/page** — user mentioned wanting separate tabs per branch; deferred to a future phase (branch filter on list covers MVP need; full branch tabs is a management feature)
- **Recently viewed toggle** — user mentioned a "recently viewed" filter; out of scope for Phase 6 (recency sort covers this implicitly); add to backlog
- **Branch-level asset count** — showing how many assets per branch on a branch selection screen; deferred
- All assets currently assigned to Brisbane regardless of auction location — this is a business data concern, not a Phase 6 concern

</deferred>

---

*Phase: 06-asset-list-navigation*
*Context gathered: 2026-03-21*
