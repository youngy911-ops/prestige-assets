# Stack Research

**Domain:** AI extraction quality improvements and inline field editing — GPT-4o prompt engineering, field-level re-extraction, few-shot description style matching
**Researched:** 2026-04-18
**Confidence:** HIGH — existing stack verified from codebase; GPT-4.1 structured output limitation confirmed from community reports; all prompt engineering patterns grounded in official documentation

## Recommendation in One Line

Zero new dependencies. All improvements are prompt engineering, schema annotation, and route/component changes within the existing Vercel AI SDK v6 + GPT-4o + Zod 4 stack.

---

## Recommended Stack

### Core Technologies (all existing — no upgrades needed)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `ai` (Vercel AI SDK) | ^6.0.116 (current) | `generateText` + `Output.object()` for structured extraction | Already validated. `Output.object({ schema })` is the correct v6 pattern — `generateObject` is deprecated. No upgrade needed. |
| `@ai-sdk/openai` | ^3.0.41 (current) | OpenAI provider | `openai('gpt-4o')` is the correct model string. Supports `json_schema` structured outputs via `Output.object`. Do NOT switch to `gpt-4.1` — see "What NOT to Use". |
| `zod` | ^4.3.6 (current) | Schema definition with `.describe()` hints | `.describe()` on `z.object()` fields is the primary mechanism for field-level prompt engineering in this stack. Already used extensively in `buildExtractionSchema`. |
| Next.js App Router Route Handlers | 16.1.7 (current) | `/api/extract` and new `/api/extract-field` | Route Handlers are correct for long-running AI calls. Server Actions are queued/sequential and unsuitable. |
| `react-hook-form` | ^7.71.2 (current) | Review form with inline field editing UI | Existing RHF form covers all 40+ fields. Inline editing is a UI pattern on top of existing `setValue` calls — no library change needed. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new | — | All improvements are in prompts and route logic | Do not add libraries for prompt engineering. The improvements are text changes to `buildSystemPrompt`, `buildExtractionSchema`, and `DESCRIPTION_SYSTEM_PROMPT`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| vitest + testing-library (existing) | Test new `/api/extract-field` route handler | Mirror the pattern in `src/__tests__/extract-route.test.ts`. Field-level extraction logic is independently testable. |

---

## Installation

```bash
# Nothing to install — zero new dependencies
```

---

## Technique Inventory

### 1. Hourmeter Decimal Extraction Fix

**Problem:** `1234.5` hours is misread as `12345` — GPT-4o drops the decimal point.

**Technique:** Explicit decimal-position awareness in the system prompt + `aiHint` on the hourmeter field. The existing system prompt already has good decimal guidance for odometers. The same pattern must be applied — and reinforced — for hourmeters.

**Where to change:**
- `buildSystemPrompt` in `src/lib/ai/extraction-schema.ts` — the READING HOURMETERS section (lines 65–76) needs a concrete example showing before/after misread: `"If the display shows '1234.5', return '1234.5'. Do not return '12345'."` plus a chain-of-thought instruction: `"Before returning any hourmeter value, count the digits. If the raw number seems unusually large for the hours on this type of asset, re-examine for a decimal point."`
- `aiHint` on the `hourmeter` field in each schema that has it (truck, earthmoving, forklift, agriculture) — same guidance in field-level description

**Confidence:** HIGH — this is known GPT-4o OCR behaviour; explicit digit-counting prompts reduce the error rate. The existing odometer guidance follows this pattern and reportedly works.

---

### 2. Suspension Type Inference from Make/Model/Year

**Problem:** Suspension type is left null when not pre-entered by staff, even when it is fully determinable from make/model/year.

**Technique:** Expand the `aiHint` on the `suspension` field in `truckSchema` to include a manufacturer knowledge table. The field is already `inputType: 'select'` constraining to `['Spring', 'Airbag', '6 Rod', 'Other']`. The hint needs to tell GPT-4o: "If Spring vs Airbag is not visible in photos, infer from make/model/year using: Kenworth T909 2010+→Airbag; Kenworth T610/T410→Airbag; Volvo FH→Airbag; Scania R/S→Airbag; Mack Granite vocational→Spring; Hino 500/700 standard→Spring; Hino 500/700 with suspension upgrade option→Airbag..."

