# Phase 24: Hourmeter Decimal Fix — Research

**Researched:** 2026-04-21
**Domain:** AI extraction prompt text, form validation schema, per-asset-type aiHint strings
**Confidence:** HIGH — root causes are directly visible in source code; no external dependencies

---

## Summary

There are two co-located bugs causing hourmeter decimal loss. The first is in the form validation layer: `build-form-schema.ts` uses the regex `/^\d*$/` for all `inputType: 'number'` fields, which silently rejects a value like `"1234.5"` because the period is not a digit. The second is in the `agriculture` schema's aiHint, which explicitly tells the AI "Digits only, no decimals" for hourmeter — directly contradicting the system prompt instruction to preserve decimals. A third minor inconsistency is that the `forklift` hours aiHint and the `truck` and `earthmoving` hourmeter aiHints say "Digits only" without mentioning decimals at all, leaving the AI to rely solely on the system-prompt READING HOURMETERS section.

The system prompt (`buildSystemPrompt`) does contain a correct instruction ("If the display shows decimal hours (e.g. 1234.5), include the decimal") but this is a single general sentence easily overridden by contradictory per-field aiHint text.

The fix requires changes in exactly three places:
1. `src/lib/review/build-form-schema.ts` — relax the regex to allow an optional decimal point and decimal digits.
2. `src/lib/schema-registry/schemas/agriculture.ts` — remove "no decimals" from the hourmeter aiHint and replace with decimal-inclusive language.
3. `src/lib/schema-registry/schemas/truck.ts`, `earthmoving.ts`, `forklift.ts` — add explicit decimal guidance to the hourmeter/hours aiHints so they reinforce rather than leave silent the system-prompt instruction.

**Primary recommendation:** Fix the form validation regex first (it silently drops any decimal the AI correctly extracts), then update aiHint text to be consistent across all four schemas.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXTRACT-01 | AI correctly reads hourmeter values with decimals (e.g. 1,234.5 hrs is not rounded or truncated to 12345) | Two root causes identified — regex in build-form-schema.ts strips decimals from extracted values; agriculture aiHint explicitly suppresses them. System prompt already instructs decimal preservation but is undermined by field-level hints. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hourmeter value extraction | API / Backend (GPT-4o via `/api/extract`) | — | AI reads photos and returns structured JSON; no browser involvement |
| Per-field extraction guidance | API / Backend (aiHint strings in schema registry, injected via `buildExtractionSchema`) | — | `buildExtractionSchema` embeds aiHint into the Zod schema description that is sent to GPT |
| System-level extraction rules | API / Backend (`buildSystemPrompt` in `extraction-schema.ts`) | — | Shared rules for all asset types; hourmeter section exists here |
| Form validation of extracted value | Frontend Server / Client (`build-form-schema.ts`, used in review page) | — | Zod schema governs what the review form accepts; rejects decimals today |
| Value persistence | Database (Supabase `assets.fields` JSONB) | — | Stored as string values after form submission |

---

## Root Cause Analysis

### Bug 1 (CRITICAL): Form Validation Strips Decimals

**File:** `src/lib/review/build-form-schema.ts` line 20

```typescript
// CURRENT — rejects "1234.5" because \d* does not match a period
shape[field.key] = field.inputType === 'number'
  ? z.string().regex(/^\d*$/, 'Must be a number').or(z.literal(''))
  : z.string()
```

This regex applies to **every** `inputType: 'number'` field across all asset types: hourmeter, odometer, year, horsepower, GVM, GCM, tare, hours (forklift), etc. Changing it to allow an optional decimal affects all of these fields.

**Fix:** Change the regex to `/^\d*\.?\d*$/` — allows digits, an optional period, and optional decimal digits.

```typescript
// FIXED
shape[field.key] = field.inputType === 'number'
  ? z.string().regex(/^\d*\.?\d*$/, 'Must be a number').or(z.literal(''))
  : z.string()
```

**Impact of fix:** Downstream code (`generateFieldsBlock`, output generation, Salesforce copy-paste block) stores and displays the value as a raw string, so `"1234.5"` flows through unchanged. No further changes needed in the output pipeline. [VERIFIED: reading `generateFieldsBlock.ts` — it maps `fields[f.key]` directly with no numeric coercion]

### Bug 2 (PROMPT CONTRADICTION): Agriculture aiHint Suppresses Decimals

**File:** `src/lib/schema-registry/schemas/agriculture.ts` line 27

Current aiHint includes: `"Digits only, no decimals."`

This directly contradicts `buildSystemPrompt` line 75: `"If the display shows decimal hours (e.g. 1234.5), include the decimal"`. When the per-field description disagrees with the system prompt, the per-field description wins for that field — the AI treats it as a field-specific override.

