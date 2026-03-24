# Phase 19: Prompt-Schema Alignment - Research

**Researched:** 2026-03-24
**Domain:** DESCRIPTION_SYSTEM_PROMPT string editing, Vitest test assertions, planning doc frontmatter
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **`washing` key/heading alignment:** Change the prompt heading, not the schema key. Rename `WASHING PLANT` → `WASHING` in `DESCRIPTION_SYSTEM_PROMPT`. No schema migration required.
- **Marine `private` and `recreational` sections:** Add both `PRIVATE` and `RECREATIONAL` as dedicated sections using the MARINE (RECREATIONAL BOAT) structure. The existing `MARINE (RECREATIONAL BOAT)` section remains as the general fallback. Template content mirrors MARINE (RECREATIONAL BOAT) — no new fields invented.
- **EWP routing test:** Add/update a test that passes `('forklift', 'ewp')` and asserts the response contains `EWP (FORKLIFT-MOUNTED)`. This is confirming coverage for Phase 18's key correction.
- **Nyquist VALIDATION.md sign-off:** Retroactive verification then mark compliant. Executor checks full test suite is green, then updates all task rows in 16-VALIDATION.md to `✅ green`, updates all task rows in 17-VALIDATION.md to `✅ green`, sets `nyquist_compliant: true` and `wave_0_complete: true` in both frontmatter blocks, sets `status: approved` in both frontmatter blocks.
- **`16-02-SUMMARY.md` frontmatter fix:** Add `requirements_completed: [SUBTYPE-04, SUBTYPE-05, SUBTYPE-06, SUBTYPE-08]` to the frontmatter of `16-02-SUMMARY.md`. This field is missing; the decisions list already correctly documents the work done.
- **No new asset types, no schema key renames, no new features.**

### Claude's Discretion

- Exact wording of the `PRIVATE` and `RECREATIONAL` template body (match existing MARINE (RECREATIONAL BOAT) structure)
- Whether to keep or consolidate `MARINE (RECREATIONAL BOAT)` as fallback vs point to `RECREATIONAL`

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESCR-04 | AI description system prompt covers all new Earthmoving subtypes including Washing | Requires renaming `WASHING PLANT` heading to `WASHING` in DESCRIPTION_SYSTEM_PROMPT (line 584); test assertion at line 1035 must change to `toContain('WASHING')` |
| DESCR-06 | AI description system prompt covers all Forklift subtypes | EWP routing test confirms `('forklift', 'ewp')` routes to `EWP (FORKLIFT-MOUNTED)` — test already exists at line 1138 but was added in Phase 17; Phase 19 adds the confirming negative: it must NOT route to the truck `EWP (ELEVATED WORK PLATFORM)` |
| DESCR-08 | AI description system prompt covers all 10 new Marine subtypes | Requires adding explicit `PRIVATE` and `RECREATIONAL` prompt sections; current test at line 1178 passes `('marine', 'private')` but only asserts `MARINE (RECREATIONAL BOAT)` — post-phase it should assert `PRIVATE` |
</phase_requirements>

---

## Summary

Phase 19 is a precision alignment phase — no new features, no schema changes. All work is in three files: `DESCRIPTION_SYSTEM_PROMPT` in `src/app/api/describe/route.ts`, test assertions in `src/__tests__/describe-route.test.ts`, and frontmatter fields in three planning documents.

The prompt currently has a heading/key mismatch: the schema key is `washing` but the prompt heading is `WASHING PLANT`. GPT-4o matches subtype keys to headings by exact name (established in Phase 18-01), so this mismatch means `washing` subtypes get no dedicated section match and fall through to inference. The fix is a single string change in the prompt. The test at line 1035 asserting `WASHING PLANT` must change to assert `WASHING`.

The marine schema has `private` and `recreational` keys (confirmed at lines 13–14 of marine.ts) but the prompt has no sections for either. The current test for `('marine', 'private')` at line 1178 asserts `MARINE (RECREATIONAL BOAT)` — which passes because that section exists. Post-phase, the test must be updated to assert the explicit `PRIVATE` heading. Two new prompt sections must be added (both modelled on MARINE (RECREATIONAL BOAT)).

A confirming EWP test is needed: Phase 18 corrected the forklift `ewp` key routing. A test already exists at line 1138 asserting `EWP (FORKLIFT-MOUNTED)` for `('forklift', 'ewp')`. The confirming addition is a negative assertion: the same subtype must NOT contain `EWP (ELEVATED WORK PLATFORM)` (the truck section heading). This distinguishes the forklift-mounted section from the truck EWP section.

