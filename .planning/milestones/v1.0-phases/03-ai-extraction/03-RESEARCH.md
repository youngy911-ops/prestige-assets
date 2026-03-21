# Phase 3: AI Extraction - Research

**Researched:** 2026-03-18
**Domain:** Vercel AI SDK v6 structured vision extraction, Next.js Route Handlers, Supabase JSONB storage
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Hybrid inspection notes**: 3–5 asset-type-specific structured input fields + freeform "Other notes" textarea
- **Structured fields driven by `inspectionPriority: true` flag** on `FieldDefinition` in Schema Registry
- **Notes placement**: On the photos page (`/assets/[id]/photos`), below the photo grid
- **Notes auto-save**: To DB with ~500ms debounce via Server Action + revalidatePath
- **Photo selection**: All uploaded photos sent to GPT-4o — no staff selection, no cap
- **Extraction result persistence**: Written to `extraction_result` JSONB column on `assets` table when Route Handler returns; distinct from `assets.fields`
- **Trigger + background flow**: POST to `/api/extract`; brief loading state; staff can navigate away immediately; no completion notification
- **The `/assets/[id]/extract` page**: If `extraction_result` exists → show results; if not → show trigger state
- **Confidence display**: All Salesforce fields shown (extracted or not); colour + icon system (green/amber/muted); flat scrollable list in `sfOrder`; no grouping
- **Failure states**: Complete API failure → error + "Try Again" + "Skip to Manual Entry"; partial extraction → show as-is
- **Post-extraction CTA**: "Proceed to Review" primary; "Re-run Extraction" secondary
- **Re-run**: Silently overwrites previous `extraction_result` — no warning
- **Route Handler (not Server Action)** for GPT-4o call — already decided in STATE.md; lives at `/api/extract`
- **Implementation pattern**: Vercel AI SDK `generateText()` with `Output.object()` and Zod schema

### Claude's Discretion
- Exact `inspectionPriority` field assignments per asset type and subtype (draft sensible defaults; Jack corrects in Phase 5)
- Exact DB column name for extraction result storage (e.g. `extraction_result`)
- Debounce duration for notes auto-save
- Exact loading message copy
- Error message copy for failure states
- Spinner/loading component design

### Deferred Ideas (OUT OF SCOPE)
- Photo selection for AI — staff explicitly choosing which photos go to GPT-4o
- Auto photo ordering by type — AI classifies photos and suggests reorder
- Status badge on asset list for in-progress extractions
- Inspection priority field corrections — Jack to confirm in Phase 5
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | App extracts only Schema Registry fields for the selected subtype with AI vision across all uploaded photos (build plate, compliance plate, etc.) with per-field confidence scores. Photos-only is fully supported. When make/model/year identified, AI infers known-spec fields at "inferred" confidence. | Vercel AI SDK `generateText` + `Output.object()` with Zod schema built dynamically from `getAIExtractableFields()`. Confidence per field modelled as an enum alongside each value. Image inputs via signed URL array in messages content. |
| AI-02 | User must review and confirm all AI-extracted data on a dedicated screen before the record is saved — no skip path. | Extraction result written to `extraction_result` JSONB (not `assets.fields`). Phase 4 reads `extraction_result` to pre-fill. `assets.fields` is only written in Phase 4 save action. |
| AI-03 | Staff can optionally enter freeform inspection notes before triggering extraction — passed to AI alongside photos. | Hybrid UI: structured priority fields per asset type (driven by `inspectionPriority: true` flag) + freeform textarea. Both included in the GPT-4o user message text alongside image parts. |
</phase_requirements>

---

## Summary

Phase 3 adds three capabilities: (1) an inspection notes UI on the photos page with per-asset-type structured fields and a freeform textarea, (2) a `/api/extract` Route Handler that calls GPT-4o via Vercel AI SDK with all photos and notes, writing the structured result to a new `extraction_result` JSONB column, and (3) a new `/assets/[id]/extract` page with four exclusive states (trigger, loading, result, failure).