**Fix:** Remove "no decimals" and replace with: `"If display shows a decimal (e.g. 1234.5), include it."`

### Bug 3 (MISSING GUIDANCE): Truck, Earthmoving, Forklift aiHints Are Silent on Decimals

These schemas say "Digits only" without mentioning decimals:
- `truck.ts` line 55: hourmeter — `"Digits only."`
- `earthmoving.ts` line 34: hourmeter — `"Digits only."`
- `forklift.ts` line 27: hours — `"digits only, no units."`

Without explicit decimal guidance in the aiHint, the AI relies on the system prompt's general READING HOURMETERS section. This is fragile — any future system prompt refactor could silently break decimal extraction. Adding explicit decimal language makes each field self-documenting.

**Fix:** Append to each: `"If display shows a decimal (e.g. 1234.5), include it."`

---

## Standard Stack

No new libraries required. This phase modifies existing TypeScript source files only.

| File | Role | Change Type |
|------|------|-------------|
| `src/lib/review/build-form-schema.ts` | Form validation for all review fields | Regex change (1 line) |
| `src/lib/schema-registry/schemas/agriculture.ts` | Per-field aiHint for AI extraction | String edit in aiHint |
| `src/lib/schema-registry/schemas/truck.ts` | Per-field aiHint for AI extraction | String addition to aiHint |
| `src/lib/schema-registry/schemas/earthmoving.ts` | Per-field aiHint for AI extraction | String addition to aiHint |
| `src/lib/schema-registry/schemas/forklift.ts` | Per-field aiHint (hours field) | String addition to aiHint |
| `src/lib/__tests__/build-form-schema.test.ts` | Tests for form schema validation | Add decimal acceptance tests |
| `src/lib/__tests__/extraction-schema.test.ts` | Tests for prompt/schema | Add decimal system-prompt assertion |

---

## Architecture Patterns

### How aiHint Reaches the AI

```
schema registry (FieldDefinition.aiHint)
        |
        v
buildExtractionSchema(assetType)
  → for each aiExtractable field:
    z.object({ value: z.string().nullable().describe(aiHint), confidence: ... })
        |
        v
Output.object({ schema })  ← passed to generateText()
        |
        v
GPT-4o structured output — JSON keyed by field, { value, confidence }
        |
        v
extraction_result saved to DB
        |
        v
buildDefaultValues() → extractionResult[field.key].value → form default
        |
        v
buildFormSchema() validation → CURRENT BUG STRIPS DECIMAL HERE
        |
        v
form submit → assets.fields JSONB → generateFieldsBlock → Salesforce output
```

### System Prompt READING HOURMETERS Section (current — already correct)

`buildSystemPrompt` lines 65–75 [VERIFIED]:
```
READING HOURMETERS:
- Common formats: XXXX.X or XXXXX — extract the exact number shown, digits only
- If the display shows decimal hours (e.g. 1234.5), include the decimal
```

This section is correct and does not need editing. The problem is per-field aiHints override or undermine it.

### Form Schema Validation (current — broken)

`build-form-schema.ts` line 20 [VERIFIED]:
```typescript
z.string().regex(/^\d*$/, 'Must be a number').or(z.literal(''))
```
`/^\d*$/` does not match `.` — any decimal value from extraction is rejected silently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Numeric string validation | Custom parser | Tighter regex: `/^\d*\.?\d*$/` |
| Decimal preservation in output | String conversion logic | Already stored/output as raw string — no conversion needed |

---

## Common Pitfalls

### Pitfall 1: Regex Too Permissive
**What goes wrong:** Changing `/^\d*$/` to `/^\d*\.?\d*$/` still allows strings like `"."` or `"1.2.3"`.
**Why it happens:** The regex anchors are correct (`^` and `$`) but `\.?` allows a leading or trailing period.
**How to avoid:** `/^\d*\.?\d*$/` with both sides being `\d*` (zero or more digits) is acceptable — `"."` alone would be invalid in practice (Zod `.or(z.literal(''))` handles the empty case). If stricter validation is needed: `/^\d+(\.\d+)?$/` — but this rejects the empty string, requiring the `.or(z.literal(''))` union to remain.
**Recommended:** Keep existing `.or(z.literal(''))` pattern and use `/^\d*\.?\d*$/`.

### Pitfall 2: Agriculture aiHint Change Creates Inconsistency with Reality
**What goes wrong:** Agricultural tractor hourmeters often display whole numbers only (older analog dials). Removing "no decimals" unconditionally may cause the AI to invent decimal precision that is not visible.
**Why it happens:** aiHint changes affect AI behaviour, not just validation.
**How to avoid:** Replace "Digits only, no decimals" with "If the display shows a decimal (e.g. 1234.5), include it; most tractor displays show whole numbers only." This preserves factual accuracy while allowing decimals when present.