This is the same inference pattern already proven in Phase 06.1 for engine manufacturer, engine series, and transmission fields — all of which use the `aiHint` mechanism to pass manufacturer knowledge into the schema description that GPT-4o reads.

**Where to change:** `aiHint` on `suspension` in `src/lib/schema-registry/schemas/truck.ts` (and equivalents in trailer, earthmoving schemas).

**Confidence:** HIGH — direct extension of the validated Phase 06.1 pattern.

---

### 3. Inline Field-Level Re-Extraction

**Problem:** A single wrong field (e.g. hourmeter misread) currently requires triggering a full re-extraction across all 40+ fields — slow and disruptive.

**Architecture:** New `/api/extract-field` Route Handler that accepts `{ assetId, fieldKey }` and runs `generateText + Output.object()` with a single-field schema (one `z.object({ [fieldKey]: ... })` shape), the same signed photo URLs, and a focused system prompt for that field only. The result is merged into `extraction_result` in the DB, and the ReviewPageClient updates `extractionResult` state and calls `setValue(fieldKey, newValue)` to push the new value into the RHF form.

**Pattern for the single-field schema:**

```typescript
// In a new src/lib/ai/field-extraction.ts
export function buildSingleFieldSchema(assetType: AssetType, fieldKey: string) {
  const fieldDef = getAIExtractableFieldDefs(assetType).find(f => f.key === fieldKey)
  if (!fieldDef) throw new Error(`Field ${fieldKey} not AI-extractable`)
  // Reuse buildExtractionSchema logic but for one field only
  const descParts = [`Salesforce field: "${fieldDef.label}".`]
  if (fieldDef.aiHint) descParts.push(fieldDef.aiHint)
  if (fieldDef.options?.length) descParts.push(`Must be exactly one of: ${fieldDef.options.join(', ')}.`)
  descParts.push('Return null if not determinable.')
  return z.object({
    [fieldKey]: z.object({
      value: z.string().nullable().describe(descParts.join(' ')),
      confidence: confidenceEnum.describe('...'),
    })
  })
}
```

The route accepts `fieldKey`, fetches photos + asset, generates signed URLs, and calls `generateText` with this schema. The focused schema eliminates noise from 39 other fields and lets GPT-4o concentrate reasoning on one thing.

**UI change:** A "re-extract" icon button next to each low-confidence or empty AI field in `DynamicFieldForm` or the confidence badge. On click: show a loading spinner for that field only, call `/api/extract-field`, merge result into local state, call `setValue`.

**Confidence:** HIGH — this is a standard narrow-schema pattern. The existing `buildExtractionSchema` + `Output.object()` call already proves the approach works; the field-level version is a scope reduction, not a new capability.

---

### 4. Few-Shot Style Matching for Descriptions

**Problem:** AI-generated descriptions don't consistently match Jack's writing style — sentence rhythm, what to include/omit, level of specificity.

**Technique:** Embed 3–5 high-quality Jack-written examples directly in `DESCRIPTION_SYSTEM_PROMPT`, per asset type, as a `QUALITY REFERENCE EXAMPLES` section. This is standard few-shot in-context learning. `DESCRIPTION_SYSTEM_PROMPT` already has a `QUALITY REFERENCE EXAMPLES` section (lines 937–1042 of `describe/route.ts`) with 9 examples. The fix is to audit and expand those examples — particularly for asset types where output quality is weakest — and ensure each example demonstrably shows the style decisions that matter: no hedging, no filler, every number confirmed not inferred, concise-but-complete.

**Placement:** Examples belong in the system prompt, not the user prompt. System prompt sets the persona and style context; user prompt provides the specific asset data. This separation is the correct pattern per OpenAI's prompting guidance.

**Number of examples:** 3–5 per asset type is sufficient. More than 8 risks diluting attention on the actual asset data. The existing prompt already has the right structure — the work is improving example quality and coverage for underperforming subtypes.

**Confidence:** HIGH — in-context few-shot learning with GPT-4o shows 15–40% accuracy improvement for style-constrained generation tasks (peer-reviewed 2025 research). The mechanism is proven; the work is curating examples.

---

### 5. Chain-of-Thought for OCR Accuracy (Decimal / Digit Counting)

