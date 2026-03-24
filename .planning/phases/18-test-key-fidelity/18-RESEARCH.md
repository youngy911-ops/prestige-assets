# Phase 18: Test Key Fidelity - Research

**Researched:** 2026-03-24
**Domain:** TypeScript/Vitest test correction — phantom subtype key elimination
**Confidence:** HIGH

## Summary

Phase 18 is a surgical test-correction phase with no production code changes. Five tests in `src/__tests__/describe-route.test.ts` pass a phantom subtype key (one that does not exist in the schema) to `getSystemContentP17()`. Because the helper returns the full `DESCRIPTION_SYSTEM_PROMPT` string regardless of the subtype argument, every `toContain()` assertion succeeds as long as the heading string exists anywhere in the prompt. The tests are structurally green but semantically broken — they provide false CI confidence that real schema keys route correctly.

The fix is mechanical: replace the five phantom subtype strings with the real schema keys confirmed in the schema files. No helper function changes, no production file changes, no new describe blocks. After the fix the tests continue to pass (the heading content exists in the prompt), but now they exercise the same key a real user interaction would provide.

Additionally, there is a mismatch between what the marine DESCR-08 block covers and what the schema actually exposes. Three marine subtype keys in the tests are phantoms (`boat`, `commercial_vessel`, `tug_workboat`). The real schema keys are `private`, `commercial`, and `tug`. Two further marine real keys (`private` and `recreational`) have no dedicated test at all. Phase 18 closes the test-key mismatch; Phase 19 addresses the related prompt-coverage gap for `private`/`recreational`.

**Primary recommendation:** Edit `describe-route.test.ts` to replace 5 phantom keys with real schema keys. Full suite must remain green (105 tests) after the change.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESCR-04 (test quality) | Earthmoving prompt covers `washing` subtype | Test at line 1034 currently uses phantom key `washing_plant`; real schema key is `washing` |
| DESCR-06 (test quality) | Forklift prompt covers `stock_picker` and `ewp` subtypes | Tests at lines 1134/1139 use phantom keys `order_picker`/`ewp_forklift`; real keys are `stock_picker`/`ewp` |
| DESCR-08 (test quality) | Marine prompt covers `private`, `commercial`, and `tug` subtypes | Tests at lines 1179/1194/1204 use phantom keys `boat`/`commercial_vessel`/`tug_workboat`; real keys are `private`/`commercial`/`tug` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | v4.1.0 (in use) | Test runner | Project-established; all existing tests use it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | — | No new libraries required | Phase is pure test string correction |

**Installation:** None required.

## Architecture Patterns

### How getSystemContentP17 Works

The helper at line 806 of `describe-route.test.ts`:
1. Sets up mocks for auth, DB (two `mockFrom` calls), and AI
2. Calls `POST(makeRequest({ assetId: 'asset-1' }))` with `asset_subtype` set to the provided string
3. Reads `mockGenerateText.mock.calls[0][0].messages[0].content` — the system message text sent to GPT-4o
4. Returns this string to the test

The system message is `DESCRIPTION_SYSTEM_PROMPT` — a static string constant. It does NOT change based on the subtype. The subtype string only appears in the user message (via `buildDescriptionUserPrompt`), not in the system message. Therefore, **all `toContain()` calls on the returned string check the full prompt regardless of what subtype was passed**.

This means:
- Phantom keys pass tests today (heading is found in prompt, subtype value is irrelevant)
- Real keys will also pass tests (same result)
- The fix is safe and will not break any tests

### The Five Phantom Keys

| Location | Current (phantom) key | Real schema key | Schema file |
|----------|----------------------|-----------------|-------------|
| Line 1034 | `washing_plant` | `washing` | `earthmoving.ts` (line 24) |
| Line 1134 | `order_picker` | `stock_picker` | `forklift.ts` (line 13) |
| Line 1139 | `ewp_forklift` | `ewp` | `forklift.ts` (line 10) |
| Line 1179 | `boat` | `private` | `marine.ts` (line 13) |
| Line 1194 | `commercial_vessel` | `commercial` | `marine.ts` (line 8) |
| Line 1204 | `tug_workboat` | `tug` | `marine.ts` (line 16) |