The two VALIDATION.md files (phases 16 and 17) have `nyquist_compliant: false` and all task rows as `⬜ pending` because they were never updated during execution. These are documentation-only fixes with no code impact.

**Primary recommendation:** Execute as four discrete tasks — (1) prompt edits + test updates for WASHING/marine/EWP, (2) Phase 16 VALIDATION.md sign-off, (3) Phase 17 VALIDATION.md sign-off, (4) 16-02-SUMMARY.md frontmatter fix.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^4.1.0 | Test runner for all describe-route assertions | Already in use; config at `vitest.config.ts` |

No new libraries required. All changes are string editing within existing files.

**Test run commands (unchanged from Phase 17/18):**
```bash
# Quick (after each task commit)
npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts

# Full suite (before verify-work)
npm run test
```

---

## Architecture Patterns

### Pattern 1: Prompt Heading Alignment

**What:** Every schema subtype key must have a matching ALL_CAPS heading in `DESCRIPTION_SYSTEM_PROMPT`. GPT-4o selects the template by matching the subtype key string against the nearest heading.

**Rule:** The heading string must equal the key uppercased (with spaces replacing underscores) OR be a conventionalised form that GPT-4o can unambiguously resolve. Phase 18-01 established that exact match is required — no inference fallback should be relied upon.

**Current mismatches to fix:**
- `washing` → heading is `WASHING PLANT` (should be `WASHING`)
- `private` → no heading exists (must add `PRIVATE`)
- `recreational` → no heading exists (must add `RECREATIONAL`)

### Pattern 2: Template Section Format

**What:** Every prompt section follows a consistent format:

```
HEADING
Line 1 content
Line 2 content
...
Sold As Is, Untested & Unregistered.
```

**Separator:** Blank line before the next section heading.

**New PRIVATE / RECREATIONAL sections** must follow the MARINE (RECREATIONAL BOAT) template exactly:

```
PRIVATE
Year, Make, Model, Vessel Type
LOA: XXft | Beam: XXft | Draft: XXft
Hull Material
Engine/s: Make, cylinders, fuel type, HP (or Twin X HP Outboards)
Engine Hours
Nav/electronics
Berths/cabin layout
Galley, heads, water/fuel capacity
Extras: solar, generator, winch, thruster, trailer
Sold As Is, Untested & Unregistered.

RECREATIONAL
Year, Make, Model, Vessel Type
LOA: XXft | Beam: XXft | Draft: XXft
Hull Material
Engine/s: Make, cylinders, fuel type, HP (or Twin X HP Outboards)
Engine Hours
Nav/electronics
Berths/cabin layout
Galley, heads, water/fuel capacity
Extras: solar, generator, winch, thruster, trailer
Sold As Is, Untested & Unregistered.
```

### Pattern 3: Test Assertion Pattern

**What:** All Phase 17/18/19 tests use the `getSystemContentP17` helper.

```typescript
// Source: src/__tests__/describe-route.test.ts (line ~750+)
const s = await getSystemContentP17('asset_type', 'schema_key')
expect(s).toContain('HEADING')
```

**For EWP confirming test:** Use both positive and negative assertions:
```typescript
it('EWP forklift key routes to forklift-mounted section not truck EWP', async () => {
  const s = await getSystemContentP17('forklift', 'ewp')
  expect(s).toContain('EWP (FORKLIFT-MOUNTED)')
  expect(s).not.toContain('EWP (ELEVATED WORK PLATFORM)')
})
```

Note: The test at line 1138 already asserts `toContain('EWP (FORKLIFT-MOUNTED)')`. The additional negative assertion is the new confirming piece per the CONTEXT.md decision. Whether to add a new `it()` or extend the existing one is executor's call — extending existing is simpler.

### Pattern 4: VALIDATION.md Frontmatter Sign-Off

**What:** Both VALIDATION.md files use the same YAML frontmatter structure. The sign-off requires:
1. Change `status: draft` → `status: approved`
2. Change `nyquist_compliant: false` → `nyquist_compliant: true`
3. Change `wave_0_complete: false` → `wave_0_complete: true`
4. Update all `⬜ pending` task rows to `✅ green`

**Phase 16 VALIDATION.md** (`16-VALIDATION.md`): 8 task rows, all showing `⬜ pending`.
**Phase 17 VALIDATION.md** (`17-VALIDATION.md`): 16 task rows (W0 rows + implementation rows), all showing `⬜ pending`.

### Anti-Patterns to Avoid

