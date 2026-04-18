# Pitfalls Research

**Domain:** AI extraction quality improvements + inline field editing — adding few-shot prompting, partial re-extraction, and description style uplift to an existing GPT-4o vision + Zod schema + react-hook-form pipeline
**Researched:** 2026-04-18
**Confidence:** HIGH (direct codebase inspection; MEDIUM for GPT-4o structured output behaviour — based on OpenAI documentation and community-verified patterns)

---

## Critical Pitfalls

### Pitfall 1: Prompt Edits Silently Regress Existing Asset Types

**What goes wrong:**
The extraction system prompt in `extraction-schema.ts` (`buildSystemPrompt`) and the description system prompt in `describe/route.ts` (`DESCRIPTION_SYSTEM_PROMPT`) are single, monolithic strings used for all 8 asset types and 100+ subtypes. Any edit intended to improve hourmeter accuracy for Excavators, for example, can accidentally reduce accuracy for Forklifts or Trucks — because all asset types share the same prompt and model. There is no per-asset-type routing in the extraction prompt (only in the description prompt via template headings).

The failure is silent: GPT-4o outputs still validate against the Zod schema, so no error is thrown. The regression only surfaces when staff notice the wrong value in the review form — or never notice because they trust AI output.

**Why it happens:**
The prompt is treated as a configuration string rather than logic with test coverage. Changes are evaluated against the specific asset type the developer is currently testing, not the full matrix of asset types and edge cases in production.

**How to avoid:**
Before modifying any part of `buildSystemPrompt` or `DESCRIPTION_SYSTEM_PROMPT`, document exactly which lines apply to which asset types. Use a test fixture set: at minimum one real photo + expected extraction result for each of Truck, Excavator, Forklift, Tractor, and Trailer. Run the extraction against these fixtures before and after the prompt change. This does not need to be an automated CI test — a manual spot-check run is sufficient for v1.6 — but the fixture set must exist.

Add a comment block at the top of each modified prompt section naming the asset type it targets and what behaviour it controls.

**Warning signs:**
- A field that was reliably extracted before the prompt change (e.g. make/model for Truck) now comes back null or low-confidence.
- GPT-4o starts producing values outside the Zod schema enum for select fields (e.g. `suspension` returning "Air Bags" instead of "Airbag") — subtle wording changes in the prompt alter the model's literal output.
- Confidence calibration shifts: fields that previously returned "high" now return "medium" or vice versa, without any actual change in extraction quality.

**Phase to address:** Prompt improvement phase. Define and run spot-check fixtures before writing any prompt changes, not after.

---

### Pitfall 2: Hourmeter Decimal OCR — Model Refuses to Read Ambiguous Digits

**What goes wrong:**
The current `buildSystemPrompt` already has a detailed READING HOURMETERS section including the instruction to include decimal hours. The likely root cause of `1234.5` being read as `12345` is that GPT-4o is collapsing the decimal point, not that it is ignoring the instruction. Adding a stronger instruction ("include the decimal") will not fix this if the model literally cannot visually resolve whether the small digit after the dot is a tenths digit or a continuation of the integer part.

The pitfall is incorrectly diagnosing this as a prompt problem when it is actually a photo quality / display font rendering problem. If the hourmeter display does not clearly separate the decimal digit (e.g., the tenths digit is in a smaller box with a different background, which is common on LCD hourmeters), GPT-4o may legitimately be unable to distinguish `1234.5` from `12345`.

Spending time crafting elaborate prompt instructions for a case where the image itself is ambiguous produces no improvement and may cause the model to hallucinate a decimal that is not there.

**Why it happens:**
Developers assume the model's failure is always a prompt issue. OCR quality from GPT-4o vision is strongly dependent on image resolution, contrast, and clarity. The 2MP resize already applied during upload is adequate for build plates but may not be sufficient for small LCD digits on an excavator hourmeter photographed at angle.

**How to avoid:**
Investigate the actual failure photos before writing prompt changes. If the decimal is visually clear in the image: add a targeted example to the prompt showing the digit format (e.g., "LCD hourmeter showing `1234.5` — the `5` after the dot is the tenths digit, not `12345`"). If the decimal is visually ambiguous in the image: the correct fix is staff guidance ("photograph the hourmeter from directly in front, full screen") rather than a prompt change. Adding a few-shot image example (a clear photo of a decimal hourmeter) to the user message may help more than text instructions.