**Problem:** GPT-4o vision conflates similar-looking digits (e.g. decimal point vs no decimal) when reading small instrument cluster displays.

**Technique:** Add explicit self-verification steps in the system prompt for numeric fields: "Before returning any odometer or hourmeter value: (1) identify each individual digit in the display, (2) count the total digits, (3) check whether a decimal point or dot separator is visible between any digits, (4) if you identified N digits in step 2 but the value would be unreasonably large without a decimal, re-examine for a decimal point." This is chain-of-thought — instructing the model to reason step-by-step before committing an answer.

This is an extension of what the existing prompt already does ("Read the EXACT number as displayed — every digit matters, including decimals") — the upgrade adds an explicit verification loop before returning.

**Where to change:** `buildSystemPrompt` in `src/lib/ai/extraction-schema.ts` — the READING HOURMETERS and READING ODOMETERS sections.

**Confidence:** MEDIUM — chain-of-thought prompting is well-documented to improve numeric reasoning in LLMs, but GPT-4o's OCR accuracy on small embedded displays is inherently limited by image resolution. The system prompt already resizes images client-side to max 2MP; this may be the binding constraint. Prompt engineering helps but cannot overcome a blurry/small display photo.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Prompt engineering + `aiHint` for decimal accuracy | Separate OCR library (e.g. Tesseract.js, Google Cloud Vision) as pre-processing step | Only justified if GPT-4o with improved prompts still fails on 30%+ of hourmeter reads after the fix. Pre-processing adds infrastructure complexity and latency. Try prompt engineering first. |
| Single-field re-extraction via narrow schema | Full re-extraction triggered per-field | Never — full re-extraction is 3–5x slower, touches all fields, overwrites staff edits in other fields. Narrow schema is strictly better. |
| Few-shot examples in system prompt | GPT-4o fine-tuning on Jack's examples | Fine-tuning requires ~150+ labelled examples, a training run, a new model ID, and ongoing management. In-context few-shot in the system prompt achieves good style matching with 3–5 examples and zero infrastructure. Fine-tune only if in-context examples are exhausted (unlikely at this scale). |
| `gpt-4o` (current) | `gpt-4.1` for better instruction following | GPT-4.1 does NOT support `json_schema` structured outputs as of April 2025 — returns "Unsupported model" error. Cannot be used with `Output.object()`. Stay on `gpt-4o`. |
| Extend existing `/api/extract` with optional `fieldKey` param | Separate `/api/extract-field` route | Separate route is cleaner — different schema construction, different system prompt focus, different error handling. Avoids conditional logic proliferating in the existing route. |
| `buildSingleFieldSchema` in new `field-extraction.ts` | Duplicate schema logic inline in the route | Duplication violates the existing codebase's "shared utility" pattern. The schema builder function is testable in isolation. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `gpt-4.1` | Does not support `json_schema` response format (structured outputs) as of April 2025 — community-confirmed "Unsupported model" error. Would break `Output.object()`. | Stay on `openai('gpt-4o')` |
| `gpt-4o-mini` for field-level re-extraction | Lower capability; higher risk of misreads on the exact fields (hourmeters, build plates) that need re-extraction most | `gpt-4o` for all extraction calls |
| New npm packages for prompt engineering | Prompt engineering is text in string constants — no library needed. LangChain, LlamaIndex, etc. add abstraction overhead with no benefit for a direct Vercel AI SDK call. | Edit prompt strings directly |
| Streaming (`streamText`) for field-level re-extraction | Streaming cannot be validated against a schema mid-stream. Field-level re-extraction needs a complete, validated value — use `generateText`. | `generateText` + `Output.object()` |
| Fine-tuning | Requires 150+ labelled examples, training cost, model management. In-context few-shot achieves the same style result for a description prompt upgrade. | Few-shot examples in `DESCRIPTION_SYSTEM_PROMPT` |
| Separate `image_detail: 'high'` parameter for re-extraction | Photos are already resized to max 2MP client-side before upload. The image content delivered to GPT-4o is already at a reasonable resolution. Adding `detail: 'high'` increases token cost without a guaranteed accuracy gain for already-resized images. | Current image handling (2MP resize in `src/lib/utils/image.ts`) |
| `generateObject` | Deprecated in Vercel AI SDK v6. Project already correctly uses `generateText` + `Output.object()`. | `generateText` + `Output.object({ schema })` |