- **Renaming the `washing` schema key:** Decision is locked — change the heading only.
- **Adding new fields to PRIVATE/RECREATIONAL:** Mirror MARINE (RECREATIONAL BOAT) exactly; no new fields.
- **Using `getSystemContent` (old helper) instead of `getSystemContentP17`:** Phase 17+ tests all use the P17 variant.
- **Editing `normalizeFooter()`:** Leave untouched per CONTEXT.md.
- **Adding a separate `describe` block for Phase 19 tests:** Extend existing Phase 17 DESCR-04, DESCR-06, and DESCR-08 describe blocks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test infrastructure | New test setup or mocking | Existing `getSystemContentP17` helper and mocks | Already established and working |
| Section template | Custom marine template format | Mirror MARINE (RECREATIONAL BOAT) verbatim | Consistency for GPT-4o template matching |

---

## Common Pitfalls

### Pitfall 1: Partial WASHING Heading Change

**What goes wrong:** Prompt heading changed to `WASHING` but test still asserts `WASHING PLANT` (or vice versa).
**Why it happens:** Two files must change in sync — the prompt and the test.
**How to avoid:** Change both in the same task commit. Test at line 1033 asserts `toContain('WASHING PLANT')` — must change to `toContain('WASHING')`.
**Warning signs:** Test suite green but prompt still shows `WASHING PLANT`; or prompt updated but test fails with "expected string to contain 'WASHING' but got..."

### Pitfall 2: marine `private` test updated before prompt section added

**What goes wrong:** Test for `('marine', 'private')` updated to assert `PRIVATE` before the `PRIVATE` section is added to the prompt — causes immediate RED.
**Why it happens:** TDD ordering confusion.
**How to avoid:** Add prompt sections first, then update tests. Both in same commit is fine.

### Pitfall 3: 17-VALIDATION.md Wave 0 rows marked green but they were scaffold-only

**What goes wrong:** Marking W0 rows `✅ green` when those rows represent TDD scaffold (RED tests).
**Why it happens:** Misreading the VALIDATION.md sign-off requirement.
**How to avoid:** The sign-off is retroactive — executor verifies `npm run test` is fully green (Phase 17 tests are now green post-Phase 18), then marks all rows green. The W0 rows represent the test file creation step, which is complete.

### Pitfall 4: 16-02-SUMMARY.md requirements_completed field placement

**What goes wrong:** Field added inside `decisions:` list or elsewhere in YAML body instead of as a top-level frontmatter field.
**How to avoid:** Add as a sibling to existing frontmatter fields (tags, decisions, metrics, etc.) at the top YAML block between `---` delimiters.

---

## Code Examples

### WASHING heading change (route.ts line 584)

```
# Before:
WASHING PLANT
Year, Make, Model, Washing Plant Type (Sand / Aggregate / Logwasher)

# After:
WASHING
Year, Make, Model, Washing Plant Type (Sand / Aggregate / Logwasher)
```

Only the first line (heading) changes. All body lines remain identical.

### WASHING test change (describe-route.test.ts line 1033-1036)

```typescript
// Before:
it('contains WASHING PLANT section heading', async () => {
  const s = await getSystemContentP17('earthmoving', 'washing')
  expect(s).toContain('WASHING PLANT')
})

// After:
it('contains WASHING section heading', async () => {
  const s = await getSystemContentP17('earthmoving', 'washing')
  expect(s).toContain('WASHING')
})
```

### marine `private` test update (describe-route.test.ts line 1178-1181)

```typescript
// Before:
it('contains MARINE (RECREATIONAL BOAT) section heading', async () => {
  const s = await getSystemContentP17('marine', 'private')
  expect(s).toContain('MARINE (RECREATIONAL BOAT)')
})

// After:
it('contains PRIVATE section heading', async () => {
  const s = await getSystemContentP17('marine', 'private')
  expect(s).toContain('PRIVATE')
})
```

Additionally, add a new test for `recreational`:
```typescript
it('contains RECREATIONAL section heading', async () => {
  const s = await getSystemContentP17('marine', 'recreational')
  expect(s).toContain('RECREATIONAL')
})
```

### EWP forklift confirming test extension (describe-route.test.ts line 1138-1141)

```typescript
// Extend existing test OR add negative assertion:
it('contains EWP (FORKLIFT-MOUNTED) section heading', async () => {
  const s = await getSystemContentP17('forklift', 'ewp')
  expect(s).toContain('EWP (FORKLIFT-MOUNTED)')
  expect(s).not.toContain('EWP (ELEVATED WORK PLATFORM)')
})
```

### 16-02-SUMMARY.md frontmatter addition

