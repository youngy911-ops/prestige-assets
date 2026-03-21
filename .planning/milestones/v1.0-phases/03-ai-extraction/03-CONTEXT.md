# Phase 3: AI Extraction - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff trigger AI extraction from the photos page — the app sends all uploaded photos + optional inspection notes to GPT-4o, extracts all Salesforce fields for the asset subtype with per-field confidence scores, and displays results before any data is saved. This phase ends when extraction results are stored and visible. Phase 4 is where staff confirm/edit the extracted values.

Staff never have to wait for extraction to complete — they can navigate away and return later to see results.

</domain>

<decisions>
## Implementation Decisions

### Inspection Notes — Format
- **Hybrid approach**: 3–5 asset-type-specific structured input fields + a freeform "Other notes" textarea
- Structured fields show the most important values staff know on-site that photos can't reliably capture (e.g. odometer km, engine hours, number of keys — specific fields depend on asset type, see Inspection Fields section below)
- Structured fields are flagged `inspectionPriority: true` in the Schema Registry per asset type — this is the mechanism that drives which fields appear
- After the structured fields, a freeform "Other notes" textarea accepts anything else (VIN, rego, dimensions, body builder, service history, etc.) in natural language
- Both structured fields and freeform textarea are passed to GPT-4o alongside photos

### Inspection Notes — Placement + Persistence
- Notes live on the **photos page** (`/assets/[id]/photos`), below the photo grid — staff write notes while they can still see the photos, then tap "Run AI Extraction"
- Notes **auto-save** to the DB with a short debounce (~500ms) — consistent with how photos work; notes survive navigation away
- Textarea is **always visible** (not collapsed behind a toggle) — the empty state is a gentle nudge, not a barrier
- Placeholder text is **field-specific**: lists the kinds of info that help ("VIN, rego, odometer (km), engine hours, number of keys, service history, body builder…") — staff see what to include without being required to fill everything

### Inspection Fields per Asset Type
- The Schema Registry gains an `inspectionPriority: true` flag on `FieldDefinition`
- Which fields get this flag is **Claude's Discretion** — planner drafts sensible defaults per asset type (e.g. Truck: odometer, hourmeter, registration_number; Earthmoving: hourmeter, serial number equivalent; Forklift: capacity, hours; Caravan: odometer), then Jack corrects/confirms during Phase 5 when accuracy is validated
- Max 5 structured fields per asset type — keeps the pre-extraction screen fast
- Even within a type (e.g. Truck subtypes: Prime Mover vs Tipper), subtypes may have different priority fields — planner to define per schema, Jack to correct in Phase 5

### Photo Selection for AI
- **All uploaded photos** are sent to GPT-4o — no staff selection, no photo-count cap
- Rationale: in the book-in workflow, staff only upload identification photos (build plate, compliance plate, odometer, etc. — typically 5–10 photos). Sale/auction photos are a separate activity handled directly in Salesforce
- If staff have uploaded bulk sale photos alongside book-in photos, this is an edge case — accepted for v1; photo selection UI is a deferred idea

### Extraction Result Persistence
- Extraction result (fields + confidence scores) is written to a **separate `extraction_result` JSONB column** on the `assets` table immediately when the Route Handler returns a successful response
- This is distinct from `assets.fields` (the confirmed field values written in Phase 4)
- Staff can navigate away after triggering extraction — results are waiting when they return
- When returning to an asset with stored extraction results, the extract page **loads results immediately** (no trigger screen)
- Re-running extraction **silently overwrites** the previous extraction_result (no warning) — results aren't confirmed yet, so nothing is lost
- `extraction_stale` flag (already in DB from Phase 2) is cleared when a new extraction_result is stored

### Extraction Trigger + Background Flow
- Staff tap "Run AI Extraction" on the photos page → brief loading state ("Starting extraction…") → staff can navigate away immediately
- Extraction runs server-side in the Route Handler; the client doesn't need to wait
- **No notification** when extraction completes — staff check when they return to the asset (silent background completion)
- The `/assets/[id]/extract` page is the result page: if extraction_result exists → show results; if not → show trigger state

### Confidence Display
- **All fields shown** — every Salesforce field for the asset subtype appears in the panel, whether extracted or not
- Extracted fields: show value + confidence indicator
- Unextracted fields: show "—" or "Not found" with a muted/empty state
- Confidence levels visualised with **colour + icon**: green checkmark (high), amber dot (medium), red/muted warning icon (low / not found)
- Fields displayed in a **flat scrollable list** in `sfOrder` (Salesforce field order) — no grouping
- Staff can scroll through the full result at a glance

### Loading State
- Spinner + message: "Analysing photos and notes…" while GPT-4o is running
- After response: navigate away is available immediately (background completion pattern)
- Estimated wait: 5–30 seconds depending on photo count

### Failure States
- **Complete API failure** (network error, GPT-4o timeout, Zod parse failure): show error message + "Try Again" button + "Skip to Manual Entry" secondary action. No data written on failure.
- **Partial extraction** (some fields null, some extracted): this is normal and expected — show results as-is; null fields show as "Not found". Staff proceed to Phase 4 review to fill gaps.
- Retry always overwrites silently (same rule as re-run)

### Post-Extraction CTA
- Primary CTA: **"Proceed to Review ▸"** — takes staff to Phase 4 review form pre-filled with extraction results
- Secondary: smaller "Re-run Extraction" link for cases where staff want to add more photos or notes and re-extract