The key technical fact: `generateObject()` is deprecated in Vercel AI SDK v6 (confirmed against official migration guide — it will be removed in a future version). The correct pattern is `generateText()` with `Output.object({ schema })`. Neither `ai` nor `@ai-sdk/openai` are currently installed — both must be added. The project already uses `zod@^4.3.6` which is compatible with AI SDK v6.

The DB requires a migration adding two columns to `assets`: `extraction_result JSONB` and `inspection_notes TEXT`. The `extraction_stale` flag (added in Phase 2) is already in place and must be cleared when a new `extraction_result` is stored. Codebase inspection confirms: no `src/app/api/` directory, no `src/lib/ai/` directory, no `src/lib/actions/` directory, and no `src/app/(app)/assets/[id]/extract/` route exist yet — all are new files for this phase.

**Primary recommendation:** Use `generateText` + `Output.object()` with a Zod schema dynamically built from `getAIExtractableFields()`. Each field in the schema is typed as `z.object({ value: z.string().nullable(), confidence: z.enum(['high','medium','low']).nullable() })` so the model can return null for fields it cannot determine.

---

## Standard Stack

### Core — New Installs Required
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | `^6.0.0` | Vercel AI SDK core — `generateText`, `Output`, streaming | Official Vercel AI SDK; v6 is current stable |
| `@ai-sdk/openai` | `^3.0.0` | OpenAI provider for AI SDK | First-party provider; handles API key, model IDs, structuredOutputs |

### Already Installed
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `zod` | `^4.3.6` | Schema validation | AI SDK v6 supports Zod 4 — no version change needed |
| `next` | `16.1.7` | Route Handlers, Server Actions | `/api/extract` is a Next.js Route Handler |
| `@supabase/ssr` | `^0.9.0` | Server Supabase client in Route Handler | `createServerClient` from existing `src/lib/supabase/server.ts` |
| `server-only` | `^0.0.1` | Guard AI key from client bundles | Already used in supabase/server.ts pattern |

### Installation
```bash
npm install ai @ai-sdk/openai
```

**Environment variable required (no `NEXT_PUBLIC_` prefix — server-only):**
```
OPENAI_API_KEY=sk-...
```

---

## Architecture Patterns

### Project Structure — New Files This Phase
```
src/
├── app/
│   ├── (app)/assets/[id]/
│   │   ├── photos/page.tsx          # EXTEND: add InspectionNotesSection below photo grid
│   │   └── extract/page.tsx         # NEW: Server Component — state dispatcher
│   └── api/
│       └── extract/route.ts         # NEW: Route Handler — GPT-4o call
├── components/asset/
│   ├── InspectionNotesSection.tsx   # NEW: Client Component — structured fields + textarea
│   ├── ExtractionTriggerState.tsx   # NEW: CTA + Skip link
│   ├── ExtractionLoadingState.tsx   # NEW: Spinner + message
│   ├── ExtractionResultPanel.tsx    # NEW: Field list + confidence badges
│   ├── ExtractionFailureState.tsx   # NEW: Error + retry
│   └── ConfidenceBadge.tsx          # NEW: UI primitive
├── lib/
│   ├── schema-registry/
│   │   ├── types.ts                 # EXTEND: add inspectionPriority?: boolean to FieldDefinition
│   │   └── schemas/                 # EXTEND: add inspectionPriority: true to priority fields
│   └── actions/
│       └── inspection.actions.ts    # NEW: Server Action for notes auto-save
└── __tests__/
    └── extract.route.test.ts        # NEW: Route Handler unit tests
supabase/
└── migrations/
    └── 20260318000003_extraction.sql  # NEW: extraction_result + inspection_notes columns
```

### Pattern 1: Vercel AI SDK v6 — generateText with Output.object()

`generateObject()` is deprecated in AI SDK v6 (confirmed: migration guide states "generateObject and streamObject have been deprecated. They will be removed in a future version."). Use `generateText()` with `Output.object()`:

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const { output } = await generateText({
  model: openai('gpt-4o'),
  output: Output.object({
    schema: extractionSchema,  // Zod schema built from Schema Registry
  }),
  messages: [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        // One entry per signed URL
        ...signedUrls.map(url => ({ type: 'image' as const, image: url })),
      ],
    },
  ],
})
```

### Pattern 2: Per-Field Extraction Schema with Confidence

Build a Zod schema where every extracted field is a nullable object containing a value and confidence level:

```typescript
// Each field becomes: { value: string | null, confidence: 'high' | 'medium' | 'low' | null }
const confidenceEnum = z.enum(['high', 'medium', 'low']).nullable()