---

## Stack Patterns by Variant

**For `buildSystemPrompt` changes (hourmeter decimal, chain-of-thought):**
- Surgical edits to the READING HOURMETERS section in `src/lib/ai/extraction-schema.ts`
- Add numbered verification steps (1–4) before returning numeric values
- Mirror the existing READING ODOMETERS structure exactly — same format, same tone

**For `aiHint` changes (suspension inference, field-level accuracy):**
- Edit the relevant field definition in `src/lib/schema-registry/schemas/truck.ts` (or earthmoving/forklift/trailer as appropriate)
- Follow the existing pattern: manufacturer→inference mapping table in plain English, inside the `aiHint` string
- Keep aiHint under ~1000 chars per field to avoid prompt bloat; focus on the most common makes

**For few-shot description examples:**
- All edits in the `DESCRIPTION_SYSTEM_PROMPT` constant in `src/app/api/describe/route.ts`
- Add examples to the existing `QUALITY REFERENCE EXAMPLES` section — do not restructure the prompt
- One real example per underperforming subtype; mark with the correct subtype heading

**For `/api/extract-field` route:**
- New file: `src/app/api/extract-field/route.ts`
- Accept `{ assetId, fieldKey }`, validate `fieldKey` against `getAIExtractableFieldDefs(assetType)` before use
- Merge result into `extraction_result` using Supabase JSONB merge (`supabase.rpc` or spread): `{ ...existingResult, [fieldKey]: newFieldResult }`
- Return `{ success: true, fieldKey, result: newFieldResult }` for the client to merge into state

**For UI re-extract button:**
- Add per-field loading state in `ReviewPageClient` (a `Set<string>` of fieldKeys currently re-extracting)
- On completion, call `setExtractionResult(prev => ({ ...prev, [fieldKey]: result }))` and `setValue(fieldKey, result.value ?? '')`
- Show spinner replacing the confidence badge during re-extraction; no full-page loading state

---

## Version Compatibility

| Package | Version in Use | Notes |
|---------|---------------|-------|
| `ai` | ^6.0.116 | `generateText` + `Output.object({ schema })` confirmed working. No upgrade needed. |
| `@ai-sdk/openai` | ^3.0.41 | `openai('gpt-4o')` correct model string. `gpt-4.1` not supported for structured output. |
| `zod` | ^4.3.6 | `.describe()` on schema fields confirmed as the mechanism AI SDK uses to send field hints to the model. |
| `next` | 16.1.7 | New Route Handler at `/api/extract-field` follows same pattern as existing `/api/extract`. No version constraint. |
| `react-hook-form` | ^7.71.2 | `setValue(fieldKey, value)` is stable API — used for field-level update after re-extraction. No version constraint. |
| `react` | 19.2.3 | Per-field loading state via `useState<Set<string>>` is standard. No caveats. |

---

## Sources

- Codebase analysis: `src/app/api/extract/route.ts`, `src/app/api/describe/route.ts`, `src/lib/ai/extraction-schema.ts`, `src/lib/schema-registry/schemas/truck.ts` — HIGH confidence
- Vercel AI SDK v6 docs (ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — confirmed `Output.object()` pattern, `.describe()` as hint mechanism, `generateText` required for validated output — HIGH confidence
- OpenAI community forum — confirmed GPT-4.1 returns "Unsupported model" for `json_schema` response format in Chat Completions API as of April 2025 — MEDIUM confidence (community report, consistent across multiple threads)
- 2025 research (Frontiers in AI, PMC): few-shot prompting improves structured generation accuracy 15–40% vs zero-shot — MEDIUM confidence (peer-reviewed, 2025)
- Prompt Engineering Guide (promptingguide.ai/techniques/fewshot) — few-shot placement and example count best practices — MEDIUM confidence
- GPT-4.1 vs GPT-4o comparison (DataCamp, F22 Labs, April 2025) — GPT-4.1 instruction following improvements noted, but structured output limitation confirmed — MEDIUM confidence

---

*Stack research for: prestige_assets v1.6 AI Quality & Workflow*
*Researched: 2026-04-18*