### Claude's Discretion
- Exact `inspectionPriority` field assignments per asset type and subtype (draft sensible defaults; Jack corrects in Phase 5)
- Exact DB column name for extraction result storage (e.g. `extraction_result`)
- Debounce duration for notes auto-save
- Exact loading message copy
- Error message copy for failure states
- Spinner/loading component design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §AI Extraction — AI-01 (schema-driven extraction with confidence scores, photos-only supported), AI-02 (review required before save), AI-03 (optional inspection notes alongside photos)

### Project context
- `.planning/PROJECT.md` — Constraints (server-only AI keys, ISO 27001, private Storage, deterministic descriptions), Salesforce field schemas per asset type
- `.planning/phases/01-foundation-schema-registry/01-CONTEXT.md` — Schema Registry structure, FieldDefinition type (gains `inspectionPriority` flag in this phase), shadcn v4 / Tailwind v4 patterns
- `.planning/phases/02-photo-capture-storage/02-CONTEXT.md` — Photo storage path structure, `extraction_stale` flag, route handoff (/photos → /extract), `getAIExtractableFields()` helper

### Schema Registry
- `src/lib/schema-registry/types.ts` — `FieldDefinition` type (needs `inspectionPriority?: boolean` addition), `AssetType`, `AssetSchema`
- `src/lib/schema-registry/index.ts` — `getAIExtractableFields()`, `getSchema()` helpers; new helpers for inspection-priority fields to be added here

### Routing + page structure
- `src/app/(app)/assets/[id]/photos/page.tsx` — Photos page; inspection notes textarea + auto-save goes here; "Run AI Extraction" CTA already wired to `/assets/[id]/extract`

### Architecture decision
- `.planning/STATE.md` §Decisions — "Route Handler (not Server Action) for GPT-4o call — Server Actions are queued/sequential, unsuitable for long-running AI calls"

No external API specs — Vercel AI SDK `generateObject()` with Zod schema is the implementation pattern; researcher to identify current version and structured output approach.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/schema-registry/index.ts:getAIExtractableFields()` — returns field keys flagged `aiExtractable: true` per asset type; Phase 3 Route Handler uses this to build the Zod extraction schema
- `src/lib/schema-registry/types.ts:FieldDefinition` — needs `inspectionPriority?: boolean` added; all existing fields default to `false`
- `src/components/ui/badge.tsx` — shadcn Badge; use for confidence level chips (high/medium/low)
- `src/components/ui/button.tsx` — shadcn Button; "Run AI Extraction", "Proceed to Review", "Try Again" CTAs
- `src/lib/supabase/server.ts` — server Supabase client; use in Route Handler for auth check + signing URLs + writing extraction_result

### Established Patterns
- Route Handler (not Server Action) for AI call — already decided; lives at `/api/extract`
- `@supabase/ssr` `createServerClient` pattern for auth + DB in Route Handler
- Presigned URL generation: `supabase.storage.from('photos').createSignedUrl(path, 3600)` — used in photos page; same pattern in Route Handler
- Server Actions with `revalidatePath` for auto-save (inspection notes debounced save)
- Tailwind v4 oklch color space — don't use raw hex; use CSS variable tokens
- Files under `src/lib/` — `@/*` alias resolves to `./src`

### Integration Points
- `assets` table: gains `extraction_result` JSONB column (raw AI output + confidence scores) and `inspection_notes` text column (if not already added)
- `extraction_stale` flag (already in assets table from Phase 2): cleared when new extraction_result is stored
- `/assets/[id]/photos` page: gains inspection notes textarea + per-asset-type structured fields (Phase 3 extends this page)
- `/assets/[id]/extract` route: new page — result display when extraction_result exists, trigger state when it doesn't
- `/api/extract` Route Handler: new endpoint — auth check, signed URL generation for all photos, GPT-4o call via Vercel AI SDK `generateObject()`, write result to DB
- Phase 4 will read `extraction_result` to pre-fill the review form

</code_context>

<specifics>
## Specific Ideas

- Background extraction is a core UX principle for this phase — staff book-in assets quickly one after another; the extract page should never feel like a blocking wait screen
- The two-part inspection notes UI (structured key fields + freeform textarea) is more helpful than a plain textarea — staff see exactly what the app wants from them, and anything else goes in the freeform area
- "Skip to Manual Entry" should always be visible as a fallback on extraction failure (and arguably on the trigger screen too) — some assets may be booked in purely from a written VIN with no useful photos

</specifics>

<deferred>
## Deferred Ideas

- **Photo selection for AI** — Staff explicitly choosing which photos go to GPT-4o (checkbox on thumbnails). Current decision: send all uploaded photos. If bulk sale photos and book-in photos are mixed in one upload, this becomes relevant. Add to roadmap backlog.
- **Auto photo ordering by type** — AI classifies photos (build plate, exterior, interior, etc.) and suggests a reorder. Noted in Phase 2 deferred; still relevant if photo selection is added. Potential home: Phase 3 Route Handler returns a `photoType` label per image alongside field extraction.
- **Status badge on asset list for in-progress extractions** — "Extracting…" / "Ready for review" status visible from the asset list without navigating to the asset. Current decision: silent background; staff check when they return. Low priority in v1.
- **Inspection priority field corrections** — Jack to confirm/correct per-asset-type `inspectionPriority` field assignments during Phase 5 when Salesforce output accuracy is validated.

</deferred>

---

*Phase: 03-ai-extraction*
*Context gathered: 2026-03-18*
