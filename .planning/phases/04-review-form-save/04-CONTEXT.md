# Phase 4: Review Form + Save - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning (discussion was cut short — see Claude's Discretion for areas not discussed)

<domain>
## Phase Boundary

Staff confirm all AI-extracted data in a pre-filled editable form, work through a missing-information checklist (blocking and dismissible items), and save. There is no path to reach the output view without completing the review form and resolving or dismissing all checklist items. Re-triggering AI extraction from this screen is supported.

This phase ends when confirmed field values + checklist state are persisted to Supabase and the user is routed to the output view.

</domain>

<decisions>
## Implementation Decisions

### Form Layout
- **Flat scrollable list, matching the extraction result panel** — fields displayed in `sfOrder` (Salesforce order), one continuous scroll
- Consistent with what staff just reviewed on the extraction screen — no layout context switch
- No grouping sections required; no paginated views
- Earthmoving "2 pages" refers to Salesforce's display pagination, not the app's form structure — the app shows all fields in one scrollable form

### Low-Confidence Highlighting
- The existing `ConfidenceBadge` component (high/medium/low/not_found) is already built and used in the extraction panel
- **Reuse ConfidenceBadge** inline with each form field — consistent visual language
- Low-confidence fields (and not-found fields) should be visually distinct to prompt verification — at minimum a coloured left border or subtle background tint on the field row
- Exact visual treatment: **Claude's Discretion** — must be distinguishable without being alarming for "medium" confidence

### Missing Info Checklist
- Shows every field AI could not confidently extract (null value or low/not-found confidence)
- **Blocking items**: VIN, rego, serial — cannot be dismissed without entering a value or explicitly marking "unknown / not available" (e.g. "no rego plate affixed", "asset arrived locked")
- **Dismissible items**: optional fields (e.g. engine hours on a caravan, extras) — can be marked "not applicable"
- Checklist state persisted to Supabase: `flagged` / `dismissed-na` / `confirmed` / `unknown`
- Checklist placement: **Claude's Discretion** (above form, below form, or as a gate step — planner to choose what makes UX sense given the blocking constraint)
- Save button disabled / blocked until all blocking items are resolved or overridden

### Re-Extraction from Review
- Staff can update inspection notes and re-trigger AI extraction from the review screen
- **Value conflict rule**: not discussed — **Claude's Discretion**. Recommended default: AI overwrites all fields from the new extraction result, but any field the staff has manually typed into (dirty field) prompts: "AI found a new value — keep yours or use AI's?" Planner to decide pragmatic implementation.

### Save Action
- Upserts `assets.fields` JSONB with confirmed field values from the form
- Persists checklist state (`flagged` / `dismissed-na` / `confirmed` / `unknown`) to Supabase
- On success: route to output view (`/assets/[id]/output`)
- Extraction data (`assets.extraction_result`) is preserved as-is — not overwritten on save

### Claude's Discretion
- Exact visual treatment for low/medium confidence field rows in the form (border, background, badge placement)
- Missing info checklist placement (above form vs below vs modal/drawer gate step)
- Re-extraction value conflict handling (AI wins vs staff-edit wins vs per-field prompt)
- RHF + Zod schema construction strategy (dynamic schema from Schema Registry field definitions)
- Debounce / auto-save behaviour (if any) while staff edit fields before final save
- Error state if Save Server Action fails

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Asset Form — FORM-01 (correct Salesforce field schema per type, Truck ~35 fields, Earthmoving 2-page schema), FORM-02 (low-confidence fields visually highlighted)
- `.planning/REQUIREMENTS.md` §AI Extraction — AI-04 (missing info checklist: blocking vs dismissible items, checklist state persisted to Supabase)

### Phase context
- `.planning/PROJECT.md` — Salesforce field schemas per asset type (exact field names, ordering), constraints (server-only keys, ISO 27001, deterministic descriptions)
- `.planning/phases/03-ai-extraction/03-CONTEXT.md` — extraction_result JSONB shape (ExtractionResult type), confidence display decisions, ConfidenceBadge component, flat sfOrder list pattern

### Schema Registry (source of truth for form fields)
- `src/lib/schema-registry/types.ts` — `FieldDefinition` (key, label, sfOrder, inputType, options, required), `AssetSchema`
- `src/lib/schema-registry/index.ts` — `getFieldsSortedBySfOrder()`, `getSchema()` helpers
- `src/lib/ai/extraction-schema.ts` — `ExtractionResult` type (pre-fill source), `ExtractedField` shape

### Existing components to reuse
- `src/components/asset/ConfidenceBadge.tsx` — existing confidence indicator (high/medium/low/not_found); reuse in form field rows
- `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx` — shadcn primitives available

### Architecture
- `.planning/STATE.md` §Decisions — Server Action pattern for DB writes, `@supabase/ssr` `createServerClient`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/asset/ConfidenceBadge.tsx` — confidence level indicator; reuse inline with review form fields
- `src/lib/schema-registry/index.ts:getFieldsSortedBySfOrder()` — returns all fields in sfOrder; drives form field rendering order
- `src/lib/schema-registry/types.ts:FieldDefinition.inputType` — 'text' | 'number' | 'select' | 'textarea'; form must render appropriate input per field
- `src/lib/ai/extraction-schema.ts:ExtractionResult` — `Record<string, { value: string | null, confidence: 'high' | 'medium' | 'low' | null }>` — the pre-fill source
- `src/components/ui/input.tsx`, `label.tsx`, `button.tsx`, `card.tsx`, `separator.tsx` — all available; no additional shadcn install needed for basic form

### Established Patterns
- Server Actions for DB writes (`src/lib/actions/asset.actions.ts`) — save form follows same pattern
- `@supabase/ssr` `createServerClient` for auth + DB in Server Actions
- Files under `src/lib/` — `@/*` alias resolves to `./src`
- Tailwind v4 oklch color space — don't use raw hex; use CSS variable tokens
- `src/app/(app)/` route group — authenticated routes; review page goes at `/assets/[id]/review`

### Integration Points
- `assets` table: gains `fields` JSONB column (confirmed field values) and checklist state column(s) — planner to design schema
- `assets.extraction_result` JSONB (written in Phase 3): read-only source for form pre-fill; not overwritten on save
- `/assets/[id]/extract` → `/assets/[id]/review` — route handoff from Phase 3; review page reads extraction_result from DB
- `/assets/[id]/review` → `/assets/[id]/output` — route after successful save (Phase 5 implements output page)
- Phase 3 `ExtractionPageClient` has "Proceed to Review ▸" CTA wired to this route

</code_context>

<specifics>
## Specific Ideas

- No specific "I want it like X" references captured — discussion was cut short
- Consistency with extraction panel is the guiding UX principle for the form: same field ordering, same confidence indicators, familiar to staff who just reviewed the extraction results

</specifics>

<deferred>
## Deferred Ideas

- None captured — discussion was cut short before scope creep could surface

</deferred>

---

*Phase: 04-review-form-save*
*Context gathered: 2026-03-18*