function buildExtractionSchema(assetType: AssetType) {
  const extractableFields = getAIExtractableFields(assetType)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const fieldKey of extractableFields) {
    shape[fieldKey] = z.object({
      value: z.string().nullable().describe(
        'Extracted value, or null if not determinable from photos/notes'
      ),
      confidence: confidenceEnum.describe(
        'high = clearly visible/readable, medium = inferred with uncertainty, low = guess'
      ),
    })
  }
  return z.object(shape)
}
```

**Important:** Instruct GPT-4o explicitly in the system prompt to return `null` for value and confidence when a field cannot be determined — not a guess.

### Pattern 3: Image Input via Signed URLs

Supabase signed URLs are standard HTTPS URLs. Pass them directly as image content parts:

```typescript
// Source: https://ai-sdk.dev/docs/foundations/prompts
const signedUrls = await Promise.all(
  photos.map(async (photo) => {
    const { data } = await supabase.storage
      .from('photos')
      .createSignedUrl(photo.storage_path, 3600)
    return data?.signedUrl ?? null
  })
)

// Filter nulls, then include in messages content
content: [
  { type: 'text', text: userPrompt },
  ...signedUrls
    .filter(Boolean)
    .map(url => ({ type: 'image' as const, image: url! })),
]
```

### Pattern 4: Route Handler — Auth + AI Call + DB Write

```typescript
// src/app/api/extract/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  const { assetId } = await req.json()

  // 3. Load asset (RLS enforces ownership)
  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, inspection_notes')
    .eq('id', assetId)
    .single()
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  // 4. Load + sign photos
  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  const signedUrls = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from('photos')
        .createSignedUrl(p.storage_path, 3600)
      return data?.signedUrl ?? null
    })
  )

  // 5. Build schema + call GPT-4o
  const schema = buildExtractionSchema(asset.asset_type as AssetType)
  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema }),
    messages: [ /* system + user with images */ ],
  })

  // 6. Write result to DB
  await supabase
    .from('assets')
    .update({
      extraction_result: output,
      extraction_stale: false,
    })
    .eq('id', assetId)
    .eq('user_id', user.id)

  return Response.json({ success: true })
}
```

### Pattern 5: Notes Auto-Save Server Action

```typescript
// src/lib/actions/inspection.actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveInspectionNotes(
  assetId: string,
  notes: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({ inspection_notes: notes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/assets/${assetId}/photos`)
  return {}
}
```

### Pattern 6: DB Migration — New Columns

```sql
-- supabase/migrations/20260318000003_extraction.sql
alter table public.assets
  add column if not exists extraction_result jsonb,
  add column if not exists inspection_notes  text;
```

Neither column has a NOT NULL constraint — both are nullable by default. `extraction_result` is null until extraction is triggered; `inspection_notes` is null until staff type something.

### Anti-Patterns to Avoid
- **Using `generateObject()`**: Deprecated in AI SDK v6. Always use `generateText` + `Output.object()`.
- **`NEXT_PUBLIC_OPENAI_API_KEY`**: Must be `OPENAI_API_KEY` (no `NEXT_PUBLIC_` prefix) — key must never reach the client bundle.
- **Passing photos as base64 in the Route Handler**: The Route Handler runs on the server; signed URLs are valid HTTPS and can be passed directly as `image: url` — no base64 re-encoding needed.
- **Writing extraction results to `assets.fields`**: `fields` is for confirmed Phase 4 values only. Extraction result goes to `extraction_result` JSONB.
- **Using Server Actions for the AI call**: Server Actions are queued/sequential — documented decision in STATE.md. Long-running GPT-4o calls require Route Handler.
- **Structured fields with `inspectionPriority: true` that are NOT `aiExtractable: false`**: The structured input fields capture things photos can't show (odometer km, hours). They'll be in the notes text passed to AI, not re-extracted as vision fields.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured JSON output from GPT-4o | Custom JSON parsing / regex extraction | `generateText` + `Output.object()` | Handles OpenAI structured outputs mode, retries invalid JSON, validates against Zod schema automatically |
| Provider setup / API key injection | Manual `fetch` to OpenAI API | `@ai-sdk/openai` provider | Handles model routing, error types, timeout behaviour |
| Image content formatting | Manual multipart payload construction | AI SDK message content array with `type: 'image'` | SDK handles encoding, provider-specific formatting |
| Schema-to-Zod conversion | String-parsing field keys | `getAIExtractableFields()` + programmatic `z.object()` construction | Registry is already the source of truth |

**Key insight:** The AI SDK abstracts every provider-specific quirk of structured output (OpenAI's `response_format: json_schema` vs Anthropic's tool-use approach). Building around it means the project can swap models without touching extraction logic.

---

## Common Pitfalls

### Pitfall 1: `generateObject()` is Deprecated
**What goes wrong:** Code compiles but generates a deprecation warning; will break in AI SDK v7.
**Why it happens:** Most tutorials and Stack Overflow answers still show `generateObject()` — the deprecation happened in v6.
**How to avoid:** Always import `Output` from `'ai'` and pass it to `generateText()`.
**Warning signs:** TypeScript deprecation strikethrough on `generateObject`; JSDoc shows "deprecated".

### Pitfall 2: Zod 4 vs AI SDK Schema Compatibility
**What goes wrong:** AI SDK fails silently or throws a schema serialisation error at runtime.
**Why it happens:** AI SDK internally serialises the Zod schema to JSON Schema for OpenAI's structured outputs API. Some Zod 4 features (e.g. `z.pipe`, complex transforms) are not serialisable.
**How to avoid:** Use only `z.object`, `z.string`, `z.number`, `z.enum`, `.nullable()`, `.describe()` — the primitives. No transforms, no refinements, no `z.union` with non-literal types.
**Warning signs:** Runtime error mentioning "cannot serialize schema" or OpenAI API 400 error with "invalid_json_schema".

### Pitfall 3: GPT-4o Hallucinating Values Instead of Returning null
**What goes wrong:** Low-confidence fields return plausible-looking but fabricated values (e.g. VIN `1HGCM82633A123456`).
**Why it happens:** GPT-4o optimises for completing the schema; without explicit instruction it fills gaps.
**How to avoid:** System prompt must explicitly say: "If you cannot read a field clearly from the photos or notes, return `null` for both value and confidence. Do NOT guess." Use `.describe()` on each field to reinforce: "Return null if not visible in photos."
**Warning signs:** Extraction results look complete but every VIN matches a different common format; serial numbers are suspiciously well-formed.

### Pitfall 4: Signed URL Expiry During Long Extractions
**What goes wrong:** GPT-4o returns an image load error if the URL expires mid-request.
**Why it happens:** Supabase signed URLs have configurable expiry. A 60-second URL generated just before a 30-second AI call is fine, but 1-hour expiry (already the project pattern) gives ample headroom.
**How to avoid:** Keep the existing 3600-second (1-hour) expiry. Generate signed URLs immediately before the AI call in the Route Handler — not before.
**Warning signs:** API failure with image content errors from OpenAI, not from Supabase.

### Pitfall 5: Route Handler Cookie Access Limitation
**What goes wrong:** `createClient()` from `src/lib/supabase/server.ts` calls `cookies()` from `next/headers`. In a Route Handler, cookies are readable but the `setAll` callback will throw in some Next.js versions.
**Why it happens:** Route Handlers have different cookie-write semantics than Server Components.
**How to avoid:** The Route Handler only reads the session (auth check) and writes to the DB — it does not need to set cookies. The existing `createClient()` is safe for auth reads in Route Handlers. Confirmed pattern in Phase 2 (same Supabase server client used in pages).
**Warning signs:** Runtime error "Cookies can only be modified in a Server Action or Route Handler" — only relevant if you try to call `supabase.auth.signIn` etc. from the Route Handler.

### Pitfall 6: Large Photo Count and GPT-4o Token Limits
**What goes wrong:** 20+ photos exceeds GPT-4o's context window or incurs very high latency.
**Why it happens:** Each image consumes vision tokens; GPT-4o supports up to ~20 images per call in practice before performance degrades significantly.
**How to avoid:** The CONTEXT.md accepts this for v1 (book-in photos are typically 5–10). No code change needed, but document the practical limit. If an asset has >20 photos the call will still work — it will just be slower and more expensive.
**Warning signs:** API timeout (>60s), or OpenAI 400 error about max image count.

---

## Code Examples

### Complete Extraction Schema Builder
```typescript
// src/lib/ai/extraction-schema.ts
import { z } from 'zod'
import type { AssetType } from '@/lib/schema-registry/types'
import { getAIExtractableFields } from '@/lib/schema-registry'

const confidenceEnum = z.enum(['high', 'medium', 'low']).nullable()

export type ExtractedField = {
  value: string | null
  confidence: 'high' | 'medium' | 'low' | null
}

export type ExtractionResult = Record<string, ExtractedField>

export function buildExtractionSchema(assetType: AssetType) {
  const extractableFields = getAIExtractableFields(assetType)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const fieldKey of extractableFields) {
    shape[fieldKey] = z.object({
      value: z.string().nullable().describe(
        `Extracted value for ${fieldKey}. Return null if not determinable.`
      ),
      confidence: confidenceEnum.describe(
        'high: clearly visible. medium: inferred with uncertainty. low: uncertain. null: not found.'
      ),
    })
  }
  return z.object(shape)
}
```

### System Prompt for Extraction
```typescript
// Source: derived from AI-01 requirement + CONTEXT.md decisions
export function buildSystemPrompt(assetType: string, subtype: string): string {
  return `You are an industrial asset identification AI for an Australian auction house.
Analyse the provided photos of a ${assetType} (${subtype}) and extract the requested fields.

Rules:
- Read build plates, compliance plates, weight rating plates, cab cards, instrument clusters, and any other visible markings
- When make/model/year are clearly identified, you may use your training knowledge to infer manufacturer specifications (weight ratings, engine specs) — mark these as confidence "medium"
- If a field value is not visible or determinable from the photos and notes, return null for both value and confidence
- Do NOT guess or fabricate values — accuracy is more important than completeness
- Return values exactly as they appear (do not reformat serials, VINs, etc.)
- For numeric fields (odometer, hourmeter), extract the number only, no units`
}
```

### Image URL input pattern
```typescript
// Source: https://ai-sdk.dev/docs/foundations/prompts
messages: [
  {
    role: 'system',
    content: systemPrompt,
  },
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: buildUserPrompt(inspectionNotes, structuredFields),
      },
      ...validSignedUrls.map(url => ({
        type: 'image' as const,
        image: url,  // HTTPS URL — no base64 needed
      })),
    ],
  },
]
```

---

## `inspectionPriority` Field Assignments (Claude's Discretion — Jack Corrects in Phase 5)

These are sensible defaults based on what photos typically cannot capture for each asset type. Max 5 per type.

| Asset Type | Priority Fields (inspectionPriority: true) | Rationale |
|------------|---------------------------------------------|-----------|
| `truck` | `odometer`, `hourmeter`, `registration_number`, `registration_expiry`, `service_history` | Odometer/hourmeter rarely visible from plates; rego from cab card often not photographed |
| `trailer` | `registration_number`, `registration_expiry`, `tare`, `atm` | Weight specs on compliance plate sometimes unclear; rego essential |
| `earthmoving` | `hourmeter`, `pin`, `serial`, `odometer` | Hour meter on instrument cluster often missed; PIN/serial may be on obscured plates |
| `agriculture` | `hourmeter`, `serial`, `odometer`, `registration_number` | Agricultural equipment rarely photographed thoroughly |
| `forklift` | `hours`, `max_lift_capacity`, `serial` | Hours meter inside cabin; capacity may not be on visible plate |
| `caravan` | `odometer`, `vin`, `serial`, `registration` | Odometer inside vehicle; rego from physical plate |
| `general_goods` | `serial` (if present) | Most general goods have no standard plates; freeform notes carry all info |

**Note:** Subtype-specific variations (e.g. Prime Mover vs Tipper within Truck) should use the same parent-type priority fields in v1. Jack will refine per-subtype during Phase 5 accuracy validation.

**Important:** When adding `inspectionPriority: true` to schema files, verify the field key exists in that schema file before adding. If a listed key doesn't exist (e.g. `pin` might be named `serial_number` in earthmoving), use the closest equivalent and add a comment `// NOTE: Phase 5 — Jack to confirm field key`.

---

## DB Migration Required

Two new columns on `assets` table. Neither existed in Phase 1 or Phase 2 migrations (confirmed by inspection of `supabase/migrations/` — only `20260317000001_initial_schema.sql` and `20260317000002_photo_storage.sql` exist).

```sql
-- supabase/migrations/20260318000003_extraction.sql
alter table public.assets
  add column if not exists extraction_result jsonb,
  add column if not exists inspection_notes  text;
```

**Column semantics:**
- `extraction_result`: NULL until first extraction runs. Overwritten silently on re-run. Read by Phase 4 to pre-fill review form.
- `inspection_notes`: NULL until staff type. Persisted via debounced Server Action. Included in GPT-4o user message.
- `extraction_stale`: Already exists (Phase 2 migration). Set to `false` when new `extraction_result` is stored.

The `assets` table select in the photos page currently loads `extraction_stale` and `fields` — it will also need `inspection_notes` after this migration.

---

## State Machine — `/assets/[id]/extract` Page

Four mutually exclusive states. Server Component determines initial state from DB; client manages loading/failure transitions.

| State | Server Condition | Client Condition | Component |
|-------|-----------------|-----------------|-----------|
| Trigger | `extraction_result IS NULL` | `status !== 'loading'` | `ExtractionTriggerState` |
| Loading | — | POST in-flight | `ExtractionLoadingState` |
| Result | `extraction_result IS NOT NULL` | `status !== 'loading'` | `ExtractionResultPanel` |
| Failure | — | POST returned error | `ExtractionFailureState` |

The photos page also gains `InspectionNotesSection` below the photo grid. "Run AI Extraction" CTA on the photos page (already linked to `/assets/[id]/extract`) becomes a POST trigger — it should be replaced with a button that POSTs to `/api/extract` then navigates to the extract page.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject()` | `generateText()` + `Output.object()` | AI SDK v6 (Dec 2025) | `generateObject` is deprecated; avoid new code using it |
| Separate `streamObject()` | `streamText()` + `Output.object()` | AI SDK v6 | Same unification |
| Zod 3 schemas | Zod 4 schemas | AI SDK v5+ | Project already on Zod 4 — compatible |
| `openai('gpt-4o', { structuredOutputs: true })` | Default is `strictJsonSchema: true` | AI SDK v6 | Structured outputs enabled by default for GPT-4o |

**Deprecated / outdated:**
- `generateObject`: Do not use — deprecated in v6, slated for removal in v7
- `streamObject`: Same deprecation status
- `NEXT_PUBLIC_OPENAI_API_KEY`: Never appropriate — always server-only

---

## Open Questions

1. **GPT-4o structured output schema depth limit**
   - What we know: OpenAI structured outputs supports Zod schemas serialised to JSON Schema; max nesting depth is 5 levels
   - What's unclear: The per-field `{ value, confidence }` nesting is 2 levels deep inside the root object — well within limits. However, if `getAIExtractableFields()` returns 30+ fields, schema size could be a concern.
   - Recommendation: Proceed; 30 fields × 2 properties = a ~60-key JSON Schema, which is within OpenAI's documented limits.

2. **Actual GPT-4o accuracy on industrial build plates**
   - What we know: GPT-4o vision is state-of-the-art for OCR on photos. Build plates have standard layouts.
   - What's unclear: Slattery's actual photos may have glare, angle issues, or non-standard plates. Prompt engineering will need iteration.
   - Recommendation: Implement per the plan; Phase 5 is explicitly the accuracy validation phase where Jack corrects extraction results.

3. **`@ai-sdk/openai` v3 + Next.js 16 compatibility**
   - What we know: AI SDK v6 requires a recent Next.js version; Next.js 16 is very recent (project uses it).
   - What's unclear: There may be minor edge-case incompatibilities with the newest Next.js + AI SDK combination.
   - Recommendation: LOW concern — both are actively maintained by Vercel. Install and verify `npm run build` passes.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | Schema builder produces correct Zod shape for each asset type | unit | `npm run test -- --run` | ❌ Wave 0 |
| AI-01 | `inspectionPriority` flag added to FieldDefinition type and schemas | unit | `npm run test -- --run` | ✅ (extend existing `schema-registry.test.ts`) |
| AI-01 | Route Handler returns 401 for unauthenticated request | unit | `npm run test -- --run` | ❌ Wave 0 |
| AI-01 | Route Handler returns 404 when asset not found | unit | `npm run test -- --run` | ❌ Wave 0 |
| AI-02 | `extraction_result` written to DB on success; `assets.fields` NOT touched | unit (mock) | `npm run test -- --run` | ❌ Wave 0 |
| AI-02 | `extraction_stale` set to false on successful extraction | unit (mock) | `npm run test -- --run` | ❌ Wave 0 |
| AI-03 | `inspection_notes` saved via Server Action (auth check, DB write, revalidate) | unit | `npm run test -- --run` | ❌ Wave 0 |
| AI-03 | `InspectionNotesSection` renders correct fields for asset type | unit (component) | `npm run test -- --run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test -- --run && npm run build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/extraction-schema.test.ts` — covers buildExtractionSchema() Zod shape (REQ AI-01)
- [ ] `src/__tests__/extract-route.test.ts` — covers Route Handler auth/404/success/DB write (REQ AI-01, AI-02)
- [ ] `src/__tests__/inspection-actions.test.ts` — covers saveInspectionNotes Server Action (REQ AI-03)

Note: `src/__tests__/schema-registry.test.ts` exists and will be extended with `inspectionPriority` assertions — no new file needed for that.

---

## Sources

### Primary (HIGH confidence)
- `https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data` — Output.object() pattern, generateText usage (verified 2026-03-18)
- `https://ai-sdk.dev/docs/foundations/prompts` — image content array structure (URL, base64, Buffer)
- `https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0` — generateObject deprecation confirmed: "generateObject and streamObject have been deprecated. They will be removed in a future version." (verified 2026-03-18)
- `https://ai-sdk.dev/providers/ai-sdk-providers/openai` — OpenAI provider config, model IDs, OPENAI_API_KEY
- Project source: `src/lib/schema-registry/` — all 7 schemas read directly; `getAIExtractableFields()` helper confirmed
- Project source: `supabase/migrations/` — DB state confirmed (extraction_result and inspection_notes do NOT exist yet; only 2 migration files present)
- Project source: `package.json` — confirmed `ai` and `@ai-sdk/openai` are NOT installed; `zod@^4.3.6` IS installed; `next@16.1.7`

### Secondary (MEDIUM confidence)
- `https://vercel.com/blog/ai-sdk-6` — AI SDK 6 announcement, confirmed v6 current stable, breaking changes summary
- npm search results — `@ai-sdk/openai` v3.x current; `ai` v6.x current

### Tertiary (LOW confidence)
- WebSearch results on Zod 4 + AI SDK compatibility — some user reports of lingering issues in v5; v6 considered resolved; LOW because not verified against official changelog

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against official AI SDK docs and project package.json
- Architecture: HIGH — Route Handler pattern confirmed in STATE.md; image URL pattern confirmed in official docs
- Pitfalls: HIGH (deprecation, null hallucination, signed URL expiry); MEDIUM (Zod 4 schema limits — from community reports)
- inspectionPriority field assignments: MEDIUM — sensible defaults based on domain knowledge; explicitly deferred to Jack for Phase 5 correction

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (AI SDK is fast-moving — re-verify if >30 days before planning begins)