### Pitfall 3: Breaking Existing Test for Number Field Validation
**What goes wrong:** `build-form-schema.test.ts` line 49 tests `rejects non-numeric string for number field` — the test uses `'abc'` which still fails with the new regex, so this test passes. But there is no test asserting that `'2011'` (integer-only) is accepted — if the regex becomes too strict it could break year fields.
**How to avoid:** Add a passing test for `'1234.5'` and a failing test for `'1234.5.6'`. Keep the existing `'abc'` rejection test.

### Pitfall 4: FieldRow inputMode="numeric" Blocks Decimal on Mobile
**What goes wrong:** `FieldRow.tsx` line 73 sets `inputMode="numeric"` for `inputType: 'number'` fields. On iOS/Android, `inputMode="numeric"` shows a numeric keypad **without** a decimal point. A staff member manually entering `1234.5` could not type the `.`.
**Why it happens:** `inputMode="numeric"` is keyboard-only numeric; `inputMode="decimal"` is keyboard-with-decimal.
**How to avoid:** Change `inputMode="numeric"` to `inputMode="decimal"` for all number fields. This is a one-line change in `FieldRow.tsx` and ensures manual entry of decimal hourmeter values is possible.
**Warning signs:** Staff on mobile unable to enter fractional odometer or hourmeter readings.

### Pitfall 5: Shared buildSystemPrompt Affects All 8 Asset Types
**What goes wrong:** `buildSystemPrompt` is shared — editing the READING HOURMETERS section changes behaviour for all asset types simultaneously.
**Why it happens:** There is no per-type system prompt; the same function is called for truck, earthmoving, forklift, agriculture, etc.
**How to avoid:** This phase does NOT need to edit `buildSystemPrompt` (it is already correct). Changes are limited to aiHints in individual schema files, which are per-field and per-type.

---

## Code Examples

### Fixed Form Validation (build-form-schema.ts)

```typescript
// Source: src/lib/review/build-form-schema.ts line 19-21 (CURRENT)
shape[field.key] = field.inputType === 'number'
  ? z.string().regex(/^\d*$/, 'Must be a number').or(z.literal(''))
  : z.string()

// FIXED — allows optional decimal point
shape[field.key] = field.inputType === 'number'
  ? z.string().regex(/^\d*\.?\d*$/, 'Must be a number').or(z.literal(''))
  : z.string()
```

### Fixed Agriculture aiHint (agriculture.ts)

```typescript
// CURRENT (line 27 excerpt):
// "...Digits only, no decimals. Only extract if clearly readable..."

// FIXED:
// "...Digits only. If the display shows a decimal (e.g. 1234.5), include it — most tractor displays show whole numbers. Only extract if clearly readable..."
```

### Appended Decimal Guidance for Truck/Earthmoving/Forklift aiHints

```typescript
// CURRENT truck hourmeter aiHint ends with:
// "...Extract only if clearly readable — do NOT guess."

// FIXED — append:
// "...Extract only if clearly readable — do NOT guess. If display shows a decimal (e.g. 1234.5), include it."

// Same pattern for earthmoving hourmeter and forklift hours.
```

### Fixed FieldRow inputMode (FieldRow.tsx)

```typescript
// CURRENT (line 73):
inputMode={field.inputType === 'number' ? 'numeric' : 'text'}

// FIXED:
inputMode={field.inputType === 'number' ? 'decimal' : 'text'}
```

### New Tests for build-form-schema.test.ts

```typescript
it('accepts decimal string for number field', () => {
  const schema = buildFormSchema([numberField])
  expect(() => schema.parse({ year: '1234.5' })).not.toThrow()
})

it('rejects double-decimal string for number field', () => {
  const schema = buildFormSchema([numberField])
  const result = schema.safeParse({ year: '1.2.3' })
  expect(result.success).toBe(false)
})
```

### New Tests for extraction-schema.test.ts

