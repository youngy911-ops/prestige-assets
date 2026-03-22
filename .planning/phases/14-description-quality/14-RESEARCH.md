# Phase 14: Description Quality - Research

**Researched:** 2026-03-22
**Domain:** GPT-4o system prompt engineering, route handler logic, description template authoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Footer enforcement (DESC-01)**
- Programmatic strip-and-reappend in `src/app/api/describe/route.ts` after `generateText` returns but before persisting to DB
- Always strip any existing footer-looking line (any variant), then append the correct footer for the asset type
- Footer logic by asset type:
  - `asset_type === 'general_goods'` → `"Sold As Is, Untested."`
  - All other types (truck, trailer, earthmoving, agriculture, forklift, caravan, marine) → `"Sold As Is, Untested & Unregistered."`

**TBC → estimate using model knowledge (DESC-01, SC4)**
- Remove the "replace with TBC" rule from `DESCRIPTION_SYSTEM_PROMPT`
- Replace with: AI should estimate/infer plausible values using its training knowledge of that make/model/year and write them as confirmed (no qualifier like "approx." or "typically")
- Exception — identifiers: VIN, serial number, chassis number, registration — these must only appear if confirmed from photos or inspection notes. Never infer. Omit if not visible.

**New truck body templates (TRUCK-02)**
- Write templates for all 9 remaining subtypes: Flat Deck, Cab Chassis, Beavertail, Tilt Tray, Vacuum, Concrete Pump, Concrete Agitator, EWP, Refrigerated Pantech
- Existing "RIGID TRUCK / PANTECH / CURTAINSIDER / TAUTLINER / VAN" template retained as fallback; above subtypes get own named templates
- EWP, Vacuum, Concrete Pump, Concrete Agitator are distinctly specialised — must capture body-specific buyer details

**New earthmoving templates (DESC-02)**
- Write templates for 4 subtypes without templates: Compactor, Dump Truck, Trencher, Crawler Tractor
- Existing templates (Excavator, Dozer, Grader, Skid Steer Loader, Wheel Loader, Telehandler, Backhoe Loader) kept as-is
- DOZER template heading must be updated to match renamed `bulldozer` subtype key (Phase 13 renamed `dozer` → `bulldozer`)

### Claude's Discretion
- Exact wording of each new truck and earthmoving description template
- Whether to rename the RIGID/PANTECH/CURTAINSIDER group template or keep it as fallback
- Implementation of the `normalizeFooter()` helper (function name, placement in route handler)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRUCK-02 | Description template exists for each truck subtype so GPT-4o generates correctly formatted output | New templates for 9 truck subtypes added to `DESCRIPTION_SYSTEM_PROMPT`; existing PRIME MOVER, TIPPER, SERVICE TRUCK, RIGID/PANTECH group retained |
| DESC-01 | All generated descriptions always close with "Sold As Is, Untested & Unregistered." — no exceptions across all asset types and subtypes | Programmatic `normalizeFooter()` guard in route handler post-`generateText`; system prompt TBC rule removed and replaced with estimate rule |
| DESC-02 | Description templates exist for all earthmoving subtypes so GPT-4o has concrete format guidance | 4 new earthmoving templates (Compactor, Dump Truck, Trencher, Crawler Tractor); DOZER heading renamed to BULLDOZER |
</phase_requirements>

---

## Summary

Phase 14 makes three targeted changes to `src/app/api/describe/route.ts`: (1) add description templates for 9 truck subtypes and 4 earthmoving subtypes that currently lack them; (2) add a programmatic footer normalisation function that runs between `generateText` and the Supabase `update` call; (3) remove the "TBC" rule from `DESCRIPTION_SYSTEM_PROMPT` and replace it with an instruction to estimate from model knowledge.

All changes are confined to a single file (`route.ts`). No schema changes, no new fields, no new asset types. The test surface is the existing `describe-route.test.ts`, which already mocks `generateText` and asserts on both the system prompt content and the persisted description text — making it the natural home for new assertions covering footer normalisation and the absence of the TBC rule.

