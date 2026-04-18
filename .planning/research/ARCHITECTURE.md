# Architecture Research

**Domain:** Next.js 15 / GPT-4o AI extraction and description generation app (v1.6 milestone)
**Researched:** 2026-04-18
**Confidence:** HIGH — based on direct codebase inspection

---

## Existing System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19)                               │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────────┐  │
│  │ ExtractionPage   │  │ ReviewPageClient│  │ OutputPanel            │  │
│  │ Client           │  │ (react-hook-form│  │ (DescriptionBlock +    │  │
│  │ (trigger extract)│  │  + DynamicField │  │  FieldsBlock)          │  │
│  └────────┬─────────┘  │  Form)          │  └──────────┬─────────────┘  │
│           │            └────────┬────────┘             │               │
└───────────┼─────────────────────┼─────────────────────┼───────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SERVER — Route Handlers                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │ POST /api/extract│  │ saveReview()     │  │ POST /api/describe  │   │
│  │                  │  │ (Server Action)  │  │                     │   │
│  │ buildExtractionS │  │                  │  │ DESCRIPTION_SYSTEM_ │   │
│  │ buildSystemPrompt│  │ assets.fields    │  │ PROMPT (inline)     │   │
│  │ buildUserPrompt  │  │ JSONB <- write   │  │ buildDescription    │   │
│  │ Output.object()  │  │                  │  │ UserPrompt()        │   │
│  └────────┬─────────┘  └──────────────────┘  └──────────┬──────────┘   │
│           │                                              │              │
│  ┌────────▼─────────────────────────────────────────────▼──────────┐   │
│  │                    GPT-4o (Vercel AI SDK v6)                     │   │
│  │  /api/extract  -> generateText + Output.object({ schema })      │   │
│  │  /api/describe -> generateText (plain text)                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Supabase                                        │
│  assets.extraction_result (JSONB) — AI output before review             │
│  assets.fields (JSONB) — staff-confirmed values after review            │
│  assets.description (text) — AI-generated description                   │
│  asset_photos (storage_path -> Storage bucket 'photos')                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities (Existing)

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `buildExtractionSchema()` | `src/lib/ai/extraction-schema.ts` | Builds Zod schema from `FieldDefinition[]`, embedding `aiHint` and `options` in field `.describe()` |
| `buildSystemPrompt()` | `src/lib/ai/extraction-schema.ts` | Long system prompt: plate reading, odometer/hourmeter rules, damage assessment, manufacturer inference |
| `buildUserPrompt()` | `src/lib/ai/extraction-schema.ts` | User turn: structured staff-provided fields + freeform inspection notes |
| `POST /api/extract` | `src/app/api/extract/route.ts` | Auth, DB load, signed URLs, GPT-4o call, write `extraction_result` + clear `extraction_stale` |
| `POST /api/describe` | `src/app/api/describe/route.ts` | Auth, DB load, signed URLs, GPT-4o plain-text call, `toTitleCase`, `normalizeFooter`, write `description` |
| `DESCRIPTION_SYSTEM_PROMPT` | inline in `describe/route.ts` | ~1000-line inline constant containing all subtype templates + quality reference examples |
| `ReviewPageClient` | `src/components/asset/ReviewPageClient.tsx` | react-hook-form owner, re-extraction trigger, conflict resolution UI |
| `DynamicFieldForm` | `src/components/asset/DynamicFieldForm.tsx` | Renders all `FieldRow` components from sorted `FieldDefinition[]` |
| `FieldRow` | `src/components/asset/FieldRow.tsx` | Single field: label + `ConfidenceBadge` + input (text/number/select/textarea) via `Controller` |
| `parseStructuredFields()` | `src/lib/utils/parseStructuredFields.ts` | Shared (server+client) — parses `key: value` lines from `inspection_notes` |
| `getAIExtractableFieldDefs()` | `src/lib/schema-registry/index.ts` | Returns `FieldDefinition[]` where `aiExtractable: true` |
| `buildDefaultValues()` | `src/lib/review/build-form-schema.ts` | Priority: `savedFields` -> `extractionResult` -> smart defaults |

---

## Data Flow — Full Extraction Pipeline