**Warning signs:**
- The failure photo, when zoomed in closely, shows the decimal digit clearly — this is a prompt problem. Fix with targeted instruction.
- The failure photo is blurry, at angle, or the tenths digit is in a smaller font that is not readable at the uploaded resolution — this is a photo problem. Prompt changes will not help.

**Phase to address:** Hourmeter accuracy phase. Inspect actual failure photos first; branch into prompt fix or staff guidance based on what the photo shows.

---

### Pitfall 3: Few-Shot Description Examples Cause Template Drift

**What goes wrong:**
The description prompt already contains quality reference examples (WHEEL LOADER EXAMPLE, PRIME MOVER EXAMPLE, etc.) at the end of `DESCRIPTION_SYSTEM_PROMPT`. Adding more examples to match Jack's writing style is the right approach — but if the examples are inconsistently formatted or contain subtle deviations from the template (e.g., the prime mover example shows hours in the body text, or a trailer example omits the axle config on line 1), GPT-4o will treat those deviations as valid and start producing descriptions that drift from the strict per-subtype format.

The model generalises across all examples. One example with a formatting error teaches the model that the error is acceptable.

**Why it happens:**
Few-shot examples are added by copying Jack's real descriptions without auditing them against the templates. Jack's real descriptions may predate the strict template rules, use a slightly different format for a particular subtype, or include fields that the current template says to omit.

**How to avoid:**
Every few-shot example added to the prompt must be manually verified against the corresponding template section. Check: line 1 format, field order, blank line placement, footer exact wording. The example must be compliant with the template, not just a good description. Prefer manufactured examples (written specifically to match the template) over raw copies of real descriptions, unless the real descriptions are known to comply perfectly.

Do not add more than 3-4 new examples per session — each addition increases prompt length, and the description prompt is already ~1,000 lines. Token limits are not a concern for GPT-4o (128k context), but longer prompts increase inference cost and latency slightly.

**Warning signs:**
- After adding examples, descriptions for other subtypes start showing formatting deviations they did not show before (e.g., bullet points appearing, different line 1 structure).
- The footer starts appearing as "Sold As Is, Untested & Unregistered" (without the full stop) — indicates an example was copied without the correct footer.
- `normalizeFooter` is correcting the footer more often than before — indicates the prompt's examples have inconsistent footers.

**Phase to address:** Description quality phase. Audit every new example against its template before committing the prompt change.

---

### Pitfall 4: Inline Re-extraction Overwrites Staff Edits to Other Fields

**What goes wrong:**
The current extraction flow writes the entire `extraction_result` to the database in one call (`/api/extract` route, `update({ extraction_result: output })`). Inline field-level re-extraction — re-extracting just the `suspension` field without touching `hourmeter` or `make` — must not overwrite fields that staff have already edited in the review form.

The failure mode: staff edits `odometer` from AI-extracted value to corrected value. Staff then triggers inline re-extraction for `suspension`. The inline re-extraction call runs the full extraction, returns a new `extraction_result` with the old (wrong) `odometer` value, and writes it to `extraction_result`. The review form resets `odometer` to the wrong value.

The review form uses `initialExtractionResult` as `defaultValues` via `buildDefaultValues`. If `extraction_result` in the DB is overwritten with stale data, the next page load will show the wrong value.

**Why it happens:**
Inline re-extraction is tempting to implement as "just call the extraction API for the whole asset again, but only show the result for the one field." But if it writes `extraction_result` back to the database, it silently clobbers all other fields. The stale extraction result will not be obvious until the user navigates away and returns, or until they copy the Salesforce fields block.

**How to avoid:**
Inline re-extraction must NOT write to `extraction_result` in the database. It should return the re-extracted value to the client only, and the client applies it to the form state via `setValue(fieldKey, newValue)`. The DB write happens when the user saves the review form, which writes `assets.fields` (the confirmed values), not `assets.extraction_result`. Alternatively, if `extraction_result` must be updated, use a targeted merge: `update({ extraction_result: { ...existing, [fieldKey]: newValue } })` — but this requires a read-then-write and introduces a race condition if two fields are re-extracted simultaneously.

The cleanest architecture: inline re-extraction is client-side only until the user clicks "Save Review". The re-extracted value is written to form state, not to the database, until save time.

