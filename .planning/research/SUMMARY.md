# Project Research Summary

**Project:** Prestige Assets v1.6 — AI Quality & Workflow
**Domain:** GPT-4o vision extraction quality improvements + inline field editing for auction asset book-in pipeline
**Researched:** 2026-04-18
**Confidence:** HIGH

## Executive Summary

Prestige Assets v1.6 is a focused quality milestone on top of a proven extraction pipeline. The existing stack (Vercel AI SDK v6, GPT-4o, Zod 4, react-hook-form, Supabase) requires zero new dependencies — all improvements are prompt engineering, schema annotation, and targeted UI/route changes. Research across all four domains confirms this is not a capability gap; it is a configuration and calibration gap. The three categories of work are: (1) fixing known extraction misfires via prompt and aiHint changes, (2) improving description style via expanded few-shot examples, and (3) enabling inline field-level re-extraction so staff can correct a single field without triggering a full AI re-run.

The recommended approach is to treat the milestone as three parallel-capable workstreams with a clear sequencing constraint: prompt accuracy work (hourmeter decimal, suspension inference) ships first and independently, description quality work ships in parallel, and inline re-extraction ships last because it depends on the `buildExtractionSchema` filter extension. Every change is reversible — all improvements live in string constants and small route modifications, making git revert the full recovery plan for any regression.

The key risks are silent prompt regression across asset types (a change for Excavators can break Forklifts in the shared monolithic prompt), inline re-extraction incorrectly writing to the DB and overwriting staff edits, and few-shot description examples drifting from the strict per-subtype templates. All three risks are well-understood and preventable with specific, low-effort verification steps identified in research. There are no architectural unknowns.

---

## Key Findings

### Recommended Stack

Zero new dependencies. The entire milestone is delivered within the current stack. `generateText + Output.object({ schema })` is the validated Vercel AI SDK v6 pattern for structured extraction — `generateObject` is deprecated and must not be used. GPT-4.1 cannot be used as a model upgrade because it does not support `json_schema` structured outputs (community-confirmed "Unsupported model" error as of April 2025). Stay on `openai('gpt-4o')`.

**Core technologies:**
- `ai` (Vercel AI SDK ^6.0.116): `generateText + Output.object()` for structured extraction — already validated, no upgrade needed
- `@ai-sdk/openai` ^3.0.41: `openai('gpt-4o')` is the correct model string — do NOT switch to `gpt-4.1`
- `zod` ^4.3.6: `.describe()` on fields is the primary prompt engineering mechanism — extraction schema is a shape contract, not a validator; no `.refine()` or `.min()` on extracted fields
- Next.js Route Handlers (not Server Actions): correct for long-running AI calls; inline re-extraction extends the existing `/api/extract` route with an optional `fieldKeys` param rather than creating a separate new route
- `react-hook-form` ^7.71.2: `setValue(key, val, { shouldDirty: true, shouldTouch: true })` is required for all programmatic field updates from re-extraction

### Expected Features

**Must have (table stakes — blocking quality issues):**
- Hourmeter decimal fix — `1234.5` misread as `12345` on every tenths-digit instrument cluster; pure prompt change aligned with existing odometer block
- Suspension type inference — most-blank field in truck records; add manufacturer knowledge lookup table to `suspension` aiHint in truck/trailer schemas
- Description quality uplift — current output is flat; expand `QUALITY REFERENCE EXAMPLES` with forklift, agriculture, marine, caravan examples
- Inline field editing with dirty indicator — remove re-extraction friction; dirty tracking already exists, visual lock indicator is the missing piece
- Extraction accuracy audit + confidence calibration — audit `aiExtractable` flags and add worked examples per confidence level

**Should have (differentiators, v1.x):**
- Stale description badge — shows when description was generated before field corrections were saved
- Suspension inference for Trailer and Agriculture schemas — same pattern, ship after truck version is stable

**Defer (v2+):**
- Single-field re-extraction via a separate `/api/extract-field` route — direct form editing is faster for all likely correction types; build only on evidence
- Fine-tuned model — requires 150+ labelled examples, training cost, model management; in-context few-shot achieves equivalent style for free
- Description A/B testing — requires catalogued asset corpus

### Architecture Approach

All v1.6 changes fit within the existing component hierarchy with no new route handlers required. The key architectural decision confirmed by research is that inline re-extraction extends `/api/extract` with an optional `fieldKeys?: string[]` body parameter — when present, `buildExtractionSchema` filters to only those fields, the result is returned to the client as a partial `ExtractionResult`, and no write to `assets.extraction_result` occurs. The DB write only happens at `saveReview()` time via `assets.fields`. This keeps the extraction snapshot clean and protects staff edits. The only new file is `src/lib/ai/description-prompt.ts` — an extraction of the 1,000-line `DESCRIPTION_SYSTEM_PROMPT` constant from the route handler, which makes it independently editable and testable.

