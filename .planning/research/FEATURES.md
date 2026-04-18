# Feature Research

**Domain:** AI extraction quality and inline field editing — auction asset book-in pipeline
**Researched:** 2026-04-18
**Confidence:** HIGH (codebase verified) / MEDIUM (AI behaviour patterns from multiple sources)

---

## Context: What Already Exists

The v1.5 pipeline is:
1. Staff photograph build plate + asset
2. GPT-4o vision extracts fields from photos into typed Zod schema with per-field `{ value, confidence }` objects
3. Staff review form highlights low-confidence fields; staff correct and confirm
4. Two aiHint layers: schema description strings per field, plus system prompt inference blocks per asset type
5. `inspection_notes` structured fields (VIN, odometer, hourmeter, suspension, etc.) flow as authoritative overrides — AI cannot clobber them
6. Second GPT-4o call generates description text from confirmed fields + locked per-subtype template

This research covers five new features for v1.6, all improving output quality without changing the core pipeline architecture.

---

## Feature Landscape

### Table Stakes (Users Expect These)

These features are blocking quality issues — the current output fails in predictable, reproducible ways. Treating them as "nice to have" is wrong.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hourmeter decimal fix | "1,234.5 hrs" misread as "12345" happens on every instrument cluster with tenths digit; staff must manually correct every time | LOW-MEDIUM | Prompt-only fix. The system prompt already has detailed hourmeter reading instructions (lines 65-76 in extraction-schema.ts) but the decimal preservation instruction is weaker than the odometer counterpart. The odometer block uses three reinforcing phrases: "INCLUDE the decimal", "do NOT drop it", and a worked example. Hourmeter says "include the decimal" without the same force. Alignment of the two blocks + a worked example covering the comma-as-thousands-separator merge problem is the fix. No new infrastructure. |
| Suspension type inference | Trucks with known make/model/year can confidently be assigned Spring or Airbag without a photo of the chassis — buyers expect this field filled; blank is worse than an inferred value | LOW | GPT-4o already infers engine specs, transmission, and drive type from make/model/year (Step 2 of system prompt). Suspension is absent from the TRUCKS inference block — it appears only in the TRAILER block. Adding a compact suspension lookup table (same format as the gearbox/engine series tables already in truck schema aiHint) covers more than 90% of cases. Pure aiHint/system-prompt addition. |
| Description quality uplift | Jack's handwritten descriptions include specific selling points, factual detail, and industry-standard phrasing. Current AI output is technically correct but comparatively flat. | MEDIUM | Not a model capability problem — it is a few-shot example coverage problem. The existing QUALITY REFERENCE EXAMPLES block in DESCRIPTION_SYSTEM_PROMPT has about 10 examples concentrated on trucks and earthmoving. Forklifts, agriculture, marine, and caravan have no quality reference examples. Adding 6-8 more examples for the weak categories + an explicit "lead with the most valuable spec" rule in UNIVERSAL RULES is the primary lever. |
| Extraction accuracy (missing fields, confidence calibration) | Staff must manually fill too many fields that should be extractable; mis-calibrated confidence (high confidence on wrong values) undermines the review workflow | MEDIUM | Two sub-problems: (a) Missing fields — gaps are in fields where aiExtractable is false or aiHint is sparse; audit required. (b) Confidence calibration — the current confidence description is accurate but GPT-4o over-reports "high" for inferred values. Adding a worked example per level ("high: you read the badge directly. medium: you inferred from model knowledge. low: you guessed.") reduces this. |
| Inline field editing post-extraction | Staff cannot fix one wrong value without re-running the full AI pipeline; re-extraction is slow and risks overwriting other correct fields | MEDIUM | The review form already supports direct editing — all fields render as editable inputs via DynamicFieldForm. The dirtyFields tracking and conflict-detection modal in ReviewPageClient already protect manually edited fields during re-extraction. The feature is mostly friction removal: add a per-field dirty/locked indicator, confirm that manual edits survive re-extraction (they do), and clarify to staff that typing directly is the correct path for single-field fixes. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Suspension inference knowledge table | Removes the number-one most-blank field in truck records with zero effort from staff; no other auction software does this | LOW | Pure prompt data addition. Cover: Kenworth T909/T610 prime mover spec → Airbag; Kenworth T909 vocational/tipper spec → Spring; Mack Super-Liner/Trident → Airbag; Mack Granite vocational → Spring; Volvo FH → Airbag; Scania R/S → Airbag; Hino 500/700 series → Spring; Isuzu FVZ and above → Spring. Subtype context changes the answer for Kenworth/Mack — `buildSystemPrompt` already receives `asset_subtype`, so conditional inference is possible. |
| Style-matched descriptions via expanded few-shot bank | If descriptions sound like Jack, staff paste without edits — saves 2-5 min per asset | MEDIUM | Expand QUALITY REFERENCE EXAMPLES with one example per currently-uncovered category: forklift with damage note, agricultural tractor with full linkage/PTO detail, marine with twin engines, caravan with full fit-out. Each example demonstrates the rhythm: present tense, lead with headline spec, name brand components verbatim. |
| Per-field locked indicator in review form | Visual confirmation that a manually edited field will not be overwritten by re-extraction | LOW | UI-only. A pencil icon or coloured left-border on fields where `dirtyFields[key]` is true. The protection already exists in the conflict-detection logic; the lock makes it visible. Zero backend change. |
| Stale description badge | Prevents staff pasting a description that was generated before they corrected key fields | LOW | Track a `descriptionGeneratedAt` timestamp client-side or in DB. If confirmed fields have been saved after that timestamp, show a yellow badge on the description block. One `useState` or one DB column. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automatic description regeneration on field edit | Staff edit a field and expect the description to update automatically | Descriptions take 10-20s and cost API credits; silent background regeneration creates version confusion; staff may paste the stale version | Keep "Regenerate Description" as an explicit button. Add stale description badge (above). |
| Logprobs-based confidence from OpenAI | More "scientific" confidence scores using token probabilities | Confirmed unavailable: OpenAI API returns empty logprobs arrays when Structured Outputs (json_schema) is enabled — which is the current architecture. Switching away from structured outputs breaks the typed extraction schema. | Keep self-reported confidence (high/medium/low). It is well-calibrated for this use case and honest about uncertainty. |
| Per-asset-type fine-tuned model | Higher accuracy on specific asset types | Dataset cost of $20k+, weeks of fine-tuning, retraining on every schema change, model versioning complexity | Better aiHint data and expanded few-shot examples achieve equivalent improvement for free. |
| Single-field re-extraction from photos | "Re-extract just the hourmeter from this photo" | Requires new `/api/extract-field` route, focused schema, signed URL re-fetch, context passing, 10-20s wait — all for a correction that takes 3 seconds to type manually | Staff type the correct value directly. The form already accepts it. Build this only if evidence shows staff need photo re-extraction more than direct input. |
| Confidence score as percentage (0-100%) | Appears more precise than high/medium/low | GPT-4o's self-reported certainty is not linearly calibrated — "87% confident" implies false precision that does not exist | Keep three-tier system. Consider adding extraction source type ("read from photo" vs "inferred from model knowledge") as a meaningful supplement. |