```
Photos uploaded -> asset_photos (Supabase Storage)
                        |
                        v
POST /api/extract
  |- Load asset (type, subtype, inspection_notes)
  |- Load photos -> createSignedUrls (batch, 1hr TTL)
  |- buildExtractionSchema(assetType) -> Zod object
  |     +- getAIExtractableFieldDefs() -> FieldDefinition[]
  |           +- { value: z.string().nullable(), confidence: enum }
  |                 per field, with aiHint in .describe()
  |- buildSystemPrompt(type, subtype) -> plate reading rules + inference
  |- parseStructuredFields(inspection_notes) -> structured overrides
  |- buildUserPrompt(notes, structuredFields) -> user turn
  +- generateText + Output.object({ schema })
        +- writes extraction_result (JSONB) -> assets table

                        |
                        v
ReviewPageClient (staff review)
  |- buildDefaultValues: savedFields -> extractionResult -> ''
  |- Staff edits fields via react-hook-form
  |- Re-extraction available via "Re-run Extraction" button
  +- handleSubmit -> saveReview() Server Action -> assets.fields (JSONB)

                        |
                        v
POST /api/describe
  |- Load assets.fields (confirmed)
  |- Load signed photo URLs
  |- buildDescriptionUserPrompt: confirmed fields + verbatim values + freeform notes
  |- generateText (plain text, DESCRIPTION_SYSTEM_PROMPT)
  |- toTitleCase() -> normalizeFooter()
  +- writes assets.description
```

---

## v1.6 Capability Integration Points

### Capability 1: Improved Extraction Prompts (decimal numbers, make/model inference)

**Where it lives:** `src/lib/ai/extraction-schema.ts`

**What changes:**

- `buildSystemPrompt()` — modify inline. The hourmeter decimal issue is already partially addressed (the current prompt has an explicit READING HOURMETERS section). The fix is strengthening the rule with a concrete example: add `"1234.5 not 12345"` and a rule that a 5-digit number where the last digit appears separated by a dot must be read as `XXXX.X`. No new files.
- `aiHint` in schema field definitions — for suspension inference, the `suspension` field in truck/trailer/earthmoving schemas should carry make/model/year inference examples: "Kenworth T659 = Airbag front and rear as standard." This is a per-schema-file change in `src/lib/schema-registry/schemas/`.
- No new route handler needed. Both changes are configuration/prompt, not structural.

**Confidence:** HIGH — the system prompt and aiHint are the correct and established mechanism for this class of improvement.

---

### Capability 2: Description Style Matching (few-shot examples, tone)

**Where it lives:** `src/app/api/describe/route.ts` — the inline `DESCRIPTION_SYSTEM_PROMPT` constant.

**Current state:** The system prompt already contains 9 quality reference examples at the bottom (WHEEL LOADER EXAMPLE, EXCAVATOR WITH ATTACHMENTS EXAMPLE, PRIME MOVER EXAMPLE, etc.). These are few-shot examples — the mechanism is already correct.

**What changes:**

- The "QUALITY REFERENCE EXAMPLES" block at the end of `DESCRIPTION_SYSTEM_PROMPT` should be expanded with more examples from Jack's actual production descriptions. Adding 3-5 more examples for high-volume types (trucks, forklifts, trailers) strengthens style adherence. No structural change — purely prompt content.
- Extract `DESCRIPTION_SYSTEM_PROMPT` to a dedicated file `src/lib/ai/description-prompt.ts` as a named export. Currently it is a 1000+ line inline constant in the route handler. This makes it independently editable and testable. The route handler imports it. This is a refactor that enables easier iteration on quality.
- `QUICK_DESCRIPTION_PROMPT` should move to the same file.

**Few-shot example storage:** The examples live in the system prompt string — no database or dynamic loading. They are static, version-controlled content. `src/lib/ai/description-prompt.ts` is the right home.

**Confidence:** HIGH — few-shot examples in system prompt is the established pattern for GPT-4o style matching. No new infrastructure required.

---

### Capability 3: Inline Field-Level Re-extraction

**The question:** Separate endpoint, parameter on existing endpoint, or client-side override?

**Recommendation: Parameter on existing `/api/extract` endpoint**

The existing `/api/extract` already handles: auth check, DB load, signed URL generation (batched), schema building, and the GPT-4o call. Field-scoped re-extraction needs only two additions:
- Accept optional `fieldKeys: string[]` to scope which fields to extract
- Accept optional `fieldHints?: Record<string, string>` for staff-provided hints per field

When `fieldKeys` is present, `buildExtractionSchema()` filters to only those fields. GPT-4o receives all photos but only the targeted field(s) in the schema. The partial result is returned to the client and merged into local state — it is not written back to `assets.extraction_result` in the DB.

This avoids:
- A separate route handler with duplicated auth, DB, and URL logic
- A new DB column or separate table for partial extraction state
- Any change to `saveReview()` or the `assets.fields` write path

**The merge pattern:** `ReviewPageClient` already has `applyExtraction()` which calls `setValue()` for each key in the result. A partial `ExtractionResult` with one field works identically — keys absent from the partial simply are not updated.

**UI trigger:** An icon button (rotate/refresh icon) on each `FieldRow`, visible only for `aiExtractable: true` fields. Tapping it calls `/api/extract` with `{ assetId, fieldKeys: [field.key] }`. The response merges into local `extractionResult` state and updates the form value. A per-field loading state shows a spinner on the button while the call is in flight.

---

## New vs Modified — Complete List