**Warning signs:**
- Staff edits `odometer`, then re-extracts `suspension`, then saves — and the saved `odometer` is the original AI value, not the staff correction.
- The review form appears correct immediately after inline re-extraction (because form state is right) but after a page refresh, the form shows the wrong value (because `extraction_result` in DB was overwritten).
- The `extraction_stale` flag becomes unreliable — it was set `false` by the full extraction, then `false` again by inline re-extraction, even though the user has pending edits.

**Phase to address:** Inline re-extraction phase. Establish the data flow architecture before writing any code: does inline re-extraction write to DB or not? Document the decision explicitly in the phase plan.

---

### Pitfall 5: GPT-4o Structured Output Schema Breaks on Zod 4 Features

**What goes wrong:**
The project uses Zod 4 (confirmed — `package.json` and codebase). The Vercel AI SDK uses `Output.object({ schema })` with `generateText`. Zod 4 introduced breaking changes from Zod 3, and the AI SDK's schema conversion (from Zod to JSON Schema for the OpenAI API) may not handle Zod 4's new features correctly depending on the AI SDK version.

Specific risk: if `buildExtractionSchema` is modified to use Zod 4-specific validators (e.g., new refinement APIs, new date types, new `.pipe()` chains) during the accuracy improvement work, the AI SDK may fail to serialise the schema, or may silently produce a different JSON Schema than intended, causing GPT-4o to return output that does not match the expected shape.

**Why it happens:**
Developers add validation to the Zod schema to improve type safety (e.g., `z.string().min(1)` on value fields, or custom refinements), not realising the Zod schema is being sent to GPT-4o as a structural constraint, not just used for local validation. Constraints that make sense locally (e.g., "value must be a non-empty string") break the GPT-4o structured output contract because GPT-4o cannot produce a non-empty string for a field that is genuinely not present.

Currently, `value: z.string().nullable()` is the correct pattern — nullable explicitly allows null for "not found" fields. Adding `.min(1)` would break this contract.

**How to avoid:**
Do not add Zod refinements (`.refine()`, `.min()`, `.max()`, `.regex()`) to the extraction schema fields. The extraction schema's purpose is to tell GPT-4o the shape of the output, not to validate business logic. Business logic validation belongs in the review form schema (`buildFormSchema` in `build-form-schema.ts`), not in the AI extraction schema.

