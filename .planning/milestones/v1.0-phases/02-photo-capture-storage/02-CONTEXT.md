# Phase 2: Photo Capture + Storage - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff upload photos of assets (build plates, exterior, interior, odometer, extras) via web file picker, photos are resized and EXIF-corrected client-side, stored in private Supabase Storage, and can be drag-reordered with cover photo designation that persists after reload. Photo upload is part of the asset creation workflow that begins after the branch/type/subtype wizard.

AI extraction, review form, and output generation are out of scope — this phase ends when photos are stored and ordered.

</domain>

<decisions>
## Implementation Decisions

### Routing + Draft Record Creation
- Asset DB record is created at the end of the wizard step (after branch + type + subtype are selected) via `createAsset` Server Action — before photos
- Photo upload lives on a dedicated route `/assets/[id]/photos` (not inside `/assets/new`)
- The wizard flow is: `/assets/new` → branch → type → subtype → `[createAsset]` → redirect to `/assets/[id]/photos`
- Back button on the photo upload page returns to the wizard (`/assets/[id]/edit-type` or equivalent) to correct branch/subtype; already-uploaded photos stay attached to the record
- Type changes via Back are an edge case — planner to handle (photos stay, record updated)

### Photo Gate + Next Action
- Photos are **optional** — staff can proceed to AI extraction without uploading any photos
  - Rationale: staff may have a VIN or PIN written down and want to manually enter all fields without photos (common for high-value assets booked in remotely)
- "Next" button is always enabled; label or hint text changes based on photo count
- On "Next":
  - If photos present → navigate to `/assets/[id]/extract` (AI extraction, Phase 3)
  - If no photos → navigate to `/assets/[id]/review` (blank review form, manual entry)

### Photo Count Limit
- Hard cap: **80 photos per asset**
  - Rationale: future-proofs for full sale photo sets (~50 photos); typical workflow is 5–10 but app should support the full workflow without restriction
  - Staff guidance (copy, not enforced): add build plate + key asset photos first, then additional sale photos
- Cap is enforced client-side (disable Add Photos button at 80) and server-side (reject upload if asset already has 80 photos)

### Build Plate Signal to Phase 3
- Phase 3 sends **all uploaded photos** to GPT-4o — not just the cover photo
  - Rationale: build plate may not be position-0; AI reliably identifies the build plate itself from multiple photos
- No special "mark as build plate" UI in Phase 2 — no tagging, no designation beyond position
- Cover photo (position-0) is for display purposes only — not a build plate indicator

### Multi-Session Photo Editing
- Photos are editable at any time while the asset is in **draft** status (before Phase 4 confirm/save)
  - Staff can add, remove, and reorder photos across multiple sessions
  - This supports the on-site → back-at-office workflow where a missed build plate photo needs to be added later
- When photos are added/removed on an asset that already has AI extraction results:
  - Show a banner prompt: "New photos added — re-run AI extraction to update extracted fields?"
  - Options: [Re-run Extraction] / [Keep existing results]
  - Phase 3 handles the re-run; Phase 2 adds the photos and sets an `extraction_stale` flag (or equivalent) on the asset record
- After Phase 4 confirm (asset status → confirmed): photos locked or require explicit unlock — Phase 4's concern; Phase 2 only needs to support draft-state editing

### Claude's Discretion
- Exact Storage path structure for photos (`{user_id}/{asset_id}/{filename}` or similar)
- Extraction stale flag — DB column name and type
- Client-side feedback when hard cap is reached (toast, inline message, etc.)
- Exact "Next" button label and hint text copy (supplement UI-SPEC copywriting contract)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual + Interaction design (MUST READ — already specced)
- `.planning/phases/02-photo-capture-storage/02-UI-SPEC.md` — Complete visual and interaction contract: component inventory (PhotoUploadZone, PhotoThumbnailGrid, PhotoThumbnail, CoverPhotoBadge, UploadProgressIndicator), spacing, color, typography, drag-to-reorder behavior, empty state, copywriting. Approved. Planner must not re-derive these — implement from spec.

### Requirements
- `.planning/REQUIREMENTS.md` §Photo Capture — PHOTO-01 (file picker), PHOTO-02 (client-side resize + EXIF + private Storage), PHOTO-03 (drag-to-reorder + persistence)

### Project context
- `.planning/PROJECT.md` — Constraints (private Storage, ISO 27001, server-only API keys), asset type list, Salesforce field schemas
- `.planning/phases/01-foundation-schema-registry/01-CONTEXT.md` — Established patterns: shadcn v4 components, Tailwind v4 oklch color, @supabase/ssr client patterns, Server Action pattern, DB schema (assets + asset_photos tables)

### Architecture
- `.planning/research/ARCHITECTURE.md` — App Router structure, two Supabase client patterns, folder conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — shadcn Button; use for "Add Photos" CTA, "Next" button, remove actions
- `src/components/ui/badge.tsx` — shadcn Badge; use for "Cover" badge on position-0 thumbnail
- `src/lib/actions/asset.actions.ts` — existing Server Action pattern; new `updatePhotoOrder` and `removePhoto` actions follow same pattern
- `src/app/(app)/assets/new/page.tsx` — wizard page; `createAsset` Server Action called here; redirect to `/assets/[id]/photos` after creation

### Established Patterns
- Server Actions for DB writes (`src/lib/actions/asset.actions.ts`)
- `@supabase/ssr` `createBrowserClient` / `createServerClient` (not deprecated auth-helpers)
- Files under `src/lib/` — `@/*` alias resolves to `./src`
- `src/app/(app)/` route group — all authenticated routes live here with auth layout wrapper
- Tailwind v4 oklch color space — don't use raw hex; use CSS variable tokens

### Integration Points
- `asset_photos` table (created Phase 1) — stores photo records; Phase 2 inserts/updates/deletes rows here
- Supabase private Storage bucket (created Phase 1) — Phase 2 uploads to this bucket via browser client
- `assets` table — Phase 2 may add `extraction_stale` flag column; planner to decide
- `/assets/[id]/photos` → `/assets/[id]/extract` — route handoff to Phase 3; photo paths/URLs must be accessible to the Phase 3 Route Handler via signed URLs

</code_context>

<specifics>
## Specific Ideas

- Typical upload workflow: 1–2 exterior shots, 1 odometer/instrument cluster, 1–2 build plate photos = ~5–10 photos. But full sale photography can reach 50+ photos — cap at 80 to future-proof.
- The photo order taxonomy Jack has in mind (for a future auto-sort feature): exterior → body shots → underbody → extras → interior → instrument cluster/transmission → build plates. Not implemented in Phase 2 — see Deferred.
- Staff work primarily on phones in portrait orientation on-site; the photo upload page must be fully usable on a phone browser (this is already in UI-SPEC but worth emphasising for responsive layout decisions).

</specifics>

<deferred>
## Deferred Ideas

- **Auto photo ordering by type** — Staff want the app to automatically classify photos (exterior, underbody, interior, build plate, etc.) and order them according to a defined taxonomy. Requires AI vision to classify each image. Becomes higher priority with the 80-photo cap since manual drag-reorder of 50 photos is painful. Recommended home: Phase 3 Route Handler (GPT-4o is already called there — could return a `photoType` label per image alongside field extraction). Note for roadmap backlog.
- **Photo annotation / labelling** — Staff marking individual photos as "build plate", "odometer", "interior" etc. for downstream use. Related to auto-ordering above.

</deferred>

---

*Phase: 02-photo-capture-storage*
*Context gathered: 2026-03-17*