The existing templates in `DESCRIPTION_SYSTEM_PROMPT` establish clear conventions: ALL_CAPS section headings, ordered field lines, short inline items separated by commas, blank lines between groups, footer as the last line. The 13 new templates (9 truck + 4 earthmoving) must follow the same structural rules so GPT-4o matching is consistent.

**Primary recommendation:** Implement as two tasks — Task 1: `normalizeFooter` + TBC rule change + tests; Task 2: the 13 new templates + tests. Both tasks modify only `route.ts` and `describe-route.test.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vercel AI SDK (`ai`) | current | `generateText` call to GPT-4o | Already in use — do not change |
| `@ai-sdk/openai` | current | OpenAI adapter for Vercel AI SDK | Already in use |
| Vitest | ^4.1.0 | Unit tests for route handler | Project-wide test framework |

### No New Dependencies
This phase requires zero new npm packages. All changes are string manipulation (footer normalisation) and string content (prompt templates).

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. All edits are within:

```
src/
└── app/
    └── api/
        └── describe/
            └── route.ts    ← ALL Phase 14 changes land here
src/
└── __tests__/
    └── describe-route.test.ts  ← ALL Phase 14 tests land here
```

### Pattern 1: normalizeFooter Helper

**What:** Pure function that strips any trailing footer-like line from AI output, then appends the correct footer for the asset type.

**When to use:** Called after `generateText` returns `{ text }`, before `supabase.from('assets').update(...)`.

**Insertion point in route.ts:** Between line ~320 and line ~330 (after the refusal guard, before the Supabase update).

```typescript
// Inject between generateText result and supabase.update
// Step 7 (existing): refusal guard
// NEW Step 8: footer normalisation
const normalizedText = normalizeFooter(text, asset.asset_type)
// Step 9 (was 8): persist normalizedText instead of text
```

**Footer stripping approach:** The last non-blank line of the AI output may contain a footer variant. Strip any line matching the pattern `Sold As Is` (case-insensitive) from the end of the text, then append the correct footer. This handles both missing and wrong-variant footers.

```typescript
// Source: derived from CONTEXT.md decisions
function normalizeFooter(text: string, assetType: string): string {
  const footer = assetType === 'general_goods'
    ? 'Sold As Is, Untested.'
    : 'Sold As Is, Untested & Unregistered.'
  // Strip trailing blank lines and any existing footer variant
  const lines = text.trimEnd().split('\n')
  const lastMeaningfulIdx = lines.findLastIndex(l => l.trim().length > 0)
  const trimmed = lines.slice(0, lastMeaningfulIdx + 1)
  const last = trimmed[trimmed.length - 1]?.trim() ?? ''
  if (last.toLowerCase().startsWith('sold as is')) {
    trimmed.pop()
  }
  return [...trimmed, footer].join('\n')
}
```

### Pattern 2: Template Section in DESCRIPTION_SYSTEM_PROMPT

**What:** Named ALL_CAPS section that GPT-4o pattern-matches to the asset subtype.

**Convention (from existing templates):**
- Heading is ALL_CAPS, matches the subtype label or a recognisable synonym
- Lines are ordered: Line 1 identity → powertrain → drivetrain → body/equipment → extras → footer
- Short related items share a line, separated by commas
- Blank line between groups
- Footer is always the literal last line of each template section

**Example — existing TIPPER template (HIGH confidence, source: route.ts line 46):**
```
TIPPER
Line 1: Year, Make, Model, Drive Type, Tipper
Engine: Make, cylinders, fuel type, HP
Transmission, Diff Locks, Exhaust Brake
Key extras
Body builder, dimensions in mm, material, rock lining, tarp type, tailgate, Ringfeder if confirmed
Payload: Xkg
Sold As Is, Untested & Unregistered.
```

### Pattern 3: TBC Rule Removal

**What:** In `DESCRIPTION_SYSTEM_PROMPT`, line 4 of the PROCESS section currently reads:
```
4. If a spec cannot be confirmed replace it with TBC so the user knows to verify it
```

**Replace with:**
```
4. If a spec cannot be confirmed from photos, inspection notes, or your knowledge of that specific make/model/year, omit it — never write "TBC"
```

This aligns with the already-present HP Reference table which demonstrates the estimate-from-knowledge pattern. The rule change extends that philosophy to all spec fields.

**Identifier exception:** Must be reinforced in the PROCESS section or as a separate UNIVERSAL RULE bullet: VIN, serial number, chassis number, and registration must only appear if directly visible in photos or inspection notes — never infer, never estimate, omit if not visible.

### Anti-Patterns to Avoid

- **Qualifying estimates:** Do not instruct GPT-4o to write "approx.", "typically", or "estimated" — estimates are written as confirmed values per CONTEXT.md decisions.
- **TBC anywhere:** Zero tolerance. The system prompt must not mention TBC as an acceptable output.
- **Footer in system prompt as sole guard:** The programmatic `normalizeFooter` is the authoritative guard. The footer in each template is a reinforcement hint, not the safety net.
- **Modifying schema files:** This phase is prompt-only. No changes to `truck.ts` or `earthmoving.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Footer enforcement | Custom regex parser | Simple `startsWith('sold as is')` on last line | Footers are a fixed set of known strings; pattern matching is sufficient and safe |
| Template selection | Code-side subtype→template map | GPT-4o ALL_CAPS heading matching | Already works for 13+ existing templates; model reliably selects correct section |