```yaml
---
phase: 16-subtype-schema-alignment
plan: 02
...
requirements_completed: [SUBTYPE-04, SUBTYPE-05, SUBTYPE-06, SUBTYPE-08]
...
---
```

### VALIDATION.md frontmatter sign-off pattern

```yaml
# Before (both files):
status: draft
nyquist_compliant: false
wave_0_complete: false

# After (both files):
status: approved
nyquist_compliant: true
wave_0_complete: true
```

---

## Exact File Locations and Line Numbers

| Change | File | Lines |
|--------|------|-------|
| `WASHING PLANT` → `WASHING` heading | `src/app/api/describe/route.ts` | 584 |
| Add `PRIVATE` section | `src/app/api/describe/route.ts` | After line 810 (after MARINE (RECREATIONAL BOAT) section) |
| Add `RECREATIONAL` section | `src/app/api/describe/route.ts` | After PRIVATE section |
| Update WASHING test assertion | `src/__tests__/describe-route.test.ts` | 1033–1036 |
| Update marine `private` test | `src/__tests__/describe-route.test.ts` | 1178–1181 |
| Add marine `recreational` test | `src/__tests__/describe-route.test.ts` | After line 1181 |
| Extend EWP forklift test (negative) | `src/__tests__/describe-route.test.ts` | 1138–1141 |
| Frontmatter + task rows sign-off | `.planning/phases/16-subtype-schema-alignment/16-VALIDATION.md` | Lines 5–7, 41–48 |
| Frontmatter + task rows sign-off | `.planning/phases/17-description-template-coverage/17-VALIDATION.md` | Lines 5–7, 41–56 |
| Add `requirements_completed` field | `.planning/phases/16-subtype-schema-alignment/16-02-SUMMARY.md` | Frontmatter block (before line 32) |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESCR-04 | `washing` schema key routes to `WASHING` prompt heading | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (update existing test at line 1033) |
| DESCR-06 | `('forklift', 'ewp')` routes to `EWP (FORKLIFT-MOUNTED)`, not truck EWP | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (extend existing test at line 1138) |
| DESCR-08 | `private` and `recreational` marine keys each have explicit heading | unit | `npm run test -- src/__tests__/describe-route.test.ts` | ✅ (update test at 1178; add test for recreational) |

### Sampling Rate

- **Per task commit:** `npm run test -- --reporter=verbose src/__tests__/describe-route.test.ts`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. All changes are updates to existing tests or additions within existing describe blocks in `src/__tests__/describe-route.test.ts`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inference fallback for unmatched keys | Exact heading match required | Phase 18-01 | Phase 19 must provide explicit headings for `private`, `recreational`, and fix `washing` |
| `MARINE (RECREATIONAL BOAT)` used for private/recreational | `PRIVATE` and `RECREATIONAL` get own headings | Phase 19 | GPT-4o no longer needs to infer; test passes with explicit assertion |

---

## Open Questions

None — all decisions are locked in CONTEXT.md and the codebase is fully examined.

---

## Sources

### Primary (HIGH confidence)

- `src/app/api/describe/route.ts` — DESCRIPTION_SYSTEM_PROMPT examined directly; confirmed `WASHING PLANT` at line 584, `EWP (ELEVATED WORK PLATFORM)` at line 158, `EWP (FORKLIFT-MOUNTED)` at line 734, `MARINE (RECREATIONAL BOAT)` at line 800; no `PRIVATE` or `RECREATIONAL` sections
- `src/lib/schema-registry/schemas/marine.ts` — confirmed `private` key at line 13, `recreational` key at line 14
- `src/lib/schema-registry/schemas/earthmoving.ts` — confirmed `washing` key at line 24, label `'Washing'`
- `src/__tests__/describe-route.test.ts` — confirmed `WASHING PLANT` assertion at line 1035, `private` test at line 1178–1181, EWP forklift test at line 1138–1141
- `.planning/phases/16-subtype-schema-alignment/16-VALIDATION.md` — confirmed `nyquist_compliant: false`, all 8 rows `⬜ pending`
- `.planning/phases/17-description-template-coverage/17-VALIDATION.md` — confirmed `nyquist_compliant: false`, all 16 rows `⬜ pending`
- `.planning/phases/16-subtype-schema-alignment/16-02-SUMMARY.md` — confirmed `requirements_completed` field is absent from frontmatter

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; Vitest already in use
- Architecture: HIGH — all patterns are established and verified in codebase
- Pitfalls: HIGH — derived directly from reading actual file contents and line numbers

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain — prompt string and test file won't change without a new phase)