---

## Feature Dependencies

```
Hourmeter decimal fix
    └──requires──> System prompt change in extraction-schema.ts buildSystemPrompt
                       └──QA: manual test with real hourmeter photos

Suspension type inference
    └──requires──> Suspension lookup table in truck schema aiHint + buildSystemPrompt Step 2 TRUCKS block
    └──no structural dependencies (select field + options already exist)

Description quality uplift
    └──requires──> Expanded QUALITY REFERENCE EXAMPLES in DESCRIPTION_SYSTEM_PROMPT (describe/route.ts)
    └──enhances──> Suspension type inference (inferred suspension used verbatim in description)

Extraction accuracy audit
    └──requires──> Field-by-field audit of aiExtractable=false fields and sparse aiHints
    └──requires──> Confidence calibration language update in buildSystemPrompt
    └──enhances──> Hourmeter decimal fix (part of same extraction accuracy domain)

Inline field editing (review form, no re-extraction)
    └──requires──> nothing new — form already has setValue() and dirty tracking
    └──enhances──> Per-field locked indicator (visual layer on existing dirtyFields)

Per-field locked indicator
    └──requires──> Inline field editing confirmed working (locked = dirty + intentionally set)
    └──no backend change

Stale description badge
    └──requires──> Tracking when description was last generated vs when fields were last saved
    └──enhances──> Inline field editing (signals that description needs regeneration after edit)

Single-field re-extraction route (deferred)
    └──requires──> New /api/extract-field route, focused schema, context passing
    └──conflicts──> Should NOT be built until inline form editing proves insufficient
```

### Dependency Notes