**Key insight:** GPT-4o's ability to pattern-match ALL_CAPS headings to asset subtypes is already proven by 13 existing templates. Adding more templates follows the same mechanism — no code routing logic needed.

---

## Common Pitfalls

### Pitfall 1: Footer Normalisation Breaks Blank-Line Trailing

**What goes wrong:** `normalizeFooter` joins lines with `\n` but the AI output may end with `\r\n` or multiple blank lines, causing the footer to appear on a new paragraph rather than directly after the last content line.

**Why it happens:** `.trimEnd()` on the full text vs. trimming each line behaves differently depending on AI output whitespace.

**How to avoid:** `trimEnd()` the full text first, then split, then process lines. The footer must be appended as the final element with a single newline separator — no trailing blank line after it.

**Warning signs:** Test assertion `text.endsWith('Sold As Is, Untested & Unregistered.')` fails even though the footer appears in the output.

### Pitfall 2: DOZER Heading Not Updated to BULLDOZER

**What goes wrong:** Phase 13 renamed `dozer` → `bulldozer` in the earthmoving schema. If the system prompt still says `DOZER`, GPT-4o may select the wrong template or none for a bulldozer asset.

**Why it happens:** The system prompt was not updated as part of Phase 13 (that phase only touched schemas and subtypes).

**How to avoid:** Rename `DOZER` to `BULLDOZER` in `DESCRIPTION_SYSTEM_PROMPT` as part of this phase. This is a locked requirement from CONTEXT.md.

**Warning signs:** Test for `systemContent.toContain('BULLDOZER')` fails; `DOZER` still present.

### Pitfall 3: Identifier Exception Lost When Removing TBC Rule

**What goes wrong:** Removing the TBC rule without adding an explicit "never infer identifiers" rule causes GPT-4o to hallucinate VINs or serial numbers for earthmoving assets.

**Why it happens:** The TBC rule was the implicit gate for "things you can't know" — removing it without replacement guidance removes all caution for identifiers too.

**How to avoid:** When removing TBC rule from PROCESS step 4, add explicit UNIVERSAL RULE bullet: identifiers (VIN, serial, chassis number, rego) must only come from photos/inspection notes, never inferred.

**Warning signs:** Generated descriptions for earthmoving assets contain plausible-looking but fabricated 17-char PINs.

### Pitfall 4: Test Assertions Target Text but normalizeFooter Modifies Before Persist

**What goes wrong:** Existing test `persists description text to assets.description` asserts `updateArg.description === 'Generated description text here.'` — but after adding `normalizeFooter`, the persisted value will be the normalised version, not the raw mock text.

**Why it happens:** The mock `generateText` returns a fixed string that does NOT end with a footer. After normalisation, the persisted text will have the footer appended.

**How to avoid:** Update the existing persist test to use a mock `generateText` return value that ends with the correct footer — then the normalised and raw values will match. OR assert the footer is present in the persisted value rather than exact equality.