When modifying `buildExtractionSchema`, test the result by logging `JSON.stringify(schema)` (or the AI SDK's internal JSON Schema conversion) and verifying the OpenAI API receives the expected schema shape.

**Warning signs:**
- GPT-4o returns a 400 error from the OpenAI API with a message about the schema not being valid JSON Schema.
- `Output.object()` throws at runtime with a Zod validation error even though GPT-4o's response looks correct — indicates the Zod refinement is too strict.
- Fields that were returning `null` start returning empty strings `""` — indicates the `nullable()` contract was accidentally removed.

**Phase to address:** Any phase that modifies `buildExtractionSchema`. Apply the "schema is shape, not validation" rule before writing code.

---

### Pitfall 6: Suspension Inference Confidence Calibration — "Medium" Used for Lookup vs Genuine Inference

**What goes wrong:**
The target feature is inferring suspension type from make/model/year when it is not visible in photos. The extraction prompt already has a confidence scale where "medium" = inferred from vehicle knowledge. After implementing manufacturer knowledge inference for suspension, GPT-4o may return "medium" confidence for all suspension values — both for correctly inferred common configurations (e.g., a 2023 Kenworth T909 almost certainly has airbag rear suspension) and for ambiguous cases where the model is guessing (e.g., a 2004 Hino 500 where both spring and airbag were options).

The review form uses confidence to highlight fields needing staff review. If "medium" is used indiscriminately, staff either over-review (wasting time) or under-review (trusting the inference when they should not).

**Why it happens:**
The confidence scale was designed for direct extraction from photos. Adding an inference path blurs the meaning of "medium" — it used to mean "I can see it but the plate is partially obscured." Now it could mean "I know this make/model uses airbag as standard" or "I'm guessing based on general knowledge."

**How to avoid:**
Explicitly encode the suspension inference knowledge in the `aiHint` for the suspension field rather than relying on GPT-4o's general knowledge. The current `aiHint` says: "Rear/under-vehicle photos: rubber airbags at axle ends = Airbag; leaf springs = Spring. Kenworth/Mack offer both." Extend this with a specific lookup table for common configurations:

```
KNOWN CONFIGURATIONS (use if suspension not visible — return confidence "medium"):
Kenworth T909/T610 2015+: Airbag (standard)
Kenworth T909/T610 pre-2015: Spring (spring standard; airbag was option — cannot confirm without photo)
Mack Super-Liner/Trident: Airbag (standard for highway spec)
Volvo FH/FM 2010+: Airbag (standard)
Hino 300 Series: Spring (no airbag option)
Isuzu NLR-FRR: Spring (no airbag option)
Isuzu FVR/FVZ/FXZ: Spring (standard; airbag for some fleet specs — cannot confirm without photo)
```

For makes/models NOT in the lookup table, return null rather than guessing.

**Warning signs:**
- Suspension field returns "medium" confidence for a Hino 300 (which only ever has spring) — indicates the model is treating all inferences as medium regardless of certainty.
- Staff frequently override the inferred suspension value — indicates the inference is unreliable.
- Suspension returns "high" confidence when no suspension photo was provided — indicates the model incorrectly reported high confidence for an inference.

**Phase to address:** Suspension inference phase. Add the lookup table to the aiHint before testing; do not rely on GPT-4o's general knowledge without encoding the expected values explicitly.

---

### Pitfall 7: Inline Re-extraction API Design — Calling Full Extraction for One Field Is Wasteful and Slow

**What goes wrong:**
The simple implementation of inline re-extraction is to call `/api/extract` again with the same `assetId` and then only use the result for the target field. This works but has a 10-30 second latency (GPT-4o vision over multiple photos) and costs the same as a full extraction. Staff will not use a feature that takes 20 seconds to fix one field.

**Why it happens:**
The extraction prompt and schema are tightly coupled — `buildExtractionSchema` outputs a schema for all fields simultaneously, and `buildSystemPrompt` instructs the model to extract all fields. There is no existing path for single-field extraction.

**How to avoid:**
Build a separate API route (e.g., `/api/extract-field`) that accepts `assetId` and `fieldKey`, constructs a minimal single-field schema (`z.object({ [fieldKey]: z.object({ value, confidence }) })`), and sends a targeted prompt focused on extracting only that field. This will be significantly faster because:
1. The model only needs to reason about one field.
2. The response is much shorter (no need to populate 40+ fields).
3. The prompt can include the current extracted values as context ("The field `suspension` currently shows `null`. Re-examine the photos and look specifically for suspension components visible under the rear axle.").

For select-type fields (like `suspension`), include the allowed options directly in the single-field prompt. For complex inferred fields (like `transmission`), include the make/model/year from existing extracted data as context.

**Warning signs:**
- Inline re-extraction latency is similar to full extraction latency (>10 seconds) — indicates full extraction is being used.
- Staff report that inline re-extraction is "too slow to bother with" — the feature will be abandoned if latency is not addressed.
- API costs increase significantly after inline re-extraction ships — indicates per-field extractions are triggering full extractions.

**Phase to address:** Inline re-extraction phase. Design the targeted API route first; do not ship inline re-extraction backed by full extraction even as a "temporary" implementation.

---

### Pitfall 8: Description Style Guide Prompting Conflicts With Subtype Template Routing

**What goes wrong:**
The description system prompt uses exact-match heading routing to select the correct template (e.g., `EXCAVATOR`, `TIPPER TRAILER`). Style-guide additions (few-shot examples, tone instructions, Jack's quality bar) may be inserted in positions that interfere with this routing.

Specifically: if style instructions are added between the UNIVERSAL RULES section and the TEMPLATES section, or embedded within template blocks, GPT-4o may misinterpret them as template content rather than style constraints. The model may also start using style examples from other subtypes when generating for a given subtype (e.g., the Prime Mover example's narrative style bleeding into Excavator descriptions).

**Why it happens:**
The prompt has evolved across many phases and is now very long (~1,000 lines). Inserting style guidance at the wrong position can disrupt the model's attention on template routing. GPT-4o processes the prompt sequentially, and instructions near the end of the prompt receive more attention than instructions at the start — this is a known characteristic of large context windows.

**How to avoid:**
Add style guidance immediately before the QUALITY REFERENCE EXAMPLES section, not inside template blocks. Add a clear heading like "STYLE GUIDELINES — apply to all descriptions:" followed by no more than 5-8 specific, concrete rules. Do not bury style guidance in the middle of the template definitions.

When adding new quality reference examples, place them in the correct section by subtype proximity (Truck examples near Truck templates, etc.) with a clearly labelled heading.

Test with at least three different subtypes (one truck, one earthmoving, one forklift) after any style addition to confirm template routing still works correctly.

**Warning signs:**
- After adding style guidance, descriptions for a subtype start using the wrong template structure (e.g., Excavator descriptions using the Wheel Loader format).
- The `asset_subtype` passed in the user prompt is ignored — the model picks a template based on visual recognition alone rather than the confirmed subtype.
- The description quality improves for the test subtype but regresses for other subtypes that were not tested.

**Phase to address:** Description quality phase. Test template routing for 3+ subtypes before and after each style addition.

---

### Pitfall 9: react-hook-form `setValue` for Inline Updates Does Not Mark Field as Dirty

**What goes wrong:**
The review form uses `react-hook-form` with `buildDefaultValues` as the initial state. Inline re-extraction will call `setValue(fieldKey, newValue)` to update a field without requiring the user to type. By default, `setValue` in react-hook-form does not mark the field as dirty (`isDirty: false`) unless the `shouldDirty: true` option is passed. 

The existing code uses `dirtyFields` to determine which fields have been changed:

```typescript
const { control, handleSubmit, getValues, setValue, watch, formState: { errors, dirtyFields } } = useForm(...)
```

If the inline re-extracted value is not marked dirty, the save action may not include it in the saved fields, or the UI may not show the confidence badge updating correctly.

Additionally, if `shouldValidate: true` is not passed to `setValue`, the field will not be validated immediately, and a newly set enum value (e.g., for a select field) may violate the Zod schema without showing an error.

**Why it happens:**
`setValue` options (`shouldDirty`, `shouldTouch`, `shouldValidate`) are easy to miss. The default behaviour (no options) was designed for programmatic resets, not for user-facing updates.

**How to avoid:**
All inline re-extraction `setValue` calls must include `{ shouldDirty: true, shouldTouch: true }`:

```typescript
setValue(fieldKey, newValue, { shouldDirty: true, shouldTouch: true })
```

If the field uses select inputs (e.g., `suspension`), also add `shouldValidate: true` to trigger immediate Zod validation against the allowed options.

**Warning signs:**
- After inline re-extraction, the field shows the new value in the form, but the "Save Review" button is disabled (because no dirty fields are detected).
- After inline re-extraction and save, the re-extracted value does not appear in the saved `assets.fields` — because `dirtyFields` did not include it and the save action filtered it out.
- The confidence badge does not update after inline re-extraction — indicates `setValue` did not trigger a re-render because the field was not marked as touched.

**Phase to address:** Inline re-extraction phase. Include `shouldDirty: true` in all `setValue` calls as a non-negotiable implementation requirement.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Call full `/api/extract` for inline re-extraction and filter client-side | Zero new backend code | 10-30s latency per field; staff stop using the feature | Never — latency is a dealbreaker |
| Add few-shot style examples to description prompt without testing all subtypes | Fast to implement | Template drift for untested subtypes; silent regression | Never — test matrix is small (3 subtypes) and spot-checks take <5 minutes |
| Write inline re-extracted value to `extraction_result` DB column | Simple data flow | Overwrites staff edits; trust in the review form is destroyed | Never — form state must be the source of truth for in-progress edits |
| Add Zod refinements to extraction schema for "better validation" | Catches invalid values locally | GPT-4o structured output breaks silently; null fields start failing | Never — extraction schema is a shape contract, not a validator |
| Rely on GPT-4o's general knowledge for suspension inference (no explicit lookup table in aiHint) | Zero prompt engineering effort | Inconsistent confidence calibration; medium confidence on known configurations AND guesses | Acceptable only if auditability of the inference source is not required |
| Monolithic description prompt for all asset types (status quo) | Simple deployment | Any edit can regress any subtype; no isolation | Acceptable for v1.6 — splitting into per-type prompts is a v2 consideration |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GPT-4o + Zod schema (extraction) | Adding `.refine()` or `.min()` to value fields — breaks structured output contract | Keep value fields as `z.string().nullable()` only; no refinements on fields GPT-4o must populate |
| GPT-4o + description prompt | Inserting style rules inside template blocks — disrupts template routing | Add style rules in a named section before QUALITY REFERENCE EXAMPLES, never inside template definitions |
| react-hook-form `setValue` for programmatic updates | Calling `setValue(key, val)` without options — field not marked dirty, excluded from save | Always call `setValue(key, val, { shouldDirty: true, shouldTouch: true })` for externally sourced values |
| Inline re-extraction + `extraction_result` DB column | Writing partial result back to DB — overwrites other fields | Return re-extracted value to client only; DB write happens at save-review time via `assets.fields` |
| `DESCRIPTION_SYSTEM_PROMPT` + few-shot examples | Copying real descriptions that predate strict templates — teaches the model old formats | Verify every example against the current template for that subtype before adding |
| Vercel AI SDK `Output.object()` + Zod 4 | Using Zod 4-specific validators unknown to AI SDK schema conversion | Stick to `z.object`, `z.string`, `z.enum`, `.nullable()`, `.describe()` — verified to work |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full extraction called per field for inline re-extraction | 20-30s per click; staff abandon feature | Build targeted `/api/extract-field` route with single-field schema | Immediate — latency is noticeable from the first use |
| Description prompt grows to >1,500 lines with new examples | Marginal latency increase; increased API cost per call | Audit prompt length before each addition; remove redundant examples | Not a hard limit, but >2,000 lines starts to affect coherence in long prompts |
| Re-extraction triggered on every field visibility change in the review form | Runaway API calls; OpenAI rate limit errors | Inline re-extraction must be user-initiated (explicit button click); never auto-triggered | Immediately if auto-triggered |
| Signed URL generation for re-extraction (3600s expiry) | Signed URLs from original extraction may have expired if asset was opened hours later | Generate fresh signed URLs in the inline re-extraction API call, not reuse cached ones | When >1 hour has passed since the original extraction |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Inline re-extraction API accepts arbitrary field names from client | Prompt injection — attacker crafts a field name that modifies the system prompt | Validate `fieldKey` against `getAIExtractableFieldDefs(assetType)` server-side before using in prompt |
| Few-shot examples in description prompt contain real VINs or serial numbers from actual assets | Personal/commercial data leakage in prompt; ISO 27001 concern | Use fictional or redacted identifiers in all examples; audit existing examples for real VINs |
| Inline re-extraction route lacks `user_id` guard | Any authenticated user can re-extract any asset | Mirror the pattern from `/api/extract`: `.eq('user_id', user.id)` on the Supabase query |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Inline re-extraction button on every field in the review form | Visual clutter; cognitive overload; staff don't know which fields benefit from re-extraction | Show re-extract button only on AI-extractable fields with null or low-confidence values; hide for fields confirmed via inspection notes |
| No loading state during inline re-extraction | Staff click multiple times thinking nothing happened; multiple concurrent API calls | Disable the re-extract button immediately on click; show a spinner; re-enable after result returns |
| Re-extracted value replaces staff edit without warning | Staff correction is overwritten silently | If the field has been manually edited (dirty), show a confirmation before overwriting: "Replace your edit with AI result?" |
| Description quality examples add complexity the model doesn't apply consistently | Descriptions for some subtypes improve but others regress; inconsistent quality across asset types | Add no more than one style improvement per phase; validate across a broad subtype matrix after each |
| Suspension inference returns a value for assets where photos clearly show the wrong type | Staff distrust the AI output; stop using the tool | If the suspension field has a photo available (under-vehicle shot), always prefer the photo reading over the inference; only use inference when no rear/under-vehicle photo exists |

---

## "Looks Done But Isn't" Checklist

- [ ] **Inline re-extraction does not overwrite DB:** Edit a field in the review form, trigger inline re-extraction on a different field, save — verify the manually edited field is saved with the staff value, not the original AI value.
- [ ] **Full extraction prompt regression check:** Run extraction against a Truck, Excavator, and Forklift with known-good photos before and after any prompt change — verify field counts and key values are consistent.
- [ ] **Hourmeter decimal in actual failure photos:** Confirm the failure photo shows the decimal clearly (prompt fix needed) or ambiguously (photo guidance needed) before writing any prompt change.
- [ ] **Few-shot examples are template-compliant:** Verify each new description example against its template: line 1 format, footer exact wording, no dot points, no marketing language.
- [ ] **`setValue` marks field dirty:** After inline re-extraction, confirm the "Save Review" button is enabled and the re-extracted field is included in the saved `assets.fields`.
- [ ] **Inline re-extraction latency:** Time a single-field re-extraction from click to result — must be under 8 seconds on a standard internet connection; if >8 seconds, the targeted API route is not in use.
- [ ] **Suspension inference only fires when no photo:** Confirm that if a rear/under-vehicle photo is provided, GPT-4o uses the photo, not the lookup table inference.
- [ ] **No real VINs or serials in prompt examples:** Search the description system prompt for patterns matching VIN format (17 characters) and serial number patterns before shipping.
- [ ] **Description template routing intact after style additions:** After adding style guidance, generate descriptions for a Truck, an Excavator, a Forklift, and a Trailer — confirm each uses the correct template structure, not the closest example's structure.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Prompt regression discovered post-deploy | MEDIUM | Revert the prompt string to its previous version (it is a constant in source code — git revert is fast); no DB migration needed |
| Inline re-extraction overwrites staff edits (shipped incorrectly) | HIGH | Remove inline re-extraction feature from UI; fix data flow architecture; re-deploy; affected records need manual review by staff |
| Few-shot examples cause template drift | LOW | Remove the offending examples; re-test; re-deploy |
| Hourmeter prompt change causes regressions for other numeric fields | LOW | Revert the hourmeter section of the prompt; add a comment that the section was previously modified and why it was reverted |
| `setValue` without `shouldDirty` causes saves to silently drop re-extracted values | MEDIUM | Add `shouldDirty: true` option; re-deploy; affected records cannot be automatically fixed — staff must re-review any records saved after the broken deploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Prompt regression across asset types | Prompt improvement (hourmeter/suspension) | Run spot-check extractions for Truck, Excavator, Forklift before and after each prompt edit |
| Hourmeter OCR — photo problem vs prompt problem | Hourmeter accuracy phase | Inspect failure photos before writing any prompt change; document the root cause finding |
| Few-shot examples causing template drift | Description quality phase | Test description generation for 3+ subtypes after each example addition |
| Inline re-extraction overwriting DB | Inline field editing phase | Data flow architecture decision documented in phase plan before code is written |
| GPT-4o Zod schema constraints breaking structured output | Any schema modification phase | Log the JSON Schema sent to OpenAI; verify shape after any schema change |
| Suspension confidence calibration | Suspension inference phase | Explicit lookup table in aiHint; test with known configurations (T909 = Airbag, Hino 300 = Spring) |
| Targeted re-extraction latency | Inline field editing phase | Time the re-extraction before shipping; must be under 8 seconds |
| `setValue` not marking field dirty | Inline field editing phase | After inline re-extract and save, confirm re-extracted field is in `assets.fields` |
| Description style conflicts with template routing | Description quality phase | Generate descriptions for Truck + Excavator + Forklift after each style change |
| Prompt injection via arbitrary fieldKey | Inline field editing API phase | Validate fieldKey against schema before use in prompt construction |

---

## Sources

- Direct codebase inspection: `src/app/api/extract/route.ts`, `src/app/api/describe/route.ts`, `src/lib/ai/extraction-schema.ts`, `src/components/asset/ReviewPageClient.tsx` — HIGH confidence
- react-hook-form documentation: `setValue` options (`shouldDirty`, `shouldTouch`, `shouldValidate`); `dirtyFields` behaviour; `defaultValues` caching — HIGH confidence (official docs)
- OpenAI structured output documentation: JSON Schema constraints supported by GPT-4o; Zod-to-JSON-Schema conversion via Vercel AI SDK — MEDIUM confidence (OpenAI platform docs + Vercel AI SDK source)
- GPT-4o vision OCR behaviour: decimal digits in LCD displays; positional attention in long prompts — MEDIUM confidence (community-verified patterns; not in official OpenAI documentation)
- Vercel AI SDK v6: `Output.object()` pattern; `generateText` with structured output — HIGH confidence (Vercel AI SDK official docs, confirmed as correct pattern in this codebase)
- Description prompt template routing: Phase 16-19 decisions documented in PROJECT.md — HIGH confidence (project history)

---

*Pitfalls research for: v1.6 AI quality improvements + inline field editing — prestige_assets / Slattery Auctions*
*Researched: 2026-04-18*