**Major components and what changes:**
1. `buildSystemPrompt()` in `extraction-schema.ts` — strengthen hourmeter decimal rule with three-layer instruction + worked example; add chain-of-thought verification loop for numeric fields
2. `aiHint` on `suspension` in `truck.ts` / `trailer.ts` — add explicit make/model/year lookup table covering common Australian truck fleet configurations
3. `src/lib/ai/description-prompt.ts` (new) — extract `DESCRIPTION_SYSTEM_PROMPT` and `QUICK_DESCRIPTION_PROMPT`; expand `QUALITY REFERENCE EXAMPLES` for weak categories
4. `/api/extract` route — add optional `fieldKeys` + `fieldHints` params; return partial result without DB write when `fieldKeys` present
5. `FieldRow.tsx` — add per-field re-extract icon button (aiExtractable fields with null/low-confidence only); spinner during in-flight call
6. `ReviewPageClient.tsx` + `DynamicFieldForm.tsx` — wire `triggerFieldReExtraction(fieldKey)` callback; handle partial result merge via `setValue(key, val, { shouldDirty: true, shouldTouch: true })`

### Critical Pitfalls

1. **Silent prompt regression across asset types** — `buildSystemPrompt` is a monolithic string shared by all 8 asset types. A hourmeter fix can break Forklift extractions without any error being thrown. Prevention: run spot-check extractions for Truck, Excavator, and Forklift with known-good photos before and after every prompt change.

2. **Inline re-extraction writes to `extraction_result` DB column** — overwrites staff edits to other fields; the review form shows wrong values on next page load. Prevention: the route must NOT write to the DB when `fieldKeys` is present; return only to client state. Architecture decision documented before code is written.

3. **Few-shot description examples cause template drift** — adding real descriptions that predate strict templates teaches GPT-4o old formats. Prevention: every new example manually verified against its subtype template before committing.

4. **`setValue` without `shouldDirty: true` silently excludes re-extracted fields from save** — `dirtyFields` filter skips the re-extracted field; it is not written to `assets.fields`. Prevention: all re-extraction `setValue` calls must include `{ shouldDirty: true, shouldTouch: true }`.

5. **Hourmeter decimal root cause misdiagnosis** — the failure may be photo quality (ambiguous image), not a prompt problem. Prevention: inspect actual failure photos before writing any prompt change. Prompt changes cannot fix a blurry display.

---

## Implications for Roadmap

Research confirms three natural phases with clear sequencing. Phases A and B are independent and can run in parallel. Phase C depends on Phase A completing the `buildExtractionSchema` filter extension.

### Phase A: Extraction Prompt Accuracy

**Rationale:** Lowest risk, highest return. Pure prompt and aiHint changes with no new infrastructure. Hourmeter and suspension are confirmed P1 blocking issues. Ships independently with no dependencies.
**Delivers:** Hourmeter decimal reads correctly; suspension type auto-populated for known makes/models; numeric OCR chain-of-thought verification.
**Addresses:** Hourmeter decimal fix (P1), suspension type inference (P1), extraction accuracy / confidence calibration (P2).
**Files changed:** `extraction-schema.ts` (buildSystemPrompt), `truck.ts`, `trailer.ts`, `earthmoving.ts` (aiHint fields).
**Avoids:** Prompt regression (spot-check fixture set before/after), hourmeter root-cause misdiagnosis (inspect failure photos first), suspension confidence calibration drift (explicit lookup table, not GPT-4o general knowledge).

### Phase B: Description Quality Uplift

**Rationale:** Independent of Phase A. Extracting `DESCRIPTION_SYSTEM_PROMPT` to its own file is a low-risk refactor that pays off immediately for ongoing iteration. Few-shot expansion targets the weakest categories (forklift, agriculture, marine, caravan) which currently have zero quality reference examples.
**Delivers:** Descriptions for all major asset categories match Jack's style; prompt is independently editable and version-controlled.
**Addresses:** Description quality uplift (P1), stale description badge groundwork.
**Files changed:** `description-prompt.ts` (new), `describe/route.ts` (import change only).
**Avoids:** Template drift from unvetted examples (audit every example against subtype template), style guide conflicts with subtype routing (add style rules before QUALITY REFERENCE EXAMPLES, never inside template blocks).

### Phase C: Inline Field Re-extraction