**Warning signs:** `persists description text to assets.description with user_id guard` test fails after implementing `normalizeFooter`.

### Pitfall 5: Specialised Truck Templates Missing Key Buyer Details

**What goes wrong:** EWP, Vacuum, Concrete Pump, and Concrete Agitator templates are written too generically (matching RIGID TRUCK format) rather than capturing the body-specific specs buyers care about.

**Why it happens:** Temptation to reuse the existing generic template rather than researching what makes each type distinctive.

**How to avoid:**
- **EWP (Elevated Work Platform truck):** Template must include boom type (knuckle/straight), max working height, basket capacity, outrigger type, certification/SWMS status
- **Vacuum:** Template must include tank capacity (m³ or litres), pump type/CFM, hose length, water tank, waste type (wet/dry)
- **Concrete Pump:** Template must include pump type (line/boom), max vertical reach, max horizontal reach, pipeline diameter, output m³/hr
- **Concrete Agitator (mixer truck):** Template must include drum capacity (m³), drum speed, chute type, water tank

---

## Code Examples

Verified patterns from the existing codebase:

### Footer Normalisation (placement in route handler)

```typescript
// Source: route.ts, after generateText call (~line 320)
const { text } = await generateText({ ... })

// Refusal guard (existing)
const lower = text.toLowerCase()
const isRefusal = lower.startsWith("i'm sorry") || ...
if (isRefusal) { return Response.json({ error: '...' }, { status: 422 }) }

// NEW: Footer normalisation
const normalizedText = normalizeFooter(text, asset.asset_type)

// Persist normalised text
await supabase
  .from('assets')
  .update({ description: normalizedText })   // was: text
  .eq('id', assetId)
  .eq('user_id', user.id)

return Response.json({ success: true, description: normalizedText })  // was: text
```

### System Prompt TBC Rule Before/After

```typescript
// BEFORE (route.ts line 15, current):
// "4. If a spec cannot be confirmed replace it with TBC so the user knows to verify it"

// AFTER:
// "4. If a spec cannot be confirmed from photos, inspection notes, or your knowledge of
//     that specific make/model/year, omit it — never write \"TBC\""
```

### New Template: FLAT DECK / CAB CHASSIS (example)

```
FLAT DECK
Line 1: Year, Make, Model, Drive Type, Flat Deck
Engine: Make, cylinders, fuel type, HP
Transmission, Exhaust Brake
Deck dimensions: L x W in mm
Headboard, toolboxes, tie rails, stoneguard if fitted
Tow hitch/airlines if fitted
Sold As Is, Untested & Unregistered.

CAB CHASSIS
Line 1: Year, Make, Model, Drive Type, Cab Chassis
Engine: Make, cylinders, fuel type, HP
Transmission, key extras
GVM for rated chassis
Sold As Is, Untested & Unregistered.
```

### New Template: EWP (example — specialised)

```
EWP (ELEVATED WORK PLATFORM)
Line 1: Year, Make, Model, Drive Type, EWP
Engine: Make, cylinders, fuel type, HP
Transmission
Boom type (knuckle boom / straight boom), max working height, basket capacity
Outriggers
Certification status
Sold As Is, Untested & Unregistered.
```

### New Template: COMPACTOR (earthmoving, example)