```typescript
describe('buildSystemPrompt — hourmeter decimal instruction', () => {
  it('READING HOURMETERS section instructs to include decimal', () => {
    const { buildSystemPrompt } = await import('@/lib/ai/extraction-schema')
    const prompt = buildSystemPrompt('truck', 'prime_mover')
    expect(prompt).toContain('1234.5')
    expect(prompt).toContain('include the decimal')
  })
})
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose build-form-schema` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXTRACT-01 | `buildFormSchema` accepts `"1234.5"` for a number field | unit | `npm test -- build-form-schema` | Yes — needs new case |
| EXTRACT-01 | `buildFormSchema` rejects `"1234.5.6"` for a number field | unit | `npm test -- build-form-schema` | No — Wave 0 gap |
| EXTRACT-01 | `buildFormSchema` still accepts `"5000"` (whole number) | unit | `npm test -- build-form-schema` | Yes (existing year test) |
| EXTRACT-01 | `buildSystemPrompt` contains `"1234.5"` and decimal instruction | unit | `npm test -- extraction-schema` | No — Wave 0 gap |
| EXTRACT-01 | Agriculture aiHint does NOT contain "no decimals" | unit | `npm test -- extraction-schema` | No — Wave 0 gap |

### Sampling Rate

- **Per task commit:** `npm test -- build-form-schema extraction-schema`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] New test case: `'1234.5'` accepted for number field — add to `build-form-schema.test.ts`
- [ ] New test case: `'1234.5.6'` rejected for number field — add to `build-form-schema.test.ts`
- [ ] New describe block: `buildSystemPrompt — hourmeter decimal instruction` — add to `extraction-schema.test.ts`
- [ ] New test: agriculture aiHint `hourmeter` does not contain `"no decimals"` — add to `extraction-schema.test.ts`

---

## Runtime State Inventory

> Not applicable — this is a code/config edit phase. No stored data, live service config, OS-registered state, secrets, or build artifacts reference hourmeter field names.

---

## Environment Availability

> Step 2.6: SKIPPED — no external dependencies. All changes are TypeScript source edits and test additions. Node, npm, and Vitest are confirmed present (used by all prior phases).

---

## Open Questions (RESOLVED)

1. **Should `inputMode="decimal"` change be in this phase or a separate cleanup?**
   - What we know: `inputMode="numeric"` blocks the decimal key on iOS/Android for manual entry. The extraction path (AI writes the value, not the user) works regardless of inputMode. So it only affects manual correction of extracted values.
   - What's unclear: Whether staff ever manually edit hourmeter after AI extraction fails, and whether they use mobile.
   - RESOLVED: Include it — it is a one-line change in `FieldRow.tsx`, affects no tests, and the fix is obviously correct. If it creates problems, it is trivially reverted. Included as Task C+D in 24-01-PLAN.md.

2. **Do other `inputType: 'number'` fields (odometer, year, GVM, etc.) need decimal support?**
   - What we know: Odometer already has correct decimal instruction in the system prompt. Year, GVM, GCM, tare, horsepower are whole numbers in practice. The regex fix affects all of them.
   - What's unclear: Whether the regex fix causes any regression on whole-number fields.
   - RESOLVED: No regression possible — `/^\d*\.?\d*$/` is strictly more permissive than `/^\d*$/`. It still accepts all strings the old regex accepted and adds decimal strings. Whole-number fields simply never receive a decimal from extraction.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Zod `.safeParse()` fails silently (no exception, returns `success: false`) when regex doesn't match — the form default value is discarded rather than erroring | Root Cause Analysis | If it throws instead of failing gracefully, the review page would error rather than silently dropping the decimal. Low risk — Zod safe-parse pattern is well-established. [ASSUMED — not traced through ReviewPageClient error handling] |
| A2 | `inputMode="decimal"` on mobile iOS/Android shows a decimal-capable keyboard | Common Pitfalls | If the mobile behaviour differs, the fix has no effect (but doesn't break anything either). [ASSUMED — training knowledge, not device-tested] |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/review/build-form-schema.ts` — regex `/^\d*$/` directly observed; confirmed it rejects `.`
- `src/lib/ai/extraction-schema.ts` — `buildSystemPrompt` READING HOURMETERS section directly read; decimal instruction is present
- `src/lib/schema-registry/schemas/agriculture.ts` — "no decimals" text directly observed in aiHint
- `src/lib/schema-registry/schemas/truck.ts`, `earthmoving.ts`, `forklift.ts` — "Digits only" without decimal mention directly observed
- `src/lib/output/generateFieldsBlock.ts` — confirmed no numeric coercion; output is raw string
- `src/components/asset/FieldRow.tsx` — `inputMode="numeric"` directly observed

### Secondary (MEDIUM confidence)
- `src/__tests__/build-form-schema.test.ts` — existing test coverage verified; gap in decimal test cases confirmed

---

## Metadata

**Confidence breakdown:**
- Root cause identification: HIGH — bugs are visible in source code, no inference required
- Fix correctness: HIGH — regex change and aiHint edits are straightforward
- Regression risk: HIGH confidence (low risk) — regex change is strictly additive; aiHint changes are per-field

**Research date:** 2026-04-21
**Valid until:** Stable — no external dependencies; valid until source files are refactored