| Component | Status | What Changes |
|-----------|--------|--------------|
| `src/lib/ai/extraction-schema.ts` — `buildExtractionSchema()` | **Modify** | Accept optional `fieldKeys?: string[]` param; filter `getAIExtractableFieldDefs()` to only the requested keys |
| `src/lib/ai/extraction-schema.ts` — `buildSystemPrompt()` | **Modify** | Strengthen hourmeter decimal rule with explicit example; reinforce odometer decimal rule |
| `src/app/api/extract/route.ts` | **Modify** | Parse optional `fieldKeys` and `fieldHints` from body; pass `fieldKeys` to `buildExtractionSchema()`; return partial result without writing to DB when `fieldKeys` is present |
| `src/lib/ai/description-prompt.ts` | **New** | Extract `DESCRIPTION_SYSTEM_PROMPT` and `QUICK_DESCRIPTION_PROMPT` from route handler; add expanded few-shot examples |
| `src/app/api/describe/route.ts` | **Modify** | Import prompts from `description-prompt.ts` instead of inline constants; no logic change |
| `src/lib/schema-registry/schemas/truck.ts` | **Modify** | Update `suspension` field `aiHint` with make/model/year inference examples |
| `src/lib/schema-registry/schemas/trailer.ts` | **Modify** | Same — suspension inference |
| `src/lib/schema-registry/schemas/earthmoving.ts` | **Modify** | Review `aiHint` on hourmeter field for decimal precision context |
| `src/components/asset/ReviewPageClient.tsx` | **Modify** | Add `triggerFieldReExtraction(fieldKey: string)` callback; pass down to `DynamicFieldForm`; handle partial result merge |
| `src/components/asset/DynamicFieldForm.tsx` | **Modify** | Accept `onFieldReExtract?: (key: string) => void`; pass to `FieldRow` |
| `src/components/asset/FieldRow.tsx` | **Modify** | Show re-extract icon button when `field.aiExtractable && onFieldReExtract`; show spinner while in-flight |

**No new route handlers needed.**

---

## Recommended File Structure Changes

```
src/
+-- lib/
|   +-- ai/
|   |   +-- extraction-schema.ts      # Modify: fieldKeys filter param
|   |   +-- description-prompt.ts     # NEW: extracted prompts + expanded examples
|   +-- schema-registry/
|       +-- schemas/
|           +-- truck.ts              # Modify: suspension aiHint
|           +-- trailer.ts            # Modify: suspension aiHint
|           +-- earthmoving.ts        # Modify: hourmeter aiHint
+-- app/
|   +-- api/
|       +-- extract/
|       |   +-- route.ts              # Modify: fieldKeys + fieldHints params
|       +-- describe/
|           +-- route.ts              # Modify: import prompt from description-prompt.ts
+-- components/
    +-- asset/
        +-- ReviewPageClient.tsx      # Modify: field re-extract callback
        +-- DynamicFieldForm.tsx      # Modify: pass callback down
        +-- FieldRow.tsx              # Modify: re-extract button + spinner
```

---

## Architectural Patterns

### Pattern 1: aiHint as Schema-Embedded Prompt Context

**What:** Each `FieldDefinition` carries an `aiHint?: string` injected into the Zod field's `.describe()` call. GPT-4o receives the hint as part of the structured output schema description.

**When to use:** Any field where the AI needs disambiguation — where to find the value, what format it takes, when to infer vs. read verbatim.

**Trade-offs:** Co-located with the field definition — easy to find and maintain. Hints are static per field (not dynamic per-asset), which is fine for v1.6.

**Example for suspension inference:**
```typescript
{
  key: 'suspension',
  label: 'Suspension',
  aiHint: 'Read from build plate or chassis label if visible. Otherwise infer from make/model/year — Kenworth T659 standard = Airbag front and rear; Hino 500 Series = Leaf front, Air rear; Freightliner Cascadia = Air ride. For trailers, look for chassis compliance label or Hendrickson/Airbag markings.',
  inputType: 'select',
  options: ['Airbag', 'Leaf Spring', 'Spring', 'Hendrickson', 'Coil', 'Rubber', 'Hydraulic', 'Other'],
  aiExtractable: true,
}
```

---

### Pattern 2: Output.object() for Structured Extraction

**What:** `generateText + Output.object({ schema })` (not `generateObject`, deprecated in AI SDK v6). Returns typed structured output matching the Zod schema.

**When to use:** All structured field extraction. For description generation, plain `generateText` is used (free text).

**Trade-offs:** Schema size affects token count. For a single-field re-extraction, the schema is tiny and the response is fast (2-5s vs 15-20s for full extraction).

---

### Pattern 3: Extracted Prompt Constants

**What:** Move `DESCRIPTION_SYSTEM_PROMPT` and `QUICK_DESCRIPTION_PROMPT` from inline in `describe/route.ts` to `src/lib/ai/description-prompt.ts`.