```
COMPACTOR
Year, Make, Model, Type (Roller / Padfoot / Plate)
Operating Weight
Hours
Engine: Make, cylinders, fuel type, HP
Drum width
Vibration frequency if known
Enclosed Cab / ROPS Canopy
Sold As Is, Untested & Unregistered.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TBC for unknown specs | Estimate from model knowledge, omit identifiers | Phase 14 | Cleaner descriptions, no manual fill-in required |
| DOZER heading | BULLDOZER heading (matching schema key) | Phase 14 | Correct template selection for bulldozer assets |
| Footer by AI instruction only | AI instruction + programmatic guard | Phase 14 | Footer reliability: 100% regardless of AI variation |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/__tests__/describe-route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESC-01 | `normalizeFooter` appends correct footer for each asset type | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 — new tests needed |
| DESC-01 | `normalizeFooter` strips wrong-variant footer before appending | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-01 | `normalizeFooter` handles AI output with no footer at all | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-01 | `normalizeFooter` uses `"Sold As Is, Untested."` for `general_goods` | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-01 | System prompt no longer contains the word "TBC" as instruction | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-01 | Persisted description text is the normalised value (with footer) | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ⚠️ Existing test needs update |
| TRUCK-02 | System prompt contains FLAT DECK section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains CAB CHASSIS section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains BEAVERTAIL section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains TILT TRAY section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains VACUUM section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains CONCRETE PUMP section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains CONCRETE AGITATOR section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains EWP section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| TRUCK-02 | System prompt contains REFRIGERATED PANTECH section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-02 | System prompt contains BULLDOZER (not DOZER) section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-02 | System prompt contains COMPACTOR section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-02 | System prompt contains DUMP TRUCK section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-02 | System prompt contains TRENCHER section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |
| DESC-02 | System prompt contains CRAWLER TRACTOR section heading | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/describe-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New `describe-route.test.ts` test blocks for `normalizeFooter` behaviour (DESC-01 tests listed above)
- [ ] New `describe-route.test.ts` test blocks for all 13 new template section headings (TRUCK-02, DESC-02)
- [ ] Update existing `persists description text to assets.description with user_id guard` test to expect normalised text with footer

*(No new test files needed — all new tests join existing `src/__tests__/describe-route.test.ts`)*

---

## Open Questions

1. **Footer on SERVICE TRUCK subtype**
   - What we know: The `service` subtype key exists in `truck.ts`; there is already a SERVICE TRUCK template in `DESCRIPTION_SYSTEM_PROMPT`; footer enforcement is programmatic
   - What's unclear: No CONTEXT.md decision specifically mentions the `service` subtype — it was present before Phase 14 scope
   - Recommendation: No action needed. Existing SERVICE TRUCK template has its footer; `normalizeFooter` will enforce it programmatically regardless.

2. **CRAWLER TRACTOR vs DOZER overlap**
   - What we know: Both are track-driven earthmoving machines. DOZER (renamed BULLDOZER) template already exists. Crawler Tractor is a new template.
   - What's unclear: The distinction — a Crawler Tractor is a general-purpose tractor on tracks (e.g. Caterpillar D3/D4 used for agriculture/civil), while a Bulldozer has a blade specifically for pushing material
   - Recommendation: CRAWLER TRACTOR template should omit the blade-specific fields (blade width/type, ripper) and emphasise drawbar pull, PTO where fitted, implement compatibility. Keep it distinct from BULLDOZER.

---

## Sources

### Primary (HIGH confidence)
- `src/app/api/describe/route.ts` — full `DESCRIPTION_SYSTEM_PROMPT` inspected; insertion point confirmed (~line 320); existing templates catalogued
- `src/lib/schema-registry/schemas/truck.ts` — 15 subtypes confirmed; template coverage gap: Flat Deck, Cab Chassis, Beavertail, Tilt Tray, Vacuum, Concrete Pump, Concrete Agitator, EWP, Refrigerated Pantech
- `src/lib/schema-registry/schemas/earthmoving.ts` — 12 subtypes confirmed; `bulldozer` key confirmed; template coverage gap: Compactor, Dump Truck, Trencher, Crawler Tractor
- `src/__tests__/describe-route.test.ts` — existing test structure and mock patterns inspected; persist test identified as needing update
- `.planning/phases/14-description-quality/14-CONTEXT.md` — all implementation decisions read verbatim

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — TRUCK-02, DESC-01, DESC-02 acceptance criteria
- `.planning/STATE.md` — earthmoving dozer→bulldozer rename confirmed from Phase 13 decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing Vercel AI SDK and Vitest usage confirmed
- Architecture: HIGH — all insertion points verified in actual source code; existing test patterns confirmed
- Template content: MEDIUM — template field ordering for specialised trucks (EWP, Vacuum, Concrete Pump, Concrete Agitator) based on domain knowledge; exact wording is Claude's discretion per CONTEXT.md
- Pitfalls: HIGH — all identified from direct code inspection (persist test impact, DOZER heading, identifier exception)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable codebase; no external dependencies changing)