- **All five v1.6 features are independent of each other** — each can ship in isolation.
- **Hourmeter fix is pure prompt change** — lowest risk, highest return, ship first.
- **Suspension inference is pure aiHint/prompt data** — no schema change, no new fields.
- **Description uplift is string literal expansion** — only file touched is `describe/route.ts`.
- **Inline editing is already possible** — the implementation task is removing friction and adding visual signals, not building new form infrastructure.
- **Single-field re-extraction is deferred** — direct typing is faster for the corrections that actually occur (one-digit decimal, wrong suspension option). Build only if staff feedback contradicts this.

---

## MVP Definition

### Launch With (v1.6)

- [ ] Hourmeter decimal fix — align with odometer block: three-layer instruction + comma-separator worked example
- [ ] Suspension type inference — add TRUCKS suspension table to Step 2 of buildSystemPrompt, covering major makes/subtypes
- [ ] Description quality uplift — expand QUALITY REFERENCE EXAMPLES with forklift, agriculture, marine, caravan; add "lead with headline spec" rule
- [ ] Inline field editing — confirm dirtyFields protection works, add per-field locked indicator (pencil icon)
- [ ] Extraction accuracy audit — review aiExtractable flags for extras/attachments fields, add confidence calibration worked examples

### Add After Validation (v1.x)

- [ ] Stale description badge — add after staff confirm they regenerate after field corrections
- [ ] Suspension inference for Trailer schema — airbag vs spring matters for tipper/side-tipper; same pattern as truck, extend after truck version stable
- [ ] Suspension inference for Agriculture schema — rear axle suspension relevant for tractors on road

### Future Consideration (v2+)

- [ ] Single-field re-extraction route — defer until evidence staff need this over direct typing
- [ ] Description A/B testing — systematic comparison of AI vs Jack's output requires catalogued asset corpus
- [ ] Fine-tuned model for specific asset types — defer indefinitely unless dataset cost is justified by business scale

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hourmeter decimal fix | HIGH — every tenths-digit instrument cluster fails today | LOW — prompt only | P1 |
| Suspension type inference | HIGH — most-blank field in truck records | LOW — aiHint data addition | P1 |
| Inline field editing (form-level dirty indicator) | HIGH — removes re-extraction workflow for single-field corrections | LOW — UI indicator on existing dirty state | P1 |
| Description quality uplift | HIGH — descriptions require staff rewrites today | MEDIUM — few-shot expansion + rule | P1 |
| Extraction accuracy audit + confidence calibration | MEDIUM — general improvement, not one specific bug | MEDIUM — field audit + prompt tuning | P2 |
| Stale description badge | MEDIUM — prevents pasting outdated description | LOW — timestamp comparison | P2 |
| Suspension inference for Trailers | MEDIUM — airbag is a premium signal in trailer records | LOW — same pattern | P2 |
| Single-field re-extraction route | LOW — typing is faster for all likely correction types | HIGH — new route, focused schema | P3 |

---

## Sources

- Codebase: `/home/jack/projects/prestige_assets/src/app/api/extract/route.ts`
- Codebase: `/home/jack/projects/prestige_assets/src/app/api/describe/route.ts`
- Codebase: `/home/jack/projects/prestige_assets/src/lib/ai/extraction-schema.ts`
- Codebase: `/home/jack/projects/prestige_assets/src/lib/schema-registry/schemas/truck.ts`
- Codebase: `/home/jack/projects/prestige_assets/src/components/asset/ReviewPageClient.tsx`
- [GPT-4o Vision OCR Limitations](https://medium.com/@tinyidp/gpt4o-vision-is-not-good-at-ocr-heres-the-solution-cd3bc0425e1b) — confirms digit/decimal accuracy issues with vision OCR; hybrid OCR approach documented
- [How Examples Improve LLM Style Consistency](https://latitude.so/blog/how-examples-improve-llm-style-consistency) — 2-3 contextually relevant examples establish reliable style; diminishing returns after 3
- [OpenAI Structured Outputs Guide](https://developers.openai.com/api/docs/guides/structured-outputs) — json_schema structured outputs confirmed for gpt-4o-2024-08-06+
- [OpenAI Community: logprobs empty with Structured Outputs](https://community.openai.com/t/gpt-5-1-5-2-message-output_text-logprobs-is-empty-when-structured-outputs-json-schema-is-enabled-in-responses-api/1371927) — confirms self-reported confidence is only viable option; logprobs unavailable with json_schema
- [GPT-4o OCR Experience](https://www.techjays.com/blog/optical-character-recognition-with-gpt-4o-an-experience) — prompt phrasing, resolution, and cropping tips for vision accuracy

---

*Feature research for: v1.6 AI Quality and Inline Field Editing — Prestige Assets*
*Researched: 2026-04-18*