**Rationale:** Depends on Phase A completing the `buildExtractionSchema` fieldKeys filter. More UI and API surface than A or B. The architectural constraint that partial results must not touch the DB must be documented at phase start.
**Delivers:** Staff can re-extract a single field from photos with a button click; spinner shows progress; result merges into form state; no other field values are touched; re-extracted value saved with next form save.
**Addresses:** Inline field editing / per-field dirty indicator (P1), targeted per-field re-extraction.
**Files changed:** `extract/route.ts`, `extraction-schema.ts` (fieldKeys param), `ReviewPageClient.tsx`, `DynamicFieldForm.tsx`, `FieldRow.tsx`.
**Avoids:** DB overwrite of staff edits (architecture decision in phase plan), setValue without shouldDirty (non-negotiable), latency from full extraction per field (verify under 8s empirically), prompt injection via arbitrary fieldKey (validate against getAIExtractableFieldDefs server-side).

### Phase Ordering Rationale

- Phases A and B are independent and can be assigned to separate developers or executed sequentially in either order.
- Phase C has a hard dependency on Phase A (the `buildExtractionSchema` fieldKeys filter must exist).
- Starting with Phase A means any re-extraction in Phase C benefits from improved hourmeter and suspension logic from day one.
- The description prompt extraction in Phase B is a low-risk refactor that makes all subsequent description quality work faster.

### Research Flags

Phases with standard, well-documented patterns — no deeper research needed:
- **Phase A (prompt accuracy):** aiHint and buildSystemPrompt patterns are fully documented and validated from Phase 06.1. Direct extension of existing work.
- **Phase B (description quality):** Few-shot placement and count confirmed. Prompt constant extraction is a standard refactor with zero logic change.

Phases requiring a documented architecture decision before code is written:
- **Phase C (inline re-extraction):** The DB-write vs client-only data flow decision must be explicitly documented at the start of the phase plan. The answer is clear (client-only until saveReview), but it must be written down — the recovery cost if implemented incorrectly is HIGH.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified from direct codebase inspection + Vercel AI SDK v6 official docs. GPT-4.1 limitation confirmed across multiple community sources. Zero uncertainty about technology choices. |
| Features | HIGH (codebase) / MEDIUM (AI behaviour) | Must-have features confirmed from codebase inspection of actual failure patterns. AI behaviour improvement estimates (few-shot 15-40%) from peer-reviewed 2025 research. |
| Architecture | HIGH | Direct codebase inspection of all affected files. Component responsibilities, data flow, and anti-patterns grounded in existing code. |
| Pitfalls | HIGH (code pitfalls) / MEDIUM (GPT-4o behaviour) | react-hook-form setValue options and DB overwrite risks from official docs and codebase. GPT-4o OCR behaviour on small LCD displays is MEDIUM — empirically verified pattern, not guaranteed. |

**Overall confidence: HIGH**

### Gaps to Address

- **Hourmeter decimal root cause:** Cannot be determined without inspecting the actual failure photos. Phase A must begin with a photo inspection step before any prompt change. Branch into prompt fix (decimal visible in photo) or staff guidance (decimal ambiguous in photo).
- **Zod 4 + AI SDK schema conversion:** The current schema uses only `z.string().nullable()` and `z.enum()` — both confirmed safe. Any new Zod construct introduced during Phase A must be verified by logging the JSON Schema sent to OpenAI. No automated guard exists.
- **Inline re-extraction latency target:** The 8-second target is an estimate based on single-field schema response time. Must be empirically measured during Phase C. If latency exceeds 8 seconds the UX design needs adjustment before shipping.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `src/app/api/extract/route.ts`, `src/app/api/describe/route.ts`, `src/lib/ai/extraction-schema.ts`, `src/lib/schema-registry/schemas/truck.ts`, `src/components/asset/ReviewPageClient.tsx`, `src/components/asset/FieldRow.tsx` — direct inspection
- Vercel AI SDK v6 docs (ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — `Output.object()` pattern, `.describe()` as hint mechanism
- react-hook-form docs — `setValue` options: `shouldDirty`, `shouldTouch`, `shouldValidate`; `dirtyFields` behaviour

### Secondary (MEDIUM confidence)
- OpenAI community forum — GPT-4.1 returns "Unsupported model" for `json_schema` response format (April 2025)
- OpenAI community — logprobs empty arrays confirmed when Structured Outputs enabled
- Frontiers in AI / PMC 2025 — few-shot prompting improves structured generation accuracy 15-40% vs zero-shot
- Prompt Engineering Guide (promptingguide.ai) — few-shot placement and example count best practices
- GPT-4o OCR behaviour on LCD displays — community-verified patterns

### Tertiary (LOW confidence)
- DataCamp / F22 Labs (April 2025) — GPT-4.1 vs GPT-4o comparison; structured output limitation confirmed

---

*Research completed: 2026-04-18*
*Ready for roadmap: yes*