**When to use:** When a constant exceeds ~100 lines and is the main thing being iterated on. Separating it from the route handler logic makes both easier to read.

**Trade-offs:** One additional import in `describe/route.ts`. The prompt is now independently reviewable without touching request/response logic.

---

### Pattern 4: Client-Side Partial Result Merge

**What:** For field-level re-extraction, the server returns a partial `ExtractionResult` (only the requested field(s)). The client merges it into local state using the existing `setValue()` calls in `applyExtraction()`.

**When to use:** Any time the API returns a subset of the full extraction schema.

**Trade-offs:** The DB `extraction_result` column is not updated for partial re-extractions — it retains the original full extraction snapshot. The staff-confirmed `fields` column is always the source of truth after `saveReview()`. This is correct behaviour: the partial re-extract is a working hypothesis, not a committed record.

---

## Build Order — Recommended

Phase dependencies:

```
Phase A (Prompt accuracy) — no dependencies
  - buildSystemPrompt() hourmeter/decimal improvements
  - suspension aiHint on truck/trailer/earthmoving schemas

Phase B (Description quality) — no dependencies, parallel with A
  - Extract description-prompt.ts
  - Expand few-shot examples

Phase C (Inline re-extraction) — depends on Phase A (buildExtractionSchema filter)
  - /api/extract fieldKeys param
  - FieldRow re-extract button
  - ReviewPageClient + DynamicFieldForm wiring
```

| Phase | Scope | Effort | Files Changed |
|-------|-------|--------|---------------|
| A | Extraction prompt accuracy | Low | `extraction-schema.ts`, `truck.ts`, `trailer.ts`, `earthmoving.ts` |
| B | Description quality | Low-Medium | `description-prompt.ts` (new), `describe/route.ts` |
| C | Inline field re-extraction | Medium | `extract/route.ts`, `extraction-schema.ts`, `ReviewPageClient.tsx`, `DynamicFieldForm.tsx`, `FieldRow.tsx` |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate `/api/extract-field` Route Handler

**What people do:** Create a new route handler for field-level re-extraction.

**Why it's wrong:** Duplicates auth check, DB load, signed URL generation, schema building, and GPT-4o call. All of that exists in `/api/extract`. Field scope is a filter, not a different operation.

**Do this instead:** Add `fieldKeys?: string[]` to the existing route body. The handler is already under 120 lines. A `fieldKeys` filter adds 3 lines.

---

### Anti-Pattern 2: Writing Partial Re-extraction Results to DB

**What people do:** Write the single-field re-extraction result back to `assets.extraction_result` in Supabase.

**Why it's wrong:** `extraction_result` is the full extraction snapshot. Overwriting it with a partial result loses confidence scores and values for all other fields. It also forces a DB write for a speculative value the staff hasn't confirmed.

**Do this instead:** Return the partial result from the route and merge it into client-side `extractionResult` state only. Nothing is persisted until `saveReview()` writes `assets.fields`.

---

### Anti-Pattern 3: Few-Shot Examples in a Database

**What people do:** Store few-shot examples in Supabase, load them at request time, inject dynamically.

**Why it's wrong:** Adds latency (DB read before every description call), adds complexity, and the examples are curated static content that benefits from version control and code review.

**Do this instead:** Keep examples in `description-prompt.ts` as a constant. Add examples by editing the file and deploying. No runtime overhead.

---

### Anti-Pattern 4: Client-Side Value Restore Instead of Re-extraction

**What people do:** Add a "reset to AI value" button that just restores `extractionResult[field.key].value` without calling the API.

**Why it's wrong:** If the AI already returned a wrong value (e.g. hourmeter misread as 12345 instead of 1234.5), restoring the same wrong value does not help. The goal of inline re-extraction is to get a fresh AI read on that specific field.

**Do this instead:** The button triggers a fresh `/api/extract` call scoped to that field via `fieldKeys`. The spinner communicates a new AI call is in flight. On completion, the new value populates the form field. Staff can accept or type over it.

---

## Sources

- Direct codebase inspection: `src/app/api/extract/route.ts`, `src/app/api/describe/route.ts`, `src/lib/ai/extraction-schema.ts`, `src/components/asset/ReviewPageClient.tsx`, `src/components/asset/FieldRow.tsx`, `src/components/asset/DynamicFieldForm.tsx`
- `src/lib/schema-registry/types.ts` — `FieldDefinition` type with `aiHint`, `aiExtractable`, `options`
- `src/lib/schema-registry/index.ts` — `getAIExtractableFieldDefs()` pattern
- `.planning/PROJECT.md` — key decisions table, v1.6 target features, tech stack

---
*Architecture research for: Prestige Assets v1.6 — AI extraction quality and inline field re-extraction*
*Researched: 2026-04-18*