Note: The ROADMAP lists only 5 corrections (treating the marine group as 3 separate fixes). The total edit count is 6 lines (5 locations, but line 1179 marine `boat` → `private` is one of them — the ROADMAP description says "lines ~1179/1193/1204" which maps to exactly three marine phantom keys).

### Marine Test Coverage Gap (context for Phase 19)

After fixing the three marine phantom keys the DESCR-08 describe block will have:
- `private` (fixed from `boat`)
- `commercial` (fixed from `commercial_vessel`)
- `tug` (fixed from `tug_workboat`)
- `trailer_boat` (already correct)
- `barge` (already correct)
- `fishing_vessel` (already correct)
- `other` (already correct)
- `coupe` (already correct)

Still missing from tests: `recreational` and `personal_watercraft`. Phase 18 does NOT add these — Phase 19 handles `private`/`recreational` prompt gaps. The planner should note this boundary explicitly.

### Pattern: Safe Test-Only Edit

```typescript
// BEFORE (phantom key — line 1034)
it('contains WASHING PLANT section heading', async () => {
  const s = await getSystemContentP17('earthmoving', 'washing_plant')
  expect(s).toContain('WASHING PLANT')
})

// AFTER (real schema key)
it('contains WASHING PLANT section heading', async () => {
  const s = await getSystemContentP17('earthmoving', 'washing')
  expect(s).toContain('WASHING PLANT')
})
```

Only the subtype string argument changes. The `toContain` assertion stays the same because the heading exists in the prompt.

### Anti-Patterns to Avoid
- **Changing the heading assertion string:** The `toContain` target should not change — only the subtype key argument. The heading in the prompt (e.g. `'WASHING PLANT'`) is what the prompt has; fixing the test key does not require changing what we check for.
- **Adding new describe blocks in Phase 18:** Phase 18 is correction only. New coverage (e.g. `private`/`recreational` marine tests) belongs to Phase 19.
- **Touching production files:** No changes to `route.ts`, schema files, or any non-test file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema key validation | Custom key-checking script | Direct read of schema `.ts` files | Keys are already verified by reading `earthmoving.ts`, `forklift.ts`, `marine.ts` — no tooling needed |

## Common Pitfalls

### Pitfall 1: Changing the Assertion Heading Instead of the Key
**What goes wrong:** Editor changes `'WASHING PLANT'` to `'WASHING'` thinking it needs to match the key name — but the prompt section heading is `WASHING PLANT` and must be asserted as-is.
**Why it happens:** Confusion between schema key (`washing`) and prompt heading (`WASHING PLANT`).
**How to avoid:** Only change the second argument to `getSystemContentP17()`. Never change the `toContain()` string.
**Warning signs:** Test starts failing after edit — this indicates the heading assertion was changed incorrectly.

### Pitfall 2: Changing `private` Marine Test Assertion to `PRIVATE`
**What goes wrong:** There is no `PRIVATE` heading in the current system prompt (Phase 19 adds it). The test heading assertion `'MARINE (RECREATIONAL BOAT)'` is what currently exists and will continue to be the correct assertion for the `private` subtype in Phase 18. Phase 19 will address whether `private` needs its own dedicated section.
**Why it happens:** Assuming fixing the key means the heading assertion also needs to reflect the new key.
**How to avoid:** Leave assertion targets unchanged. The current passing tests confirm the headings exist.
**Warning signs:** Test begins failing — the heading being asserted doesn't exist in the current prompt.

### Pitfall 3: Over-scoping to Add Missing Marine Tests
**What goes wrong:** Noticing `recreational` and `personal_watercraft` have no tests and adding them in Phase 18.
**Why it happens:** Scope creep while fixing the file.
**How to avoid:** Phase 18 = correct existing phantom keys only. Phase 19 adds `private`/`recreational` sections in the prompt; new tests for those go in Phase 19.

## Code Examples

