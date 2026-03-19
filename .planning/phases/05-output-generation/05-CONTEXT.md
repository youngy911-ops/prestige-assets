# Phase 5: Output Generation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

After completing the review form, staff land on `/assets/[id]/output` and get two copy-paste-ready blocks for Salesforce: a structured fields block (every field in Salesforce order with exact labels) and an AI-generated description (GPT-4o, editable before copy). Each block has its own copy-to-clipboard button with visible confirmation. There is a back link to `/assets/[id]/review` and a New Asset button. Description is generated automatically on page load.

This phase ends when the output page is live and both blocks can be copied to Salesforce.

</domain>

<decisions>
## Implementation Decisions

### Description Generation
- **GPT-4o** (same model as Phase 3 extraction) — NOT deterministic templates, NOT Claude API
- Server-side Route Handler (same pattern as `/api/extract`) — API key never client-side
- Input to GPT-4o: confirmed field values from `assets.fields` JSONB + **all uploaded photos** (base64, same as Phase 3) + inspection notes
- Output: plain text — no markdown, no commentary, exactly matching the subtype template format
- System prompt: fully defined in `.planning/phases/05-output-generation/05-description-prompt.md` — **researcher and planner must read this file**
- Universal rules enforced in prompt: no dot points, no serial numbers in body, no hours/odometer/GVM in description body, no marketing language, blank line between significant items, short related items comma-separated, correct footer
- Footer: "Sold As Is, Untested & Unregistered." for most types; "Sold As Is, Untested." for attachments and general goods
- TBC for any spec that cannot be confirmed from photos, inspection notes, or training knowledge
- `descriptionTemplate` stubs in Schema Registry are now obsolete — prompt replaces them

### Generation Trigger
- Auto-generates on page load (description call fires when staff arrive at `/assets/[id]/output`)
- Loading state shown while GPT-4o call is in progress
- **Regenerate button** on the description block — fires a fresh GPT-4o call; warns staff if they have edited the text before overwriting

### Error Handling (description)
- Auto-retry once on failure/timeout
- If retry also fails: show clear error message + empty editable textarea (fields block still visible; workflow not blocked)

### Description Editability
- Generated description rendered in an **editable textarea** — staff can tweak TBCs, fix errors, or add notes before copy-pasting to Salesforce
- Edited text is not saved back to DB automatically (staff copy-paste the final text to Salesforce)

### Structured Fields Block
- Every field for the asset type in `sfOrder` order with exact `label` values from Schema Registry
- Uses confirmed field values from `assets.fields` JSONB
- Claude's Discretion: how to handle empty/null fields (show blank vs omit) — planner to decide what makes copy-paste cleanest for Salesforce

### Copy-to-Clipboard
- Each block (fields and description) has its own copy button with visible confirmation (e.g. "Copied!" state)
- Claude's Discretion: exact confirmation treatment (toast, inline label change, checkmark animation)

### Navigation
- **Back link** → `/assets/[id]/review` (staff spotted data error while reading output)
- **New Asset button** → asset type wizard step 1 (Phase 6 adds full asset list)
- Claude's Discretion: whether output page stores generated description in DB so revisiting doesn't regenerate unnecessarily (recommended: yes, cache to DB)

### Glass's Valuation
- **Permanently out of scope** — not in Phase 5, not in v2, not in this project. Remove `hasGlassValuation` flag or leave unused.

### Claude's Discretion
- Empty/null field handling in the fields block (show blank vs omit line vs show "—")
- Exact copy confirmation treatment (toast vs inline label change)
- Whether generated description is persisted to DB to avoid unnecessary regeneration on revisit
- New Asset button destination (wizard step 1 is recommended)
- Output page overall visual layout (stacked blocks, card treatment, spacing)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Description system prompt (critical — read this first)
- `.planning/phases/05-output-generation/05-description-prompt.md` — Complete GPT-4o system prompt with per-subtype templates and universal format rules. This is the source of truth for description generation. Researcher must read this to understand the prompt structure; planner must use it verbatim.

### Requirements
- `.planning/REQUIREMENTS.md` §Salesforce Output — SF-01 (fields block: correct order + labels), SF-02 (description block: subtype format, footer), SF-03 (copy-to-clipboard with confirmation)

### Schema Registry (source of truth for fields block)
- `src/lib/schema-registry/types.ts` — `FieldDefinition` (key, label, sfOrder, inputType); `AssetSchema.hasGlassValuation` flag is obsolete for this phase
- `src/lib/schema-registry/index.ts` — `getFieldsSortedBySfOrder()` drives fields block ordering
- `src/lib/schema-registry/schemas/*.ts` — all 7 asset type schemas; `descriptionTemplate` stubs are obsolete (GPT-4o prompt replaces them)

### Phase 3 — AI extraction pattern (description call follows same pattern)
- `.planning/phases/03-ai-extraction/03-CONTEXT.md` — Route Handler pattern for GPT-4o call, photo passing as base64, same API key / `openai` SDK usage

### Architecture
- `.planning/PROJECT.md` — Key Decisions table (description changed to AI-generated 2026-03-19), server-only AI key constraint
- `.planning/STATE.md` §Decisions — Phase 03 entries for Route Handler pattern, generateText + Output.object() from AI SDK v6

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/schema-registry/index.ts:getFieldsSortedBySfOrder()` — returns fields in sfOrder; drives fields block
- `src/lib/schema-registry/types.ts:FieldDefinition.label` — exact Salesforce labels for copy-paste accuracy
- `/api/extract` Route Handler — established GPT-4o call pattern with base64 photos; description Route Handler follows same structure
- `src/components/ui/button.tsx`, `card.tsx`, `textarea.tsx` (shadcn) — available for output page UI

### Established Patterns
- Server Actions for DB reads/writes; Route Handlers for long-running AI calls
- `@supabase/ssr` `createServerClient` for auth + DB
- `src/app/(app)/` route group — authenticated routes; output page at `/assets/[id]/output`
- Tailwind v4 oklch color space — use CSS variable tokens, not raw hex
- `assets.fields` JSONB — confirmed field values written by `saveReview` Server Action in Phase 4

### Integration Points
- `assets.fields` JSONB (written in Phase 4): source for both fields block and GPT-4o description input
- `assets.extraction_result` JSONB (Phase 3): inspection notes and original photos paths accessible from same record
- `/assets/[id]/review` → `/assets/[id]/output` — route after `saveReview` succeeds (Phase 4 already routes here)
- `/assets/new` or wizard entry — New Asset button destination

</code_context>

<specifics>
## Specific Ideas

- "It's all specs, not what it does" — descriptions are pure technical specifications, never selling language or capability descriptions
- GPT-4o researches the exact make/model/year using training knowledge to confirm and fill spec gaps (cross-referencing Machines4U, IronPlanet, TradeMachines, Truck Sales, Carsales — as specified in the system prompt)
- Description textarea is editable: staff can fix TBCs or add specifics before copying to Salesforce

</specifics>

<deferred>
## Deferred Ideas

- Glass's Valuation (Caravan) — permanently removed from scope, not needed in any version of this project
- Forklift / Agriculture description templates — not in 05-description-prompt.md; researcher should note this gap and either add templates or confirm they fall under a generic format

</deferred>

---

*Phase: 05-output-generation*
*Context gathered: 2026-03-19*