### Target File
`src/__tests__/describe-route.test.ts`

### All Six Line Edits

```typescript
// Line 1034: earthmoving washing
// FROM: const s = await getSystemContentP17('earthmoving', 'washing_plant')
// TO:
const s = await getSystemContentP17('earthmoving', 'washing')

// Line 1134: forklift stock_picker
// FROM: const s = await getSystemContentP17('forklift', 'order_picker')
// TO:
const s = await getSystemContentP17('forklift', 'stock_picker')

// Line 1139: forklift ewp
// FROM: const s = await getSystemContentP17('forklift', 'ewp_forklift')
// TO:
const s = await getSystemContentP17('forklift', 'ewp')

// Line 1179: marine private (replaces phantom 'boat')
// FROM: const s = await getSystemContentP17('marine', 'boat')
// TO:
const s = await getSystemContentP17('marine', 'private')

// Line 1194: marine commercial (replaces phantom 'commercial_vessel')
// FROM: const s = await getSystemContentP17('marine', 'commercial_vessel')
// TO:
const s = await getSystemContentP17('marine', 'commercial')

// Line 1204: marine tug (replaces phantom 'tug_workboat')
// FROM: const s = await getSystemContentP17('marine', 'tug_workboat')
// TO:
const s = await getSystemContentP17('marine', 'tug')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-subtype route branching | Full system prompt, subtype in user message | Phase 14+ | Tests check heading presence in full prompt, not subtype-conditional content |

## Open Questions

1. **Should `'MARINE (RECREATIONAL BOAT)'` remain the assertion for the `private` key test?**
   - What we know: The prompt heading is `MARINE (RECREATIONAL BOAT)` and Phase 18 does not add a `PRIVATE` section
   - What's unclear: Whether Phase 19 plans to rename this heading or add a separate `PRIVATE` section alongside it
   - Recommendation: Keep current assertion in Phase 18. Phase 19 resolves the prompt-schema alignment.

2. **Should the `it()` description text be updated to reflect the new key?**
   - What we know: The test description at line 1133 reads `'contains STOCK PICKER / ORDER PICKER section heading'` — the heading name already includes both terms so it remains accurate
   - What's unclear: Whether descriptions should be audited for accuracy
   - Recommendation: Update the `it()` description text where it references the phantom key name explicitly, to avoid future confusion. For example, `'contains WASHING PLANT section heading (earthmoving washing subtype)'`. This is low-priority cosmetic.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v4.1.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/__tests__/describe-route.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESCR-04 (test quality) | Line 1034 uses `washing` not `washing_plant` | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (needs edit) |
| DESCR-06 (test quality) | Lines 1134/1139 use `stock_picker`/`ewp` | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (needs edit) |
| DESCR-08 (test quality) | Lines 1179/1194/1204 use `private`/`commercial`/`tug` | unit | `npx vitest run src/__tests__/describe-route.test.ts` | ✅ (needs edit) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/describe-route.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green (currently 105 tests passing) before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The test file already exists; this phase edits it, not scaffolds it.

## Sources

### Primary (HIGH confidence)
- Direct file read: `src/__tests__/describe-route.test.ts` lines 1033–1205 — phantom key locations confirmed
- Direct file read: `src/lib/schema-registry/schemas/earthmoving.ts` line 24 — `washing` key confirmed
- Direct file read: `src/lib/schema-registry/schemas/forklift.ts` lines 10, 13 — `ewp`, `stock_picker` keys confirmed
- Direct file read: `src/lib/schema-registry/schemas/marine.ts` lines 8, 13, 16 — `commercial`, `private`, `tug` keys confirmed
- Live test run: `npx vitest run src/__tests__/describe-route.test.ts` — 105 tests passing before any changes

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` Phase 18 success criteria — exact line numbers and key mappings listed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vitest already in use, no new libraries
- Architecture: HIGH — direct source inspection of test file, schema files, and route
- Pitfalls: HIGH — derived from concrete code analysis, not inference

**Research date:** 2026-03-24
**Valid until:** Stable — this is a pure test-string correction with no library dependency
